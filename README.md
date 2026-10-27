# Erdős Atlas

The companion site for erdos-harness, an LLM + Lean 4 harness for attempting Erdős problems. A personal project by Nick Kudeba, built with Claude Code and Codex.

A searchable ranking of all 1,217 Erdős catalogue problems as of 9 September 2026. Filters distinguish published mathematical status, category, and harness proof evidence. Each assessment exposes reasons, enabling work, and score contributions.

Scores are relative heuristic priorities, not probabilities. 66 entries have additional manual review; no new solve attempts were conducted for this index. Data provenance and snapshot hashes are embedded in app/data.json. Ranking generation and retained source snapshots live in ../atlas-data.

Run `npm run dev` for development, `npm run build` for production, and `node --experimental-strip-types --test tests/rankings.test.mjs` for data/filter tests. Optional WebMCP tools use the same tested filter implementation; browser integration has not been exercised.

## Live run evidence

`/api/results` stores allowlisted run summaries in Sites-managed D1. Signed-in viewers can read; a separate secret authorizes publishing. POST updates are idempotent and accept only newer per-run revisions. The browser polls every 30 seconds and displays disconnected publisher state after two minutes. Catalogue status remains a dated assessment, while evidence badges, per-problem history and revised priority scores update live. Score revisions arrive on the same endpoint in a `rankings` array, are validated field by field, and are stored one row per problem under the same newer-revision-only rule as runs; the client overlays them and recomputes rank and tier rather than trusting published ones. Requires the `problem_rankings` migration (`drizzle/0001_live_rankings.sql`). Open targets stay candidates; sublemmas are partial evidence. The latest five runs and strongest evidence per problem are returned, with total run counts.

Migrations are generated from db/schema.ts. Runtime publication secret RESULTS_INGEST_KEY belongs in Sites environment settings, never source. Local result_feed.py in the harness workspace maintains a retryable publisher; see ../docs/live-results.md.

## Encrypted static build (GitHub Pages)

ChatGPT Sites deploys only from the ChatGPT app, with no CLI, API or git hook, so the harness's daemon cannot put a
new snapshot live there. The Atlas is therefore also published as an encrypted static site on GitHub Pages
(`nkudeba/erdos-atlas-site`), rebuilt and pushed by `atlas_pages.py` in the harness workspace.

- `app/atlas.tsx` is the page itself, taking its data source as a prop. `app/page.tsx` is the Sites wrapper (baked
  `data.json` plus `/api/results`); `static/app.tsx` is the static one (decrypted files).
- `npm run build:static` (`vite.static.config.ts`) builds `dist-static/app.js` and `app.css`, with no snapshot inside.
- `scripts/publish-static.mjs` encrypts the bundle, `app/data.json` and the run feed as
  IV || AES-256-GCM(gzip(content)), keyed by PBKDF2-SHA256 of the passphrase. Only `static/unlock.html` (no content),
  `meta.json` (salt, iterations, a check value), the KaTeX fonts and `robots.txt` are public in plaintext.
