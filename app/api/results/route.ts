import {database,ingestSecret} from '@/lib/results-db';
import {validateRun, type RunResult} from '@/lib/live-results';
import {timingSafeEqual} from 'node:crypto';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie, OAI-Sites-Authorization'};
function writer(req:Request){const expected=ingestSecret(),given=req.headers.get('X-Results-Key');return !!expected&&!!given&&Buffer.byteLength(given)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(given),Buffer.from(expected));}
export async function GET(req:Request){
 if(!req.headers.get('oai-authenticated-user-id')&&!writer(req))return Response.json({error:'Sign in required'},{status:401,headers});
 const db=database();
 // Latest five runs per problem, plus best evidence, retained across later failures.
 const rows=await db.prepare(`WITH ranked AS (SELECT payload,problem,ROW_NUMBER() OVER (PARTITION BY problem ORDER BY updated_at DESC,id) AS recency,ROW_NUMBER() OVER (PARTITION BY problem ORDER BY json_extract(payload,'$.claimEligible') DESC,json_extract(payload,'$.mechanical') DESC,json_extract(payload,'$.faithful') DESC,updated_at DESC) AS evidence FROM run_results) SELECT payload FROM ranked WHERE recency<=5 OR evidence=1`).all<{payload:string}>();
 const publisher=await db.prepare('SELECT seen_at FROM publisher_status WHERE id=1').first<{seen_at:string}>();
 const counts=await db.prepare('SELECT problem,COUNT(*) AS count FROM run_results GROUP BY problem').all<{problem:number;count:number}>();
 return Response.json({runs:rows.results.map(r=>JSON.parse(r.payload)),counts:counts.results,publisherSeenAt:publisher?.seen_at??null,receivedAt:new Date().toISOString()},{headers});
}
export async function POST(req:Request){
 if(!writer(req))return Response.json({error:'Unauthorized publisher'},{status:401,headers});
 if(Number(req.headers.get('content-length')||0)>150000)return Response.json({error:'Too large'},{status:413,headers});
 let runs:RunResult[];
 try{const raw=await req.text();if(raw.length>150000)throw Error();const body=JSON.parse(raw);if(body.schemaVersion!==1||!Array.isArray(body.runs)||body.runs.length>100||Object.keys(body).some(k=>!['schemaVersion','runs'].includes(k)))throw Error();runs=body.runs.map(validateRun);}catch{return Response.json({error:'Invalid results payload'},{status:400,headers});}
 const db=database();const statements=runs.map(r=>db.prepare('INSERT INTO run_results (id,problem,revision,updated_at,payload) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET problem=excluded.problem,revision=excluded.revision,updated_at=excluded.updated_at,payload=excluded.payload WHERE excluded.revision>run_results.revision').bind(r.id,r.problem,r.revision,r.updatedAt,JSON.stringify(r)));
 statements.push(db.prepare('INSERT INTO publisher_status (id,seen_at) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET seen_at=excluded.seen_at').bind(new Date().toISOString()));
 await db.batch(statements);
 return Response.json({accepted:runs.length},{headers});
}
