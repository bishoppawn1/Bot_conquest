import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { FIELD_ANNEX_BLOCKS, JUNK_PILES, PICKUP_SPAWNS } from '../src/level.js';

const tick=(game,count=1)=>{for(let index=0;index<count;index++)game.update(1/60);};
const press=(game,key)=>{game.setInput({[key]:true});tick(game);game.setInput({[key]:false});tick(game);};
const buyModifier=(game,id)=>{const merchant=game.merchants.find(item=>item.service==='modifierShop'),definition=game.modifierDefinition(id);game.player.scrap=10000;assert.equal(game.buyModifierOffer(merchant,definition),true);return game.player.purchasedItems.at(-1);};

test('the Slicer shell sits behind a contained Volt Jab wall in the Field annex',()=>{
  const seal=JUNK_PILES.find(item=>item.id==='crown-volt-shell-seal'),pickup=PICKUP_SPAWNS.find(item=>item.id==='slicer-shell'),floor=FIELD_ANNEX_BLOCKS.find(item=>item.id==='field-annex-floor'),roof=FIELD_ANNEX_BLOCKS.find(item=>item.id==='field-annex-west-perch');
  assert.equal(seal.requires,'electricJab');assert.equal(seal.minimumDamage,2);assert.equal(seal.y+seal.h,floor.y);assert.equal(pickup.requiresJunkClear,seal.id);assert.ok(pickup.x+pickup.w<seal.x);assert.ok(roof.x<=pickup.x&&roof.x+roof.w>=seal.x+seal.w);assert.ok(roof.y+roof.h<seal.y);
});

test('only Volt Jab opens the annex shell wall and releases the pickup',()=>{
  const game=new Game(),seal=game.junkPiles.find(item=>item.id==='crown-volt-shell-seal'),pickup=game.pickups.find(item=>item.id==='slicer-shell');game.enemies=[];game.crownBossArena.cleared=true;Object.assign(game.player,{x:seal.x+seal.w+6,y:game.platforms.find(item=>item.id==='field-annex-floor').y-game.player.h,aimX:-1,aimY:0,attackAimX:-1,attackAimY:0,attackHits:new Set()});
  assert.equal(game.pickupAvailable(pickup),false);game.resolvePrimaryAttack();assert.equal(seal.health,2);game.unlockAbility('field');game.player.electricity=40;press(game,'field');assert.equal(seal.health,2);
  game.player.specialTime=0;game.unlockAbility('electricJab');game.player.electricity=24;press(game,'electricJab');assert.equal(seal.dead,true);assert.equal(game.pickupAvailable(pickup),true);
  Object.assign(game.player,{x:pickup.x,y:pickup.y});game.updatePickups();assert.equal(pickup.collected,true);assert.deepEqual(game.player.ownedShells,['standard-body','slicer-body']);assert.equal(game.player.purchasedItems.at(-1).shellId,'slicer-body');
});

test('the Slicer trades durability and capacity for range and a second cutter mount',()=>{
  const game=new Game();assert.equal(game.acquireShell('slicer-body'),true);assert.equal(game.switchShell('slicer-body'),true);
  assert.equal(game.player.maxLives,2);assert.equal(game.player.maxElectricity,80);assert.equal(game.player.primaryRange,135);assert.equal(game.normalSlots().some(slot=>slot.part==='shell'),false);assert.deepEqual(game.normalSlots().filter(slot=>slot.part==='weapon').map(slot=>[slot.id,slot.label]),[['weapon','FUSION CUTTER'],['extended-weapon','EXTENDED FUSION CUTTER']]);
});

test('rest opens a pausing shell selector and equips the chosen fully repaired shell',()=>{
  const game=new Game(),station=game.restArea.station;game.enemies=[];game.bossArena.cleared=true;game.acquireShell('slicer-body');Object.assign(game.player,{x:station.x+station.w+20,y:game.restArea.floorY-game.player.h,lives:1,vx:80});const before=game.time;press(game,'rest');
  assert.equal(game.shellMenuOpen,true);assert.equal(game.player.lives,3);assert.equal(game.player.vx,0);assert.equal(game.time,before+1/60);
  const pausedAt=game.time,position=game.player.x;press(game,'right');assert.equal(game.shellMenuSelection,1);assert.equal(game.time,pausedAt);assert.equal(game.player.x,position);press(game,'rest');assert.equal(game.shellMenuOpen,false);assert.equal(game.player.body.id,'slicer-body');assert.equal(game.player.lives,2);assert.equal(game.player.maxElectricity,80);
});

test('each shell restores its own equipment placements when swapped',()=>{
  const game=new Game(),aegis=buyModifier(game,'aegis-filament'),extender=buyModifier(game,'extender-arm');game.acquireShell('slicer-body');aegis.equippedSlot='shell';extender.equippedSlot='weapon';game.recomputeBodyStats();assert.equal(game.player.maxLives,4);assert.equal(game.player.primaryRange,145);
  assert.equal(game.switchShell('slicer-body'),true);assert.equal(aegis.equippedSlot,null);assert.equal(extender.equippedSlot,null);extender.equippedSlot='extended-weapon';game.recomputeBodyStats();assert.equal(game.player.primaryRange,175);
  assert.equal(game.switchShell('standard-body'),true);assert.equal(aegis.equippedSlot,'shell');assert.equal(extender.equippedSlot,'weapon');assert.equal(game.player.maxLives,4);assert.equal(game.player.primaryRange,145);
  assert.equal(game.switchShell('slicer-body'),true);assert.equal(aegis.equippedSlot,null);assert.equal(extender.equippedSlot,'extended-weapon');assert.equal(game.player.primaryRange,175);
});

test('Foundry expansion bays are installed on every owned shell',()=>{
  const game=new Game(),foundry=game.merchants.find(item=>item.service==='bayUpgrade');game.acquireShell('slicer-body');assert.deepEqual(game.player.bodies['slicer-body'].expansionSlots.map(slot=>slot.id),['internal']);game.player.scrap=10000;game.buyBayUpgrade(foundry);
  assert.deepEqual(game.player.bodies['standard-body'].expansionSlots.map(slot=>slot.id),['internal','auxiliary-1']);assert.deepEqual(game.player.bodies['slicer-body'].expansionSlots.map(slot=>slot.id),['internal','auxiliary-1']);
});
