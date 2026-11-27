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

const emailConfigured=()=>Boolean(Deno.env.get('RESEND_API_KEY')&&Deno.env.get('AFTER_ALL_EMAIL_FROM'));
const freshToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function sendConfirmationMessage(id:number,email:string,token:string){
 const apiKey=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('AFTER_ALL_EMAIL_FROM');
 if(!apiKey||!from)return {emailSent:false,delivery:'not_configured'};
 const link='https://becauseafterall.com/email.html#confirm='+token;
 const leave='https://becauseafterall.com/email.html#unsubscribe='+token;
 const textBody=['AFTER ALL.','','Thanks for signing up for updates from After All. We\'re working on a few things involving fruit and we\'ll let you know when we have something to share.','','Please confirm your email address so we know it\'s you:',link,'','If you didn\'t sign up, you can ignore this email.','','Unsubscribe: '+leave].join('\n');
 const html=['<html><body style="margin:0;padding:0;background:#fff0d4;color:#2b1b28;font-family:Arial,Helvetica,sans-serif">',
 '<div style="max-width:560px;margin:0 auto;padding:42px 28px">',
 '<p style="font-size:14px;font-weight:900;letter-spacing:1px">AFTER ALL.</p>',
 '<h1 style="font-size:34px;line-height:1.08;letter-spacing:-1px;margin:44px 0 24px">Thanks for signing up.</h1>',
 '<p style="font-size:17px;line-height:1.55">We\'re working on a few things involving fruit, and we\'ll email you when we have something to share. Please confirm your address below.</p>',
 '<p style="margin:35px 0"><a href="'+link+'" style="display:inline-block;padding:14px 20px;border-radius:28px;background:#ff705c;border:2px solid #2b1b28;color:#2b1b28;text-decoration:none;font-weight:900;font-size:14px">CONFIRM MY EMAIL</a></p>',
 '<p style="font-size:12px;line-height:1.6;color:#79646b">If you didn\'t sign up, ignore this email.</p>',
 '<p style="margin-top:48px;font-size:12px"><a style="color:#79646b" href="'+leave+'">Unsubscribe</a></p>',
 '</div></body></html>'].join('');
 try{
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':'afterall-confirm-'+id+'-'+token.slice(0,20)},body:JSON.stringify({from,to:[email],subject:'Please confirm your email for After All',html,text:textBody,...(Deno.env.get('AFTER_ALL_REPLY_TO')?{reply_to:Deno.env.get('AFTER_ALL_REPLY_TO')}: {})}),signal:AbortSignal.timeout(12000)});
  if(!res.ok){console.warn('afterall-email-provider-rejected',res.status);return {emailSent:false,delivery:'provider_error'}}
  const result=await res.json();
  const {error}=await db.from('nothing_waitlist').update({confirmation_sent_at:new Date().toISOString(),confirmation_message_id:String(result.id||'')}).eq('id',id);
  if(error)console.warn('afterall-email-ack-save-error',error.code);
  return {emailSent:true,delivery:'sent'};
 }catch(e){console.warn('afterall-email-request-failed',String(e).slice(0,140));return {emailSent:false,delivery:'provider_error'}}
}
async function attemptConfirmation(row:any){
 if(!emailConfigured())return {emailSent:false,delivery:'not_configured'};
 if(row.verified||row.unsubscribed_at||!row.marketing_consent)return {emailSent:false,delivery:'already_handled'};
 const now=Date.now(),prev=row.confirmation_attempted_at?new Date(row.confirmation_attempted_at).getTime():0;
 const withinDay=now-prev<86400000,attempts=withinDay?Number(row.confirmation_attempts||0):0;
 if(withinDay&&now-prev<120000)return {emailSent:false,delivery:'recently_attempted'};
 if(withinDay&&attempts>=3)return {emailSent:false,delivery:'rate_limited'};
 const token=freshToken(),digest=await hash(token);
 const {error}=await db.from('nothing_waitlist').update({confirmation_token_hash:digest,confirmation_expires_at:new Date(now+7*86400000).toISOString(),confirmation_attempted_at:new Date(now).toISOString(),confirmation_attempts:attempts+1,confirmation_sent_at:null,confirmation_message_id:null}).eq('id',row.id);
 if(error){console.warn('afterall-confirmation-update-failed',error.code);return {emailSent:false,delivery:'storage_error'}};
 return await sendConfirmationMessage(Number(row.id),String(row.email),token);
}
Deno.serve(async (req:Request)=>{
 if(req.method==='OPTIONS')return new Response('',{headers});
 const action=new URL(req.url).searchParams.get('action')||'leaderboard';
 try {
  if(action==='health'&&req.method==='GET')return respond({ok:true,version:'v19'});
  if(action==='leaderboard'&&req.method==='GET')return respond(await top());
  if(action==='register'&&req.method==='POST'){
   const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip');
   if(ip){const fingerprint=await hash('nothing-register:'+ip+':'+(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''));const {data:allowed,error:rateError}=await db.rpc('nothing_rate_allow',{p_fingerprint:fingerprint,p_action:'register',p_limit:120});if(rateError)throw rateError;if(!allowed)return respond({error:'Too many new players from this connection. Try again later.'},429)}
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
  if(action==='email_status'&&req.method==='GET')return respond({enabled:emailConfigured()});
  if((action==='confirm_email'||action==='unsubscribe_email')&&req.method==='POST'){
   const body=await req.json().catch(()=>({})),token=String(body.token||'');
   if(!/^[0-9a-f]{64}$/.test(token))return respond({error:'This link is invalid.'},400);
   const digest=await hash(token),now=new Date().toISOString();
   if(action==='confirm_email'){
    const {data,error}=await db.from('nothing_waitlist').update({verified:true,confirmed_at:now}).eq('confirmation_token_hash',digest).gte('confirmation_expires_at',now).eq('marketing_consent',true).is('unsubscribed_at',null).select('id');
    if(error)throw error;
    if(!data?.length)return respond({error:'This link has expired or has already been used. Return to the signup page to request a new note.'},410);
    return respond({confirmed:true});
   }
   const {data,error}=await db.from('nothing_waitlist').update({marketing_consent:false,unsubscribed_at:now}).eq('confirmation_token_hash',digest).is('unsubscribed_at',null).select('id');
   if(error)throw error;
   return respond({unsubscribed:true});
  }
  const player=await readPlayer(req);
  if(!player)return respond({error:'Session missing. Open the game again.'},401);
if(action==='waitlist'&&req.method==='POST'){
 const b=await req.json(),email=String(b.email||'').trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return respond({error:'Enter a valid email address.'},400);
 if(b.consent!==true)return respond({error:'Please confirm that you want emails from After All.'},400);
 const {count}=await db.from('nothing_waitlist').select('*',{count:'exact',head:true}).eq('player_id',player.id).gte('created_at',new Date(Date.now()-86400000).toISOString());
 if((count||0)>=3)return respond({error:'Too many attempts. Try another day.'},429);
 const {data:existing,error:findError}=await db.from('nothing_waitlist').select('id,player_id,email,marketing_consent,verified,unsubscribed_at,confirmation_attempted_at,confirmation_attempts').eq('email_normalized',email).maybeSingle();
 if(findError)throw findError;
 if(existing){
  if(existing.player_id!==player.id)return respond({accepted:true,emailSent:false,delivery:'existing',verified:false});
  if(existing.unsubscribed_at){
   const {error:resetError}=await db.from('nothing_waitlist').update({unsubscribed_at:null,marketing_consent:true,verified:false,confirmed_at:null,confirmation_attempts:0,confirmation_attempted_at:null}).eq('id',existing.id);
   if(resetError)throw resetError;
   existing.unsubscribed_at=null;existing.verified=false;existing.marketing_consent=true;existing.confirmation_attempts=0;existing.confirmation_attempted_at=null;
  }
  if(existing.verified)return respond({accepted:true,emailSent:false,delivery:'verified',verified:true});
  return respond({accepted:true,verified:false,...await attemptConfirmation(existing)});
 }
 const {data:added,error}=await db.from('nothing_waitlist').insert({player_id:player.id,email,marketing_consent:true,source:'nothing'}).select('id,player_id,email,marketing_consent,verified,unsubscribed_at,confirmation_attempted_at,confirmation_attempts').single();
 if(error){
  if(error.code==='23505')return respond({accepted:true,emailSent:false,delivery:'existing',verified:false});
  throw error;
 }
 return respond({accepted:true,verified:false,...await attemptConfirmation(added)});
}
  if(action==='unsubscribe'&&req.method==='POST'){
   const b=await req.json(),email=String(b.email||'').trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>254)return respond({error:'Enter a valid email.'},400);
   const {error}=await db.from('nothing_waitlist').update({unsubscribed_at:new Date().toISOString(),marketing_consent:false}).eq('player_id',player.id).eq('email_normalized',email).is('unsubscribed_at',null);
   if(error)throw error;
   return respond({ok:true});
  }
  if(action==='export_profile'&&req.method==='GET'){
   const [{data:scores,error:scoreErr},{data:rounds,error:roundErr},{data:subscriptions,error:subErr}]=await Promise.all([
    db.from('nothing_guest_scores').select('display_name,score,achieved_at').eq('player_id',player.id),
    db.from('nothing_rounds').select('id,started_at,score,duration,flagged').eq('player_id',player.id).order('started_at',{ascending:false}).limit(100),
    db.from('nothing_waitlist').select('email,created_at,marketing_consent,unsubscribed_at').eq('player_id',player.id)
   ]);
   if(scoreErr||roundErr||subErr)throw scoreErr||roundErr||subErr;
   return respond({exported_at:new Date().toISOString(),notice:'The most recent 100 game rounds are included. Contact After All for a full data access request.',player:{id:player.id,display_name:player.display_name,created_at:player.created_at},scores:scores||[],rounds:rounds||[],updates:subscriptions||[]});
  }
  if(action==='delete_profile'&&req.method==='POST'){
   const body=await req.json();
   if(body.confirm!=='DELETE')return respond({error:'Confirm account deletion explicitly.'},400);
   const {error:waitlistError}=await db.from('nothing_waitlist').delete().eq('player_id',player.id);
   if(waitlistError)throw waitlistError;
   const {error:playerError}=await db.from('nothing_guest_players').delete().eq('id',player.id);
   if(playerError)throw playerError;
   return respond({deleted:true,notice:'Your game account, personal scores, rounds and associated opt-in contact information have been deleted.'});
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
    if(!Number.isInteger(e.wave)||!Number.isInteger(e.fruit)||!Number.isFinite(e.at)||!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(e.x0)||!Number.isFinite(e.y0)||!Number.isFinite(e.x1)||!Number.isFinite(e.y1))return respond({error:'Invalid slice event'},400);
    const wave=waves[e.wave],obj=wave?.entries[e.fruit],at=Number(e.at),key=e.wave+':'+e.fruit,dt=at-(wave?.sec||0);
    if(!obj||obj.bomb||hit.has(key)||at<lastAt||at>endAt+.2||dt<0||dt>2.6){await logFlag(player.id,roundId,'event sequence impossible');return respond({error:'Score could not be verified'},400)}
    const H=round.viewport_height,W=round.viewport_width,g=H*2.1,vy=-Math.sqrt(2*g*(obj.apex*H+45));
    const expectedY=H+45+vy*dt+.5*g*dt*dt,expectedX=obj.x*W+obj.vx*W*dt;
    const distance=Math.hypot(expectedX-e.x,expectedY-e.y);
    if(distance>95){await logFlag(player.id,roundId,'position mismatch '+Math.round(distance));return respond({error:'Slice position could not be verified'},400)}
    const dx=e.x1-e.x0,dy=e.y1-e.y0,gestureLength=Math.hypot(dx,dy);
    if(gestureLength<12||gestureLength>Math.max(900,W*1.3)||[e.x0,e.x1].some(x=>x<0||x>W)||[e.y0,e.y1].some(y=>y<0||y>H))return respond({error:'Swipe event could not be verified'},400);
    const along=Math.max(0,Math.min(1,((e.x-e.x0)*dx+(e.y-e.y0)*dy)/(dx*dx+dy*dy||1)));
    if(Math.hypot(e.x-(e.x0+along*dx),e.y-(e.y0+along*dy))>50){await logFlag(player.id,roundId,'gesture mismatch');return respond({error:'Swipe missed the fruit'},400)}
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
