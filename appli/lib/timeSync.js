const { execFile } = require('child_process');

const CACHE_MS = 20 * 1000;
const DRIFT_S = 0.5;
const STALE_S = 2 * 3600;

let cache = null;
let cacheAt = 0;

function runChronyc() {
  return new Promise(resolve => {
    execFile('chronyc', ['-c', 'tracking'], { timeout: 3000 }, (err, stdout) => {
      resolve(err ? null : String(stdout).trim());
    });
  });
}

function parseTracking(line) {
  const f = line.split(',');
  if (f.length < 14) return null;
  return {
    server: f[1] || null,
    stratum: parseInt(f[2], 10) || 0,
    refTime: parseFloat(f[3]) || 0,
    correction: parseFloat(f[4]) || 0,
    lastOffset: parseFloat(f[5]) || 0,
    updateInterval: parseFloat(f[12]) || 0,
    leap: f[13],
  };
}

async function getTimeSync() {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;

  const out = await runChronyc();
  const t = out ? parseTracking(out.split('\n')[0]) : null;
  let result;

  if (!t) {
    result = { state: 'unknown' };
  } else {
    const ageS = t.refTime > 0 ? Math.max(0, Date.now() / 1000 - t.refTime) : null;
    const offsetS = Math.abs(t.correction);
    let state;
    if (/not synchronised/i.test(t.leap) || t.stratum === 0 || !t.refTime) state = 'nosync';
    else if (ageS !== null && ageS > STALE_S) state = 'stale';
    else if (offsetS > DRIFT_S) state = 'drift';
    else state = 'ok';

    result = {
      state,
      server: t.server,
      stratum: t.stratum,
      offsetMs: Math.round(t.correction * 1000 * 10) / 10,
      lastSyncAgoS: ageS !== null ? Math.round(ageS) : null,
      leap: t.leap,
    };
  }

  cache = result;
  cacheAt = Date.now();
  return result;
}

module.exports = { getTimeSync };