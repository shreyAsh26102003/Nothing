import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname, resolve, sep } from 'node:path';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const root=resolve(new URL('../',import.meta.url).pathname);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
  try {
    let pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/')pathname='/index.html';
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep))throw Error('Path denied');
    const content=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(content);
  }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port;
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>{try{return !!process.binding('fs').internalModuleStat(p)}catch{return false}})||'google-chrome';
const profile=await mkdtemp(join(tmpdir(),'nothing-chrome-'));
const debugPort=19223;
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const pending=new Map();let ws,seq=0;let errors=[];
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function setup(){
  let target;
  for(let i=0;i<75;i++){try{const entries=await json('http://127.0.0.1:'+debugPort+'/json/list');target=entries.find(t=>t.type==='page');if(target)break}catch{}await delay(120)}
  assert.ok(target,'Chrome DevTools did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};
  await send('Page.enable');await send('Runtime.enable');
}
function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function evalJS(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value}
async function waitFor(fn,ms=14000){const start=Date.now();while(Date.now()-start<ms){const value=await evalJS(fn);if(value)return value;await delay(150)}throw Error('Timed out: '+fn)}
try{
 await setup();
 await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:2,mobile:true});
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
 await waitFor("Boolean(document.getElementById('play')?.onclick)");
 assert.equal(await evalJS("document.querySelector('#misses').textContent"),'0/3');
 await evalJS("document.querySelector('#play').click()");
 await waitFor("document.querySelector('#hud').classList.contains('visible')",13000);
 await waitFor("Number(document.querySelector('#time').textContent)<45",6000);
 await waitFor("!document.querySelector('#end').hidden",13000);
 assert.ok(await evalJS("!document.querySelector('#end').hidden"),'end screen visible');
 assert.ok(await evalJS("Boolean(document.querySelector('#again').onclick)"),'replay wired');
 await evalJS("document.querySelector('#openBoard').click()");
 await waitFor("!document.querySelector('#board').hidden",4000);
 assert.ok(await evalJS("document.querySelector('#claimForm')!==null"),'leaderboard name form exists');
 await evalJS("document.querySelector('#boardClose').click();document.querySelector('#again').click()");
 await waitFor("document.querySelector('#hud').classList.contains('visible')",13000);
 assert.deepEqual(errors,[], 'JavaScript exceptions');
 console.log('CHROMIUM MOBILE SMOKE PASSED: play, timer, three misses, game-over, leaderboard, replay');
}catch(e){console.error('CHROMIUM TEST FAILED',e);process.exitCode=1}finally{
 try{ws?.close()}catch{}child.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 await rm(profile,{recursive:true,force:true});
}
