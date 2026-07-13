import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, HEAL_DURATION } from '../src/game.js';
import { ABILITY_COSTS, ATTACK_RANGE, ATTACK_TIMING, circleIntersectsRect, fieldCircle, SCRAP_VALUES } from '../src/combat.js';

const tick=(game,count=1)=>{for(let i=0;i<count;i++)game.update(1/60);};
const press=(game,key)=>{game.setInput({[key]:true});tick(game);game.setInput({[key]:false});tick(game);};
const settled=()=>{const game=new Game();tick(game,60);game.enemies=[];game.conduits=[];return game;};

test('primary slash supports up and down directions',()=>{
  const game=settled();game.player.aimX=0;game.player.aimY=-1;press(game,'attack');assert.ok(game.attackBox().y<game.player.y);
  tick(game,20);game.player.aimY=1;press(game,'attack');assert.ok(game.attackBox().y>=game.player.y+game.player.h-2);
});

test('a slash direction is frozen for its visual flash',()=>{
  const game=settled();game.player.aimX=0;game.player.aimY=-1;game.setInput({attack:true});tick(game);game.setInput({attack:false,right:true});tick(game);
  assert.deepEqual(game.attackDirection(),{x:0,y:-1});assert.ok(game.attackBox().y<game.player.y);
});

test('killing an enemy grants scrap and hitting it grants electricity',()=>{
  const game=settled(),enemy=game.enemy({type:'crawler',x:game.player.x+58,y:game.player.y,w:30,h:40});game.enemies=[enemy];press(game,'attack');
  assert.equal(enemy.dead,true);assert.equal(game.player.scrap,SCRAP_VALUES.crawler);assert.equal(game.player.electricity,12);
});

test('hitting a conduit generates electricity without destroying it',()=>{
  const game=settled(),conduit={kind:'conduit',x:game.player.x+58,y:game.player.y,w:25,h:36,charge:24,maxCharge:24,energyPerHit:4,hitFlash:0};game.conduits=[conduit];press(game,'attack');
  assert.equal(game.player.electricity,4);assert.equal(conduit.charge,20);assert.ok(conduit.hitFlash>0);
});

test('conduit runs dry and cannot generate unlimited electricity',()=>{
  const game=settled(),conduit={kind:'conduit',x:game.player.x+58,y:game.player.y,w:25,h:36,charge:8,maxCharge:8,energyPerHit:4,hitFlash:0};game.conduits=[conduit];
  press(game,'attack');tick(game,20);press(game,'attack');tick(game,20);press(game,'attack');
  assert.equal(conduit.charge,0);assert.equal(game.player.electricity,8);
});

test('repair spends electricity immediately but restores a shell after a short channel',()=>{
  const game=settled();game.player.lives=2;game.player.electricity=ABILITY_COSTS.heal;press(game,'heal');
  assert.equal(HEAL_DURATION,.7);assert.equal(game.player.lives,2);assert.equal(game.player.electricity,0);assert.ok(game.player.healTime>0);
  tick(game,45);assert.equal(game.player.lives,3);assert.equal(game.player.healTime,0);assert.ok(game.player.healFlash>0);
});

test('taking damage interrupts repair without refunding its electricity',()=>{
  const game=settled();game.player.lives=2;game.player.electricity=ABILITY_COSTS.heal;press(game,'heal');game.damagePlayer('enemy',game.player.x+100);
  assert.equal(game.player.lives,1);assert.equal(game.player.healTime,0);assert.equal(game.player.electricity,0);tick(game,50);assert.equal(game.player.lives,1);
});

test('repair cannot be hidden inside post-hit invulnerability',()=>{
  const game=settled();game.player.lives=2;game.player.electricity=ABILITY_COSTS.heal;game.player.invuln=.5;press(game,'heal');assert.equal(game.player.healTime,0);assert.equal(game.player.electricity,ABILITY_COSTS.heal);
});

test('attacks are ignored without cancelling an active repair channel',()=>{
  const game=settled();game.player.lives=2;game.player.electricity=100;game.unlockAbility('field');game.unlockAbility('electricJab');press(game,'heal');
  const remaining=game.player.healTime,attackId=game.player.attackId,electricity=game.player.electricity;
  press(game,'attack');press(game,'field');press(game,'electricJab');
  assert.ok(game.player.healTime>0&&game.player.healTime<remaining);assert.equal(game.player.attackId,attackId);assert.equal(game.player.specialType,null);assert.equal(game.player.electricity,electricity);
  tick(game,50);assert.equal(game.player.lives,3);
});

test('electric field spends energy and damages enemies around the player',()=>{
  const game=settled(),enemy=game.enemy({type:'crawler',x:game.player.x-35,y:game.player.y,w:30,h:40});game.enemies=[enemy];game.unlockAbility('field');game.player.electricity=ABILITY_COSTS.field;press(game,'field');
  assert.equal(game.player.specialType,'field');assert.equal(enemy.health,2);assert.equal(enemy.dead,false);assert.equal(game.player.electricity,4);
});

test('electric field uses a true circle rather than its square bounds',()=>{
  const game=settled(),circle=fieldCircle(game.player);
  assert.equal(circle.radius,ATTACK_RANGE.field);
  assert.equal(circleIntersectsRect(circle,{x:circle.x+80,y:circle.y+80,w:4,h:4}),false);
  assert.equal(circleIntersectsRect(circle,{x:circle.x+105,y:circle.y-2,w:8,h:4}),true);
});

test('electric field remains active for its extended duration',()=>{
  const game=settled();game.unlockAbility('field');game.player.electricity=ABILITY_COSTS.field;press(game,'field');
  assert.equal(ATTACK_TIMING.field,.9);assert.ok(game.player.specialTime>.8);
});

test('electric jab reaches farther in the locked aim direction',()=>{
  const game=settled(),enemy=game.enemy({type:'crawler',x:game.player.x+180,y:game.player.y,w:30,h:40});game.enemies=[enemy];game.unlockAbility('electricJab');game.player.electricity=ABILITY_COSTS.electricJab;press(game,'electricJab');
  assert.equal(game.player.specialType,'electricJab');assert.equal(enemy.health,1);assert.equal(enemy.dead,false);assert.equal(game.player.electricity,4);
});

test('the starting slash and ordinary enemies share a three-point baseline',()=>{
  const game=new Game(),ordinary=game.enemies.filter(enemy=>!enemy.isBoss&&!enemy.isVaultBoss&&!enemy.isMiniBoss);assert.equal(game.player.primaryDamage,3);assert.ok(ordinary.length>0);assert.ok(ordinary.every(enemy=>enemy.health===3));
});

test('basic slash retains the full 105-unit range',()=>{
  const game=settled(),enemy=game.enemy({type:'crawler',x:game.player.x+140,y:game.player.y,w:20,h:30});game.enemies=[enemy];press(game,'attack');
  assert.equal(ATTACK_RANGE.primary,105);assert.equal(enemy.dead,true);
});

test('primary slash hits its entire area simultaneously',()=>{
  const game=settled(),near=game.enemy({type:'crawler',x:game.player.x+60,y:game.player.y,w:20,h:30}),far=game.enemy({type:'crawler',x:game.player.x+130,y:game.player.y,w:20,h:30});game.enemies=[near,far];game.setInput({attack:true});tick(game);
  assert.equal(near.dead,true);assert.equal(far.dead,true);assert.equal(game.player.electricity,24);
});

test('primary slash does not hit targets entering after the instant strike',()=>{
  const game=settled(),enemy=game.enemy({type:'crawler',x:game.player.x+220,y:game.player.y,w:20,h:30});game.enemies=[enemy];game.setInput({attack:true});tick(game);assert.equal(enemy.dead,false);
  game.setInput({attack:false});enemy.x=game.player.x+70;tick(game);assert.ok(game.player.attackTime>0);assert.equal(enemy.dead,false);
});

test('junk pile breaks after repeated attacks and awards its scrap',()=>{
  const game=settled(),pile={kind:'junk',x:game.player.x+58,y:game.player.y,w:55,h:36,health:3,maxHealth:3,scrapValue:20,dead:false,hitFlash:0};game.junkPiles=[pile];
  press(game,'attack');tick(game,20);press(game,'attack');tick(game,20);press(game,'attack');
  assert.equal(pile.dead,true);assert.equal(game.player.scrap,20);assert.equal(game.player.electricity,0);
});

test('locked special attacks do not spend electricity',()=>{
  const game=settled();game.player.electricity=100;press(game,'field');press(game,'electricJab');
  assert.equal(game.player.electricity,100);assert.equal(game.player.specialType,null);
});

test('armored junk gate resists the basic slash but takes electric-jab damage',()=>{
  const game=settled(),gate={kind:'junk',x:game.player.x+58,y:game.player.y,w:80,h:50,health:4,maxHealth:4,scrapValue:40,minimumDamage:2,dead:false,hitFlash:0};game.junkPiles=[gate];
  press(game,'attack');assert.equal(gate.health,4);game.unlockAbility('electricJab');game.player.electricity=ABILITY_COSTS.electricJab;press(game,'electricJab');assert.equal(gate.health,2);
});
