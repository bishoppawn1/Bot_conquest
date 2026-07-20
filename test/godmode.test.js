import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game.js';
import { BODY_MODIFIERS, REGIONS, RELICS } from '../src/level.js';

test('God mode is an explicit opt-in and ordinary runs keep their starting progression',()=>{
  const game=new Game();
  assert.equal(game.godMode,false);
  assert.deepEqual(game.player.abilities,{doubleJump:false,dash:false,wallClimb:false,heal:true,field:false,electricJab:false});
  assert.equal(game.player.primaryDamage,3);
  assert.deepEqual(game.player.ownedShells,['standard-body']);
});

test('God mode grants every ability, permanent tier, shell, item, bay, and map',()=>{
  const game=new Game();assert.equal(game.enableGodMode(),true);assert.equal(game.enableGodMode(),false);
  const player=game.player;
  assert.equal(game.godMode,true);
  assert.ok(Object.values(player.abilities).every(Boolean));
  assert.deepEqual([player.damageUpgrades,player.healthUpgrades,player.energyUpgrades,player.bayUpgrades],[4,3,3,2]);
  assert.equal(player.primaryDamage,7);
  assert.deepEqual(new Set(player.ownedShells),new Set(['standard-body','slicer-body']));
  assert.ok(Object.values(player.bodies).every(body=>body.expansionSlots.length===3));
  assert.deepEqual(new Set(player.purchasedItems.filter(item=>item.kind==='modifier').map(item=>item.modifierId)),new Set(BODY_MODIFIERS.map(item=>item.id)));
  assert.deepEqual(new Set(player.purchasedItems.filter(item=>item.kind==='relic').map(item=>item.relicId)),new Set(RELICS.map(item=>item.id)));
  assert.deepEqual(game.mappedRegions,new Set(REGIONS.map(region=>region.id)));
  assert.ok(game.pickups.every(pickup=>pickup.collected));
  assert.equal(player.lives,player.maxLives);assert.equal(player.electricity,player.maxElectricity);
});

test('God mode gives infinite shells against every damage source',()=>{
  const enemyGame=new Game();enemyGame.enableGodMode();const enemyPosition={x:enemyGame.player.x,y:enemyGame.player.y};enemyGame.damagePlayer('enemy',enemyGame.player.x+100);assert.deepEqual({x:enemyGame.player.x,y:enemyGame.player.y},enemyPosition);assert.equal(enemyGame.player.lives,enemyGame.player.maxLives);
  const spikeGame=new Game();spikeGame.enableGodMode();spikeGame.safePosition={x:500,y:400};Object.assign(spikeGame.player,{x:700,y:700});spikeGame.damagePlayer('spike');assert.deepEqual({x:spikeGame.player.x,y:spikeGame.player.y},spikeGame.safePosition);assert.equal(spikeGame.player.lives,spikeGame.player.maxLives);
  const fallGame=new Game();fallGame.enableGodMode();Object.assign(fallGame.player,{x:700,y:3000});fallGame.damagePlayer('fall');assert.deepEqual({x:fallGame.player.x,y:fallGame.player.y},fallGame.spawn);assert.equal(fallGame.player.lives,fallGame.player.maxLives);
  assert.ok([enemyGame,spikeGame,fallGame].every(game=>game.recoveryCorpse===null));
});

test('God mode special attacks and repairs never consume electricity',()=>{
  const game=new Game();game.enableGodMode();const full=game.player.electricity;
  assert.equal(game.startSpecial('field'),true);assert.equal(game.player.electricity,full);
  game.player.specialTime=0;assert.equal(game.startSpecial('electricJab'),true);assert.equal(game.player.electricity,full);
  game.player.specialTime=0;game.player.lives--;assert.equal(game.startHeal(),true);assert.equal(game.player.electricity,full);
  game.switchShell('slicer-body');assert.equal(game.player.electricity,game.player.maxElectricity);assert.equal(game.player.lives,game.player.maxLives);
});

test('the start screen exposes and wires the God mode opt-in',async()=>{
  const [html,main]=await Promise.all([readFile(new URL('../index.html',import.meta.url),'utf8'),readFile(new URL('../src/main.js',import.meta.url),'utf8')]);
  assert.match(html,/id="god-mode"[^>]*type="checkbox"/);assert.match(html,/ALL UPGRADES \/\/ INFINITE SHELLS \+ ENERGY/);
  assert.match(main,/godModeOption\.checked\)game\.enableGodMode\(\)/);
});
