import test from 'node:test';
import assert from 'node:assert/strict';
import { hasFloorAhead, isSurfaceContact, nearestSurfacePoint, shareSupportingPlatform } from '../src/geometry.js';

test('nearest surface query returns a reachable platform contact',()=>{
  const point=nearestSurfacePoint(42,75,[{x:0,y:100,w:100,h:50}],40);
  assert.deepEqual(point,{x:42,y:100});
});

test('floor probe distinguishes supported ground from a platform edge',()=>{
  const platforms=[{x:0,y:100,w:100,h:50}];
  assert.equal(hasFloorAhead({x:40,y:70,w:20,h:30},1,platforms),true);
  assert.equal(hasFloorAhead({x:80,y:70,w:20,h:30},1,platforms),false);
});

test('surface queries return null rather than attaching a foot to thin air',()=>{
  const platforms=[{x:0,y:100,w:100,h:50}];
  assert.equal(nearestSurfacePoint(300,20,platforms,40),null);
  assert.equal(isSurfaceContact({x:300,y:60},platforms),false);
  assert.equal(isSurfaceContact({x:42,y:100},platforms),true);
});

test('actors only share walkable support when standing on the same platform',()=>{
  const platforms=[{x:0,y:100,w:100,h:50},{x:140,y:100,w:100,h:50}];
  const first={x:20,y:70,w:20,h:30},same={x:60,y:70,w:20,h:30},acrossGap={x:160,y:70,w:20,h:30};
  assert.equal(shareSupportingPlatform(first,same,platforms),true);
  assert.equal(shareSupportingPlatform(first,acrossGap,platforms),false);
});
