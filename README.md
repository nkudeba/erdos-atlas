# Erdős Atlas

A private, searchable ranking of all 1,217 Erdős catalogue problems as of 9 September 2026. Filters distinguish published mathematical status, category, and harness proof evidence. Each assessment exposes reasons, enabling work, and score contributions.

Scores are relative heuristic priorities, not probabilities. 66 entries have additional manual review; no new solve attempts were conducted for this index. Data provenance and snapshot hashes are embedded in app/data.json. Ranking generation and retained source snapshots live in ../atlas-data.

Run `npm run dev` for development, `npm run build` for production, and `node --experimental-strip-types --test tests/rankings.test.mjs` for data/filter tests. Optional WebMCP tools use the same tested filter implementation; browser integration has not been exercised.

## Live run evidence

`/api/results` stores allowlisted run summaries in Sites-managed D1. Signed-in viewers can read; a separate secret authorizes publishing. POST updates are idempotent and accept only newer per-run revisions. The browser polls every 30 seconds and displays disconnected publisher state after two minutes. Existing rankings/catalogue status remain a dated assessment, while evidence badges and per-problem history update live. Open targets stay candidates; sublemmas are partial evidence. The latest five runs and strongest evidence per problem are returned, with total run counts.

Migrations are generated from db/schema.ts. Runtime publication secret RESULTS_INGEST_KEY belongs in Sites environment settings, never source. Local result_feed.py in the harness workspace maintains a retryable publisher; see ../docs/live-results.md.
