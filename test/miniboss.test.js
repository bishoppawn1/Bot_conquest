import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { ABILITY_COSTS } from '../src/combat.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};

test('entering the optional Drift cache activates its mini boss and reward gate',()=>{
  const game=new Game(),arena=game.miniBossArenas[0],miniBoss=game.miniBoss(arena.id);game.enemies=[miniBoss];
  Object.assign(game.player,{x:arena.x+80,y:arena.floorY-game.player.h,vx:0,vy:0});tick(game,25);
  assert.equal(arena.active,true);assert.equal(miniBoss.active,true);assert.ok(arena.gateProgress>.95);
  assert.equal(game.miniBossGates().length,1);
});

test('the cache mini boss cannot be damaged before its optional room activates',()=>{
  const game=new Game(),arena=game.miniBossArenas[0],miniBoss=game.miniBoss(arena.id);game.enemies=[miniBoss];
  Object.assign(game.player,{x:miniBoss.x-50,y:miniBoss.y,aimX:1,aimY:0,attackHits:new Set()});game.resolvePrimaryAttack();
  assert.equal(miniBoss.health,miniBoss.maxHealth);
  arena.active=true;game.player.attackHits=new Set();game.resolvePrimaryAttack();assert.equal(miniBoss.health,miniBoss.maxHealth-1);
});

test('the active mini-boss gate prevents leaving the room',()=>{
  const game=new Game(),arena=game.miniBossArenas[0];arena.active=true;arena.gateProgress=1;
  const gate=game.miniBossGates()[0];Object.assign(game.player,{x:gate.x-game.player.w-8,y:arena.floorY-game.player.h,vx:500,vy:0});
  game.moveActor(game.player,.1,true);assert.ok(game.player.x+game.player.w<=gate.x);
});

test('defeating the mini boss awards scrap and retracts its gate',()=>{
  const game=new Game(),arena=game.miniBossArenas[0],miniBoss=game.miniBoss(arena.id);arena.active=true;arena.gateProgress=1;miniBoss.health=1;
  game.hitTarget(miniBoss,1,new Set(),0);
  assert.equal(miniBoss.dead,true);assert.equal(arena.cleared,true);assert.equal(game.player.scrap,arena.rewardScrap);
  assert.equal(game.rewardToast.text,`+${arena.rewardScrap} SCRAP`);
  for(let frame=0;frame<20;frame++)game.updateMiniBossArenas(1/60);
  assert.equal(game.miniBossGates().length,0);
});

test('the tutorial conduit provides exactly enough power to break the Volt Jab seal',()=>{
  const game=new Game(),conduit=game.conduits.find(item=>item.tutorial==='electricJab'),seal=game.junkPiles.find(item=>item.id==='vault-volt-seal');
  game.hitTarget(seal,1,new Set(),0);assert.equal(seal.health,2);
  for(let hit=0;hit<6;hit++)game.hitTarget(conduit,0,new Set());
  assert.equal(game.player.electricity,ABILITY_COSTS.electricJab);
  game.unlockAbility('electricJab');Object.assign(game.player,{x:3290,y:784,aimX:1,aimY:0});
  assert.equal(game.startSpecial('electricJab'),true);game.updateCombat();
  assert.equal(seal.dead,true);
});
