import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};

test('the Vault exit is sealed before the Abyss Warden is ever activated',()=>{
  const game=new Game(),arena=game.vaultBossArena,gates=game.vaultBossGates();assert.equal(arena.active,false);assert.equal(gates.length,1);assert.equal(gates[0].side,'exit');assert.ok(gates[0].h>=350);assert.equal(gates[0].y+gates[0].h,arena.floorY);
  Object.assign(game.player,{x:gates[0].x+gates[0].w+8,y:arena.floorY-game.player.h,vx:-500,vy:0});game.moveActor(game.player,.1,true);assert.ok(game.player.x>=gates[0].x+gates[0].w);
});

test('dropping into the Vault activates a full boss and closes both sides',()=>{
  const game=new Game(),arena=game.vaultBossArena,boss=game.vaultBoss();game.enemies=[boss];Object.assign(game.player,{x:arena.x+70,y:arena.floorY-game.player.h,vx:0,vy:0});tick(game,25);
  assert.equal(arena.active,true);assert.equal(boss.active,true);assert.ok(arena.leftGateProgress>.95);assert.equal(game.vaultBossGates().length,2);
});

test('the Abyss Warden cycles through charge, leap shockwave, and five-bolt volley',()=>{
  const game=new Game(),boss=game.vaultBoss();game.vaultBossArena.active=true;boss.bossMove='idle';boss.bossTimer=0;game.player.x=2920;game.player.y=game.vaultBossArena.floorY-game.player.h;const moves=new Set();let sawShockwave=false,maxProjectiles=0;
  for(let frame=0;frame<720;frame++){game.updateVaultBoss(boss,1/60);moves.add(boss.bossMove);sawShockwave||=Boolean(game.bossShockwave);maxProjectiles=Math.max(maxProjectiles,game.bossProjectiles.length);}
  assert.ok(moves.has('wardenCharge'));assert.ok(moves.has('wardenLeap'));assert.equal(sawShockwave,true);assert.ok(maxProjectiles>=5);
});

test('defeating the Abyss Warden opens the full exit and releases Volt Jab',()=>{
  const game=new Game(),boss=game.vaultBoss(),pickup=game.pickups.find(item=>item.id==='volt-core');game.vaultBossArena.active=true;game.vaultBossArena.leftGateProgress=1;boss.health=1;assert.equal(game.pickupAvailable(pickup),false);game.hitTarget(boss,1,new Set(),0);
  assert.equal(boss.dead,true);assert.equal(game.vaultBossArena.cleared,true);assert.equal(game.player.scrap,game.vaultBossArena.rewardScrap);assert.equal(game.vaultBossGates().length,0);assert.equal(game.pickupAvailable(pickup),true);
});
