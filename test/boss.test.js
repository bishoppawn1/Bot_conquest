import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { SCRAP_VALUES } from '../src/combat.js';

const tick=(game,count=1)=>{for(let index=0;index<count;index++)game.update(1/60);};

test('entering the boss arena drops solid gates on both sides',()=>{
  const game=new Game(),boss=game.boss();game.enemies=[boss];game.player.x=game.bossArena.triggerX+20;game.player.y=game.bossArena.floorY-game.player.h;tick(game,25);
  assert.equal(game.bossArena.active,true);assert.ok(game.bossArena.gateProgress>.95);const gates=game.bossGates();assert.equal(gates.length,2);assert.ok(gates.every(gate=>Math.abs(gate.y-game.bossArena.gateClosedY)<1));
});

test('closed arena gates prevent the player from escaping',()=>{
  const game=new Game();game.bossArena.active=true;game.bossArena.gateProgress=1;const gate=game.bossGates()[0];game.player.x=gate.x+gate.w+10;game.player.y=game.bossArena.floorY-game.player.h;game.player.vx=-500;game.player.vy=0;game.moveActor(game.player,.1,true);assert.ok(game.player.x>=gate.x+gate.w);
});

test('standing above the arena cannot trigger gates and lock the player out',()=>{
  const game=new Game(),arena=game.bossArena;game.player.x=arena.triggerX+20;game.player.y=arena.y-game.player.h-100;game.updateBossArena(1);
  assert.equal(arena.active,false);assert.equal(arena.gateProgress,0);assert.equal(game.bossGates().length,0);
});

test('the boss randomly uses charge, slam shockwave, and projectile volley',()=>{
  const game=new Game(),boss=game.boss();game.bossArena.active=true;boss.bossMove='idle';boss.bossTimer=0;game.player.x=6150;game.player.y=game.bossArena.floorY-game.player.h;const moves=new Set();let sawShockwave=false,maxProjectiles=0;
  for(let index=0;index<1200;index++){game.updateBoss(boss,1/60);moves.add(boss.bossMove);sawShockwave||=Boolean(game.bossShockwave);maxProjectiles=Math.max(maxProjectiles,game.bossProjectiles.length);}
  assert.ok(moves.has('bossCharge'));assert.ok(moves.has('slamAir'));assert.equal(sawShockwave,true);assert.ok(maxProjectiles>=2);
});

test('the starting jump clears the Heavy Core without taking contact damage',()=>{
  const game=new Game(),boss=game.boss();game.enemies=[boss];
  Object.assign(game.player,{x:boss.x-90,y:game.bossArena.floorY-game.player.h,vx:0,vy:0,onGround:true,jumps:1});game.safePosition={x:game.player.x,y:game.player.y};
  game.setInput({right:true,jump:true});tick(game);game.setInput({jump:false});
  for(let frame=0;frame<120&&game.player.x<boss.x+boss.w+20;frame++)tick(game);
  assert.ok(game.player.x>boss.x+boss.w);assert.equal(game.player.lives,3);
});

test('defeating the boss awards scrap and retracts the arena gates',()=>{
  const game=new Game(),boss=game.boss(),barriers=game.platforms.filter(block=>block.destructibleAfterBoss);assert.equal(barriers.length,2);assert.equal(game.platforms.some(block=>block.id==='field-annex-connector-floor'),false);game.bossArena.active=true;game.bossArena.gateProgress=1;boss.health=1;game.hitTarget(boss,1,new Set(),0);assert.equal(boss.dead,true);assert.equal(game.bossArena.cleared,true);assert.equal(game.player.scrap,SCRAP_VALUES.boss);assert.equal(game.bossProjectiles.length,0);assert.equal(game.platforms.some(block=>block.destructibleAfterBoss),false);assert.equal(game.platforms.filter(block=>block.id?.startsWith('field-annex-connector-')).length,2);for(let first=0;first<game.platforms.length;first++)for(let second=first+1;second<game.platforms.length;second++)assert.equal(game.platforms[first].x<game.platforms[second].x+game.platforms[second].w&&game.platforms[first].x+game.platforms[first].w>game.platforms[second].x&&game.platforms[first].y<game.platforms[second].y+game.platforms[second].h&&game.platforms[first].y+game.platforms[first].h>game.platforms[second].y,false);for(let index=0;index<30;index++)game.updateBossArena(1/60);assert.equal(game.bossArena.gateProgress,0);assert.equal(game.bossGates().length,0);
});
