const fs = require('fs')
const os = require('os')
const dns = require('dns').promises
const { execFile } = require('child_process')
const { getTimeSync } = require('./timeSync')

const SERVICES = [
  ['weblink-mdns', 'Alias weblink.local'],
  ['weblink-wifi-surveillance', 'Surveillance Wifi'],
  ['avahi-daemon', 'Avahi'],
  ['NetworkManager', 'NetworkManager'],
  ['chrony', 'Synchro heure'],
]

const LIBELLES_IFACE = { end0: 'Rj45', eth0: 'Rj45', wlan0: 'Wifi', uap0: "Point d'accès", wg0: 'Vpn' }

const lancer = (cmd, args, timeout = 6000) => new Promise(resolve => {
  execFile(cmd, args, { timeout, env: Object.assign({}, process.env, { LC_ALL: 'C' }) }, (err, stdout) => resolve({ ok: !err, out: String(stdout || '').trim() }))
})

const lire = f => fs.promises.readFile(f, 'utf8').catch(() => '')

const EVENEMENTS = /(error|erreur|warning|fail|denied|refused|timeout|time out|could not|unable|connecting to|connection established|authentication|disconnected|starting logic|heartbeat|reconnect|no route|unreachable|cannot)/i

async function journalSvxlink(fichier) {
  let texte = ''
  try {
    const { size } = await fs.promises.stat(fichier)
    const debut = Math.max(0, size - 1024 * 1024)
    const fd = await fs.promises.open(fichier, 'r')
    try {
      const buf = Buffer.alloc(size - debut)
      await fd.read(buf, 0, buf.length, debut)
      texte = buf.toString('utf8')
    } finally {
      await fd.close()
    }
  } catch (err) {
    return { existe: false, fin: '', evenements: '' }
  }
  const lignes = texte.split('\n').filter(l => l.trim())
  return {
    existe: true,
    fin: lignes.slice(-120).join('\n'),
    evenements: lignes.filter(l => EVENEMENTS.test(l)).slice(-40).join('\n'),
  }
}

const deux = n => String(n).padStart(2, '0')

const dateFr = d => `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} ${deux(d.getHours())}:${deux(d.getMinutes())}`

const duree = s => {
  const j = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return [j ? `${j} j` : '', h ? `${h} h` : '', `${m} min`].filter(Boolean).join(' ')
}

const octets = n => (n >= 1073741824 ? `${(n / 1073741824).toFixed(2).replace('.', ',')} Go` : `${Math.round(n / 1048576)} Mo`)

const ETATS_REF = { up: 'connecté', down: 'déconnecté', auth: 'authentification', connecting: 'connexion', stopped: 'arrêté', unknown: 'inconnu' }

const ETATS_HEURE = { ok: 'synchronisée', drift: 'rattrapage en cours', stale: 'synchro ancienne', nosync: 'aucune source', unknown: 'inconnue' }

const ligne = (cle, val) => `${cle.padEnd(22, ' ')}${val}`

async function memoire() {
  const t = await lire('/proc/meminfo')
  const v = k => { const m = new RegExp(`^${k}:\\s+(\\d+)`, 'm').exec(t); return m ? parseInt(m[1], 10) * 1024 : 0 }
  const total = v('MemTotal')
  const dispo = v('MemAvailable') || v('MemFree') + v('Cached') + v('Buffers')
  return total ? { total, utilise: total - dispo, pct: Math.round(((total - dispo) / total) * 100) } : null
}

async function temperature() {
  const t = parseInt(await lire('/sys/devices/virtual/thermal/thermal_zone0/temp'), 10)
  return isNaN(t) ? null : Math.round(t / 1000)
}

async function stockage() {
  const [r, ri] = await Promise.all([lancer('df', ['-B1', '/']), lancer('df', ['-Pi', '/'])])
  const p = (r.out.split('\n')[1] || '').split(/\s+/)
  const pi = (ri.out.split('\n')[1] || '').split(/\s+/)
  const total = parseInt(p[1], 10)
  const utilise = parseInt(p[2], 10)
  const inodes = parseInt(pi[1], 10)
  const inodesLibres = parseInt(pi[3], 10)
  return total ? { total, utilise, pct: Math.round((utilise / total) * 100), inodes, inodesLibres } : null
}

async function ping(cible) {
  const r = await lancer('ping', ['-n', '-c', '2', '-W', '2', cible], 8000)
  const m = /= [\d.]+\/([\d.]+)\//.exec(r.out)
  const perte = /(\d+)% packet loss/.exec(r.out)
  return { ok: r.ok, ms: m ? Math.round(parseFloat(m[1])) : null, perte: perte ? parseInt(perte[1], 10) : 100 }
}

async function resoudre(nom) {
  try {
    const debut = Date.now()
    const r = await Promise.race([dns.lookup(nom), new Promise((_, rej) => setTimeout(() => rej(new Error('délai')), 4000))])
    return { ok: true, ip: r.address, ms: Date.now() - debut }
  } catch (err) {
    return { ok: false }
  }
}

async function routeParDefaut() {
  const r = await lancer('ip', ['-4', 'route', 'show', 'default'])
  const m = /default via (\S+) dev (\S+)/.exec(r.out)
  return m ? { via: m[1], dev: m[2] } : null
}

async function wifi() {
  const r = await lancer('nmcli', ['-t', '-f', 'ACTIVE,SSID,SIGNAL,CHAN', 'device', 'wifi', 'list', 'ifname', 'wlan0', '--rescan', 'no'])
  const actif = r.out.split('\n').map(l => l.split(/(?<!\\):/)).find(f => f[0] === 'yes')
  return actif ? { ssid: actif[1].replace(/\\:/g, ':'), signal: parseInt(actif[2], 10), canal: actif[3] } : null
}

async function services() {
  const etats = await Promise.all(SERVICES.map(([u]) => lancer('systemctl', ['is-active', u], 4000)))
  const enEchec = await lancer('systemctl', ['--failed', '--no-legend', '--plain'], 4000)
  return {
    liste: SERVICES.map(([u, nom], i) => ({ unite: u, nom, etat: etats[i].out || 'inconnu' })),
    echecs: enEchec.out.split('\n').map(l => l.trim().split(/\s+/)[0]).filter(Boolean),
  }
}

async function construireDiag({ version, configuration, reflecteurs }) {
  const maintenant = new Date()
  const [mem, temp, disque, route, wf, svc, heure, dnsTest, pingNet, sa818, journal, erreurs, reseau, serviceSvx] = await Promise.all([
    memoire(), temperature(), stockage(), routeParDefaut(), wifi(), services(),
    getTimeSync().catch(() => null),
    resoudre('www.websdrbordeaux.fr'),
    ping('8.8.8.8'),
    lancer('systemctl', ['is-active', 'weblink-sa818'], 4000),
    journalSvxlink('/tmp/svxlink.log'),
    lancer('journalctl', ['-p', 'err', '-n', '30', '--no-pager', '-o', 'short', '--since', '-24h'], 8000),
    lire('/etc/weblink/network'),
    lancer('journalctl', ['-u', 'weblink-svxlink', '-n', '30', '--no-pager', '-o', 'short'], 6000),
  ])

  const conf = configuration || {}
  const etatRef = reflecteurs && Array.isArray(reflecteurs.reflectors) ? reflecteurs : { reflectors: [], running: null }
  const ref = etatRef.reflectors.find(r => r.status === 'up') || etatRef.reflectors[0] || null
  const bilan = []
  const ajouter = (niveau, texte) => bilan.push({ niveau, texte })

  if (!route) ajouter('probleme', 'Aucune route vers internet')
  else if (!pingNet.ok) ajouter('probleme', `Internet injoignable par ${LIBELLES_IFACE[route.dev] || route.dev}`)
  else ajouter(pingNet.perte > 0 ? 'attention' : 'ok', `Internet joignable par ${LIBELLES_IFACE[route.dev] || route.dev} (${pingNet.ms} ms${pingNet.perte ? `, ${pingNet.perte} % perdus` : ''})`)
  ajouter(dnsTest.ok ? 'ok' : 'probleme', dnsTest.ok ? 'Résolution des noms correcte' : 'Résolution des noms en échec (Dns)')

  if (etatRef.running === false) ajouter('probleme', 'SvxLink ne tourne pas')
  else if (!ref) ajouter('attention', 'Aucun réflecteur configuré')
  else if (ref.status === 'up') {
    const lat = ref.latency
    const lent = lat && (lat.ms === null || lat.ms >= 200 || lat.lossPct >= 40)
    ajouter(lent ? 'attention' : 'ok', `Réflecteur connecté${lat && lat.ms !== null ? ` (${lat.ms} ms)` : ''}`)
    if (ref.qualite && ref.qualite.coupures > 2) ajouter('attention', `${ref.qualite.coupures} coupures avec le réflecteur sur 24 h`)
  } else ajouter('probleme', `Réflecteur ${ref.status === 'down' ? 'déconnecté' : 'en connexion'}${ref.lastError ? ` : ${ref.lastError}` : ''}`)

  if (temp !== null) ajouter(temp >= 70 ? 'probleme' : temp >= 60 ? 'attention' : 'ok', `Température ${temp} °C`)
  if (disque) ajouter(disque.pct >= 90 ? 'probleme' : disque.pct >= 80 ? 'attention' : 'ok', `Carte micro Sd remplie à ${disque.pct} %`)
  if (disque && !isNaN(disque.inodesLibres) && disque.inodesLibres < 4096) ajouter(disque.inodesLibres < 512 ? 'probleme' : 'attention', `Carte presque saturée en fichiers : ${disque.inodesLibres} inodes libres`)
  if (mem) ajouter(mem.pct >= 90 ? 'attention' : 'ok', `Mémoire utilisée à ${mem.pct} %`)
  if (heure) ajouter(heure.state === 'ok' ? 'ok' : 'attention', heure.state === 'ok' ? 'Heure synchronisée' : 'Heure pas encore synchronisée')
  const arretes = svc.liste.filter(s => s.etat !== 'active').map(s => s.nom)
  if (svc.echecs.length) ajouter('probleme', `Services en échec : ${svc.echecs.join(', ')}`)
  if (arretes.length) ajouter('attention', `Services arrêtés : ${arretes.join(', ')}`)
  if (!svc.echecs.length && !arretes.length) ajouter('ok', 'Services WebLink actifs')

  const [nomVersion, dateVersion, idVersion] = (version || '').split('\n').map(l => l.trim())
  const ifaces = Object.entries(os.networkInterfaces())
    .map(([n, l]) => [n, (l || []).find(a => a.family === 'IPv4' || a.family === 4)])
    .filter(([n, a]) => a && !a.internal)
    .map(([n, a]) => `${LIBELLES_IFACE[n] || n} ${a.address}`)

  const symbole = { ok: '[ok]', attention: '[!]', probleme: '[!!]' }
  const L = []
  L.push(`Diagnostic WebLink · ${os.hostname()} · ${dateFr(maintenant)}`)
  L.push('')
  L.push(ligne('Version', `${nomVersion || '?'}${idVersion ? ` (${idVersion} du ${dateVersion})` : ''}`))
  L.push(ligne('Indicatif', [conf.callsign1, conf.departement1].filter(Boolean).join(' · ') || '--'))
  L.push(ligne('Réseau WebLink', reseau.trim() || '--'))
  L.push(ligne('Allumé depuis', duree(os.uptime())))
  L.push('')
  L.push('== Bilan ==')
  bilan.forEach(b => L.push(`${symbole[b.niveau].padEnd(6, ' ')}${b.texte}`))
  L.push('')
  L.push('== Matériel ==')
  L.push(ligne('Température', temp === null ? '--' : `${temp} °C`))
  L.push(ligne('Mémoire', mem ? `${octets(mem.utilise)} sur ${octets(mem.total)} (${mem.pct} %)` : '--'))
  L.push(ligne('Charge', os.loadavg().map(v => v.toFixed(2).replace('.', ',')).join(' / ')))
  L.push(ligne('Micro Sd', disque ? `${octets(disque.utilise)} sur ${octets(disque.total)} (${disque.pct} %)` : '--'))
  L.push(ligne('Inodes libres', disque && !isNaN(disque.inodesLibres) ? `${disque.inodesLibres} sur ${disque.inodes}` : '--'))
  L.push(ligne('Sa818', sa818.out === 'active' ? 'supervision active' : 'supervision arrêtée'))
  L.push('')
  L.push('== Réseau ==')
  L.push(ligne('Sortie', route ? `${LIBELLES_IFACE[route.dev] || route.dev} via ${route.via}` : 'aucune'))
  L.push(ligne('Adresses', ifaces.join(' · ') || '--'))
  L.push(ligne('Wifi', wf ? `${wf.ssid || 'masqué'} · signal ${wf.signal} % · canal ${wf.canal}` : 'non connecté'))
  L.push(ligne('Ping internet', pingNet.ms !== null ? `${pingNet.ms} ms · ${pingNet.perte} % perdus` : 'sans réponse'))
  L.push(ligne('Dns', dnsTest.ok ? `www.websdrbordeaux.fr -> ${dnsTest.ip} (${dnsTest.ms} ms)` : 'échec'))
  L.push('')
  L.push('== SvxLink ==')
  L.push(ligne('Processus', etatRef.running === false ? 'arrêté' : etatRef.running ? 'en marche' : 'inconnu'))
  etatRef.reflectors.forEach(r => {
    L.push(ligne(r.name, `${ETATS_REF[r.status] || r.status}${r.host ? ` · ${r.host}${r.port ? `:${r.port}` : ''}` : ''}${r.tg ? ` · TG ${r.tg}` : ''}`))
    if (r.latency) L.push(ligne('  Latence', r.latency.ms === null ? 'sans réponse' : `${r.latency.ms} ms · gigue ${r.latency.jitterMs ?? '--'} ms · ${r.latency.lossPct} % perdus`))
    if (r.qualite) L.push(ligne('  Sur 24 h', `médiane ${r.qualite.ms ?? '--'} ms · ${r.qualite.coupures} coupure(s) · disponibilité ${r.qualite.dispo === null ? '--' : String(r.qualite.dispo).replace('.', ',')} %`))
    if (r.reconnects) L.push(ligne('  Reconnexions', String(r.reconnects)))
    if (r.lastError) L.push(ligne('  Dernière erreur', r.lastError))
  })
  L.push('')
  L.push('== Services ==')
  svc.liste.forEach(s => L.push(ligne(s.nom, s.etat)))
  L.push(ligne('En échec', svc.echecs.join(', ') || 'aucun'))
  L.push('')
  L.push('== Heure ==')
  L.push(ligne('Synchro', heure ? `${ETATS_HEURE[heure.state] || heure.state}${heure.server ? ` · ${heure.server}` : ''}${heure.offsetMs != null ? ` · écart ${heure.offsetMs} ms` : ''}` : '--'))
  L.push('')
  L.push('== SvxLink : connexions et erreurs (40 derniers événements) ==')
  L.push(!journal.existe ? 'journal /tmp/svxlink.log absent' : journal.evenements || 'aucun')
  L.push('')
  L.push('== Journal SvxLink (120 dernières lignes) ==')
  L.push(!journal.existe ? 'journal /tmp/svxlink.log absent' : journal.fin || '(vide)')
  if (etatRef.running === false || !journal.existe) {
    L.push('')
    L.push('== Démarrage SvxLink (service weblink-svxlink) ==')
    L.push(serviceSvx.out || 'aucune trace')
  }
  L.push('')
  L.push('== Erreurs système sur 24 h ==')
  L.push(erreurs.out && !/^-- No entries --$/.test(erreurs.out) ? erreurs.out : 'aucune')

  return {
    at: maintenant.getTime(),
    hotspot: os.hostname(),
    version: idVersion || nomVersion || null,
    indicatif: conf.callsign1 || null,
    bilan,
    texte: L.join('\n'),
  }
}

module.exports = { construireDiag }
