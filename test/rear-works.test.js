import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { supportingPlatform } from '../src/geometry.js';

const canEnterRearWorks=(wallClimb,dash)=>{
  const game=new Game();game.enemies=[];game.traps=[];game.junkPiles=[];if(wallClimb)game.unlockAbility('wallClimb');if(dash)game.unlockAbility('dash');
  const base=game.platforms.find(block=>block.id==='rear-works-climb-base'),launch=game.platforms.find(block=>block.id==='rear-works-launch'),floor=game.platforms.find(block=>block.id==='rear-works-floor');Object.assign(game.player,{x:1260,y:base.y-game.player.h,onGround:true,jumps:1,vx:0,vy:0});game.setInput({left:true,jump:true});let phase=0,reachedLaunch=false;
  for(let frame=0;frame<700;frame++){if(phase===0&&game.player.y<=launch.y-game.player.h+2){game.setInput({right:true,jump:true});phase=1;}else if(phase===1){game.setInput({right:false,jump:false});phase=2;}game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===launch){reachedLaunch=true;break;}}
  if(!reachedLaunch)return false;Object.assign(game.player,{facing:-1,onGround:true,jumps:1});game.setInput({left:true,jump:true,dash:true});game.update(1/60);game.setInput({left:true,jump:false,dash:false});for(let frame=0;frame<180;frame++){game.update(1/60);if(supportingPlatform(game.player,game.platforms,3)===floor)return true;}return false;
};

test('the hidden rear works requires Wall Climb and Dash together',()=>{
  assert.equal(canEnterRearWorks(false,false),false);assert.equal(canEnterRearWorks(true,false),false);assert.equal(canEnterRearWorks(false,true),false);assert.equal(canEnterRearWorks(true,true),true);
});
