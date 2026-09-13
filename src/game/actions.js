// Player actions and their consequences.
import { S } from './state.js';
import { clamp, rnd } from '../core/math.js';
import { spawnDust } from './particles.js';
import { C } from '../core/palette.js';
import { blip } from '../core/audio.js';
import { callout } from './throwing.js';

function setLane(dir){
  if(S.mode!=='play' || S.stun>0) return;
  var nl = clamp(S.lane+dir,0,2);
  if(nl!==S.lane){ S.lane=nl; blip(400,.05); }
}
function crash(){
  if(S.stun>0) return;
  S.lives--; S.combo=0; S.stun=1.2; S.shake=16;
  callout('CRASH!', C.bad);
  blip(85,.32,'sawtooth');
  for(var i=0;i<14;i++) spawnDust(S.px+rnd(-.5,.5), S.trackPos+rnd(2.5,5), rnd(0.10,0.22));
  if(S.lives<=0){ S.mode='over'; if(S.score>S.best) S.best=S.score; }
}

export { setLane, crash };
