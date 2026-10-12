// Local server for `npm start` and the tests: serves public/ and the same /api handler
// the Worker uses. With MOCK_OPENAI=1 it also exposes the mock model as an
// OpenAI-compatible endpoint at /mock/v1/chat/completions, so the real HTTP client can be
// exercised end to end by pointing NEBIUS_BASE_URL at it.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApp, MAX_BODY_BYTES } from './api.js';
import { createMockClient } from './model/mock.js';

const PUBLIC_DIR = resolve(fileURLToPath(new URL('../public', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

// Same headers as public/_headers, which the Worker's static assets use.
export const STATIC_HEADERS = {
  'content-security-policy':
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function sendResponse(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function serveStatic(req, res, publicDir) {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const rel = normalize(path === '/' ? '/index.html' : path);
  const file = resolve(join(publicDir, rel));
  const name = rel.split(/[\\/]/).pop() ?? '';
  if (!file.startsWith(publicDir + sep) || name.startsWith('_') || name.startsWith('.')) {
    res.writeHead(404, STATIC_HEADERS).end('Not found');
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    const body = await readFile(file);
    res.writeHead(200, {
      ...STATIC_HEADERS,
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, STATIC_HEADERS).end('Not found');
  }
}

export function createServer({ env = process.env, publicDir = PUBLIC_DIR, deps = {} } = {}) {
  const app = createApp(env, deps);
  const mock = env.MOCK_OPENAI === '1' ? createMockClient() : null;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? '127.0.0.1'}`);

      if (mock && url.pathname === '/mock/v1/chat/completions' && req.method === 'POST') {
        if (!/^Bearer \S+/.test(req.headers.authorization ?? '')) {
          res.writeHead(401, { 'content-type': 'application/json' }).end('{"error":"no key"}');
          return;
        }
        const body = await readBody(req);
        const params = JSON.parse(String(body ?? '{}'));
        const out = await mock.createChatCompletion(params);
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(out));
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        const hasBody = !['GET', 'HEAD'].includes(req.method);
        const body = hasBody ? await readBody(req) : undefined;
        if (body === null) {
          res.writeHead(413, { 'content-type': 'application/json' }).end('{"error":"too_large","message":"Request is too large."}');
          return;
        }
        const request = new Request(url, { method: req.method, headers: req.headers, body });
        await sendResponse(res, await app.handle(request, { ip: req.socket.remoteAddress ?? 'unknown' }));
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { allow: 'GET, HEAD' }).end();
        return;
      }
      await serveStatic(req, res, publicDir);
    } catch {
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('Server error');
    }
  });
  return { server, app };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.PORT) || 8787;
  const host = process.env.HOST || '127.0.0.1';
  const { server, app } = createServer();
  server.listen(port, host, () => {
    const mode = app.client.mode === 'mock' ? 'mock model (NEBIUS_API_KEY not set)' : `${app.client.model} at ${app.client.baseURL}`;
    console.log(`NPC Cross-Exam on http://${host}:${port} using ${mode}`);
  });
}
