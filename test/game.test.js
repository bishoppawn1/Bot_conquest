import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { FOUNDATION_BLOCKS, PLATFORMS } from '../src/level.js';
import { supportingPlatform } from '../src/geometry.js';

const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.update(1/60);};
const press=(g,key)=>{g.setInput({[key]:true});tick(g);g.setInput({[key]:false});tick(g);};
const canTraverse=(sourceId,targetId,{jump=true,clearMini=false}={})=>{
  const source=PLATFORMS.find(block=>block.id===sourceId),target=PLATFORMS.find(block=>block.id===targetId);
  const direction=Math.sign((target.x+target.w/2)-(source.x+source.w/2))||1,move=direction>0?'right':'left';
  for(const inset of[5,15,30,50,70,90,110,130,150]){
    const g=new Game();g.enemies=[];g.junkPiles=[];g.traps=[];if(clearMini){for(const arena of g.miniBossArenas)arena.cleared=true;g.vaultBossArena.cleared=true;}
    const player=g.player;player.x=direction>0?source.x+source.w-player.w-inset:source.x+inset;
    player.y=source.y-player.h;player.vx=direction*250;player.vy=0;player.onGround=true;player.jumps=1;
    g.setInput({[move]:true,jump});g.update(1/60);g.setInput({jump:false});
    const destination=g.platforms.find(block=>block.id===targetId);
    for(let frame=0;frame<180;frame++){g.update(1/60);if(supportingPlatform(player,g.platforms,3)===destination)return true;}
  }
  return false;
};
const canControlledDrop=(sourceId,targetId)=>{
  const g=new Game();g.enemies=[];g.junkPiles=[];g.traps=[];
  g.vaultBossArena.cleared=true;for(const arena of g.miniBossArenas)arena.cleared=true;
  const source=g.platforms.find(block=>block.id===sourceId),target=g.platforms.find(block=>block.id===targetId),player=g.player;
  const direction=Math.sign((target.x+target.w/2)-(source.x+source.w/2))||1,move=direction>0?'right':'left',brake=direction>0?'left':'right';let braking=false;
  Object.assign(player,{x:direction>0?source.x+source.w-player.w-4:source.x+4,y:source.y-player.h,vx:0,vy:0,onGround:true,jumps:1});g.setInput({[move]:true});
  for(let frame=0;frame<180;frame++){g.update(1/60);if(!braking&&(direction>0?player.x>=source.x+source.w+2:player.x+player.w<=source.x-2)){g.setInput({[move]:false,[brake]:true});braking=true;}if(supportingPlatform(player,g.platforms,3)===target)return true;}
  return false;
};
const canStagedJump=(sourceId,targetId)=>{
  for(const delay of[0,6,10,14,18]){
    const g=new Game();g.enemies=[];g.junkPiles=[];g.traps=[];for(const arena of g.miniBossArenas)arena.cleared=true;g.vaultBossArena.cleared=true;
    const source=g.platforms.find(block=>block.id===sourceId),target=g.platforms.find(block=>block.id===targetId),player=g.player;
    const direction=Math.sign((target.x+target.w/2)-(source.x+source.w/2))||1,move=direction>0?'right':'left';
    Object.assign(player,{x:direction>0?source.x:source.x+source.w-player.w,y:source.y-player.h,vx:0,vy:0,onGround:true,jumps:1});
    g.setInput({jump:true});g.update(1/60);g.setInput({jump:false});for(let frame=0;frame<delay;frame++)g.update(1/60);g.setInput({[move]:true});
    for(let frame=0;frame<180;frame++){g.update(1/60);if(supportingPlatform(player,g.platforms,3)===target)return true;}
  }
  return false;
};

test('player starts with three lives at the training spawn',()=>{const g=new Game();assert.equal(g.player.lives,3);assert.equal(g.player.x,180);});
test('player body is wider than it is tall',()=>{const g=new Game();assert.ok(g.player.w>g.player.h);});
test('A and D movement changes horizontal velocity and facing',()=>{const g=new Game();tick(g,30);g.setInput({right:true});tick(g,15);assert.ok(g.player.vx>0);assert.equal(g.player.facing,1);g.setInput({right:false,left:true});tick(g,30);assert.ok(g.player.vx<0);assert.equal(g.player.facing,-1);});
test('player starts with one basic jump and no double jump',()=>{const g=new Game();tick(g,60);press(g,'jump');assert.equal(g.player.jumps,0);const vy=g.player.vy;press(g,'jump');assert.ok(g.player.vy>vy,'locked double jump must not reset upward velocity');});
test('walking off a platform consumes the grounded jump',()=>{const g=new Game();g.platforms=[{id:'test-floor',x:0,y:300,w:200,h:100}];g.enemies=[];g.traps=[];Object.assign(g.player,{x:145,y:264,vx:0,vy:0,onGround:true,jumps:1});g.setInput({right:true});tick(g,20);g.setInput({right:false});assert.equal(g.player.onGround,false);assert.equal(g.player.jumps,0);const fallingVelocity=g.player.vy;press(g,'jump');assert.ok(g.player.vy>fallingVelocity,'a basic jump cannot begin after leaving the platform');});
test('walking off a platform preserves only the unlocked double jump',()=>{const g=new Game();g.platforms=[{id:'test-floor',x:0,y:300,w:200,h:100}];g.enemies=[];g.traps=[];g.unlockAbility('doubleJump');Object.assign(g.player,{x:145,y:264,vx:0,vy:0,onGround:true,jumps:2});g.setInput({right:true});tick(g,20);g.setInput({right:false});assert.equal(g.player.onGround,false);assert.equal(g.player.jumps,1);press(g,'jump');assert.ok(g.player.vy<0);assert.equal(g.player.jumps,0);});
test('the starting jump physically connects the scattered exploration platforms',()=>{
  const reversibleLinks=[
    ['west-step','start-loft'],['start-loft','west-bridge'],
    ['assembly-step','assembly-entry'],['assembly-entry','assembly-perch'],['assembly-perch','assembly-cross'],
    ['vault-span','vault-high'],
    ['foundry-step','foundry-platform'],['foundry-platform','foundry-mid'],['foundry-mid','foundry-east'],['foundry-west','foundry-high'],
    ['prearena-step','prearena-low'],['prearena-low','prearena-wide'],['prearena-wide','prearena-high'],
    ['relay-step','relay-entry'],['relay-entry','relay-east'],['relay-east','relay-center'],['relay-center','relay-west'],
    ['gauntlet-west-perch','gauntlet-center'],['gauntlet-east-perch','gauntlet-overlook'],
    ['drift-rise','drift-cache-floor'],
    ['exchange-west-loft','exchange-mid-link'],['exchange-mid-link','exchange-central-span'],['exchange-central-span','exchange-east-loft']
  ];
  for(const [first,second] of reversibleLinks){
    assert.ok(canTraverse(first,second),`${first} cannot reach ${second}`);
    assert.ok(canTraverse(second,first),`${second} cannot return to ${first}`);
  }
  assert.ok(canControlledDrop('vault-entry','vault-ledge'));
  assert.ok(canTraverse('vault-ledge','vault-shelf'));
  assert.ok(canTraverse('vault-shelf','vault-ledge',{jump:false}));
  assert.ok(canControlledDrop('vault-ledge','vault-span'));
  assert.ok(canTraverse('vault-span','vault-ledge'));
  assert.ok(canTraverse('foundry-mid','foundry-west'));
  assert.ok(canTraverse('foundry-west','foundry-step'));
  assert.ok(canTraverse('vault-high','under-cache',{jump:false}),'the Vault boss entrance does not drop safely into its room');
  assert.ok(canTraverse('under-cache','under-threshold',{clearMini:true}),'the cleared Vault boss room has no exit');
  assert.ok(canControlledDrop('drift-threshold','drift-east'),'the optional Drift reward path has no safe drop');
  assert.ok(canControlledDrop('drift-east','drift-floor'),'the optional Drift reward path cannot return to the main floor');
  assert.ok(canStagedJump('under-threshold','under-exit-low'),'the exit ascent cannot reach its first platform');
  assert.ok(canControlledDrop('under-exit-low','under-threshold'),'the first exit platform has no safe return drop');
  assert.ok(canStagedJump('under-exit-low','under-exit-mid'),'the exit ascent cannot reach its middle platform');
  assert.ok(canControlledDrop('under-exit-mid','under-exit-low'),'the middle exit platform has no safe return drop');
  assert.ok(canStagedJump('under-exit-mid','under-exit-high'),'the exit ascent cannot reach its upper platform');
  assert.ok(canControlledDrop('under-exit-high','under-exit-mid'),'the upper exit platform has no safe return drop');
  assert.ok(canStagedJump('under-exit-high','vault-exit'),'the mini-boss escape cannot rejoin the main route');
});
test('every main-floor gap is physically jumpable in both directions',()=>{
  for(let index=0;index<FOUNDATION_BLOCKS.length-1;index++)for(const direction of[1,-1]){
    const source=direction>0?FOUNDATION_BLOCKS[index]:FOUNDATION_BLOCKS[index+1],target=direction>0?FOUNDATION_BLOCKS[index+1]:FOUNDATION_BLOCKS[index];
    assert.ok(canTraverse(source.id,target.id),`foundation transition ${index} failed moving ${direction>0?'right':'left'}`);
  }
});
test('the starting kit cannot enter later-ability regions',()=>{
  assert.equal(canTraverse('assembly-cross','double-entry'),false);
  assert.equal(canTraverse('foundry-high','dash-entry'),false);
  assert.equal(canTraverse('relay-west','wall-entry'),false);
});
test('double jump works after its ability is unlocked',()=>{const g=new Game();tick(g,60);g.unlockAbility('doubleJump');press(g,'jump');assert.equal(g.player.jumps,1);press(g,'jump');assert.equal(g.player.jumps,0);});
test('dash accelerates after its ability is unlocked',()=>{const g=new Game();tick(g,60);g.unlockAbility('dash');g.player.facing=-1;press(g,'dash');assert.ok(g.player.vx< -500);assert.ok(g.player.dashCooldown>0);});
test('repair starts unlocked while traversal and special attacks stay locked',()=>{const g=new Game();assert.deepEqual(g.player.abilities,{doubleJump:false,dash:false,wallClimb:false,heal:true,field:false,electricJab:false});});
test('space starts a slash in the direction the player aims',()=>{const g=new Game();tick(g,60);g.player.aimX=-1;g.player.aimY=0;press(g,'attack');assert.equal(g.player.attackId,1);assert.ok(g.player.attackTime>0);assert.ok(g.attackBox().x<g.player.x);});
test('slash destroys a basic enemy in front of the player',()=>{const g=new Game();tick(g,60);const e=g.enemies[0];g.enemies=[e];e.x=g.player.x+g.player.w+8;e.y=g.player.y;press(g,'attack');assert.equal(e.dead,true);});
test('slash does not damage an enemy behind the player',()=>{const g=new Game();tick(g,60);const e=g.enemies[0];g.enemies=[e];e.x=g.player.x-35;e.y=g.player.y;g.player.aimX=1;g.player.aimY=0;press(g,'attack');assert.equal(e.dead,false);assert.equal(e.health,3);});
test('enemy collision costs one life and grants invulnerability',()=>{const g=new Game();tick(g,60);const e=g.enemies[0];e.x=g.player.x;e.y=g.player.y;tick(g);assert.equal(g.player.lives,2);assert.ok(g.player.invuln>0);tick(g,5);assert.equal(g.player.lives,2);});
test('touching spikes costs one life and returns to the last safe platform',()=>{const g=new Game();g.enemies=[];tick(g,30);g.player.x=1700;g.player.y=584;g.player.vx=0;g.player.vy=0;tick(g);assert.deepEqual(g.safePosition,{x:1700,y:584});g.player.x=2280;g.player.y=710;g.player.vx=0;g.player.vy=0;tick(g);assert.equal(g.player.lives,2);assert.equal(g.player.x,1700);assert.equal(g.player.y,584);assert.ok(g.player.invuln>0);});
test('losing the final shell respawns at the saved point and leaves recoverable scrap',()=>{const g=new Game();g.enemies=[];g.respawnPoint={x:7600,y:624};Object.assign(g.player,{x:8200,y:624,lives:1,scrap:87,electricity:64});g.damagePlayer('enemy',8300);assert.equal(g.running,true);assert.equal(g.player.lives,3);assert.equal(g.player.x,7600);assert.equal(g.player.y,624);assert.equal(g.player.scrap,0);assert.equal(g.player.electricity,0);assert.equal(g.recoveryCorpse.scrapValue,87);assert.equal(g.recoveryCorpse.x,8200);});
test('destroying the old shell returns its stored scrap without electricity',()=>{const g=new Game();g.enemies=[];Object.assign(g.player,{x:500,y:624,lives:1,scrap:72,electricity:50});g.damagePlayer('enemy',600);const corpse=g.recoveryCorpse;Object.assign(g.player,{x:corpse.x-60,y:corpse.y,aimX:1,aimY:0,attackHits:new Set()});for(let hit=0;hit<3;hit++){g.player.attackHits=new Set();g.resolvePrimaryAttack();}assert.equal(corpse.dead,true);assert.equal(g.player.scrap,72);assert.equal(g.player.electricity,0);});
test('a newer death replaces unrecovered wreckage and its stored scrap',()=>{const g=new Game();g.enemies=[];Object.assign(g.player,{x:500,y:624,lives:1,scrap:72});g.damagePlayer('enemy',600);const first=g.recoveryCorpse;Object.assign(g.player,{x:900,y:624,lives:1,scrap:18,invuln:0});g.damagePlayer('enemy',1000);assert.notEqual(g.recoveryCorpse,first);assert.equal(g.recoveryCorpse.x,900);assert.equal(g.recoveryCorpse.scrapValue,18);});
test('holding W climbs a wall without teleporting to its top',()=>{const g=new Game();g.unlockAbility('wallClimb');g.player.x=380;g.player.y=610;g.player.vx=300;tick(g);assert.equal(g.player.onWall,1);const startY=g.player.y;g.setInput({jump:true});tick(g,12);g.setInput({jump:false});tick(g);assert.ok(g.player.y<startY);assert.ok(g.player.y>500,'climbing should move continuously rather than teleporting to the top');});
test('grounded wall contact does not suppress the starting jump before wall climb is unlocked',()=>{const g=new Game();Object.assign(g.player,{x:380,y:624,vx:300,onGround:true,jumps:1});tick(g);assert.equal(g.player.onWall,1);assert.equal(g.player.onGround,true);press(g,'jump');assert.ok(g.player.vy<0);});
test('pressing away jumps from either side of a wall at the current height',()=>{const right=new Game();right.unlockAbility('wallClimb');right.player.x=380;right.player.y=610;right.player.vx=300;tick(right);press(right,'left');assert.ok(right.player.vx<0);assert.ok(right.player.vy<0);
  const left=new Game();left.platforms=[{x:300,y:450,w:80,h:250}];left.enemies=[];left.junkPiles=[];left.unlockAbility('wallClimb');Object.assign(left.player,{x:380,y:520,vx:-200,vy:0});tick(left);assert.equal(left.player.onWall,-1);press(left,'right');assert.ok(left.player.vx>0);assert.ok(left.player.vy<0);
});
test('vertical camera follows the player into the upper world',()=>{const g=new Game();g.player.y=-1500;tick(g);assert.ok(g.cameraY<0);assert.ok(g.cameraY>=-1800);});
test('enemy roster has varied movement archetypes and sizes',()=>{const g=new Game();assert.ok(new Set(g.enemies.map(e=>e.type)).size>=5);assert.ok(new Set(g.enemies.map(e=>`${e.w}x${e.h}`)).size>=5);});
test('non-patrolling enemy remains idle until the nearby player shares its platform',()=>{const g=new Game();const e=g.enemy({type:'crawler',x:1120,y:620,w:30,h:40});g.enemies=[e];const startX=e.x;tick(g,90);assert.equal(e.active,false);assert.equal(e.x,startX);g.player.x=1080;g.player.y=624;tick(g);assert.equal(e.active,true);assert.ok(e.x<startX);});
test('ground enemy does not detect or camp for a player across a spike gap',()=>{const g=new Game();const e=g.enemy({type:'roller',x:3560,y:575,w:34,h:35,patrol:true,patrolRange:70,patrolDirection:1});g.enemies=[e];tick(g,60);g.player.x=3370;g.player.y=644;tick(g,120);assert.equal(e.active,false);assert.ok(e.x>=3550,'enemy should remain on its own foundation instead of camping the gap');});
test('selected ground enemies passively patrol within a leash',()=>{const g=new Game();const e=g.enemies.find(enemy=>enemy.patrol);g.enemies=[e];tick(g,60);const startX=e.x;tick(g,60);assert.equal(e.active,false);assert.notEqual(e.x,startX);assert.ok(Math.abs(e.x-e.originX)<=e.patrolRange+2);});
test('enemy detection ranges are shorter and ground-specific',()=>{const g=new Game();const ground=g.enemies.filter(e=>e.type!=='drone');const drones=g.enemies.filter(e=>e.type==='drone');assert.ok(ground.every(e=>e.aggroRadius<=240));assert.ok(drones.every(e=>e.aggroRadius===340));});
test('active drone follows the player vertically and horizontally',()=>{const g=new Game(),drone=g.enemy({type:'drone',x:100,y:100,w:42,h:30});g.platforms=[];g.enemies=[drone];g.player.x=250;g.player.y=200;const startX=drone.x,startY=drone.y;for(let i=0;i<30;i++)g.updateEnemies(1/60);assert.equal(drone.active,true);assert.ok(drone.x>startX);assert.ok(drone.y>startY);});
test('flying enemies cannot pass horizontally or vertically through solid blocks',()=>{const horizontal=new Game(),wall={x:200,y:0,w:100,h:300},sideDrone=horizontal.enemy({type:'drone',x:100,y:100,w:42,h:30});horizontal.platforms=[wall];horizontal.enemies=[sideDrone];horizontal.player.x=320;horizontal.player.y=100;for(let i=0;i<300;i++)horizontal.updateEnemies(1/60);assert.ok(sideDrone.x+sideDrone.w<=wall.x);
  const vertical=new Game(),floor={x:0,y:200,w:400,h:100},downDrone=vertical.enemy({type:'drone',x:100,y:100,w:42,h:30});vertical.platforms=[floor];vertical.enemies=[downDrone];vertical.player.x=100;vertical.player.y=300;for(let i=0;i<300;i++)vertical.updateEnemies(1/60);assert.ok(downDrone.y+downDrone.h<=floor.y);
});
test('oblong rollers build momentum instead of copying crawler movement',()=>{const floor={x:0,y:200,w:600,h:100};const rollerGame=new Game(),roller=rollerGame.enemy({type:'roller',x:100,y:172,w:46,h:28});rollerGame.platforms=[floor];rollerGame.enemies=[roller];rollerGame.player.x=280;rollerGame.player.y=164;rollerGame.updateEnemies(1/60);
  const crawlerGame=new Game(),crawler=crawlerGame.enemy({type:'crawler',x:100,y:160,w:30,h:40});crawlerGame.platforms=[floor];crawlerGame.enemies=[crawler];crawlerGame.player.x=280;crawlerGame.player.y=164;crawlerGame.updateEnemies(1/60);assert.ok(roller.vx>0);assert.ok(roller.vx<crawler.vx/2);
});
test('square brutes telegraph and then commit to a fast charge',()=>{const g=new Game(),floor={x:0,y:200,w:700,h:100},brute=g.enemy({type:'brute',x:100,y:137,w:58,h:63});g.platforms=[floor];g.enemies=[brute];g.player.x=300;g.player.y=164;g.updateEnemies(1/60);assert.ok(brute.windup>0);assert.equal(brute.vx,0);const startX=brute.x;for(let i=0;i<30;i++)g.updateEnemies(1/60);assert.ok(brute.chargeTime>0);assert.ok(brute.vx>=190);assert.ok(brute.x>startX);});

test('hoppers make a high committed leap toward the player',()=>{const g=new Game(),floor={x:0,y:300,w:800,h:100},hopper=g.enemy({type:'hopper',x:100,y:255,w:34,h:45});g.platforms=[floor];g.enemies=[hopper];g.player.x=280;g.player.y=264;g.updateEnemies(1/60);assert.ok(hopper.vy<-500);assert.ok(hopper.vx>=200);const startY=hopper.y;for(let i=0;i<20;i++)g.updateEnemies(1/60);assert.ok(hopper.y<startY-100);});
test('hoppers pause on the ground after landing before another leap',()=>{const g=new Game(),floor={x:0,y:300,w:1000,h:100},hopper=g.enemy({type:'hopper',x:100,y:255,w:34,h:45});g.platforms=[floor];g.enemies=[hopper];g.player.x=280;g.player.y=264;g.updateEnemies(1/60);let landed=false;for(let frame=0;frame<180;frame++){const airborne=!hopper.onGround;g.updateEnemies(1/60);if(airborne&&hopper.onGround){landed=true;break;}}assert.equal(landed,true);assert.ok(hopper.jumpCooldown>=.65);const landedY=hopper.y;for(let frame=0;frame<24;frame++)g.updateEnemies(1/60);assert.equal(hopper.y,landedY);assert.equal(hopper.onGround,true);});
