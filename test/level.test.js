import test from 'node:test';
import assert from 'node:assert/strict';
import { ABILITY_GATED_BLOCKS, BOSS_ARENA, BRANCH_BLOCKS, CONDUITS, ENEMY_SPAWNS, FOUNDATION_BLOCKS, INTERIOR_BLOCKS, JUNK_PILES, OVERHEAD_BLOCKS, PLATFORMS, POCKET_BLOCKS, RECESSES, REST_AREA, TRAPS, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH } from '../src/level.js';

test('the replacement map is wide without reserving most of its height for locked routes',()=>{
  assert.equal(WORLD_WIDTH,9600);
  assert.equal(WORLD_TOP,-1000);
  assert.equal(WORLD_HEIGHT,1800);
  assert.ok(PLATFORMS.some(block=>block.x+block.w===WORLD_WIDTH));
  assert.ok(ENEMY_SPAWNS.some(enemy=>enemy.x>9000));
});

test('the world is built from massive blocks rather than thin ledges',()=>{
  assert.ok(FOUNDATION_BLOCKS.length>=8);
  assert.ok(PLATFORMS.every(block=>block.h>=60));
  assert.ok(PLATFORMS.filter(block=>block.w>=400&&block.h>=90).length>=16);
  assert.ok(INTERIOR_BLOCKS.every(block=>block.h===70));
});

test('the lower foundation network is traversable with the basic jump',()=>{
  for(let index=1;index<FOUNDATION_BLOCKS.length;index++){
    const previous=FOUNDATION_BLOCKS[index-1],next=FOUNDATION_BLOCKS[index];
    const rise=previous.y-next.y;
    const gap=next.x-(previous.x+previous.w);
    assert.ok(rise<=70,`foundation ${index} rises too high for the basic jump`);
    assert.ok(gap<=(rise>0?100:160),`foundation gap ${index} is too wide for its ${rise}-unit rise`);
    assert.equal(TRAPS[index-1].x,previous.x+previous.w,`trap ${index-1} does not begin at the platform edge`);
    assert.equal(TRAPS[index-1].w,gap,`trap ${index-1} does not exactly cover its gap`);
  }
});

test('recesses are unlabeled negative space framed by solid blocks',()=>{
  assert.ok(RECESSES.length>=10);
  assert.ok(RECESSES.every(recess=>!('label' in recess)));
  for(const recess of RECESSES.slice(0,8)){
    const floor=FOUNDATION_BLOCKS.find(block=>block.y===recess.floorY&&block.x<=recess.x&&block.x+block.w>=recess.x+recess.w);
    const ceiling=OVERHEAD_BLOCKS.find(block=>block.y+block.h===recess.ceilingY&&block.x<=recess.x&&block.x+block.w>=recess.x+recess.w);
    assert.ok(floor,`recess at ${recess.x} is missing its floor mass`);
    assert.ok(ceiling,`recess at ${recess.x} is missing its ceiling mass`);
  }
});

test('large chambers contain smaller physically framed alcove pockets',()=>{
  const pockets=RECESSES.filter(recess=>recess.pocket);
  assert.equal(pockets.length,2);
  assert.ok(pockets.every(recess=>recess.w<=240&&recess.h>=100));
  assert.equal(POCKET_BLOCKS.length,4);
  for(const pocket of pockets){
    const floor=FOUNDATION_BLOCKS.find(block=>block.y===pocket.floorY&&block.x<=pocket.x&&block.x+block.w>=pocket.x+pocket.w);
    const ceiling=POCKET_BLOCKS.find(block=>block.y+block.h===pocket.ceilingY&&block.x<=pocket.x&&block.x+block.w>=pocket.x+pocket.w);
    assert.ok(floor&&ceiling,`small alcove at ${pocket.x} is not physically framed`);
  }
});

test('only a few small optional caches remain ability gated',()=>{
  assert.equal(ABILITY_GATED_BLOCKS.length,3);
  assert.ok(ABILITY_GATED_BLOCKS.every(block=>block.requires));
  assert.ok(ABILITY_GATED_BLOCKS.every(block=>block.requires==='doubleJump'&&block.w<=300));
  assert.ok(ABILITY_GATED_BLOCKS.reduce((width,block)=>width+block.w,0)<FOUNDATION_BLOCKS.reduce((width,block)=>width+block.w,0)*.15);
  assert.ok(JUNK_PILES.some(pile=>pile.gate&&pile.minimumDamage===2&&pile.h>=90));
});

test('the boss arena is a large open chamber on the normal-jump route',()=>{
  const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  assert.ok(BOSS_ARENA.w>=1200&&BOSS_ARENA.h>=240);
  assert.ok(INTERIOR_BLOCKS.every(block=>!intersects(block,BOSS_ARENA)));
  for(const object of [...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES]){
    const center=object.x+object.w/2;
    assert.ok(center<BOSS_ARENA.x||center>BOSS_ARENA.x+BOSS_ARENA.w,`ordinary object at ${object.x} clutters the boss arena`);
  }
  assert.equal(BOSS_ARENA.boss.y+BOSS_ARENA.boss.h,BOSS_ARENA.floorY);
});

test('normal-jump branches add vertical loops above the main foundations',()=>{
  assert.ok(BRANCH_BLOCKS.length>=28);
  assert.ok(new Set(BRANCH_BLOCKS.map(block=>block.branch)).size>=6);
  assert.ok(BRANCH_BLOCKS.every(block=>!block.requires));
  const horizontalGap=(first,second)=>Math.max(0,second.x-(first.x+first.w),first.x-(second.x+second.w));
  for(const block of BRANCH_BLOCKS){
    const foundation=FOUNDATION_BLOCKS.find(floor=>block.x>=floor.x&&block.x+block.w<=floor.x+floor.w);
    assert.ok(foundation,`branch ${block.branch} is not above a safe foundation`);
    const candidates=block.step===0?INTERIOR_BLOCKS:BRANCH_BLOCKS.filter(candidate=>candidate.branch===block.branch&&candidate.step===block.step-1);
    assert.ok(candidates.some(candidate=>candidate.y-block.y===140&&horizontalGap(candidate,block)<=10),`branch ${block.branch} step ${block.step} lacks a reversible side landing`);
  }
  const routes=[...new Set(BRANCH_BLOCKS.map(block=>block.branch))].map(name=>BRANCH_BLOCKS.filter(block=>block.branch===name));
  assert.ok(routes.filter(route=>Math.max(...route.map(block=>block.y))-Math.min(...route.map(block=>block.y))>=800).length>=3,'the world needs several genuinely tall playable shafts');
});

test('walkable surfaces leave enough headroom for the bot instead of forming sealed slots',()=>{
  const botWidth=50,botHeight=36;
  for(const surface of [...FOUNDATION_BLOCKS,...INTERIOR_BLOCKS,...BRANCH_BLOCKS]){
    const blockers=PLATFORMS.filter(block=>block!==surface&&block.y<surface.y&&block.y+block.h>surface.y-botHeight)
      .map(block=>[Math.max(surface.x,block.x),Math.min(surface.x+surface.w,block.x+block.w)])
      .filter(([start,end])=>end>start)
      .sort((a,b)=>a[0]-b[0]);
    let cursor=surface.x,best=0;
    for(const [start,end] of blockers){best=Math.max(best,start-cursor);cursor=Math.max(cursor,end);}
    best=Math.max(best,surface.x+surface.w-cursor);
    assert.ok(best>=botWidth+30,`${surface.kind} at ${surface.x},${surface.y} has no usable standing area`);
  }
});

test('ordinary junk never seals the route supporting it',()=>{
  for(const pile of JUNK_PILES.filter(pile=>!pile.gate)){
    const support=PLATFORMS.find(block=>pile.x>=block.x&&pile.x+pile.w<=block.x+block.w&&pile.y+pile.h===block.y);
    assert.ok(support,`junk at ${pile.x},${pile.y} has no supporting platform`);
    const left=pile.x-support.x,right=support.x+support.w-(pile.x+pile.w);
    assert.ok(Math.max(left,right)>=50,`junk at ${pile.x},${pile.y} blocks both sides of its route`);
  }
});

test('true walls use dedicated wall geometry instead of floor styling',()=>{
  const walls=POCKET_BLOCKS.filter(block=>block.kind==='wall');
  assert.equal(walls.length,2);
  assert.ok(walls.every(wall=>wall.h>=140&&wall.h>wall.w*2));
});

test('the post-boss rest area is an uncluttered recovery room',()=>{
  const centerInside=object=>object.x+object.w/2>REST_AREA.x&&object.x+object.w/2<REST_AREA.x+REST_AREA.w;
  assert.equal(REST_AREA.station.y+REST_AREA.station.h,REST_AREA.floorY);
  assert.ok(REST_AREA.station.interactionRadius>=100);
  assert.ok([...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES].every(object=>!centerInside(object)));
});

test('solid blocks never intersect or bury another platform',()=>{
  const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(let first=0;first<PLATFORMS.length;first++)for(let second=first+1;second<PLATFORMS.length;second++){
    assert.equal(intersects(PLATFORMS[first],PLATFORMS[second]),false,`blocks ${first} and ${second} overlap`);
  }
});

test('lower obstacles preserve reversible floor routes without softlock pockets',()=>{
  for(const foundation of FOUNDATION_BLOCKS){
    const blocks=INTERIOR_BLOCKS.filter(block=>block.x>=foundation.x&&block.x+block.w<=foundation.x+foundation.w&&block.y+block.h===foundation.y).sort((a,b)=>a.x-b.x);
    if(!blocks.length)continue;
    assert.ok(blocks[0].x-foundation.x>=80,`foundation at ${foundation.x} has no left recovery path`);
    assert.ok(foundation.x+foundation.w-(blocks.at(-1).x+blocks.at(-1).w)>=80,`foundation at ${foundation.x} has no right recovery path`);
    for(let index=1;index<blocks.length;index++)assert.ok(blocks[index].x-(blocks[index-1].x+blocks[index-1].w)>=80,`foundation at ${foundation.x} has a trapping block seam`);
  }
});

test('placed gameplay objects are not embedded inside solid geometry',()=>{
  const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const object of [...ENEMY_SPAWNS,...CONDUITS,...JUNK_PILES,BOSS_ARENA.boss,REST_AREA.station])assert.ok(PLATFORMS.every(block=>!intersects(object,block)),`object at ${object.x},${object.y} is embedded in a block`);
});

test('the reset keeps the limited electricity economy',()=>{
  assert.equal(CONDUITS.length,3);
  assert.ok(CONDUITS.every(conduit=>conduit.charge===24&&conduit.energyPerHit===4));
  assert.ok(JUNK_PILES.length>=10);
});
