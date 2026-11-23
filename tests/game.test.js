import test from 'node:test';import assert from 'node:assert/strict';import {difficulty,shareText} from '../game-logic.js';
test('difficulty grows with elapsed time',()=>{const a=[0,12,25,40].map(difficulty);for(let i=1;i<a.length;i++){assert.ok(a[i].bombChance>a[i-1].bombChance);assert.ok(a[i].interval<a[i-1].interval);assert.ok(a[i].count>=a[i-1].count)}});
test('difficulty caps at 45 seconds',()=>assert.deepEqual(difficulty(100),difficulty(45)));
test('challenge includes score and link',()=>assert.match(shareText(240,'https://nothing.becauseafterall.com'),/I scored 240 playing Nothing\.\nThink you can beat that\?\nhttps:\/\/nothing/));
