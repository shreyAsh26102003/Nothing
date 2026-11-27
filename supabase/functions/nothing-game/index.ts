import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
function rng(seed:number){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function wavesFor(seed:number,width=390){
 const random=rng(seed),waves=[];
 let sec=.85;
 for(let w=0;sec<44.3&&w<80;w++){
  const phase=sec<7?0:sec<18?1:sec<30?2:3;
  const compact=width<440;const count=phase===0?2+(random()<.27?1:0):phase===1?3+Math.floor(random()*(compact?2:3)):phase===2?3+Math.floor(random()*(compact?2:3)):3+Math.floor(random()*(compact?2:3));
  const risk=phase===0?.18:phase===1?.31:phase===2?.43:.52;
  const bombIndex=random()<risk?Math.floor(random()*count):-1;
  const shuffled=Array.from({length:count},(_,i)=>i).sort(()=>random()-.5);
  const entries=Array.from({length:count},(_,i)=>{
   const lane=shuffled[i],jitter=(random()-.5)*.08,fruit=Math.floor(random()*5);
   return {bomb:i===bombIndex,fruit,x:(width<440?.14:.09)+(width<440?.72:.82)*(lane+.5)/count+jitter,vx:(random()-.5)*.07,apex:.65+random()*.21};
  });
  waves.push({sec:Math.round(sec*100)/100,entries});
  const base=phase===0?1.22:phase===1?1.02:phase===2?.82:.7;
  sec+=base+random()*.4;
 }
 return waves;
}
async function hash(text:string){const bytes=new TextEncoder().encode(text);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function readPlayer(req:Request){
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||'';
 if(!/^[a-zA-Z0-9_-]{35,100}$/.test(token))return null;
 const digest=await hash(token);
 const {data,error}=await db.from('nothing_guest_players').select('id,display_name,disabled,created_at').eq('secret_hash',digest).maybeSingle();
 return error||!data||data.disabled?null:data;
}
function validName(name:string){return /^[a-zA-Z0-9][a-zA-Z0-9 ._-]{1,23}$/.test(name)&&!/\b(fuck|cunt|nigger|bitch|asshole|nazi)\b/i.test(name)}
function finishTime(entry:{apex:number},height:number){
 const g=height*2.1,vy=-Math.sqrt(2*g*(entry.apex*height+45));
 return (-vy+Math.sqrt(vy*vy+2*g*35))/g;
}
async function logFlag(playerId:string,roundId:string,reason:string){
 try{await db.from('nothing_score_flags').insert({player_id:playerId,round_id:roundId,reason,severity:2})}catch{}
}
async function top(){
 const {data,error}=await db.rpc('nothing_top_scores',{p_limit:100});
 if(error)throw error;
 const rows=data||[];
 return {top:rows.map((r:any,i:number)=>({rank:i+1,playerId:r.player_id,name:r.display_name,score:r.score})),cutoff:rows.length===100?rows[99].score:null,entries:rows.length};
}

Deno.serve(async (req:Request)=>{
 if(req.method==='OPTIONS')return new Response('',{headers});
 const action=new URL(req.url).searchParams.get('action')||'leaderboard';
 try {
  if(action==='health'&&req.method==='GET')return respond({ok:true,version:'v13'});
  if(action==='leaderboard'&&req.method==='GET')return respond(await top());
  if(action==='register'&&req.method==='POST'){
   const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip');
   if(ip){const fingerprint=await hash(ip+':nothing:'+key.slice(0,16));const {data:allowed,error:rateError}=await db.rpc('nothing_rate_allow',{p_fingerprint:fingerprint,p_action:'register',p_limit:120});if(rateError)throw rateError;if(!allowed)return respond({error:'Too many new players from this connection. Try again later.'},429)}
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('');
   const digest=await hash(token);
   const {data,error}=await db.from('nothing_guest_players').insert({secret_hash:digest}).select('id').single();
   if(error)throw error;
   return respond({playerId:data.id,token});
  }
  if(action==='track'&&req.method==='POST'){
   const body=await req.json(),event=String(body.event||''),anon=String(body.anonymousId||''),ref=String(body.referrerId||'');
   if(!['visit','started','ended','replayed','shared','claim_requested','claim_verified','error'].includes(event)||!/^[a-zA-Z0-9-]{16,64}$/.test(anon))return respond({error:'Invalid event'},400);
   const {count}=await db.from('nothing_events').select('*',{count:'exact',head:true}).eq('anonymous_id',anon).gte('created_at',new Date(Date.now()-86400000).toISOString());
   if((count||0)>250)return respond({error:'Rate limit'},429);
   const {error}=await db.from('nothing_events').insert({event_name:event,anonymous_id:anon,session_id:null,referrer_id:/^[0-9a-f-]{36}$/i.test(ref)?ref:null});
   if(error)throw error;
   return respond({ok:true});
  }
  const player=await readPlayer(req);
  if(!player)return respond({error:'Session missing. Open the game again.'},401);
if(action==='waitlist'&&req.method==='POST'){
   const b=await req.json(),email=String(b.email||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return respond({error:'Enter a valid email address.'},400);
   if(b.consent!==true)return respond({error:'Please confirm that you want emails from After All.'},400);
   const {count}=await db.from('nothing_waitlist').select('*',{count:'exact',head:true}).eq('player_id',player.id).gte('created_at',new Date(Date.now()-86400000).toISOString());
   if((count||0)>=3)return respond({error:'Too many attempts. Try another day.'},429);
   const {data:existing}=await db.from('nothing_waitlist').select('id,player_id,unsubscribed_at').eq('email_normalized',email).maybeSingle();
   if(existing){
    if(existing.player_id===player.id&&existing.unsubscribed_at){const {error:resetError}=await db.from('nothing_waitlist').update({unsubscribed_at:null,marketing_consent:true}).eq('id',existing.id);if(resetError)throw resetError;return respond({accepted:true,resubscribed:true,verified:false})}
    return respond({accepted:true,already:true,verified:false});
   }
   const {error}=await db.from('nothing_waitlist').insert({player_id:player.id,email,marketing_consent:true,source:'nothing'});
   if(error)throw error;
   return respond({accepted:true,verified:false});
  }
    if(action==='unsubscribe'&&req.method==='POST'){
   const b=await req.json(),email=String(b.email||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return respond({error:'Enter a valid email.'},400);
   const {error}=await db.from('nothing_waitlist').update({unsubscribed_at:new Date().toISOString(),marketing_consent:false}).eq('player_id',player.id).eq('email_normalized',email).is('unsubscribed_at',null);
   if(error)throw error;
   return respond({ok:true});
  }
  if(action==='profile'&&req.method==='GET'){
   const {data}=await db.from('nothing_guest_scores').select('score,display_name').eq('player_id',player.id).maybeSingle();
   if(!data)return respond({playerId:player.id,best:0,name:player.display_name,rank:null});
   const {data:rank,error:rankError}=await db.rpc('nothing_rank_guest',{p_player_id:player.id});
   if(rankError)throw rankError;
   return respond({playerId:player.id,best:data.score,name:data.display_name,rank:rank||null});
  }
  if(action==='start'&&req.method==='POST'){
   const body=await req.json(),width=Number(body.width),height=Number(body.height);
   if(!Number.isInteger(width)||width<280||width>2560||!Number.isInteger(height)||height<400||height>2560)return respond({error:'Unsupported screen size'},400);
   const {count}=await db.from('nothing_rounds').select('*',{count:'exact',head:true}).eq('player_id',player.id).gte('started_at',new Date(Date.now()-86400000).toISOString());
   if((count||0)>=100)return respond({error:'Daily round limit reached'},429);
   const seed=crypto.getRandomValues(new Uint32Array(1))[0];
   const {data,error}=await db.from('nothing_rounds').insert({player_id:player.id,seed,viewport_width:width,viewport_height:height}).select('id,started_at').single();
   if(error)throw error;
   return respond({roundId:data.id,startedAt:data.started_at,waves:wavesFor(seed,width)});
  }
  if(action==='submit'&&req.method==='POST'){
   const b=await req.json(),name=String(b.name||'').trim(),roundId=String(b.roundId||''),score=Number(b.score),endAt=Number(b.endAt),events=b.events;
   if(!validName(name))return respond({error:'Enter a name with 2–24 letters or numbers.'},400);
   if(!Number.isInteger(score)||score<0||score>10000||!Number.isFinite(endAt)||endAt<.8||endAt>45.3||!Array.isArray(events)||events.length>250)return respond({error:'Invalid round data'},400);
   const {data:round,error:roundErr}=await db.from('nothing_rounds').select('*').eq('id',roundId).eq('player_id',player.id).maybeSingle();
   if(roundErr||!round||round.claimed_at||new Date(round.expires_at).getTime()<Date.now())return respond({error:'Round expired or already claimed.'},409);
   const serverAge=(Date.now()-new Date(round.started_at).getTime())/1000;
   if(serverAge+1<endAt||serverAge>86430)return respond({error:'Round duration could not be verified.'},400);
   const waves=wavesFor(Number(round.seed),round.viewport_width),hit=new Set<string>();
   let calculated=0,combo=0,lastAt=-100;
   for(const e of events){
    if(!Number.isInteger(e.wave)||!Number.isInteger(e.fruit)||!Number.isFinite(e.at)||!Number.isFinite(e.x)||!Number.isFinite(e.y))return respond({error:'Invalid slice event'},400);
    const wave=waves[e.wave],obj=wave?.entries[e.fruit],at=Number(e.at),key=e.wave+':'+e.fruit,dt=at-(wave?.sec||0);
    if(!obj||obj.bomb||hit.has(key)||at<lastAt||at>endAt+.2||dt<0||dt>2.6){await logFlag(player.id,roundId,'event sequence impossible');return respond({error:'Score could not be verified'},400)}
    const H=round.viewport_height,W=round.viewport_width,g=H*2.1,vy=-Math.sqrt(2*g*(obj.apex*H+45));
    const expectedY=H+45+vy*dt+.5*g*dt*dt,expectedX=obj.x*W+obj.vx*W*dt;
    const distance=Math.hypot(expectedX-e.x,expectedY-e.y);
    if(distance>95){await logFlag(player.id,roundId,'position mismatch '+Math.round(distance));return respond({error:'Slice position could not be verified'},400)}
    hit.add(key);combo=at-lastAt<.18?combo+1:1;calculated+=10+(combo>=2?5:0);lastAt=at;
   }
   if(calculated!==score){await logFlag(player.id,roundId,'score mismatch');return respond({error:'Score mismatch'},400)}
   const result=String(b.result||'');
   let misses=0,firstThirdMiss=Infinity,landingTimes=[];
   for(let w=0;w<waves.length;w++){for(let j=0;j<waves[w].entries.length;j++){const item=waves[w].entries[j];if(item.bomb||hit.has(w+':'+j))continue;const landed=waves[w].sec+finishTime(item,round.viewport_height);if(landed<=endAt+.15)landingTimes.push(landed)}}
   landingTimes.sort((a,b)=>a-b);misses=landingTimes.length;firstThirdMiss=landingTimes[2]??Infinity;
   if(result==='time'&&endAt<44.7)return respond({error:'Round ended too early'},400);
   if(result==='misses'&&(misses<3||firstThirdMiss>endAt+.3||firstThirdMiss<endAt-.45))return respond({error:'Miss count could not be verified'},400);
   if(result==='bomb'){const bomb=b.bomb;const wave=waves[bomb?.wave],obj=wave?.entries[bomb?.fruit],dt=Number(bomb?.at)-Number(wave?.sec);if(!obj?.bomb||!Number.isFinite(dt)||dt<0||dt>2.6||Math.abs(Number(bomb.at)-endAt)>.3)return respond({error:'Bomb hit could not be verified'},400);if(misses>=3&&firstThirdMiss<endAt-.35)return respond({error:'Round should have ended on misses'},400)}
   if(!['time','misses','bomb'].includes(result))return respond({error:'Round ending is invalid'},400);
   if(misses>=3&&result==='time')return respond({error:'Miss limit was reached'},400);
   const flagged=score>1800||events.length>160;
   const {data:committed,error:commitErr}=await db.rpc('nothing_commit_round',{p_round_id:roundId,p_player_id:player.id,p_name:name,p_score:score,p_events:events,p_duration:endAt,p_flagged:flagged});
   if(commitErr){console.warn('commit round',commitErr.message);return respond({error:'Score could not be saved. Please try again.'},409)}
   // The atomic database commit inserts review flags in the same transaction as the score.
   return respond(committed);
  }
  return respond({error:'Not found'},404);
 } catch(e){console.error('nothing-game',action,e);return respond({error:'Something went wrong on our end.'},500)}
});
