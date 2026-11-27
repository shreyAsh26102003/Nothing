// Disposable live integration check. Does NOT send a real message.
// It runs only when the sender is not configured to prevent mail to a test address.
import assert from 'node:assert/strict';

const base='https://scgihelnwihjckzzvxyc.supabase.co/functions/v1/nothing-game';
let token=null,playerId=null;
async function call(action,{method='GET',body,secure=true}={}){
 const res=await fetch(base+'?action='+action,{method,
  headers:{'Content-Type':'application/json',...(secure&&token?{Authorization:'Bearer '+token}:{})},
  ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
 const data=await res.json();return {ok:res.ok,status:res.status,data};
}
try {
 const status=await call('email_status',{secure:false});
 assert.equal(status.ok,true);
 assert.equal(typeof status.data.enabled,'boolean');
 if(status.data.enabled){console.log('SKIP: Real email sender configured. Refusing to send to synthetic test inbox.');}
 else {
  const reg=await call('register',{method:'POST',body:{},secure:false});
  assert.equal(reg.ok,true);token=reg.data.token;playerId=reg.data.playerId;
  assert.ok(token&&playerId);
  const email='nothing-capture-test-'+crypto.randomUUID().slice(0,8)+'@example.com';
  const withoutConsent=await call('waitlist',{method:'POST',body:{email,consent:false}});
  assert.equal(withoutConsent.status,400);
  const withConsent=await call('waitlist',{method:'POST',body:{email,consent:true}});
  assert.equal(withConsent.ok,true,JSON.stringify(withConsent.data));
  assert.equal(withConsent.data.accepted,true);
  assert.equal(withConsent.data.verified,false);
  assert.equal(withConsent.data.emailSent,false);
  assert.equal(withConsent.data.delivery,'not_configured');
  const badToken=await call('confirm_email',{method:'POST',body:{token:'invalid'},secure:false});
  assert.equal(badToken.status,400);
  console.log('PASS: consent is required, signup saved unverified, email correctly queued pending provider setup');
 }
} finally {
 if(token){
  const del=await call('delete_profile',{method:'POST',body:{confirm:'DELETE'}});
  assert.equal(del.ok,true,'Failed to clean disposable tester');
  assert.equal(del.data.deleted,true);
  console.log('PASS: disposable tester and contact removed');
 }
}
