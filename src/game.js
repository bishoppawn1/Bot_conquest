import { clamp, hasFloorAhead, overlaps, shareSupportingPlatform, supportingPlatform } from './geometry.js';
import { ABILITY_COSTS, ATTACK_RANGE, ATTACK_TIMING, circleIntersectsRect, directionalBox, ELECTRICITY_MAX, ELECTRICITY_PER_HIT, fieldCircle, SCRAP_VALUES } from './combat.js';
import { BODY_MODIFIERS, BOSS_ARENA, CONDUITS, CROWN_BOSS_ARENA, DEPTH_ACCESS_BLOCKS, DEPTH_BOSS_ARENA, DEPTH_RETURN_BLOCKS, ENEMY_SPAWNS, FORGE_UPGRADE_COSTS, FORGE_UPGRADE_RECIPES, GAUNTLET_HAZARDS, JUNK_PILES, MERCHANT_ROOM, MERCHANT_SPAWNS, MINI_BOSS_ARENAS, PICKUP_SPAWNS, PLATFORMS, RECESSES, REGION_GATES, REGIONS, RELICS, REST_AREA, SPAWN, TRAPS, VAULT_BOSS_ARENA, WORLD_BOTTOM, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH } from './level.js';

export { WORLD_WIDTH as WIDTH, WORLD_HEIGHT as HEIGHT } from './level.js';
export const PLAYER_JUMP_SPEED = 600;
export const PLAYER_MOVE_SPEED = 250;
export const SHELL_DEFINITIONS = Object.freeze({
  'standard-body':Object.freeze({id:'standard-body',name:'STANDARD BODY',baseLives:3,baseElectricity:ELECTRICITY_MAX,baseRange:ATTACK_RANGE.primary,description:'BALANCED FRAME // FOUR GENERAL MOUNTS',slots:Object.freeze([{id:'shell',part:'shell',label:'SHELL MOUNT',efficiency:1},{id:'core',part:'core',label:'CORE MOUNT',efficiency:1},{id:'legs',part:'legs',label:'LEG MOUNT',efficiency:1},{id:'weapon',part:'weapon',label:'FUSION CUTTER',efficiency:1}])}),
  'slicer-body':Object.freeze({id:'slicer-body',name:'SLICER SHELL',baseLives:2,baseElectricity:ELECTRICITY_MAX-20,baseRange:ATTACK_RANGE.primary+30,description:'FORWARD-DROPLET FRAME // TWIN CUTTER MOUNTS',slots:Object.freeze([{id:'core',part:'core',label:'CORE MOUNT',efficiency:1},{id:'legs',part:'legs',label:'LEG MOUNT',efficiency:1},{id:'weapon',part:'weapon',label:'FUSION CUTTER',efficiency:1},{id:'extended-weapon',part:'weapon',label:'EXTENDED FUSION CUTTER',efficiency:1}])})
});
const BAY_SLOT_DEFINITIONS = Object.freeze([
  Object.freeze({id:'internal',part:'internal',label:'INTERNAL BAY',efficiency:.3,name:'INTERNAL BAY',detail:'REDUCED-EFFECT MODIFIER SLOT'}),
  Object.freeze({id:'auxiliary-1',part:'auxiliary',label:'AUXILIARY BAY A',efficiency:.3,name:'AUXILIARY BAY A',detail:'REDUCED-EFFECT MODIFIER SLOT'}),
  Object.freeze({id:'auxiliary-2',part:'auxiliary',label:'AUXILIARY BAY B',efficiency:.3,name:'AUXILIARY BAY B',detail:'REDUCED-EFFECT MODIFIER SLOT'})
]);
export const HEAL_DURATION = .7;
export const WALL_CLIMB_SPEED = 155;

export class Game {
  constructor() { this.reset(); }
  reset() {
    this.time=0; this.running=true; this.cameraX=0; this.cameraY=0; this.shake=0;this.worldTop=WORLD_TOP;this.worldBottom=WORLD_BOTTOM;
    this.input={left:false,right:false,jump:false,down:false,dash:false,attack:false,heal:false,field:false,electricJab:false,rest:false,inventory:false};
    this.prev={...this.input}; this.particles=[];this.bossProjectiles=[];this.bossExplosions=[];this.bossShockwave=null;this.crownHazards=[];this.gauntletHazards=GAUNTLET_HAZARDS.map(hazard=>({...hazard,active:false,hit:false}));this.abilityPopup=null;this.rewardToast=null;
    this.spawn={...SPAWN};
    this.safePosition={...this.spawn};
    this.respawnPoint={...this.spawn};this.recoveryCorpse=null;this.inventoryOpen=false;this.inventoryPage=1;this.inventorySelection=0;this.inventoryPages=['map','status','materials','items'];this.equipmentItemIndex=null;this.equipmentSlotIndex=0;this.mappedRegions=new Set();this.mapOverview=false;this.mapRegionIndex=0;this.merchantMenuOpen=false;this.merchantMenuSelection=0;this.shellMenuOpen=false;this.shellMenuSelection=0;
    const standardBody=this.createBody('standard-body');
    this.player={x:this.spawn.x,y:this.spawn.y,w:50,h:36,vx:0,vy:0,facing:1,aimX:1,aimY:0,attackAimX:1,attackAimY:0,specialAimX:1,specialAimY:0,onGround:false,onWall:0,jumps:0,lives:3,maxLives:3,shield:0,maxShield:0,scrap:0,electricity:0,maxElectricity:ELECTRICITY_MAX,materials:{titanium:0,uranium:0},purchasedItems:[],primaryDamage:3,primaryRange:ATTACK_RANGE.primary,pendingRelicDamage:0,damageUpgrades:0,healthUpgrades:0,energyUpgrades:0,bayUpgrades:0,baseMoveSpeed:PLAYER_MOVE_SPEED,moveSpeed:PLAYER_MOVE_SPEED,damageSpeedBonus:0,damageSpeedDuration:0,damageEnergyGain:0,postHitInvulnerabilityBonus:0,reactiveSpeedTime:0,ownedShells:['standard-body'],bodies:{'standard-body':standardBody},body:standardBody,abilities:{doubleJump:false,dash:false,wallClimb:false,heal:true,field:false,electricJab:false},invuln:0,dashTime:0,dashCooldown:0,wallJumpTime:0,attackTime:0,attackCooldown:0,attackId:0,attackHits:new Set(),specialTime:0,specialType:null,specialHits:new Set(),healTime:0,healFlash:0,restFlash:0};
    this.platforms=PLATFORMS.map(platform=>({...platform}));
    this.traps=TRAPS.map(trap=>({...trap}));
    this.recesses=RECESSES.map(recess=>({...recess}));
    this.bossArena={...BOSS_ARENA,boss:{...BOSS_ARENA.boss},active:false,cleared:false,gateProgress:0};
    this.vaultBossArena={...VAULT_BOSS_ARENA,boss:{...VAULT_BOSS_ARENA.boss},active:false,cleared:false,leftGateProgress:0};
    this.depthBossArena={...DEPTH_BOSS_ARENA,boss:{...DEPTH_BOSS_ARENA.boss},active:false,cleared:false};this.depthAccessOpen=false;this.depthReturnOpen=false;
    this.crownBossArena={...CROWN_BOSS_ARENA,boss:{...CROWN_BOSS_ARENA.boss},anchors:CROWN_BOSS_ARENA.anchors.map(anchor=>({...anchor})),leftGate:{...CROWN_BOSS_ARENA.leftGate},rightGate:{...CROWN_BOSS_ARENA.rightGate},active:false,cleared:false,gateProgress:0};
    this.miniBossArenas=MINI_BOSS_ARENAS.map(arena=>({...arena,enemy:{...arena.enemy},active:false,cleared:false,gateProgress:0}));
    this.restArea={...REST_AREA,station:{...REST_AREA.station}};
    this.regions=REGIONS.map(region=>({...region}));this.regionGates=REGION_GATES.map(gate=>({...gate}));
    this.regionId=this.regionAt(this.spawn.x)?.id??null;this.mapRegionIndex=Math.max(0,this.regions.findIndex(region=>region.id===this.regionId));this.regionToast=null;this.regionToastTime=0;
    this.pickups=PICKUP_SPAWNS.map(pickup=>({...pickup,collected:false}));
    this.merchants=MERCHANT_SPAWNS.map(merchant=>({...merchant}));
    this.merchantRoom={...MERCHANT_ROOM,spawn:{...MERCHANT_ROOM.spawn},exit:{...MERCHANT_ROOM.exit},merchant:{...MERCHANT_ROOM.merchant},activeMerchant:null,returnPosition:null};
    const boss=this.enemy(BOSS_ARENA.boss);Object.assign(boss,{isBoss:true,maxHealth:BOSS_ARENA.boss.health,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,phase:1});
    const vaultBoss=this.enemy(VAULT_BOSS_ARENA.boss);Object.assign(vaultBoss,{isVaultBoss:true,name:VAULT_BOSS_ARENA.name,maxHealth:VAULT_BOSS_ARENA.boss.health,rewardScrap:VAULT_BOSS_ARENA.rewardScrap,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,phase:1});
    const depthBoss=this.enemy(DEPTH_BOSS_ARENA.boss);Object.assign(depthBoss,{isDepthBoss:true,name:DEPTH_BOSS_ARENA.name,maxHealth:DEPTH_BOSS_ARENA.boss.health,rewardScrap:DEPTH_BOSS_ARENA.rewardScrap,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,phase:1});
    const crownBoss=this.enemy(CROWN_BOSS_ARENA.boss);Object.assign(crownBoss,{isCrownBoss:true,name:CROWN_BOSS_ARENA.name,maxHealth:CROWN_BOSS_ARENA.boss.health,rewardScrap:CROWN_BOSS_ARENA.rewardScrap,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,anchorIndex:0,crownTargetX:0,phase:1});
    const miniBosses=this.miniBossArenas.map(arena=>{const enemy=this.enemy(arena.enemy);return Object.assign(enemy,{isMiniBoss:true,arenaId:arena.id,name:arena.name,maxHealth:arena.enemy.health,rewardScrap:arena.rewardScrap,rewardMaterial:arena.rewardMaterial,phase:1});});
    this.enemies=[...ENEMY_SPAWNS.map(spawn=>this.enemy(spawn)),...miniBosses,crownBoss,depthBoss,vaultBoss,boss];
    this.conduits=CONDUITS.map((conduit,index)=>({...conduit,kind:'conduit',id:`conduit-${index}`,maxCharge:conduit.charge,hitFlash:0}));
    this.junkPiles=JUNK_PILES.map((pile,index)=>({...pile,kind:'junk',id:pile.id??`junk-${index}`,maxHealth:pile.health,dead:false,hitFlash:0}));
  }
  enemy({type,x,y,w,h,health,patrol=false,patrolRange=80,patrolDirection=1}){const ordinaryHealth=type==='brute'?12:type==='hopper'||type==='drone'?9:6;return{type,x,y,w,h,originX:x,originY:y,vx:0,vy:0,health:health??ordinaryHealth,onGround:false,phase:x*.01,dead:false,active:false,aggroRadius:type==='drone'?340:type==='brute'?240:210,patrol,patrolRange,patrolDirection,windup:0,chargeTime:0,chargeCooldown:0,jumpCooldown:0,jumping:false,chargeDirection:patrolDirection};}
  nextBossRandom(enemy){const seed=enemy.bossRngState??((Math.imul(Math.floor(enemy.originX),31)+Math.imul(Math.floor(enemy.originY),17)+0x9e3779b9)>>>0);enemy.bossRngState=(Math.imul(seed,1664525)+1013904223)>>>0;return enemy.bossRngState/0x100000000;}
  chooseBossMove(enemy,moves){const choices=moves.filter(move=>move!==enemy.lastBossMove),pool=choices.length?choices:moves,move=pool[Math.floor(this.nextBossRandom(enemy)*pool.length)];enemy.lastBossMove=move;return move;}
  shellDefinition(id){return SHELL_DEFINITIONS[id]??null;}
  createBody(id,auxiliaryBayCount=0){const definition=this.shellDefinition(id);if(!definition)return null;return{id:definition.id,name:definition.name,slots:definition.slots.map(slot=>({...slot})),expansionSlots:BAY_SLOT_DEFINITIONS.slice(0,auxiliaryBayCount+1).map(slot=>({id:slot.id,part:slot.part,label:slot.label,efficiency:slot.efficiency})),loadout:{}};}
  acquireShell(id){const p=this.player,definition=this.shellDefinition(id);if(!definition||p.ownedShells.includes(id))return false;const body=this.createBody(id,p.bayUpgrades);p.ownedShells.push(id);p.bodies[id]=body;p.purchasedItems.push({id:`shell-${id}`,shellId:id,kind:'shell',name:definition.name,detail:`${definition.description} // SWAP AT A RECOVERY STATION`});this.rewardToast={text:`${definition.name} ACQUIRED`,detail:'REST AT A RECOVERY STATION TO EQUIP IT',time:4};return true;}
  saveCurrentLoadout(){const body=this.player.body;for(const item of this.player.purchasedItems)if(item.kind==='modifier'||item.kind==='relic')body.loadout[item.id]=item.equippedSlot??null;}
  restoreBodyLoadout(body){const slots=new Map([...body.slots,...body.expansionSlots].map(slot=>[slot.id,slot]));for(const item of this.player.purchasedItems){if(item.kind!=='modifier'&&item.kind!=='relic')continue;const slotId=body.loadout[item.id]??null,slot=slots.get(slotId),valid=item.kind==='relic'?body.slots.some(candidate=>candidate.id===slotId):Boolean(this.modifierEffect(item,slot));item.equippedSlot=valid?slotId:null;if(!valid)body.loadout[item.id]=null;}}
  switchShell(id,restoreAtStation=false){const p=this.player,body=p.bodies[id];if(!body)return false;this.saveCurrentLoadout();p.body=body;this.restoreBodyLoadout(body);this.recomputeBodyStats();if(restoreAtStation)p.lives=p.maxLives;p.electricity=Math.min(p.electricity,p.maxElectricity);p.shield=Math.min(p.shield,p.maxShield);return true;}
  openShellMenu(){if(this.player.ownedShells.length<2)return false;this.shellMenuOpen=true;this.shellMenuSelection=Math.max(0,this.player.ownedShells.indexOf(this.player.body.id));this.player.vx=0;this.player.vy=0;return true;}
  closeShellMenu(){this.shellMenuOpen=false;return true;}
  moveShellSelection(delta){const shells=this.player.ownedShells;if(!shells.length)return false;this.shellMenuSelection=(this.shellMenuSelection+delta+shells.length)%shells.length;return true;}
  confirmShellSelection(){const id=this.player.ownedShells[this.shellMenuSelection];if(!id||!this.switchShell(id,true))return false;this.rewardToast={text:`${this.player.body.name} EQUIPPED`,detail:'SHELL LOADOUT RESTORED',time:3};this.closeShellMenu();return true;}
  normalSlots(){return this.player.body.slots;}
  bodySlots(){return[...this.normalSlots(),...this.player.body.expansionSlots];}
  baySlotDefinitions(){return BAY_SLOT_DEFINITIONS;}
  modifierDefinition(id){return BODY_MODIFIERS.find(modifier=>modifier.id===id)??null;}
  relicDefinition(id){return RELICS.find(relic=>relic.id===id)??null;}
  ownsRelic(id){return this.player.purchasedItems.some(item=>item.relicId===id);}
  relicValue(effect){const activeSlots=new Set(this.normalSlots().map(slot=>slot.id));return this.player.purchasedItems.filter(item=>item.kind==='relic'&&activeSlots.has(item.equippedSlot)).reduce((sum,item)=>sum+(this.relicDefinition(item.relicId)?.effects[effect]??0),0);}
  healCost(){return Math.max(0,ABILITY_COSTS.heal-this.relicValue('healCostReduction'));}
  modifierEffect(item,slot){const definition=this.modifierDefinition(item.modifierId??item.id),part=slot?.part==='auxiliary'?'internal':slot?.part;return definition?.effects[part]??null;}
  modifierCatalogDetail(definition){const names={shell:'SHELL',core:'CORE',legs:'LEGS',weapon:'CUTTER',internal:'INTERNAL'};return Object.entries(definition.effects).map(([part,effect])=>`${names[part]??part.toUpperCase()} ${effect.label}`).join(' // ');}
  compatibleModifierSlots(item){return this.bodySlots().filter(slot=>this.modifierEffect(item,slot));}
  recomputeBodyStats(){
    const p=this.player,shell=this.shellDefinition(p.body.id)??SHELL_DEFINITIONS['standard-body'];let maxLives=shell.baseLives+p.healthUpgrades,maxElectricity=shell.baseElectricity+p.energyUpgrades*25,baseMoveSpeed=PLAYER_MOVE_SPEED,primaryRange=shell.baseRange,maxShield=0,damageSpeedBonus=0,damageSpeedDuration=0,damageEnergyGain=0,postHitInvulnerabilityBonus=0;
    for(const item of p.purchasedItems.filter(entry=>entry.kind==='modifier'&&entry.equippedSlot)){const slot=this.bodySlots().find(candidate=>candidate.id===item.equippedSlot),effect=this.modifierEffect(item,slot);if(!effect)continue;maxLives+=effect.maxLives??0;maxElectricity+=effect.maxElectricity??0;baseMoveSpeed+=effect.moveSpeed??0;primaryRange+=effect.attackRange??0;maxShield+=effect.healShield??0;damageSpeedBonus+=effect.damageSpeedBonus??0;damageSpeedDuration=Math.max(damageSpeedDuration,effect.damageSpeedDuration??0);damageEnergyGain+=effect.damageEnergy??0;postHitInvulnerabilityBonus+=effect.postHitInvulnerability??0;}
    Object.assign(p,{maxLives,maxElectricity,baseMoveSpeed,primaryRange,maxShield,damageSpeedBonus,damageSpeedDuration,damageEnergyGain,postHitInvulnerabilityBonus});p.moveSpeed=baseMoveSpeed+(p.reactiveSpeedTime>0?damageSpeedBonus:0);p.lives=Math.min(p.lives,p.maxLives);p.electricity=Math.min(p.electricity,p.maxElectricity);p.shield=Math.min(p.shield,p.maxShield);return{maxLives,maxElectricity,moveSpeed:p.moveSpeed,primaryRange,maxShield,damageSpeedBonus,damageEnergyGain};
  }
  itemPlacementDetail(item){if(!item.equippedSlot)return'IN STORAGE // Q INSTALL';if(item.kind==='relic'){const slot=this.normalSlots().find(candidate=>candidate.id===item.equippedSlot);return`${slot?.label??'UNKNOWN NORMAL MOUNT'} // EFFECT ACTIVE`;}const slot=this.bodySlots().find(candidate=>candidate.id===item.equippedSlot),effect=this.modifierEffect(item,slot);return`${slot?.label??'UNKNOWN SLOT'} // ${effect?.label??'NO EFFECT'}`;}
  modifierPlacementDetail(item){return this.itemPlacementDetail(item);}
  inventoryItemRows(){const items=this.player.purchasedItems;return items.length?items.map(item=>[item.name,item.kind==='modifier'||item.kind==='relic'?this.itemPlacementDetail(item):item.detail??'PERMANENT UPGRADE']):[['NO PURCHASES','MERCHANT ITEMS WILL APPEAR HERE']];}
  selectedInventoryItem(){return this.player.purchasedItems[this.inventorySelection]??null;}
  equipmentTargets(item=this.player.purchasedItems[this.equipmentItemIndex]){if(item?.kind==='modifier')return[...this.compatibleModifierSlots(item),{id:null,part:'storage',label:'STORAGE'}];if(item?.kind==='relic')return[...this.normalSlots(),{id:null,part:'storage',label:'STORAGE'}];return[];}
  selectedEquipmentTarget(){return this.equipmentTargets()[this.equipmentSlotIndex]??null;}
  beginEquipmentPlacement(){const item=this.selectedInventoryItem();if(!['modifier','relic'].includes(item?.kind))return false;this.equipmentItemIndex=this.inventorySelection;const targets=this.equipmentTargets(item),current=item.equippedSlot?targets.findIndex(slot=>slot.id===item.equippedSlot):0;this.equipmentSlotIndex=current<0?0:current;return true;}
  cancelEquipmentPlacement(){this.equipmentItemIndex=null;this.equipmentSlotIndex=0;return true;}
  moveEquipmentTarget(delta){const targets=this.equipmentTargets();if(!targets.length)return false;this.equipmentSlotIndex=(this.equipmentSlotIndex+delta+targets.length)%targets.length;return true;}
  confirmEquipmentPlacement(){const item=this.player.purchasedItems[this.equipmentItemIndex],target=this.selectedEquipmentTarget();if(!['modifier','relic'].includes(item?.kind)||!target)return false;if(target.id===null)item.equippedSlot=null;else{const occupant=this.player.purchasedItems.find(entry=>entry.equippedSlot===target.id&&entry!==item);if(occupant){occupant.equippedSlot=null;this.player.body.loadout[occupant.id]=null;}item.equippedSlot=target.id;}this.player.body.loadout[item.id]=item.equippedSlot??null;this.recomputeBodyStats();const noun=item.kind==='relic'?'RELIC':'MODIFIER';this.rewardToast={text:target.id===null?`${noun} STORED`:`${noun} INSTALLED`,detail:target.id===null?item.name:this.itemPlacementDetail(item),time:2.4};this.cancelEquipmentPlacement();return true;}
  equipmentTooltip(){const item=this.selectedInventoryItem();if(!item)return{name:'NO ITEM SELECTED',detail:'ACQUIRED EQUIPMENT AND RELICS APPEAR HERE',prompt:''};if(!['modifier','relic'].includes(item.kind))return{name:item.name,detail:item.detail??'PERMANENT UPGRADE',prompt:'PERMANENT BODY UPGRADE'};const target=this.equipmentItemIndex===this.inventorySelection?this.selectedEquipmentTarget():null,effect=item.kind==='modifier'&&target?.id?this.modifierEffect(item,target):null;return{name:item.name,detail:target?(target.id?item.kind==='relic'?`${target.label} // ${this.relicDefinition(item.relicId)?.detail}`:`${target.label} // ${effect?.label??'INCOMPATIBLE'}`:'MOVE TO STORAGE'):this.itemPlacementDetail(item),prompt:target?'ARROWS CHOOSE SLOT // Q PLACE':`Q SELECT ${item.kind.toUpperCase()}`};}
  inventoryEntryCount(){const page=this.inventoryPages[this.inventoryPage];if(page==='status')return 4;if(page==='materials')return 2;if(page==='items')return Math.max(1,this.player.purchasedItems.length);return 1;}
  selectCurrentMapRegion(){const index=this.regions.findIndex(region=>region.id===this.regionId);this.mapRegionIndex=index<0?0:index;}
  moveMapSelection(dx,dy){const columns=3,index=this.mapRegionIndex,row=Math.floor(index/columns),column=index%columns,nextRow=clamp(row+dy,0,Math.ceil(this.regions.length/columns)-1),nextColumn=clamp(column+dx,0,columns-1),next=nextRow*columns+nextColumn;if(next<this.regions.length)this.mapRegionIndex=next;}
  setInput(input){Object.assign(this.input,input);}
  pressed(key){return this.input[key]&&!this.prev[key];}
  update(dt=1/60){
    if(!this.running)return; dt=Math.min(dt,.034); const p=this.player;
    if(this.shellMenuOpen){
      if(this.pressed('inventory'))this.closeShellMenu();
      else if(this.pressed('left')||this.pressed('jump'))this.moveShellSelection(-1);
      else if(this.pressed('right')||this.pressed('down'))this.moveShellSelection(1);
      else if(this.pressed('rest'))this.confirmShellSelection();
      p.vx=0;p.vy=0;this.prev={...this.input};return;
    }
    if(this.merchantMenuOpen){
      const closeMenu=this.pressed('inventory');
      if(closeMenu)this.closeMerchantMenu();
      else{const rows=this.merchantCatalog();if(this.pressed('jump'))this.merchantMenuSelection=Math.max(0,this.merchantMenuSelection-1);if(this.pressed('down'))this.merchantMenuSelection=Math.min(rows.length-1,this.merchantMenuSelection+1);if(this.pressed('rest'))this.purchaseSelectedMerchantItem();}
      p.vx=0;p.vy=0;this.prev={...this.input};return;
    }
    const toggledInventory=this.pressed('inventory');if(toggledInventory){this.inventoryOpen=!this.inventoryOpen;this.cancelEquipmentPlacement();p.vx=0;p.vy=0;if(this.inventoryOpen){this.mapOverview=false;this.selectCurrentMapRegion();}}
    if(this.inventoryOpen){
      if(!toggledInventory){
        const page=this.inventoryPages[this.inventoryPage];
        if(page==='map'){
          if(this.pressed('field'))this.mapOverview=!this.mapOverview;
          else if(this.mapOverview){if(this.pressed('left'))this.moveMapSelection(-1,0);if(this.pressed('right'))this.moveMapSelection(1,0);if(this.pressed('jump'))this.moveMapSelection(0,-1);if(this.pressed('down'))this.moveMapSelection(0,1);}
          else if(this.pressed('right')){this.inventoryPage=1;this.inventorySelection=0;}
        }else if(page==='items'&&this.equipmentItemIndex!==null){
          if(this.pressed('field'))this.confirmEquipmentPlacement();
          else if(this.pressed('left')||this.pressed('jump'))this.moveEquipmentTarget(-1);
          else if(this.pressed('right')||this.pressed('down'))this.moveEquipmentTarget(1);
        }else{
          if(page==='items'&&this.pressed('field'))this.beginEquipmentPlacement();
          if(this.pressed('left')){this.inventoryPage=Math.max(0,this.inventoryPage-1);this.inventorySelection=0;this.cancelEquipmentPlacement();if(this.inventoryPages[this.inventoryPage]==='map'){this.mapOverview=false;this.selectCurrentMapRegion();}}
          if(this.pressed('right')){this.inventoryPage=Math.min(this.inventoryPages.length-1,this.inventoryPage+1);this.inventorySelection=0;this.cancelEquipmentPlacement();}
          if(this.pressed('jump'))this.inventorySelection=Math.max(0,this.inventorySelection-1);
          if(this.pressed('down'))this.inventorySelection=Math.min(this.inventoryEntryCount()-1,this.inventorySelection+1);
        }
      }
      this.prev={...this.input};return;
    }
    this.time+=dt;
    this.syncDepthAccess();
    p.invuln=Math.max(0,p.invuln-dt);p.reactiveSpeedTime=Math.max(0,p.reactiveSpeedTime-dt);p.moveSpeed=p.baseMoveSpeed+(p.reactiveSpeedTime>0?p.damageSpeedBonus:0);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.wallJumpTime=Math.max(0,p.wallJumpTime-dt);p.attackCooldown=Math.max(0,p.attackCooldown-dt);p.attackTime=Math.max(0,p.attackTime-dt);p.specialTime=Math.max(0,p.specialTime-dt);p.healFlash=Math.max(0,p.healFlash-dt);p.restFlash=Math.max(0,p.restFlash-dt);this.regionToastTime=Math.max(0,this.regionToastTime-dt);if(this.abilityPopup)this.abilityPopup.time=Math.max(0,this.abilityPopup.time-dt);if(this.rewardToast)this.rewardToast.time=Math.max(0,this.rewardToast.time-dt);for(const c of this.conduits)c.hitFlash=Math.max(0,c.hitFlash-dt);if(this.recoveryCorpse)this.recoveryCorpse.hitFlash=Math.max(0,this.recoveryCorpse.hitFlash-dt);
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
    if(p.dashTime>0)p.dashTime-=dt; else if(climbing){p.vx=wall*18;p.vy=-WALL_CLIMB_SPEED;}else {if(p.wallJumpTime<=0){const target=axis*p.moveSpeed;p.vx+=(target-p.vx)*Math.min(1,(p.onGround?13:6)*dt);}p.vy+=1100*dt;}
    this.moveActor(p,dt,true);
    this.rememberSafePlatform();
    const hitSpike=this.traps.some(trap=>overlaps(p,trap));
    if(hitSpike)this.damagePlayer('spike');else if(p.y>WORLD_BOTTOM+100)this.damagePlayer('fall');
    this.updateGauntletHazards();
    p.x=clamp(p.x,0,WORLD_WIDTH-p.w);this.updateRegion();this.updatePickups();
    this.updateBossArena(dt);this.updateVaultBossArena(dt);this.updateDepthBossArena();this.updateCrownBossArena(dt);this.updateMiniBossArenas(dt);this.updateCombat();this.updateEnemies(dt);this.updateBossHazards(dt);this.updateParticles(dt);
    this.cameraX=clamp(p.x-350,0,WORLD_WIDTH-1280);this.cameraY=clamp(p.y-360,WORLD_TOP,WORLD_BOTTOM-720);this.shake=Math.max(0,this.shake-dt*20);
    this.prev={...this.input};
  }
  moveActor(a,dt,isPlayer=false){
    const wasGrounded=a.onGround;
    const colliders=isPlayer?[...this.platforms,...this.junkPiles.filter(pile=>!pile.dead),...this.bossGates(),...this.vaultBossGates(),...this.depthBossGates(),...this.crownBossGates(),...this.miniBossGates()]:this.platforms;
    a.x+=a.vx*dt;a.onWall=0;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vx>0){a.x=b.x-a.w;if(isPlayer)a.onWall=1;}else if(a.vx<0){a.x=b.x+b.w;if(isPlayer)a.onWall=-1;}a.vx=0;
    }
    a.y+=a.vy*dt;a.onGround=false;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vy>=0){a.y=b.y-a.h;a.vy=0;a.onGround=true;if(isPlayer)a.jumps=a.abilities.doubleJump?2:1;}else{a.y=b.y+b.h;a.vy=0;}
    }
    if(isPlayer&&wasGrounded&&!a.onGround)a.jumps=Math.min(a.jumps,a.abilities.doubleJump?1:0);
  }
  wallSide(actor){const inset=4,left={x:actor.x-3,y:actor.y+inset,w:3,h:actor.h-inset*2},right={x:actor.x+actor.w,y:actor.y+inset,w:3,h:actor.h-inset*2};if(this.platforms.some(block=>overlaps(left,block)))return-1;if(this.platforms.some(block=>overlaps(right,block)))return 1;return 0;}
  regionAt(x){return this.regions?.find(region=>x>=region.x&&x<region.x+region.w)??null;}
  updateRegion(){if(this.merchantRoom.activeMerchant)return;const region=this.regionAt(this.player.x+this.player.w/2);if(!region||region.id===this.regionId)return;this.regionId=region.id;this.regionToast=region.name;this.regionToastTime=2.4;}
  pickupAvailable(pickup){const requiredJunk=pickup.requiresJunkClear?this.junkPiles.find(pile=>pile.id===pickup.requiresJunkClear):null;return!pickup.collected&&(!pickup.requiresBossClear||this.bossArena.cleared)&&(!pickup.requiresVaultBossClear||this.vaultBossArena.cleared)&&(!pickup.requiresDepthBossClear||this.depthBossArena.cleared)&&(!pickup.requiresCrownBossClear||this.crownBossArena.cleared)&&(!pickup.requiresJunkClear||requiredJunk?.dead);}
  updatePickups(){for(const pickup of this.pickups)if(this.pickupAvailable(pickup)&&overlaps(this.player,pickup)){pickup.collected=true;if(pickup.kind==='ability'){this.unlockAbility(pickup.ability);this.player.electricity=Math.max(this.player.electricity,pickup.minimumElectricity??0);this.abilityPopup={ability:pickup.ability,name:pickup.name,key:pickup.key,description:pickup.description,color:pickup.color??'#ffffff',time:4.5,maxTime:4.5};}if(pickup.kind==='map'){for(const region of pickup.regions)this.mappedRegions.add(region);this.rewardToast={text:'MAP DATA ACQUIRED',detail:pickup.name,time:3};}if(pickup.kind==='shell')this.acquireShell(pickup.shellId);this.burst(pickup.x+pickup.w/2,pickup.y+pickup.h/2,pickup.color??'#ffffff',36);}}
  nearbyMerchantDoor(){if(this.merchantRoom.activeMerchant)return null;const p=this.player;return this.merchants.find(merchant=>p.x+p.w/2>=merchant.x&&p.x+p.w/2<=merchant.x+merchant.w&&Math.abs(p.y+p.h-merchant.y-merchant.h)<=20)??null;}
  merchantDoorUnlocked(merchant){const centerX=merchant.x+merchant.w/2,centerY=merchant.y+merchant.h/2;return this.enemies.every(enemy=>enemy.dead||enemy.isBoss||enemy.isVaultBoss||enemy.isDepthBoss||enemy.isCrownBoss||enemy.isMiniBoss||Math.hypot(enemy.originX+enemy.w/2-centerX,enemy.originY+enemy.h/2-centerY)>merchant.clearRadius);}
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
  gauntletSwingPosition(hazard){const angle=Math.sin((this.time/hazard.period)*Math.PI*2+hazard.phase)*hazard.amplitude;return{x:hazard.anchorX+Math.sin(angle)*hazard.length,y:hazard.anchorY+Math.cos(angle)*hazard.length};}
  updateGauntletHazards(){
    for(const hazard of this.gauntletHazards){
      if(hazard.type==='electric'){const cycle=hazard.onTime+hazard.offTime,clock=(this.time+hazard.phase)%cycle;hazard.active=clock<hazard.onTime;if(hazard.active&&overlaps(hazard,this.player))this.damagePlayer('enemy',hazard.x+hazard.w/2);}
      else{const ball=this.gauntletSwingPosition(hazard);hazard.ballX=ball.x;hazard.ballY=ball.y;hazard.active=true;if(circleIntersectsRect({x:ball.x,y:ball.y,radius:hazard.radius},this.player))this.damagePlayer('enemy',ball.x);}
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
  depthBoss(){return this.enemies.find(enemy=>enemy.isDepthBoss)??null;}
  depthBossGates(){const arena=this.depthBossArena;return!arena||arena.cleared?[]:[{x:arena.rightGateX,y:arena.gateY,w:arena.gateWidth,h:arena.gateHeight,kind:'depth-boss-gate'}];}
  crownBoss(){return this.enemies.find(enemy=>enemy.isCrownBoss)??null;}
  crownBossGates(){const arena=this.crownBossArena;if(!arena||arena.gateProgress<=0||arena.cleared)return[];return[arena.leftGate,arena.rightGate].map(gate=>({...gate,y:gate.y+gate.h*(1-arena.gateProgress),h:gate.h*arena.gateProgress,kind:'crown-boss-gate'}));}
  syncDepthAccess(){
    const p=this.player,volt=this.pickups.find(pickup=>pickup.id==='volt-core'),support=supportingPlatform(p,this.platforms,3);
    const safelyWest=support?.id==='under-cache'&&p.x+p.w<=2990;
    if(this.depthAccessOpen||!this.player.abilities.wallClimb||!this.player.abilities.electricJab||!volt?.collected||!this.vaultBossArena.cleared||!safelyWest)return false;
    const floor=this.platforms.find(block=>block.id==='under-cache');
    this.platforms=this.platforms.filter(block=>block.id!=='under-cache');
    this.platforms.push(...DEPTH_ACCESS_BLOCKS.map(block=>({...block})));const hatchJunk=this.junkPiles.find(pile=>pile.id==='vault-hatch-junk'&&!pile.dead);if(hatchJunk)Object.assign(hatchJunk,{x:2660,y:1234});this.depthAccessOpen=true;
    if(floor)this.burst(3150,floor.y+floor.h/2,'#75f5ff',34);
    return true;
  }
  releaseDepthReturn(){if(this.depthReturnOpen)return false;this.platforms=this.platforms.filter(block=>!block.removeAfterDepthBoss);this.platforms.push(...DEPTH_RETURN_BLOCKS.map(block=>({...block})));this.depthReturnOpen=true;return true;}
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
  updateDepthBossArena(){
    const arena=this.depthBossArena,boss=this.depthBoss();if(!arena||!boss||arena.cleared||!this.depthAccessOpen)return;
    const p=this.player,centerX=p.x+p.w/2,centerY=p.y+p.h/2;
    if(!arena.active&&centerX>=arena.x&&centerX<arena.rightGateX&&centerY>=arena.triggerY&&centerY<arena.floorY){arena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=.7;}
  }
  updateCrownBossArena(dt){
    const arena=this.crownBossArena,boss=this.crownBoss();if(!arena||!boss)return;
    const p=this.player,centerX=p.x+p.w/2,centerY=p.y+p.h/2,inside=centerY>=arena.y&&centerY<arena.floorY,onRoomFloor=centerX<arena.leftGate.x||centerX>=arena.rightGate.x+arena.rightGate.w;
    if(!arena.active&&!arena.cleared&&inside&&onRoomFloor){arena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=.55;}
    const target=arena.active&&!arena.cleared&&!boss.dead?1:0;arena.gateProgress+=Math.sign(target-arena.gateProgress)*Math.min(Math.abs(target-arena.gateProgress),dt*4);
  }
  updateBossPhase(enemy){if(enemy.phase!==2&&enemy.health<=enemy.maxHealth/2){enemy.phase=2;this.rewardToast={text:'PHASE 2',detail:`${enemy.name??'HEAVY CORE'} OVERDRIVE ENGAGED`,time:2.4};}return enemy.phase??1;}
  updateMiniBoss(enemy,dt){
    const arena=this.miniBossArenas.find(item=>item.id===enemy.arenaId);
    if(!arena?.active||arena.cleared){enemy.active=false;enemy.vx=0;enemy.vy+=900*dt;this.moveActor(enemy,dt);return;}
    enemy.active=true;const phase=this.updateBossPhase(enemy,dt);enemy.chargeCooldown=Math.max(0,enemy.chargeCooldown-dt);
    if(enemy.chargeTime>0){enemy.chargeTime=Math.max(0,enemy.chargeTime-dt);const safe=!enemy.onGround||hasFloorAhead(enemy,enemy.chargeDirection,this.platforms);enemy.vx=safe?enemy.chargeDirection*(phase===2?315:225):0;}
    else if(enemy.windup>0){enemy.windup=Math.max(0,enemy.windup-dt);enemy.vx=0;if(enemy.windup===0){enemy.chargeTime=phase===2?.68:.52;enemy.chargeDirection=Math.sign(this.player.x-enemy.x)||enemy.chargeDirection;enemy.vy=phase===2?-260:-190;}}
    else if(enemy.chargeCooldown<=0){enemy.windup=phase===2?.28:.42;enemy.chargeCooldown=phase===2?.95:1.5;enemy.vx=0;}
    else enemy.vx=0;
    enemy.vy+=900*dt;this.moveActor(enemy,dt);
  }
  updateVaultBoss(enemy,dt){
    const arena=this.vaultBossArena;
    if(!arena.active||arena.cleared){enemy.active=false;enemy.vx=0;enemy.vy+=900*dt;this.moveActor(enemy,dt);return;}
    enemy.active=true;const phase=this.updateBossPhase(enemy,dt);enemy.bossTimer=Math.max(0,enemy.bossTimer-dt);
    if(enemy.bossMove==='idle'&&enemy.bossTimer===0){const moves=['wardenChargeWindup','wardenLeapWindup','wardenVolleyWindup',...(phase===2?['wardenCrossfireWindup']:[])];enemy.bossMove=this.chooseBossMove(enemy,moves);enemy.bossTimer=(enemy.bossMove==='wardenVolleyWindup'||enemy.bossMove==='wardenCrossfireWindup') ? .55 : .42;enemy.vx=0;}
    else if(enemy.bossMove?.endsWith('Windup')&&enemy.bossTimer===0){
      if(enemy.bossMove==='wardenChargeWindup'){enemy.bossMove='wardenCharge';enemy.bossTimer=phase===2?.72:.58;enemy.chargeDirection=Math.sign(this.player.x-enemy.x)||1;}
      else if(enemy.bossMove==='wardenLeapWindup'){enemy.bossMove='wardenLeap';enemy.bossTimer=1;enemy.vy=phase===2?-520:-430;enemy.vx=Math.sign(this.player.x-enemy.x)*(phase===2?210:155);}
      else{if(enemy.bossMove==='wardenCrossfireWindup')this.spawnVaultCrossfire(enemy);else this.spawnVaultVolley(enemy);enemy.bossMove='wardenRecover';enemy.bossTimer=.7;}
    }else if(enemy.bossMove==='wardenCharge'){enemy.vx=enemy.chargeDirection*(phase===2?315:245);if(enemy.bossTimer===0){enemy.bossMove='wardenRecover';enemy.bossTimer=phase===2?.38:.55;enemy.vx=0;}}
    else if(enemy.bossMove==='wardenLeap'&&enemy.onGround){this.bossShockwave={x:enemy.x+enemy.w/2,y:arena.floorY,radius:0,maxRadius:phase===2?270:190,time:phase===2?.58:.45,hit:false,color:'#75f5ff'};enemy.bossMove='wardenRecover';enemy.bossTimer=phase===2?.42:.65;enemy.vx=0;this.shake=12;}
    else if(enemy.bossMove==='wardenRecover'&&enemy.bossTimer===0){enemy.bossMove='idle';enemy.bossTimer=phase===2?.22:.4;}
    enemy.vy+=900*dt;this.moveActor(enemy,dt);enemy.x=clamp(enemy.x,arena.x,arena.rightGateX-enemy.w);
  }
  updateDepthBoss(enemy,dt){
    const arena=this.depthBossArena;
    if(!arena.active||arena.cleared){enemy.active=false;enemy.vx=0;enemy.vy+=900*dt;this.moveActor(enemy,dt);return;}
    enemy.active=true;const phase=this.updateBossPhase(enemy,dt);enemy.bossTimer=Math.max(0,enemy.bossTimer-dt);
    if(enemy.bossMove==='idle'&&enemy.bossTimer===0){const moves=['stalkerDashWindup','stalkerDropWindup','stalkerTrackerWindup',...(phase===2?['stalkerRiftWindup']:[])];enemy.bossMove=this.chooseBossMove(enemy,moves);enemy.bossTimer=enemy.bossMove==='stalkerTrackerWindup'?.7:enemy.bossMove==='stalkerRiftWindup'?.62:.5;enemy.vx=0;}
    else if(enemy.bossMove?.endsWith('Windup')&&enemy.bossTimer===0){
      if(enemy.bossMove==='stalkerDashWindup'){
        const playerLeft=this.player.x+this.player.w/2<arena.x+arena.w/2;enemy.x=playerLeft?arena.rightGateX-enemy.w-26:arena.x+26;enemy.y=arena.floorY-enemy.h;enemy.vy=0;enemy.chargeDirection=playerLeft?-1:1;enemy.bossMove='stalkerDash';enemy.bossTimer=1.35;
      }else if(enemy.bossMove==='stalkerDropWindup'){
        enemy.x=clamp(this.player.x+this.player.w/2-enemy.w/2,arena.x+18,arena.rightGateX-enemy.w-18);enemy.y=arena.y-enemy.h;enemy.vx=0;enemy.vy=0;enemy.onGround=false;enemy.bossMove='stalkerDropHover';enemy.bossTimer=phase===2?.35:.5;
        return;
      }else{if(enemy.bossMove==='stalkerRiftWindup')this.spawnDepthRift(enemy);else this.spawnDepthTracker(enemy);enemy.bossMove='stalkerRecover';enemy.bossTimer=.75;}
    }else if(enemy.bossMove==='stalkerDash'){
      enemy.vx=enemy.chargeDirection*(phase===2?680:520);if(enemy.bossTimer===0||enemy.x<=arena.x||enemy.x+enemy.w>=arena.rightGateX){enemy.bossMove='stalkerRecover';enemy.bossTimer=phase===2?.4:.6;enemy.vx=0;}
    }else if(enemy.bossMove==='stalkerDropHover'){
      enemy.vx=0;enemy.vy=0;if(enemy.bossTimer===0){enemy.bossMove='stalkerDrop';enemy.bossTimer=1;enemy.vy=760;}return;
    }else if(enemy.bossMove==='stalkerDrop'){
      enemy.x+=Math.sign((this.player.x+this.player.w/2)-(enemy.x+enemy.w/2))*55*dt;enemy.y+=enemy.vy*dt;enemy.vy+=1050*dt;
      if(enemy.y+enemy.h>=arena.floorY){enemy.y=arena.floorY-enemy.h;enemy.vy=0;enemy.onGround=true;enemy.bossMove='stalkerRecover';enemy.bossTimer=phase===2?.45:.7;this.bossShockwave={x:enemy.x+enemy.w/2,y:arena.floorY,radius:0,maxRadius:phase===2?220:145,time:phase===2?.5:.38,hit:false,color:'#d6ff3f'};this.shake=15;}
      return;
    }else if(enemy.bossMove==='stalkerRecover'&&enemy.bossTimer===0){enemy.bossMove='idle';enemy.bossTimer=phase===2?.24:.42;}
    enemy.vy+=900*dt;this.moveActor(enemy,dt);enemy.x=clamp(enemy.x,arena.x,arena.rightGateX-enemy.w);
  }
  aim(){return{x:this.player.aimX,y:this.player.aimY};}
  enemyTargetable(enemy){if(enemy.isVaultBoss)return this.vaultBossArena.active&&!this.vaultBossArena.cleared;if(enemy.isDepthBoss)return this.depthBossArena.active&&!this.depthBossArena.cleared;if(enemy.isCrownBoss)return this.crownBossArena.active&&!this.crownBossArena.cleared&&enemy.bossMove==='crownExpose';if(!enemy.isMiniBoss)return true;const arena=this.miniBossArenas.find(item=>item.id===enemy.arenaId);return Boolean(arena?.active&&!arena.cleared);}
  attackDirection(){return{x:this.player.attackAimX,y:this.player.attackAimY};}
  specialDirection(){return{x:this.player.specialAimX,y:this.player.specialAimY};}
  attackBox(){return directionalBox(this.player,this.attackDirection(),this.player.primaryRange,30);}
  startAttack(){const p=this.player;if(p.healTime>0)return false;p.attackAimX=p.aimX;p.attackAimY=p.aimY;p.attackTime=ATTACK_TIMING.primary;p.attackCooldown=.32;p.attackId++;p.attackHits=new Set();const damage=p.primaryDamage+p.pendingRelicDamage;p.pendingRelicDamage=0;this.resolvePrimaryAttack(damage);this.burst(p.x+p.w/2+p.attackAimX*62,p.y+p.h/2+p.attackAimY*62,'#ffffff',6);return true;}
  startSpecial(type){
    const p=this.player,cost=ABILITY_COSTS[type];if(p.healTime>0||!p.abilities[type]||p.specialTime>0||p.electricity<cost)return false;
    p.electricity-=cost;p.specialAimX=p.aimX;p.specialAimY=p.aimY;p.specialType=type;p.specialTime=ATTACK_TIMING[type];p.specialHits=new Set();return true;
  }
  startHeal(){const p=this.player,cost=this.healCost();if(p.healTime>0||p.invuln>0||!p.abilities.heal||p.lives>=p.maxLives||p.electricity<cost)return false;p.electricity-=cost;p.healTime=HEAL_DURATION;return true;}
  cancelHeal(){if(this.player.healTime<=0)return false;this.player.healTime=0;return true;}
  completeHeal(){const p=this.player;if(p.lives>=p.maxLives)return false;p.lives++;p.shield=p.maxShield;p.healFlash=.6;this.burst(p.x+p.w/2,p.y+p.h/2,'#75f5ff',p.shield>0?36:24);return true;}
  canRest(){const p=this.player,station=this.restArea.station,dx=(p.x+p.w/2)-(station.x+station.w/2),dy=(p.y+p.h/2)-(station.y+station.h/2);return this.bossArena.cleared&&Math.hypot(dx,dy)<=station.interactionRadius;}
  tryRest(){if(!this.canRest())return false;const p=this.player,station=this.restArea.station;p.lives=p.maxLives;p.shield=0;p.reactiveSpeedTime=0;p.pendingRelicDamage=0;p.moveSpeed=p.baseMoveSpeed;p.invuln=0;p.vx=0;p.vy=0;p.restFlash=1;const checkpointX=clamp(station.x+station.w+24,this.restArea.x+16,this.restArea.x+this.restArea.w-p.w-16);this.safePosition={x:checkpointX,y:this.restArea.floorY-p.h};this.respawnPoint={...this.safePosition};this.respawnOrdinaryEnemies();this.burst(station.x+station.w/2,station.y+station.h/2,'#d6ff3f',30);if(p.ownedShells.length>1)this.openShellMenu();return true;}
  tryInteract(){
    const merchant=this.nearbyMerchant();
    if(merchant)return this.openMerchantMenu(merchant);
    if(this.nearMerchantExit()){const p=this.player,returnPosition=this.merchantRoom.returnPosition;this.closeMerchantMenu();p.x=returnPosition.x;p.y=returnPosition.y;p.vx=0;p.vy=0;this.safePosition={...returnPosition};this.merchantRoom.activeMerchant=null;this.merchantRoom.returnPosition=null;return true;}
    const door=this.nearbyMerchantDoor();
    if(door&&this.merchantDoorUnlocked(door)){const p=this.player;this.closeMerchantMenu();this.merchantRoom.returnPosition={x:p.x,y:p.y};this.merchantRoom.activeMerchant=door;p.x=this.merchantRoom.spawn.x;p.y=this.merchantRoom.spawn.y;p.vx=0;p.vy=0;this.safePosition={...this.merchantRoom.spawn};return true;}
    return this.tryRest();
  }
  merchantCatalog(merchant=this.merchantRoom.activeMerchant){
    if(!merchant)return[];
    const p=this.player,tierState=(index,owned)=>index<owned?'owned':index===owned?'available':'locked',relicRows=(merchant.relicStock??[]).map(id=>this.relicDefinition(id)).filter(Boolean).map(definition=>({id:definition.id,kind:'relic',name:definition.name,detail:`NORMAL-MOUNT RELIC // ${definition.detail}`,cost:definition.cost,state:this.ownsRelic(definition.id)?'owned':'available',definition}));
    if(merchant.service==='damageUpgrade')return[...merchant.upgradeCosts.map((cost,index)=>{const materials=FORGE_UPGRADE_RECIPES[index]??{},materialText=this.materialCostText(materials);return{id:`edge-coil-${index+1}`,name:`EDGE COIL MK ${index+1}`,detail:`PERMANENT +1 PRIMARY DAMAGE // ${3+index} TO ${4+index}${materialText?` // ${materialText}`:''}`,cost,materials,state:tierState(index,p.damageUpgrades)};}),...relicRows];
    if(merchant.service==='healthUpgrade')return[...merchant.upgradeCosts.map((cost,index)=>({id:`shell-capacity-${index+1}`,name:`SHELL CAPACITY MK ${index+1}`,detail:'PERMANENT +1 MAXIMUM SHELL',cost,state:tierState(index,p.healthUpgrades)})),...relicRows];
    if(merchant.service==='energyUpgrade')return[...merchant.upgradeCosts.map((cost,index)=>({id:`capacitor-bank-${index+1}`,name:`CAPACITOR BANK MK ${index+1}`,detail:'PERMANENT +25 MAXIMUM ELECTRICITY',cost,state:tierState(index,p.energyUpgrades)})),...relicRows];
    if(merchant.service==='bayUpgrade')return merchant.upgradeCosts.map((cost,index)=>{const definition=BAY_SLOT_DEFINITIONS[index+1];return{id:`bay-upgrade-${index+1}`,name:definition.name,detail:definition.detail,cost,state:tierState(index,p.bayUpgrades)};});
    if(merchant.service==='modifierShop')return(merchant.stock??[]).map(id=>this.modifierDefinition(id)).filter(Boolean).map(definition=>({id:definition.id,name:definition.name,detail:this.modifierCatalogDetail(definition),cost:definition.cost,state:p.purchasedItems.some(item=>item.modifierId===definition.id)?'owned':'available',definition}));
    if(merchant.service==='relicShop')return relicRows;
    return[{id:'offline',name:'NO STOCK AVAILABLE',detail:'SPECIAL MATERIAL RECIPES ARE STILL OFFLINE',cost:null,state:'unavailable'}];
  }
  openMerchantMenu(merchant=this.merchantRoom.activeMerchant){if(!merchant)return false;this.inventoryOpen=false;this.merchantMenuOpen=true;const rows=this.merchantCatalog(merchant),available=rows.findIndex(row=>row.state==='available');this.merchantMenuSelection=available<0?0:available;this.player.vx=0;this.player.vy=0;return true;}
  closeMerchantMenu(){this.merchantMenuOpen=false;this.merchantMenuSelection=0;return true;}
  purchaseSelectedMerchantItem(){
    const merchant=this.merchantRoom.activeMerchant,row=this.merchantCatalog(merchant)[this.merchantMenuSelection];if(!merchant||row?.state!=='available')return false;
    let purchased=false;if(row.kind==='relic')purchased=this.buyRelicOffer(merchant,row.definition);else if(merchant.service==='modifierShop')purchased=this.buyModifierOffer(merchant,row.definition);else purchased=this.buyMerchantService(merchant);
    if(purchased){const rows=this.merchantCatalog(merchant),next=rows.findIndex((item,index)=>index>this.merchantMenuSelection&&item.state==='available');if(next>=0)this.merchantMenuSelection=next;}
    return purchased;
  }
  buyMerchantService(merchant){if(merchant.service==='damageUpgrade')return this.buyDamageUpgrade(merchant);if(merchant.service==='healthUpgrade')return this.buyHealthUpgrade(merchant);if(merchant.service==='energyUpgrade')return this.buyEnergyUpgrade(merchant);if(merchant.service==='modifierShop')return this.buyModifier(merchant);if(merchant.service==='bayUpgrade')return this.buyBayUpgrade(merchant);return false;}
  nextHealthUpgradeCost(merchant){return merchant.upgradeCosts[this.player.healthUpgrades]??null;}
  nextEnergyUpgradeCost(merchant){return merchant.upgradeCosts[this.player.energyUpgrades]??null;}
  nextBayUpgradeCost(merchant){return merchant.upgradeCosts[this.player.bayUpgrades]??null;}
  nextModifierOffer(merchant){return(merchant.stock??[]).map(id=>this.modifierDefinition(id)).find(definition=>definition&&!this.player.purchasedItems.some(item=>item.modifierId===definition.id))??null;}
  buyHealthUpgrade(merchant){const p=this.player,cost=this.nextHealthUpgradeCost(merchant);if(cost===null||p.scrap<cost)return false;p.scrap-=cost;p.healthUpgrades++;const previous=p.maxLives;this.recomputeBodyStats();p.lives+=p.maxLives-previous;p.purchasedItems.push({id:`shell-capacity-${p.healthUpgrades}`,kind:'upgrade',name:`SHELL CAPACITY MK ${p.healthUpgrades}`,detail:'+1 MAX SHELL'});this.rewardToast={text:'MAX SHELLS +1',detail:`${merchant.name} REINFORCED THE BODY`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#d6ff3f',30);return true;}
  buyEnergyUpgrade(merchant){const p=this.player,cost=this.nextEnergyUpgradeCost(merchant);if(cost===null||p.scrap<cost)return false;p.scrap-=cost;p.energyUpgrades++;const previous=p.maxElectricity;this.recomputeBodyStats();p.electricity+=p.maxElectricity-previous;p.purchasedItems.push({id:`capacitor-bank-${p.energyUpgrades}`,kind:'upgrade',name:`CAPACITOR BANK MK ${p.energyUpgrades}`,detail:'+25 MAX ELECTRICITY'});this.rewardToast={text:'CAPACITY +25',detail:`${merchant.name} EXPANDED THE CORE`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#75f5ff',30);return true;}
  buyModifier(merchant){return this.buyModifierOffer(merchant,this.nextModifierOffer(merchant));}
  buyModifierOffer(merchant,offer){const p=this.player;if(!offer||p.purchasedItems.some(item=>item.modifierId===offer.id)||p.scrap<offer.cost)return false;p.scrap-=offer.cost;p.purchasedItems.push({id:`modifier-${offer.id}`,modifierId:offer.id,kind:'modifier',name:offer.name,detail:'UNEQUIPPED',equippedSlot:null});this.rewardToast={text:'MODIFIER ACQUIRED',detail:`${offer.name} // EQUIP IN ITEMS`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,merchant.color,34);return true;}
  buyRelicOffer(merchant,offer){const p=this.player;if(!offer||this.ownsRelic(offer.id)||p.scrap<offer.cost)return false;p.scrap-=offer.cost;p.purchasedItems.push({id:`relic-${offer.id}`,relicId:offer.id,kind:'relic',name:offer.name,detail:`NORMAL-MOUNT RELIC // ${offer.detail}`,equippedSlot:null});this.rewardToast={text:'RELIC ACQUIRED',detail:`${offer.name} // EQUIP IN ITEMS`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,merchant.color,34);return true;}
  buyBayUpgrade(merchant){const p=this.player,cost=this.nextBayUpgradeCost(merchant),definition=BAY_SLOT_DEFINITIONS[p.bayUpgrades+1];if(!definition||cost===null||p.scrap<cost)return false;p.scrap-=cost;p.bayUpgrades++;for(const body of Object.values(p.bodies))body.expansionSlots.push({id:definition.id,part:definition.part,label:definition.label,efficiency:definition.efficiency});p.purchasedItems.push({id:`bay-upgrade-${p.bayUpgrades}`,kind:'upgrade',name:definition.name,detail:definition.detail});this.rewardToast={text:`${definition.name} OPENED`,detail:'REDUCED-POWER MODIFIER SLOT ADDED',time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#ffb85c',34);return true;}
  nextDamageUpgradeCost(merchant){return(merchant.upgradeCosts??FORGE_UPGRADE_COSTS)[this.player.damageUpgrades]??null;}
  nextDamageUpgradeMaterials(){return FORGE_UPGRADE_RECIPES[this.player.damageUpgrades]??{};}
  materialCostText(materials){return Object.entries(materials).filter(([,amount])=>amount>0).map(([type,amount])=>`${amount} ${type.toUpperCase()}`).join(' + ');}
  canAffordMaterials(materials){return Object.entries(materials).every(([type,amount])=>(this.player.materials[type]??0)>=amount);}
  spendMaterials(materials){for(const [type,amount] of Object.entries(materials))this.player.materials[type]-=amount;}
  buyDamageUpgrade(merchant){const p=this.player,cost=this.nextDamageUpgradeCost(merchant),materials=this.nextDamageUpgradeMaterials();if(cost===null||p.scrap<cost||!this.canAffordMaterials(materials))return false;p.scrap-=cost;this.spendMaterials(materials);p.damageUpgrades++;p.primaryDamage++;p.purchasedItems.push({id:`edge-coil-${p.damageUpgrades}`,kind:'upgrade',name:`EDGE COIL MK ${p.damageUpgrades}`,detail:`+1 PRIMARY SLASH DAMAGE${this.materialCostText(materials)?` // FORGED WITH ${this.materialCostText(materials)}`:''}`});this.rewardToast={text:'SLASH DAMAGE +1',detail:`${merchant.name} INSTALLED EDGE COIL MK ${p.damageUpgrades}`,time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#ffffff',34);return true;}
  unlockAbility(name){if(name in this.player.abilities){this.player.abilities[name]=true;if(name==='doubleJump'&&this.player.onGround)this.player.jumps=2;return true;}return false;}
  gainMaterial(type,amount){if(!(type in this.player.materials))return false;this.player.materials[type]+=amount;return true;}
  gainElectricity(amount=ELECTRICITY_PER_HIT){this.player.electricity=clamp(this.player.electricity+amount,0,this.player.maxElectricity);}
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
      target.dead=true;const ordinary=target.kind!=='junk'&&!target.isMiniBoss&&!target.isVaultBoss&&!target.isDepthBoss&&!target.isCrownBoss&&target.type!=='boss';let reward=target.kind==='junk'?target.scrapValue:target.isMiniBoss||target.isVaultBoss||target.isDepthBoss||target.isCrownBoss?target.rewardScrap:(SCRAP_VALUES[target.type]??5);if(ordinary)reward+=this.relicValue('ordinaryScrapBonus');this.player.scrap+=reward;if(target.kind!=='junk')this.gainElectricity(this.relicValue('killElectricity'));const material=target.kind==='junk'?target.material:target.rewardMaterial,materials=target.kind==='junk'?(target.materials??(material?[material]:[])):(material?[material]:[]);for(const payout of materials)this.gainMaterial(payout.type,payout.amount);
      if(target.type==='boss'){this.bossArena.cleared=true;this.bossArena.active=false;this.bossProjectiles=[];this.bossExplosions=[];this.bossShockwave=null;const barriers=this.platforms.filter(block=>block.destructibleAfterBoss);this.platforms=this.platforms.filter(block=>!block.destructibleAfterBoss);for(const barrier of barriers)this.burst(barrier.x+barrier.w/2,barrier.y+barrier.h/2,'#ff493f',45);}
      if(target.isVaultBoss){this.vaultBossArena.cleared=true;this.vaultBossArena.active=false;this.bossProjectiles=[];this.bossExplosions=[];this.bossShockwave=null;this.rewardToast={text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED // VOLT CORE RELEASED`,time:3};}
      if(target.isDepthBoss){this.depthBossArena.cleared=true;this.depthBossArena.active=false;this.bossProjectiles=[];this.bossExplosions=[];this.bossShockwave=null;this.releaseDepthReturn();this.rewardToast={text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED // DASH DRIVE RELEASED`,time:3};}
      if(target.isCrownBoss){this.crownBossArena.cleared=true;this.crownBossArena.active=false;this.bossProjectiles=[];this.crownHazards=[];this.rewardToast={text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED // FIELD CORE RELEASED`,time:3};}
      if(target.isMiniBoss){const arena=this.miniBossArenas.find(item=>item.id===target.arenaId);if(arena){arena.cleared=true;arena.active=false;}this.rewardToast=material?{text:`+${material.amount} ${material.type.toUpperCase()}`,detail:`${target.name} DEFEATED`,time:3}:{text:`+${reward} SCRAP`,detail:`${target.name} DEFEATED`,time:3};}
      else if(target.kind==='junk'&&materials.length){const materialText=materials.map(payout=>`${payout.amount} ${payout.type.toUpperCase()}`).join(' + ');this.rewardToast={text:reward>0?`+${reward} SCRAP`:`+${materialText}`,detail:reward>0?`${materialText} RECOVERED`:'SPECIAL MATERIAL RECOVERED',time:3};}
      this.burst(target.x+target.w/2,target.y+target.h/2,'#d6ff3f',target.kind==='junk'?36:target.type==='boss'||target.isVaultBoss||target.isDepthBoss||target.isCrownBoss?70:target.isMiniBoss?48:20);
    }
  }
  resolvePrimaryAttack(damage=this.player.primaryDamage){const p=this.player,box=this.attackBox();for(const e of this.enemies)if(!e.dead&&this.enemyTargetable(e)&&overlaps(box,e))this.hitTarget(e,damage,p.attackHits);for(const c of this.conduits)if(overlaps(box,c))this.hitTarget(c,0,p.attackHits);for(const pile of this.junkPiles)if(!pile.dead&&!pile.requires&&overlaps(box,pile))this.hitTarget(pile,1,p.attackHits,0);if(this.recoveryCorpse&&!this.recoveryCorpse.dead&&overlaps(box,this.recoveryCorpse))this.hitTarget(this.recoveryCorpse,damage,p.attackHits,0);}
  updateCombat(){
    const p=this.player;
    if(p.specialTime<=0)return;
    const damage=p.specialType==='electricJab'?2:1;
    const hits=p.specialType==='field'?(target=>circleIntersectsRect(fieldCircle(p),target)):(target=>overlaps(directionalBox(p,this.specialDirection(),ATTACK_RANGE.electricJab,38),target));
    for(const e of this.enemies)if(!e.dead&&this.enemyTargetable(e)&&hits(e))this.hitTarget(e,damage,p.specialHits,4);
    for(const c of this.conduits)if(hits(c))this.hitTarget(c,0,p.specialHits,4);
    for(const pile of this.junkPiles)if(!pile.dead&&(!pile.requires||pile.requires===p.specialType)&&hits(pile))this.hitTarget(pile,damage,p.specialHits,0);
    if(this.recoveryCorpse&&!this.recoveryCorpse.dead&&hits(this.recoveryCorpse))this.hitTarget(this.recoveryCorpse,damage,p.specialHits,0);
  }
  updateEnemies(dt){
    const p=this.player;
    for(const e of this.enemies){if(e.dead)continue;e.phase+=dt;
      if(e.type==='boss'){this.updateBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      if(e.isVaultBoss){this.updateVaultBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      if(e.isDepthBoss){this.updateDepthBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      if(e.isCrownBoss){this.updateCrownBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
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
    boss.active=true;const phase=this.updateBossPhase(boss,dt);boss.bossTimer=Math.max(0,boss.bossTimer-dt);
    if(boss.bossMove==='idle'&&boss.bossTimer===0){const moves=['chargeWindup','slamWindup','volleyWindup',...(phase===2?['burstWindup']:[])];boss.bossMove=this.chooseBossMove(boss,moves);boss.bossTimer=(boss.bossMove==='volleyWindup'||boss.bossMove==='burstWindup') ? .6 : .45;boss.vx=0;}
    else if(boss.bossMove.endsWith('Windup')&&boss.bossTimer===0){
      if(boss.bossMove==='chargeWindup'){boss.bossMove='bossCharge';boss.bossTimer=phase===2?.82:.68;boss.chargeDirection=Math.sign(this.player.x-boss.x)||1;}
      else if(boss.bossMove==='slamWindup'){boss.bossMove='slamAir';boss.bossTimer=1.4;boss.vy=phase===2?-610:-520;boss.onGround=false;}
      else{if(boss.bossMove==='burstWindup')this.spawnBossBurst(boss);else this.spawnBossVolley(boss);boss.bossMove='recover';boss.bossTimer=phase===2?.48:.75;}
    }else if(boss.bossMove==='bossCharge'){boss.vx=boss.chargeDirection*(phase===2?340:260);if(boss.bossTimer===0){boss.bossMove='recover';boss.bossTimer=phase===2?.4:.65;boss.vx=0;}}
    else if(boss.bossMove==='recover'&&boss.bossTimer===0){boss.bossMove='idle';boss.bossTimer=phase===2?.25:.45;}
    boss.vy+=900*dt;this.moveActor(boss,dt);
    if(boss.bossMove==='slamAir'&&boss.onGround){this.bossShockwave={x:boss.x+boss.w/2,y:this.bossArena.floorY,radius:0,maxRadius:phase===2?420:300,time:phase===2?.72:.55,hit:false};boss.bossMove='recover';boss.bossTimer=phase===2?.5:.8;this.shake=16;}
  }
  updateCrownBoss(boss,dt){
    const arena=this.crownBossArena;if(!arena.active||arena.cleared){boss.active=false;boss.vx=0;boss.vy=0;return;}
    boss.active=true;const phase=this.updateBossPhase(boss,dt);boss.bossTimer=Math.max(0,boss.bossTimer-dt);
    if(boss.bossMove==='idle'&&boss.bossTimer===0){boss.bossMove='crownRelocate';boss.bossTimer=phase===2?.28:.42;boss.pendingAnchor=boss.anchorIndex%arena.anchors.length;boss.anchorIndex++;}
    else if(boss.bossMove==='crownRelocate'&&boss.bossTimer===0){Object.assign(boss,arena.anchors[boss.pendingAnchor]);boss.bossMove='crownExpose';boss.bossTimer=phase===2?.9:1.25;this.burst(boss.x+boss.w/2,boss.y+boss.h/2,'#75f5ff',18);}
    else if(boss.bossMove==='crownExpose'&&boss.bossTimer===0){const attacks=['crownSweepWindup','crownColumnWindup','crownVolleyWindup',...(phase===2?['crownGridWindup']:[])];boss.bossMove=this.chooseBossMove(boss,attacks);boss.bossTimer=.55;boss.crownTargetX=this.player.x+this.player.w/2;}
    else if(boss.bossMove?.endsWith('Windup')&&boss.bossTimer===0){
      if(boss.bossMove==='crownSweepWindup'){this.crownHazards.push({type:'sweep',x:arena.x,y:arena.floorY-30,w:arena.w,h:22,time:phase===2?.65:.48,hit:false});if(phase===2)this.crownHazards.push({type:'column',x:clamp(boss.crownTargetX-32,arena.x+10,arena.x+arena.w-74),y:arena.y,w:64,h:arena.h,time:.48,hit:false});}
      else if(boss.bossMove==='crownColumnWindup')this.crownHazards.push({type:'column',x:clamp(boss.crownTargetX-38,arena.x+10,arena.x+arena.w-86),y:arena.y,w:76,h:arena.h,time:phase===2?.68:.5,hit:false});
      else if(boss.bossMove==='crownGridWindup'){for(const ratio of[.32,.68])this.crownHazards.push({type:'column',x:arena.x+arena.w*ratio-42,y:arena.y,w:84,h:arena.h,time:.68,hit:false});}
      else this.spawnCrownVolley(boss);
      boss.bossMove='crownRecover';boss.bossTimer=phase===2?.42:.72;
    }else if(boss.bossMove==='crownRecover'&&boss.bossTimer===0){boss.bossMove='idle';boss.bossTimer=phase===2?.12:.22;}
  }
  spawnBossVolley(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h*.35,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx);
    const offsets=boss.phase===2?[-.24,0,.24]:[-.14,.14];for(const offset of offsets){const angle=base+offset,speed=boss.phase===2?285:230;this.bossProjectiles.push({x:sx-7,y:sy-7,w:14,h:14,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:4,dead:false});}
  }
  spawnBossBurst(boss){const sx=boss.x+boss.w/2,sy=boss.y+boss.h/2;for(let index=0;index<4;index++){const angle=index*Math.PI/2,speed=310;this.bossProjectiles.push({x:sx-7,y:sy-7,w:14,h:14,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.4,dead:false,owner:'heavy-burst'});}}
  spawnVaultVolley(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h*.35,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx);
    const offsets=boss.phase===2?[-.42,-.14,.14,.42]:[-.3,0,.3];for(const offset of offsets){const angle=base+offset,speed=boss.phase===2?255:205;this.bossProjectiles.push({x:sx-6,y:sy-6,w:12,h:12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.2,dead:false,color:'#75f5ff'});}
  }
  spawnVaultCrossfire(boss){const sx=boss.x+boss.w/2,sy=boss.y+boss.h/2;for(let index=0;index<6;index++){const angle=index*Math.PI/3,speed=275;this.bossProjectiles.push({x:sx-6,y:sy-6,w:12,h:12,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.2,dead:false,owner:'warden-crossfire',color:'#75f5ff'});}}
  spawnDepthTracker(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h*.32,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx),speed=boss.phase===2?600:520,offsets=boss.phase===2?[-.09,.09]:[0];
    for(const offset of offsets){const angle=base+offset;this.bossProjectiles.push({x:sx-8,y:sy-8,w:16,h:16,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,trackingTime:boss.phase===2?.6:.48,life:3,dead:false,owner:'depth',color:'#d6ff3f'});}
  }
  spawnDepthRift(boss){const sx=boss.x+boss.w/2,sy=boss.y+boss.h/2;for(let index=0;index<6;index++){const angle=index*Math.PI/3,speed=390;this.bossProjectiles.push({x:sx-7,y:sy-7,w:14,h:14,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:2.8,dead:false,owner:'depth-rift',color:'#d6ff3f'});}}
  spawnCrownVolley(boss){
    const sx=boss.x+boss.w/2,sy=boss.y+boss.h/2,tx=this.player.x+this.player.w/2,ty=this.player.y+this.player.h/2,base=Math.atan2(ty-sy,tx-sx);
    const offsets=boss.phase===2?[-.42,-.25,-.08,.08,.25,.42]:[-.3,-.1,.1,.3];for(const offset of offsets){const angle=base+offset,speed=boss.phase===2?300:245;this.bossProjectiles.push({x:sx-7,y:sy-7,w:14,h:14,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:3.2,dead:false,owner:'crown',color:'#75f5ff'});}
  }
  explodeDepthBolt(bolt){if(bolt.dead)return;bolt.dead=true;this.bossExplosions.push({x:bolt.x+bolt.w/2,y:bolt.y+bolt.h/2,radius:8,maxRadius:82,time:.34,maxTime:.34,hit:false,color:'#d6ff3f'});this.burst(bolt.x+bolt.w/2,bolt.y+bolt.h/2,'#d6ff3f',18);this.shake=Math.max(this.shake,7);}
  updateBossHazards(dt){
    for(const bolt of this.bossProjectiles){if(bolt.dead)continue;if(bolt.trackingTime>0){bolt.trackingTime=Math.max(0,bolt.trackingTime-dt);const dx=this.player.x+this.player.w/2-(bolt.x+bolt.w/2),dy=this.player.y+this.player.h/2-(bolt.y+bolt.h/2),length=Math.max(1,Math.hypot(dx,dy)),steer=Math.min(1,5*dt);bolt.vx+=(dx/length*bolt.speed-bolt.vx)*steer;bolt.vy+=(dy/length*bolt.speed-bolt.vy)*steer;const velocity=Math.max(1,Math.hypot(bolt.vx,bolt.vy));bolt.vx=bolt.vx/velocity*bolt.speed;bolt.vy=bolt.vy/velocity*bolt.speed;}bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;bolt.life-=dt;const gates=[...this.bossGates(),...this.vaultBossGates(),...this.depthBossGates(),...this.crownBossGates()],hitSolid=this.platforms.some(block=>overlaps(bolt,block))||gates.some(gate=>overlaps(bolt,gate));if(hitSolid){if(bolt.explosive)this.explodeDepthBolt(bolt);else bolt.dead=true;}if(!bolt.dead&&overlaps(bolt,this.player)){if(bolt.explosive)this.explodeDepthBolt(bolt);else bolt.dead=true;this.damagePlayer('enemy',bolt.x);}}
    this.bossProjectiles=this.bossProjectiles.filter(bolt=>!bolt.dead&&bolt.life>0);
    for(const explosion of this.bossExplosions){explosion.time=Math.max(0,explosion.time-dt);explosion.radius+=(explosion.maxRadius-explosion.radius)*Math.min(1,14*dt);if(!explosion.hit&&circleIntersectsRect(explosion,this.player)){explosion.hit=true;this.damagePlayer('enemy',explosion.x);}}
    this.bossExplosions=this.bossExplosions.filter(explosion=>explosion.time>0);
    for(const hazard of this.crownHazards){hazard.time=Math.max(0,hazard.time-dt);if(!hazard.hit&&overlaps(hazard,this.player)){hazard.hit=true;this.damagePlayer('enemy',hazard.x+hazard.w/2);}}
    this.crownHazards=this.crownHazards.filter(hazard=>hazard.time>0);
    const wave=this.bossShockwave;if(!wave)return;wave.time=Math.max(0,wave.time-dt);wave.radius+=(wave.maxRadius-wave.radius)*Math.min(1,8*dt);const playerCenter=this.player.x+this.player.w/2;if(!wave.hit&&Math.abs(playerCenter-wave.x)<=wave.radius&&Math.abs(this.player.y+this.player.h-wave.y)<45){wave.hit=true;this.damagePlayer('enemy',wave.x);}if(wave.time===0)this.bossShockwave=null;
  }
  respawnOrdinaryEnemies(){const protectedEnemies=this.enemies.filter(enemy=>enemy.isBoss||enemy.isVaultBoss||enemy.isDepthBoss||enemy.isCrownBoss||enemy.isMiniBoss);this.enemies=[...ENEMY_SPAWNS.map(spawn=>this.enemy(spawn)),...protectedEnemies];}
  resetUnclearedEncounters(){
    const resetBoss=(arena,boss,gateKey)=>{if(!arena.active||arena.cleared||!boss)return;arena.active=false;arena[gateKey]=0;Object.assign(boss,{x:boss.originX,y:boss.originY,vx:0,vy:0,health:boss.maxHealth,dead:false,active:false,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,bossRngState:undefined,lastBossMove:null,phase:1});};
    resetBoss(this.bossArena,this.boss(),'gateProgress');resetBoss(this.vaultBossArena,this.vaultBoss(),'leftGateProgress');resetBoss(this.crownBossArena,this.crownBoss(),'gateProgress');const crownBoss=this.crownBoss();if(crownBoss&&!this.crownBossArena.cleared)Object.assign(crownBoss,{anchorIndex:0,pendingAnchor:0,crownTargetX:0});if(this.depthBossArena.active&&!this.depthBossArena.cleared){const boss=this.depthBoss();this.depthBossArena.active=false;if(boss)Object.assign(boss,{x:boss.originX,y:boss.originY,vx:0,vy:0,health:boss.maxHealth,dead:false,active:false,bossMove:'dormant',bossTimer:0,bossMoveIndex:0,bossRngState:undefined,lastBossMove:null,phase:1});}
    for(const arena of this.miniBossArenas){const boss=this.miniBoss(arena.id);if(!arena.active||arena.cleared||!boss)continue;arena.active=false;arena.gateProgress=0;Object.assign(boss,{x:boss.originX,y:boss.originY,vx:0,vy:0,health:boss.maxHealth,dead:false,active:false,windup:0,chargeTime:0,chargeCooldown:0,phase:1});}
    this.bossProjectiles=[];this.bossExplosions=[];this.bossShockwave=null;this.crownHazards=[];
  }
  destroyPlayer(cause){
    const p=this.player,recovery=cause==='enemy'?{x:p.x,y:p.y+p.h-22}:{x:this.safePosition.x,y:this.safePosition.y+p.h-22};
    const corpseHealth=Math.max(1,3-this.relicValue('corpseHealthReduction'));this.recoveryCorpse={kind:'corpse',x:clamp(recovery.x,0,WORLD_WIDTH-50),y:recovery.y,w:50,h:22,health:corpseHealth,maxHealth:corpseHealth,scrapValue:p.scrap,dead:false,hitFlash:0};
    p.scrap=0;p.electricity=0;p.lives=p.maxLives;p.shield=0;p.reactiveSpeedTime=0;p.pendingRelicDamage=0;p.moveSpeed=p.baseMoveSpeed;p.x=this.respawnPoint.x;p.y=this.respawnPoint.y;p.vx=0;p.vy=0;p.invuln=1;p.dashTime=0;p.wallJumpTime=0;p.attackTime=0;p.specialTime=0;p.specialType=null;p.healTime=0;p.onWall=0;p.onGround=false;p.jumps=p.abilities.doubleJump?1:0;this.safePosition={...this.respawnPoint};this.resetUnclearedEncounters();this.respawnOrdinaryEnemies();this.rewardToast={text:'SHELL REBUILT',detail:'RECOVER YOUR WRECKAGE TO RECLAIM SCRAP',time:3};this.burst(p.x+p.w/2,p.y+p.h/2,'#ffffff',30);
  }
  activateDamageModifiers(){const p=this.player;if(p.damageEnergyGain>0)this.gainElectricity(p.damageEnergyGain);if(p.damageSpeedBonus>0){p.reactiveSpeedTime=p.damageSpeedDuration;p.moveSpeed=p.baseMoveSpeed+p.damageSpeedBonus;}}
  activateDamageRelics(){const p=this.player;this.gainElectricity(this.relicValue('damageElectricity'));p.pendingRelicDamage=Math.max(p.pendingRelicDamage,this.relicValue('nextSlashDamage'));const damage=this.relicValue('retaliationDamage'),radius=this.relicValue('retaliationRadius');if(damage>0&&radius>0){const pulse={x:p.x+p.w/2,y:p.y+p.h/2,radius},hits=new Set();for(const enemy of this.enemies)if(!enemy.dead&&this.enemyTargetable(enemy)&&circleIntersectsRect(pulse,enemy))this.hitTarget(enemy,damage,hits,0);this.burst(pulse.x,pulse.y,'#ff786f',26);}}
  damagePlayer(cause='enemy',sourceX=0){const p=this.player;if(p.invuln>0)return;if(cause==='enemy'&&p.shield>0){p.shield--;p.invuln=.45;this.shake=6;this.rewardToast={text:'REPAIR SHIELD ABSORBED',detail:'NO SHELL DAMAGE',time:2};this.burst(p.x+p.w/2,p.y+p.h/2,'#75f5ff',28);return;}this.cancelHeal();p.lives--;this.shake=12;this.burst(p.x+20,p.y+20,'#ff493f',22);if(p.lives<=0){this.destroyPlayer(cause);return;}this.activateDamageModifiers();this.activateDamageRelics();if(cause==='spike'||cause==='fall'){const reset=cause==='spike'?this.safePosition:this.spawn;p.x=reset.x;p.y=reset.y;p.vx=0;p.vy=0;p.invuln=.6;}else{const knockback=Math.max(0,1-this.relicValue('knockbackReduction'));p.invuln=1.2+p.postHitInvulnerabilityBonus;p.vx=(p.x<sourceX?-1:1)*360*knockback;p.vy=-300*knockback;}}
  burst(x,y,color,count){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.25+Math.random()*.35,color});}
  updateParticles(dt){for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=300*dt;q.life-=dt;}this.particles=this.particles.filter(q=>q.life>0);}
}
