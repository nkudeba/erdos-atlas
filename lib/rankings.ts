export type Ranked = {id:number;rank:number;statement:string;status:string;tags:string[];harness:string;rationale:string[]};
export type Filters = {query:string;status:string;category:string;harness:string};
export const defaultFilters:Filters={query:'',status:'All',category:'All',harness:'All'};
export function filterProblems<T extends Ranked>(rows:T[], f:Filters):T[]{
 const q=f.query.trim().toLowerCase().replace(/^#/,'');
 return rows.filter(p=>(f.status==='All'||p.status===f.status)&&(f.category==='All'||p.tags.includes(f.category))&&(f.harness==='All'||p.harness===f.harness)&&(!q||(`${p.id} ${p.statement} ${p.tags.join(' ')} ${p.rationale.join(' ')}`).toLowerCase().includes(q)));
}
export function validateFilters(input:unknown,categories:string[]):Filters{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected a filter object');
 const o=input as Record<string,unknown>;
 if(Object.keys(o).some(k=>!Object.keys(defaultFilters).includes(k)))throw new Error('Unknown filter');
 for(const value of Object.values(o))if(typeof value!=='string')throw new Error('Filters must be strings');
 const f={...defaultFilters,...o} as Filters;
 if(f.query.length>500)throw new Error('Search is too long');
 if(!['All','Solved','Unsolved','Independent'].includes(f.status)||!categories.includes(f.category)||!['All','Verified','Attempted','Partial result','Untried'].includes(f.harness))throw new Error('Invalid filter value');
 return f;
}
