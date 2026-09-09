export const stages=['no_candidate','candidate_solution','mechanically_verified','statement_independently_audited','externally_reviewed','legacy_automated_verification'] as const;
export type RunResult={id:string;problem:number;revision:string;updatedAt:string;outcome:string;phase:string;direction:string;stage:string;mechanical:boolean;faithful:boolean;claimEligible:boolean;partial:boolean;artifact:string|null};
export type LiveFeed={runs:RunResult[];publisherSeenAt:string|null;receivedAt:string};
const outcomes=['running','proved','proved_unverified','not_proved','partial','budget_exhausted','budget_exhausted+partial','infrastructure_error','completed','stopped','unknown'];
export function validateRun(x:unknown):RunResult{
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid run');
 const r=x as RunResult;
 const keys=['id','problem','revision','updatedAt','outcome','phase','direction','stage','mechanical','faithful','claimEligible','partial','artifact'];
 if(Object.keys(r).length!==keys.length||Object.keys(r).some(k=>!keys.includes(k)))throw Error('Invalid fields');
 if(typeof r.id!=='string'||typeof r.revision!=='string'||!/^[a-f0-9]{64}$/.test(r.id)||!Number.isInteger(r.problem)||r.problem<1||r.problem>1217||!/^\d{20}$/.test(r.revision))throw Error('Invalid identity');
 if(typeof r.updatedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(r.updatedAt)||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('Invalid time');
 if(!outcomes.includes(r.outcome)||!['','pos','neg','program'].includes(r.direction)||!stages.includes(r.stage as typeof stages[number])||typeof r.phase!=='string'||!/^[-a-zA-Z0-9_/]{0,80}$/.test(r.phase))throw Error('Invalid status');
 if(['mechanical','faithful','claimEligible','partial'].some(k=>typeof r[k as keyof RunResult]!=='boolean')||!(r.artifact===null||typeof r.artifact==='string'&&/^[a-f0-9]{64}$/.test(r.artifact)))throw Error('Invalid evidence');
 if(r.mechanical&&!['mechanically_verified','statement_independently_audited','externally_reviewed'].includes(r.stage))throw Error('Inconsistent milestone');
 if(r.claimEligible&&(!r.mechanical||!r.faithful||r.stage!=='externally_reviewed'||r.direction==='program'))throw Error('Invalid claim');
 return r;
}
export function evidenceLabel(base:string,catalogue:string,runs:RunResult[]){
 const full=runs.filter(r=>r.direction!=='program');
 if(catalogue!=='Solved'&&full.some(r=>r.mechanical&&r.faithful))return 'Candidate';
 if(base==='Verified'||catalogue==='Solved'&&full.some(r=>r.mechanical&&r.faithful))return 'Verified';
 if(runs.some(r=>r.partial||r.direction==='program'&&r.mechanical))return 'Partial result';
 return runs.length? 'Attempted':base;
}

export function validateFeed(x:unknown):LiveFeed & {counts:{problem:number;count:number}[]}{
 if(!x||typeof x!=='object')throw Error('Invalid feed');const body=x as Record<string,unknown>;
 if(!Array.isArray(body.runs)||!Array.isArray(body.counts)||typeof body.receivedAt!=='string'||!(body.publisherSeenAt===null||typeof body.publisherSeenAt==='string'&&Number.isFinite(Date.parse(body.publisherSeenAt))))throw Error('Invalid feed');
 const counts=body.counts.map(c=>{if(!c||!Number.isInteger(c.problem)||!Number.isInteger(c.count)||c.count<0)throw Error('Invalid count');return {problem:c.problem,count:c.count};});
 return {runs:body.runs.map(validateRun),counts,receivedAt:body.receivedAt,publisherSeenAt:body.publisherSeenAt as string|null};
}
