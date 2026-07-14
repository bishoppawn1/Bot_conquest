import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { supportingPlatform } from '../src/geometry.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};
const openDepth=game=>{
  game.vaultBossArena.cleared=true;game.unlockAbility('wallClimb');game.unlockAbility('electricJab');game.pickups.find(item=>item.id==='volt-core').collected=true;
  Object.assign(game.player,{x:2890,y:1120-game.player.h,vx:0,vy:0,onGround:true});
  assert.equal(game.syncDepthAccess(),true);return game;
};

test('the deep Vault hatch opens only with both rewards while the player is safely west',()=>{
  const game=new Game();assert.ok(game.platforms.some(block=>block.id==='under-cache'));assert.equal(game.depthAccessOpen,false);
  game.vaultBossArena.cleared=true;game.unlockAbility('wallClimb');Object.assign(game.player,{x:2890,y:1120-game.player.h,onGround:true});assert.equal(game.syncDepthAccess(),false,'Volt Jab must be collected first');
  game.unlockAbility('electricJab');assert.equal(game.syncDepthAccess(),false,'owning the ability cannot stand in for collecting its core');game.pickups.find(item=>item.id==='volt-core').collected=true;
  Object.assign(game.player,{x:3100,y:1120-game.player.h,onGround:true});assert.equal(game.syncDepthAccess(),false,'the hatch cannot open beneath a player in its center');
  Object.assign(game.player,{x:7000,y:564,onGround:true});assert.equal(game.syncDepthAccess(),false,'the hatch cannot open remotely');
  Object.assign(game.player,{x:2890,y:1120-game.player.h,onGround:true});assert.equal(game.syncDepthAccess(),true);
  assert.equal(game.platforms.some(block=>block.id==='under-cache'),false);assert.equal(game.platforms.some(block=>block.id==='vault-high'),false);assert.ok(game.platforms.some(block=>block.id==='vault-depth-access'));assert.equal(game.depthAccessOpen,true);const junk=game.junkPiles.find(pile=>pile.id==='vault-hatch-junk'),gallery=game.platforms.find(block=>block.id==='vault-deep-gallery-west');assert.equal(junk.y+junk.h,gallery.y);assert.ok(gallery.x+gallery.w-(junk.x+junk.w)>=50);
});

test('the opened deep hatch has enough headroom to climb and enter the lower world',()=>{
  const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];openDepth(game);const target=game.platforms.find(block=>block.id==='vault-deep-drop-one'),west=game.platforms.find(block=>block.id==='vault-depth-floor-west'),wall=game.platforms.find(block=>block.id==='vault-depth-access'),east=game.platforms.find(block=>block.id==='vault-depth-floor-east');
  assert.ok(east.x-(wall.x+wall.w)>=200,'the opened hatch should be several bot widths wide');Object.assign(game.player,{x:west.x+west.w-game.player.w,y:west.y-game.player.h,vx:0,vy:0,onGround:true,jumps:1});game.setInput({right:true,jump:true});let phase=0,reached=false;
  for(let frame=0;frame<360;frame++){if(phase===0&&game.player.y<960){game.setInput({jump:false,right:true});phase=1;}if(phase===1&&game.player.x>3080){game.setInput({right:false,left:true});phase=2;}if(phase===2&&game.player.vx<0){game.setInput({left:false});phase=3;}game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===target){reached=true;break;}}
  assert.equal(reached,true);
});

test('dropping into the deep arena activates the Rift Stalker behind a sealed exit',()=>{
  const game=openDepth(new Game()),arena=game.depthBossArena,boss=game.depthBoss(),gate=game.depthBossGates()[0];assert.equal(arena.active,false);assert.ok(gate);assert.equal(gate.y+gate.h,arena.floorY);
  Object.assign(game.player,{x:arena.x+250,y:arena.floorY-game.player.h,vx:0,vy:0});game.updateDepthBossArena();assert.equal(arena.active,true);assert.equal(boss.active,true);assert.equal(game.enemyTargetable(boss),true);
});

test('the Rift Stalker cycles through dash, overhead drop, and tracking bolt moves',()=>{
  const game=new Game(),boss=game.depthBoss();game.depthBossArena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=0;game.player.x=3220;game.player.y=game.depthBossArena.floorY-game.player.h;const moves=new Set();let sawShockwave=false,sawTracker=false;
  for(let frame=0;frame<900;frame++){game.updateDepthBoss(boss,1/60);moves.add(boss.bossMove);sawShockwave||=Boolean(game.bossShockwave);sawTracker||=game.bossProjectiles.some(bolt=>bolt.owner==='depth'&&bolt.trackingTime>=0);}
  assert.ok(moves.has('stalkerDash'));assert.ok(moves.has('stalkerDropHover'));assert.ok(moves.has('stalkerDrop'));assert.equal(sawShockwave,true);assert.equal(sawTracker,true);
});

test('the Rift Stalker visibly hovers for half a second before its downward smash',()=>{
  const game=new Game(),boss=game.depthBoss();game.depthBossArena.active=true;boss.active=true;boss.bossMove='stalkerDropWindup';boss.bossTimer=0;game.player.x=3140;game.updateDepthBoss(boss,1/60);
  assert.equal(boss.bossMove,'stalkerDropHover');const hoverY=boss.y;assert.equal(hoverY,game.depthBossArena.y-boss.h);assert.ok(game.depthBossArena.floorY-(hoverY+boss.h)>=200);for(let frame=0;frame<28;frame++){game.updateDepthBoss(boss,1/60);assert.equal(boss.bossMove,'stalkerDropHover');assert.equal(boss.y,hoverY);assert.equal(boss.vy,0);}
  for(let frame=0;frame<3&&boss.bossMove==='stalkerDropHover';frame++)game.updateDepthBoss(boss,1/60);assert.equal(boss.bossMove,'stalkerDrop');assert.ok(boss.vy>0);
});

test('the fast tracking bolt disappears without exploding on impact',()=>{
  const game=new Game();game.spawnDepthTracker(game.depthBoss());assert.equal(game.bossProjectiles[0].explosive,undefined);game.platforms=[{id:'test-wall',x:200,y:0,w:40,h:300}];game.player.x=500;game.player.y=100;game.bossProjectiles=[{x:175,y:100,w:16,h:16,vx:520,vy:0,speed:520,trackingTime:0,life:2,dead:false,owner:'depth',color:'#d6ff3f'}];
  game.updateBossHazards(1/20);assert.equal(game.bossProjectiles.length,0);assert.equal(game.bossExplosions.length,0);
  const contact=new Game();contact.platforms=[];Object.assign(contact.player,{x:100,y:100,lives:3,invuln:0});contact.bossProjectiles=[{x:100,y:100,w:16,h:16,vx:0,vy:0,speed:520,trackingTime:0,life:2,dead:false,owner:'depth',color:'#d6ff3f'}];contact.updateBossHazards(1/60);assert.equal(contact.player.lives,2);assert.equal(contact.bossProjectiles.length,0);assert.equal(contact.bossExplosions.length,0);
});

test('defeating the Rift Stalker releases Dash and builds its return route',()=>{
  const game=new Game(),boss=game.depthBoss(),pickup=game.pickups.find(item=>item.id==='dash-core');game.depthBossArena.active=true;boss.health=1;assert.equal(game.pickupAvailable(pickup),false);game.hitTarget(boss,1,new Set(),0);
  assert.equal(game.depthBossArena.cleared,true);assert.equal(game.depthBossGates().length,0);assert.equal(game.pickupAvailable(pickup),true);assert.equal(game.depthReturnOpen,true);assert.ok(game.platforms.filter(block=>block.id?.startsWith('depth-return-')).length>=6);
  Object.assign(game.player,{x:pickup.x,y:pickup.y});game.updatePickups();assert.equal(game.player.abilities.dash,true);
});

test('the deep return gaps require the newly unlocked Dash',()=>{
  const traverse=(sourceId,targetId,dash,dashFrame=25)=>{const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];openDepth(game);game.depthBossArena.cleared=true;game.releaseDepthReturn();if(dash)game.unlockAbility('dash');const source=game.platforms.find(block=>block.id===sourceId),target=game.platforms.find(block=>block.id===targetId),direction=Math.sign(target.x-source.x),move=direction>0?'right':'left';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w:source.x,y:source.y-game.player.h,onGround:true,jumps:1,facing:direction});game.setInput({[move]:true,jump:true,dash:dash&&dashFrame===0});game.update(1/60);game.setInput({jump:false,dash:false});for(let frame=1;frame<150;frame++){if(dash&&frame===dashFrame)game.setInput({dash:true});if(dash&&frame===dashFrame+1)game.setInput({dash:false});game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===target)return true;}return false;};
  for(const [source,target,dashFrame] of [['depth-return-one','depth-return-two',25],['depth-return-two','depth-return-three',25],['depth-return-three','depth-return-four',0],['depth-return-four','depth-return-five',0]]){assert.equal(traverse(source,target,false),false);assert.equal(traverse(source,target,true,dashFrame),true);}
});

test('the completed return route climbs from the boss floor back onto the Warden floor',()=>{
  const setup=()=>{const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];openDepth(game);game.depthBossArena.cleared=true;game.releaseDepthReturn();game.unlockAbility('dash');return game;};
  const game=setup(),bossFloor=game.platforms.find(block=>block.id==='depth-boss-floor'),first=game.platforms.find(block=>block.id==='depth-return-one');Object.assign(game.player,{x:2700,y:bossFloor.y-game.player.h,onGround:true,jumps:1});game.setInput({left:true,jump:true});let reachedFirst=false;for(let frame=0;frame<120;frame++){if(frame===1)game.setInput({jump:false});game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===first){reachedFirst=true;break;}}assert.equal(reachedFirst,true,'the first return platform cannot be reached from the boss floor');
  const climb=(sourceId,targetId)=>{const climbGame=setup(),source=climbGame.platforms.find(block=>block.id===sourceId),target=climbGame.platforms.find(block=>block.id===targetId);Object.assign(climbGame.player,{x:source.x+source.w-climbGame.player.w,y:source.y-climbGame.player.h,onGround:true,jumps:1,vx:0,vy:0});climbGame.setInput({right:true,jump:true});let phase=0;for(let frame=0;frame<360;frame++){if(phase===0&&climbGame.player.onWall===1&&climbGame.player.y<=target.y-climbGame.player.h){climbGame.setInput({right:false,jump:false,left:true});phase=1;}if(phase===1&&climbGame.player.vx<0){climbGame.setInput({left:false});phase=2;}climbGame.update(1/60);if(supportingPlatform(climbGame.player,climbGame.platforms,3)===target)return true;}return false;};
  const jump=(sourceId,targetId)=>{const jumpGame=setup(),source=jumpGame.platforms.find(block=>block.id===sourceId),target=jumpGame.platforms.find(block=>block.id===targetId);Object.assign(jumpGame.player,{x:source.x+source.w-jumpGame.player.w,y:source.y-jumpGame.player.h,onGround:true,jumps:1});jumpGame.setInput({right:true,jump:true});for(let frame=0;frame<150;frame++){if(frame===1)jumpGame.setInput({jump:false});jumpGame.update(1/60);if(supportingPlatform(jumpGame.player,jumpGame.platforms,3)===target)return true;}return false;};
  assert.equal(climb('depth-return-five','depth-return-hatch'),true,'the long return wall cannot be crested');assert.equal(jump('depth-return-hatch','depth-return-threshold'),true,'the upper return landing cannot be reached');assert.equal(climb('depth-return-threshold','under-threshold'),true,'the return route stops below the Warden floor');
});

test('structural containment prevents side-drop shortcuts through the deep Vault',()=>{
  const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];openDepth(game);const roof=game.platforms.find(block=>block.id==='vault-depth-roof-west'),westWall=game.platforms.find(block=>block.id==='vault-depth-west-containment'),eastWall=game.platforms.find(block=>block.id==='vault-depth-east-containment');assert.deepEqual([roof.x,roof.x+roof.w,roof.y+roof.h],[2360,2800,1200]);assert.equal(westWall.y,1200);assert.equal(westWall.y+westWall.h,game.depthBossArena.floorY);assert.equal(eastWall.y,1200);assert.equal(eastWall.y+eastWall.h,game.platforms.find(block=>block.id==='vault-deep-drop-three').y);
  for(const [sourceId,direction] of [['vault-deep-drop-one',-1],['vault-deep-drop-one',1],['vault-deep-drop-two',-1]]){const source=game.platforms.find(block=>block.id===sourceId),move=direction>0?'right':'left';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w:source.x,y:source.y-game.player.h,vx:0,vy:0,onGround:true,jumps:1});game.setInput({[move]:true});for(let frame=0;frame<90;frame++)game.update(1/60);assert.equal(supportingPlatform(game.player,game.platforms,3),source,`${sourceId} still allows a side-drop shortcut`);}
});

test('the deep route physically requires Wall Climb and zig-zags through both galleries',()=>{
  const setup=(wallClimb=true)=>{const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];openDepth(game);if(!wallClimb)game.player.abilities.wallClimb=false;return game;};
  const climb=(sourceId,targetId,direction,wallClimb=true)=>{const game=setup(wallClimb),source=game.platforms.find(block=>block.id===sourceId),target=game.platforms.find(block=>block.id===targetId),move=direction>0?'right':'left';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w:source.x,y:source.y-game.player.h,onGround:true,jumps:1,vx:0,vy:0});game.setInput({[move]:true,jump:true});for(let frame=0;frame<300;frame++){game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===target)return true;}return false;};
  const controlledDrop=(sourceId,targetId,direction)=>{const game=setup(),source=game.platforms.find(block=>block.id===sourceId),target=game.platforms.find(block=>block.id===targetId),move=direction>0?'right':'left',brake=direction>0?'left':'right';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w:source.x,y:source.y-game.player.h,onGround:true,jumps:1,vx:0,vy:0});game.setInput({[move]:true});let phase=0;for(let frame=0;frame<300;frame++){game.update(1/60);if(phase===0&&!game.player.onGround){game.setInput({[move]:false,[brake]:true});phase=1;}if(phase===1&&Math.abs(game.player.vx)<35){game.setInput({[brake]:false});phase=2;}if(supportingPlatform(game.player,game.platforms,3)===target)return true;}return false;};
  for(const [source,target,direction] of [['vault-deep-drop-one','vault-deep-gallery-west',-1],['vault-deep-drop-two','vault-deep-gallery-east',1]]){assert.equal(climb(source,target,direction,false),false,`${source} should not bypass its climb wall with the basic jump`);assert.equal(climb(source,target,direction,true),true,`${source} cannot climb to ${target}`);}
  for(const [source,target,direction] of [['vault-deep-gallery-west','vault-deep-drop-two',-1],['vault-deep-gallery-east','vault-deep-drop-three',1],['vault-deep-drop-three','depth-boss-floor',-1]])assert.equal(controlledDrop(source,target,direction),true,`${source} does not land on ${target}`);
});
