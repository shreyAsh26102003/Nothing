import assert from 'node:assert/strict';

const base='https://becauseafterall.com';
const api='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';

async function probe(label,url,check){
  const started=Date.now();
  const r=await fetch(url,{
    signal:AbortSignal.timeout(10000),
    headers:{Accept:'*/*'},
    redirect:'follow'
  });
  assert.ok(r.ok,label+' returned HTTP '+r.status);
  const body=await r.text();
  assert.ok(check(body,r),label+' content failed validation');
  console.log('PASS',label,Date.now()-started+'ms');
}
let failed=false;
const checks=[
  ['game homepage',base+'/',(body,r)=>r.headers.get('content-type')?.includes('text/html')&&body.includes('id="play"')&&body.includes('/app.js')],
  ['game JS',base+'/app.js',body=>body.includes('state.misses>=3')&&body.includes('hitObjects')],
  ['game CSS',base+'/styles.css',(body,r)=>r.headers.get('content-type')?.includes('text/css')&&body.includes('--cream')],
  ['updates form',base+'/updates.html',body=>body.includes('id="updatesForm"')],
  ['email confirmation page',base+'/email.html',body=>body.includes('confirm_email')&&body.includes('unsubscribe_email')],
  ['backend health',api+'?action=health',body=>{try{return JSON.parse(body).ok===true}catch{return false}}],
  ['leaderboard API',api+'?action=leaderboard',body=>{try{return Array.isArray(JSON.parse(body).top)}catch{return false}}],
];
for(const [label,url,check] of checks){
  try{await probe(label,url,check)}
  catch(e){console.error('FAIL',label,e.message);failed=true}
}
if(failed)process.exitCode=1;
else console.log('Live site and API reachable; checks are independent of presentation copy or assets');
