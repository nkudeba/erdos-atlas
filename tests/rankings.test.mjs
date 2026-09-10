import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {filterProblems,validateFilters,defaultFilters} from '../lib/rankings.ts';
import {validateRanking,tierFor,validateFeed} from '../lib/live-results.ts';
const data=JSON.parse(readFileSync(new URL('../app/data.json',import.meta.url)));const rows=data.problems;
const categories=['All',...new Set(rows.flatMap(p=>p.tags))];
test('complete unique catalogue, consistent scores and ranking',()=>{
 assert.equal(rows.length,1217);assert.deepEqual(rows.map(p=>p.id).sort((a,b)=>a-b),Array.from({length:1217},(_,i)=>i+1));
 rows.forEach((p,i)=>{assert.equal(p.rank,i+1);assert.ok(p.statement.length);assert.equal(p.signals.reduce((s,x)=>s+x.points,0),p.score);assert.ok(p.score>=1&&p.score<=99);if(i)assert.ok(rows[i-1].score>=p.score);});
});
test('status and evidence are separate',()=>{
 for(const [status,n] of [['Solved',574],['Unsolved',639],['Independent',4]])assert.equal(filterProblems(rows,{...defaultFilters,status}).length,n);
 // Derived from the saved-proof corpus, not a frozen count: a new verified proof must not break this test.
 const solved=new Set(readdirSync(new URL('../../knowledge/solved/',import.meta.url)).filter(f=>f.endsWith('.lean')).map(f=>Number(f.slice(5,-5))));
 assert.ok(solved.size>=11);
 assert.deepEqual(filterProblems(rows,{...defaultFilters,harness:'Verified'}).map(p=>p.id).sort((a,b)=>a-b),[...solved].sort((a,b)=>a-b));
 for(const id of [172,201,424])assert.notEqual(rows.find(p=>p.id===id).harness,'Verified');
});
test('combined filters retain order and no results is valid',()=>{
 for(const category of categories){const found=filterProblems(rows,{...defaultFilters,category,status:'Unsolved'});assert.ok(found.every(p=>p.status==='Unsolved'&&(category==='All'||p.tags.includes(category))));assert.deepEqual(found.map(p=>p.rank),found.map(p=>p.rank).sort((a,b)=>a-b));}
 assert.equal(filterProblems(rows,{...defaultFilters,query:'no-such-problem-zzzz'}).length,0);
 assert.ok(filterProblems(rows,{...defaultFilters,query:'#649'}).some(p=>p.id===649));
 const pages=Array.from({length:Math.ceil(rows.length/30)},(_,i)=>rows.slice(i*30,(i+1)*30)).flat();assert.deepEqual(pages,rows);
});
test('tool input rejects invalid states',()=>{
 assert.deepEqual(validateFilters({},categories),defaultFilters);
 for(const bad of [null,[],{status:'Open'},{query:5},{category:'made up'},{query:'x'.repeat(501)},{extra:'x'}])assert.throws(()=>validateFilters(bad,categories));
});

const ranking=(over={})=>({problem:488,revision:'20260910180000123456',updatedAt:'2026-09-10T18:00:00.000Z',score:8,rationale:['near-misses come from proved-safe families'],requirements:['verify the third-party claim first'],...over});

test('published score revisions are validated, not trusted',()=>{
 assert.deepEqual(validateRanking(ranking()).problem,488);
 for(const bad of [null,[],'x',
   ranking({problem:0}),ranking({problem:1218}),ranking({problem:1.5}),
   ranking({revision:'123'}),ranking({revision:'x'.repeat(20)}),
   ranking({updatedAt:'2026-09-10'}),ranking({updatedAt:'not a time'}),
   ranking({score:0}),ranking({score:100}),ranking({score:8.5}),
   ranking({rationale:'a string'}),ranking({rationale:[123]}),ranking({rationale:['']}),
   ranking({rationale:['x'.repeat(601)]}),ranking({requirements:Array(13).fill('x')}),
   {...ranking(),extra:1}])assert.throws(()=>validateRanking(bad),`accepted ${JSON.stringify(bad)?.slice(0,60)}`);
 // a row missing a field is rejected too
 const {score,...missing}=ranking();assert.throws(()=>validateRanking(missing));
});

test('tiers follow the ranker thresholds and a verified proof outranks the score',()=>{
 assert.equal(tierFor(8,'Untried'),'Frontier');assert.equal(tierFor(20,'Untried'),'Research');
 assert.equal(tierFor(30,'Untried'),'Difficult');assert.equal(tierFor(50,'Untried'),'Plausible');
 assert.equal(tierFor(70,'Untried'),'Promising');assert.equal(tierFor(8,'Verified'),'Demonstrated');
});

test('the feed tolerates an older server with no rankings, and rejects a bad one',()=>{
 const base={runs:[],counts:[],receivedAt:new Date().toISOString(),publisherSeenAt:null};
 assert.deepEqual(validateFeed(base).rankings,[]);
 assert.equal(validateFeed({...base,rankings:[ranking()]}).rankings.length,1);
 assert.throws(()=>validateFeed({...base,rankings:'nope'}));
 assert.throws(()=>validateFeed({...base,rankings:[ranking({score:0})]}));
});

test('an overlaid score re-sorts the table and keeps ranks contiguous',()=>{
 // mirrors app/page.tsx: overlay, sort by -score then id, renumber
 const promoted=rows[rows.length-1].id,demoted=rows[0].id;
 const overrides=new Map([[demoted,1],[promoted,99]]);
 const merged=rows.map(p=>({...p,score:overrides.get(p.id)??p.score}))
   .sort((a,b)=>b.score-a.score||a.id-b.id).map((p,i)=>({...p,rank:i+1}));
 const rankOf=(id)=>merged.find(p=>p.id===id).rank,was=(id)=>rows.find(p=>p.id===id).rank;
 assert.ok(rankOf(promoted)<was(promoted),'a raised score must move up');
 assert.ok(rankOf(demoted)>was(demoted),'a lowered score must move down');
 // ties are broken by problem number, exactly as atlas-data/rank_problems.py does
 merged.forEach((p,i)=>{assert.equal(p.rank,i+1);if(i)assert.ok(merged[i-1].score>p.score||merged[i-1].score===p.score&&merged[i-1].id<p.id);});
 assert.equal(new Set(merged.map(p=>p.id)).size,rows.length);
 // every problem survives the overlay: no row is dropped or duplicated
 assert.deepEqual(merged.map(p=>p.id).sort((a,b)=>a-b),rows.map(p=>p.id).sort((a,b)=>a-b));
});
