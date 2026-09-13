// Moving between title, play, street-cleared and game-over.
import { S } from './state.js';
import { buildLevel } from './level.js';
import { resumeAudio, startEngine, stopEngine } from '../core/audio.js';

function startGame(){
  S.level=1; S.score=0; S.lives=3; S.failed=false;
  buildLevel(1); S.tutorial=5; S.mode='play';
  startEngine();
}
function nextStreet(){
  if(S.failed){ S.failed=false; buildLevel(S.level); }
  else { buildLevel(S.level+1); }
  S.mode='play';
  startEngine();
}
function press(){
  resumeAudio();
  if(S.mode==='title') startGame();
  else if(S.mode==='clear') nextStreet();
  else if(S.mode==='over') startGame();
}
/* Cut the engine when the ride stops, so the title and game-over screens are
   quiet. update() restarts it on the next press. */
function idleAudio(){ stopEngine(); }

export { startGame, nextStreet, press, idleAudio };
