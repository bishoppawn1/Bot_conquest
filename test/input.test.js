import test from 'node:test';
import assert from 'node:assert/strict';
import { actionFor } from '../src/input.js';

test('O is rest and I remains deliberately unbound',()=>{
  assert.equal(actionFor({code:'KeyO',key:'o'}),'rest');
  assert.equal(actionFor({code:'KeyI',key:'i'}),undefined);
});
