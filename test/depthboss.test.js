import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { supportingPlatform } from '../src/geometry.js';

const tick=(game,count=1)=>{for(let frame=0;frame<count;frame++)game.update(1/60);};

test('the deep Vault hatch opens only after Wall Climb and the Warden clear',()=>{
  const game=new Game();assert.ok(game.platforms.some(block=>block.id==='under-cache'));assert.equal(game.depthAccessOpen,false);
  game.unlockAbility('wallClimb');assert.equal(game.syncDepthAccess(),false);game.vaultBossArena.cleared=true;assert.equal(game.syncDepthAccess(),true);
  assert.equal(game.platforms.some(block=>block.id==='under-cache'),false);assert.equal(game.platforms.some(block=>block.id==='vault-high'),false);assert.ok(game.platforms.some(block=>block.id==='vault-depth-access'));assert.equal(game.depthAccessOpen,true);
});

test('the opened deep hatch has enough headroom to climb and enter the lower world',()=>{
  const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];game.vaultBossArena.cleared=true;game.unlockAbility('wallClimb');game.syncDepthAccess();const target=game.platforms.find(block=>block.id==='vault-deep-drop-one');
  Object.assign(game.player,{x:3020,y:1084,vx:0,vy:0,onGround:true,jumps:1});game.setInput({jump:true});let phase=0,reached=false;
  for(let frame=0;frame<220;frame++){if(phase===0&&game.player.y<970){game.setInput({jump:false,right:true});phase=1;}if(phase===1&&game.player.x>3120){game.setInput({right:false,left:true});phase=2;}game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===target){reached=true;break;}}
  assert.equal(reached,true);
});

test('dropping into the deep arena activates the Rift Stalker behind a sealed exit',()=>{
  const game=new Game(),arena=game.depthBossArena,boss=game.depthBoss(),gate=game.depthBossGates()[0];assert.equal(arena.active,false);assert.ok(gate);assert.equal(gate.y+gate.h,arena.floorY);
  Object.assign(game.player,{x:arena.x+250,y:arena.floorY-game.player.h,vx:0,vy:0});game.updateDepthBossArena();assert.equal(arena.active,true);assert.equal(boss.active,true);assert.equal(game.enemyTargetable(boss),true);
});

test('the Rift Stalker cycles through dash, overhead drop, and tracking bolt moves',()=>{
  const game=new Game(),boss=game.depthBoss();game.depthBossArena.active=true;boss.active=true;boss.bossMove='idle';boss.bossTimer=0;game.player.x=3220;game.player.y=game.depthBossArena.floorY-game.player.h;const moves=new Set();let sawShockwave=false,sawTracker=false;
  for(let frame=0;frame<900;frame++){game.updateDepthBoss(boss,1/60);moves.add(boss.bossMove);sawShockwave||=Boolean(game.bossShockwave);sawTracker||=game.bossProjectiles.some(bolt=>bolt.owner==='depth'&&bolt.trackingTime>=0);}
  assert.ok(moves.has('stalkerDash'));assert.ok(moves.has('stalkerDrop'));assert.equal(sawShockwave,true);assert.equal(sawTracker,true);
});

test('the fast tracking bolt explodes when it reaches solid geometry',()=>{
  const game=new Game();game.platforms=[{id:'test-wall',x:200,y:0,w:40,h:300}];game.player.x=500;game.player.y=100;game.bossProjectiles=[{x:175,y:100,w:16,h:16,vx:520,vy:0,speed:520,trackingTime:0,life:2,dead:false,owner:'depth',explosive:true,color:'#d6ff3f'}];
  game.updateBossHazards(1/20);assert.equal(game.bossProjectiles.length,0);assert.equal(game.bossExplosions.length,1);assert.ok(game.bossExplosions[0].maxRadius>=80);
});

test('defeating the Rift Stalker releases Dash and builds its return route',()=>{
  const game=new Game(),boss=game.depthBoss(),pickup=game.pickups.find(item=>item.id==='dash-core');game.depthBossArena.active=true;boss.health=1;assert.equal(game.pickupAvailable(pickup),false);game.hitTarget(boss,1,new Set(),0);
  assert.equal(game.depthBossArena.cleared,true);assert.equal(game.depthBossGates().length,0);assert.equal(game.pickupAvailable(pickup),true);assert.equal(game.depthReturnOpen,true);assert.ok(game.platforms.filter(block=>block.id?.startsWith('depth-return-')).length>=6);
  Object.assign(game.player,{x:pickup.x,y:pickup.y});game.updatePickups();assert.equal(game.player.abilities.dash,true);
});

test('the deep return contains two gaps that require the newly unlocked Dash',()=>{
  const traverse=(sourceId,targetId,dash)=>{const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];game.vaultBossArena.cleared=true;game.unlockAbility('wallClimb');game.syncDepthAccess();game.depthBossArena.cleared=true;game.releaseDepthReturn();if(dash)game.unlockAbility('dash');const source=game.platforms.find(block=>block.id===sourceId),target=game.platforms.find(block=>block.id===targetId),direction=Math.sign(target.x-source.x),move=direction>0?'right':'left';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w:source.x,y:source.y-game.player.h,onGround:true,jumps:1,facing:direction});game.setInput({[move]:true,jump:true});game.update(1/60);game.setInput({jump:false});for(let frame=1;frame<150;frame++){if(dash&&frame===25)game.setInput({dash:true});if(dash&&frame===26)game.setInput({dash:false});game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===target)return true;}return false;};
  for(const [source,target] of [['depth-return-one','depth-return-two'],['depth-return-two','depth-return-three']]){assert.equal(traverse(source,target,false),false);assert.equal(traverse(source,target,true),true);}
});

test('the opened hatch leads through every irreversible landing to the arena',()=>{
  const controlledDrop=(sourceId,targetId)=>{const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];game.vaultBossArena.cleared=true;game.unlockAbility('wallClimb');game.syncDepthAccess();const source=game.platforms.find(block=>block.id===sourceId),target=game.platforms.find(block=>block.id===targetId),direction=Math.sign((target.x+target.w/2)-(source.x+source.w/2))||1,move=direction>0?'right':'left',brake=direction>0?'left':'right';Object.assign(game.player,{x:direction>0?source.x+source.w-game.player.w-3:source.x+3,y:source.y-game.player.h,onGround:true,jumps:1});game.setInput({[move]:true});let braking=false;for(let frame=0;frame<180;frame++){game.update(1/60);if(!braking&&(direction>0?game.player.x>=target.x+10:game.player.x+game.player.w<=target.x+target.w-10)){game.setInput({[move]:false,[brake]:true});braking=true;}if(supportingPlatform(game.player,game.platforms,3)===target)return true;}return false;};
  for(const [source,target] of [['vault-depth-floor-east','vault-deep-drop-one'],['vault-deep-drop-one','vault-deep-drop-two'],['vault-deep-drop-two','vault-deep-drop-three'],['vault-deep-drop-three','depth-boss-floor']])assert.equal(controlledDrop(source,target),true,`${source} does not land on ${target}`);
});
