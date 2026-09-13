/* The bot's driving logic, shared by the playability test and the tuning
   diagnostic so they can never disagree about how well the game "can" be
   played. It is meant to be about as good as a strong human: it looks a
   couple of seconds ahead, predicts where a crossing dog will be when it
   arrives, and picks the lane that stays clear longest rather than the first
   one that happens to be free. */

const LANES = [-0.80, 0, 0.80];

/* Where a crossing hazard will be by the time the rider covers `rel`. */
function predictX(o, rel, riderSpeed){
  if (o.phase === 'gone') return null;
  const tArrive = rel / riderSpeed;
  if (o.phase === 'run' || (o.phase === 'alert' && o.t + tArrive > 0.75)){
    const runFor = o.phase === 'run' ? o.t + tArrive : (o.t + tArrive - 0.75);
    const dir = o.x1 > o.x0 ? 1 : -1;
    const dx = o.x0 + dir * o.speed * runFor;
    return dir > 0 ? Math.min(dx, o.x1) : Math.max(dx, o.x1);
  }
  return o.x;
}

/* Distance ahead, in world units, before this lane stops being safe. */
function clearAhead(S, lane, horizon){
  const x = LANES[lane];
  let nearest = horizon;
  for (const o of S.objs){
    const rel = o.z - S.trackPos;
    if (rel < 0.3 || rel > horizon) continue;
    let hit = false;
    if (o.kind === 'obs') hit = Math.abs(o.x - x) < 0.62;
    else if (o.kind === 'cross'){
      const px = predictX(o, rel, S.speed);
      hit = px !== null && Math.abs(px - x) < 0.66;
    }
    if (hit && rel < nearest) nearest = rel;
  }
  return nearest;
}

function bundleAhead(S, lane){
  const x = LANES[lane];
  for (const o of S.objs){
    if (o.kind !== 'pickup' || o.taken) continue;
    const rel = o.z - S.trackPos;
    if (rel > 0.4 && rel < 30 && Math.abs(o.x - x) < 0.5) return true;
  }
  return false;
}

/* One frame of driving. Returns nothing; calls setLane/toss as needed. */
function drive(S, { setLane, toss, findTarget, landZ }, stats){
  const horizon = Math.max(14, S.speed * 1.7);

  if (S.stun <= 0){
    const here = S.lane;
    const reach = [here - 1, here, here + 1].filter(l => l >= 0 && l <= 2);
    const score = {};
    for (const l of reach) score[l] = clearAhead(S, l, horizon);

    /* commit early: start moving while there is still room to arrive */
    const needMove = score[here] < Math.max(7, S.speed * 0.85);
    if (needMove){
      let best = here;
      for (const l of reach) if (score[l] > score[best] + 0.01) best = l;
      if (best !== here) setLane(best > here ? 1 : -1);
    } else if (S.papers <= 3){
      /* only detour for a bundle into a lane that is at least as clear */
      const want = reach.find(l => l !== here && bundleAhead(S, l) &&
                                   score[l] > Math.max(10, S.speed * 1.1));
      if (want !== undefined) setLane(want > here ? 1 : -1);
    }
  }

  if (S.arm <= 0 && S.stun <= 0){
    for (const side of [-1, 1]){
      const h = findTarget(side);
      if (h && Math.abs(h.z - landZ()) <= 0.7){
        if (S.papers > 0) toss(side);
        else if (stats) stats.ranDry++;
        break;
      }
    }
  }
}

export { LANES, drive, clearAhead, predictX };
