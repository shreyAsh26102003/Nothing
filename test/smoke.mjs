import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const here=new URL('../',import.meta.url);
const html=readFileSync(new URL('index.html',here),'utf8');
const js=readFileSync(new URL('app.js',here),'utf8');
const css=readFileSync(new URL('styles.css',here),'utf8');
const api=readFileSync(new URL('supabase/functions/nothing-game/index.ts',here),'utf8');

test('browser application is syntactically valid and loaded as a defer script',()=>{
 new Script(js);
 assert.match(html,/<script src="\/app\.js" defer><\/script>/);
 assert.match(html,/<link rel="stylesheet" href="\/styles\.css">/);
 assert.ok(css.length>1000);
});
test('required screens and controls exist',()=>{
 for(const id of ['home','play','sound','game','hud','score','time','misses','end','finalScore','again','openBoard','board','ranking','playerName','claimForm','claimButton','share','saveCard','boardClose','boardFromHome','rankHint','claimStatus','yourRank','yourBest','countdown','brandFooter','backHome','more'])assert.match(html,new RegExp('id="'+id+'"'));
});
test('rules match 45 seconds and three misses',()=>{
 assert.match(html,/45 SECONDS · 3 MISSES/);
 assert.match(js,/missLimit:3,seconds:45/);
 assert.match(js,/state\.misses>=3/);assert.match(js,/result:reason/);
});
test('game retains earlier emoji-style fruit and varied bomb waves',()=>{
 for(const fruit of ['🥭','🍓','🍍','🍌','🍇'])assert.ok(js.includes(fruit));
 assert.match(api,/count=phase===0\?2\+/);
 assert.match(api,/\.52/);
 assert.match(js,/o\.entry\.bomb/);
});
test('email code is not required for leaderboard',()=>{
 assert.doesNotMatch(html,/type="email"|verification code|one-time-code/);
 assert.match(js,/request\('register'/);
 assert.match(js,/request\('submit'/);
 assert.match(api,/nothing_guest_scores/);
});
test('leaderboard, score challenge, and card are implemented',()=>{
 assert.match(js,/request\('leaderboard'/);
 assert.match(js,/URLSearchParams\(\{challenge:/);
 assert.match(js,/toDataURL\('image\/png'\)/);
 assert.match(html,/id="share"/);
});
test('data collection is minimal, no private service keys in frontend',()=>{
 assert.doesNotMatch(js,/service_role|SUPABASE_SERVICE_ROLE_KEY|password/);
 assert.doesNotMatch(html,/<input[^>]*type="email"/i);
 assert.match(api,/secret_hash/);
});

test('production registration uses a defined environment-backed rate-limit salt',()=>{
 assert.match(api,/hash\('nothing-register:'\+ip\+':'\+\(Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
 assert.doesNotMatch(api, /key\.slice\(0,16\)/);
});
test('leaderboard uses atomic submission, swipe proof and moderated ranks',()=>{
 assert.match(api,/nothing_commit_round/);
 assert.match(api,/nothing_top_scores/);
 assert.match(api,/e\.x0/);
 assert.match(api,/e\.y1/);
 assert.match(js,/x0:Math\.round\(a\.x\)/);
 assert.match(js,/x1:Math\.round\(b\.x\)/);
});
test('data requests, optional updates and guest deletion are wired',()=>{
 for(const page of ['updates.html','privacy.html']){
  const content=readFileSync(new URL(page,here),'utf8');
  for(const script of content.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script[1]);
 }
 assert.match(api,/action==='delete_profile'/);
 assert.match(api,/action==='export_profile'/);
 assert.match(api,/action==='unsubscribe'/);
});

test('After All teaser is poetic, accessible, and separate from game sign-up',()=>{
 const teaser=readFileSync(new URL('updates.html',here),'utf8');
 for(const line of ['Before anyone made a treat','Fruit has been doing just fine','What if the original indulgence','had a second act?','KEEP ME POSTED'])assert.ok(teaser.includes(line));
 assert.match(teaser,/id="updatesForm"/);
 assert.match(teaser,/id="consent" type="checkbox"/);
 assert.match(teaser,/id="leaveForm"/);
 assert.match(teaser,/https:\/\/becauseafterall\.com\/social-card\.svg/);
 assert.match(html,/https:\/\/becauseafterall\.com\/social-card\.svg/);
});

test('email confirmation is server-side, consent-based and not implicitly verified',()=>{
 const page=readFileSync(new URL('email.html',here),'utf8');
 const updates=readFileSync(new URL('updates.html',here),'utf8');
 assert.match(page,/confirm_email/);
 assert.match(page,/unsubscribe_email/);
 assert.match(updates,/id="consent"/);
 assert.match(updates,/data\.emailSent/);
 assert.match(api,/RESEND_API_KEY/);
 assert.match(api,/AFTER_ALL_EMAIL_FROM/);
 assert.match(api,/attemptConfirmation/);
 assert.match(api,/confirm_email/);
 assert.match(api,/confirmation_token_hash/);
 assert.match(api,/confirmation_expires_at/);
 assert.doesNotMatch(updates,/RESEND_API_KEY/);
 assert.doesNotMatch(page,/RESEND_API_KEY/);
 for(const content of [page,updates]){
   const scripts=[...content.matchAll(/<script>([\s\S]*?)<\/script>/g)];
   assert.ok(scripts.length>0);
   for(const m of scripts)new Script(m[1]);
 }
});
