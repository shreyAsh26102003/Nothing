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
 assert.match(js,/state\.misses>=3/);
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
 assert.match(js,/\?challenge=/);
 assert.match(js,/toDataURL\('image\/png'\)/);
 assert.match(html,/id="share"/);
});
test('data collection is minimal, no private service keys in frontend',()=>{
 assert.doesNotMatch(js,/service_role|SUPABASE_SERVICE_ROLE_KEY|password/);
 assert.doesNotMatch(html,/<input[^>]*type="email"/i);
 assert.match(api,/secret_hash/);
});
