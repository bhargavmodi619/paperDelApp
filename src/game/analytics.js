// What we measure and when. The question this prototype exists to answer is
// whether players reach level 2 (claude.md section 5), so everything here is
// in service of a funnel: started -> level 1 cleared -> level 2 started -> ...
// and, for the ones who leave, where they were when they left.
//
// Throws and crashes are counted per level and sent once at the end of the
// street rather than as individual events — same information, a fraction of
// the traffic.
import { S } from './state.js';
import { track, elapsed } from '../core/telemetry.js';

function resetLevelStats(){
  S.stats = { perfect:0, hit:0, early:0, late:0, miss:0, crashes:{}, crashN:0 };
}

function countThrow(grade){ if(S.stats) S.stats[grade] = (S.stats[grade]||0) + 1; }
function countCrash(type){
  if(!S.stats) return;
  S.stats.crashN++;
  S.stats.crashes[type] = (S.stats.crashes[type]||0) + 1;
}

/* where on the street the rider is, 0..1 */
function progress(){ return S.trackLen ? Math.round(100*Math.min(1, S.trackPos/S.trackLen)) : 0; }

function levelStarted(level, retry){
  track('level_start', { level:level, retry:retry?1:0, lives:S.lives, papers:S.papers });
}

function levelEnded(cleared){
  var st = S.stats || {};
  var crashes = Object.keys(st.crashes||{}).map(function(k){ return k+':'+st.crashes[k]; }).join(',');
  track(cleared ? 'level_clear' : 'level_fail', {
    level:S.level, delivered:S.delivered, need:S.need, targets:S.targets,
    score:S.score, lives:S.lives, papers:S.papers,
    perfect:st.perfect||0, hit:st.hit||0, early:st.early||0, late:st.late||0, miss:st.miss||0,
    crashN:st.crashN||0, crashes:crashes
  });
}

function gameOver(){
  track('game_over', { level:S.level, score:S.score, best:S.best });
}

/* Sent when the tab is hidden — the phone locked, the app switched. This is
   the "quit point" in practice: most people never come back. */
function backgrounded(){
  track('background', { mode:S.mode, level:S.level, progress:progress(),
                        delivered:S.delivered, lives:S.lives, secs:Math.round(elapsed()) });
}
function foregrounded(){
  track('foreground', { mode:S.mode, level:S.level });
}

function sessionStarted(){
  var ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  var platform = /android/i.test(ua) ? 'android' : /iphone|ipad|ipod/i.test(ua) ? 'ios' : 'desktop';
  var w = (typeof window !== 'undefined') ? window.innerWidth : 0;
  var h = (typeof window !== 'undefined') ? window.innerHeight : 0;
  track('session_start', { platform:platform, w:w, h:h, dpr:(typeof window!=='undefined'&&window.devicePixelRatio)||1 });
}

export { resetLevelStats, countThrow, countCrash, levelStarted, levelEnded, gameOver,
         backgrounded, foregrounded, sessionStarted };
