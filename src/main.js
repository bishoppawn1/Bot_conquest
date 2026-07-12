import { Game } from './game.js';
import { bindInput } from './input.js';
import { Renderer } from './renderer.js';

const canvas = document.querySelector('#game');
const startScreen = document.querySelector('#start');
const gameOverScreen = document.querySelector('#gameover');
const renderer = new Renderer(canvas);
const debugSpawn = new URLSearchParams(location.search).get('debug');

let game = new Game();
let playing = false;
let lastFrame = 0;

function begin() {
  game = new Game();
  if (debugSpawn === 'boss') {
    game.player.x=game.bossArena.triggerX+80;
    game.player.y=game.bossArena.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'rest') {
    const boss=game.boss();boss.dead=true;boss.health=0;
    game.bossArena.cleared=true;
    game.player.x=game.restArea.station.x+game.restArea.station.w+40;
    game.player.y=game.restArea.floorY-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  } else if (debugSpawn === 'vertical') {
    game.player.x=1500;
    game.player.y=550-game.player.h;
    game.safePosition={x:game.player.x,y:game.player.y};
  }
  playing = true;
  renderer.resetLegs();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
}

document.querySelector('#play').addEventListener('click', begin);
document.querySelector('#retry').addEventListener('click', begin);
bindInput({ getGame: () => game, isPlaying: () => playing, begin });

function frame(timestamp) {
  const dt = Math.min((timestamp-lastFrame)/1000,.034)||1/60;
  lastFrame = timestamp;
  if (playing) {
    game.update(dt);
    if (!game.running) { playing=false; gameOverScreen.classList.remove('hidden'); }
  }
  renderer.draw(game);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
