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
    Object.assign(game.player,{scrap:860,electricity:67,primaryDamage:5,damageUpgrades:2,materials:{titanium:4,uranium:1},purchasedItems:[{id:'edge-coil-1',name:'EDGE COIL MK 1',detail:'+1 PRIMARY SLASH DAMAGE'},{id:'edge-coil-2',name:'EDGE COIL MK 2',detail:'+1 PRIMARY SLASH DAMAGE'}]});
    for(const region of ['verge','vault','foundry','bastion','concourse'])game.mappedRegions.add(region);game.inventoryOpen=true;
    if(debugPanel==='map'||debugPanel==='overview'||debugPanel==='nomap'){game.inventoryPage=0;game.mapOverview=debugPanel==='overview';if(debugPanel==='nomap')game.mapRegionIndex=5;}
    else if(debugPanel==='materials')game.inventoryPage=2;else if(debugPanel==='items')game.inventoryPage=3;
  } else if (debugSpawn === 'explore') {
    game.player.x=1660;
    game.player.y=140-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'lower') {
    game.player.x=2720;
    game.player.y=930-game.player.h;
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
    game.player.x=7815;
    game.player.y=660-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'verge-merchant') {
    const door=game.merchants.find(merchant=>merchant.id==='merchant-verge');
    game.player.x=door.x+15;
    game.player.y=door.y+door.h-game.player.h;
    for(const enemy of game.enemies)if(!enemy.isBoss&&!enemy.isVaultBoss&&!enemy.isMiniBoss&&Math.abs(enemy.originX+enemy.w/2-(door.x+door.w/2))<=door.clearRadius)enemy.dead=true;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'merchant-room') {
    game.merchantRoom.activeMerchant=game.merchants[0];
    game.merchantRoom.returnPosition={x:7815,y:660-game.player.h};
    game.player.x=game.merchantRoom.spawn.x;
    game.player.y=game.merchantRoom.spawn.y;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'wall') {
    game.unlockAbility('wallClimb');
    game.player.x=8290;
    game.player.y=-180;
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
