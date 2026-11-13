const fs = require('fs');
const { execFile } = require('child_process');

const DEFAULTS = {
  logFile: '/tmp/svxlink.log',
  confFile: '/etc/svxlink/svxlink.conf',
  replayBytes: 1024 * 1024,
  lastHeardMax: 15,
  processCheckMs: 3 * 1000,
  latencyMs: 60 * 1000,
  latencySamples: 5,
};

function parseIni(text) {
  const sections = {};
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const sec = line.match(/^\[([^\]]+)\]$/);
    if (sec) { cur = sections[sec[1]] = {}; continue; }
    const kv = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1').trim();
  }
  return sections;
}

function readReflectorLogics(confFile) {
  let text;
  try { text = fs.readFileSync(confFile, 'utf8'); } catch { return null; }
  const ini = parseIni(text);
  const active = ((ini.GLOBAL && ini.GLOBAL.LOGICS) || '').split(',').map(s => s.trim()).filter(Boolean);
  return active
    .filter(name => ini[name] && /^reflector$/i.test(ini[name].TYPE || ''))
    .map(name => {
      const s = ini[name];
      const host = (s.HOSTS || s.HOST || s.DNS_DOMAIN || '').split(',')[0].trim();
      return {
        name,
        host: host || null,
        port: s.HOST_PORT || s.PORT || null,
        callsign: s.CALLSIGN || null,
        defaultTg: s.DEFAULT_TG ? parseInt(s.DEFAULT_TG, 10) : null,
        monitorTgs: (s.MONITOR_TGS || '').split(',').map(t => t.trim()).filter(Boolean),
      };
    });
}

const PATTERNS = [
  [/^Connecting to (\S+)/, (r, m, t) => { setStatus(r, 'connecting', t); r.serverError = null; }],
  [/^Connection established to (\S+)/, (r, m, t) => { setStatus(r, 'auth', t); r.server = m[1]; }],
  [/^Error message received from server:\s*(.*)$/i, (r, m, t) => {
    r.serverError = /access denied|auth/i.test(m[1]) ? 'Authentification refusée' : (m[1].trim() || 'Refus du serveur');
    r.lastError = r.serverError;
    setStatus(r, 'down', t);
  }],
  [/^Authentication OK/, (r, m, t) => {
    if (r.everUp) r.reconnects++;
    r.everUp = true;
    setStatus(r, 'up', t);
    r.lastError = null;
  }],
  [/^(Authentication failed|Access denied)(.*)$/i, (r, m, t) => { setStatus(r, 'down', t); r.lastError = 'Authentification refusée'; }],
  [/^Disconnected from (\S+?)(?::\s+(.*))?$/, (r, m, t, api) => {
    api.endTalker(r, t);
    setStatus(r, 'down', t);
    const reason = (m[2] || '').trim();
    if (/locally ordered disconnect/i.test(reason)) {
      r.lastError = r.serverError || null;
    } else {
      r.lastError = reason || 'Déconnecté';
      api.cut(r, t);
    }
    r.serverError = null;
  }],
  [/^Heartbeat timeout/i, (r, m, t) => { r.lastError = 'Plus de réponse du serveur'; }],
  [/^Selecting TG #(\d+)/, (r, m) => { const tg = parseInt(m[1], 10); r.tg = tg > 0 ? tg : null; }],
  [/^Talker start(?: on TG #(\d+))?:\s+(.+)$/, (r, m, t) => {
    const call = m[2].trim();
    r.talker = { call, label: cleanCall(call), tg: m[1] ? parseInt(m[1], 10) : null, since: t, self: isSelf(call, r.callsign) };
  }],
  [/^Talker stop(?: on TG #(\d+))?:\s+(.+)$/, (r, m, t, api) => api.endTalker(r, t)],
];

function cleanCall(call) {
  return call.replace(/\s[HVTUBRSA],?$/, '').trim();
}

function isSelf(call, callsign) {
  if (!callsign) return false;
  const tok = v => v.toUpperCase().split(/[^A-Z0-9-]+/).filter(Boolean);
  const mine = tok(callsign).filter(x => x.length > 1);
  if (!mine.length) return false;
  const theirs = new Set(tok(call));
  return mine.every(x => theirs.has(x));
}

function setStatus(r, status, t) {
  if (r.status !== status) { r.status = status; r.since = t; }
}

function freshReflector(cfg) {
  return { ...cfg, status: 'unknown', since: null, lastError: null, serverError: null, server: null, tg: cfg.defaultTg || null, talker: null, reconnects: 0, everUp: false };
}

function parseStamp(prefix) {
  const s = prefix.replace(/:\s*$/, '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, H, M, S] = m;
    const now = new Date();
    let d = new Date(yyyy ? +yyyy : now.getFullYear(), +mm - 1, +dd, +H, +M, +S);
    if (!yyyy && d.getTime() - now.getTime() > 2 * 86400000) d = new Date(now.getFullYear() - 1, +mm - 1, +dd, +H, +M, +S);
    return d.getTime();
  }
  const ms = Date.parse(s);
  return isNaN(ms) ? null : ms;
}

const TARGET_RE = /^[a-zA-Z0-9][a-zA-Z0-9.:-]{0,252}$/;

function pingTarget(r) {
  let t = r.server || r.host || '';
  const v6 = t.match(/^\[(.+)\]:\d+$/);
  if (v6) t = v6[1];
  else if ((t.match(/:/g) || []).length === 1) t = t.split(':')[0];
  return TARGET_RE.test(t) ? t : null;
}

function pingOnce(target) {
  return new Promise(resolve => {
    execFile('ping', ['-n', '-c', '1', '-W', '2', target], { timeout: 4000 }, (err, stdout) => {
      if (err) return resolve(null);
      const m = String(stdout).match(/time[=<]\s*([\d.]+)\s*ms/);
      resolve(m ? parseFloat(m[1]) : null);
    });
  });
}

function summarizeLatency(l) {
  if (!l || !l.samples.length) return null;
  const ok = l.samples.filter(v => v !== null).sort((a, b) => a - b);
  const lossPct = Math.round(((l.samples.length - ok.length) / l.samples.length) * 100);
  if (!ok.length) return { ms: null, jitterMs: null, lossPct, samples: l.samples.length, target: l.target, at: l.at };
  const mid = Math.floor(ok.length / 2);
  const median = ok.length % 2 ? ok[mid] : (ok[mid - 1] + ok[mid]) / 2;
  return {
    ms: Math.round(median),
    jitterMs: ok.length >= 2 ? Math.round(ok[ok.length - 1] - ok[0]) : null,
    lossPct,
    samples: l.samples.length,
    target: l.target,
    at: l.at,
  };
}

const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;
const NB_HEURES = 24;

function mediane(v) {
  if (!v.length) return null;
  const t = [...v].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
}

function couper(liste, limite) {
  let i = 0;
  while (i < liste.length && liste[i][0] < limite) i++;
  if (i) liste.splice(0, i);
}

function resumerQualite(echantillons, coupures, etats, statut, depuisLog, now) {
  const debutHeures = Math.floor(now / HEURE) * HEURE - (NB_HEURES - 1) * HEURE;
  const seaux = Array.from({ length: NB_HEURES }, () => []);
  const ok = [];
  let perdus = 0;
  for (const [t, ms] of echantillons) {
    if (t < now - JOUR) continue;
    if (ms === null) perdus++; else ok.push(ms);
    const i = Math.floor((t - debutHeures) / HEURE);
    if (i >= 0 && i < NB_HEURES) seaux[i].push(ms);
  }
  const heures = seaux.map(b => {
    if (!b.length) return null;
    const v = b.filter(x => x !== null);
    return { ms: v.length ? Math.round(mediane(v)) : null, pertes: Math.round(((b.length - v.length) / b.length) * 100) };
  });
  const total = ok.length + perdus;

  const debutDispo = Math.max(now - JOUR, etats.length ? etats[0][0] : now);
  let dispo = null;
  if (!etats.length) {
    dispo = statut === 'up' && depuisLog ? 100 : null;
  } else if (now - debutDispo > 60 * 1000) {
    let actif = false, dernier = debutDispo, enLigne = 0;
    for (const [t, up] of etats) {
      if (t <= debutDispo) { actif = up; continue; }
      if (actif) enLigne += t - dernier;
      dernier = t;
      actif = up;
    }
    if (actif) enLigne += now - dernier;
    dispo = Math.round((enLigne / (now - debutDispo)) * 1000) / 10;
  }

  return {
    debutHeures,
    heures,
    ms: ok.length ? Math.round(mediane(ok)) : null,
    pertes: total ? Math.round((perdus / total) * 100) : null,
    mesures: total,
    depuis: echantillons.length ? Math.max(now - JOUR, echantillons[0][0]) : null,
    coupures: coupures.filter(t => t >= now - JOUR).length,
    dispo,
  };
}

function resumerActivite(passages, depuisLog, now) {
  const debutHeures = Math.floor(now / HEURE) * HEURE - (NB_HEURES - 1) * HEURE;
  const nombre = new Array(NB_HEURES).fill(0);
  const secondes = new Array(NB_HEURES).fill(0);
  const parNode = new Map();
  let total = 0, duree = 0;
  for (const p of passages) {
    if (p.fin < now - JOUR) continue;
    const s = Math.max(0, Math.round((p.fin - p.debut) / 1000));
    total++;
    duree += s;
    const i = Math.max(0, Math.floor((p.debut - debutHeures) / HEURE));
    if (i < NB_HEURES) { nombre[i]++; secondes[i] += s; }
    const n = parNode.get(p.label) || { label: p.label, self: p.self, passages: 0, secondes: 0 };
    n.passages++;
    n.secondes += s;
    parNode.set(p.label, n);
  }
  let pic = -1;
  secondes.forEach((v, i) => { if (v > 0 && (pic < 0 || v > secondes[pic])) pic = i; });
  return {
    debutHeures,
    nombre,
    secondes,
    passages: total,
    duree,
    nodes: parNode.size,
    pic: pic < 0 ? null : debutHeures + pic * HEURE,
    top: [...parNode.values()].sort((a, b) => b.secondes - a.secondes).slice(0, 4),
    depuis: depuisLog ? Math.max(now - JOUR, depuisLog) : null,
  };
}

function createReflectorWatcher(options = {}) {
  const opt = { ...DEFAULTS, ...options };
  const onChange = typeof opt.onChange === 'function' ? opt.onChange : () => {};

  let confMtime = 0;
  let reflectors = [];
  let byName = {};
  let lineRe = null;
  let lastHeard = [];
  let running = null;
  let offset = 0;
  let partial = '';
  let emitTimer = null;
  const latency = {};
  let latencyBusy = false;
  const historiqueLatence = {};
  let passages = {};
  let coupures = {};
  let etats = {};
  let depuisLog = null;

  const api = {
    endTalker(r, t) {
      if (!r.talker) return;
      const start = r.talker.since;
      lastHeard.unshift({
        call: r.talker.call,
        label: r.talker.label,
        tg: r.talker.tg,
        reflector: r.name,
        self: r.talker.self,
        start,
        end: t,
        durationS: start && t ? Math.max(0, Math.round((t - start) / 1000)) : null,
      });
      if (lastHeard.length > opt.lastHeardMax) lastHeard.length = opt.lastHeardMax;
      if (start && t && t >= start) (passages[r.name] = passages[r.name] || []).push({ label: r.talker.label, self: r.talker.self, debut: start, fin: t });
      r.talker = null;
    },
    cut(r, t) {
      if (t) (coupures[r.name] = coupures[r.name] || []).push(t);
    },
    mark(r, t) {
      if (t) (etats[r.name] = etats[r.name] || []).push([t, r.status === 'up']);
    },
  };

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function loadConf(force) {
    let mtime = 0;
    try { mtime = fs.statSync(opt.confFile).mtimeMs; } catch {}
    if (!force && mtime === confMtime) return false;
    confMtime = mtime;
    const logics = readReflectorLogics(opt.confFile) || [{ name: 'ReflectorLogic', host: null, port: null, callsign: null, defaultTg: null, monitorTgs: [] }];
    const prev = byName;
    reflectors = logics.map(cfg => (prev[cfg.name] ? { ...prev[cfg.name], ...cfg } : freshReflector(cfg)));
    byName = Object.fromEntries(reflectors.map(r => [r.name, r]));
    lineRe = reflectors.length
      ? new RegExp(`^(.*?)(?:^|\\s|:\\s)(${reflectors.map(r => escapeRe(r.name)).join('|')}):\\s(.*)$`)
      : null;
    return true;
  }

  function handleLine(line, live) {
    const start = line.match(/Starting logic:\s+(\S+)/);
    if (start && byName[start[1]]) {
      const r = byName[start[1]];
      Object.assign(r, freshReflector(r), { status: 'connecting' });
      const ts = parseStamp(line.slice(0, start.index)) || (live ? Date.now() : null);
      if (ts && !depuisLog) depuisLog = ts;
      api.mark(r, ts);
      return true;
    }
    if (!lineRe) return false;
    const m = line.match(lineRe);
    if (!m) return false;
    const r = byName[m[2]];
    const msg = m[3].trim();
    const t = parseStamp(m[1]) || (live ? Date.now() : null);
    if (t && !depuisLog) depuisLog = t;
    for (const [re, fn] of PATTERNS) {
      const pm = msg.match(re);
      if (pm) {
        const avant = r.status;
        fn(r, pm, t, api);
        if (r.status !== avant) api.mark(r, t);
        return true;
      }
    }
    return false;
  }

  function scheduleEmit() {
    if (emitTimer) return;
    emitTimer = setTimeout(() => { emitTimer = null; onChange(getState()); }, 100);
  }

  function readChunk(from, to) {
    if (to <= from) return '';
    const fd = fs.openSync(opt.logFile, 'r');
    try {
      const buf = Buffer.alloc(to - from);
      fs.readSync(fd, buf, 0, buf.length, from);
      return buf.toString('utf8');
    } finally { fs.closeSync(fd); }
  }

  function resetAll() {
    reflectors.forEach(r => Object.assign(r, freshReflector(r)));
    lastHeard = [];
    passages = {};
    coupures = {};
    etats = {};
    depuisLog = null;
  }

  function replay() {
    resetAll();
    partial = '';
    let size = 0;
    try { size = fs.statSync(opt.logFile).size; } catch { offset = 0; return; }
    const from = Math.max(0, size - opt.replayBytes);
    let text = '';
    try { text = readChunk(from, size); } catch {}
    const lines = text.split('\n');
    if (from > 0) lines.shift();
    if (!text.endsWith('\n')) partial = lines.pop() || '';
    lines.forEach(l => handleLine(l, false));
    offset = size;
  }

  function onLogChange(curr, prev) {
    let changed = loadConf(false);
    if (changed) { replay(); scheduleEmit(); return; }

    if (curr.size < offset || curr.ino !== prev.ino) {
      offset = 0; partial = ''; resetAll(); changed = true;
    }
    if (curr.size > offset) {
      let text = '';
      try { text = readChunk(offset, curr.size); } catch { return; }
      offset = curr.size;
      const lines = (partial + text).split('\n');
      partial = lines.pop() || '';
      for (const l of lines) if (handleLine(l, true)) changed = true;
    }
    if (changed) scheduleEmit();
  }

  function checkProcess() {
    execFile('pidof', ['svxlink'], err => {
      const now = !err;
      if (now !== running) { running = now; scheduleEmit(); }
    });
  }

  async function measureLatency() {
    if (latencyBusy || running === false) return;
    latencyBusy = true;
    try {
      for (const r of reflectors) {
        const target = pingTarget(r);
        if (!target) continue;
        const ms = await pingOnce(target);
        let l = latency[r.name];
        if (!l || l.target !== target) l = latency[r.name] = { target, samples: [], at: 0 };
        l.samples.push(ms);
        if (l.samples.length > opt.latencySamples) l.samples.shift();
        l.at = Date.now();
        const h = historiqueLatence[r.name] = historiqueLatence[r.name] || [];
        h.push([l.at, ms]);
        couper(h, l.at - JOUR);
      }
      scheduleEmit();
    } finally {
      latencyBusy = false;
    }
  }

  function getState() {
    const now = Date.now();
    return {
      running,
      reflectors: reflectors.map(({ everUp, serverError, ...r }) => {
        const p = passages[r.name] || [];
        while (p.length && p[0].fin < now - JOUR) p.shift();
        const c = coupures[r.name] || [];
        while (c.length && c[0] < now - JOUR) c.shift();
        const e = etats[r.name] || [];
        while (e.length > 2 && e[1][0] < now - JOUR) e.shift();
        return {
          ...r,
          status: running === false ? 'stopped' : r.status,
          talker: running === false ? null : r.talker,
          latency: summarizeLatency(latency[r.name]),
          qualite: resumerQualite(historiqueLatence[r.name] || [], c, e, r.status, depuisLog, now),
          activite: resumerActivite(p, depuisLog, now),
        };
      }),
      lastHeard,
      at: Date.now(),
    };
  }

  loadConf(true);
  replay();
  checkProcess();
  fs.watchFile(opt.logFile, { interval: 250 }, onLogChange);
  const procTimer = setInterval(checkProcess, opt.processCheckMs);
  const confTimer = setInterval(() => { if (loadConf(false)) { replay(); scheduleEmit(); } }, 15 * 1000);
  const latencyFirst = setTimeout(measureLatency, 5000);
  const latencyTimer = setInterval(measureLatency, opt.latencyMs);

  return {
    getState,
    stop() {
      fs.unwatchFile(opt.logFile, onLogChange);
      clearInterval(procTimer);
      clearInterval(confTimer);
      clearTimeout(latencyFirst);
      clearInterval(latencyTimer);
      clearTimeout(emitTimer);
    },
  };
}

module.exports = { createReflectorWatcher, readReflectorLogics, PATTERNS };