'use client';
import data from './data.json';
import {Atlas, type AtlasSource} from './atlas';

// The Sites build: the baked snapshot plus the live overlay from /api/results, every 30 seconds.
const source:AtlasSource={data,
 loadFeed:async signal=>{const res=await fetch('/api/results',{cache:'no-store',signal});if(!res.ok)throw Error();return res.json();},
 pollMs:30000,staleAfterMs:120000,refreshLabel:'every 30 seconds'};

export default function Home(){return <Atlas source={source}/>;}
