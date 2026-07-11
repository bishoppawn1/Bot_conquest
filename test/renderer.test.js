import test from 'node:test';
import assert from 'node:assert/strict';
import { LEG_COUNT, LEG_REACH, LEG_SPREAD } from '../src/renderer.js';

test('the bot uses three widely splayed procedural legs',()=>{
  assert.equal(LEG_COUNT,3);
  assert.equal(LEG_REACH,112);
  assert.equal(LEG_SPREAD,44);
});
