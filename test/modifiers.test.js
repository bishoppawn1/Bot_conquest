import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLAYER_MOVE_SPEED } from '../src/game.js';
import { BOSS_ARENA, DEPTH_BOSS_ARENA, MINI_BOSS_ARENAS, VAULT_BOSS_ARENA } from '../src/level.js';

const press=(game,key)=>{game.setInput({[key]:true});game.update(1/60);game.setInput({[key]:false});game.update(1/60);};

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

test('one modifier changes effect as it moves between body parts',()=>{
  const game=new Game(),merchant=game.merchants.find(item=>item.service==='modifierShop');game.player.scrap=1000;assert.equal(game.buyModifier(merchant),true);const item=game.player.purchasedItems[0];game.inventoryPage=3;game.inventorySelection=0;
  assert.equal(game.cycleSelectedModifier(),true);assert.equal(item.equippedSlot,'shell');assert.equal(game.player.maxLives,5);
  game.cycleSelectedModifier();assert.equal(item.equippedSlot,'core');assert.equal(game.player.maxLives,3);assert.equal(game.player.maxElectricity,140);
  game.cycleSelectedModifier();assert.equal(item.equippedSlot,'legs');assert.equal(game.player.maxElectricity,100);assert.equal(game.player.moveSpeed,PLAYER_MOVE_SPEED+45);
  game.cycleSelectedModifier();assert.equal(item.equippedSlot,null);assert.equal(game.player.moveSpeed,PLAYER_MOVE_SPEED);
});

test('internal bays accept modifiers at a greatly reduced mixed effect',()=>{
  const game=new Game(),foundry=game.merchants.find(item=>item.service==='internalSlot'),parts=game.merchants.find(item=>item.service==='modifierShop');game.player.scrap=5000;assert.equal(game.buyInternalSlot(foundry),true);assert.equal(game.buyModifier(parts),true);game.inventorySelection=1;
  for(let placement=0;placement<4;placement++)game.cycleSelectedModifier();const modifier=game.player.purchasedItems[1];assert.equal(modifier.equippedSlot,'internal-1');assert.deepEqual(game.recomputeBodyStats(),{maxLives:4,maxElectricity:115,moveSpeed:PLAYER_MOVE_SPEED+12});assert.match(game.modifierPlacementDetail(modifier),/INTERNAL BAY 1/);
});

test('O moves the selected modifier while the ITEMS screen is open',()=>{
  const game=new Game(),merchant=game.merchants.find(item=>item.service==='modifierShop');game.player.scrap=1000;game.buyModifier(merchant);game.inventoryOpen=true;game.inventoryPage=3;game.inventorySelection=0;press(game,'rest');assert.equal(game.player.purchasedItems[0].equippedSlot,'shell');assert.equal(game.player.maxLives,5);
});

