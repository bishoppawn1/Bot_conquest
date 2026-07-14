import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

test('Shard Gauntlet electric barriers visibly cycle between dangerous and safe windows',()=>{
  const game=new Game(),field=game.gauntletHazards.find(hazard=>hazard.type==='electric');game.enemies=[];game.traps=[];
  game.time=0;game.updateGauntletHazards();const first=field.active;
  game.time=field.onTime;game.updateGauntletHazards();const second=field.active;
  assert.notEqual(first,second);
});

test('Shard Gauntlet electric fields and swinging wrecking ball damage the player',()=>{
  const electricGame=new Game(),field=electricGame.gauntletHazards.find(hazard=>hazard.type==='electric');electricGame.time=(field.onTime+field.offTime)-field.phase+.01;Object.assign(electricGame.player,{x:field.x,y:field.y+100,invuln:0});const electricLives=electricGame.player.lives;electricGame.updateGauntletHazards();assert.equal(field.active,true);assert.equal(electricGame.player.lives,electricLives-1);
  const swingGame=new Game(),swing=swingGame.gauntletHazards.find(hazard=>hazard.type==='swing'),ball=swingGame.gauntletSwingPosition(swing);Object.assign(swingGame.player,{x:ball.x-swingGame.player.w/2,y:ball.y-swingGame.player.h/2,invuln:0});const swingLives=swingGame.player.lives;swingGame.updateGauntletHazards();assert.equal(swingGame.player.lives,swingLives-1);
});

test('the Gauntlet summit cache pays scrap, titanium, and uranium together',()=>{
  const game=new Game(),cache=game.junkPiles.find(pile=>pile.id==='gauntlet-prize-cache');game.player.scrap=0;game.hitTarget(cache,cache.health,new Set(),0);
  assert.equal(cache.dead,true);assert.equal(game.player.scrap,450);assert.deepEqual(game.player.materials,{titanium:3,uranium:2});assert.match(game.rewardToast.detail,/TITANIUM.*URANIUM/);
});
