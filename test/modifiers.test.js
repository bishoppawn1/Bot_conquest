import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLAYER_MOVE_SPEED } from '../src/game.js';
import { BODY_MODIFIERS, BOSS_ARENA, DEPTH_BOSS_ARENA, MINI_BOSS_ARENAS, VAULT_BOSS_ARENA } from '../src/level.js';

const press=(game,key)=>{game.setInput({[key]:true});game.update(1/60);game.setInput({[key]:false});game.update(1/60);};
const buyModifier=(game,id)=>{
  const merchant=game.merchants.find(item=>item.service==='modifierShop'),definition=game.modifierDefinition(id);
  game.player.scrap=10000;assert.equal(game.buyModifierOffer(merchant,definition),true);return game.player.purchasedItems.at(-1);
};

test('full bosses receive the same durability increase as the enemy roster',()=>{
  assert.equal(BOSS_ARENA.boss.health,36);assert.equal(VAULT_BOSS_ARENA.boss.health,24);assert.equal(DEPTH_BOSS_ARENA.boss.health,48);assert.equal(MINI_BOSS_ARENAS[0].enemy.health,12);
});

test('selected merchants sell shells, electricity, modifiers, and internal bays',()=>{
  const game=new Game(),byId=id=>game.merchants.find(merchant=>merchant.id===id);
  assert.equal(byId('merchant-shells').service,'healthUpgrade');assert.equal(byId('merchant-salvage').service,'energyUpgrade');assert.equal(byId('merchant-parts').service,'modifierShop');assert.equal(byId('merchant-foundry').service,'internalSlot');
});

test('merchant upgrades permanently increase maximum health and electricity',()=>{
  const game=new Game(),health=game.merchants.find(merchant=>merchant.service==='healthUpgrade'),energy=game.merchants.find(merchant=>merchant.service==='energyUpgrade');game.player.scrap=10000;
  assert.equal(game.buyHealthUpgrade(health),true);assert.equal(game.player.maxLives,4);assert.equal(game.player.lives,4);
  assert.equal(game.buyEnergyUpgrade(energy),true);assert.equal(game.player.maxElectricity,125);assert.equal(game.player.electricity,25);
  Object.assign(game.player,{lives:1,electricity:80,invuln:0});game.damagePlayer('enemy',game.player.x+100);assert.equal(game.player.lives,4);assert.equal(game.player.maxElectricity,125);assert.equal(game.player.purchasedItems.length,2);
});

test('modifier health and core-capacity bonuses stay scarce',()=>{
  const healthEffects=BODY_MODIFIERS.flatMap(modifier=>Object.values(modifier.effects).filter(effect=>effect.maxLives));
  const capacityEffects=BODY_MODIFIERS.flatMap(modifier=>Object.entries(modifier.effects).filter(([part,effect])=>part==='core'&&effect.maxElectricity).map(([,effect])=>effect.maxElectricity));
  assert.deepEqual(healthEffects.map(effect=>effect.maxLives),[1]);assert.ok(capacityEffects.length>0);assert.ok(capacityEffects.every(amount=>amount<=10));
  assert.equal(new Set(BODY_MODIFIERS.map(modifier=>JSON.stringify(modifier.effects))).size,BODY_MODIFIERS.length);
});

test('Aegis Filament skips the cutter and changes meaning on each compatible mount',()=>{
  const game=new Game(),item=buyModifier(game,'aegis-filament');game.inventoryPage=3;game.inventorySelection=0;
  assert.equal(game.beginEquipmentPlacement(),true);assert.equal(game.selectedEquipmentTarget().id,'shell');assert.equal(game.confirmEquipmentPlacement(),true);assert.equal(item.equippedSlot,'shell');assert.equal(game.player.maxLives,4);
  game.beginEquipmentPlacement();game.moveEquipmentTarget(1);game.confirmEquipmentPlacement();assert.equal(item.equippedSlot,'core');assert.equal(game.player.maxLives,3);assert.equal(game.player.maxElectricity,110);
  game.beginEquipmentPlacement();game.moveEquipmentTarget(1);game.confirmEquipmentPlacement();assert.equal(item.equippedSlot,'legs');assert.equal(game.player.maxElectricity,100);assert.equal(game.player.moveSpeed,PLAYER_MOVE_SPEED+18);
  game.beginEquipmentPlacement();game.moveEquipmentTarget(1);assert.equal(game.selectedEquipmentTarget().part,'storage');game.confirmEquipmentPlacement();assert.equal(item.equippedSlot,null);assert.equal(game.player.moveSpeed,PLAYER_MOVE_SPEED);assert.ok(!game.compatibleModifierSlots(item).some(slot=>slot.part==='weapon'));
});

test('an internal Aegis Filament creates one repair shield that absorbs one enemy hit',()=>{
  const game=new Game(),foundry=game.merchants.find(item=>item.service==='internalSlot');game.player.scrap=10000;assert.equal(game.buyInternalSlot(foundry),true);const item=buyModifier(game,'aegis-filament');item.equippedSlot='internal-1';game.recomputeBodyStats();
  game.player.lives=2;assert.equal(game.completeHeal(),true);assert.equal(game.player.lives,3);assert.equal(game.player.shield,1);
  game.damagePlayer('enemy',game.player.x+100);assert.equal(game.player.lives,3);assert.equal(game.player.shield,0);
  game.player.invuln=0;game.damagePlayer('enemy',game.player.x+100);assert.equal(game.player.lives,2);
});

test('Reactive Governor rewards damage with placement-specific energy or speed',()=>{
  const coreGame=new Game(),coreItem=buyModifier(coreGame,'reactive-governor');coreItem.equippedSlot='core';coreGame.recomputeBodyStats();coreGame.damagePlayer('enemy',coreGame.player.x+100);assert.equal(coreGame.player.electricity,8);
  const legGame=new Game(),legItem=buyModifier(legGame,'reactive-governor');legItem.equippedSlot='legs';legGame.recomputeBodyStats();legGame.enemies=[];legGame.traps=[];legGame.damagePlayer('enemy',legGame.player.x+100);assert.equal(legGame.player.moveSpeed,PLAYER_MOVE_SPEED+85);assert.equal(legGame.player.reactiveSpeedTime,3);
  for(let step=0;step<100;step++)legGame.update(.034);assert.equal(legGame.player.reactiveSpeedTime,0);assert.equal(legGame.player.moveSpeed,PLAYER_MOVE_SPEED);
});

test('Extender Arm modifies Fusion Cutter range and has a reduced internal profile',()=>{
  const game=new Game(),item=buyModifier(game,'extender-arm');item.equippedSlot='weapon';game.recomputeBodyStats();assert.equal(game.player.primaryRange,145);assert.equal(game.player.maxLives,3);
  const enemy=game.enemy({type:'crawler',x:game.player.x+170,y:game.player.y,w:30,h:40,health:6});game.enemies=[enemy];game.player.attackAimX=1;game.player.attackAimY=0;game.player.attackHits=new Set();game.resolvePrimaryAttack();assert.equal(enemy.health,3);
  const foundry=game.merchants.find(merchant=>merchant.service==='internalSlot');game.player.scrap=10000;game.buyInternalSlot(foundry);item.equippedSlot='internal-1';game.recomputeBodyStats();assert.equal(game.player.primaryRange,117);assert.match(game.modifierPlacementDetail(item),/INTERNAL BAY 1.*12 CUTTER RANGE/);
});

test('Q selects a modifier and confirms an arrow-selected slot in ITEMS',()=>{
  const game=new Game();buyModifier(game,'aegis-filament');game.inventoryOpen=true;game.inventoryPage=3;game.inventorySelection=0;press(game,'rest');assert.equal(game.player.purchasedItems[0].equippedSlot,null);press(game,'field');assert.equal(game.equipmentItemIndex,0);assert.equal(game.selectedEquipmentTarget().id,'shell');press(game,'right');assert.equal(game.selectedEquipmentTarget().id,'core');press(game,'field');assert.equal(game.player.purchasedItems[0].equippedSlot,'core');assert.equal(game.player.maxElectricity,110);assert.equal(game.equipmentItemIndex,null);
});

test('placing a modifier into an occupied diagram slot returns the old part to storage',()=>{
  const game=new Game(),aegis=buyModifier(game,'aegis-filament'),reactive=buyModifier(game,'reactive-governor');aegis.equippedSlot='shell';game.recomputeBodyStats();game.inventoryPage=3;game.inventorySelection=1;assert.equal(game.beginEquipmentPlacement(),true);assert.equal(game.selectedEquipmentTarget().id,'shell');assert.equal(game.confirmEquipmentPlacement(),true);assert.equal(reactive.equippedSlot,'shell');assert.equal(aegis.equippedSlot,null);assert.equal(game.player.maxLives,3);
});
