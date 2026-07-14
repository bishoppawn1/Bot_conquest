import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const enterPhaseTwo=(game,boss)=>{boss.health=boss.maxHealth/2;assert.equal(game.updateBossPhase(boss),2);assert.equal(boss.phase,2);assert.equal(game.rewardToast.text,'PHASE 2');};

test('phase two triggers once without resetting an active boss attack timer',()=>{
  const game=new Game(),boss=game.boss();game.bossArena.active=true;Object.assign(boss,{health:boss.maxHealth/2,bossMove:'bossCharge',bossTimer:.2,chargeDirection:1,onGround:true});let bursts=0;game.burst=()=>bursts++;
  game.updateBoss(boss,1/60);assert.equal(boss.phase,2);assert.equal(bursts,1);assert.ok(boss.bossTimer<.2);assert.equal(boss.vx,340);assert.equal(game.enemyTargetable(boss),false);
  Object.assign(game.player,{x:boss.x-70,y:boss.y+20,aimX:1,aimY:0,attackAimX:1,attackAimY:0,attackHits:new Set()});const shieldedHealth=boss.health;game.resolvePrimaryAttack();assert.equal(boss.health,shieldedHealth);
  for(let frame=0;frame<50;frame++)game.updateBoss(boss,1/60);assert.equal(bursts,1);assert.equal(game.enemyTargetable(boss),true);
});

test('every boss continues its active movement as it crosses into phase two',()=>{
  const cases=[
    {setup:game=>{game.bossArena.active=true;const boss=game.boss();Object.assign(boss,{bossMove:'bossCharge',bossTimer:.2,chargeDirection:1,onGround:true});return[boss,()=>game.updateBoss(boss,1/60),()=>boss.vx===340];}},
    {setup:game=>{game.vaultBossArena.active=true;const boss=game.vaultBoss();Object.assign(boss,{bossMove:'wardenCharge',bossTimer:.2,chargeDirection:1,onGround:true});return[boss,()=>game.updateVaultBoss(boss,1/60),()=>boss.vx===315];}},
    {setup:game=>{game.depthBossArena.active=true;const boss=game.depthBoss();Object.assign(boss,{bossMove:'stalkerDash',bossTimer:.2,chargeDirection:1,onGround:true});return[boss,()=>game.updateDepthBoss(boss,1/60),()=>boss.vx===680];}},
    {setup:game=>{game.crownBossArena.active=true;const boss=game.crownBoss();Object.assign(boss,{bossMove:'crownRelocate',bossTimer:.01,pendingAnchor:1});return[boss,()=>game.updateCrownBoss(boss,1/60),()=>boss.bossMove==='crownExpose'&&boss.x===game.crownBossArena.anchors[1].x];}},
    {setup:game=>{const arena=game.miniBossArenas[0],boss=game.miniBoss(arena.id);arena.active=true;Object.assign(boss,{chargeTime:.2,chargeDirection:1,onGround:true});return[boss,()=>game.updateMiniBoss(boss,1/60),()=>boss.vx===315];}}
  ];
  for(const entry of cases){const game=new Game(),[boss,update,moved]=entry.setup(game);boss.health=boss.maxHealth/2;update();assert.equal(boss.phase,2);assert.equal(moved(),true,`${boss.name??boss.type} stalled during its phase transition`);}
});

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
