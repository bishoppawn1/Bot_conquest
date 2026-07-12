import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};

test('the post-boss white core unlocks vault on contact',()=>{
  const game=new Game();game.enemies=[];const pickup=game.pickups.find(item=>item.id==='vault-core');
  game.player.x=pickup.x;game.player.y=pickup.y;tick(game);
  assert.equal(pickup.collected,false);assert.equal(game.player.abilities.vault,false);
  game.bossArena.cleared=true;tick(game);
  assert.equal(pickup.collected,true);assert.equal(game.player.abilities.vault,true);
  assert.ok(game.particles.length>=30);
});

test('vault hops the bot onto a low obstacle while jump is held',()=>{
  const game=new Game();game.enemies=[];game.junkPiles=[];game.traps=[];
  game.platforms=[{id:'floor',x:0,y:200,w:500,h:100,kind:'foundation'},{id:'obstacle',x:200,y:100,w:90,h:100,kind:'interior'}];
  game.unlockAbility('vault');Object.assign(game.player,{x:149,y:164,vx:250,vy:0,onGround:true,jumps:1});
  game.setInput({right:true,jump:true});tick(game);game.setInput({jump:false});tick(game,12);
  assert.ok(game.player.vaultFlash>0||game.player.x>=200);
  assert.ok(game.player.x>190,'vault should carry the bot onto the obstacle instead of stopping at its wall');
  assert.ok(game.player.y+game.player.h<=100,'vault should clear the obstacle top');
});

test('crossing a region boundary triggers a temporary bottom-left title',()=>{
  const game=new Game();game.enemies=[];
  assert.equal(game.regionId,'verge');
  game.player.x=2400;game.player.y=644;tick(game);
  assert.equal(game.regionId,'vault');
  assert.equal(game.regionToast,'SUNKEN VAULT');
  assert.ok(game.regionToastTime>2);
  tick(game,150);
  assert.equal(game.regionToastTime,0);
});
