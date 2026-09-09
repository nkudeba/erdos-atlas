import {env} from 'cloudflare:workers';
export function database(){const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw Error('Results storage unavailable');return db;}
export function ingestSecret(){return (env as unknown as {RESULTS_INGEST_KEY?:string}).RESULTS_INGEST_KEY;}
