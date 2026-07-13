import test from 'node:test';
import assert from 'node:assert/strict';
import { actionFor, shouldBegin } from '../src/input.js';

test('O controls rest, I opens inventory, and restart remains unbound',()=>{
  assert.equal(actionFor({code:'KeyO',key:'o'}),'rest');
  assert.equal(actionFor({code:'KeyI',key:'i'}),'inventory');
  assert.equal(actionFor({code:'KeyR',key:'r'}),undefined);
  assert.equal(shouldBegin({code:'KeyR'},false),false);
  assert.equal(shouldBegin({code:'Enter'},false),true);
});
