import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { RELICS } from '../src/level.js';

const buyRelic=(game,id,slot='relic-1')=>{
  const merchant=game.merchants.find(item=>item.relicStock?.includes(id)),definition=game.relicDefinition(id);
  game.player.scrap=10000;assert.equal(game.buyRelicOffer(merchant,definition),true);const item=game.player.purchasedItems.at(-1);item.equippedSlot=slot;return item;
};

test('specialized merchants distribute eight distinct slotted relics',()=>{
  const game=new Game(),sellers=game.merchants.filter(merchant=>merchant.relicStock?.length);
  assert.equal(RELICS.length,8);assert.equal(sellers.length,5);assert.deepEqual(new Set(sellers.flatMap(merchant=>merchant.relicStock)),new Set(RELICS.map(relic=>relic.id)));
  assert.equal(new Set(RELICS.map(relic=>JSON.stringify(relic.effects))).size,RELICS.length);
  assert.ok(RELICS.every(relic=>relic.cost>=750&&relic.detail));
});

test('relics are inactive in storage and keep the same effect in every relic bay',()=>{
  const game=new Game(),item=buyRelic(game,'mender-loop',null);assert.equal(game.healCost(),30);game.inventoryPage=3;game.inventorySelection=0;
  assert.equal(game.beginEquipmentPlacement(),true);assert.deepEqual(game.equipmentTargets().slice(0,3).map(slot=>slot.id),['relic-1','relic-2','relic-3']);assert.equal(game.confirmEquipmentPlacement(),true);assert.equal(item.equippedSlot,'relic-1');assert.equal(game.healCost(),25);
  game.beginEquipmentPlacement();game.moveEquipmentTarget(1);game.confirmEquipmentPlacement();assert.equal(item.equippedSlot,'relic-2');assert.equal(game.healCost(),25);
  game.beginEquipmentPlacement();game.moveEquipmentTarget(2);game.confirmEquipmentPlacement();assert.equal(item.equippedSlot,null);assert.equal(game.healCost(),30);
});

test('placing a relic into an occupied bay returns the previous relic to storage',()=>{
  const game=new Game(),mender=buyRelic(game,'mender-loop'),impact=buyRelic(game,'impact-damper',null);game.inventoryPage=3;game.inventorySelection=1;
  assert.equal(game.beginEquipmentPlacement(),true);assert.equal(game.confirmEquipmentPlacement(),true);assert.equal(impact.equippedSlot,'relic-1');assert.equal(mender.equippedSlot,null);
});

test('Shell Archive and Capacitor Exchange mix relics into their upgrade catalogs',()=>{
  const game=new Game(),shells=game.merchants.find(item=>item.id==='merchant-shells'),capacitors=game.merchants.find(item=>item.id==='merchant-salvage');
  assert.equal(game.merchantCatalog(shells).length,5);assert.equal(game.merchantCatalog(capacitors).length,5);
  assert.deepEqual(game.merchantCatalog(shells).slice(-2).map(row=>row.kind),['relic','relic']);assert.deepEqual(game.merchantCatalog(capacitors).slice(-2).map(row=>row.kind),['relic','relic']);
  game.merchantRoom.activeMerchant=shells;game.player.scrap=1000;game.openMerchantMenu(shells);game.merchantMenuSelection=3;assert.equal(game.purchaseSelectedMerchantItem(),true);assert.equal(game.player.purchasedItems[0].kind,'relic');assert.equal(game.player.purchasedItems[0].equippedSlot,null);assert.equal(game.merchantCatalog(shells)[3].state,'owned');
});

test('each core upgrade merchant carries passives aligned with its specialty',()=>{
  const game=new Game(),shells=game.merchants.find(item=>item.id==='merchant-shells'),capacitors=game.merchants.find(item=>item.id==='merchant-salvage'),forge=game.merchants.find(item=>item.id==='merchant-forge');
  assert.deepEqual(shells.relicStock,['mender-loop','impact-damper']);assert.match(shells.specialty,/SURVIVABILITY/);
  assert.deepEqual(capacitors.relicStock,['feedback-dynamo','execution-coil']);assert.match(capacitors.specialty,/CHARGE ECONOMY/);
  assert.deepEqual(forge.relicStock,['kinetic-memory']);assert.match(forge.specialty,/CUTTER OUTPUT/);assert.equal(game.merchantCatalog(forge).at(-1).id,'kinetic-memory');
});

test('Mender Loop lowers repair cost and Impact Damper reduces both knockback axes',()=>{
  const repair=new Game();buyRelic(repair,'mender-loop');Object.assign(repair.player,{lives:2,electricity:25});assert.equal(repair.healCost(),25);assert.equal(repair.startHeal(),true);assert.equal(repair.player.electricity,0);
  const impact=new Game();buyRelic(impact,'impact-damper');impact.player.scrap=0;impact.damagePlayer('enemy',impact.player.x+100);assert.equal(impact.player.vx,-180);assert.equal(impact.player.vy,-150);
});

test('Feedback Dynamo and Execution Coil create different electricity loops',()=>{
  const feedback=new Game();buyRelic(feedback,'feedback-dynamo');feedback.player.scrap=0;feedback.damagePlayer('enemy',feedback.player.x+100);assert.equal(feedback.player.electricity,12);
  const execution=new Game();buyRelic(execution,'execution-coil');execution.player.scrap=0;const enemy=execution.enemy({type:'crawler',x:500,y:500,w:30,h:40,health:3});execution.enemies=[enemy];execution.hitTarget(enemy,3,new Set());assert.equal(execution.player.electricity,20);
});

test('Arc Retort lashes out nearby while Kinetic Memory charges exactly one slash',()=>{
  const retort=new Game();buyRelic(retort,'arc-retort');retort.player.scrap=0;const near=retort.enemy({type:'crawler',x:retort.player.x+75,y:retort.player.y,w:30,h:40,health:6}),far=retort.enemy({type:'crawler',x:retort.player.x+250,y:retort.player.y,w:30,h:40,health:6});retort.enemies=[near,far];retort.damagePlayer('enemy',retort.player.x+100);assert.equal(near.health,4);assert.equal(far.health,6);
  const memory=new Game();buyRelic(memory,'kinetic-memory');memory.player.scrap=0;const target=memory.enemy({type:'brute',x:memory.player.x+60,y:memory.player.y,w:58,h:63,health:12});memory.enemies=[target];memory.damagePlayer('enemy',memory.player.x+100);memory.player.aimX=1;memory.player.aimY=0;assert.equal(memory.player.pendingRelicDamage,2);assert.equal(memory.startAttack(),true);assert.equal(target.health,7);assert.equal(memory.player.pendingRelicDamage,0);memory.player.attackCooldown=0;memory.startAttack();assert.equal(target.health,4);
});

test('Salvage Lens improves ordinary scrap and Corpse Key weakens recovery wrecks',()=>{
  const salvage=new Game();buyRelic(salvage,'salvage-lens');salvage.player.scrap=0;const enemy=salvage.enemy({type:'crawler',x:500,y:500,w:30,h:40,health:3});salvage.enemies=[enemy];salvage.hitTarget(enemy,3,new Set(),0);assert.equal(salvage.player.scrap,9);
  const corpse=new Game();buyRelic(corpse,'corpse-key');Object.assign(corpse.player,{lives:1,scrap:40});corpse.damagePlayer('enemy',corpse.player.x+100);assert.equal(corpse.recoveryCorpse.health,1);assert.equal(corpse.recoveryCorpse.maxHealth,1);assert.equal(corpse.player.purchasedItems.some(item=>item.relicId==='corpse-key'),true);
});
