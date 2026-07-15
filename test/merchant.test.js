import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { FORGE_UPGRADE_RECIPES } from '../src/level.js';

const standUnder=(game,door)=>Object.assign(game.player,{x:door.x+15,y:door.y+door.h-game.player.h,vx:0,vy:0});
const press=(game,key)=>{game.setInput({[key]:true});game.update(1/60);game.setInput({[key]:false});game.update(1/60);};

test('merchant doors only check a small circular field around themselves',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-salvage');
  assert.ok(game.merchants.every(merchant=>merchant.clearRadius<=210));
  const localEnemy=game.enemy({type:'crawler',x:door.x+20,y:door.y+door.h-40,w:30,h:40});game.enemies.push(localEnemy);
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
  Object.assign(game.player,{x:game.merchantRoom.merchant.x-10,y:game.merchantRoom.merchant.y,scrap:door.upgradeCosts.reduce((sum,cost)=>sum+cost,0)});Object.assign(game.player.materials,{titanium:6,uranium:3});assert.equal(game.tryInteract(),true);assert.equal(game.merchantMenuOpen,true);assert.deepEqual(game.merchantCatalog().slice(0,door.upgradeCosts.length).map(row=>row.cost),door.upgradeCosts);assert.deepEqual(game.merchantCatalog().slice(0,door.upgradeCosts.length).map(row=>row.materials),FORGE_UPGRADE_RECIPES);assert.equal(game.merchantCatalog().at(-1).id,'kinetic-memory');for(const cost of door.upgradeCosts){assert.equal(game.nextDamageUpgradeCost(door),cost);assert.equal(game.purchaseSelectedMerchantItem(),true);}
  assert.equal(game.player.scrap,0);assert.deepEqual(game.player.materials,{titanium:0,uranium:0});assert.equal(game.player.primaryDamage,7);assert.equal(game.player.damageUpgrades,4);assert.equal(game.player.purchasedItems.length,4);assert.equal(game.purchaseSelectedMerchantItem(),false);
  const enemy=game.enemy({type:'brute',x:game.player.x+60,y:game.player.y,w:58,h:63,health:8});game.enemies=[enemy];game.player.aimX=1;game.player.aimY=0;game.player.attackHits=new Set();game.resolvePrimaryAttack();assert.equal(enemy.health,1);
});

test('the Edge Forge has a spike-free physical approach from the Grand Exchange floor',()=>{
  const game=new Game(),door=game.merchants.find(merchant=>merchant.id==='merchant-forge'),step=game.platforms.find(block=>block.id==='exchange-step-east');game.enemies=[];game.junkPiles=[];
  Object.assign(game.player,{x:step.x+20,y:step.y-game.player.h,vx:0,vy:0,onGround:true,jumps:1});game.safePosition={x:game.player.x,y:game.player.y};
  let entered=false,jumped=false,braking=false;game.setInput({right:true});
  for(let frame=0;frame<220&&!entered;frame++){if(!jumped&&game.player.x>=13980){game.setInput({right:true,jump:true});jumped=true;}else if(jumped&&game.input.jump)game.setInput({right:true});if(!braking&&game.player.x>=14270){game.setInput({left:true});braking=true;}game.update(1/60);if(game.nearbyMerchantDoor()===door)entered=game.tryInteract();}
  assert.equal(entered,true);assert.equal(game.merchantRoom.activeMerchant,door);assert.equal(game.player.lives,game.player.maxLives);
});

test('Mark 2 and Mark 3 forge tiers require rare materials as well as scrap',()=>{
  const game=new Game(),forge=game.merchants.find(merchant=>merchant.service==='damageUpgrade');game.player.scrap=10000;
  assert.equal(game.buyDamageUpgrade(forge),true);assert.equal(game.player.damageUpgrades,1);
  assert.equal(game.buyDamageUpgrade(forge),false);assert.equal(game.player.damageUpgrades,1);
  game.player.materials.titanium=1;assert.equal(game.buyDamageUpgrade(forge),true);assert.equal(game.player.damageUpgrades,2);
  game.player.materials.titanium=2;assert.equal(game.buyDamageUpgrade(forge),false);
  game.player.materials.uranium=1;assert.equal(game.buyDamageUpgrade(forge),true);assert.equal(game.player.damageUpgrades,3);
});

test('merchant catalogs show every item, effect, price, and ownership state',()=>{
  const game=new Game(),merchant=game.merchants.find(item=>item.service==='modifierShop');game.merchantRoom.activeMerchant=merchant;game.player.scrap=1000;game.openMerchantMenu(merchant);const rows=game.merchantCatalog();assert.equal(rows.length,3);assert.deepEqual(rows.map(row=>row.cost),[650,800,950]);assert.match(rows[0].detail,/SHELL.*CORE.*LEGS.*INTERNAL/);assert.doesNotMatch(rows[0].detail,/CUTTER/);assert.match(rows[2].detail,/CUTTER.*40 CUTTER RANGE/);assert.ok(rows.every(row=>row.state==='available'));
  press(game,'down');assert.equal(game.merchantMenuSelection,1);press(game,'rest');assert.equal(game.player.purchasedItems[0].modifierId,'reactive-governor');assert.equal(game.merchantCatalog()[1].state,'owned');press(game,'inventory');assert.equal(game.merchantMenuOpen,false);assert.equal(game.inventoryOpen,false);
});
