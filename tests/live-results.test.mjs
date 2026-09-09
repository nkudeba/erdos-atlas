import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateRun,evidenceLabel,validateFeed} from '../lib/live-results.ts';
const run={id:'a'.repeat(64),problem:201,revision:'01788999999999999999',updatedAt:'2026-09-09T18:00:00.000Z',outcome:'proved',phase:'run/end',direction:'pos',stage:'mechanically_verified',mechanical:true,faithful:true,claimEligible:false,partial:false,artifact:'b'.repeat(64)};
test('open proofs remain candidates; no catalogue change',()=>{assert.equal(evidenceLabel('Untried','Unsolved',[run]),'Candidate');assert.equal(evidenceLabel('Untried','Solved',[run]),'Verified');});
test('failures never erase historical success and sublemmas are partial',()=>{assert.equal(evidenceLabel('Verified','Solved',[{...run,mechanical:false}]),'Verified');assert.equal(evidenceLabel('Untried','Unsolved',[{...run,direction:'program'}]),'Partial result');});
test('reject private fields, malformed claims, and unsafe values',()=>{assert.deepEqual(validateRun(run),run);for(const r of [{...run,prompt:'private'},{...run,problem:9999},{...run,claimEligible:true},{...run,mechanical:'true'},{...run,phase:'<script>'},{...run,revision:'old'}])assert.throws(()=>validateRun(r));});
test('feed validates every run and allows empty initial state',()=>{const feed={runs:[],counts:[],publisherSeenAt:null,receivedAt:new Date().toISOString()};assert.deepEqual(validateFeed(feed),feed);assert.throws(()=>validateFeed({...feed,runs:[{...run,extra:'secret'}]}));});

test('historical partial result is preserved after a failure',()=>{assert.equal(evidenceLabel('Partial result','Unsolved',[]),'Partial result');});
