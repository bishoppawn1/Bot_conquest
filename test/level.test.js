import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABILITY_GATED_BLOCKS, BOSS_ARENA, BRANCH_BLOCKS, CONDUITS,
  ENEMY_SPAWNS, FOUNDATION_BLOCKS, INTERIOR_BLOCKS, JUNK_PILES,
  LOWER_BLOCKS, MERCHANT_SPAWNS, OVERHEAD_BLOCKS, PICKUP_SPAWNS,
  PLATFORMS, POCKET_BLOCKS, RECESSES, REGION_GATES, REGIONS,
  REST_AREA, TRAPS, WALL_BLOCKS, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH
} from '../src/level.js';

const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const horizontalGap=(a,b)=>Math.max(0,b.x-(a.x+a.w),a.x-(b.x+b.w));

test('the map occupies a genuine two-dimensional playfield',()=>{
  assert.equal(WORLD_WIDTH,9600);
  assert.equal(WORLD_TOP,-1000);
  assert.equal(WORLD_HEIGHT,2200);
  assert.ok(PLATFORMS.some(block=>block.x+block.w===WORLD_WIDTH));
  assert.ok(LOWER_BLOCKS.some(block=>block.y>=1080),'the map needs playable space below the main floor');
  assert.ok(ABILITY_GATED_BLOCKS.some(block=>block.y<=-650),'the map needs substantial upper space');
  assert.ok(ENEMY_SPAWNS.some(enemy=>enemy.y>800)&&ENEMY_SPAWNS.some(enemy=>enemy.y<0),'combat must exist above and below the main route');
});

test('suspended platforms vary in width and thickness',()=>{
  const suspended=[...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS];
  assert.ok(FOUNDATION_BLOCKS.every(block=>block.h>=120));
  assert.ok(suspended.every(block=>block.h>=40&&block.h<=60));
  assert.ok(new Set(suspended.map(block=>block.w)).size>=15);
  assert.ok(new Set(suspended.map(block=>block.h)).size>=5);
  assert.ok(suspended.filter(block=>block.h<=45).length>=15,'many platforms should leave more open space beneath them');
  assert.ok([...FOUNDATION_BLOCKS,...OVERHEAD_BLOCKS].filter(block=>block.w>=800&&block.h>=70).length>=14,'the thin platforms still need massive structural framing');
});

test('the main floor stays reversible while two vault openings lead downward',()=>{
  for(let index=1;index<FOUNDATION_BLOCKS.length;index++){
    const previous=FOUNDATION_BLOCKS[index-1],next=FOUNDATION_BLOCKS[index];
    assert.ok(previous.y-next.y<=70,`foundation ${index} rises too high`);
    assert.ok(next.x-(previous.x+previous.w)<=160,`foundation gap ${index} is too wide`);
  }
  const safeOpenings=[{x:2640,w:160},{x:3100,w:160}];
  for(const opening of safeOpenings){
    assert.ok(TRAPS.every(trap=>!intersects({...opening,y:680,h:520},trap)),`safe opening at ${opening.x} contains spikes`);
    assert.ok(LOWER_BLOCKS.some(block=>block.x>=opening.x&&block.x+block.w<=opening.x+opening.w),`safe opening at ${opening.x} has no lower landing`);
  }
  assert.deepEqual(TRAPS.map(trap=>[trap.x,trap.w]),[[1200,90],[2270,90],[3460,90],[4850,100],[5790,100],[7190,160],[8330,70]]);
});

test('recesses are unlabeled rooms framed by ceilings and mostly solid floors',()=>{
  assert.ok(RECESSES.length>=10);
  assert.ok(RECESSES.every(recess=>!('label' in recess)));
  for(const recess of RECESSES.slice(0,8)){
    assert.ok(OVERHEAD_BLOCKS.some(block=>block.y+block.h===recess.ceilingY&&block.x<=recess.x&&block.x+block.w>=recess.x+recess.w),`recess at ${recess.x} is missing its ceiling`);
    const intervals=FOUNDATION_BLOCKS.filter(block=>block.y===recess.floorY&&block.x<recess.x+recess.w&&block.x+block.w>recess.x)
      .map(block=>[Math.max(recess.x,block.x),Math.min(recess.x+recess.w,block.x+block.w)]).sort((a,b)=>a[0]-b[0]);
    let covered=0,cursor=-Infinity;
    for(const [start,end] of intervals){if(end<=cursor)continue;covered+=end-Math.max(start,cursor);cursor=end;}
    assert.ok(covered>=recess.w*.65,`recess at ${recess.x} lacks enough foundation framing`);
  }
});

test('small end alcoves and structural walls remain physically framed',()=>{
  const pockets=RECESSES.filter(recess=>recess.pocket);
  assert.equal(pockets.length,2);
  assert.equal(POCKET_BLOCKS.length,2);
  assert.equal(WALL_BLOCKS.filter(block=>block.x<100||block.x>9500).length,2);
  for(const pocket of pockets){
    assert.ok(FOUNDATION_BLOCKS.some(block=>block.y===pocket.floorY&&block.x<=pocket.x&&block.x+block.w>=pocket.x+pocket.w));
    assert.ok(POCKET_BLOCKS.some(block=>block.y+block.h===pocket.ceilingY&&block.x<=pocket.x&&block.x+block.w>=pocket.x+pocket.w));
  }
});

test('three substantial regions require later movement abilities',()=>{
  assert.equal(ABILITY_GATED_BLOCKS.length,12);
  assert.deepEqual(new Set(ABILITY_GATED_BLOCKS.map(block=>block.requires)),new Set(['doubleJump','dash','wallClimb']));
  assert.equal(new Set(ABILITY_GATED_BLOCKS.map(block=>block.region)).size,3);
  assert.equal(ABILITY_GATED_BLOCKS.filter(block=>block.gateEntry).length,3);
  assert.ok(ABILITY_GATED_BLOCKS.reduce((sum,block)=>sum+block.w,0)>BRANCH_BLOCKS.reduce((sum,block)=>sum+block.w,0)*.5);
  const byId=id=>PLATFORMS.find(block=>block.id===id);
  assert.ok(byId('assembly-cross').y-byId('double-entry').y>164,'double-jump entrance is reachable with the basic jump');
  assert.ok(horizontalGap(byId('foundry-high'),byId('dash-entry'))>300,'dash entrance is reachable with an ordinary leap');
  assert.ok(byId('relay-west').y-byId('wall-entry').y>200&&WALL_BLOCKS.some(wall=>wall.x+wall.w<=byId('wall-entry').x),'wall region lacks a real movement gate');
});

test('named regions are contiguous and connected by visible gates',()=>{
  assert.equal(REGIONS[0].x,0);assert.equal(REGIONS.at(-1).x+REGIONS.at(-1).w,WORLD_WIDTH);
  for(let index=1;index<REGIONS.length;index++)assert.equal(REGIONS[index-1].x+REGIONS[index-1].w,REGIONS[index].x);
  assert.equal(REGION_GATES.length,REGIONS.length-1);
  for(let index=0;index<REGION_GATES.length;index++){
    assert.equal(REGION_GATES[index].from,REGIONS[index].id);
    assert.equal(REGION_GATES[index].to,REGIONS[index+1].id);
  }
});

test('the concourse is the merchant hub while scattered merchants remain',()=>{
  const hub=REGIONS.find(region=>region.merchantHub);
  const hubMerchants=MERCHANT_SPAWNS.filter(merchant=>merchant.region===hub.id&&merchant.hub);
  assert.ok(hubMerchants.length>MERCHANT_SPAWNS.length/2);
  assert.ok(MERCHANT_SPAWNS.filter(merchant=>!merchant.hub).length>=2);
  assert.ok(new Set(MERCHANT_SPAWNS.map(merchant=>merchant.region)).size>=3);
});

test('the post-boss pickup uses the generic pickup format',()=>{
  assert.equal(PICKUP_SPAWNS.length,1);
  const pickup=PICKUP_SPAWNS[0];
  assert.equal(pickup.kind,'ability');assert.equal(pickup.ability,'vault');assert.equal(pickup.requiresBossClear,true);
  assert.ok(pickup.x>7190&&pickup.x<REST_AREA.x+REST_AREA.w);
  assert.ok(PLATFORMS.every(block=>!intersects(pickup,block)));
});

test('the boss arena remains a large uncluttered chamber',()=>{
  assert.ok(BOSS_ARENA.w>=1200&&BOSS_ARENA.h>=240);
  assert.ok(INTERIOR_BLOCKS.every(block=>!intersects(block,BOSS_ARENA)));
  for(const object of [...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES]){
    const center=object.x+object.w/2;
    assert.ok(center<BOSS_ARENA.x||center>BOSS_ARENA.x+BOSS_ARENA.w,`ordinary object at ${object.x} clutters the boss arena`);
  }
  assert.equal(BOSS_ARENA.boss.y+BOSS_ARENA.boss.h,BOSS_ARENA.floorY);
});

test('starting-kit platforms form varied room networks with combat',()=>{
  assert.equal(BRANCH_BLOCKS.length,20);
  assert.ok(new Set(BRANCH_BLOCKS.map(block=>block.zone)).size>=6);
  assert.ok(BRANCH_BLOCKS.every(block=>!('step' in block)&&!('branch' in block)&&!block.requires));
  assert.ok(new Set(BRANCH_BLOCKS.map(block=>block.w)).size>=12);
  const combatSurfaces=[...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS];
  const supportedEnemies=ENEMY_SPAWNS.filter(enemy=>enemy.type!=='drone'&&combatSurfaces.some(block=>enemy.x>=block.x&&enemy.x+enemy.w<=block.x+block.w&&enemy.y+enemy.h===block.y));
  assert.ok(supportedEnemies.length>=12,'upper and lower exploration spaces need their own encounters');
});

test('the undercroft is a safe lower loop with separate entrance and exit',()=>{
  assert.equal(LOWER_BLOCKS.length,4);
  assert.ok(LOWER_BLOCKS.every(block=>block.y>=820));
  assert.deepEqual(new Set(LOWER_BLOCKS.map(block=>block.w)),new Set([160,260,300]));
  assert.equal(LOWER_BLOCKS.find(block=>block.id==='under-entry').x,2640);
  assert.equal(LOWER_BLOCKS.find(block=>block.id==='under-exit').x,3100);
});

test('walkable surfaces leave enough headroom for the bot',()=>{
  const botWidth=50,botHeight=36;
  for(const surface of [...FOUNDATION_BLOCKS,...INTERIOR_BLOCKS,...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS]){
    const blockers=PLATFORMS.filter(block=>block!==surface&&block.y<surface.y&&block.y+block.h>surface.y-botHeight)
      .map(block=>[Math.max(surface.x,block.x),Math.min(surface.x+surface.w,block.x+block.w)])
      .filter(([start,end])=>end>start).sort((a,b)=>a[0]-b[0]);
    let cursor=surface.x,best=0;
    for(const [start,end] of blockers){best=Math.max(best,start-cursor);cursor=Math.max(cursor,end);}
    best=Math.max(best,surface.x+surface.w-cursor);
    assert.ok(best>=botWidth+30,`${surface.kind} at ${surface.x},${surface.y} has no usable standing area`);
  }
});

test('ordinary junk never seals the platform supporting it',()=>{
  for(const pile of JUNK_PILES.filter(pile=>!pile.gate)){
    const support=PLATFORMS.find(block=>pile.x>=block.x&&pile.x+pile.w<=block.x+block.w&&pile.y+pile.h===block.y);
    assert.ok(support,`junk at ${pile.x},${pile.y} has no supporting platform`);
    const left=pile.x-support.x,right=support.x+support.w-(pile.x+pile.w);
    assert.ok(Math.max(left,right)>=50,`junk at ${pile.x},${pile.y} blocks both sides`);
  }
});

test('true walls use dedicated vertical geometry',()=>{
  assert.equal(WALL_BLOCKS.length,5);
  assert.ok(WALL_BLOCKS.every(wall=>wall.kind==='wall'&&wall.h>=140&&wall.h>wall.w*2));
});

test('full-height bulkheads seal both approaches to the boss arena roof',()=>{
  const left=WALL_BLOCKS.find(wall=>wall.id==='boss-roof-left'),right=WALL_BLOCKS.find(wall=>wall.id==='boss-roof-right');
  assert.ok(left&&right);
  assert.equal(left.x+left.w,BOSS_ARENA.x);assert.equal(right.x,BOSS_ARENA.x+BOSS_ARENA.w);
  for(const guard of [left,right]){assert.equal(guard.y,WORLD_TOP);assert.equal(guard.y+guard.h,BOSS_ARENA.y);}
});

test('the post-boss rest area remains uncluttered',()=>{
  const centerInside=object=>object.x+object.w/2>REST_AREA.x&&object.x+object.w/2<REST_AREA.x+REST_AREA.w;
  assert.equal(REST_AREA.station.y+REST_AREA.station.h,REST_AREA.floorY);
  assert.ok([...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES].every(object=>!centerInside(object)));
});

test('solid blocks never intersect or bury another platform',()=>{
  for(let first=0;first<PLATFORMS.length;first++)for(let second=first+1;second<PLATFORMS.length;second++)assert.equal(intersects(PLATFORMS[first],PLATFORMS[second]),false,`blocks ${first} and ${second} overlap`);
});

test('interior obstacles preserve reversible recovery floor',()=>{
  for(const foundation of FOUNDATION_BLOCKS){
    const blocks=INTERIOR_BLOCKS.filter(block=>block.x>=foundation.x&&block.x+block.w<=foundation.x+foundation.w&&block.y+block.h===foundation.y).sort((a,b)=>a.x-b.x);
    if(!blocks.length)continue;
    assert.ok(blocks[0].x-foundation.x>=80);
    assert.ok(foundation.x+foundation.w-(blocks.at(-1).x+blocks.at(-1).w)>=80);
    for(let index=1;index<blocks.length;index++)assert.ok(blocks[index].x-(blocks[index-1].x+blocks[index-1].w)>=80);
  }
});

test('placed gameplay objects are not embedded inside solid geometry',()=>{
  for(const object of [...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES,BOSS_ARENA.boss,REST_AREA.station])assert.ok(PLATFORMS.every(block=>!intersects(object,block)),`object at ${object.x},${object.y} is embedded in a block`);
});

test('the limited electricity economy remains intact',()=>{
  assert.equal(CONDUITS.length,3);
  assert.ok(CONDUITS.every(conduit=>conduit.charge===24&&conduit.energyPerHit===4));
  assert.ok(JUNK_PILES.length>=10);
});
