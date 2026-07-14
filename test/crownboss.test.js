import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { overlaps } from '../src/geometry.js';

const tick=(game,frames=1)=>{for(let frame=0;frame<frames;frame++)game.update(1/60);};
const press=(game,key)=>{game.setInput({[key]:true});tick(game);game.setInput({[key]:false});tick(game);};

test('entering the upper Crownworks chamber seals its climb shaft',()=>{
  const game=new Game(),arena=game.crownBossArena,boss=game.crownBoss();game.enemies=[boss];Object.assign(game.player,{x:8600,y:arena.floorY-game.player.h,onGround:true});game.updateCrownBossArena(1);
  assert.equal(arena.active,true);assert.equal(boss.active,true);assert.equal(game.crownBossGates().length,2);assert.ok(game.crownBossGates().every(gate=>gate.y+gate.h===arena.floorY+arena.leftGate.h));
});

test('the Crown Dynamo relocates between high perches and cycles three attacks',()=>{
  const game=new Game(),arena=game.crownBossArena,boss=game.crownBoss();game.enemies=[boss];arena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=0;Object.assign(game.player,{x:8800,y:arena.floorY-game.player.h});const moves=new Set(),anchors=new Set();
  for(let frame=0;frame<900;frame++){game.updateCrownBoss(boss,1/60);game.updateBossHazards(1/60);moves.add(boss.bossMove);if(boss.bossMove==='crownExpose')anchors.add(`${boss.x},${boss.y}`);}
  assert.equal(anchors.size,2);assert.ok(moves.has('crownSweepWindup'));assert.ok(moves.has('crownColumnWindup'));assert.ok(moves.has('crownVolleyWindup'));assert.ok(game.bossProjectiles.length>0||moves.has('crownRecover'));
});

test('the Crown Dynamo must be reached from its matching platform to take damage',()=>{
  const game=new Game(),boss=game.crownBoss(),arena=game.crownBossArena;game.enemies=[boss];arena.active=true;Object.assign(boss,{x:arena.anchors[0].x,y:arena.anchors[0].y,bossMove:'crownExpose'});
  Object.assign(game.player,{x:8530,y:arena.floorY-game.player.h,aimX:0,aimY:-1,attackAimX:0,attackAimY:-1,attackHits:new Set()});const floorBox=game.attackBox();assert.equal(overlaps(floorBox,boss),false);game.resolvePrimaryAttack();assert.equal(boss.health,boss.maxHealth);
  const perch=game.platforms.find(block=>block.id==='crown-upper-west-perch');Object.assign(game.player,{x:8530,y:perch.y-game.player.h,attackHits:new Set()});assert.equal(overlaps(game.attackBox(),boss),true);game.resolvePrimaryAttack();assert.ok(boss.health<boss.maxHealth);
  boss.bossMove='crownSweepWindup';game.player.attackHits=new Set();game.resolvePrimaryAttack();assert.equal(boss.health,boss.maxHealth-game.player.primaryDamage,'armored attack phases should ignore slash damage');
});

test('defeating the Crown Dynamo releases a charged Field Core',()=>{
  const game=new Game(),boss=game.crownBoss(),pickup=game.pickups.find(item=>item.id==='field-core');game.crownBossArena.active=true;boss.bossMove='crownExpose';boss.health=1;assert.equal(game.pickupAvailable(pickup),false);game.hitTarget(boss,1,new Set(),0);
  assert.equal(game.crownBossArena.cleared,true);assert.equal(game.crownBossGates().length,0);assert.equal(game.pickupAvailable(pickup),true);Object.assign(game.player,{x:pickup.x,y:pickup.y,electricity:0});game.updatePickups();assert.equal(game.player.abilities.field,true);assert.equal(game.player.electricity,40);
});

test('only the circular Field attack opens the Crownworks annex seal',()=>{
  const game=new Game(),seal=game.junkPiles.find(pile=>pile.id==='crown-field-seal');game.enemies=[];Object.assign(game.player,{x:8405,y:-1486,aimX:-1,aimY:0,attackHits:new Set()});game.resolvePrimaryAttack();assert.equal(seal.dead,false);
  game.unlockAbility('field');game.player.electricity=40;press(game,'field');assert.equal(seal.dead,true);assert.equal(game.player.electricity,0);
});
