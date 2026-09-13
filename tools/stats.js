/* Prints the funnel from Workers Analytics Engine. Plain Node, no packages.
 *
 *   CF_ACCOUNT_ID=... CF_API_TOKEN=... node tools/stats.js [days]
 *
 * The token needs one permission: Account -> Account Analytics -> Read.
 * Make it at dash.cloudflare.com/profile/api-tokens -> Create Token ->
 * Custom token. Account ID is on the Workers & Pages overview page.
 *
 * Column map (must match worker/index.js):
 *   blob1 e   blob2 session   blob3 platform   blob4 crashes   blob5 mode
 *   double1 t  double2 level  double3 retry  double4 lives  double5 papers
 *   double6 delivered  double7 need  double8 targets  double9 score
 *   double10 perfect  double11 hit  double12 early  double13 late  double14 miss
 *   double15 crashN  double16 progress  double17 secs  double18 w  double19 h
 */
const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN   = process.env.CF_API_TOKEN;
const DAYS    = Number(process.argv[2] || 7);
const DATASET = 'paperswag_events';

if (!ACCOUNT || !TOKEN){
  console.error('Set CF_ACCOUNT_ID and CF_API_TOKEN. See the comment at the top of this file.');
  process.exit(1);
}

async function sql(q){
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/analytics_engine/sql`, {
    method: 'POST', headers: { authorization: 'Bearer ' + TOKEN }, body: q
  });
  if (!r.ok) throw new Error(r.status + ' ' + await r.text());
  return (await r.json()).data;
}

const since = `timestamp > NOW() - INTERVAL '${DAYS}' DAY`;
const T = `FROM ${DATASET} WHERE ${since}`;

const pad = (s, n) => String(s).padStart(n);

(async () => {
  console.log(`\nPaper Round — last ${DAYS} day(s)\n`);

  /* --- sessions and platforms --- */
  const sessions = await sql(`SELECT blob3 AS platform, COUNT() AS n ${T} AND blob1='session_start' GROUP BY platform ORDER BY n DESC`);
  const total = sessions.reduce((a, r) => a + Number(r.n), 0);
  console.log(`Sessions: ${total}` + (sessions.length ? '  (' + sessions.map(r => `${r.platform} ${r.n}`).join(', ') + ')' : ''));

  /* --- the funnel: how many distinct sessions reached each level --- */
  const reached = await sql(`SELECT double2 AS level, COUNT() AS n ${T} AND blob1='level_start' AND double3=0 GROUP BY level ORDER BY level`);
  const cleared = await sql(`SELECT double2 AS level, COUNT() AS n ${T} AND blob1='level_clear' GROUP BY level ORDER BY level`);
  const clearedBy = Object.fromEntries(cleared.map(r => [r.level, Number(r.n)]));
  const started = Number((reached.find(r => Number(r.level) === 1) || {}).n || 0);

  console.log('\n  level  reached  cleared   % of starters');
  for (const r of reached){
    const n = Number(r.n), c = clearedBy[r.level] || 0;
    const pct = started ? Math.round(100 * n / started) : 0;
    console.log(`  ${pad(r.level, 5)}  ${pad(n, 7)}  ${pad(c, 7)}   ${pad(pct, 3)}%` + (Number(r.level) === 2 ? '   <-- the question' : ''));
  }
  if (!reached.length) console.log('  (no level_start events yet)');

  /* --- retries per level --- */
  const retries = await sql(`SELECT double2 AS level, SUM(double3) AS retries, COUNT() AS starts ${T} AND blob1='level_start' GROUP BY level ORDER BY level`);
  if (retries.length){
    console.log('\n  level  starts  retries');
    for (const r of retries) console.log(`  ${pad(r.level, 5)}  ${pad(r.starts, 6)}  ${pad(r.retries, 7)}`);
  }

  /* --- throw quality, all levels --- */
  const th = await sql(`SELECT SUM(double10) p, SUM(double11) h, SUM(double12) e, SUM(double13) l, SUM(double14) m ${T} AND (blob1='level_clear' OR blob1='level_fail')`);
  if (th.length){
    const r = th[0], tot = ['p','h','e','l','m'].reduce((a, k) => a + Number(r[k] || 0), 0);
    if (tot){
      const pc = k => pad(Math.round(100 * Number(r[k] || 0) / tot), 3) + '%';
      console.log(`\nThrows: ${tot}   perfect ${pc('p')}  hit ${pc('h')}  early ${pc('e')}  late ${pc('l')}  no-house ${pc('m')}`);
    }
  }

  /* --- what kills people --- */
  const cr = await sql(`SELECT blob4 AS crashes ${T} AND (blob1='level_clear' OR blob1='level_fail') AND blob4 != ''`);
  const byType = {};
  for (const r of cr) for (const part of String(r.crashes).split(',')){
    const [k, v] = part.split(':'); if (k) byType[k] = (byType[k] || 0) + Number(v || 0);
  }
  const ranked = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  if (ranked.length) console.log('Crashes: ' + ranked.map(([k, v]) => `${k} ${v}`).join(', '));

  /* --- where they quit: last background event per session, by level and progress --- */
  const quit = await sql(`SELECT double2 AS level, quantileWeighted(0.5)(double16, _sample_interval) AS median_progress, COUNT() AS n ${T} AND blob1='background' AND blob5='play' GROUP BY level ORDER BY level`);
  if (quit.length){
    console.log('\nBackgrounded mid-street (phone locked / app switched):');
    console.log('  level  times  median % through street');
    for (const r of quit) console.log(`  ${pad(r.level, 5)}  ${pad(r.n, 5)}  ${pad(Math.round(Number(r.median_progress) || 0), 5)}%`);
  }

  /* --- session length --- */
  const len = await sql(`SELECT quantileWeighted(0.5)(double1, _sample_interval) AS med, MAX(double1) AS mx ${T} AND blob1 IN ('level_clear','level_fail','game_over','background')`);
  if (len.length && len[0].med != null){
    console.log(`\nSession length: median ${Math.round(Number(len[0].med))}s, longest ${Math.round(Number(len[0].mx))}s`);
  }
  console.log('');
})().catch(e => { console.error('query failed:', e.message); process.exit(1); });
