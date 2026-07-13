import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const standUnder=(game,door)=>Object.assign(game.player,{x:door.x+15,y:door.y+door.h-game.player.h,vx:0,vy:0});
const press=(game,key)=>{game.setInput({[key]:true});game.update(1/60);game.setInput({[key]:false});game.update(1/60);};

test('merchant doors only check a small circular field around themselves',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-salvage');
  assert.ok(game.merchants.every(merchant=>merchant.clearRadius<=210));
  standUnder(game,door);assert.equal(game.nearbyMerchantDoor(),door);assert.equal(game.merchantDoorUnlocked(door),false);assert.equal(game.tryInteract(),false);
  for(const enemy of game.enemies)if(!enemy.isBoss&&!enemy.isVaultBoss&&!enemy.isDepthBoss&&!enemy.isMiniBoss&&Math.hypot(enemy.originX+enemy.w/2-(door.x+door.w/2),enemy.originY+enemy.h/2-(door.y+door.h/2))<=door.clearRadius)enemy.dead=true;
  game.enemies.push(game.enemy({type:'crawler',x:door.x,y:door.y-900,w:44,h:34}));
  assert.equal(game.merchantDoorUnlocked(door),true);assert.equal(game.tryInteract(),true);assert.equal(game.merchantRoom.activeMerchant.id,door.id);
});

test('O teleports into an enemy-free merchant room and its exit returns outside',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-parts');standUnder(game,door);
  assert.equal(game.merchantDoorUnlocked(door),true);const outside={x:game.player.x,y:game.player.y};assert.equal(game.tryInteract(),true);
  assert.deepEqual({x:game.player.x,y:game.player.y},game.merchantRoom.spawn);
  const regionBefore=game.regionId;game.updateRegion();assert.equal(game.regionId,regionBefore);assert.equal(game.regionToast,null);
  assert.equal(game.nearbyMerchant(),null);Object.assign(game.player,{x:game.merchantRoom.merchant.x-10,y:game.merchantRoom.merchant.y});assert.equal(game.nearbyMerchant().id,door.id);assert.equal(game.tryInteract(),true);assert.equal(game.merchantMenuOpen,true);game.closeMerchantMenu();
  assert.ok(game.enemies.every(enemy=>enemy.originX+enemy.w<=game.merchantRoom.x||enemy.originX>=game.merchantRoom.x+game.merchantRoom.w||enemy.originY+enemy.h<=game.merchantRoom.y||enemy.originY>=game.merchantRoom.y+game.merchantRoom.h));
  const exit=game.merchantRoom.exit;Object.assign(game.player,{x:exit.x+15,y:exit.y+exit.h-game.player.h});assert.equal(game.nearMerchantExit(),true);assert.equal(game.tryInteract(),true);
  assert.deepEqual({x:game.player.x,y:game.player.y},outside);assert.equal(game.merchantRoom.activeMerchant,null);
});

test('the Grand Exchange forge sells four increasingly expensive slash upgrades',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-forge');standUnder(game,door);assert.equal(game.merchantDoorUnlocked(door),true);assert.equal(game.tryInteract(),true);
  Object.assign(game.player,{x:game.merchantRoom.merchant.x-10,y:game.merchantRoom.merchant.y,scrap:door.upgradeCosts.reduce((sum,cost)=>sum+cost,0)});assert.equal(game.tryInteract(),true);assert.equal(game.merchantMenuOpen,true);assert.deepEqual(game.merchantCatalog().map(row=>row.cost),door.upgradeCosts);for(const cost of door.upgradeCosts){assert.equal(game.nextDamageUpgradeCost(door),cost);assert.equal(game.purchaseSelectedMerchantItem(),true);}
  assert.equal(game.player.scrap,0);assert.equal(game.player.primaryDamage,7);assert.equal(game.player.damageUpgrades,4);assert.equal(game.player.purchasedItems.length,4);assert.equal(game.purchaseSelectedMerchantItem(),false);
  const enemy=game.enemy({type:'brute',x:game.player.x+60,y:game.player.y,w:58,h:63,health:8});game.enemies=[enemy];game.player.aimX=1;game.player.aimY=0;game.player.attackHits=new Set();game.resolvePrimaryAttack();assert.equal(enemy.health,1);
});

test('merchant catalogs show every item, effect, price, and ownership state',()=>{
  const game=new Game(),merchant=game.merchants.find(item=>item.service==='modifierShop');game.merchantRoom.activeMerchant=merchant;game.player.scrap=1000;game.openMerchantMenu(merchant);const rows=game.merchantCatalog();assert.equal(rows.length,2);assert.deepEqual(rows.map(row=>row.cost),[500,850]);assert.match(rows[0].detail,/SHELL.*CORE.*LEGS.*INTERNAL/);assert.ok(rows.every(row=>row.state==='available'));
  press(game,'down');assert.equal(game.merchantMenuSelection,1);press(game,'rest');assert.equal(game.player.purchasedItems[0].modifierId,'dense-matrix');assert.equal(game.merchantCatalog()[1].state,'owned');press(game,'inventory');assert.equal(game.merchantMenuOpen,false);assert.equal(game.inventoryOpen,false);
});
