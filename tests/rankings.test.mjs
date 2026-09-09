import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterProblems,validateFilters,defaultFilters} from '../lib/rankings.ts';
const data=JSON.parse(readFileSync(new URL('../app/data.json',import.meta.url)));const rows=data.problems;
const categories=['All',...new Set(rows.flatMap(p=>p.tags))];
test('complete unique catalogue, consistent scores and ranking',()=>{
 assert.equal(rows.length,1217);assert.deepEqual(rows.map(p=>p.id).sort((a,b)=>a-b),Array.from({length:1217},(_,i)=>i+1));
 rows.forEach((p,i)=>{assert.equal(p.rank,i+1);assert.ok(p.statement.length);assert.equal(p.signals.reduce((s,x)=>s+x.points,0),p.score);assert.ok(p.score>=1&&p.score<=99);if(i)assert.ok(rows[i-1].score>=p.score);});
});
test('status and evidence are separate',()=>{
 for(const [status,n] of [['Solved',574],['Unsolved',639],['Independent',4]])assert.equal(filterProblems(rows,{...defaultFilters,status}).length,n);
 assert.equal(filterProblems(rows,{...defaultFilters,harness:'Verified'}).length,11);
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
