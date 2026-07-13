import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const standUnder=(game,door)=>Object.assign(game.player,{x:door.x+15,y:door.y+door.h-game.player.h,vx:0,vy:0});

test('merchant doors remain sealed until nearby ordinary enemies are defeated',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-verge');
  standUnder(game,door);assert.equal(game.nearbyMerchantDoor(),door);assert.equal(game.merchantDoorUnlocked(door),false);assert.equal(game.tryInteract(),false);
  for(const enemy of game.enemies)if(!enemy.isBoss&&!enemy.isMiniBoss&&Math.abs(enemy.originX+enemy.w/2-(door.x+door.w/2))<=door.clearRadius)enemy.dead=true;
  assert.equal(game.merchantDoorUnlocked(door),true);assert.equal(game.tryInteract(),true);assert.equal(game.merchantRoom.activeMerchant.id,door.id);
});

test('O teleports into an enemy-free merchant room and its exit returns outside',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-parts');standUnder(game,door);
  assert.equal(game.merchantDoorUnlocked(door),true);const outside={x:game.player.x,y:game.player.y};assert.equal(game.tryInteract(),true);
  assert.deepEqual({x:game.player.x,y:game.player.y},game.merchantRoom.spawn);
  const regionBefore=game.regionId;game.updateRegion();assert.equal(game.regionId,regionBefore);assert.equal(game.regionToast,null);
  assert.equal(game.nearbyMerchant(),null);Object.assign(game.player,{x:game.merchantRoom.merchant.x-10,y:game.merchantRoom.merchant.y});assert.equal(game.nearbyMerchant().id,door.id);
  assert.ok(game.enemies.every(enemy=>enemy.originX+enemy.w<=game.merchantRoom.x||enemy.originX>=game.merchantRoom.x+game.merchantRoom.w||enemy.originY+enemy.h<=game.merchantRoom.y||enemy.originY>=game.merchantRoom.y+game.merchantRoom.h));
  const exit=game.merchantRoom.exit;Object.assign(game.player,{x:exit.x+15,y:exit.y+exit.h-game.player.h});assert.equal(game.nearMerchantExit(),true);assert.equal(game.tryInteract(),true);
  assert.deepEqual({x:game.player.x,y:game.player.y},outside);assert.equal(game.merchantRoom.activeMerchant,null);
});
