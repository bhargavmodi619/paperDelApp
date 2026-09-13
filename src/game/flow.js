// Moving between title, play, street-cleared and game-over.
import { S } from './state.js';
import { buildLevel } from './level.js';
import { resumeAudio } from '../core/audio.js';

function startGame(){
  S.level=1; S.score=0; S.lives=3; S.failed=false;
  buildLevel(1); S.tutorial=5; S.mode='play';
}
function nextStreet(){
  if(S.failed){ S.failed=false; buildLevel(S.level); }
  else { S.level++; buildLevel(S.level); }
  S.mode='play';
}
function press(){
  resumeAudio();
  if(S.mode==='title') startGame();
  else if(S.mode==='clear') nextStreet();
  else if(S.mode==='over') startGame();
}

export { startGame, nextStreet, press };
