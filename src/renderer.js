import { ATTACK_RANGE, ATTACK_TIMING } from './combat.js';
import { isSurfaceContact, nearestSurfacePoint } from './geometry.js';

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;
export const LEG_COUNT = 3;
export const LEG_REACH = 112;
export const LEG_SPREAD = 44;

export function localMapProjection(region,objects,frame,padding=60) {
  const top=Math.min(...objects.map(object=>object.y),0)-padding;
  const bottom=Math.max(...objects.map(object=>object.y+object.h),0)+padding;
  const worldHeight=Math.max(1,bottom-top);
  const scale=Math.min(frame.w/region.w,frame.h/worldHeight);
  const width=region.w*scale,height=worldHeight*scale;
  return{scale,top,bottom,x:frame.x+(frame.w-width)/2,y:frame.y+(frame.h-height)/2,width,height};
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.feet = Array(LEG_COUNT).fill(null);
    this.stepIndex = -1;
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    this.resize();
  }

  resetLegs() { this.feet = Array(LEG_COUNT).fill(null); this.stepIndex = -1; }

  resize() {
    const dpr = Math.min(devicePixelRatio, 2);
    const box = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(box.height * dpr);
  }

  draw(game) {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(this.canvas.width/VIEW_WIDTH,0,0,this.canvas.height/VIEW_HEIGHT,0,0);
    ctx.clearRect(0,0,VIEW_WIDTH,VIEW_HEIGHT);
    ctx.translate((Math.random()-.5)*game.shake,(Math.random()-.5)*game.shake);
    this.drawBackground(game);
    ctx.save();ctx.translate(-game.cameraX,-game.cameraY);this.drawWorld(game);ctx.restore();
    this.drawHud(game);
    if(game.inventoryOpen)this.drawInventory(game);
    ctx.restore();
  }

  line(x1,y1,x2,y2,color='#27333c',width=1) {
    const { ctx }=this;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }

  polygon(points,fill) {
    const { ctx }=this;ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  }

  drawBackground(game) {
    const {ctx}=this,sunken=game.regionId==='vault',gauntlet=game.regionId==='gauntlet',exchange=game.regionId==='exchange';const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,sunken?'#07101a':gauntlet?'#211013':exchange?'#202018':'#101924');gradient.addColorStop(1,sunken?'#020509':gauntlet?'#080506':exchange?'#090a07':'#070b10');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
    const farY=game.cameraY*.08;ctx.fillStyle='#0c151d';for(let i=0;i<10;i++){const x=((i*270-game.cameraX*.08)%1800)-180,h=180+(i%3)*90;ctx.fillRect(x,560-h-farY,150,h);ctx.fillStyle='#14212a';ctx.fillRect(x+18,585-h-farY,10,h-40);ctx.fillStyle='#0c151d';}
    ctx.strokeStyle='#1b2b34';ctx.lineWidth=5;for(let i=0;i<6;i++){const x=((i*380-game.cameraX*.2)%1900)-200,y=180-game.cameraY*.16;ctx.beginPath();ctx.moveTo(x,y+430);ctx.lineTo(x+120,y);ctx.lineTo(x+240,y+430);ctx.stroke();this.line(x+55,y+220,x+185,y+220,'#1b2b34',4);}
    ctx.fillStyle='#15232c';for(let i=0;i<14;i++){const x=((i*190-game.cameraX*.28)%1600)-100,h=100+(i%4)*50,yShift=game.cameraY*.22;ctx.fillRect(x,470-h-yShift,105,h);ctx.fillStyle='#1b2c35';ctx.fillRect(x+15,490-h-yShift,8,h-25);ctx.fillStyle='#15232c';}
    ctx.globalAlpha=.3;for(let x=-game.cameraX%80;x<1280;x+=80)this.line(x,0,x,720,'#2b3740');for(let y=0;y<720;y+=80)this.line(0,y,1280,y,'#2b3740');ctx.globalAlpha=1;
    ctx.fillStyle='rgba(214,255,63,.025)';ctx.beginPath();ctx.arc(1080,110,240,0,Math.PI*2);ctx.fill();
    if(sunken){const gloom=ctx.createRadialGradient(640,430,80,640,430,760);gloom.addColorStop(0,'rgba(23,84,103,.08)');gloom.addColorStop(1,'rgba(0,3,8,.72)');ctx.fillStyle=gloom;ctx.fillRect(0,0,1280,720);ctx.globalAlpha=.18;ctx.strokeStyle='#75f5ff';ctx.lineWidth=1;for(let i=0;i<18;i++){const x=(i*173-game.cameraX*.12)%1400,y=(i*97+game.time*11)%760;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y-34);ctx.stroke();}ctx.globalAlpha=1;}
    if(gauntlet){ctx.fillStyle='rgba(255,73,63,.055)';for(let x=-game.cameraX%170;x<1280;x+=170)this.polygon([[x,720],[x+85,530],[x+170,720]],ctx.fillStyle);}
    if(exchange){ctx.fillStyle='rgba(255,184,92,.04)';for(let i=0;i<8;i++)ctx.fillRect((i*211-game.cameraX*.08)%1500,90+(i%3)*150,130,3);}
  }

  drawWorld(game) {
    const {ctx}=this;
    for(const recess of game.recesses)this.drawRecess(recess);
    for(const trap of game.traps){for(let x=trap.x;x<trap.x+trap.w;x+=20)this.polygon([[x,trap.y+20],[x+10,trap.y-5],[x+20,trap.y+20]],'#ff493f');ctx.fillStyle='#45191c';ctx.fillRect(trap.x,trap.y+20,trap.w,trap.h);}
    for(const platform of game.platforms)this.drawPlatform(platform);
    for(const gate of game.regionGates)this.drawRegionGate(gate,game.time);
    this.drawBossArena(game);
    this.drawVaultBossArena(game);
    this.drawDepthBossArena(game);
    this.drawMiniBossArenas(game);
    this.drawRestStation(game);
    for(const merchant of game.merchants)this.drawMerchantDoor(merchant,game.merchantDoorUnlocked(merchant),game.time);
    if(game.merchantRoom.activeMerchant)this.drawMerchant({...game.merchantRoom.activeMerchant,...game.merchantRoom.merchant},game.time);
    if(game.merchantRoom.activeMerchant)this.drawMerchantDoor({...game.merchantRoom.exit,color:game.merchantRoom.activeMerchant.color},true,game.time);
    for(const pickup of game.pickups)if(game.pickupAvailable(pickup))this.drawPickup(pickup,game.time);
    for(const pile of game.junkPiles)if(!pile.dead)this.drawJunkPile(pile);
    if(game.recoveryCorpse&&!game.recoveryCorpse.dead)this.drawRecoveryCorpse(game.recoveryCorpse,game.time);
    for(const conduit of game.conduits)this.drawConduit(conduit,game.time);
    for(const enemy of game.enemies)if(!enemy.dead)this.drawEnemy(enemy,game.time);
    this.drawBot(game);
    for(const particle of game.particles){ctx.globalAlpha=Math.max(0,particle.life*2);ctx.fillStyle=particle.color;ctx.fillRect(particle.x,particle.y,4,4);}ctx.globalAlpha=1;
  }

  footTarget(game, index, step) {
    const player=game.player;
    const hash=Math.sin(step*12.9898+index*78.233)*43758.5453;
    const fraction=hash-Math.floor(hash);
    const jitter=(fraction-.5)*16;
    const offset=(index-(LEG_COUNT-1)/2)*LEG_SPREAD;
    const centerBias=index===(LEG_COUNT-1)/2?(fraction>.5?20:-20):0;
    const probeX=player.x+player.w/2+offset+centerBias+jitter+Math.sign(player.vx)*10;
    const probeY=player.y+player.h*.78;
    return nearestSurfacePoint(probeX,probeY,game.platforms,LEG_REACH);
  }

  updateFeet(game) {
    const moving=Math.abs(game.player.vx)>25;
    const cadence=moving?.15:.48;
    const step=Math.floor(game.time/cadence);
    for(let i=0;i<LEG_COUNT;i++)if(!isSurfaceContact(this.feet[i],game.platforms))this.feet[i]=this.footTarget(game,i,step+i);
    if(step!==this.stepIndex){const index=step%LEG_COUNT;this.feet[index]=this.footTarget(game,index,step);this.stepIndex=step;}
    for(let i=0;i<LEG_COUNT;i++){
      const attachOffset=(i-(LEG_COUNT-1)/2)*14;
      const attach={x:game.player.x+game.player.w/2+attachOffset,y:game.player.y+game.player.h*.64};
      if(this.feet[i]&&Math.hypot(this.feet[i].x-attach.x,this.feet[i].y-attach.y)>LEG_REACH+10)this.feet[i]=this.footTarget(game,i,step+i);
    }
  }

  drawBot(game) {
    const {ctx}=this,player=game.player;
    if(player.invuln>0&&Math.floor(game.time*14)%2)return;
    this.updateFeet(game);
    // Each leg is constrained between its body anchor and its latched surface point.
    for(let i=0;i<LEG_COUNT;i++){
      const offset=i-(LEG_COUNT-1)/2;
      const bend=offset===0?(this.stepIndex%2?1:-1):Math.sign(offset);
      const anchor={x:player.x+player.w/2+offset*14,y:player.y+player.h*.62};
      const foot=this.feet[i];
      if(!foot||!isSurfaceContact(foot,game.platforms))continue;
      const knee={x:(anchor.x+foot.x)/2+bend*8,y:(anchor.y+foot.y)/2-5};
      ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(knee.x,knee.y);ctx.lineTo(foot.x,foot.y);ctx.strokeStyle='#10171b';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#bdcdd0';ctx.lineWidth=4;ctx.stroke();
      ctx.fillStyle='#d6ff3f';ctx.beginPath();ctx.arc(foot.x,foot.y,3.5,0,Math.PI*2);ctx.fill();
    }
    ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h/2);
    ctx.fillStyle='#1a242b';ctx.beginPath();ctx.ellipse(0,0,25,18,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#93a2a5';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#2b3940';ctx.beginPath();ctx.ellipse(-5,-4,17,11,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.rotate(Math.atan2(player.aimY,player.aimX));ctx.shadowBlur=10;ctx.shadowColor='#ff3434';ctx.fillStyle='#ff3d3d';ctx.beginPath();ctx.arc(12,-6,4,0,Math.PI*2);ctx.arc(19,0,2.5,0,Math.PI*2);ctx.arc(10,5,2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
    ctx.fillStyle='#d6ff3f';ctx.fillRect(-8,-21,16,3);ctx.restore();
    if(player.healTime>0)this.drawRepairChannel(player);
    if(player.healFlash>0)this.drawHeal(player);
    if(player.restFlash>0){ctx.save();ctx.strokeStyle='#d6ff3f';ctx.globalAlpha=player.restFlash;ctx.lineWidth=5;ctx.beginPath();ctx.arc(player.x+player.w/2,player.y+player.h/2,34+(1-player.restFlash)*45,0,Math.PI*2);ctx.stroke();ctx.restore();}
    if(player.attackTime>0)this.drawPrimarySlash(player);
    if(player.specialTime>0){if(player.specialType==='field')this.drawElectricField(player);else this.drawElectricJab(player);}
  }

  drawPrimarySlash(player) {
    const {ctx}=this,cx=player.x+player.w/2,cy=player.y+player.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(player.attackAimY,player.attackAimX));ctx.shadowBlur=16;ctx.shadowColor='#ffffff';ctx.strokeStyle='#ffffff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(21,0);ctx.lineTo(ATTACK_RANGE.primary,0);ctx.stroke();ctx.globalAlpha=.28;ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(29,0);ctx.lineTo(ATTACK_RANGE.primary-8,0);ctx.stroke();ctx.restore();
  }

  drawRecess(recess) {
    const {ctx}=this,depth=22;ctx.save();ctx.fillStyle='rgba(2,6,10,.9)';ctx.fillRect(recess.x,recess.y,recess.w,recess.h);this.polygon([[recess.x,recess.y],[recess.x+depth,recess.y+depth],[recess.x+recess.w-depth,recess.y+depth],[recess.x+recess.w,recess.y]],'#17252d');this.polygon([[recess.x,recess.y],[recess.x+depth,recess.y+depth],[recess.x+depth,recess.y+recess.h-depth],[recess.x,recess.y+recess.h]],'#0b1217');ctx.strokeStyle='#30434c';ctx.lineWidth=4;ctx.strokeRect(recess.x,recess.y,recess.w,recess.h);for(let x=recess.x+55;x<recess.x+recess.w-30;x+=120){ctx.fillStyle='#111d24';ctx.fillRect(x,recess.y+34,24,recess.h-68);ctx.fillStyle='#24343c';ctx.fillRect(x+4,recess.y+38,4,recess.h-76);}ctx.strokeStyle='#1e333d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(recess.x+30,recess.y+recess.h*.72);ctx.lineTo(recess.x+recess.w-30,recess.y+recess.h*.72);ctx.stroke();ctx.restore();
  }

  drawPlatform(platform) {
    if(platform.kind==='wall'){this.drawWall(platform);return;}
    const {ctx}=this,depth=platform.h>=90?18:12,accent=platform.requires?'#ff7b55':'#d6ff3f';ctx.fillStyle=platform.kind==='ceiling'?'#202d35':'#1a262e';ctx.fillRect(platform.x,platform.y,platform.w,platform.h);this.polygon([[platform.x,platform.y],[platform.x+depth,platform.y-depth],[platform.x+platform.w+depth,platform.y-depth],[platform.x+platform.w,platform.y]],platform.requires?'#49352f':'#43565e');this.polygon([[platform.x+platform.w,platform.y],[platform.x+platform.w+depth,platform.y-depth],[platform.x+platform.w+depth,platform.y+platform.h-depth],[platform.x+platform.w,platform.y+platform.h]],'#090f14');ctx.fillStyle=accent;ctx.fillRect(platform.x,platform.y,platform.w,3);if(platform.h>=60)for(let x=platform.x+24;x<platform.x+platform.w-24;x+=92){const panelY=platform.y+25;ctx.fillStyle='#10191e';ctx.fillRect(x,panelY,56,Math.min(18,platform.h-34));ctx.strokeStyle='#31434b';ctx.lineWidth=2;ctx.strokeRect(x+3,panelY+3,50,Math.min(12,platform.h-40));}if(platform.h>=140){ctx.fillStyle='#111a20';ctx.fillRect(platform.x+18,platform.y+platform.h-32,platform.w-36,12);ctx.fillStyle='#2c3b42';ctx.fillRect(platform.x+22,platform.y+platform.h-29,platform.w-44,3);}
  }

  drawWall(wall) {
    const {ctx}=this;ctx.save();ctx.fillStyle='#11191f';ctx.fillRect(wall.x,wall.y,wall.w,wall.h);ctx.fillStyle='#2c3a42';ctx.fillRect(wall.x+7,wall.y,wall.w-14,wall.h);ctx.strokeStyle='#ff765f';ctx.lineWidth=4;ctx.strokeRect(wall.x+3,wall.y+3,wall.w-6,wall.h-6);ctx.fillStyle='#0a1014';ctx.fillRect(wall.x+wall.w*.38,wall.y+10,wall.w*.24,wall.h-20);for(let y=wall.y+16;y<wall.y+wall.h-14;y+=28){ctx.fillStyle='#8b3e36';this.polygon([[wall.x+10,y],[wall.x+wall.w-10,y+8],[wall.x+wall.w-10,y+14],[wall.x+10,y+6]],ctx.fillStyle);ctx.fillStyle='#d6ff3f';ctx.beginPath();ctx.arc(wall.x+wall.w/2,y+20,2.5,0,Math.PI*2);ctx.fill();}ctx.restore();
  }

  drawRegionGate(gate,time) {
    const {ctx}=this;ctx.save();ctx.globalAlpha=.72;ctx.fillStyle='#101820';ctx.fillRect(gate.x,gate.y,10,gate.h);ctx.fillRect(gate.x+gate.w-10,gate.y,10,gate.h);ctx.strokeStyle='#75f5ff';ctx.lineWidth=3;ctx.strokeRect(gate.x+2,gate.y+2,gate.w-4,gate.h-4);ctx.fillStyle='#263740';for(let y=gate.y+18;y<gate.y+gate.h-15;y+=28){ctx.fillRect(gate.x+10,y,gate.w-20,6);ctx.fillStyle=Math.sin(time*4+y*.08)>0?'#d6ff3f':'#3d555d';ctx.fillRect(gate.x+gate.w/2-3,y+1,6,4);ctx.fillStyle='#263740';}ctx.restore();
  }

  drawPickup(pickup,time) {
    const {ctx}=this,cx=pickup.x+pickup.w/2,cy=pickup.y+pickup.h/2+Math.sin(time*4+pickup.x)*5,color=pickup.color??'#ffffff';ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.8);ctx.shadowBlur=24;ctx.shadowColor=color;ctx.fillStyle=color;ctx.fillRect(-pickup.w/2,-pickup.h/2,pickup.w,pickup.h);ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(-pickup.w/2-3,-pickup.h/2-3,pickup.w+6,pickup.h+6);ctx.rotate(-time*1.7);ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*1.3);ctx.stroke();ctx.beginPath();ctx.arc(0,0,34,Math.PI,Math.PI*2.3);ctx.stroke();for(let i=0;i<4;i++){const angle=time*2+i*Math.PI/2;ctx.fillStyle=i%2?'#ffffff':color;ctx.fillRect(Math.cos(angle)*30-2,Math.sin(angle)*30-2,4,4);}ctx.restore();
  }

  drawMerchant(merchant,time) {
    const {ctx}=this;ctx.save();ctx.translate(merchant.x,merchant.y);ctx.fillStyle='#11191e';ctx.fillRect(2,18,merchant.w-4,merchant.h-18);ctx.fillStyle='#293940';ctx.fillRect(6,24,merchant.w-12,merchant.h-30);ctx.strokeStyle=merchant.color;ctx.lineWidth=3;ctx.strokeRect(3,19,merchant.w-6,merchant.h-21);ctx.fillStyle=merchant.color;ctx.fillRect(-4,10,merchant.w+8,9);ctx.fillStyle='#0a1014';ctx.fillRect(9,30,merchant.w-18,10);ctx.shadowBlur=10;ctx.shadowColor=merchant.color;ctx.fillStyle=merchant.color;ctx.beginPath();ctx.arc(merchant.w/2+Math.sin(time*2+merchant.x)*2,35,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#75878d';ctx.fillRect(8,merchant.h-3,8,3);ctx.fillRect(merchant.w-16,merchant.h-3,8,3);ctx.restore();
  }

  drawMerchantDoor(door,unlocked,time) {
    const {ctx}=this,color=unlocked?door.color:'#4c5559';ctx.save();ctx.translate(door.x,door.y);ctx.fillStyle='#0b1115';ctx.fillRect(0,0,door.w,door.h);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.strokeRect(2,2,door.w-4,door.h-4);ctx.fillStyle='#1b282f';ctx.fillRect(12,14,door.w-24,door.h-28);for(let y=24;y<door.h-18;y+=20){ctx.fillStyle=unlocked?'#263b43':'#252b2e';ctx.fillRect(17,y,door.w-34,7);}ctx.shadowBlur=unlocked?14:0;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(door.w/2,18,4+(unlocked?Math.sin(time*4)*1.2:0),0,Math.PI*2);ctx.fill();ctx.restore();
  }

  drawBossArena(game) {
    const {ctx}=this;
    for(const gate of game.bossGates()){ctx.save();ctx.fillStyle='#283038';ctx.fillRect(gate.x,gate.y,gate.w,gate.h);ctx.fillStyle='#ff493f';ctx.fillRect(gate.x,gate.y,4,gate.h);ctx.fillRect(gate.x+gate.w-4,gate.y,4,gate.h);for(let y=gate.y+16;y<gate.y+gate.h;y+=28){ctx.fillStyle='#11181d';ctx.fillRect(gate.x+7,y,gate.w-14,10);ctx.fillStyle='#6d3535';ctx.fillRect(gate.x+9,y+2,gate.w-18,2);}ctx.restore();}
    for(const bolt of game.bossProjectiles){const color=bolt.color??'#ff493f';ctx.save();ctx.shadowBlur=18;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(bolt.x+bolt.w/2,bolt.y+bolt.h/2,bolt.w/2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    for(const explosion of game.bossExplosions){ctx.save();ctx.globalAlpha=Math.min(1,explosion.time/explosion.maxTime*1.8);ctx.shadowBlur=24;ctx.shadowColor=explosion.color;ctx.fillStyle='rgba(214,255,63,.16)';ctx.strokeStyle=explosion.color;ctx.lineWidth=6;ctx.beginPath();ctx.arc(explosion.x,explosion.y,explosion.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    if(game.bossShockwave){const wave=game.bossShockwave,color=wave.color??'#ff765f';ctx.save();ctx.strokeStyle=color;ctx.shadowBlur=18;ctx.shadowColor=color;ctx.lineWidth=7;ctx.globalAlpha=Math.min(1,wave.time/.25);ctx.beginPath();ctx.ellipse(wave.x,wave.y,wave.radius,18,0,Math.PI,Math.PI*2);ctx.stroke();ctx.restore();}
  }

  drawVaultBossArena(game) {
    const {ctx}=this;for(const gate of game.vaultBossGates()){ctx.save();ctx.fillStyle='#10242c';ctx.fillRect(gate.x,gate.y,gate.w,gate.h);ctx.strokeStyle='#75f5ff';ctx.lineWidth=4;ctx.strokeRect(gate.x+2,gate.y+2,gate.w-4,gate.h-4);for(let y=gate.y+10;y<gate.y+gate.h-8;y+=18){ctx.fillStyle='#37606b';ctx.fillRect(gate.x+6,y,gate.w-12,6);ctx.fillStyle='#ffffff';ctx.fillRect(gate.x+gate.w/2-2,y+1,4,4);}ctx.restore();}
  }

  drawDepthBossArena(game) {
    const {ctx}=this;for(const gate of game.depthBossGates()){ctx.save();ctx.fillStyle='#172018';ctx.fillRect(gate.x,gate.y,gate.w,gate.h);ctx.strokeStyle='#d6ff3f';ctx.lineWidth=4;ctx.strokeRect(gate.x+2,gate.y+2,gate.w-4,gate.h-4);for(let y=gate.y+10;y<gate.y+gate.h-8;y+=20){ctx.fillStyle='#526436';ctx.fillRect(gate.x+6,y,gate.w-12,7);ctx.fillStyle='#ffffff';ctx.fillRect(gate.x+gate.w/2-2,y+2,4,3);}ctx.restore();}
  }

  drawMiniBossArenas(game) {
    const {ctx}=this;
    for(const gate of game.miniBossGates()){ctx.save();ctx.fillStyle='#172932';ctx.fillRect(gate.x,gate.y,gate.w,gate.h);ctx.strokeStyle='#75f5ff';ctx.lineWidth=3;ctx.strokeRect(gate.x+2,gate.y+2,gate.w-4,gate.h-4);for(let y=gate.y+12;y<gate.y+gate.h-8;y+=22){ctx.fillStyle='#294954';ctx.fillRect(gate.x+6,y,gate.w-12,7);ctx.fillStyle='#d6ff3f';ctx.fillRect(gate.x+gate.w/2-2,y+2,4,3);}ctx.restore();}
  }

  drawRestStation(game) {
    const {ctx}=this,station=game.restArea.station,online=game.bossArena.cleared;ctx.save();ctx.translate(station.x,station.y);ctx.fillStyle='#151f25';ctx.fillRect(0,station.h-14,station.w,14);ctx.strokeStyle=online?'#d6ff3f':'#46555b';ctx.lineWidth=3;ctx.strokeRect(1,station.h-13,station.w-2,12);ctx.fillStyle='#26343b';ctx.beginPath();ctx.moveTo(8,station.h-14);ctx.lineTo(12,20);ctx.lineTo(28,5);ctx.lineTo(50,14);ctx.lineTo(56,station.h-14);ctx.closePath();ctx.fill();ctx.strokeStyle=online?'#75f5ff':'#526168';ctx.stroke();ctx.shadowBlur=online?16:0;ctx.shadowColor='#75f5ff';ctx.fillStyle=online?'#75f5ff':'#3d494e';ctx.beginPath();ctx.arc(32,25,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0c1216';ctx.fillRect(17,42,30,8);ctx.fillStyle=online?'#d6ff3f':'#39454a';ctx.fillRect(20,44,24,4);ctx.restore();
  }

  drawElectricJab(player) {
    const {ctx}=this,pulse=Math.sin(Math.min(1,1-player.specialTime/ATTACK_TIMING.electricJab)*Math.PI),reach=ATTACK_RANGE.electricJab*(.48+.52*pulse),cx=player.x+player.w/2,cy=player.y+player.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(player.specialAimY,player.specialAimX));ctx.shadowBlur=25;ctx.shadowColor='#75f5ff';ctx.strokeStyle='#75f5ff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(18,0);const segments=9;for(let i=1;i<=segments;i++){const x=18+(reach-18)*i/segments,y=i===segments?0:Math.sin(i*19.7+player.specialTime*70)*8;ctx.lineTo(x,y);}ctx.stroke();ctx.globalAlpha=.25;ctx.lineWidth=20;ctx.stroke();ctx.restore();
  }

  drawElectricField(player) {
    const {ctx}=this,cx=player.x+player.w/2,cy=player.y+player.h/2,radius=ATTACK_RANGE.field;ctx.save();ctx.shadowBlur=25;ctx.shadowColor='#75f5ff';ctx.strokeStyle='#75f5ff';ctx.lineWidth=4;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
    for(let bolt=0;bolt<12;bolt++){const angle=bolt*Math.PI/6+player.specialTime*.7,inner=30+(bolt%3)*8;ctx.beginPath();for(let segment=0;segment<=5;segment++){const distance=inner+(radius-inner)*segment/5;const jitter=segment===0||segment===5?0:Math.sin(bolt*31+segment*17+player.specialTime*80)*10;const x=cx+Math.cos(angle)*distance+Math.cos(angle+Math.PI/2)*jitter,y=cy+Math.sin(angle)*distance+Math.sin(angle+Math.PI/2)*jitter;segment?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.lineWidth=bolt%3===0?5:2;ctx.stroke();}
    ctx.globalAlpha=.16;ctx.fillStyle='#75f5ff';ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  drawHeal(player) {
    const {ctx}=this;ctx.save();ctx.strokeStyle='#75f5ff';ctx.lineWidth=4;ctx.globalAlpha=player.healFlash/.6;ctx.beginPath();ctx.arc(player.x+player.w/2,player.y+player.h/2,28+(1-player.healFlash/.6)*25,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  drawRepairChannel(player) {
    const {ctx}=this,progress=1-player.healTime/.7,cx=player.x+player.w/2,cy=player.y+player.h/2;ctx.save();ctx.shadowBlur=12;ctx.shadowColor='#75f5ff';ctx.strokeStyle='#28434d';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,31,-Math.PI/2,Math.PI*1.5);ctx.stroke();ctx.strokeStyle='#75f5ff';ctx.beginPath();ctx.arc(cx,cy,31,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.restore();
  }

  drawConduit(conduit,time) {
    const {ctx}=this,cx=conduit.x+conduit.w/2,ratio=conduit.charge/conduit.maxCharge,empty=conduit.charge<=0;ctx.save();ctx.fillStyle=empty?'#171d20':'#172830';ctx.fillRect(conduit.x,conduit.y,conduit.w,conduit.h);ctx.strokeStyle=empty?'#343d40':'#526a70';ctx.lineWidth=2;ctx.strokeRect(conduit.x,conduit.y,conduit.w,conduit.h);ctx.fillStyle='#263b43';ctx.fillRect(conduit.x-5,conduit.y+conduit.h-8,conduit.w+10,8);
    const glow=empty?'#566064':conduit.hitFlash>0?'#ffffff':'#75f5ff';ctx.shadowBlur=empty?0:conduit.hitFlash>0?25:10;ctx.shadowColor=glow;ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,conduit.y+8);ctx.lineTo(cx-5,conduit.y+21);ctx.lineTo(cx+4,conduit.y+21);ctx.lineTo(cx-2,conduit.y+36);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#0a1013';ctx.fillRect(conduit.x+4,conduit.y+conduit.h-14,conduit.w-8,4);ctx.fillStyle=empty?'#3c4649':'#75f5ff';ctx.fillRect(conduit.x+4,conduit.y+conduit.h-14,(conduit.w-8)*ratio,4);ctx.restore();
  }

  drawJunkPile(pile) {
    const {ctx}=this,damage=1-pile.health/pile.maxHealth,materialColor=pile.material?.type==='uranium'?'#83ff58':pile.material?.type==='titanium'?'#d6e2e5':null;ctx.save();ctx.translate(pile.x,pile.y);ctx.fillStyle=materialColor?'#293438':'#3a3029';ctx.beginPath();ctx.moveTo(0,pile.h);ctx.lineTo(6,pile.h*.52);ctx.lineTo(pile.w*.25,pile.h*.25);ctx.lineTo(pile.w*.48,pile.h*.38);ctx.lineTo(pile.w*.68,3);ctx.lineTo(pile.w*.84,pile.h*.3);ctx.lineTo(pile.w,pile.h*.58);ctx.lineTo(pile.w,pile.h);ctx.closePath();ctx.fill();ctx.strokeStyle=materialColor??'#87705b';ctx.lineWidth=3;ctx.stroke();
    for(let i=0;i<7;i++){const x=7+(i*19)%Math.max(20,pile.w-15),y=10+(i*13)%Math.max(18,pile.h-14);ctx.save();ctx.translate(x,y);ctx.rotate((i*.83)%2);ctx.fillStyle=i%3===0?'#a8753d':i%3===1?'#59676a':'#6f4f43';ctx.fillRect(-7,-3,14,6);ctx.restore();}
    if(pile.material){ctx.shadowBlur=12;ctx.shadowColor=materialColor;ctx.fillStyle=materialColor;ctx.font='700 8px Space Mono';ctx.fillText(pile.material.type==='uranium'?'U':'TI',8,13);ctx.shadowBlur=0;}if(pile.minimumDamage>1){ctx.strokeStyle='#75f5ff';ctx.lineWidth=3;ctx.strokeRect(3,3,pile.w-6,pile.h-6);ctx.fillStyle='#75f5ff';ctx.font='700 9px Space Mono';ctx.fillText('VOLT',pile.w/2-13,pile.h/2+3);}if(damage>0){ctx.strokeStyle='#d6ff3f';ctx.globalAlpha=.35+damage*.5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pile.w*.52,4);ctx.lineTo(pile.w*.45,pile.h*.42);ctx.lineTo(pile.w*.58,pile.h*.7);ctx.stroke();}ctx.restore();
  }

  drawRecoveryCorpse(corpse,time) {
    const {ctx}=this,cx=corpse.x+corpse.w/2,cy=corpse.y+corpse.h/2,pulse=.5+Math.sin(time*5)*.18;ctx.save();ctx.translate(cx,cy);
    ctx.globalAlpha=corpse.hitFlash>0?.65:1;ctx.strokeStyle='#6f7d82';ctx.lineWidth=4;ctx.lineCap='square';
    for(const side of [-1,0,1]){ctx.beginPath();ctx.moveTo(side*10,2);ctx.lineTo(side*16+(side===0?7:0),10);ctx.lineTo(side*22+(side===0?10:0),9);ctx.stroke();}
    ctx.fillStyle='#11191e';ctx.beginPath();ctx.ellipse(0,0,24,10,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a3afb2';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#402326';ctx.fillRect(-12,-3,5,3);ctx.fillRect(-2,-2,4,3);ctx.fillRect(8,-3,3,2);
    ctx.globalAlpha=pulse;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.8;this.line(0,-16,0,-33,'#d6ff3f',2);this.polygon([[-4,-32],[0,-39],[4,-32]],'#d6ff3f');ctx.restore();
  }

  drawEnemyAppendages(enemy) {
    const {ctx}=this,w=enemy.w,h=enemy.h,heavy=enemy.type==='brute'||enemy.type==='boss'||enemy.isVaultBoss||enemy.isDepthBoss||enemy.isMiniBoss;
    ctx.lineCap='square';ctx.lineJoin='miter';ctx.strokeStyle=heavy?'#65747a':'#839296';ctx.lineWidth=heavy?5:3;
    if(enemy.type==='drone'){
      this.line(-w*.34,2,-w*.62,h*.42,'#839296',3);this.line(w*.34,2,w*.62,h*.42,'#839296',3);
      this.polygon([[-w*.62,h*.42],[-w*.47,h*.27],[-w*.52,h*.62]],'#b7c4c6');this.polygon([[w*.62,h*.42],[w*.47,h*.27],[w*.52,h*.62]],'#b7c4c6');
      this.line(-7,h*.2,0,h*.7,'#65747a',4);this.line(7,h*.2,0,h*.7,'#65747a',4);this.polygon([[-2,h*.68],[-10,h*.9],[0,h*.78],[10,h*.9],[2,h*.68]],'#aebcbe');return;
    }
    if(enemy.type==='roller')return;
    const legDrop=enemy.type==='hopper'?h*.82:h*.48;
    for(const side of [-1,1]){
      const hip=side*w*.27,knee=side*w*(heavy?.54:.45),foot=side*w*(heavy?.64:.57);
      ctx.beginPath();ctx.moveTo(hip,h*.15);ctx.lineTo(knee,h*.38);ctx.lineTo(foot,legDrop);ctx.stroke();
      this.polygon([[foot,legDrop],[foot-side*4,legDrop-5],[foot+side*10,legDrop+2]],heavy?'#9aa7aa':'#c1ccce');
    }
    if(enemy.type==='hopper'){
      this.line(-w*.18,h*.12,-w*.18,h*.62,'#c1ccce',4);this.line(w*.18,h*.12,w*.18,h*.62,'#c1ccce',4);
      for(const side of [-1,1])this.polygon([[side*w*.18,h*.6],[side*w*.35,h*.9],[side*w*.05,h*.82]],'#d1dadd');
    }
    if(heavy){
      for(const side of [-1,1]){
        const shoulder=side*w*.42,tip=side*w*.72;
        this.line(shoulder,-h*.2,tip,h*.05,'#718087',5);
        this.polygon([[tip,h*.05],[tip-side*12,-h*.1],[tip-side*4,h*.1]],'#aab6b8');
        this.polygon([[tip,h*.05],[tip-side*9,h*.23],[tip-side*3,h*.07]],'#aab6b8');
      }
    }
  }

  drawEnemy(enemy,time) {
    const {ctx}=this;ctx.save();ctx.translate(enemy.x+enemy.w/2,enemy.y+enemy.h/2);const red='#ff493f';
    this.drawEnemyAppendages(enemy);
    if(enemy.type==='boss'){const warning=enemy.bossMove?.endsWith('Windup'),charging=enemy.bossMove==='bossCharge';ctx.fillStyle=charging?'#4b2729':'#202a31';this.polygon([[-enemy.w/2+12,-enemy.h/2], [enemy.w/2-12,-enemy.h/2],[enemy.w/2,enemy.h/2-16],[enemy.w/2-18,enemy.h/2],[-enemy.w/2+18,enemy.h/2],[-enemy.w/2,enemy.h/2-16]],ctx.fillStyle);ctx.strokeStyle=warning?'#d6ff3f':'#7d8b90';ctx.lineWidth=5;ctx.strokeRect(-enemy.w/2+12,-enemy.h/2+10,enemy.w-24,enemy.h-24);ctx.shadowBlur=warning?24:12;ctx.shadowColor=warning?'#d6ff3f':'#ff493f';ctx.fillStyle=warning?'#d6ff3f':'#ff493f';ctx.beginPath();ctx.arc(0,-6,14,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#11181d';ctx.fillRect(-enemy.w/2-14,enemy.h/2-28,22,18);ctx.fillRect(enemy.w/2-8,enemy.h/2-28,22,18);ctx.restore();return;}
    if(enemy.isVaultBoss){const warning=enemy.bossMove?.endsWith('Windup'),charging=enemy.bossMove==='wardenCharge';ctx.fillStyle=charging?'#244c58':'#142831';this.polygon([[-enemy.w/2,enemy.h/2-10],[-enemy.w/2+12,-enemy.h/2],[0,-enemy.h/2-10],[enemy.w/2-12,-enemy.h/2],[enemy.w/2,enemy.h/2-10],[22,enemy.h/2],[-22,enemy.h/2]],ctx.fillStyle);ctx.strokeStyle=warning?'#ffffff':'#75f5ff';ctx.lineWidth=5;ctx.strokeRect(-enemy.w/2+10,-enemy.h/2+12,enemy.w-20,enemy.h-26);ctx.fillStyle='#071116';ctx.fillRect(-30,-14,60,28);ctx.shadowBlur=warning?28:16;ctx.shadowColor=warning?'#ffffff':'#75f5ff';ctx.fillStyle=warning?'#ffffff':'#75f5ff';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0b171d';ctx.fillRect(-enemy.w/2-10,enemy.h/2-18,24,16);ctx.fillRect(enemy.w/2-14,enemy.h/2-18,24,16);ctx.restore();return;}
    if(enemy.isDepthBoss){const warning=enemy.bossMove?.endsWith('Windup'),dashing=enemy.bossMove==='stalkerDash',dropping=enemy.bossMove==='stalkerDrop';ctx.rotate(dashing?Math.sign(enemy.vx)*.06:0);this.polygon([[-enemy.w/2+8,enemy.h/2-8],[-enemy.w/2,-enemy.h/2+15],[-enemy.w*.2,-enemy.h/2-8],[enemy.w*.28,-enemy.h/2],[enemy.w/2,-enemy.h/2+18],[enemy.w/2-4,enemy.h/2-8],[20,enemy.h/2],[-22,enemy.h/2]],dashing?'#40502c':dropping?'#354132':'#1e2c26');ctx.strokeStyle=warning?'#ffffff':'#d6ff3f';ctx.lineWidth=5;ctx.strokeRect(-enemy.w/2+11,-enemy.h/2+11,enemy.w-22,enemy.h-24);ctx.fillStyle='#08110c';ctx.fillRect(-27,-13,54,26);ctx.shadowBlur=warning?28:16;ctx.shadowColor=warning?'#ffffff':'#d6ff3f';ctx.fillStyle=warning?'#ffffff':'#d6ff3f';for(const eyeX of[-15,0,15]){ctx.beginPath();ctx.arc(eyeX,0,5,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;for(const side of[-1,1]){this.line(side*enemy.w*.35,-enemy.h*.18,side*enemy.w*.62,-enemy.h*.42,'#aeb9b1',5);this.polygon([[side*enemy.w*.62,-enemy.h*.42],[side*enemy.w*.5,-enemy.h*.48],[side*enemy.w*.57,-enemy.h*.27]],'#dce6dd');}ctx.restore();return;}
    if(enemy.isMiniBoss){const warning=enemy.windup>0,charging=enemy.chargeTime>0;this.polygon([[-enemy.w/2+8,enemy.h/2],[-enemy.w/2,-enemy.h/2+14],[-enemy.w/2+18,-enemy.h/2],[enemy.w/2-12,-enemy.h/2],[enemy.w/2,enemy.h/2]],charging?'#294854':'#1c3039');ctx.strokeStyle=warning?'#d6ff3f':'#75f5ff';ctx.lineWidth=4;ctx.strokeRect(-enemy.w/2+9,-enemy.h/2+9,enemy.w-18,enemy.h-18);ctx.fillStyle='#0a1116';ctx.fillRect(-24,-12,48,24);ctx.shadowBlur=warning?22:12;ctx.shadowColor=warning?'#d6ff3f':'#75f5ff';ctx.fillStyle=warning?'#d6ff3f':'#75f5ff';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#101a20';ctx.fillRect(-enemy.w/2-9,enemy.h/2-16,22,14);ctx.fillRect(enemy.w/2-13,enemy.h/2-16,22,14);ctx.restore();return;}
    if(enemy.type==='roller'){ctx.rotate(time*4);for(let i=0;i<12;i++){const angle=i*Math.PI/6,outerX=Math.cos(angle)*enemy.w*.57,outerY=Math.sin(angle)*enemy.h*.48,innerX=Math.cos(angle)*enemy.w*.43,innerY=Math.sin(angle)*enemy.h*.34;this.line(innerX,innerY,outerX,outerY,'#b8c3c5',3);}ctx.fillStyle='#2b373d';ctx.beginPath();ctx.ellipse(0,0,enemy.w/2,enemy.h/2.5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7e8d91';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#11191d';ctx.fillRect(-8,-8,16,16);this.line(-enemy.w*.32,0,enemy.w*.32,0,'#151d21',3);}
    else if(enemy.type==='drone'){this.polygon([[-enemy.w/2,0],[-16,-enemy.h/2],[-3,-enemy.h*.3],[18,-10],[enemy.w/2,8],[0,enemy.h/2]],'#26343b');this.line(-24,-5,24,-5,'#87969b',3);ctx.fillStyle='#10191e';ctx.fillRect(-10,-2,20,9);}
    else if(enemy.type==='brute'){ctx.fillStyle=enemy.chargeTime>0?'#4a2f2d':'#273238';ctx.fillRect(-enemy.w/2,-enemy.h/2,enemy.w,enemy.h);ctx.fillStyle=enemy.windup>0?'#d6ff3f':enemy.chargeTime>0?'#ff493f':'#526166';ctx.fillRect(-enemy.w/2+6,-enemy.h/2+7,enemy.w-12,10);if(enemy.windup>0){ctx.strokeStyle='#d6ff3f';ctx.lineWidth=3;ctx.strokeRect(-enemy.w/2-3,-enemy.h/2-3,enemy.w+6,enemy.h+6);}}
    else if(enemy.type==='hopper'){this.polygon([[-enemy.w/2,enemy.h*.35],[-enemy.w*.34,-enemy.h/2],[enemy.w*.3,-enemy.h/2],[enemy.w/2,enemy.h*.35],[0,enemy.h*.48]],'#202d33');ctx.strokeStyle='#9ba9ac';ctx.lineWidth=3;ctx.strokeRect(-enemy.w*.3,-enemy.h*.3,enemy.w*.6,enemy.h*.38);}
    else{this.polygon([[-enemy.w/2,enemy.h*.35],[-enemy.w*.38,-enemy.h/2],[enemy.w*.36,-enemy.h*.42],[enemy.w/2,enemy.h*.35]],'#26343a');ctx.strokeStyle='#859398';ctx.strokeRect(-enemy.w/2+3,-enemy.h/2+3,enemy.w-6,enemy.h-9);}
    ctx.shadowBlur=enemy.active?14:6;ctx.shadowColor=red;ctx.fillStyle=red;ctx.fillRect(enemy.w*.08,-5,7,5);ctx.shadowBlur=0;ctx.restore();
  }

  drawInventory(game) {
    const {ctx}=this,page=game.inventoryPages[game.inventoryPage],tabs=game.inventoryPages,x=110,y=70,w=1060,h=580;ctx.save();ctx.fillStyle='rgba(2,7,11,.97)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#75f5ff';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#d6ff3f';ctx.fillRect(x,y,w,6);
    const instructions=page==='map'?(game.mapOverview?'BOT SYSTEM ARCHIVE // I TO CLOSE // W A S D SELECT // Q OPEN MAP':'BOT SYSTEM ARCHIVE // I TO CLOSE // Q WORLD OVERVIEW // D STATUS'):page==='items'?'BOT SYSTEM ARCHIVE // I TO CLOSE // A D PAGES // W S ITEMS // O MOVE MOD':'BOT SYSTEM ARCHIVE // I TO CLOSE // A D PAGES // W S ENTRIES';
    ctx.fillStyle='#71838a';ctx.font='700 10px Space Mono';ctx.fillText(instructions,140,105);
    for(let i=0;i<tabs.length;i++){const tx=140+i*210,active=i===game.inventoryPage;ctx.fillStyle=active?'#d6ff3f':'#26343b';ctx.fillRect(tx,124,190,38);ctx.strokeStyle=active?'#ffffff':'#44545a';ctx.strokeRect(tx,124,190,38);ctx.fillStyle=active?'#071015':'#8b9ba0';ctx.font='700 12px Space Mono';ctx.fillText(tabs[i].toUpperCase(),tx+16,148);}
    if(page==='map')this.drawInventoryMap(game,ctx);else{
      const titles={status:'CORE STATUS',materials:'SPECIAL MATERIALS',items:'BODY ITEMS'},rows=page==='status'?[['CORE SHELLS',`${game.player.lives} / ${game.player.maxLives}`],['ELECTRICITY',`${Math.round(game.player.electricity)} / ${game.player.maxElectricity}`],['PRIMARY DAMAGE',String(game.player.primaryDamage)],['SCRAP',String(game.player.scrap)]]:page==='materials'?[['TITANIUM',String(game.player.materials.titanium)],['URANIUM',String(game.player.materials.uranium)]]:game.inventoryItemRows(),visibleCount=6,start=page==='items'?Math.max(0,Math.min(game.inventorySelection-visibleCount+1,rows.length-visibleCount)):0;
      ctx.fillStyle='#ffffff';ctx.font='700 24px Space Mono';ctx.fillText(titles[page],150,215);
      rows.slice(start,start+visibleCount).forEach((row,index)=>{const actualIndex=start+index,ry=250+index*56,selected=actualIndex===game.inventorySelection;ctx.fillStyle=selected?'rgba(117,245,255,.12)':'rgba(255,255,255,.025)';ctx.fillRect(150,ry,980,44);ctx.strokeStyle=selected?'#75f5ff':'#27363c';ctx.strokeRect(150,ry,980,44);ctx.fillStyle=selected?'#ffffff':'#84959a';ctx.font='700 12px Space Mono';ctx.fillText(row[0],172,ry+18);ctx.textAlign='right';ctx.fillStyle=selected?'#d6ff3f':'#a9b6b9';ctx.font='700 10px Space Mono';ctx.fillText(row[1],1105,ry+27);ctx.textAlign='left';});
      if(page==='items'){ctx.fillStyle='#71838a';ctx.font='9px Space Mono';ctx.fillText(`STANDARD BODY // SHELL + CORE + LEGS // ${game.player.body.internalSlots.length} INTERNAL BAYS`,150,610);if(rows.length>visibleCount){ctx.textAlign='right';ctx.fillText(`${game.inventorySelection+1} / ${rows.length}`,1130,610);ctx.textAlign='left';}}
    }
    ctx.restore();
  }

  drawInventoryMap(game,ctx) {
    if(game.mapOverview)this.drawMapOverview(game,ctx);else this.drawLocalMap(game,ctx);
  }

  drawMapOverview(game,ctx) {
    const x=150,y=198,tileW=310,tileH=112,gap=16,selected=game.mapRegionIndex,current=game.regions.findIndex(region=>region.id===game.regionId);
    ctx.fillStyle='#ffffff';ctx.font='700 24px Space Mono';ctx.fillText('WORLD OVERVIEW',x,y);
    ctx.fillStyle='#71838a';ctx.font='10px Space Mono';ctx.fillText('W A S D SELECT REGION // Q ZOOM IN',x,y+25);
    for(let index=0;index<game.regions.length;index++){
      const region=game.regions[index],column=index%3,row=Math.floor(index/3),rx=x+column*(tileW+gap),ry=y+54+row*(tileH+gap),known=game.mappedRegions.has(region.id),active=index===selected;
      ctx.fillStyle=known?'#142b32':'#0c1317';ctx.fillRect(rx,ry,tileW,tileH);
      ctx.strokeStyle=active?'#d6ff3f':known?'#75f5ff':'#344248';ctx.lineWidth=active?4:2;ctx.strokeRect(rx,ry,tileW,tileH);
      ctx.fillStyle=known?'#ffffff':'#58676c';ctx.font='700 13px Space Mono';ctx.fillText(known?region.name:'NO MAP',rx+18,ry+35);
      ctx.fillStyle=known?'#71858c':'#39464a';ctx.font='9px Space Mono';ctx.fillText(`REGION ${String(index+1).padStart(2,'0')}`,rx+18,ry+60);
      if(index===current){ctx.fillStyle='#ff493f';ctx.beginPath();ctx.arc(rx+tileW-23,ry+24,6,0,Math.PI*2);ctx.fill();ctx.textAlign='right';ctx.fillStyle='#a9b6b9';ctx.fillText('CURRENT',rx+tileW-18,ry+58);ctx.textAlign='left';}
      if(active){ctx.fillStyle='#d6ff3f';ctx.font='700 9px Space Mono';ctx.fillText('SELECTED',rx+18,ry+88);}
    }
  }

  drawLocalMap(game,ctx) {
    const region=game.regions[game.mapRegionIndex]??game.regions[0],known=game.mappedRegions.has(region.id),x=150,y=198,w=980,h=390;
    ctx.fillStyle='#ffffff';ctx.font='700 24px Space Mono';ctx.fillText(region.name,x,y);
    ctx.fillStyle='#71838a';ctx.font='10px Space Mono';ctx.fillText('LOCAL MAP // Q WORLD OVERVIEW',x,y+25);
    ctx.fillStyle='#081116';ctx.fillRect(x,y+50,w,h);ctx.strokeStyle=known?'#75f5ff':'#354248';ctx.lineWidth=2;ctx.strokeRect(x,y+50,w,h);
    if(!known){ctx.textAlign='center';ctx.fillStyle='#3d4b50';ctx.font='700 44px Space Mono';ctx.fillText('NO MAP',x+w/2,y+225);ctx.fillStyle='#65757a';ctx.font='10px Space Mono';ctx.fillText('FIND A SURVEY CORE TO RESTORE THIS REGION',x+w/2,y+258);ctx.textAlign='left';return;}
    const pad=24,mapX=x+pad,mapY=y+74,mapW=w-pad*2,mapH=h-48,mapObjects=[...game.platforms.filter(block=>block.kind!=='merchant-room'&&block.x+block.w>region.x&&block.x<region.x+region.w),...game.traps.filter(trap=>trap.x+trap.w>region.x&&trap.x<region.x+region.w),...game.merchants.filter(merchant=>merchant.x+merchant.w>region.x&&merchant.x<region.x+region.w)];if(region.id===game.regionId)mapObjects.push(game.player);const projection=localMapProjection(region,mapObjects,{x:mapX,y:mapY,w:mapW,h:mapH}),scale=projection.scale;
    ctx.save();ctx.beginPath();ctx.rect(mapX,mapY,mapW,mapH);ctx.clip();
    ctx.strokeStyle='#1c343c';ctx.lineWidth=1;ctx.strokeRect(projection.x,projection.y,projection.width,projection.height);
    for(const block of game.platforms){if(block.kind==='merchant-room'||block.x+block.w<=region.x||block.x>=region.x+region.w)continue;const left=Math.max(block.x,region.x),right=Math.min(block.x+block.w,region.x+region.w),rx=projection.x+(left-region.x)*scale,ry=projection.y+(block.y-projection.top)*scale,rw=Math.max(2,(right-left)*scale),rh=Math.max(2,block.h*scale);ctx.fillStyle=block.kind==='wall'?'#69383d':'#26383e';ctx.fillRect(rx,ry,rw,rh);if(block.kind!=='wall'){ctx.fillStyle='#d6ff3f';ctx.fillRect(rx,ry,rw,2);}}
    for(const trap of game.traps){if(trap.x+trap.w<=region.x||trap.x>=region.x+region.w)continue;const left=Math.max(trap.x,region.x),right=Math.min(trap.x+trap.w,region.x+region.w);ctx.fillStyle='#ff493f';ctx.fillRect(projection.x+(left-region.x)*scale,projection.y+(trap.y-projection.top)*scale,Math.max(3,(right-left)*scale),Math.max(3,trap.h*scale));}
    for(const merchant of game.merchants){if(merchant.x+merchant.w<=region.x||merchant.x>=region.x+region.w)continue;const left=Math.max(merchant.x,region.x),right=Math.min(merchant.x+merchant.w,region.x+region.w);ctx.fillStyle=merchant.color??'#75f5ff';ctx.fillRect(projection.x+(left-region.x)*scale,projection.y+(merchant.y-projection.top)*scale,Math.max(4,(right-left)*scale),Math.max(5,merchant.h*scale));}
    if(region.id===game.regionId){const px=projection.x+(game.player.x+game.player.w/2-region.x)*scale,py=projection.y+(game.player.y+game.player.h/2-projection.top)*scale;ctx.fillStyle='#ff493f';ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();}
    ctx.restore();ctx.fillStyle='#84959a';ctx.font='9px Space Mono';ctx.fillText('TRUE SCALE // FOUNDATIONS // ROUTES // HAZARDS // MERCHANT LINKS',x+24,y+h+36);
  }

  drawHud(game) {
    const {ctx}=this;ctx.fillStyle='rgba(7,11,16,.86)';ctx.fillRect(24,22,340,88);ctx.strokeStyle='#2f3b43';ctx.strokeRect(24,22,340,88);ctx.fillStyle='#75848a';ctx.font='9px Space Mono';ctx.fillText('CORE SHELLS',42,43);ctx.fillText('ELECTRICITY',42,72);ctx.fillText('SCRAP',255,43);
    for(let i=0;i<game.player.maxLives;i++){ctx.fillStyle=i<game.player.lives?'#ff493f':'#2d363b';ctx.beginPath();ctx.arc(140+i*13,40,4.5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#263239';ctx.fillRect(140,67,190,7);ctx.fillStyle='#75f5ff';ctx.fillRect(140,67,190*(game.player.electricity/game.player.maxElectricity),7);ctx.fillStyle='#aab8ba';ctx.fillText(`${Math.round(game.player.electricity)} / ${game.player.maxElectricity}`,140,92);ctx.fillStyle='#d6ff3f';ctx.font='700 14px Space Mono';ctx.fillText(String(game.player.scrap).padStart(3,'0'),302,45);
    ctx.textAlign='right';ctx.fillStyle='#708086';ctx.font='9px Space Mono';ctx.fillText(`X ${Math.round(game.player.x).toString().padStart(4,'0')}  Y ${Math.round(game.player.y).toString().padStart(4,'0')}`,1238,42);ctx.fillStyle='#d6ff3f';ctx.fillText('LOCAL GRID // OPEN',1238,60);ctx.fillStyle='#657278';ctx.fillText(`CORE KIT // JUMP + SLASH ${game.player.primaryDamage} + HEAL`,1238,82);ctx.textAlign='left';
    const boss=game.boss();if(game.bossArena.active&&boss&&!boss.dead){const width=480,ratio=Math.max(0,boss.health/boss.maxHealth),x=(VIEW_WIDTH-width)/2,y=25;ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(x-12,y-12,width+24,42);ctx.strokeStyle='#5a2e31';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,width+24,42);ctx.fillStyle='#242c32';ctx.fillRect(x,y,width,12);ctx.fillStyle='#ff493f';ctx.fillRect(x,y,width*ratio,12);ctx.fillStyle='#d4dcde';ctx.font='700 10px Space Mono';ctx.textAlign='center';ctx.fillText('HEAVY CORE',VIEW_WIDTH/2,y+27);ctx.textAlign='left';}
    const vaultBoss=game.vaultBoss();if(game.vaultBossArena.active&&vaultBoss&&!vaultBoss.dead){const width=480,ratio=Math.max(0,vaultBoss.health/vaultBoss.maxHealth),x=(VIEW_WIDTH-width)/2,y=25;ctx.fillStyle='rgba(2,10,14,.94)';ctx.fillRect(x-12,y-12,width+24,42);ctx.strokeStyle='#315d68';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,width+24,42);ctx.fillStyle='#15242b';ctx.fillRect(x,y,width,12);ctx.fillStyle='#75f5ff';ctx.fillRect(x,y,width*ratio,12);ctx.fillStyle='#d8faff';ctx.font='700 10px Space Mono';ctx.textAlign='center';ctx.fillText(game.vaultBossArena.name,VIEW_WIDTH/2,y+27);ctx.textAlign='left';}
    const depthBoss=game.depthBoss();if(game.depthBossArena.active&&depthBoss&&!depthBoss.dead){const width=480,ratio=Math.max(0,depthBoss.health/depthBoss.maxHealth),x=(VIEW_WIDTH-width)/2,y=25;ctx.fillStyle='rgba(6,12,7,.94)';ctx.fillRect(x-12,y-12,width+24,42);ctx.strokeStyle='#60752d';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,width+24,42);ctx.fillStyle='#20281a';ctx.fillRect(x,y,width,12);ctx.fillStyle='#d6ff3f';ctx.fillRect(x,y,width*ratio,12);ctx.fillStyle='#f4ffd2';ctx.font='700 10px Space Mono';ctx.textAlign='center';ctx.fillText(game.depthBossArena.name,VIEW_WIDTH/2,y+27);ctx.textAlign='left';}
    const miniArena=game.miniBossArenas.find(arena=>arena.active&&!arena.cleared),miniBoss=miniArena?game.miniBoss(miniArena.id):null;if(miniBoss&&!miniBoss.dead){const width=360,ratio=Math.max(0,miniBoss.health/miniBoss.maxHealth),x=(VIEW_WIDTH-width)/2,y=26;ctx.fillStyle='rgba(4,10,15,.94)';ctx.fillRect(x-10,y-10,width+20,38);ctx.strokeStyle='#315d68';ctx.strokeRect(x-10,y-10,width+20,38);ctx.fillStyle='#1a2a31';ctx.fillRect(x,y,width,9);ctx.fillStyle='#75f5ff';ctx.fillRect(x,y,width*ratio,9);ctx.fillStyle='#d8faff';ctx.font='700 10px Space Mono';ctx.textAlign='center';ctx.fillText(miniArena.name,VIEW_WIDTH/2,y+24);ctx.textAlign='left';}
    if(game.player.healTime>0){const progress=Math.round((1-game.player.healTime/.7)*100);ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(500,628,280,42);ctx.strokeStyle='#75f5ff';ctx.lineWidth=2;ctx.strokeRect(500,628,280,42);ctx.fillStyle='#75f5ff';ctx.font='700 11px Space Mono';ctx.textAlign='center';ctx.fillText(`REPAIRING // ${progress}%`,640,654);ctx.textAlign='left';}
    else if(game.canRest()){ctx.fillStyle='rgba(7,11,16,.9)';ctx.fillRect(475,632,330,42);ctx.strokeStyle='#d6ff3f';ctx.lineWidth=2;ctx.strokeRect(475,632,330,42);ctx.fillStyle='#d6ff3f';ctx.font='700 12px Space Mono';ctx.textAlign='center';ctx.fillText('O  //  REST AND RECOVER',640,658);ctx.textAlign='left';}
    const door=game.nearbyMerchantDoor();if(door){const unlocked=game.merchantDoorUnlocked(door);ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(430,626,420,48);ctx.strokeStyle=unlocked?door.color:'#ff493f';ctx.lineWidth=2;ctx.strokeRect(430,626,420,48);ctx.fillStyle='#ffffff';ctx.font='700 11px Space Mono';ctx.textAlign='center';ctx.fillText(unlocked?`O  //  ENTER ${door.name}`:'ACCESS SEALED // HOSTILES REMAIN',640,654);ctx.textAlign='left';}
    if(game.nearMerchantExit()){const merchant=game.merchantRoom.activeMerchant;ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(470,632,340,42);ctx.strokeStyle=merchant.color;ctx.strokeRect(470,632,340,42);ctx.fillStyle='#ffffff';ctx.font='700 11px Space Mono';ctx.textAlign='center';ctx.fillText('O  //  RETURN TO OVERWORLD',640,658);ctx.textAlign='left';}
    const merchant=game.nearbyMerchant();if(merchant){ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(390,616,500,66);ctx.strokeStyle=merchant.color;ctx.lineWidth=2;ctx.strokeRect(390,616,500,66);ctx.fillStyle='#ffffff';ctx.font='700 11px Space Mono';ctx.textAlign='center';const offer=game.merchantOffer(merchant);if(offer){ctx.fillText(offer.complete?offer.name:offer.affordable?`O  //  ${offer.name}  //  ${offer.cost} SCRAP`:`${offer.name} // NEED ${offer.cost} SCRAP`,640,640);ctx.fillStyle='#72838a';ctx.font='9px Space Mono';ctx.fillText(offer.detail,640,661);if(merchant.service==='modifierShop'&&!offer.complete){ctx.fillStyle='#8b9ba0';ctx.fillText('BUY HERE // EQUIP FROM ITEMS',640,675);}}else{ctx.fillText(`${merchant.name} // SPECIAL RECIPES PENDING`,640,642);ctx.fillStyle='#72838a';ctx.font='9px Space Mono';ctx.fillText(`Titanium ${game.player.materials.titanium} // Uranium ${game.player.materials.uranium}`,640,663);}ctx.textAlign='left';}
    if(game.regionToastTime>0&&game.regionToast){const alpha=Math.min(1,game.regionToastTime*2,(2.4-game.regionToastTime)*5);ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(24,608,360,58);ctx.strokeStyle='#75f5ff';ctx.lineWidth=2;ctx.strokeRect(24,608,360,58);ctx.fillStyle='#71838a';ctx.font='9px Space Mono';ctx.fillText('REGION LINK // NEW LOCAL GRID',42,630);ctx.fillStyle='#ffffff';ctx.font='700 17px Space Mono';ctx.fillText(game.regionToast,42,654);ctx.restore();}
    if(game.rewardToast?.time>0){const alpha=Math.min(1,game.rewardToast.time*2);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(7,11,16,.94)';ctx.fillRect(480,116,320,64);ctx.strokeStyle='#d6ff3f';ctx.lineWidth=2;ctx.strokeRect(480,116,320,64);ctx.textAlign='center';ctx.fillStyle='#d6ff3f';ctx.font='700 20px Space Mono';ctx.fillText(game.rewardToast.text,640,143);ctx.fillStyle='#9caaae';ctx.font='9px Space Mono';ctx.fillText(game.rewardToast.detail,640,162);ctx.textAlign='left';ctx.restore();}
    if(game.abilityPopup?.time>0){const popup=game.abilityPopup,fade=Math.min(1,popup.time*2,(popup.maxTime-popup.time)*4);ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.fillStyle='rgba(2,7,12,.96)';ctx.fillRect(320,225,640,250);ctx.strokeStyle=popup.color;ctx.lineWidth=3;ctx.strokeRect(320,225,640,250);ctx.fillStyle=popup.color;ctx.fillRect(320,225,640,7);ctx.textAlign='center';ctx.fillStyle='#76888f';ctx.font='700 10px Space Mono';ctx.fillText('ABILITY CORE INTEGRATED',640,264);ctx.fillStyle='#ffffff';ctx.font='700 34px Space Mono';ctx.fillText(popup.name,640,310);ctx.fillStyle='#0b151b';ctx.fillRect(520,334,240,60);ctx.strokeStyle=popup.color;ctx.lineWidth=2;ctx.strokeRect(520,334,240,60);ctx.fillStyle=popup.color;ctx.font='700 25px Space Mono';ctx.fillText(popup.key,640,373);ctx.fillStyle='#afbec2';ctx.font='11px Space Mono';ctx.fillText(popup.description,640,425);if(popup.ability==='electricJab'){ctx.fillStyle='#72848a';ctx.font='9px Space Mono';ctx.fillText('Harvest the conduit ahead, then use F on the powered seal.',640,449);}ctx.textAlign='left';ctx.restore();}
  }
}
