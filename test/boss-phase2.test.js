import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const enterPhaseTwo=(game,boss)=>{boss.health=boss.maxHealth/2;assert.equal(game.updateBossPhase(boss),2);assert.equal(boss.phase,2);assert.equal(game.rewardToast.text,'PHASE 2');};

test('Heavy Core phase two fires a faster five-shot volley',()=>{
  const game=new Game(),boss=game.boss();enterPhaseTwo(game,boss);game.spawnBossVolley(boss);
  assert.equal(game.bossProjectiles.length,5);assert.ok(game.bossProjectiles.every(bolt=>Math.hypot(bolt.vx,bolt.vy)>280));
});

test('Abyss Warden phase two fires a faster seven-bolt fan',()=>{
  const game=new Game(),boss=game.vaultBoss();enterPhaseTwo(game,boss);game.spawnVaultVolley(boss);
  assert.equal(game.bossProjectiles.length,7);assert.ok(game.bossProjectiles.every(bolt=>Math.hypot(bolt.vx,bolt.vy)>250));
});

test('Rift Stalker phase two fires two faster tracking bolts without explosions',()=>{
  const game=new Game(),boss=game.depthBoss();enterPhaseTwo(game,boss);game.spawnDepthTracker(boss);
  assert.equal(game.bossProjectiles.length,2);assert.ok(game.bossProjectiles.every(bolt=>bolt.speed===600&&bolt.trackingTime===.6&&bolt.explosive===undefined));
});

test('Crown Dynamo phase two doubles its sweep hazard and fires six bolts',()=>{
  const game=new Game(),boss=game.crownBoss();enterPhaseTwo(game,boss);game.spawnCrownVolley(boss);assert.equal(game.bossProjectiles.length,6);
  game.crownBossArena.active=true;Object.assign(boss,{bossMove:'crownSweepWindup',bossTimer:0,crownTargetX:8800});game.updateCrownBoss(boss,1/60);assert.deepEqual(new Set(game.crownHazards.map(hazard=>hazard.type)),new Set(['sweep','column']));
});

test('Cache Scrapper phase two uses the upgraded health pool and overdrive charge',()=>{
  const game=new Game(),arena=game.miniBossArenas[0],boss=game.miniBoss(arena.id);assert.equal(boss.maxHealth,30);arena.active=true;enterPhaseTwo(game,boss);Object.assign(boss,{chargeTime:.2,chargeDirection:1,onGround:true});game.updateMiniBoss(boss,1/60);assert.equal(boss.vx,315);
});
