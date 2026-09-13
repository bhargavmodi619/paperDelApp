// Moving between title, play, street-cleared and game-over — and pausing
// when the phone locks or the tab is hidden.
import { S } from './state.js';
import { buildLevel } from './level.js';
import { resumeAudio, suspendAudio, startEngine, stopEngine } from '../core/audio.js';
import { levelStarted, backgrounded, foregrounded } from './analytics.js';

function startGame(){
  S.level=1; S.score=0; S.lives=3; S.failed=false;
  buildLevel(1); S.tutorial=5; S.mode='play';
  startEngine();
  levelStarted(1, false);
}
function nextStreet(){
  var retry = S.failed;
  if(S.failed){ S.failed=false; buildLevel(S.level); }
  else { buildLevel(S.level+1); }
  S.mode='play';
  startEngine();
  levelStarted(S.level, retry);
}
function press(){
  resumeAudio();
  if(S.mode==='title') startGame();
  else if(S.mode==='clear') nextStreet();
  else if(S.mode==='over') startGame();
}

/* ---- pause ------------------------------------------------------------------
   The page is hidden: the phone locked, the app switched, the tab changed. The
   world freezes and the audio context is suspended, so nothing runs or makes a
   sound in the background. On return we stay paused until the player taps, so
   they are never dropped straight into a crash (claude.md section 3). */
function pause(){
  if(S.paused) return;
  S.paused = true;
  suspendAudio();
  backgrounded();
}
function unpause(){
  if(!S.paused) return;
  S.paused = false;
  resumeAudio();
  foregrounded();
}
/* Called on visibilitychange. Only auto-resumes audio outside of play; in play
   the player's tap does it, via unpause(). */
function visibility(hidden){
  if(hidden) pause();
  else if(S.mode!=='play') unpause();
}

export { startGame, nextStreet, press, pause, unpause, visibility };
