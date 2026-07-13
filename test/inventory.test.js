import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};
const press=(game,key)=>{game.setInput({[key]:true});tick(game);game.setInput({[key]:false});tick(game);};

test('I pauses play and the map switches between local and WASD overview controls',()=>{
  const game=new Game();tick(game,30);const position={x:game.player.x,y:game.player.y},time=game.time;press(game,'inventory');assert.equal(game.inventoryOpen,true);const pausedAt=game.time;game.setInput({attack:true});tick(game,20);assert.deepEqual({x:game.player.x,y:game.player.y},position);assert.equal(game.time,pausedAt);game.setInput({attack:false});
  press(game,'left');assert.equal(game.inventoryPages[game.inventoryPage],'map');assert.equal(game.mapOverview,false);assert.equal(game.mapRegionIndex,0);
  press(game,'field');assert.equal(game.mapOverview,true);press(game,'right');assert.equal(game.inventoryPage,0);assert.equal(game.mapRegionIndex,1);press(game,'down');assert.equal(game.inventoryPage,0);assert.equal(game.mapRegionIndex,4);press(game,'left');assert.equal(game.inventoryPage,0);assert.equal(game.mapRegionIndex,3);
  press(game,'field');assert.equal(game.mapOverview,false);assert.equal(game.mapRegionIndex,3);press(game,'right');assert.equal(game.inventoryPages[game.inventoryPage],'status');press(game,'down');assert.equal(game.inventorySelection,1);press(game,'inventory');assert.equal(game.inventoryOpen,false);assert.ok(game.time>time);
});

test('status and materials expose only their requested inventory rows',()=>{
  const game=new Game();game.inventoryPage=1;assert.equal(game.inventoryEntryCount(),4);game.inventoryPage=2;assert.equal(game.inventoryEntryCount(),2);
});

test('map cores reveal configured regions while leaving the rest unknown',()=>{
  const game=new Game(),pickup=game.pickups.find(item=>item.id==='map-west');Object.assign(game.player,{x:pickup.x,y:pickup.y});game.updatePickups();assert.equal(pickup.collected,true);assert.deepEqual(game.mappedRegions,new Set(pickup.regions));assert.ok(game.mappedRegions.size<game.regions.length);assert.equal(game.rewardToast.text,'MAP DATA ACQUIRED');
});

test('rare salvage yields titanium or uranium instead of scrap',()=>{
  const game=new Game(),pile=game.junkPiles.find(item=>item.material?.type==='uranium'),scrap=game.player.scrap;game.hitTarget(pile,pile.health,new Set(),0);assert.equal(pile.dead,true);assert.equal(game.player.scrap,scrap);assert.equal(game.player.materials.uranium,pile.material.amount);
});

test('special materials and merchant items survive full death',()=>{
  const game=new Game();Object.assign(game.player,{lives:1,scrap:80,electricity:50,materials:{titanium:4,uranium:2},purchasedItems:[{id:'edge-coil-1',name:'EDGE COIL MK 1'}]});game.damagePlayer('enemy',game.player.x+100);assert.deepEqual(game.player.materials,{titanium:4,uranium:2});assert.equal(game.player.purchasedItems.length,1);assert.equal(game.player.scrap,0);assert.equal(game.player.electricity,0);
});
