import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_EXTENSION_BLOCKS, ENEMY_SPAWNS, JUNK_PILES, PLATFORMS, REGIONS, TRAPS } from '../src/level.js';

const supportedBy=(object,blocks)=>blocks.find(block=>object.x>=block.x&&object.x+object.w<=block.x+block.w&&object.y+object.h===block.y);

test('every region gains a three-piece connected longline extension',()=>{
  assert.equal(AREA_EXTENSION_BLOCKS.length,REGIONS.length*3);
  for(const region of REGIONS){
    const additions=AREA_EXTENSION_BLOCKS.filter(block=>block.region===region.id);assert.equal(additions.length,3,`${region.name} extension is incomplete`);
    assert.ok(additions.every(block=>block.x>=region.x&&block.x+block.w<=region.x+region.w));
    for(const block of additions){
      const connection=PLATFORMS.filter(existing=>existing!==block).find(existing=>Math.abs(existing.y-block.y)<=20&&(existing.x+existing.w===block.x||block.x+block.w===existing.x));
      assert.ok(connection,`${block.id} does not continue an established route`);
    }
  }
});

test('every regional extension adds combat, salvage, and a supported hazard',()=>{
  for(const region of REGIONS){
    const blocks=AREA_EXTENSION_BLOCKS.filter(block=>block.region===region.id);
    const enemy=ENEMY_SPAWNS.find(spawn=>spawn.extensionRegion===region.id),cache=JUNK_PILES.find(pile=>pile.id===`${region.id}-longline-cache`),trap=TRAPS.find(item=>item.id===`${region.id}-longline-spikes`);
    assert.ok(enemy&&supportedBy(enemy,blocks),`${region.name} extension lacks an encounter`);
    assert.ok(cache&&supportedBy(cache,blocks),`${region.name} extension lacks salvage`);
    assert.ok(trap&&supportedBy(trap,blocks),`${region.name} extension lacks a hazard`);
    assert.ok(PLATFORMS.includes(supportedBy(enemy,PLATFORMS)));
  }
});
