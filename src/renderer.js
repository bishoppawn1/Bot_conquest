import { ATTACK_RANGE, ATTACK_TIMING } from './combat.js';
import { isSurfaceContact, nearestSurfacePoint } from './geometry.js';

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;
export const LEG_COUNT = 3;
export const LEG_REACH = 112;
export const LEG_SPREAD = 44;

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
    ctx.restore();
  }

  line(x1,y1,x2,y2,color='#27333c',width=1) {
    const { ctx }=this;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }

  polygon(points,fill) {
    const { ctx }=this;ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
  }

  drawBackground(game) {
    const {ctx}=this;const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,'#101924');gradient.addColorStop(1,'#070b10');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,720);
    const farY=game.cameraY*.08;ctx.fillStyle='#0c151d';for(let i=0;i<10;i++){const x=((i*270-game.cameraX*.08)%1800)-180,h=180+(i%3)*90;ctx.fillRect(x,560-h-farY,150,h);ctx.fillStyle='#14212a';ctx.fillRect(x+18,585-h-farY,10,h-40);ctx.fillStyle='#0c151d';}
    ctx.strokeStyle='#1b2b34';ctx.lineWidth=5;for(let i=0;i<6;i++){const x=((i*380-game.cameraX*.2)%1900)-200,y=180-game.cameraY*.16;ctx.beginPath();ctx.moveTo(x,y+430);ctx.lineTo(x+120,y);ctx.lineTo(x+240,y+430);ctx.stroke();this.line(x+55,y+220,x+185,y+220,'#1b2b34',4);}
    ctx.fillStyle='#15232c';for(let i=0;i<14;i++){const x=((i*190-game.cameraX*.28)%1600)-100,h=100+(i%4)*50,yShift=game.cameraY*.22;ctx.fillRect(x,470-h-yShift,105,h);ctx.fillStyle='#1b2c35';ctx.fillRect(x+15,490-h-yShift,8,h-25);ctx.fillStyle='#15232c';}
    ctx.globalAlpha=.3;for(let x=-game.cameraX%80;x<1280;x+=80)this.line(x,0,x,720,'#2b3740');for(let y=0;y<720;y+=80)this.line(0,y,1280,y,'#2b3740');ctx.globalAlpha=1;
    ctx.fillStyle='rgba(214,255,63,.025)';ctx.beginPath();ctx.arc(1080,110,240,0,Math.PI*2);ctx.fill();
  }

  drawWorld(game) {
    const {ctx}=this;
    for(const recess of game.recesses)this.drawRecess(recess);
    for(const trap of game.traps){for(let x=trap.x;x<trap.x+trap.w;x+=20)this.polygon([[x,trap.y+20],[x+10,trap.y-5],[x+20,trap.y+20]],'#ff493f');ctx.fillStyle='#45191c';ctx.fillRect(trap.x,trap.y+20,trap.w,trap.h);}
    for(const platform of game.platforms)this.drawPlatform(platform);
    this.drawBossArena(game);
    for(const pile of game.junkPiles)if(!pile.dead)this.drawJunkPile(pile);
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
    if(player.healFlash>0)this.drawHeal(player);
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
    const {ctx}=this,depth=platform.h>=90?18:12,accent=platform.requires?'#ff7b55':'#d6ff3f';ctx.fillStyle=platform.kind==='ceiling'?'#202d35':'#1a262e';ctx.fillRect(platform.x,platform.y,platform.w,platform.h);this.polygon([[platform.x,platform.y],[platform.x+depth,platform.y-depth],[platform.x+platform.w+depth,platform.y-depth],[platform.x+platform.w,platform.y]],platform.requires?'#49352f':'#43565e');this.polygon([[platform.x+platform.w,platform.y],[platform.x+platform.w+depth,platform.y-depth],[platform.x+platform.w+depth,platform.y+platform.h-depth],[platform.x+platform.w,platform.y+platform.h]],'#090f14');ctx.fillStyle=accent;ctx.fillRect(platform.x,platform.y,platform.w,3);if(platform.h>=60)for(let x=platform.x+24;x<platform.x+platform.w-24;x+=92){const panelY=platform.y+25;ctx.fillStyle='#10191e';ctx.fillRect(x,panelY,56,Math.min(18,platform.h-34));ctx.strokeStyle='#31434b';ctx.lineWidth=2;ctx.strokeRect(x+3,panelY+3,50,Math.min(12,platform.h-40));}if(platform.h>=140){ctx.fillStyle='#111a20';ctx.fillRect(platform.x+18,platform.y+platform.h-32,platform.w-36,12);ctx.fillStyle='#2c3b42';ctx.fillRect(platform.x+22,platform.y+platform.h-29,platform.w-44,3);}
  }

  drawBossArena(game) {
    const {ctx}=this;
    for(const gate of game.bossGates()){ctx.save();ctx.fillStyle='#283038';ctx.fillRect(gate.x,gate.y,gate.w,gate.h);ctx.fillStyle='#ff493f';ctx.fillRect(gate.x,gate.y,4,gate.h);ctx.fillRect(gate.x+gate.w-4,gate.y,4,gate.h);for(let y=gate.y+16;y<gate.y+gate.h;y+=28){ctx.fillStyle='#11181d';ctx.fillRect(gate.x+7,y,gate.w-14,10);ctx.fillStyle='#6d3535';ctx.fillRect(gate.x+9,y+2,gate.w-18,2);}ctx.restore();}
    for(const bolt of game.bossProjectiles){ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#ff765f';ctx.fillStyle='#ff493f';ctx.beginPath();ctx.arc(bolt.x+bolt.w/2,bolt.y+bolt.h/2,bolt.w/2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffd06a';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    if(game.bossShockwave){const wave=game.bossShockwave;ctx.save();ctx.strokeStyle='#ff765f';ctx.shadowBlur=18;ctx.shadowColor='#ff493f';ctx.lineWidth=7;ctx.globalAlpha=Math.min(1,wave.time/.25);ctx.beginPath();ctx.ellipse(wave.x,wave.y,wave.radius,18,0,Math.PI,Math.PI*2);ctx.stroke();ctx.restore();}
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

  drawConduit(conduit,time) {
    const {ctx}=this,cx=conduit.x+conduit.w/2,ratio=conduit.charge/conduit.maxCharge,empty=conduit.charge<=0;ctx.save();ctx.fillStyle=empty?'#171d20':'#172830';ctx.fillRect(conduit.x,conduit.y,conduit.w,conduit.h);ctx.strokeStyle=empty?'#343d40':'#526a70';ctx.lineWidth=2;ctx.strokeRect(conduit.x,conduit.y,conduit.w,conduit.h);ctx.fillStyle='#263b43';ctx.fillRect(conduit.x-5,conduit.y+conduit.h-8,conduit.w+10,8);
    const glow=empty?'#566064':conduit.hitFlash>0?'#ffffff':'#75f5ff';ctx.shadowBlur=empty?0:conduit.hitFlash>0?25:10;ctx.shadowColor=glow;ctx.strokeStyle=glow;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,conduit.y+8);ctx.lineTo(cx-5,conduit.y+21);ctx.lineTo(cx+4,conduit.y+21);ctx.lineTo(cx-2,conduit.y+36);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#0a1013';ctx.fillRect(conduit.x+4,conduit.y+conduit.h-14,conduit.w-8,4);ctx.fillStyle=empty?'#3c4649':'#75f5ff';ctx.fillRect(conduit.x+4,conduit.y+conduit.h-14,(conduit.w-8)*ratio,4);ctx.restore();
  }

  drawJunkPile(pile) {
    const {ctx}=this,damage=1-pile.health/pile.maxHealth;ctx.save();ctx.translate(pile.x,pile.y);ctx.fillStyle='#3a3029';ctx.beginPath();ctx.moveTo(0,pile.h);ctx.lineTo(6,pile.h*.52);ctx.lineTo(pile.w*.25,pile.h*.25);ctx.lineTo(pile.w*.48,pile.h*.38);ctx.lineTo(pile.w*.68,3);ctx.lineTo(pile.w*.84,pile.h*.3);ctx.lineTo(pile.w,pile.h*.58);ctx.lineTo(pile.w,pile.h);ctx.closePath();ctx.fill();ctx.strokeStyle='#87705b';ctx.lineWidth=3;ctx.stroke();
    for(let i=0;i<7;i++){const x=7+(i*19)%Math.max(20,pile.w-15),y=10+(i*13)%Math.max(18,pile.h-14);ctx.save();ctx.translate(x,y);ctx.rotate((i*.83)%2);ctx.fillStyle=i%3===0?'#a8753d':i%3===1?'#59676a':'#6f4f43';ctx.fillRect(-7,-3,14,6);ctx.restore();}
    if(pile.minimumDamage>1){ctx.strokeStyle='#75f5ff';ctx.lineWidth=3;ctx.strokeRect(3,3,pile.w-6,pile.h-6);ctx.fillStyle='#75f5ff';ctx.font='700 9px Space Mono';ctx.fillText('VOLT',pile.w/2-13,pile.h/2+3);}if(damage>0){ctx.strokeStyle='#d6ff3f';ctx.globalAlpha=.35+damage*.5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pile.w*.52,4);ctx.lineTo(pile.w*.45,pile.h*.42);ctx.lineTo(pile.w*.58,pile.h*.7);ctx.stroke();}ctx.restore();
  }

  drawEnemy(enemy,time) {
    const {ctx}=this;ctx.save();ctx.translate(enemy.x+enemy.w/2,enemy.y+enemy.h/2);const red='#ff493f';
    if(enemy.type==='boss'){const warning=enemy.bossMove?.endsWith('Windup'),charging=enemy.bossMove==='bossCharge';ctx.fillStyle=charging?'#4b2729':'#202a31';this.polygon([[-enemy.w/2+12,-enemy.h/2], [enemy.w/2-12,-enemy.h/2],[enemy.w/2,enemy.h/2-16],[enemy.w/2-18,enemy.h/2],[-enemy.w/2+18,enemy.h/2],[-enemy.w/2,enemy.h/2-16]],ctx.fillStyle);ctx.strokeStyle=warning?'#d6ff3f':'#7d8b90';ctx.lineWidth=5;ctx.strokeRect(-enemy.w/2+12,-enemy.h/2+10,enemy.w-24,enemy.h-24);ctx.shadowBlur=warning?24:12;ctx.shadowColor=warning?'#d6ff3f':'#ff493f';ctx.fillStyle=warning?'#d6ff3f':'#ff493f';ctx.beginPath();ctx.arc(0,-6,14,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#11181d';ctx.fillRect(-enemy.w/2-14,enemy.h/2-28,22,18);ctx.fillRect(enemy.w/2-8,enemy.h/2-28,22,18);ctx.restore();return;}
    if(enemy.type==='roller'){ctx.rotate(time*4);ctx.fillStyle='#2b373d';ctx.beginPath();ctx.ellipse(0,0,enemy.w/2,enemy.h/2.5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7e8d91';ctx.lineWidth=4;ctx.stroke();this.line(-enemy.w*.32,0,enemy.w*.32,0,'#151d21',3);}
    else if(enemy.type==='drone'){this.polygon([[-enemy.w/2,0],[-10,-enemy.h/2],[18,-10],[enemy.w/2,8],[0,enemy.h/2]],'#26343b');this.line(-24,-5,24,-5,'#87969b',3);}
    else if(enemy.type==='brute'){ctx.fillStyle=enemy.chargeTime>0?'#4a2f2d':'#273238';ctx.fillRect(-enemy.w/2,-enemy.h/2,enemy.w,enemy.h);ctx.fillStyle=enemy.windup>0?'#d6ff3f':enemy.chargeTime>0?'#ff493f':'#526166';ctx.fillRect(-enemy.w/2+6,-enemy.h/2+7,enemy.w-12,10);if(enemy.windup>0){ctx.strokeStyle='#d6ff3f';ctx.lineWidth=3;ctx.strokeRect(-enemy.w/2-3,-enemy.h/2-3,enemy.w+6,enemy.h+6);}}
    else{this.polygon([[-enemy.w/2,enemy.h/2],[-enemy.w/2+4,-enemy.h/2],[enemy.w/2-5,-enemy.h/2+5],[enemy.w/2,enemy.h/2]],'#26343a');ctx.strokeStyle='#859398';ctx.strokeRect(-enemy.w/2+3,-enemy.h/2+3,enemy.w-6,enemy.h-6);}
    ctx.shadowBlur=enemy.active?14:6;ctx.shadowColor=red;ctx.fillStyle=red;ctx.fillRect(enemy.w*.08,-5,7,5);ctx.shadowBlur=0;ctx.restore();
  }

  drawHud(game) {
    const {ctx}=this;ctx.fillStyle='rgba(7,11,16,.86)';ctx.fillRect(24,22,340,88);ctx.strokeStyle='#2f3b43';ctx.strokeRect(24,22,340,88);ctx.fillStyle='#75848a';ctx.font='9px Space Mono';ctx.fillText('CORE SHELLS',42,43);ctx.fillText('ELECTRICITY',42,72);ctx.fillText('SCRAP',255,43);
    for(let i=0;i<3;i++){ctx.fillStyle=i<game.player.lives?'#ff493f':'#2d363b';ctx.beginPath();ctx.arc(140+i*22,40,6,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#263239';ctx.fillRect(140,67,190,7);ctx.fillStyle='#75f5ff';ctx.fillRect(140,67,190*(game.player.electricity/100),7);ctx.fillStyle='#aab8ba';ctx.fillText(`${Math.round(game.player.electricity)} / 100`,140,92);ctx.fillStyle='#d6ff3f';ctx.font='700 14px Space Mono';ctx.fillText(String(game.player.scrap).padStart(3,'0'),302,45);
    ctx.textAlign='right';ctx.fillStyle='#708086';ctx.font='9px Space Mono';ctx.fillText(`X ${Math.round(game.player.x).toString().padStart(4,'0')}  Y ${Math.round(game.player.y).toString().padStart(4,'0')}`,1238,42);ctx.fillStyle='#d6ff3f';ctx.fillText('LOCAL GRID // OPEN',1238,60);ctx.fillStyle='#657278';ctx.fillText('CORE KIT // JUMP + SLASH + HEAL',1238,82);ctx.textAlign='left';
    const boss=game.boss();if(game.bossArena.active&&boss&&!boss.dead){const width=480,ratio=Math.max(0,boss.health/boss.maxHealth),x=(VIEW_WIDTH-width)/2,y=25;ctx.fillStyle='rgba(7,11,16,.92)';ctx.fillRect(x-12,y-12,width+24,42);ctx.strokeStyle='#5a2e31';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,width+24,42);ctx.fillStyle='#242c32';ctx.fillRect(x,y,width,12);ctx.fillStyle='#ff493f';ctx.fillRect(x,y,width*ratio,12);ctx.fillStyle='#d4dcde';ctx.font='700 10px Space Mono';ctx.textAlign='center';ctx.fillText('HEAVY CORE',VIEW_WIDTH/2,y+27);ctx.textAlign='left';}
  }
}
