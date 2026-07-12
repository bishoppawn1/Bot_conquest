import test from 'node:test';
import assert from 'node:assert/strict';
import { actionFor, shouldBegin } from '../src/input.js';

test('O is rest while inventory and restart remain deliberately unbound',()=>{
  assert.equal(actionFor({code:'KeyO',key:'o'}),'rest');
  assert.equal(actionFor({code:'KeyI',key:'i'}),undefined);
  assert.equal(actionFor({code:'KeyR',key:'r'}),undefined);
  assert.equal(shouldBegin({code:'KeyR'},false),false);
  assert.equal(shouldBegin({code:'Enter'},false),true);
});
