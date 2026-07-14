import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABILITY_GATED_BLOCKS, BOSS_ARENA, BRANCH_BLOCKS, CONDUITS, CROWN_UPPER_BLOCKS, DEPTH_ACCESS_BLOCKS, DEPTH_BOSS_ARENA, DEPTH_RETURN_BLOCKS,
  ENEMY_SPAWNS, FORGE_UPGRADE_COSTS, FOUNDATION_BLOCKS, INTERIOR_BLOCKS, JUNK_PILES,
  LOWER_BLOCKS, MERCHANT_ROOM, MERCHANT_ROOM_BLOCKS, MERCHANT_SPAWNS, MINI_BOSS_ARENAS, OVERHEAD_BLOCKS, PICKUP_SPAWNS,
  PLATFORMS, POCKET_BLOCKS, RECESSES, REGION_GATES, REGIONS,
  REST_AREA, TRAPS, VAULT_BOSS_ARENA, VAULT_DEEP_BLOCKS, VAULT_UPPER_BLOCKS, WALL_BLOCKS, WORLD_BOTTOM, WORLD_HEIGHT, WORLD_TOP, WORLD_WIDTH
} from '../src/level.js';

const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const horizontalGap=(a,b)=>Math.max(0,b.x-(a.x+a.w),a.x-(b.x+b.w));

test('the map occupies a genuine two-dimensional playfield',()=>{
  assert.equal(WORLD_WIDTH,14500);
  assert.equal(WORLD_TOP,-1900);
  assert.equal(WORLD_BOTTOM,2700);
  assert.equal(WORLD_HEIGHT,4600);
  assert.ok(PLATFORMS.some(block=>block.x+block.w===WORLD_WIDTH));
  assert.ok(LOWER_BLOCKS.some(block=>block.y>=1080),'the map needs playable space below the main floor');
  assert.ok(CROWN_UPPER_BLOCKS.some(block=>block.y===WORLD_TOP),'the map needs substantial upper space');
  assert.ok(ENEMY_SPAWNS.some(enemy=>enemy.y>800)&&ENEMY_SPAWNS.some(enemy=>enemy.y<0),'combat must exist above and below the main route');
});

test('suspended platforms vary in width and thickness',()=>{
  const suspended=[...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS];
  assert.ok(FOUNDATION_BLOCKS.filter(block=>!block.id.startsWith('vault-')).every(block=>block.h>=120));
  assert.ok(FOUNDATION_BLOCKS.filter(block=>block.id.startsWith('vault-')).every(block=>block.h===60));
  assert.ok(suspended.every(block=>block.h>=40&&block.h<=80));
  assert.ok(suspended.filter(block=>block.h>60).every(block=>['under-cache','under-threshold'].includes(block.id)));
  assert.ok(new Set(suspended.map(block=>block.w)).size>=15);
  assert.ok(new Set(suspended.map(block=>block.h)).size>=5);
  assert.ok(suspended.filter(block=>block.h<=45).length>=15,'many platforms should leave more open space beneath them');
  assert.ok([...FOUNDATION_BLOCKS,...OVERHEAD_BLOCKS].filter(block=>block.w>=800&&block.h>=70).length>=14,'the thin platforms still need massive structural framing');
});

test('the main floor stays reversible while the Sunken Vault descends and rises',()=>{
  for(let index=1;index<FOUNDATION_BLOCKS.length;index++){
    const previous=FOUNDATION_BLOCKS[index-1],next=FOUNDATION_BLOCKS[index];
    assert.ok(previous.y-next.y<=70,`foundation ${index} rises too high`);
    assert.ok(next.x-(previous.x+previous.w)<=160,`foundation gap ${index} is too wide`);
  }
  const vaultFoundations=FOUNDATION_BLOCKS.filter(block=>block.id?.startsWith('vault-'));
  assert.deepEqual(vaultFoundations.map(block=>block.y),[680,750,820,750,680]);
  assert.ok(Math.max(...vaultFoundations.map(block=>block.y))-Math.min(...vaultFoundations.map(block=>block.y))>=140);
  assert.ok(TRAPS.every(trap=>trap.x+trap.w<=2360||trap.x>=3550),'the vault descent must not hide spike softlocks');
  assert.deepEqual(TRAPS.slice(0,6).map(trap=>[trap.x,trap.w]),[[1200,90],[2270,90],[4850,100],[5790,100],[7190,160],[8330,70]]);
  assert.equal(TRAPS.filter(trap=>trap.x>=9600&&trap.x<12700).length,4);
});

test('recesses are unlabeled rooms framed by ceilings and mostly solid floors',()=>{
  assert.ok(RECESSES.length>=10);
  assert.ok(RECESSES.every(recess=>!('label' in recess)));
  for(const recess of RECESSES.slice(0,8)){
    const ceilingIntervals=OVERHEAD_BLOCKS.filter(block=>block.y+block.h===recess.ceilingY&&block.x<recess.x+recess.w&&block.x+block.w>recess.x)
      .map(block=>[Math.max(recess.x,block.x),Math.min(recess.x+recess.w,block.x+block.w)]).sort((a,b)=>a[0]-b[0]);
    let ceilingCovered=0,ceilingCursor=-Infinity;
    for(const [start,end] of ceilingIntervals){if(end<=ceilingCursor)continue;ceilingCovered+=end-Math.max(start,ceilingCursor);ceilingCursor=end;}
    assert.ok(ceilingCovered>=recess.w*(recess.ceilingOpenings?.7:1),`recess at ${recess.x} is missing its ceiling`);
    if(recess.steppedFloor){const steps=FOUNDATION_BLOCKS.filter(block=>block.x<recess.x+recess.w&&block.x+block.w>recess.x);assert.ok(new Set(steps.map(block=>block.y)).size>=3);continue;}
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
  assert.equal(WALL_BLOCKS.filter(block=>block.x<100||block.x>14400).length,2);
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
  assert.ok(ABILITY_GATED_BLOCKS.reduce((sum,block)=>sum+block.w,0)>2500);
  const byId=id=>PLATFORMS.find(block=>block.id===id);
  assert.ok(byId('assembly-cross').y-byId('double-entry').y>164,'double-jump entrance is reachable with the basic jump');
  assert.ok(horizontalGap(byId('foundry-high'),byId('dash-entry'))>300,'dash entrance is reachable with an ordinary leap');
  assert.ok(byId('relay-west').y-byId('wall-entry').y>200&&WALL_BLOCKS.some(wall=>wall.x+wall.w<=byId('wall-entry').x),'wall region lacks a real movement gate');
});

test('Crownworks opens into a contained upper chamber instead of ending at its ceiling',()=>{
  const byId=id=>CROWN_UPPER_BLOCKS.find(block=>block.id===id),roof=byId('crown-upper-roof'),west=byId('crown-upper-floor-west'),east=byId('crown-upper-floor-east'),climb=byId('crown-upper-climb');
  assert.ok(roof&&west&&east&&climb);assert.equal(roof.y,WORLD_TOP);assert.equal(roof.w,1200);assert.ok(climb.x-(west.x+west.w)>=80);assert.ok(east.x-(climb.x+climb.w)>=70);assert.equal(climb.y+climb.h,-650);
  assert.ok(CROWN_UPPER_BLOCKS.filter(block=>block.kind==='wall').length>=5);assert.ok(CROWN_UPPER_BLOCKS.filter(block=>block.kind==='crown-upper').reduce((sum,block)=>sum+block.w,0)>=1500);
  const threshold=CROWN_UPPER_BLOCKS.filter(block=>block.id?.includes('climb'))[0],opening=OVERHEAD_BLOCKS.filter(block=>block.id?.startsWith('crown-threshold')).sort((a,b)=>a.x-b.x),openingWidth=opening[1].x-(opening[0].x+opening[0].w);
  assert.ok(opening.every(block=>!intersects(block,threshold)));assert.ok(openingWidth>=220,'the ceiling opening should leave a bot-width passage around the climb wall');
  const upperEnemies=ENEMY_SPAWNS.filter(enemy=>enemy.y<-1300),upperJunk=JUNK_PILES.filter(pile=>pile.y<-1600&&!pile.material);
  assert.ok(upperEnemies.length>=3);assert.ok(upperEnemies.filter(enemy=>enemy.type!=='drone').every(enemy=>CROWN_UPPER_BLOCKS.some(block=>enemy.y+enemy.h===block.y&&enemy.x>=block.x&&enemy.x+enemy.w<=block.x+block.w)));
  assert.ok(upperJunk.length>=2);assert.ok(upperJunk.every(pile=>CROWN_UPPER_BLOCKS.some(block=>pile.y+pile.h===block.y&&pile.x>=block.x&&pile.x+pile.w<=block.x+block.w)));
});

test('named regions are contiguous and connected by visible gates',()=>{
  assert.equal(REGIONS.length,8);assert.equal(REGIONS.some(region=>region.id==='concourse'),false);
  const bastion=REGIONS.find(region=>region.id==='bastion');assert.equal(bastion.x+bastion.w,8400);
  assert.equal(REGIONS[0].x,0);assert.equal(REGIONS.at(-1).x+REGIONS.at(-1).w,WORLD_WIDTH);
  for(let index=1;index<REGIONS.length;index++)assert.equal(REGIONS[index-1].x+REGIONS[index-1].w,REGIONS[index].x);
  assert.equal(REGION_GATES.length,REGIONS.length-1);
  for(let index=0;index<REGION_GATES.length;index++){
    assert.equal(REGION_GATES[index].from,REGIONS[index].id);
    assert.equal(REGION_GATES[index].to,REGIONS[index+1].id);
  }
});

test('major upgrade merchants are discoveries beyond the merged Core Bastion',()=>{
  const discoveryIds=['merchant-parts','merchant-shells','merchant-salvage'],discoveries=discoveryIds.map(id=>MERCHANT_SPAWNS.find(merchant=>merchant.id===id));
  assert.ok(discoveries.every(Boolean));assert.ok(discoveries.every(merchant=>merchant.region!=='bastion'&&!merchant.hub));
  assert.ok(discoveries.some(merchant=>merchant.y<0),'one major merchant should require upper exploration');
  assert.ok(discoveries.filter(merchant=>merchant.x>=9600).length>=2,'major merchants should be spread into later eastern regions');
  assert.ok(new Set(MERCHANT_SPAWNS.map(merchant=>merchant.region)).size>=4);
  const forge=MERCHANT_SPAWNS.find(merchant=>merchant.service==='damageUpgrade');assert.equal(forge.region,'exchange');assert.deepEqual(forge.upgradeCosts,FORGE_UPGRADE_COSTS);assert.ok(FORGE_UPGRADE_COSTS.length>=3&&FORGE_UPGRADE_COSTS[0]>=500);
  for(const merchant of MERCHANT_SPAWNS){assert.ok(PLATFORMS.every(block=>!intersects(merchant,block)),`${merchant.id} overlaps a solid block`);assert.ok(ENEMY_SPAWNS.every(enemy=>!intersects(merchant,enemy)),`${merchant.id} overlaps an enemy spawn`);assert.ok(PLATFORMS.some(block=>block.y===merchant.y+merchant.h&&block.x<=merchant.x&&block.x+block.w>=merchant.x+merchant.w),`${merchant.id} has no supporting surface`);}
});

test('ability and map cores use the generic pickup format',()=>{
  const abilities=PICKUP_SPAWNS.filter(pickup=>pickup.kind==='ability'),maps=PICKUP_SPAWNS.filter(pickup=>pickup.kind==='map');assert.equal(abilities.length,3);assert.equal(maps.length,3);
  assert.ok(abilities.every(pickup=>pickup.name&&pickup.key&&pickup.color));assert.deepEqual(new Set(maps.flatMap(pickup=>pickup.regions)),new Set(REGIONS.map(region=>region.id)));
  const vault=PICKUP_SPAWNS.find(pickup=>pickup.id==='vault-core'),volt=PICKUP_SPAWNS.find(pickup=>pickup.id==='volt-core');
  assert.equal(vault.ability,'wallClimb');assert.equal(vault.requiresBossClear,true);assert.ok(vault.x>7190&&vault.x<REST_AREA.x+REST_AREA.w);
  assert.equal(volt.ability,'electricJab');assert.equal(volt.color,'#75f5ff');assert.equal(volt.requiresVaultBossClear,true);assert.ok(volt.x>VAULT_BOSS_ARENA.x&&volt.x<VAULT_BOSS_ARENA.rightGateX);
  const dash=PICKUP_SPAWNS.find(pickup=>pickup.id==='dash-core');assert.equal(dash.ability,'dash');assert.equal(dash.requiresDepthBossClear,true);assert.ok(dash.x>DEPTH_BOSS_ARENA.x&&dash.x<DEPTH_BOSS_ARENA.rightGateX);
  assert.ok(PICKUP_SPAWNS.every(pickup=>PLATFORMS.every(block=>!intersects(pickup,block))));
});

test('rare material salvage is sparse and hidden on ability-gated routes',()=>{
  const rare=JUNK_PILES.filter(pile=>pile.material);assert.equal(rare.length,2);assert.deepEqual(new Set(rare.map(pile=>pile.material.type)),new Set(['titanium','uranium']));
  for(const pile of rare)assert.ok(ABILITY_GATED_BLOCKS.some(block=>pile.y+pile.h===block.y&&pile.x>=block.x&&pile.x+pile.w<=block.x+block.w),`${pile.material.type} salvage is not on an ability-gated route`);
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
  assert.equal(BRANCH_BLOCKS.length,33);
  assert.ok(new Set(BRANCH_BLOCKS.map(block=>block.zone)).size>=9);
  assert.ok(BRANCH_BLOCKS.every(block=>!('step' in block)&&!('branch' in block)&&!block.requires));
  assert.ok(new Set(BRANCH_BLOCKS.map(block=>block.w)).size>=12);
  const combatSurfaces=[...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS,...CROWN_UPPER_BLOCKS];
  const combatants=[...ENEMY_SPAWNS,...MINI_BOSS_ARENAS.map(arena=>arena.enemy)];
  const supportedEnemies=combatants.filter(enemy=>enemy.type!=='drone'&&combatSurfaces.some(block=>enemy.x>=block.x&&enemy.x+enemy.w<=block.x+block.w&&enemy.y+enemy.h===block.y));
  assert.ok(supportedEnemies.length>=12,'upper and lower exploration spaces need their own encounters');
});

test('main-route ground encounters have room to fight away from spike-and-step pockets',()=>{
  const ground=ENEMY_SPAWNS.filter(enemy=>enemy.type!=='drone');
  for(const enemy of ground){
    const support=PLATFORMS.find(block=>enemy.x>=block.x&&enemy.x+enemy.w<=block.x+block.w&&enemy.y+enemy.h===block.y);
    if(!support||!FOUNDATION_BLOCKS.includes(support))continue;
    const nearbyStep=INTERIOR_BLOCKS.find(block=>block.y+block.h===support.y&&(Math.abs(block.x-(enemy.x+enemy.w))<110||Math.abs(enemy.x-(block.x+block.w))<110));
    const nearbyTrap=TRAPS.find(trap=>Math.abs(trap.x-(enemy.x+enemy.w))<110||Math.abs(enemy.x-(trap.x+trap.w))<110);
    assert.ok(!(nearbyStep&&nearbyTrap),`ground enemy at ${enemy.x} is pinned between a step and spikes`);
  }
});

test('the lower vault has a contained full-boss floor and a staged escape',()=>{
  assert.equal(LOWER_BLOCKS.length,5);
  const floor=LOWER_BLOCKS.find(block=>block.id==='under-cache'),threshold=LOWER_BLOCKS.find(block=>block.id==='under-threshold');
  assert.equal(floor.y,1120);assert.equal(floor.x+floor.w,VAULT_BOSS_ARENA.rightGateX);
  assert.equal(threshold.x,VAULT_BOSS_ARENA.rightGateX+VAULT_BOSS_ARENA.gateWidth);
  assert.deepEqual(LOWER_BLOCKS.filter(block=>block.id.startsWith('under-exit-')).map(block=>block.y),[1020,920,820]);
});

test('the Sunken Vault has a Wall-Climb loft and a much deeper Dash-locked return',()=>{
  assert.ok(VAULT_UPPER_BLOCKS.some(block=>block.y<0));assert.ok(VAULT_UPPER_BLOCKS.some(block=>block.kind==='wall'&&block.requires==='wallClimb'));
  assert.ok(VAULT_DEEP_BLOCKS.some(block=>block.y>=2100));assert.equal(DEPTH_BOSS_ARENA.floorY,2550);assert.ok(DEPTH_BOSS_ARENA.boss.health>VAULT_BOSS_ARENA.boss.health);
  assert.ok(DEPTH_ACCESS_BLOCKS.some(block=>block.kind==='wall'&&block.requires==='wallClimb'));assert.ok(DEPTH_RETURN_BLOCKS.length>=5);assert.ok(DEPTH_RETURN_BLOCKS.every(block=>block.requires==='dash'));
  const climbWalls=VAULT_DEEP_BLOCKS.filter(block=>block.kind==='wall'&&block.requires==='wallClimb'),galleries=VAULT_DEEP_BLOCKS.filter(block=>block.id?.includes('gallery'));assert.equal(climbWalls.length,2);assert.ok(climbWalls.every(block=>block.h>=200));assert.equal(galleries.length,2);assert.ok(galleries.reduce((sum,block)=>sum+block.w,0)>=700);assert.ok(DEPTH_BOSS_ARENA.floorY-VAULT_BOSS_ARENA.floorY>=1400);
});

test('walkable surfaces leave enough headroom for the bot',()=>{
  const botWidth=50,botHeight=36;
  for(const surface of [...FOUNDATION_BLOCKS,...INTERIOR_BLOCKS,...BRANCH_BLOCKS,...LOWER_BLOCKS,...ABILITY_GATED_BLOCKS,...CROWN_UPPER_BLOCKS.filter(block=>block.kind==='crown-upper')]){
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
  assert.equal(WALL_BLOCKS.length,6);
  assert.ok(WALL_BLOCKS.every(wall=>wall.kind==='wall'&&wall.h>=135&&wall.h>wall.w*2));
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
  const miniBosses=MINI_BOSS_ARENAS.map(arena=>arena.enemy);
  for(const object of [...ENEMY_SPAWNS,...miniBosses,...CONDUITS,...JUNK_PILES,...PICKUP_SPAWNS,BOSS_ARENA.boss,VAULT_BOSS_ARENA.boss,REST_AREA.station])assert.ok(PLATFORMS.every(block=>!intersects(object,block)),`object at ${object.x},${object.y} is embedded in a block`);
});

test('the three new regions have distinct traversal identities',()=>{
  const gauntlet=REGIONS.find(region=>region.id==='gauntlet'),drift=REGIONS.find(region=>region.id==='drift'),exchange=REGIONS.find(region=>region.id==='exchange');
  assert.ok(gauntlet&&drift&&exchange);assert.ok(TRAPS.filter(trap=>trap.x>=gauntlet.x&&trap.x<gauntlet.x+gauntlet.w).length>=3);
  assert.ok(BRANCH_BLOCKS.filter(block=>block.zone==='drift').length>=4);assert.ok(exchange.w>=1800);assert.ok(BRANCH_BLOCKS.filter(block=>block.zone==='exchange').length>=4);
});

test('the limited electricity economy remains intact',()=>{
  assert.equal(CONDUITS.length,3);
  assert.ok(CONDUITS.every(conduit=>conduit.charge===24&&conduit.energyPerHit===4));
  assert.ok(JUNK_PILES.length>=10);
});
