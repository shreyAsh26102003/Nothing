import assert from 'node:assert/strict';

// Production-backed disposable integration test. Never print or persist guest bearer tokens.
const ROOT='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let guest=null;
async function api(action,method='GET',body=null){
 const response=await fetch(ROOT+'?action='+action,{
  method,headers:{'Content-Type':'application/json',...(guest?.token?{Authorization:'Bearer '+guest.token}:{})},
  body:body===null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)
 });
 let payload;try{payload=await response.json()}catch{throw Error(action+' was not JSON (HTTP '+response.status+')')}
 if(!response.ok)throw Error(action+' failed: HTTP '+response.status+' '+JSON.stringify(payload));
 return payload;
}
function expectedLanding(wave,entry,height){
 const g=height*2.1;
 const vy=-Math.sqrt(2*g*(entry.apex*height+45));
 return wave.sec+(-vy+Math.sqrt(vy*vy+2*g*35))/g;
}
async function test(){
 const health=await api('health');assert.equal(health.ok,true);
 guest=await api('register','POST',{});
 assert.ok(guest.token&&guest.playerId);
 const before=Date.now();
 const round=await api('start','POST',{width:375,height:812});
 assert.ok(round.roundId&&round.waves.length>6);
 const missed=round.waves.flatMap(w=>w.entries.filter(e=>!e.bomb).map(e=>expectedLanding(w,e,812))).sort((a,b)=>a-b);
 assert.ok(missed.length>=3);
 const ending=Number((missed[2]+0.10).toFixed(3));
 const remaining=Math.max(0,ending*1000-(Date.now()-before)+850);
 await sleep(remaining);
 const saved=await api('submit','POST',{roundId:round.roundId,score:0,endAt:ending,result:'misses',events:[]});
 assert.equal(saved.accepted,true);
 assert.equal(saved.best,0);
 const profile=await api('profile');
 assert.equal(profile.best,0);
 const list=await api('leaderboard');
 assert.ok(list.top.some(p=>p.playerId===guest.playerId),'temporary test entry not visible');
 const exports=await api('export_profile');
 assert.ok(exports.rounds.some(r=>r.id===round.roundId),'export missing test round');
 const email='ci-'+guest.playerId+'@example.invalid';
 assert.equal((await api('waitlist','POST',{email,consent:true})).accepted,true);
 assert.equal((await api('unsubscribe','POST',{email})).ok,true);
 assert.equal((await api('waitlist','POST',{email,consent:true})).resubscribed,true);
 let replayRejected=false;
 try{await api('submit','POST',{roundId:round.roundId,score:0,endAt:ending,result:'misses',events:[]})}catch(e){replayRejected=/already claimed|expired/i.test(e.message)}
 assert.ok(replayRejected,'repeat score claim must be rejected');
 console.log('PASS complete LIVE score journey: register → round → three misses → save → rank → export → consent → opt-out → re-consent → replay prevention');
}
let passed=false;
try{await test();passed=true}catch(e){console.error('LIVE E2E FAILURE:',e);process.exitCode=1}finally{
 if(guest?.token){try{
  await api('delete_profile','POST',{confirm:'DELETE'});
  const after=await api('leaderboard');
  assert.ok(!after.top.some(p=>p.playerId===guest.playerId),'test player still on leaderboard after deletion');
  console.log('PASS cleanup: guest player and temporary ranking removed');
 }catch(e){console.error('CLEANUP FAILURE:',e);process.exitCode=1}}
 if(!passed)console.error('See steps above; this is a production-backed test and should not be considered green.');
}
