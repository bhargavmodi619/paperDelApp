/* The edge side of the beacon. This is the one server function the project
 * has, and it is deliberately tiny: accept a small JSON event on POST /e,
 * write one row to Workers Analytics Engine, return 204. Every other request
 * falls through to the static files in dist/.
 *
 * claude.md section 5 asked for "static deploy, no server functions" AND for
 * per-level events. Those conflict: Cloudflare Web Analytics has no custom
 * events on the free plan. This is the smallest thing that satisfies the
 * second requirement — no database, no third party, same account.
 *
 * Nothing personal is stored. The session id is a random string minted on
 * page load; there are no cookies, no IPs, no user agents.
 */

const MAX_BODY = 2048;
const EVENTS = new Set(['session_start','level_start','level_clear','level_fail',
                        'game_over','background','foreground']);

/* string fields go in blobs, numbers in doubles; fixed positions so SQL is
   readable. Anything not listed is dropped. */
const BLOBS   = ['e','s','platform','crashes','mode'];
const DOUBLES = ['t','level','retry','lives','papers','delivered','need','targets','score',
                 'perfect','hit','early','late','miss','crashN','progress','secs','w','h','dpr'];

function clean(str, n){ return String(str).slice(0, n); }

export default {
  async fetch(request, env){
    const url = new URL(request.url);

    if (url.pathname === '/e'){
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      let ev;
      try {
        const text = await request.text();
        if (text.length > MAX_BODY) return new Response(null, { status: 413 });
        ev = JSON.parse(text);
      } catch { return new Response(null, { status: 400 }); }

      if (!ev || typeof ev !== 'object' || !EVENTS.has(ev.e) || typeof ev.s !== 'string'){
        return new Response(null, { status: 400 });
      }

      if (env.EVENTS){
        const blobs   = BLOBS.map(k => ev[k] == null ? '' : clean(ev[k], 200));
        const doubles = DOUBLES.map(k => Number.isFinite(+ev[k]) ? +ev[k] : 0);
        env.EVENTS.writeDataPoint({ blobs, doubles, indexes: [clean(ev.s, 32)] });
      }
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    }

    return env.ASSETS.fetch(request);
  }
};
