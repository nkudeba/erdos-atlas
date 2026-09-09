# Erdős Atlas

A private, searchable ranking of all 1,217 Erdős catalogue problems as of 9 September 2026. Filters distinguish published mathematical status, category, and harness proof evidence. Each assessment exposes reasons, enabling work, and score contributions.

Scores are relative heuristic priorities, not probabilities. 66 entries have additional manual review; no new solve attempts were conducted for this index. Data provenance and snapshot hashes are embedded in app/data.json. Ranking generation and retained source snapshots live in ../atlas-data.

Run `npm run dev` for development, `npm run build` for production, and `node --experimental-strip-types --test tests/rankings.test.mjs` for data/filter tests. Optional WebMCP tools use the same tested filter implementation; browser integration has not been exercised.
