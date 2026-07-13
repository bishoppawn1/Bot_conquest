import { clamp, hasFloorAhead, overlaps, shareSupportingPlatform, supportingPlatform } from './geometry.js';
import { ABILITY_COSTS, ATTACK_RANGE, ATTACK_TIMING, circleIntersectsRect, directionalBox, ELECTRICITY_MAX, ELECTRICITY_PER_HIT, fieldCircle, SCRAP_VALUES } from './combat.js';
import { BOSS_ARENA, CONDUITS, ENEMY_SPAWNS, FORGE_UPGRADE_COSTS, JUNK_PILES, MERCHANT_ROOM, MERCHANT_SPAWNS, MINI_BOSS_ARENAS, PICKUP_SPAWNS, PLATFORMS, RECESSES, REGION_GATES, REGIONS, REST_AREA, SPAWN, TRAPS, VAULT_BOSS_ARENA, WORLD_BOTTOM, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH } from './level.js';

export { WORLD_WIDTH as WIDTH, WORLD_HEIGHT as HEIGHT } from './level.js';
export const PLAYER_JUMP_SPEED = 600;
export const HEAL_DURATION = .7;
export const WALL_CLIMB_SPEED = 155;

export class Game {
  constructor() { this.reset(); }
  reset() {
    this.time=0; this.running=true; this.cameraX=0; this.cameraY=0; this.shake=0;
    this.input={left:false,right:false,jump:false,down:false,dash:false,attack:false,heal:false,field:false,electricJab:false,rest:false,inventory:false};
    this.prev={...this.input}; this.particles=[];this.bossProjectiles=[];this.bossShockwave=null;this.abilityPopup=null;this.rewardToast=null;
    this.spawn={...SPAWN};
    this.safePosition={...this.spawn};
    this.respawnPoint={...this.spawn};this.recoveryCorpse=null;this.inventoryOpen=false;this.inventoryPage=1;this.inventorySelection=0;this.inventoryPages=['map','status','materials','items'];this.mappedRegions=new Set();
    this.player={x:this.spawn.x,y:this.spawn.y,w:50,h:36,vx:0,vy:0,facing:1,aimX:1,aimY:0,attackAimX:1,attackAimY:0,specialAimX:1,specialAimY:0,onGround:false,onWall:0,jumps:1,lives:3,scrap:0,electricity:0,materials:{titanium:0,uranium:0},purchasedItems:[],primaryDamage:1,damageUpgrades:0,abilities:{doubleJump:false,dash:false,wallClimb:false,heal:true,field:false,electricJab:false},invuln:0,dashTime:0,dashCooldown:0,wallJumpTime:0,attackTime:0,attackCooldown:0,attackId:0,attackHits:new Set(),specialTime:0,specialType:null,specialHits:new Set(),healTime:0,healFlash:0,restFlash:0};
    this.platforms=PLATFORMS.map(platform=>({...platform}));
    this.traps=TRAPS.map(trap=>({...trap}));
    this.recesses=RECESSES.map(recess=>({...recess}));
    this.bossArena={...BOSS_ARENA,boss:{...BOSS_ARENA.boss},active:false,cleared:false,gateProgress:0};
    this.vaultBossArena={...VAULT_BOSS_ARENA,boss:{...VAULT_BOSS_ARENA.boss},active:false,cleared:false,leftGateProgress:0};
    this.miniBossArenas=MINI_BOSS_ARENAS.map(arena=>({...arena,enemy:{...arena.enemy},active:false,cleared:false,gateProgress:0}));
    this.restArea={...REST_AREA,station:{...REST_AREA.station}};
    this.regions=REGIONS.map(region=>({...region}));this.regionGates=REGION_GATES.map(gate=>({...gate}));
    this.regionId=this.regionAt(this.spawn.x)?.id??null;this.regionToast=null;this.regionToastTime=0;
    this.pickups=PICKUP_SPAWNS.map(pickup=>({...pickup,collected:false}));
    this.merchants=MERCHANT_SPAWNS.map(merchant=>({...merchant}));
    this.merchantRoom={...MERCHANT_ROOM,spawn:{...MERCHANT_ROOM.spawn},exit:{...MERCHANT_ROOM.exit},merchant:{...MERCHANT_ROOM.merchant},activeMerchant:null,returnPosition:null};
    const boss=this.enemy(BOSS_ARENA.boss);Object.assign(boss,{isBoss:true,maxHealth:BOSS_ARENA.boss.health,bossMove:'dormant',bossTimer:0,bossMoveIndex:0});
    const vaultBoss=this.enemy(VAULT_BOSS_ARENA.boss);Object.assign(vaultBoss,{isVaultBoss:true,name:VAULT_BOSS_ARENA.name,maxHealth:VAULT_BOSS_ARENA.boss.health,rewardScrap:VAULT_BOSS_ARENA.rewardScrap,bossMove:'dormant',bossTimer:0,bossMoveIndex:0});
    const miniBosses=this.miniBossArenas.map(arena=>{const enemy=this.enemy(arena.enemy);return Object.assign(enemy,{isMiniBoss:true,arenaId:arena.id,name:arena.name,maxHealth:arena.enemy.health,rewardScrap:arena.rewardScrap,rewardMaterial:arena.rewardMaterial});});
    this.enemies=[...ENEMY_SPAWNS.map(spawn=>this.enemy(spawn)),...miniBosses,vaultBoss,boss];
    this.conduits=CONDUITS.map((conduit,index)=>({...conduit,kind:'conduit',id:`conduit-${index}`,maxCharge:conduit.charge,hitFlash:0}));
    this.junkPiles=JUNK_PILES.map((pile,index)=>({...pile,kind:'junk',id:pile.id??`junk-${index}`,maxHealth:pile.health,dead:false,hitFlash:0}));
  }
  enemy({type,x,y,w,h,health,patrol=false,patrolRange=80,patrolDirection=1}){return{type,x,y,w,h,originX:x,originY:y,vx:0,vy:0,health:health??(type==='boss'?18:type==='brute'?3:1),onGround:false,phase:x*.01,dead:false,active:false,aggroRadius:type==='drone'?340:type==='brute'?240:210,patrol,patrolRange,patrolDirection,windup:0,chargeTime:0,chargeCooldown:0,jumpCooldown:0,jumping:false,chargeDirection:patrolDirection};}
  inventoryEntryCount(){const page=this.inventoryPages[this.inventoryPage];if(page==='status')return 5;if(page==='materials')return 3;if(page==='items')return Math.max(1,this.player.purchasedItems.length);return 1;}
  setInput(input){Object.assign(this.input,input);}
  pressed(key){return this.input[key]&&!this.prev[key];}
  update(dt=1/60){
    if(!this.running)return; dt=Math.min(dt,.034); const p=this.player;
    const toggledInventory=this.pressed('inventory');if(toggledInventory){this.inventoryOpen=!this.inventoryOpen;p.vx=0;p.vy=0;}
    if(this.inventoryOpen){if(!toggledInventory){if(this.pressed('left')){this.inventoryPage=Math.max(0,this.inventoryPage-1);this.inventorySelection=0;}if(this.pressed('right')){this.inventoryPage=Math.min(this.inventoryPages.length-1,this.inventoryPage+1);this.inventorySelection=0;}if(this.pressed('jump'))this.inventorySelection=Math.max(0,this.inventorySelection-1);if(this.pressed('down'))this.inventorySelection=Math.min(this.inventoryEntryCount()-1,this.inventorySelection+1);}this.prev={...this.input};return;}
    this.time+=dt;
    p.invuln=Math.max(0,p.invuln-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.wallJumpTime=Math.max(0,p.wallJumpTime-dt);p.attackCooldown=Math.max(0,p.attackCooldown-dt);p.attackTime=Math.max(0,p.attackTime-dt);p.specialTime=Math.max(0,p.specialTime-dt);p.healFlash=Math.max(0,p.healFlash-dt);p.restFlash=Math.max(0,p.restFlash-dt);this.regionToastTime=Math.max(0,this.regionToastTime-dt);if(this.abilityPopup)this.abilityPopup.time=Math.max(0,this.abilityPopup.time-dt);if(this.rewardToast)this.rewardToast.time=Math.max(0,this.rewardToast.time-dt);for(const c of this.conduits)c.hitFlash=Math.max(0,c.hitFlash-dt);if(this.recoveryCorpse)this.recoveryCorpse.hitFlash=Math.max(0,this.recoveryCorpse.hitFlash-dt);
    if(p.healTime>0){p.healTime=Math.max(0,p.healTime-dt);if(p.healTime===0)this.completeHeal();}
    const axis=(this.input.right?1:0)-(this.input.left?1:0);
    if(this.input.down){p.aimX=0;p.aimY=1;}else if(this.input.jump){p.aimX=0;p.aimY=-1;}else if(axis){p.facing=axis;p.aimX=axis;p.aimY=0;}
    if(this.pressed('dash')&&p.abilities.dash&&p.dashCooldown<=0){p.dashTime=.14;p.dashCooldown=.55;p.vx=p.facing*700;p.vy=0;this.burst(p.x+19,p.y+22,'#d6ff3f',10);}
    const wall=this.wallSide(p)||p.onWall;
    const climbingWall=p.abilities.wallClimb&&wall;
    const wallJump=climbingWall&&((wall===-1&&this.pressed('right'))||(wall===1&&this.pressed('left')));
    if(wallJump){p.vx=-wall*360;p.vy=-440;p.wallJumpTime=.18;p.onWall=0;p.jumps=p.abilities.doubleJump?1:0;this.burst(p.x+p.w/2,p.y+p.h/2,'#ffffff',8);}
    if(this.pressed('jump')&&!wallJump&&p.jumps>0&&!climbingWall){p.vy=-PLAYER_JUMP_SPEED;p.jumps--;p.onGround=false;this.burst(p.x+19,p.y+40,'#d6ff3f',5);}
    if(this.pressed('attack')&&p.attackCooldown<=0)this.startAttack();
    if(this.pressed('heal'))this.startHeal();
    if(this.pressed('field'))this.startSpecial('field');
    if(this.pressed('electricJab'))this.startSpecial('electricJab');
    if(this.pressed('rest'))this.tryInteract();
    const climbing=climbingWall&&this.input.jump&&!wallJump&&p.wallJumpTime<=0;
    if(p.dashTime>0)p.dashTime-=dt; else if(climbing){p.vx=wall*18;p.vy=-WALL_CLIMB_SPEED;}else {if(p.wallJumpTime<=0){const target=axis*250;p.vx+=(target-p.vx)*Math.min(1,(p.onGround?13:6)*dt);}p.vy+=1100*dt;}
    this.moveActor(p,dt,true);
    this.rememberSafePlatform();
    const hitSpike=this.traps.some(trap=>overlaps(p,trap));
    if(hitSpike)this.damagePlayer('spike');else if(p.y>WORLD_BOTTOM+100)this.damagePlayer('fall');
    p.x=clamp(p.x,0,WORLD_WIDTH-p.w);this.updateRegion();this.updatePickups();
    this.updateBossArena(dt);this.updateVaultBossArena(dt);this.updateMiniBossArenas(dt);this.updateCombat();this.updateEnemies(dt);this.updateBossHazards(dt);this.updateParticles(dt);
    this.cameraX=clamp(p.x-350,0,WORLD_WIDTH-1280);this.cameraY=clamp(p.y-360,WORLD_TOP,WORLD_BOTTOM-720);this.shake=Math.max(0,this.shake-dt*20);
    this.prev={...this.input};
  }
  moveActor(a,dt,isPlayer=false){
    const colliders=isPlayer?[...this.platforms,...this.junkPiles.filter(pile=>!pile.dead),...this.bossGates(),...this.vaultBossGates(),...this.miniBossGates()]:this.platforms;
    a.x+=a.vx*dt;a.onWall=0;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vx>0){a.x=b.x-a.w;if(isPlayer)a.onWall=1;}else if(a.vx<0){a.x=b.x+b.w;if(isPlayer)a.onWall=-1;}a.vx=0;
    }
    a.y+=a.vy*dt;a.onGround=false;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vy>=0){a.y=b.y-a.h;a.vy=0;a.onGround=true;if(isPlayer)a.jumps=a.abilities.doubleJump?2:1;}else{a.y=b.y+b.h;a.vy=0;}
    }
  }
  wallSide(actor){const inset=4,left={x:actor.x-3,y:actor.y+inset,w:3,h:actor.h-inset*2},right={x:actor.x+actor.w,y:actor.y+inset,w:3,h:actor.h-inset*2};if(this.platforms.some(block=>overlaps(left,block)))return-1;if(this.platforms.some(block=>overlaps(right,block)))return 1;return 0;}
  regionAt(x){return this.regions?.find(region=>x>=region.x&&x<region.x+region.w)??null;}
  updateRegion(){if(this.merchantRoom.activeMerchant)return;const region=this.regionAt(this.player.x+this.player.w/2);if(!region||region.id===this.regionId)return;this.regionId=region.id;this.regionToast=region.name;this.regionToastTime=2.4;}
  pickupAvailable(pickup){return!pickup.collected&&(!pickup.requiresBossClear||this.bossArena.cleared)&&(!pickup.requiresVaultBossClear||this.vaultBossArena.cleared);}
  updatePickups(){for(const pickup of this.pickups)if(this.pickupAvailable(pickup)&&overlaps(this.player,pickup)){pickup.collected=true;if(pickup.kind==='ability'){this.unlockAbility(pickup.ability);this.abilityPopup={ability:pickup.ability,name:pickup.name,key:pickup.key,description:pickup.description,color:pickup.color??'#ffffff',time:4.5,maxTime:4.5};}if(pickup.kind==='map'){for(const region of pickup.regions)this.mappedRegions.add(region);this.rewardToast={text:'MAP DATA ACQUIRED',detail:pickup.name,time:3};}this.burst(pickup.x+pickup.w/2,pickup.y+pickup.h/2,pickup.color??'#ffffff',36);}}
  nearbyMerchantDoor(){if(this.merchantRoom.activeMerchant)return null;const p=this.player;return this.merchants.find(merchant=>p.x+p.w/2>=merchant.x&&p.x+p.w/2<=merchant.x+merchant.w&&Math.abs(p.y+p.h-merchant.y-merchant.h)<=20)??null;}
  merchantDoorUnlocked(merchant){const center=merchant.x+merchant.w/2;return this.enemies.every(enemy=>enemy.dead||enemy.isBoss||enemy.isVaultBoss||enemy.isMiniBoss||Math.abs(enemy.originX+enemy.w/2-center)>merchant.clearRadius);}
  nearMerchantExit(){const exit=this.merchantRoom.exit,p=this.player;return Boolean(this.merchantRoom.activeMerchant&&p.x+p.w/2>=exit.x&&p.x+p.w/2<=exit.x+exit.w&&Math.abs(p.y+p.h-exit.y-exit.h)<=20);}
  nearbyMerchant(){if(!this.merchantRoom.activeMerchant)return null;const merchant={...this.merchantRoom.activeMerchant,...this.merchantRoom.merchant};const p=this.player;return Math.hypot((p.x+p.w/2)-(merchant.x+merchant.w/2),(p.y+p.h/2)-(merchant.y+merchant.h/2))<=105?merchant:null;}
  rememberSafePlatform(){
    const p=this.player,floor=supportingPlatform(p,this.platforms,3);if(!p.onGround||!floor)return;
    const margin=Math.min(12,Math.max(0,(floor.w-p.w)/2));
    this.safePosition={x:clamp(p.x,floor.x+margin,floor.x+floor.w-p.w-margin),y:floor.y-p.h};
  }
  moveFlyingActor(actor,dt){
    actor.x+=actor.vx*dt;
    for(const block of this.platforms)if(overlaps(actor,block)){
      actor.x=actor.vx>0?block.x-actor.w:block.x+block.w;actor.vx=0;
    }
    actor.y+=actor.vy*dt;
    for(const block of this.platforms)if(overlaps(actor,block)){
      actor.y=actor.vy>0?block.y-actor.h:block.y+block.h;actor.vy=0;
    }
  }
  boss(){return this.enemies.find(enemy=>enemy.isBoss)??null;}
  bossGates(){
    const arena=this.bossArena;if(!arena||arena.gateProgress<=0)return[];
    const y=arena.gateStartY+(arena.gateClosedY-arena.gateStartY)*arena.gateProgress;
    return[{x:arena.leftGateX,y,w:arena.gateWidth,h:arena.gateHeight,kind:'boss-gate'},{x:arena.rightGateX,y,w:arena.gateWidth,h:arena.gateHeight,kind:'boss-gate'}];
  }
  vaultBoss(){return this.enemies.find(enemy=>enemy.isVaultBoss)??null;}
  vaultBossGates(){
    const arena=this.vaultBossArena;if(!arena||arena.cleared)return[];
    const gates=[{x:arena.rightGateX,y:arena.gateY,w:arena.gateWidth,h:arena.gateHeight,kind:'vault-boss-gate',side:'exit'}];
    if(arena.leftGateProgress>0){const y=arena.gateY-arena.gateHeight*(1-arena.leftGateProgress);gates.push({x:arena.leftGateX,y,w:arena.gateWidth,h:arena.gateHeight,kind:'vault-boss-gate',side:'entry'});}
    return gates;
  }
  miniBoss(arenaId){return this.enemies.find(enemy=>enemy.isMiniBoss&&enemy.arenaId===arenaId)??null;}
  miniBossGates(){
    const gates=[];
    for(const arena of this.miniBossArenas)if(arena.gateProgress>0){const y=arena.gateY-arena.gateHeight*(1-arena.gateProgress);gates.push({x:arena.gateX,y,w:arena.gateWidth,h:arena.gateHeight,kind:'mini-boss-gate',arenaId:arena.id});}
    return gates;
  }
  updateMiniBossArenas(dt){
    const p=this.player,centerX=p.x+p.w/2,centerY=p.y+p.h/2;
    for(const arena of this.miniBossArenas){
      const enemy=this.miniBoss(arena.id);
      if(!arena.active&&!arena.cleared&&centerX>=arena.x&&centerX<arena.gateX&&centerY>=arena.triggerY&&centerY<arena.floorY){arena.active=true;if(enemy)enemy.active=true;}
      const target=arena.active&&!arena.cleared&&enemy&&!enemy.dead?1:0;
      arena.gateProgress+=Math.sign(target-arena.gateProgress)*Math.min(Math.abs(target-arena.gateProgress),dt*4);
    }
  }
  updateBossArena(dt){
    const arena=this.bossArena,boss=this.boss();if(!arena||!boss)return;
    const center=this.player.x+this.player.w/2,centerY=this.player.y+this.player.h/2;
    const insideChamber=centerY>=arena.y&&centerY<arena.floorY;
    if(!arena.active&&!arena.cleared&&insideChamber&&center>=arena.triggerX&&center<arena.rightGateX){arena.active=true;boss.bossMove='idle';boss.bossTimer=.65;}
    const target=arena.active&&!arena.cleared?1:0;
    arena.gateProgress+=Math.sign(target-arena.gateProgress)*Math.min(Math.abs(target-arena.gateProgress),dt*3.4);
  }
  updateVaultBossArena(dt){
    const arena=this.vaultBossArena,boss=this.vaultBoss();if(!arena||!boss)return;
    const p=this.player,centerX=p.x+p.w/2,centerY=p.y+p.h/2;
    if(!arena.active&&!arena.cleared&&centerX>=arena.x&&centerX<arena.rightGateX&&centerY>=arena.triggerY&&centerY<arena.floorY){arena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=.55;}
    const target=arena.active&&!arena.cleared&&!boss.dead?1:0;
    arena.leftGateProgress+=Math.sign(target-arena.leftGateProgress)*Math.min(Math.abs(target-arena.leftGateProgress),dt*4);
  }
  updateMiniBoss(enemy,dt){
    const arena=this.miniBossArenas.find(item=>item.id===enemy.arenaId);
    if(!arena?.active||arena.cleared){enemy.active=false;enemy.vx=0;enemy.vy+=900*dt;this.moveActor(enemy,dt);return;}
    enemy.active=true;enemy.chargeCooldown=Math.max(0,enemy.chargeCooldown-dt);
    if(enemy.chargeTime>0){enemy.chargeTime=Math.max(0,enemy.chargeTime-dt);const safe=!enemy.onGround||hasFloorAhead(enemy,enemy.chargeDirection,this.platforms);enemy.vx=safe?enemy.chargeDirection*225:0;}
    else if(enemy.windup>0){enemy.windup=Math.max(0,enemy.windup-dt);enemy.vx=0;if(enemy.windup===0){enemy.chargeTime=.52;enemy.chargeDirection=Math.sign(this.player.x-enemy.x)||enemy.chargeDirection;enemy.vy=-190;}}
    else if(enemy.chargeCooldown<=0){enemy.windup=.42;enemy.chargeCooldown=1.5;enemy.vx=0;}
    else enemy.vx=0;
    enemy.vy+=900*dt;this.moveActor(enemy,dt);
  }
  updateVaultBoss(enemy,dt){
    const arena=this.vaultBossArena;
    if(!arena.active||arena.cleared){enemy.active=false;enemy.vx=0;enemy.vy+=900*dt;this.moveActor(enemy,dt);return;}
    enemy.active=true;enemy.bossTimer=Math.max(0,enemy.bossTimer-dt);
    if(enemy.bossMove==='idle'&&enemy.bossTimer===0){const moves=['wardenChargeWindup','wardenLeapWindup','wardenVolleyWindup'];enemy.bossMove=moves[enemy.bossMoveIndex%moves.length];enemy.bossMoveIndex++;enemy.bossTimer=enemy.bossMove==='wardenVolleyWindup'?.55:.42;enemy.vx=0;}
    else if(enemy.bossMove?.endsWith('Windup')&&enemy.bossTimer===0){
      if(enemy.bossMove==='wardenChargeWindup'){enemy.bossMove='wardenCharge';enemy.bossTimer=.58;enemy.chargeDirection=Math.sign(this.player.x-enemy.x)||1;}
      else if(enemy.bossMove==='wardenLeapWindup'){enemy.bossMove='wardenLeap';enemy.bossTimer=1;enemy.vy=-430;enemy.vx=Math.sign(this.player.x-enemy.x)*155;}
      else{this.spawnVaultVolley(enemy);enemy.bossMove='wardenRecover';enemy.bossTimer=.7;}
    }else if(enemy.bossMove==='wardenCharge'){enemy.vx=enemy.chargeDirection*245;if(enemy.bossTimer===0){enemy.bossMove='wardenRecover';enemy.bossTimer=.55;enemy.vx=0;}}
    else if(enemy.bossMove==='wardenLeap'&&enemy.onGround){this.bossShockwave={x:enemy.x+enemy.w/2,y:arena.floorY,radius:0,maxRadius:190,time:.45,hit:false,color:'#75f5ff'};enemy.bossMove='wardenRecover';enemy.bossTimer=.65;enemy.vx=0;this.shake=12;}
    else if(enemy.bossMove==='wardenRecover'&&enemy.bossTimer===0){enemy.bossMove='idle';enemy.bossTimer=.4;}
    enemy.vy+=900*dt;this.moveActor(enemy,dt);enemy.x=clamp(enemy.x,arena.x,arena.rightGateX-enemy.w);
  }
  aim(){return{x:this.player.aimX,y:this.player.aimY};}
  enemyTargetable(enemy){if(enemy.isVaultBoss)return this.vaultBossArena.active&&!this.vaultBossArena.cleared;if(!enemy.isMiniBoss)return true;const arena=this.miniBossArenas.find(item=>item.id===enemy.arenaId);return Boolean(arena?.active&&!arena.cleared);}
  attackDirection(){return{x:this.player.attackAimX,y:this.player.attackAimY};}
  specialDirection(){return{x:this.player.specialAimX,y:this.player.specialAimY};}
  attackBox(){return directionalBox(this.player,this.attackDirection(),ATTACK_RANGE.primary,30);}
  startAttack(){const p=this.player;if(p.healTime>0)return false;p.attackAimX=p.aimX;p.attackAimY=p.aimY;p.attackTime=ATTACK_TIMING.primary;p.attackCooldown=.32;p.attackId++;p.attackHits=new Set();this.resolvePrimaryAttack();this.burst(p.x+p.w/2+p.attackAimX*62,p.y+p.h/2+p.attackAimY*62,'#ffffff',6);return true;}
  startSpecial(type){
    const p=this.player,cost=ABILITY_COSTS[type];if(p.healTime>0||!p.abilities[type]||p.specialTime>0||p.electricity<cost)return false;
    p.electricity-=cost;p.specialAimX=p.aimX;p.specialAimY=p.aimY;p.specialType=type;p.specialTime=ATTACK_TIMING[type];p.specialHits=new Set();return true;
  }
  startHeal(){const p=this.player;if(p.healTime>0||p.invuln>0||!p.abilities.heal||p.lives>=3||p.electricity<ABILITY_COSTS.heal)return false;p.electricity-=ABILITY_COSTS.heal;p.healTime=HEAL_DURATION;return true;}
  cancelHeal(){if(this.player.healTime<=0)return false;this.player.healTime=0;return true;}
  completeHeal(){const p=this.player;if(p.lives>=3)return false;p.lives++;p.healFlash=.6;this.burst(p.x+p.w/2,p.y+p.h/2,'#75f5ff',24);return true;}
  canRest(){const p=this.player,station=this.restArea.station,dx=(p.x+p.w/2)-(station.x+station.w/2),dy=(p.y+p.h/2)-(station.y+station.h/2);return this.bossArena.cleared&&Math.hypot(dx,dy)<=station.interactionRadius;}
  tryRest(){if(!this.canRest())return false;const p=this.player,station=this.restArea.station;p.lives=3;p.invuln=0;p.vx=0;p.vy=0;p.restFlash=1;const checkpointX=clamp(station.x+station.w+24,this.restArea.x+16,this.restArea.x+this.restArea.w-p.w-16);this.safePosition={x:checkpointX,y:this.restArea.floorY-p.h};this.respawnPoint={...this.safePosition};this.respawnOrdinaryEnemies();this.burst(station.x+station.w/2,station.y+station.h/2,'#d6ff3f',30);return true;}
  tryInteract(){
    const merchant=this.nearbyMerchant();
    if(merchant?.service==='damageUpgrade')return this.buyDamageUpgrade(merchant);
    if(this.nearMerchantExit()){const p=this.player,returnPosition=this.merchantRoom.returnPosition;p.x=returnPosition.x;p.y=returnPosition.y;p.vx=0;p.vy=0;this.safePosition={...returnPosition};this.merchantRoom.activeMerchant=null;this.merchantRoom.returnPosition=null;return true;}
    const door=this.nearbyMerchantDoor();
    if(door&&this.merchantDoorUnlocked(door)){const p=this.player;this.merchantRoom.returnPosition={x:p.x,y:p.y};this.merchantRoom.activeMerchant=door;p.x=this.merchantRoom.spawn.x;p.y=this.merchantRoom.spawn.y;p.vx=0;p.vy=0;this.safePosition={...this.merchantRoom.spawn};return true;}
    return this.tryRest();
  }
  nextDamageUpgradeCost(merchant){return(merchant.upgradeCosts??FORGE_UPGRADE_COSTS)[this.player.damageUpgrades]??null;}
  buyDamageUpgrade(merchant){const p=this.player,cost=this.nextDamageUpgradeCost(merchant);if(cost===null||p.scrap<cost)return false;p.scrap-=cost;p.damageUpgrades++;p.primaryDamage++;p.purchasedItems.push({id:`edge-coil-${p.damageUpgrades}`,name:`EDGE COIL MK ${p.damageUpgrades}`,detail:'+1 PRIMARY SLASH DAMAGE'});this.rewardToast={text:'SLASH DAMAGE +1',detail:`${merchant.name} INSTALLED EDGE COIL MK ${p.damageUpgrades}`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#ffffff',34);return true;}
  unlockAbility(name){if(name in this.player.abilities){this.player.abilities[name]=true;if(name==='doubleJump'&&this.player.onGround)this.player.jumps=2;return true;}return false;}
  gainMaterial(type,amount){if(!(type in this.player.materials))return false;this.player.materials[type]+=amount;return true;}
  gainElectricity(amount=ELECTRICITY_PER_HIT){this.player.electricity=clamp(this.player.electricity+amount,0,ELECTRICITY_MAX);}
  hitTarget(target,damage,hitSet,electricity=ELECTRICITY_PER_HIT){
    if(hitSet.has(target))return;hitSet.add(target);
    if(target.kind==='corpse'){
      target.health-=damage;target.hitFlash=.18;this.burst(target.x+target.w/2,target.y+target.h/2,'#ffffff',10);
      if(target.health<=0&&!target.dead){target.dead=true;this.player.scrap+=target.scrapValue;this.rewardToast={text:`+${target.scrapValue} SCRAP`,detail:'WRECKAGE RECOVERED',time:3};this.burst(target.x+target.w/2,target.y+target.h/2,'#d6ff3f',36);}return;
    }
    if(target.kind==='conduit'){const harvested=Math.min(target.energyPerHit,target.charge);target.charge-=harvested;this.gainElectricity(harvested);target.hitFlash=.22;this.burst(target.x+target.w/2,target.y+target.h/2,target.charge>0?'#75f5ff':'#657075',harvested>0?10:3);return;}
    if(target.kind!=='junk')this.gainElectricity(electricity);
    if(target.kind==='junk'&&damage<(target.minimumDamage??1)){target.hitFlash=.18;this.burst(target.x+target.w/2,target.y+target.h/2,'#ffffff',5);return;}
    target.health-=damage;target.hitFlash=.18;this.burst(target.x+target.w/2,target.y+target.h/2,target.kind==='junk'?'#d9a441':'#ff493f',12);
    if(target.health<=0&&!target.dead){
      target.dead=true;const reward=target.kind==='junk'?target.scrapValue:target.isMiniBoss||target.isVaultBoss?target.rewardScrap:(SCRAP_VALUES[target.type]??5);this.player.scrap+=reward;const material=target.kind==='junk'?target.material:target.rewardMaterial;if(material)this.gainMaterial(material.type,material.amount);
      if(target.type==='boss'){this.bossArena.cleared=true;this.bossArena.active=false;this.bossProjectiles=[];this.bossShockwave=null;const barriers=this.platforms.filter(block=>block.destructibleAfterBoss);this.platforms=this.platforms.filter(block=>!block.destructibleAfterBoss);for(const barrier of barriers)this.burst(barrier.x+barrier.w/2,barrier.y+barrier.h/2,'#ff493f',45);}
      if(target.isVaultBoss){this.vaultBossArena.cleared=true;this.vaultBossArena.active=false;this.bossProjectiles=[];this.bossShockwave=null;this.rewardToast={text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED // VOLT CORE RELEASED`,time:3};}
      if(target.isMiniBoss){const arena=this.miniBossArenas.find(item=>item.id===target.arenaId);if(arena){arena.cleared=true;arena.active=false;}this.rewardToast=material?{text:`+${material.amount} ${material.type.toUpperCase()}`,detail:`${target.name} DEFEATED`,time:3}:{text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED`,time:3};}
      else if(target.kind==='junk'&&material)this.rewardToast={text:`+${material.amount} ${material.type.toUpperCase()}`,detail:'RARE MATERIAL RECOVERED',time:3};
      this.burst(target.x+target.w/2,target.y+target.h/2,'#d6ff3f',target.kind==='junk'?36:target.type==='boss'||target.isVaultBoss?70:target.isMiniBoss?48:20);
    }
  }
  resolvePrimaryAttack(){const p=this.player,box=this.attackBox();for(const e of this.enemies)if(!e.dead&&this.enemyTargetable(e)&&overlaps(box,e))this.hitTarget(e,p.primaryDamage,p.attackHits);for(const c of this.conduits)if(overlaps(box,c))this.hitTarget(c,0,p.attackHits);for(const pile of this.junkPiles)if(!pile.dead&&overlaps(box,pile))this.hitTarget(pile,1,p.attackHits,0);if(this.recoveryCorpse&&!this.recoveryCorpse.dead&&overlaps(box,this.recoveryCorpse))this.hitTarget(this.recoveryCorpse,p.primaryDamage,p.attackHits,0);}
  updateCombat(){
    const p=this.player;
    if(p.specialTime<=0)return;
    const damage=p.specialType==='electricJab'?2:1;
    const hits=p.specialType==='field'?(target=>circleIntersectsRect(fieldCircle(p),target)):(target=>overlaps(directionalBox(p,this.specialDirection(),ATTACK_RANGE.electricJab,38),target));
    for(const e of this.enemies)if(!e.dead&&this.enemyTargetable(e)&&hits(e))this.hitTarget(e,damage,p.specialHits,4);
    for(const c of this.conduits)if(hits(c))this.hitTarget(c,0,p.specialHits,4);
    for(const pile of this.junkPiles)if(!pile.dead&&hits(pile))this.hitTarget(pile,damage,p.specialHits,0);
    if(this.recoveryCorpse&&!this.recoveryCorpse.dead&&hits(this.recoveryCorpse))this.hitTarget(this.recoveryCorpse,damage,p.specialHits,0);
  }
  updateEnemies(dt){
    const p=this.player;
    for(const e of this.enemies){if(e.dead)continue;e.phase+=dt;
      if(e.type==='boss'){this.updateBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      if(e.isVaultBoss){this.updateVaultBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      if(e.isMiniBoss){this.updateMiniBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      const distance=Math.hypot((p.x+p.w/2)-(e.x+e.w/2),(p.y+p.h/2)-(e.y+e.h/2));
      if(e.type==='drone'){
        e.active=distance<=e.aggroRadius;
        if(e.active){const dx=(p.x+p.w/2)-(e.x+e.w/2),dy=(p.y+p.h/2)-(e.y+e.h/2),length=Math.max(1,Math.hypot(dx,dy)),speed=105;e.vx+=(dx/length*speed-e.vx)*Math.min(1,5*dt);e.vy+=(dy/length*speed-e.vy)*Math.min(1,5*dt);}
        else{e.vx*=Math.max(0,1-4*dt);const hoverY=e.originY+Math.sin(e.phase*2.5)*16;e.vy=(hoverY-e.y)*3;}
        this.moveFlyingActor(e,dt);
      } else {
        e.active=distance<=e.aggroRadius&&shareSupportingPlatform(e,p,this.platforms);
        e.chargeCooldown=Math.max(0,e.chargeCooldown-dt);e.jumpCooldown=Math.max(0,e.jumpCooldown-dt);
        const speed=e.type==='brute'?55:e.type==='roller'?115:75;
        let direction=e.active?Math.sign(p.x-e.x):(e.patrol&&e.onGround?e.patrolDirection:0);
        if(!e.active&&direction){if(e.x<=e.originX-e.patrolRange)e.patrolDirection=1;if(e.x+e.w>=e.originX+e.patrolRange)e.patrolDirection=-1;direction=e.patrolDirection;if(!hasFloorAhead(e,direction,this.platforms)){e.patrolDirection*=-1;direction=e.patrolDirection;}}
        const safeToAdvance=!e.onGround||hasFloorAhead(e,direction,this.platforms);
        if(e.type==='brute'&&e.active){
          if(e.chargeTime>0){e.chargeTime=Math.max(0,e.chargeTime-dt);const safeCharge=!e.onGround||hasFloorAhead(e,e.chargeDirection,this.platforms);e.vx=safeCharge?e.chargeDirection*190:0;}
          else if(e.windup>0){e.windup=Math.max(0,e.windup-dt);e.vx=0;if(e.windup===0){e.chargeTime=.42;e.chargeDirection=Math.sign(p.x-e.x)||e.chargeDirection;}}
          else if(e.chargeCooldown<=0){e.windup=.38;e.chargeCooldown=1.65;e.vx=0;}
          else e.vx=0;
        }else if(e.type==='roller'){
          const target=safeToAdvance?direction*(e.active?150:speed*.42):0;
          e.vx+=(target-e.vx)*Math.min(1,(e.active?3.5:5)*dt);
          if(!safeToAdvance)e.vx=0;
        }else if(e.type==='hopper'){
          const grounded=e.onGround||(!e.jumping&&Boolean(supportingPlatform(e,this.platforms)));
          if(e.active&&grounded&&safeToAdvance&&e.jumpCooldown<=0){e.vx=direction*210;e.vy=-560;e.jumpCooldown=.1;e.onGround=false;e.jumping=true;}
          else if(grounded)e.vx=safeToAdvance?direction*48:0;
          e.vy+=900*dt;this.moveActor(e,dt);if(e.jumping&&e.onGround){e.jumping=false;e.jumpCooldown=.7;}
          if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;
        }else e.vx=safeToAdvance?direction*speed*(e.active?1:.42):0;
        e.vy+=900*dt;this.moveActor(e,dt);
      }
      if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);
    }
  }
  updateBoss(boss,dt){
    if(!this.bossArena.active||this.bossArena.cleared){boss.active=false;boss.vx=0;return;}
    boss.active=true;boss.bossTimer=Math.max(0,boss.bossTimer-dt);
    if(boss.bossMove==='idle'&&boss.bossTimer===0){const moves=['chargeWindup','slamWindup','volleyWindup'];boss.bossMove=moves[boss.bossMoveIndex%moves.length];boss.bossMoveIndex++;boss.bossTimer=boss.bossMove==='volleyWindup'?.6:.45;boss.vx=0;}
    else if(boss.bossMove.endsWith('Windup')&&boss.bossTimer===0){
      if(boss.bossMove==='chargeWindup'){boss.bossMove='bossCharge';boss.bossTimer=.68;boss.chargeDirection=Math.sign(this.player.x-boss.x)||1;}
      else if(boss.bossMove==='slamWindup'){boss.bossMove='slamAir';boss.bossTimer=1.4;boss.vy=-520;boss.onGround=false;}
      else{this.spawnBossVolley(boss);boss.bossMove='recover';boss.bossTimer=.75;}
    }else if(boss.bossMove==='bossCharge'){boss.vx=boss.chargeDirection*260;if(boss.bossTimer===0){boss.bossMove='recover';boss.bossTimer=.65;boss.vx=0;}}
    else if(boss.bossMove==='recover'&&boss.bossTimer===0){boss.bossMove='idle';boss.bossTimer=.45;}
    boss.vy+=900*dt;this.moveActor(boss,dt);
    if(boss.bossMove==='slamAir'&&boss.onGround){this.bossShockwave={x:boss.x+boss.w/2,y:this.bossArena.floorY,radius:0,maxRadius:300,time:.55,hit:false};boss.bossMove='recover';boss.bossTimer=.8;this.shake=16;}
  }
  spawnBossVolley(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h*.35,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx);
    for(const offset of[-.2,0,.2]){const angle=base+offset,speed=230;this.bossProjectiles.push({x:sx-7,y:sy-7,w:14,h:14,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:4,dead:false});}
  }
  spawnVaultVolley(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h*.35,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx);
    for(const offset of[-.42,-.21,0,.21,.42]){const angle=base+offset,speed=205;this.bossProjectiles.push({x:sx-6,y:sy-6,w:12,h:12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.2,dead:false,color:'#75f5ff'});}
  }
  updateBossHazards(dt){
    for(const bolt of this.bossProjectiles){if(bolt.dead)continue;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;bolt.life-=dt;if(this.platforms.some(block=>overlaps(bolt,block)))bolt.dead=true;if(!bolt.dead&&overlaps(bolt,this.player)){bolt.dead=true;this.damagePlayer('enemy',bolt.x);}}
    this.bossProjectiles=this.bossProjectiles.filter(bolt=>!bolt.dead&&bolt.life>0);
    const wave=this.bossShockwave;if(!wave)return;wave.time=Math.max(0,wave.time-dt);wave.radius+=(wave.maxRadius-wave.radius)*Math.min(1,8*dt);const playerCenter=this.player.x+this.player.w/2;if(!wave.hit&&Math.abs(playerCenter-wave.x)<=wave.radius&&Math.abs(this.player.y+this.player.h-wave.y)<45){wave.hit=true;this.damagePlayer('enemy',wave.x);}if(wave.time===0)this.bossShockwave=null;
  }
  respawnOrdinaryEnemies(){const protectedEnemies=this.enemies.filter(enemy=>enemy.isBoss||enemy.isVaultBoss||enemy.isMiniBoss);this.enemies=[...ENEMY_SPAWNS.map(spawn=>this.enemy(spawn)),...protectedEnemies];}
  resetUnclearedEncounters(){
    const resetBoss=(arena,boss,gateKey)=>{if(!arena.active||arena.cleared||!boss)return;arena.active=false;arena[gateKey]=0;Object.assign(boss,{x:boss.originX,y:boss.originY,vx:0,vy:0,health:boss.maxHealth,dead:false,active:false,bossMove:'dormant',bossTimer:0,bossMoveIndex:0});};
    resetBoss(this.bossArena,this.boss(),'gateProgress');resetBoss(this.vaultBossArena,this.vaultBoss(),'leftGateProgress');
    for(const arena of this.miniBossArenas){const boss=this.miniBoss(arena.id);if(!arena.active||arena.cleared||!boss)continue;arena.active=false;arena.gateProgress=0;Object.assign(boss,{x:boss.originX,y:boss.originY,vx:0,vy:0,health:boss.maxHealth,dead:false,active:false,windup:0,chargeTime:0,chargeCooldown:0});}
    this.bossProjectiles=[];this.bossShockwave=null;
  }
  destroyPlayer(cause){
    const p=this.player,recovery=cause==='enemy'?{x:p.x,y:p.y+p.h-22}:{x:this.safePosition.x,y:this.safePosition.y+p.h-22};
    this.recoveryCorpse={kind:'corpse',x:clamp(recovery.x,0,WORLD_WIDTH-50),y:recovery.y,w:50,h:22,health:3,maxHealth:3,scrapValue:p.scrap,dead:false,hitFlash:0};
    p.scrap=0;p.electricity=0;p.lives=3;p.x=this.respawnPoint.x;p.y=this.respawnPoint.y;p.vx=0;p.vy=0;p.invuln=1;p.dashTime=0;p.wallJumpTime=0;p.attackTime=0;p.specialTime=0;p.specialType=null;p.healTime=0;p.onWall=0;p.onGround=false;p.jumps=p.abilities.doubleJump?2:1;this.safePosition={...this.respawnPoint};this.resetUnclearedEncounters();this.respawnOrdinaryEnemies();this.rewardToast={text:'SHELL REBUILT',detail:'RECOVER YOUR WRECKAGE TO RECLAIM SCRAP',time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#ffffff',30);
  }
  damagePlayer(cause='enemy',sourceX=0){const p=this.player;if(p.invuln>0)return;this.cancelHeal();p.lives--;this.shake=12;this.burst(p.x+20,p.y+20,'#ff493f',22);if(p.lives<=0){this.destroyPlayer(cause);return;}if(cause==='spike'||cause==='fall'){const reset=cause==='spike'?this.safePosition:this.spawn;p.x=reset.x;p.y=reset.y;p.vx=0;p.vy=0;p.invuln=.6;}else{p.invuln=1.2;p.vx=(p.x<sourceX?-1:1)*360;p.vy=-300;}}
  burst(x,y,color,count){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.25+Math.random()*.35,color});}
  updateParticles(dt){for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=300*dt;q.life-=dt;}this.particles=this.particles.filter(q=>q.life>0);}
}
