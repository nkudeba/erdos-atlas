import katex from 'katex';
import { useMemo } from 'react';
export function MathText({text,compact=false}:{text:string;compact?:boolean}){
 const parts=useMemo(()=>{
  const re=/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$]+?(?<!\\)\$)/g;
  return text.split(re).map((part,i)=>{
   const display=part.startsWith('\\['),slash=display||part.startsWith('\\('),dollar=part.startsWith('$')&&part.endsWith('$');
   if(!slash&&!dollar)return <span key={i}>{part}</span>;
   const expr=part.slice(slash?2:1,slash?-2:-1);
   const html=katex.renderToString(expr,{displayMode:display&&!compact,throwOnError:false,trust:false,strict:'ignore',maxExpand:1000});
   return <span key={i} className={display&&!compact?'display-math':undefined} dangerouslySetInnerHTML={{__html:html}}/>;
  });
 },[text,compact]);
 return <>{parts}</>;
}
