import { Game } from './game.js';
import { bindInput } from './input.js';
import { Renderer } from './renderer.js';

const canvas = document.querySelector('#game');
const startScreen = document.querySelector('#start');
const renderer = new Renderer(canvas);
const debugSpawn = new URLSearchParams(location.search).get('debug');
const debugPanel = new URLSearchParams(location.search).get('panel');
const abilityControls = [...document.querySelectorAll('[data-ability]')];

let game = new Game();
let playing = false;
let lastFrame = 0;

function syncAbilityControls() {
  for (const control of abilityControls) {
    const unlocked=Boolean(game.player.abilities[control.dataset.ability]);
    control.textContent=`${control.dataset.label}${unlocked?'':' [LOCKED]'}`;
  }
}

function begin() {
  game = new Game();
  const openDebugDepth=()=>{
    const vaultBoss=game.vaultBoss(),volt=game.pickups.find(item=>item.id==='volt-core');
    game.vaultBossArena.cleared=true;vaultBoss.dead=true;vaultBoss.health=0;volt.collected=true;game.unlockAbility('wallClimb');game.unlockAbility('electricJab');
    Object.assign(game.player,{x:2890,y:1120-game.player.h,onGround:true});game.syncDepthAccess();
  };
  if (debugSpawn === 'boss') {
    game.player.x=game.bossArena.triggerX+80;
    game.player.y=game.bossArena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'rest') {
    const boss=game.boss();boss.dead=true;boss.health=0;
    game.bossArena.cleared=true;
    game.platforms=game.platforms.filter(block=>!block.destructibleAfterBoss);
    game.player.x=game.restArea.station.x+game.restArea.station.w+40;
    game.player.y=game.restArea.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'postboss') {
    const boss=game.boss();boss.dead=true;boss.health=0;
    game.bossArena.cleared=true;
    game.platforms=game.platforms.filter(block=>!block.destructibleAfterBoss);
    game.player.x=7100;
    game.player.y=250-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'recovery') {
    Object.assign(game.player,{x:500,y:624,lives:1,scrap:73,electricity:48,invuln:0});
    game.damagePlayer('enemy',600);
  } else if (debugSpawn === 'inventory') {
    Object.assign(game.player,{scrap:860,primaryDamage:5,damageUpgrades:2,healthUpgrades:1,energyUpgrades:1,internalSlotUpgrades:1,materials:{titanium:4,uranium:1},purchasedItems:[{id:'edge-coil-1',kind:'upgrade',name:'EDGE COIL MK 1',detail:'+1 PRIMARY SLASH DAMAGE'},{id:'edge-coil-2',kind:'upgrade',name:'EDGE COIL MK 2',detail:'+1 PRIMARY SLASH DAMAGE'},{id:'shell-capacity-1',kind:'upgrade',name:'SHELL CAPACITY MK 1',detail:'+1 MAX SHELL'},{id:'capacitor-bank-1',kind:'upgrade',name:'CAPACITOR BANK MK 1',detail:'+25 MAX ELECTRICITY'},{id:'internal-bay-1',kind:'upgrade',name:'INTERNAL BAY 1',detail:'REDUCED-EFFECT MODIFIER SLOT'},{id:'modifier-aegis-filament',modifierId:'aegis-filament',kind:'modifier',name:'AEGIS FILAMENT',equippedSlot:'internal-1'},{id:'modifier-reactive-governor',modifierId:'reactive-governor',kind:'modifier',name:'REACTIVE GOVERNOR',equippedSlot:'legs'},{id:'modifier-extender-arm',modifierId:'extender-arm',kind:'modifier',name:'EXTENDER ARM',equippedSlot:'weapon'},{id:'relic-feedback-dynamo',relicId:'feedback-dynamo',kind:'relic',name:'FEEDBACK DYNAMO',detail:'PASSIVE RELIC // TAKING DAMAGE RESTORES 12 ELECTRICITY'},{id:'relic-arc-retort',relicId:'arc-retort',kind:'relic',name:'ARC RETORT',detail:'PASSIVE RELIC // TAKING DAMAGE HITS NEARBY ENEMIES FOR 2'}]});
    game.player.body.internalSlots.push({id:'internal-1',part:'internal',label:'INTERNAL BAY 1',efficiency:.3});game.recomputeBodyStats();game.player.lives=4;game.player.electricity=125;game.player.shield=1;
    for(const region of ['verge','vault','foundry','bastion'])game.mappedRegions.add(region);game.inventoryOpen=true;
    if(debugPanel==='map'||debugPanel==='overview'||debugPanel==='nomap'){game.inventoryPage=0;game.mapOverview=debugPanel==='overview';if(debugPanel==='nomap')game.mapRegionIndex=5;}
    else if(debugPanel==='materials')game.inventoryPage=2;else if(debugPanel==='items'||debugPanel==='relics'||debugPanel==='placement'){game.inventoryPage=3;if(debugPanel==='relics')game.inventorySelection=game.player.purchasedItems.length-1;if(debugPanel==='placement'){game.inventorySelection=game.player.purchasedItems.findIndex(item=>item.modifierId==='aegis-filament');game.beginEquipmentPlacement();}}
  } else if (debugSpawn === 'explore') {
    game.player.x=1660;
    game.player.y=140-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'lower') {
    game.player.x=2720;
    game.player.y=930-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'deep-vault') {
    openDebugDepth();
    game.player.x=2890;
    game.player.y=1120-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'deep-gallery') {
    openDebugDepth();
    const landing=game.platforms.find(block=>block.id==='vault-deep-drop-one');game.player.x=landing.x+80;
    game.player.y=landing.y-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'vault-upper') {
    game.unlockAbility('wallClimb');
    game.player.x=2880;
    game.player.y=-70-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'crown-upper') {
    game.unlockAbility('wallClimb');
    game.player.x=8890;
    game.player.y=-1450-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'depth-boss') {
    openDebugDepth();
    game.player.x=2920;
    game.player.y=game.depthBossArena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};game.updateDepthBossArena();
  } else if (debugSpawn === 'dash') {
    openDebugDepth();
    const depthBoss=game.depthBoss();game.depthBossArena.cleared=true;depthBoss.dead=true;depthBoss.health=0;game.releaseDepthReturn();
    game.player.x=game.pickups.find(item=>item.id==='dash-core').x;
    game.player.y=game.depthBossArena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'mini') {
    const arena=game.miniBossArenas[0];
    game.player.x=arena.x+80;
    game.player.y=arena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'vault-boss') {
    game.player.x=game.vaultBossArena.x+60;
    game.player.y=game.vaultBossArena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'volt') {
    const vaultBoss=game.vaultBoss();game.vaultBossArena.cleared=true;vaultBoss.dead=true;vaultBoss.health=0;
    const pickup=game.pickups.find(item=>item.id==='volt-core');
    game.player.x=pickup.x;
    game.player.y=pickup.y;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'merchant') {
    const door=game.merchants.find(merchant=>merchant.id==='merchant-parts');
    game.unlockAbility('wallClimb');game.player.x=door.x+15;
    game.player.y=door.y+door.h-game.player.h;
    for(const enemy of game.enemies)if(!enemy.isBoss&&!enemy.isVaultBoss&&!enemy.isDepthBoss&&!enemy.isMiniBoss&&Math.hypot(enemy.originX+enemy.w/2-(door.x+door.w/2),enemy.originY+enemy.h/2-(door.y+door.h/2))<=door.clearRadius)enemy.dead=true;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'verge-merchant') {
    const door=game.merchants.find(merchant=>merchant.id==='merchant-verge');
    game.player.x=door.x+15;
    game.player.y=door.y+door.h-game.player.h;
    for(const enemy of game.enemies)if(!enemy.isBoss&&!enemy.isVaultBoss&&!enemy.isDepthBoss&&!enemy.isMiniBoss&&Math.hypot(enemy.originX+enemy.w/2-(door.x+door.w/2),enemy.originY+enemy.h/2-(door.y+door.h/2))<=door.clearRadius)enemy.dead=true;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'merchant-room') {
    const serviceIds={health:'merchant-shells',energy:'merchant-salvage',internal:'merchant-foundry',modifier:'merchant-parts',response:'merchant-response',relic:'merchant-response',curator:'merchant-curator'},merchantId=serviceIds[debugPanel]??'merchant-parts';game.merchantRoom.activeMerchant=game.merchants.find(merchant=>merchant.id===merchantId);
    game.merchantRoom.returnPosition={x:game.merchantRoom.activeMerchant.x+15,y:game.merchantRoom.activeMerchant.y+game.merchantRoom.activeMerchant.h-game.player.h};
    game.player.x=game.merchantRoom.merchant.x-80;
    game.player.y=game.merchantRoom.merchant.y;
    game.player.scrap=6000;
    game.safePosition={x:game.player.x,y:game.player.y};
    game.openMerchantMenu(game.merchantRoom.activeMerchant);
  } else if (debugSpawn === 'wall') {
    game.unlockAbility('wallClimb');
    game.player.x=8445;
    game.player.y=-76;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'gauntlet') {
    game.player.x=9750;
    game.player.y=650-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'exchange') {
    game.player.x=14295;
    game.player.y=660-game.player.h;
    game.player.scrap=6000;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'forge-room') {
    const forge=game.merchants.find(merchant=>merchant.id==='merchant-forge');
    game.merchantRoom.activeMerchant=forge;
    game.merchantRoom.returnPosition={x:14295,y:660-game.player.h};
    game.player.x=game.merchantRoom.merchant.x-80;
    game.player.y=game.merchantRoom.merchant.y;
    game.player.scrap=6000;
    game.safePosition={x:game.player.x,y:game.player.y};
    game.openMerchantMenu(game.merchantRoom.activeMerchant);
  }
  playing = true;
  syncAbilityControls();
  renderer.resetLegs();
  startScreen.classList.add('hidden');
}

document.querySelector('#play').addEventListener('click', begin);
bindInput({ getGame: () => game, isPlaying: () => playing, begin });

function frame(timestamp) {
  const dt = Math.min((timestamp-lastFrame)/1000,.034)||1/60;
  lastFrame = timestamp;
  if (playing) {
    game.update(dt);
    syncAbilityControls();
  }
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
