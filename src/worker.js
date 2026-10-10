// Cloudflare Worker entry. Static files come from the assets binding (public/); only
// /api/* runs code. NEBIUS_API_KEY is a Worker secret: npx wrangler secret put NEBIUS_API_KEY

import { createApp } from './api.js';

let app;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      app ??= createApp(env);
      return app.handle(request, { ip: request.headers.get('cf-connecting-ip') ?? 'unknown' });
    }
    return env.ASSETS.fetch(request);
  },
};
