import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};

test('the post-boss white core unlocks wall climb on contact',()=>{
  const game=new Game();game.enemies=[];const pickup=game.pickups.find(item=>item.id==='vault-core');
  game.player.x=pickup.x;game.player.y=pickup.y;tick(game);
  assert.equal(pickup.collected,false);assert.equal(game.player.abilities.wallClimb,false);
  game.bossArena.cleared=true;tick(game);
  assert.equal(pickup.collected,true);assert.equal(game.player.abilities.wallClimb,true);assert.equal(game.abilityPopup.name,'WALL CLIMB');
  assert.ok(game.particles.length>=30);
});

test('the blue Sunken Vault core unlocks Volt Jab and opens its tutorial popup',()=>{
  const game=new Game();game.enemies=[];const pickup=game.pickups.find(item=>item.id==='volt-core');
  game.player.x=pickup.x;game.player.y=pickup.y;tick(game);
  assert.equal(pickup.collected,true);assert.equal(game.player.abilities.electricJab,true);
  assert.equal(game.abilityPopup.name,'VOLT JAB');assert.equal(game.abilityPopup.key,'F');assert.ok(game.abilityPopup.time>4);
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
