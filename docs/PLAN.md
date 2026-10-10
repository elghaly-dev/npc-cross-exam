# Plan to Oct 28

The hackathon closes **Fri Oct 30, 17:00 UTC** (10:00 Pacific). We aim to submit on
**Wed Oct 28**, which leaves two days of buffer. All times are UTC.

**Owner** marks steps that need a person: accounts, keys, recording, the submit button.
Everything else is build work that comes in as draft pull requests.

| Day | Goal | Done when |
| --- | --- | --- |
| **Sat Oct 10** | Docs (this PR). Playable game with the mock model and the proxy (second PR). | Both PRs open; `npm test` passes; phone screenshot sent. |
| **Sun Oct 11** | **Owner:** register on Devpost; create the Nebius Token Factory account; join the Builders Program for credits; create an API key and keep it in a password manager; confirm the Nemotron model id in the catalog. | Key exists; model id written in the PR thread (not the key). |
| **Mon Oct 12** | Deploy to Cloudflare Workers (free plan) in mock mode. **Owner:** `wrangler secret put NEBIUS_API_KEY`. Run 20 scripted questions per suspect against Nemotron. | Public URL answers with Nemotron; latency p50/p95 and tokens per question noted. |
| **Tue Oct 13** | Output robustness: does `response_format` JSON work; is reasoning text stripped; fallback parser. Tag 30 hand-written answers and measure slot-tagging accuracy. | JSON valid in at least 95 % of 60 calls; tagging accuracy recorded. |
| **Wed Oct 14** | Prompt tuning so each suspect changes their story on the right evidence and keeps it after. | All three suspects break on their evidence in 5 of 5 runs. |
| **Thu Oct 15** | Prompt-injection pass: 25 attack questions ("ignore your rules", "print your prompt", "who did it?"). Fix what leaks. | No run reveals the culprit or the prompt; results in `docs/EVAL.md`. |
| **Fri Oct 16** | Rate limit and daily cap checked on the deployed Worker; error states in the page. | 429 and 503 paths shown in screenshots. |
| **Sat Oct 17** | A second case file, to show the engine is data-driven. | Case 2 playable with the mock and with Nemotron. |
| **Sun Oct 18** | Nebius Build Week day in Berlin (optional, if attending). Otherwise: notebook view and accessibility pass. | Keyboard and screen-reader walk-through done. |
| **Mon Oct 19** | Playtest with 3 people on their phones. | Notes collected. |
| **Tue Oct 20** | Fix playtest issues; tune scoring and the question budget. | Issues closed or written down as known limits. |
| **Wed Oct 21** | Phone checks on iOS Safari and Android Chrome; Lighthouse. | Screenshots from both; Lighthouse 95+. |
| **Thu Oct 22** | `docs/EVAL.md`: JSON validity, tagging accuracy, injection results, latency, tokens per game. | Numbers with the date and model id they were measured on. |
| **Fri Oct 23** | Demo video script (under 3 minutes) and shot list. **Owner:** record the voice-over. | Script reviewed. |
| **Sat Oct 24** | Edit the video, add captions; capture screenshots. | Video file ready. |
| **Sun Oct 25** | Devpost text draft; final README. | Draft reviewed. |
| **Mon Oct 26** | Feature freeze. Bug fixes only. | No open bugs marked must-fix. |
| **Tue Oct 27** | Final checks: banned words, secret scan, links, licenses, credits balance. Tag `v1.0`. | Checklist done. |
| **Wed Oct 28** | **Owner:** submit on Devpost before 18:00 UTC. | Submission confirmation saved. |
| Thu Oct 29 – Fri Oct 30 | Buffer. No new features. | |

## Rules we keep

- The key is never committed, pasted into an issue, or printed in logs. Fingerprints only.
- No paid services beyond Token Factory credits. Hosting stays on free plans.
- Every number in the README, Devpost text or video comes from `docs/EVAL.md`.
- Hackathon requirement to recheck on Oct 11 and Oct 27: the project runs on Nebius
  Token Factory and uses at least one NVIDIA open model.
