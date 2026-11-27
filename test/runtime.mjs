import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('Play Nothing starts and runs canvas frames with mouse/touch interactions',async()=>{
 const nodes=new Map(),listeners=new Map(),callbacks=[];
 let now=1000;
 const context2d=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,val)=>(obj[key]=val,true)});
 function element(id){
  if(!nodes.has(id))nodes.set(id,{id,textContent:'',value:'',hidden:false,disabled:false,style:{},children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},replaceChildren(){this.children=[]},append(...items){this.children.push(...items)},remove(){},click(){},addEventListener(type,fn){listeners.set(id+':'+type,fn)},setPointerCapture(){},getContext(){return context2d}});
  return nodes.get(id);
 }
 const local=new Map(),storage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,String(v)),removeItem:k=>local.delete(k)};
 const doc={hidden:false,getElementById:element,addEventListener(type,fn){listeners.set('document:'+type,fn)},createElement(tag){return element('created'+nodes.size)},body:{append(){}}};
 const waves=Array.from({length:20},(_,i)=>({sec:.85+i*1.1,entries:[{bomb:i%4===3,fruit:i%5,x:.3,vx:0,apex:.7},{bomb:false,fruit:(i+1)%5,x:.7,vx:0,apex:.68}]}));
 const fetch=async url=>{const action=new URL(url).searchParams.get('action');const response=action==='register'?{token:'a'.repeat(64),playerId:'test-player'}:action==='start'?{roundId:'test-round',waves}:action==='leaderboard'?{top:[],cutoff:null}:action==='profile'?{best:0,rank:null}:action==='submit'?{accepted:true,best:10,rank:1}:{ok:true};return {ok:true,async json(){return response}}};
 let scheduled=[];
 const fakeTimers={setTimeout(fn,delay){scheduled.push({at:now+delay,fn});return scheduled.length},clearTimeout(){}};
 const noAudio={state:'running',currentTime:0,createOscillator(){return{frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},start(){},stop(){}}},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this}}}};
 const fakeCrypto={randomUUID:()=> 'abcde12345abcde12345abcde12345abc',getRandomValues(a){return a}};
 const fakeWindow={AudioContext:class{constructor(){return noAudio}},addEventListener(type,fn){listeners.set('window:'+type,fn)}};
 const context={document:doc,window:fakeWindow,localStorage:storage,crypto:fakeCrypto,fetch,requestAnimationFrame(fn){callbacks.push(fn);return callbacks.length},cancelAnimationFrame(){},setTimeout:fakeTimers.setTimeout,clearTimeout:fakeTimers.clearTimeout,performance:{now:()=>now},innerWidth:390,innerHeight:800,devicePixelRatio:2,addEventListener(){},location:{origin:'https://nothing-after-all.vercel.app',pathname:'/',search:''},navigator:{vibrate(){},clipboard:{async writeText(){}}},URLSearchParams,AbortController,console};
 context.globalThis=context;
 runInNewContext(source,context);
 assert.equal(typeof element('play').onclick,'function');
 await element('play').onclick();
 for(let i=0;i<200;i++){now+=16.667;const due=scheduled.filter(t=>t.at<=now);scheduled=scheduled.filter(t=>t.at>now);for(const t of due)t.fn();const frame=callbacks.shift();if(frame)frame(now);if(i===130){const down=listeners.get('game:pointerdown');const up=listeners.get('game:pointerup');assert.equal(typeof down,'function');down({clientX:130,clientY:350,pointerId:1});up({})}}
 assert.equal(element('misses').textContent.includes('/3'),true);
 assert.ok(Number(element('time').textContent)<45);
 assert.equal(element('play').disabled,false);
});
