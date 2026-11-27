import assert from 'node:assert/strict';

const base='https://becauseafterall.com';
const api='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';

async function probe(label,url,check){
  const started=Date.now();
  const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'Accept':'*/*'},redirect:'follow'});
  assert.ok(r.ok,label+' returned HTTP '+r.status);
  const body=await r.text();
  assert.ok(check(body,r),label+' content failed validation');
  console.log('PASS',label,Date.now()-started+'ms');
}
let failed=false;
for(const [label,url,check] of [
 ['game HTML',base+'/',body=>body.includes('AFTER ALL PRESENTS')&&body.includes('/app.js')&&!body.includes('Nothing.')],
 ['game JS',base+'/app.js',body=>body.includes('state.misses>=3')&&body.includes('hitObjects')],
 ['game CSS',base+'/styles.css',body=>body.includes('--cream')],
 ['privacy',base+'/privacy.html',body=>body.includes('<h2>Privacy</h2>')],
 ['updates',base+'/updates.html',body=>body.includes('updatesForm')],
 ['email confirmation page',base+'/email.html',body=>body.includes('confirm_email')&&body.includes('unsubscribe_email')],
 ['API health',api+'?action=health',body=>{try{return JSON.parse(body).ok===true}catch{return false}}],
 ['email configuration status',api+'?action=email_status',body=>{try{return typeof JSON.parse(body).enabled==='boolean'}catch{return false}}],
 ['leaderboard API',api+'?action=leaderboard',body=>{try{return Array.isArray(JSON.parse(body).top)}catch{return false}}],
]){
 try{await probe(label,url,check)}catch(e){console.error('FAIL',label,e.message);failed=true}
}
if(failed)process.exitCode=1;else console.log('Everything reachable and healthy');
