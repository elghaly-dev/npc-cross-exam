# NPC Cross-Exam

A detective game for your phone. Three suspects are played by **NVIDIA Nemotron** on
**Nebius Token Factory**. You question them, show them evidence, and catch them out.
Code, not the model, decides when two stories contradict each other.

> Built for the Nebius × NVIDIA Global AI Hackathon (track: Best Apps and Agents).
> Status: in progress. The playable build runs on a built-in mock model until the
> Token Factory key is set. See [docs/PLAN.md](docs/PLAN.md).

## How to play

1. Read the case. Someone took the 1852 brass compass from the Harbor Museum between
   21:00 and 22:00 on a stormy night. The display case was opened with a key.
2. Pick a suspect and ask a question, or tap a suggested one. You have 24 questions.
3. Every answer is checked against what that suspect said before, what the other
   suspects said, and the evidence you have found. A contradiction appears under the
   answer, with the two statements side by side.
4. Show evidence to the right person and they change their story.
5. When you are ready, accuse one suspect. You score points for each contradiction you
   found, each suspect you broke, and the contradictions that back up your accusation.
   Each question costs a point.

## How Nemotron and Token Factory are used

| Piece | What it does |
| --- | --- |
| **Nemotron as the suspects** | One chat completion per question. The system prompt holds the suspect's persona, what really happened to them, the story they tell, what they lie about, and which evidence makes them change their story. |
| **Structured output** | Nemotron answers with one JSON object: the spoken `reply`, a list of `claims` tagged against a fixed list of yes/no questions for the case (for example *"Was Theo in the building after 21:00?"*), any evidence it hands over, and whether it just changed its story. |
| **Deterministic contradiction detector** | Plain code compares the tagged claims: the same suspect saying two different things, two suspects disagreeing, or a claim against evidence the player has found. The model never grades itself. |
| **Token Factory API** | OpenAI-compatible Chat Completions. Base URL `https://api.tokenfactory.nebius.com/v1`, bearer key, model `nvidia/nemotron-3-super-120b-a12b` by default (check the Token Factory catalog and set `NEBIUS_MODEL` if it differs). |
| **Key stays on the server** | The browser talks to a small serverless proxy. The proxy holds the key, builds the prompts, validates the model output and rate-limits each visitor. The browser never sees the key, the prompts, or who did it. |

Architecture, prompt layout and the security model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Mock model, then Nemotron, with no code change

The model client speaks the OpenAI Chat Completions format and reads its settings from
the environment:

- `NEBIUS_API_KEY` not set → the built-in mock model answers. It takes the same request
  and returns the same response shape, so the whole game can be played and tested
  offline.
- `NEBIUS_API_KEY` set → requests go to `NEBIUS_BASE_URL` with that key.

## Run it locally

Node.js 20 or newer. No dependencies to install.

```bash
npm start        # http://127.0.0.1:8787 (mock model)
npm test         # unit, API and full-game tests
```

To try Nemotron locally, put the key in your shell (never in a file in this repo):

```bash
export NEBIUS_API_KEY=...            # from the Token Factory console
export NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
npm start
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEBIUS_API_KEY` | not set (mock) | Token Factory key. A secret: set it with `wrangler secret put`, never in `wrangler.toml`. |
| `NEBIUS_BASE_URL` | `https://api.tokenfactory.nebius.com/v1` | OpenAI-compatible base URL. |
| `NEBIUS_MODEL` | `nvidia/nemotron-3-super-120b-a12b` | Model id. |
| `NEBIUS_JSON_MODE` | `json_object` | Set to `off` if the model rejects `response_format`. |
| `RATE_LIMIT_PER_MIN` | `20` | Questions per minute per visitor. |
| `RATE_LIMIT_BURST` | `8` | Questions allowed back to back. |
| `DAILY_MODEL_CALLS` | `1500` | Cap on Nemotron calls per day, per server instance. |
| `ALLOWED_ORIGINS` | same origin | Extra origins allowed to call the API, comma-separated. |

## Deploy

The game is static files plus one Cloudflare Worker, which fits the free plan.

```bash
npx wrangler deploy                      # mock model until the key is set
npx wrangler secret put NEBIUS_API_KEY   # switch to Nemotron
```

## License

MIT. See [LICENSE](LICENSE). Built by elghaly.
