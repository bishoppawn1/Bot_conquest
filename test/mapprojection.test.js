import test from 'node:test';
import assert from 'node:assert/strict';
import { localMapProjection } from '../src/renderer.js';

test('local maps preserve one true scale for horizontal and vertical distance',()=>{
  const region={x:2000,w:1000},objects=[{x:2000,y:-500,w:1000,h:100},{x:2400,y:1900,w:200,h:100}],frame={x:0,y:0,w:900,h:300};
  const projection=localMapProjection(region,objects,frame);
  assert.ok(projection.width<frame.w/2,'a tall region should not be widened to fill the map panel');
  assert.ok(Math.abs(projection.width/projection.height-region.w/(projection.bottom-projection.top))<1e-10);
  assert.ok(projection.x>frame.x&&projection.y>=frame.y);
});

