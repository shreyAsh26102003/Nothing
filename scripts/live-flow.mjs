// One-off disposable end-to-end score submission test.
// Creates a test guest, waits for exactly three missed fruits, submits a score,
// verifies leaderboard/profile, then deletes the test guest in finally.
// This touches a live Supabase project but never changes real player records.
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const endpoint='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';
let token=null,guest=null,round=null,deleted=false;
async function call(action,{method='GET',body,secure=true}={}){
 const r=await fetch(endpoint+'?action='+action,{
  method,headers:{'Content-Type':'application/json',...(secure&&token?{Authorization:'Bearer '+token}:{})},
  ...(body?{body:JSON.stringify(body)}:{}),
  signal:AbortSignal.timeout(12000)
 });
 const data=await r.json();
 if(!r.ok)throw Error(action+' HTTP '+r.status+': '+(data.error||'unknown'));
 return data;
}
function landing(entry,height){
 const g=height*2.1,vy=-Math.sqrt(2*g*(entry.apex*height+45));
 return(-vy+Math.sqrt(vy*vy+2*g*35))/g;
}
try{
 const health=await call('health',{secure:false});
 assert.equal(health.ok,true,'API must be healthy');
 guest=await call('register',{method:'POST',body:{},secure:false});token=guest.token;
 assert.ok(token?.length>35);
 const width=390,height=812;
 round=await call('start',{method:'POST',body:{width,height}});
 assert.ok(round?.roundId&&round.waves?.length);
 const landings=[];
 for(const wave of round.waves)for(const item of wave.entries)if(!item.bomb)landings.push(wave.sec+landing(item,height));
 landings.sort((a,b)=>a-b);
 const thirdMiss=landings[2];
 assert.ok(thirdMiss>.8&&thirdMiss<45);
 // Wait until the server has seen enough elapsed time, including network slack.
 const elapsed=(Date.now()-Date.parse(round.startedAt))/1000;
 await delay(Math.max(0,(thirdMiss+0.5-elapsed)*1000));
 const endAt=Number(thirdMiss.toFixed(3));
 const accepted=await call('submit',{method:'POST',body:{name:'NothingQA',roundId:round.roundId,score:0,events:[],endAt,result:'misses',bomb:null}});
 assert.equal(accepted.accepted,true,'score should be accepted');
 assert.equal(accepted.best,0,'score arithmetic should be preserved');
 const profile=await call('profile');
 assert.equal(profile.best,0,'score should be queryable after submission');
 const board=await call('leaderboard',{secure:false});
 assert.ok(Array.isArray(board.top));
 assert.ok(board.top.some(p=>p.playerId===guest.playerId),'test guest should temporarily appear on leaderboard');
 console.log('PASS: register -> start -> 3 missed fruits -> submit -> profile -> leaderboard');
}finally{
 if(token){
  try{const result=await call('delete_profile',{method:'POST',body:{confirm:'DELETE'}});deleted=result.deleted===true;assert.equal(deleted,true,'disposable user must be deleted');console.log('PASS: disposable test guest deleted')}
  catch(e){console.error('CRITICAL: disposable test guest cleanup failed:',e.message);process.exitCode=1}
 }
}
