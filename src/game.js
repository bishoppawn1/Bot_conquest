import { clamp, hasFloorAhead, overlaps, shareSupportingPlatform, supportingPlatform } from './geometry.js';
import { ABILITY_COSTS, ATTACK_RANGE, ATTACK_TIMING, circleIntersectsRect, directionalBox, ELECTRICITY_MAX, ELECTRICITY_PER_HIT, fieldCircle, SCRAP_VALUES } from './combat.js';
import { BOSS_ARENA, CONDUITS, ENEMY_SPAWNS, JUNK_PILES, PLATFORMS, RECESSES, REST_AREA, SPAWN, TRAPS, WORLD_BOTTOM, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH } from './level.js';

export { WORLD_WIDTH as WIDTH, WORLD_HEIGHT as HEIGHT } from './level.js';
export const PLAYER_JUMP_SPEED = 600;

export class Game {
  constructor() { this.reset(); }
  reset() {
    this.time=0; this.running=true; this.cameraX=0; this.cameraY=0; this.shake=0;
    this.input={left:false,right:false,jump:false,down:false,dash:false,attack:false,heal:false,field:false,electricJab:false,rest:false};
    this.prev={...this.input}; this.particles=[];this.bossProjectiles=[];this.bossShockwave=null;
    this.spawn={...SPAWN};
    this.safePosition={...this.spawn};
    this.player={x:this.spawn.x,y:this.spawn.y,w:50,h:36,vx:0,vy:0,facing:1,aimX:1,aimY:0,attackAimX:1,attackAimY:0,specialAimX:1,specialAimY:0,onGround:false,onWall:0,jumps:1,lives:3,scrap:0,electricity:0,abilities:{doubleJump:false,dash:false,wallClimb:false,heal:true,field:false,electricJab:false},invuln:0,dashTime:0,dashCooldown:0,attackTime:0,attackCooldown:0,attackId:0,attackHits:new Set(),specialTime:0,specialType:null,specialHits:new Set(),healFlash:0,restFlash:0};
    this.platforms=PLATFORMS.map(platform=>({...platform}));
    this.traps=TRAPS.map(trap=>({...trap}));
    this.recesses=RECESSES.map(recess=>({...recess}));
    this.bossArena={...BOSS_ARENA,boss:{...BOSS_ARENA.boss},active:false,cleared:false,gateProgress:0};
    this.restArea={...REST_AREA,station:{...REST_AREA.station}};
    const boss=this.enemy(BOSS_ARENA.boss);Object.assign(boss,{isBoss:true,maxHealth:BOSS_ARENA.boss.health,bossMove:'dormant',bossTimer:0,bossMoveIndex:0});
    this.enemies=[...ENEMY_SPAWNS.map(spawn=>this.enemy(spawn)),boss];
    this.conduits=CONDUITS.map((conduit,index)=>({...conduit,kind:'conduit',id:`conduit-${index}`,maxCharge:conduit.charge,hitFlash:0}));
    this.junkPiles=JUNK_PILES.map((pile,index)=>({...pile,kind:'junk',id:`junk-${index}`,maxHealth:pile.health,dead:false,hitFlash:0}));
  }
  enemy({type,x,y,w,h,health,patrol=false,patrolRange=80,patrolDirection=1}){return{type,x,y,w,h,originX:x,originY:y,vx:0,vy:0,health:health??(type==='boss'?18:type==='brute'?3:1),onGround:false,phase:x*.01,dead:false,active:false,aggroRadius:type==='drone'?340:type==='brute'?240:210,patrol,patrolRange,patrolDirection,windup:0,chargeTime:0,chargeCooldown:0,chargeDirection:patrolDirection};}
  setInput(input){Object.assign(this.input,input);}
  pressed(key){return this.input[key]&&!this.prev[key];}
  update(dt=1/60){
    if(!this.running)return; dt=Math.min(dt,.034); this.time+=dt; const p=this.player;
    p.invuln=Math.max(0,p.invuln-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.attackCooldown=Math.max(0,p.attackCooldown-dt);p.attackTime=Math.max(0,p.attackTime-dt);p.specialTime=Math.max(0,p.specialTime-dt);p.healFlash=Math.max(0,p.healFlash-dt);p.restFlash=Math.max(0,p.restFlash-dt);for(const c of this.conduits)c.hitFlash=Math.max(0,c.hitFlash-dt);
    const axis=(this.input.right?1:0)-(this.input.left?1:0);
    if(this.input.down){p.aimX=0;p.aimY=1;}else if(this.input.jump){p.aimX=0;p.aimY=-1;}else if(axis){p.facing=axis;p.aimX=axis;p.aimY=0;}
    if(this.pressed('dash')&&p.abilities.dash&&p.dashCooldown<=0){p.dashTime=.14;p.dashCooldown=.55;p.vx=p.facing*700;p.vy=0;this.burst(p.x+19,p.y+22,'#d6ff3f',10);}
    if(this.pressed('jump')){
      if(p.onWall&&p.abilities.wallClimb){p.vx=-p.onWall*330;p.vy=-PLAYER_JUMP_SPEED;p.jumps=p.abilities.doubleJump?1:0;}
      else if(p.jumps>0){p.vy=-PLAYER_JUMP_SPEED;p.jumps--;p.onGround=false;this.burst(p.x+19,p.y+40,'#d6ff3f',5);}
    }
    if(this.pressed('attack')&&p.attackCooldown<=0)this.startAttack();
    if(this.pressed('heal'))this.tryHeal();
    if(this.pressed('field'))this.startSpecial('field');
    if(this.pressed('electricJab'))this.startSpecial('electricJab');
    if(this.pressed('rest'))this.tryRest();
    if(p.dashTime>0)p.dashTime-=dt; else {const target=axis*250;p.vx+=(target-p.vx)*Math.min(1,(p.onGround?13:6)*dt);p.vy+=1100*dt;}
    this.moveActor(p,dt,true);
    this.rememberSafePlatform();
    const hitSpike=this.traps.some(trap=>overlaps(p,trap));
    if(hitSpike)this.damagePlayer('spike');else if(p.y>WORLD_BOTTOM+100)this.damagePlayer('fall');
    p.x=clamp(p.x,0,WORLD_WIDTH-p.w);
    this.updateBossArena(dt);this.updateCombat();this.updateEnemies(dt);this.updateBossHazards(dt);this.updateParticles(dt);
    this.cameraX=clamp(p.x-350,0,WORLD_WIDTH-1280);this.cameraY=clamp(p.y-360,WORLD_TOP,WORLD_BOTTOM-720);this.shake=Math.max(0,this.shake-dt*20);
    this.prev={...this.input};
  }
  moveActor(a,dt,isPlayer=false){
    const colliders=isPlayer?[...this.platforms,...this.junkPiles.filter(pile=>!pile.dead),...this.bossGates()]:this.platforms;
    a.x+=a.vx*dt;a.onWall=0;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vx>0){a.x=b.x-a.w;if(isPlayer)a.onWall=1;}else if(a.vx<0){a.x=b.x+b.w;if(isPlayer)a.onWall=-1;}a.vx=0;
    }
    a.y+=a.vy*dt;a.onGround=false;
    for(const b of colliders)if(overlaps(a,b)){
      if(a.vy>=0){a.y=b.y-a.h;a.vy=0;a.onGround=true;if(isPlayer)a.jumps=a.abilities.doubleJump?2:1;}else{a.y=b.y+b.h;a.vy=0;}
    }
    if(isPlayer&&a.abilities.wallClimb&&a.onWall&&this.input.jump&&a.vy>50)a.vy=50;
  }
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
  updateBossArena(dt){
    const arena=this.bossArena,boss=this.boss();if(!arena||!boss)return;
    const center=this.player.x+this.player.w/2;
    if(!arena.active&&!arena.cleared&&center>=arena.triggerX&&center<arena.rightGateX){arena.active=true;boss.bossMove='idle';boss.bossTimer=.65;}
    const target=arena.active&&!arena.cleared?1:0;
    arena.gateProgress+=Math.sign(target-arena.gateProgress)*Math.min(Math.abs(target-arena.gateProgress),dt*3.4);
  }
  aim(){return{x:this.player.aimX,y:this.player.aimY};}
  attackDirection(){return{x:this.player.attackAimX,y:this.player.attackAimY};}
  specialDirection(){return{x:this.player.specialAimX,y:this.player.specialAimY};}
  attackBox(){return directionalBox(this.player,this.attackDirection(),ATTACK_RANGE.primary,30);}
  startAttack(){const p=this.player;p.attackAimX=p.aimX;p.attackAimY=p.aimY;p.attackTime=ATTACK_TIMING.primary;p.attackCooldown=.32;p.attackId++;p.attackHits=new Set();this.resolvePrimaryAttack();this.burst(p.x+p.w/2+p.attackAimX*62,p.y+p.h/2+p.attackAimY*62,'#ffffff',6);}
  startSpecial(type){
    const p=this.player,cost=ABILITY_COSTS[type];if(!p.abilities[type]||p.specialTime>0||p.electricity<cost)return false;
    p.electricity-=cost;p.specialAimX=p.aimX;p.specialAimY=p.aimY;p.specialType=type;p.specialTime=ATTACK_TIMING[type];p.specialHits=new Set();return true;
  }
  tryHeal(){const p=this.player;if(!p.abilities.heal||p.lives>=3||p.electricity<ABILITY_COSTS.heal)return false;p.electricity-=ABILITY_COSTS.heal;p.lives++;p.healFlash=.6;this.burst(p.x+p.w/2,p.y+p.h/2,'#75f5ff',24);return true;}
  canRest(){const p=this.player,station=this.restArea.station,dx=(p.x+p.w/2)-(station.x+station.w/2),dy=(p.y+p.h/2)-(station.y+station.h/2);return this.bossArena.cleared&&Math.hypot(dx,dy)<=station.interactionRadius;}
  tryRest(){if(!this.canRest())return false;const p=this.player,station=this.restArea.station;p.lives=3;p.invuln=0;p.vx=0;p.vy=0;p.restFlash=1;const checkpointX=clamp(station.x+station.w+24,this.restArea.x+16,this.restArea.x+this.restArea.w-p.w-16);this.safePosition={x:checkpointX,y:this.restArea.floorY-p.h};this.burst(station.x+station.w/2,station.y+station.h/2,'#d6ff3f',30);return true;}
  unlockAbility(name){if(name in this.player.abilities){this.player.abilities[name]=true;if(name==='doubleJump'&&this.player.onGround)this.player.jumps=2;return true;}return false;}
  gainElectricity(amount=ELECTRICITY_PER_HIT){this.player.electricity=clamp(this.player.electricity+amount,0,ELECTRICITY_MAX);}
  hitTarget(target,damage,hitSet,electricity=ELECTRICITY_PER_HIT){
    if(hitSet.has(target))return;hitSet.add(target);
    if(target.kind==='conduit'){const harvested=Math.min(target.energyPerHit,target.charge);target.charge-=harvested;this.gainElectricity(harvested);target.hitFlash=.22;this.burst(target.x+target.w/2,target.y+target.h/2,target.charge>0?'#75f5ff':'#657075',harvested>0?10:3);return;}
    if(target.kind!=='junk')this.gainElectricity(electricity);
    if(target.kind==='junk'&&damage<(target.minimumDamage??1)){target.hitFlash=.18;this.burst(target.x+target.w/2,target.y+target.h/2,'#ffffff',5);return;}
    target.health-=damage;target.hitFlash=.18;this.burst(target.x+target.w/2,target.y+target.h/2,target.kind==='junk'?'#d9a441':'#ff493f',12);
    if(target.health<=0&&!target.dead){target.dead=true;this.player.scrap+=target.kind==='junk'?target.scrapValue:(SCRAP_VALUES[target.type]??5);if(target.type==='boss'){this.bossArena.cleared=true;this.bossArena.active=false;this.bossProjectiles=[];this.bossShockwave=null;}this.burst(target.x+target.w/2,target.y+target.h/2,'#d6ff3f',target.kind==='junk'?36:target.type==='boss'?70:20);}
  }
  resolvePrimaryAttack(){const p=this.player,box=this.attackBox();for(const e of this.enemies)if(!e.dead&&overlaps(box,e))this.hitTarget(e,1,p.attackHits);for(const c of this.conduits)if(overlaps(box,c))this.hitTarget(c,0,p.attackHits);for(const pile of this.junkPiles)if(!pile.dead&&overlaps(box,pile))this.hitTarget(pile,1,p.attackHits,0);}
  updateCombat(){
    const p=this.player;
    if(p.specialTime<=0)return;
    const damage=p.specialType==='electricJab'?2:1;
    const hits=p.specialType==='field'?(target=>circleIntersectsRect(fieldCircle(p),target)):(target=>overlaps(directionalBox(p,this.specialDirection(),ATTACK_RANGE.electricJab,38),target));
    for(const e of this.enemies)if(!e.dead&&hits(e))this.hitTarget(e,damage,p.specialHits,4);
    for(const c of this.conduits)if(hits(c))this.hitTarget(c,0,p.specialHits,4);
    for(const pile of this.junkPiles)if(!pile.dead&&hits(pile))this.hitTarget(pile,damage,p.specialHits,0);
  }
  updateEnemies(dt){
    const p=this.player;
    for(const e of this.enemies){if(e.dead)continue;e.phase+=dt;
      if(e.type==='boss'){this.updateBoss(e,dt);if(overlaps(p,e))this.damagePlayer('enemy',e.x+e.w/2);continue;}
      const distance=Math.hypot((p.x+p.w/2)-(e.x+e.w/2),(p.y+p.h/2)-(e.y+e.h/2));
      if(e.type==='drone'){
        e.active=distance<=e.aggroRadius;
        if(e.active){const dx=(p.x+p.w/2)-(e.x+e.w/2),dy=(p.y+p.h/2)-(e.y+e.h/2),length=Math.max(1,Math.hypot(dx,dy)),speed=105;e.vx+=(dx/length*speed-e.vx)*Math.min(1,5*dt);e.vy+=(dy/length*speed-e.vy)*Math.min(1,5*dt);}
        else{e.vx*=Math.max(0,1-4*dt);const hoverY=e.originY+Math.sin(e.phase*2.5)*16;e.vy=(hoverY-e.y)*3;}
        this.moveFlyingActor(e,dt);
      } else {
        e.active=distance<=e.aggroRadius&&shareSupportingPlatform(e,p,this.platforms);
        e.chargeCooldown=Math.max(0,e.chargeCooldown-dt);
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
        }else e.vx=safeToAdvance?direction*speed*(e.active?1:.42):0;
        if(e.type==='hopper'&&e.active&&e.onGround&&safeToAdvance)e.vy=-370;
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
  updateBossHazards(dt){
    for(const bolt of this.bossProjectiles){if(bolt.dead)continue;bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;bolt.life-=dt;if(this.platforms.some(block=>overlaps(bolt,block)))bolt.dead=true;if(!bolt.dead&&overlaps(bolt,this.player)){bolt.dead=true;this.damagePlayer('enemy',bolt.x);}}
    this.bossProjectiles=this.bossProjectiles.filter(bolt=>!bolt.dead&&bolt.life>0);
    const wave=this.bossShockwave;if(!wave)return;wave.time=Math.max(0,wave.time-dt);wave.radius+=(wave.maxRadius-wave.radius)*Math.min(1,8*dt);const playerCenter=this.player.x+this.player.w/2;if(!wave.hit&&Math.abs(playerCenter-wave.x)<=wave.radius&&Math.abs(this.player.y+this.player.h-wave.y)<45){wave.hit=true;this.damagePlayer('enemy',wave.x);}if(wave.time===0)this.bossShockwave=null;
  }
  damagePlayer(cause='enemy',sourceX=0){const p=this.player;if(p.invuln>0)return;p.lives--;this.shake=12;this.burst(p.x+20,p.y+20,'#ff493f',22);if(p.lives<=0){this.running=false;return;}if(cause==='spike'||cause==='fall'){const reset=cause==='spike'?this.safePosition:this.spawn;p.x=reset.x;p.y=reset.y;p.vx=0;p.vy=0;p.invuln=.6;}else{p.invuln=1.2;p.vx=(p.x<sourceX?-1:1)*360;p.vy=-300;}}
  burst(x,y,color,count){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.25+Math.random()*.35,color});}
  updateParticles(dt){for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=300*dt;q.life-=dt;}this.particles=this.particles.filter(q=>q.life>0);}
}
