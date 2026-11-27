(()=>{'use strict';
const API='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';
const referral=new URLSearchParams(location.search).get('ref')||'';
const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d');
const FRUITS=[['🥭','#ffa92b'],['🍓','#f45172'],['🍍','#ffcb3d'],['🍌','#f5d461'],['🍇','#7544a3']];
const state={playing:false,starting:false,pausedAt:0,startAt:0,lastFrame:0,raf:0,width:0,height:0,dpr:1,waves:[],cursor:0,items:[],particles:[],halves:[],popups:[],trail:[],score:0,misses:0,combo:0,lastHit:-100,missLimit:3,seconds:45,reason:'',bomb:null,events:[],roundId:null,offline:false,guest:null,pending:null,name:'',profile:null,ranking:[],cutoff:null,showAll:false,mute:false,audio:null,drag:false,lastPointer:null,anonymous:''};
function getStored(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function remove(key){try{localStorage.removeItem(key)}catch{}}
state.guest=getStored('nothing-guest-v2');state.pending=getStored('nothing-pending-v2');state.name=getStored('nothing-name-v2')||'';state.mute=!!getStored('nothing-muted');
let anon=getStored('nothing-visitor-v2');if(!anon){anon=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).repeat(4)).replace(/[^a-zA-Z0-9-]/g,'').slice(0,64);save('nothing-visitor-v2',anon)}state.anonymous=anon;
function screen(id){for(const n of ['home','end','board'])$(n).hidden=n!==id;$('hud').classList.toggle('visible',!id);$('brandFooter').hidden=!id}
function label(id,value){$(id).textContent=value}
function sound(kind){if(state.mute)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ac=state.audio||(state.audio=new Audio());if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;const args=kind==='slice'?[450+Math.random()*270,.10,'triangle',.13]:kind==='bomb'?[130,.35,'sawtooth',.11]:kind==='miss'?[230,.13,'sine',.055]:kind==='combo'?[890,.13,'triangle',.11]:kind==='start'?[680,.18,'sine',.075]:[480,.25,'sine',.05];o.type=args[2];o.frequency.setValueAtTime(args[0],t);o.frequency.exponentialRampToValueAtTime(Math.max(80,args[0]*.5),t+args[1]);g.gain.setValueAtTime(args[3],t);g.gain.exponentialRampToValueAtTime(.001,t+args[1]);o.connect(g).connect(ac.destination);o.start();o.stop(t+args[1]+.01)}catch{}}
function pulse(ms=15){try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}}
function toggleSound(){state.mute=!state.mute;save('nothing-muted',state.mute);label('sound',state.mute?'Sound off':'Sound on');$('sound').setAttribute('aria-pressed',String(!state.mute));if(!state.mute)sound('start')}
label('sound',state.mute?'Sound off':'Sound on');$('sound').setAttribute('aria-pressed',String(!state.mute));$('sound').onclick=toggleSound;
function resize(){const w=Math.max(280,innerWidth),h=Math.max(400,innerHeight);state.dpr=Math.min(devicePixelRatio||1,2);if(!state.playing&&!state.starting){state.width=w;state.height=h}canvas.width=Math.round(w*state.dpr);canvas.height=Math.round(h*state.dpr);ctx.setTransform(state.dpr*w/state.width,0,0,state.dpr*h/state.height,0,0);ctx.fillStyle='#fff0d4';ctx.fillRect(0,0,state.width,state.height)}
addEventListener('resize',resize);resize();
async function request(action,method='GET',body=null,secured=true){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6000);try{const token=secured?state.guest?.token:null;const response=await fetch(API+'?action='+encodeURIComponent(action),{method,headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:body===null?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'});const result=await response.json();if(!response.ok)throw new Error(result.error||'The connection did not work.');return result}finally{clearTimeout(timer)}}
function track(event){request('track','POST',{event,anonymousId:state.anonymous,referrerId:referral},false).catch(()=>{})}
function report(err){console.error(err);track('error')}
window.addEventListener('error',e=>report(e.message||'Browser error'));
window.addEventListener('unhandledrejection',e=>report(e.reason||'Network error'));
track('visit');
async function guest(){if(state.guest?.token)return;const r=await request('register','POST',{},false);state.guest=r;save('nothing-guest-v2',r)}
function localWaves(){const arr=[];let sec=.8;while(sec<44){const phase=sec<7?0:sec<18?1:sec<30?2:3;const count=phase===0?2:phase===1?2+Math.floor(Math.random()*3):3+Math.floor(Math.random()*3);const chance=[.18,.31,.43,.52][phase],bomb=Math.random()<chance?Math.floor(Math.random()*count):-1;const slots=Array.from({length:count},(_,i)=>i).sort(()=>Math.random()-.5);const entries=slots.map((lane,i)=>({bomb:i===bomb,fruit:Math.floor(Math.random()*5),x:.09+.82*(lane+.5)/count+(Math.random()-.5)*.08,vx:(Math.random()-.5)*.07,apex:.65+Math.random()*.21}));arr.push({sec,entries});sec+=[1.4,1.15,.95,.82][phase]+Math.random()*.25}return arr}
function elapsed(now=performance.now()){return Math.max(0,(now-state.startAt)/1000)}
function updateHud(){label('score',state.score);label('time',state.seconds);label('misses',state.misses+'/3')}
async function begin(){
 if(state.starting||state.playing)return;resize();state.starting=true;
 const btn=$('play');btn.disabled=true;label('play','STARTING…');
 sound('start');
 let waves=null,roundId=null;
 try{const r=await Promise.race([(async()=>{await guest();try{return await request('start','POST',{width:Math.round(state.width),height:Math.round(state.height)})}catch(err){if(/session missing/i.test(err.message)){state.guest=null;remove('nothing-guest-v2');await guest();return request('start','POST',{width:Math.round(state.width),height:Math.round(state.height)})}throw err}})(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Network setup took too long')),4400))]);waves=r.waves;roundId=r.roundId}catch(e){console.warn('Playing offline; score cannot be submitted',e)}
 state.starting=false;btn.disabled=false;label('play','PLAY');
 state.waves=waves||localWaves();state.roundId=roundId;state.offline=!roundId;
 state.cursor=0;state.items=[];state.particles=[];state.halves=[];state.popups=[];state.trail=[];state.events=[];state.score=0;state.misses=0;state.combo=0;state.lastHit=-100;state.bomb=null;state.reason='';state.playing=false;state.drag=false;
 screen(null);$('hud').classList.add('visible');updateHud();
 for(const [text,delay] of [['3',0],['2',370],['1',740],['GO!',1110]])setTimeout(()=>{if(state.starting||state.playing)return;label('countdown',text);$('countdown').classList.add('visible')},delay);
 setTimeout(()=>{label('countdown','');$('countdown').classList.remove('visible');state.playing=true;state.startAt=performance.now();state.lastFrame=state.startAt;track('started');cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(frame)},1510);
}
function createItem(entry,waveIndex,slot,sec){
 const W=state.width,H=state.height,g=H*2.1;
 const vy=-Math.sqrt(2*g*(entry.apex*H+45));
 return {entry,waveIndex,slot,sec,r:entry.bomb?28:32,vy,g,x:entry.x*W,y:H+45,hit:false,missed:false,rotation:(Math.random()-.5)*.4,spin:(Math.random()-.5)*1.8};
}
function position(o,t){const d=t-o.sec;if(d<0)return;const W=state.width,H=state.height;o.x=o.entry.x*W+o.entry.vx*W*d;o.y=H+45+o.vy*d+.5*o.g*d*d;o.rotation+=o.spin*.016}
function splash(o){const col=o.entry.bomb?'#32242a':FRUITS[o.entry.fruit][1];for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,v=80+Math.random()*230;state.particles.push({x:o.x,y:o.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.36+Math.random()*.34,color:col})}if(!o.entry.bomb){for(const side of [-1,1])state.halves.push({x:o.x,y:o.y,vx:side*(95+Math.random()*80),vy:-80-Math.random()*100,rot:0,side,emoji:FRUITS[o.entry.fruit][0],life:.7})}if(state.particles.length>240)state.particles.splice(0,state.particles.length-240)}
function hitObjects(a,b){
 if(!state.playing||Math.hypot(b.x-a.x,b.y-a.y)<12)return;
 const now=elapsed();
 for(const o of state.items){if(o.hit||o.missed)continue;
  const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.y-a.y)*dy)/den));
  const distance=Math.hypot(o.x-(a.x+t*dx),o.y-(a.y+t*dy));
  if(distance>o.r+6)continue;
  o.hit=true;splash(o);
  if(o.entry.bomb){sound('bomb');pulse(60);state.bomb={wave:o.waveIndex,fruit:o.slot,at:now};endGame('bomb');return}
  const eventAt=Number(now.toFixed(3)),combo=eventAt-state.lastHit<.18?state.combo+1:1;state.combo=combo;state.lastHit=eventAt;
  const earned=10+(combo>=2?5:0);state.score+=earned;sound(combo>=3?'combo':'slice');pulse(13);
  state.popups.push({x:o.x,y:o.y-33,text:combo>=2?'COMBO '+combo+'  +'+earned:'+'+earned,life:.7});
  if(!state.offline)state.events.push({wave:o.waveIndex,fruit:o.slot,at:eventAt,x:Math.round(o.x),y:Math.round(o.y),x0:Math.round(a.x),y0:Math.round(a.y),x1:Math.round(b.x),y1:Math.round(b.y)});
  label('score',state.score);
 }
}
function frame(now){
 if(!state.playing)return;
 const dt=Math.min((now-state.lastFrame)/1000,.05);state.lastFrame=now;const sec=elapsed(now),W=state.width,H=state.height;
 if(sec>=state.seconds){endGame('time');return}
 while(state.cursor<state.waves.length&&state.waves[state.cursor].sec<=sec){const w=state.waves[state.cursor],idx=state.cursor++;w.entries.forEach((e,i)=>state.items.push(createItem(e,idx,i,w.sec)))}
 ctx.fillStyle='#fff0d4';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(247,212,167,.3)';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc((i*213+100)%W,(i*147+58)%H,15+(i%3)*6,0,Math.PI*2);ctx.fill()}
 for(const o of state.items){
  if(o.hit||o.missed)continue;position(o,sec);
  if(o.y>H+80&&sec>o.sec+.75){o.missed=true;if(!o.entry.bomb){state.misses++;sound('miss');label('misses',state.misses+'/3');if(state.misses>=3){endGame('misses');return}}continue}
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.rotation);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=(o.r*1.9)+'px "Apple Color Emoji","Segoe UI Emoji",serif';ctx.fillText(o.entry.bomb?'💣':FRUITS[o.entry.fruit][0],0,0);ctx.restore();
 }
 state.items=state.items.filter(o=>!o.hit&&!o.missed);
 for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=380*dt;ctx.globalAlpha=Math.max(0,Math.min(1,p.life*2));ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;state.particles=state.particles.filter(p=>p.life>0);
 for(const h of state.halves){h.life-=dt;h.x+=h.vx*dt;h.y+=h.vy*dt;h.vy+=500*dt;h.rot+=h.side*2.5*dt;ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,h.life*2));ctx.translate(h.x,h.y);ctx.rotate(h.rot);ctx.beginPath();if(h.side<0)ctx.rect(-42,-45,42,90);else ctx.rect(0,-45,42,90);ctx.clip();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='62px "Apple Color Emoji","Segoe UI Emoji",serif';ctx.fillText(h.emoji,0,0);ctx.restore()}state.halves=state.halves.filter(h=>h.life>0);
 for(const p of state.popups){p.life-=dt;p.y-=48*dt;ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,p.life*2));ctx.textAlign='center';ctx.font='900 18px Arial';ctx.lineWidth=4;ctx.strokeStyle='#fff6df';ctx.strokeText(p.text,p.x,p.y);ctx.fillStyle='#2b1b28';ctx.fillText(p.text,p.x,p.y);ctx.restore()}state.popups=state.popups.filter(p=>p.life>0);
 const recent=state.trail.filter(p=>now-p.t<140);state.trail=recent;if(recent.length>1){ctx.lineWidth=10;ctx.strokeStyle='#ff705c';ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();recent.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}
 label('time',Math.max(0,Math.ceil(state.seconds-sec)));state.raf=requestAnimationFrame(frame);
}
function point(e){return{x:e.clientX*state.width/Math.max(1,innerWidth),y:e.clientY*state.height/Math.max(1,innerHeight),t:performance.now()}}
canvas.addEventListener('pointerdown',e=>{if(!state.playing)return;state.drag=true;state.lastPointer=point(e);state.trail=[state.lastPointer];try{canvas.setPointerCapture(e.pointerId)}catch{}});
canvas.addEventListener('pointermove',e=>{if(!state.drag||!state.playing)return;const p=point(e);hitObjects(state.lastPointer,p);state.lastPointer=p;state.trail.push(p)});
function pointerUp(){state.drag=false;state.lastPointer=null}
canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
document.addEventListener('visibilitychange',()=>{if(!state.playing)return;if(document.hidden){state.pausedAt=performance.now();cancelAnimationFrame(state.raf);pointerUp()}else if(state.pausedAt){const now=performance.now();state.startAt+=now-state.pausedAt;state.pausedAt=0;state.lastFrame=now;state.raf=requestAnimationFrame(frame)}});
async function endGame(reason){
 if(!state.playing)return;const endAt=Math.min(45,elapsed());state.playing=false;cancelAnimationFrame(state.raf);state.reason=reason;track('ended');if(reason!=='bomb')sound(reason==='time'?'start':'miss');
 const previousBest=Number(getStored('nothing-local-best-v2')||0),best=Math.max(state.score,previousBest);save('nothing-local-best-v2',best);
 label('finalScore',state.score);label('best','Personal best: '+best);
 label('resultHeading',state.score>previousBest&&state.score>0?'You beat your personal best.':reason==='bomb'?'You hit a bomb.':reason==='misses'?'You missed three fruits.':"Time's up.");
 label('rankHint',state.offline?'This round was offline, so it cannot be ranked.':'');
 const thisRound=state.roundId?{roundId:state.roundId,score:state.score,events:state.events,endAt:Number(endAt.toFixed(3)),result:reason,bomb:state.bomb}:null;
 if(thisRound&&(!state.pending||thisRound.score>=state.pending.score))state.pending=thisRound;
 if(state.pending)save('nothing-pending-v2',state.pending);
 screen('end');
 if(state.name&&state.pending){label('rankHint','Saving your score…');try{const d=await submitScore();label('rankHint',d.pendingReview?'Score received. Being reviewed.':'Official rank #'+d.rank+' · Best '+d.best)}catch(e){label('rankHint','Score not saved yet. Open the leaderboard to try again.')}}
}
async function submitScore(){
 if(!state.pending||!state.guest)throw new Error('This round cannot be ranked.');
 const n=$('playerName').value.trim()||state.name;
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 ._-]{1,23}$/.test(n))throw new Error('Use 2–24 letters or numbers for your name.');
 const submitted=state.pending;
 const result=await request('submit','POST',{...submitted,name:n});
 state.name=n;save('nothing-name-v2',n);if(state.pending?.roundId===submitted.roundId){state.pending=null;remove('nothing-pending-v2')}track('claim_verified');state.profile={best:result.best,rank:result.rank,name:n};return result;
}
async function showBoard(){
 screen('board');state.showAll=false;label('boardMessage','Loading the leaderboard…');$('claim').hidden=!state.pending;label('claimStatus','');$('playerName').value=state.name;
 try{
  const [r,p]=await Promise.all([request('leaderboard','GET',null,false),state.guest?request('profile').catch(()=>null):Promise.resolve(null)]);
  state.ranking=r.top||[];state.cutoff=r.cutoff;state.profile=p||state.profile;renderBoard();label('boardMessage',r.cutoff!==null?'Top 100 cutoff: '+r.cutoff+' points. '+(state.profile?.best?'You need '+Math.max(0,r.cutoff+10-state.profile.best)+' more to move ahead of #100.':''):'The top 100 is still filling up.');
 }catch(e){state.ranking=[];state.cutoff=null;renderBoard();label('boardMessage','The leaderboard is temporarily unavailable. You can still play.')}
}
function renderBoard(){
 const root=$('ranking');root.replaceChildren();const header=document.createElement('div');header.className='rank-row header';
 for(const v of ['#','PLAYER','SCORE']){const el=document.createElement('span');el.textContent=v;header.append(el)}root.append(header);
 const list=state.ranking.slice(0,state.showAll?100:10);
 if(!list.length){const empty=document.createElement('div');empty.className='rank-empty';empty.textContent='No scores yet. Yours could be the first.';root.append(empty)}
 for(const entry of list){const row=document.createElement('div');row.className='rank-row'+(entry.playerId===state.guest?.playerId?' self':'');const rank=document.createElement('span'),name=document.createElement('span'),points=document.createElement('strong');rank.textContent=String(entry.rank);name.textContent=entry.name;points.textContent=String(entry.score);row.append(rank,name,points);root.append(row)}
 $('more').hidden=state.ranking.length<=10;label('more',state.showAll?'SHOW TOP 10':'SEE TOP 100');
 label('yourBest',state.profile?.best||getStored('nothing-local-best-v2')||'—');
 label('yourRank',state.profile?.rank?'#'+state.profile.rank:'—');
 label('boardNote',state.guest?'Scores stay tied to this browser. Clear browser data and your identity cannot be recovered.':'Play a round to join the leaderboard.');
}
$('claimForm').onsubmit=async e=>{e.preventDefault();track('claim_requested');const b=$('claimButton');b.disabled=true;label('claimStatus','Saving your score…');try{const result=await submitScore();$('claim').hidden=true;await showBoard();label('boardMessage',result.pendingReview?'Score saved and awaiting review.':'Saved. You are ranked #'+result.rank+'.')}catch(err){label('claimStatus',err.message||'Could not save the score. Try again.')}finally{b.disabled=false}};
$('more').onclick=()=>{state.showAll=!state.showAll;renderBoard()};
$('play').onclick=begin;$('again').onclick=begin;$('openBoard').onclick=showBoard;$('boardFromHome').onclick=showBoard;$('boardClose').onclick=()=>screen(state.score||state.reason?'end':'home');
$('backHome').onclick=()=>screen('home');
const challenge=Number(new URLSearchParams(location.search).get('challenge'));if(Number.isFinite(challenge)&&challenge>0&&challenge<10000)label('intro','Someone scored '+challenge+'. See if you can beat their score.');
function scoreLink(){const q=new URLSearchParams({challenge:String(state.score)});if(state.guest?.playerId)q.set('ref',state.guest.playerId);return location.origin+location.pathname+'?'+q.toString()}
$('share').onclick=async()=>{track('shared');const text='I scored '+state.score+' on the fruit game from After All. Can you beat it?';const url=scoreLink();if(navigator.share){try{await navigator.share({title:'A game from After All',text,url});return}catch(err){if(err.name==='AbortError')return}}try{await navigator.clipboard.writeText(text+' '+url);label('share','LINK COPIED');setTimeout(()=>label('share','SHARE YOUR SCORE'),1700)}catch{prompt('Copy your challenge',text+' '+url)}};
$('saveCard').onclick=()=>{const c=document.createElement('canvas');c.width=1080;c.height=1350;const p=c.getContext('2d');p.fillStyle='#fff0d4';p.fillRect(0,0,1080,1350);p.fillStyle='#f4d15e';p.beginPath();p.arc(1010,145,250,0,Math.PI*2);p.fill();p.fillStyle='#ffb6a5';p.beginPath();p.arc(90,1140,270,0,Math.PI*2);p.fill();p.fillStyle='#2b1b28';p.textAlign='center';p.font='900 40px Arial';p.fillText('AFTER ALL PRESENTS',540,170);p.font='900 64px Arial';p.fillText('MY SCORE',540,430);p.font='900 270px Arial';p.fillText(String(state.score),540,845);p.font='900 51px Arial';p.fillText('Can you beat it?',540,960);p.font='bold 35px Arial';p.fillText('becauseafterall.com',540,1170);try{const a=document.createElement('a');a.download='after-all-score-'+state.score+'.png';a.href=c.toDataURL('image/png');document.body.append(a);a.click();a.remove()}catch(err){report(err)}};
screen('home');
})();