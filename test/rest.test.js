import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const tick=(game,count=1)=>{for(let index=0;index<count;index++)game.update(1/60);};
const press=(game,key)=>{game.setInput({[key]:true});tick(game);game.setInput({[key]:false});tick(game);};

test('the recovery station stays offline until the boss is defeated',()=>{
  const game=new Game(),station=game.restArea.station;game.player.x=station.x+station.w+20;game.player.y=game.restArea.floorY-game.player.h;game.player.lives=1;press(game,'rest');assert.equal(game.player.lives,1);assert.equal(game.canRest(),false);
});

test('pressing O after the boss restores shells and records a safe checkpoint',()=>{
  const game=new Game(),station=game.restArea.station;game.enemies=[];game.bossArena.cleared=true;game.player.x=station.x+station.w+20;game.player.y=game.restArea.floorY-game.player.h;game.player.lives=1;press(game,'rest');assert.equal(game.player.lives,3);assert.ok(game.player.restFlash>0);assert.equal(game.safePosition.y,game.restArea.floorY-game.player.h);assert.ok(game.safePosition.x>station.x+station.w);
});

test('spike recovery uses the rest station checkpoint after resting',()=>{
  const game=new Game(),station=game.restArea.station;game.enemies=[];game.bossArena.cleared=true;game.player.x=station.x+station.w+20;game.player.y=game.restArea.floorY-game.player.h;press(game,'rest');const checkpoint={...game.safePosition};game.player.x=7200;game.player.y=710;game.player.vx=0;game.player.vy=0;tick(game);assert.equal(game.player.lives,2);assert.equal(game.player.x,checkpoint.x);assert.equal(game.player.y,checkpoint.y);
});
