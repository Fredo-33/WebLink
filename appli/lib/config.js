const path = require('path')
const childProcess = require('child_process')
const promisify = require('util.promisify')
const exec = promisify(childProcess.exec)
const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)
const chmod = promisify(require('fs').chmod)
const fs = require('fs')
const ini = require('ini')
const { dir } = require('../config')

const dedent = require('dedent-js')

module.exports.get = function get() {
  return readFile(path.join(dir, 'config.json'), 'utf8').then(conf =>
    JSON.parse(conf)
  )
}

module.exports.patch = async function patch(values) {
  const file = path.join(dir, 'config.json')
  const conf = JSON.parse(await readFile(file, 'utf8'))
  Object.assign(conf, values)
  await writeFile(file, JSON.stringify(conf, null, 2))
  await exec('sync').catch(() => {})
  return conf
}

module.exports.set = async function set(config) {
  const callsign1 = config.callsign1 ? config.callsign1.toUpperCase() : ''
  const band_type1 = config.band_type1 ? config.band_type1.toUpperCase() : ''
  const departement1 = config.departement1 ? config.departement1.toUpperCase() : ''

  const id_long = config.id_long
  const id_short = config.id_short

  var Rx_ctcss = config.ctcss_fq
  var Tx_ctcss = config.ctcss_fqt
  var Rx_dcs = config.dcs_fq
  var Tx_dcs = config.dcs_fqt
  var tx_818 = config.tx_qrg
  var rx_818 = config.rx_qrg
  var sql_818 = config.sql_lvl
  const l_818 = config.lSA818
  config.lSA818 = "Non"

  const bw_818 = config.bw_818 || '1'
  const vol_818 = config.vol_818 || '2'
  const pre_val = config.pre_818 === false ? '1' : '0'
  const lp_val = config.lp_818 === false ? '1' : '0'
  const hp_val = config.hp_818 === false ? '1' : '0'
  const filter_cmd = `${pre_val},${lp_val},${hp_val}`

  var Rxct = 0
  var sRxct = ''
  var Txct = 0
  var sTxct = ''
  var Group = ''

  const targetConfigPath = path.join(dir, 'config.json')

  return readFile(path.join(dir, `svxlink.cfg`), 'utf8')
    .then(data => {
      const current = ini.decode(data)

      if (current.SimplexLogic) current.SimplexLogic.CALLSIGN = callsign1

      if (current.LocationInfo) {
        current.LocationInfo.CALLSIGN = `${config.type}-${callsign1}`

        current.LocationInfo.FREQUENCY = config.tx_qrg || ''

        let toneValue = config.ctcss_fq || '0'
        current.LocationInfo.TONE = toneValue === 'Pas de Ctcss' ? '0' : parseInt(toneValue).toString()
      }

      if (current.Rx1) current.Rx1.SQL_DET = config.sql_det

      if (current.SimplexLogic) current.SimplexLogic.REPORT_CTCSS = config.ctcss_fq
      if (current.Rx1) current.Rx1.CTCSS_FQ = config.ctcss_fq
      if (current.Tx1) current.Tx1.CTCSS_FQ = config.ctcss_fqt

      if (current.SimplexLogic) current.SimplexLogic.SHORT_IDENT_INTERVAL = id_short
      if (current.SimplexLogic) current.SimplexLogic.LONG_IDENT_INTERVAL = id_long

      if (current.SimplexLogic) current.SimplexLogic.DEFAULT_LANG = config.default_lang

      if (current.LocationInfo) current.LocationInfo.LAT_POSITION = config.location_latitude
      if (current.LocationInfo) current.LocationInfo.LON_POSITION = config.location_longitude

      if (current.GLOBAL) {
        if (config.location_enabled) {
          current.GLOBAL.LOCATION_INFO = 'LocationInfo'
        } else {
          delete current.GLOBAL.LOCATION_INFO
        }
      }

      return Promise.all([
        writeFile(path.join(dir, `svxlink.cfg`), ini.encode(current)),
      ])
    })
    .then(() => {
      return readFile(
        path.join(dir, 'svxlink.d', 'ModuleMetarInfo.conf'),
        'utf8'
      ).then(data => {
        const current = ini.decode(data)

        if (current.ModuleMetarInfo) {
          current.ModuleMetarInfo.STARTDEFAULT = config.airport_code
          current.ModuleMetarInfo.AIRPORTS = config.airport_code
        }

        return writeFile(
          path.join(dir, 'svxlink.d', 'ModuleMetarInfo.conf'),
          ini.encode(current)
        )
      })
    })
    .then(() =>
      writeFile(targetConfigPath, JSON.stringify(config, null, 2))
    )
    .then(() => exec('sync').catch(() => {}))

    .then(() => {
      const mode = config.ledEnabled === false ? 'off' : 'normal';
      return exec(`systemctl start weblink-led@${mode}`).catch(err => {
        console.error('Erreur Led via SystemD:', err);
      });
    })

    .then(async () => {
      const formatIndexToCtcssCode = (index) => {
        if (index < 0) return '0000'
        return String(index).padStart(4, '0')
      }

      const ctcss818 = [ 'Pas de Ctcss', '67', '71.9', '74.4', '77', '79.7', '82.5', '85.4', '88.5', '91.5', '94.8', '97.4', '100', '103.5', '107.2', '110.9', '114.8', '118.8', '123', '127.3', '131.8', '136.5', '141.3', '146.2', '151.4', '156.7', '162.2', '167.9', '173.8', '179.9', '186.2', '192.8', '203.5', '210.7', '218.1', '225.7', '233.6', '241.8' ]

      rx_818 = parseFloat(rx_818 || 0).toFixed(4)
      tx_818 = parseFloat(tx_818 || 0).toFixed(4)

      if (`${Rx_dcs}` === "0000" || Rx_dcs === undefined) {
        Rxct = ctcss818.indexOf(Rx_ctcss)
        sRxct = formatIndexToCtcssCode(Rxct)
      } else {
        sRxct = Rx_dcs.toString()
      }

      if (`${Tx_dcs}` === "0000" || Tx_dcs === undefined) {
        Txct = ctcss818.indexOf(Tx_ctcss)
        sTxct = formatIndexToCtcssCode(Txct)
      } else {
        sTxct = Tx_dcs.toString()
      }

      Group = rx_818.toString()
        + ','
        + tx_818.toString()
        + ','
        + sTxct.toString()
        + ','
        + sql_818.toString()
        + ','
        + sRxct.toString()

      if (`${l_818}` === 'Oui') {
        try {
          const cmd = path.join('/usr', 'local/sbin', `818cli-prog -m ${bw_818} -f ${filter_cmd} -v ${vol_818} -g ${Group}`)
          const { stdout, stderr } = await exec(cmd)
          if (stdout) console.log('818cli-prog stdout', stdout)
          if (stderr) console.error('818cli-prog stderr', stderr)
        }
        catch (err) {
          console.error('Erreur exécution 818cli-prog', err)
        }
      }
    })
    .catch(err => {
      console.error('Erreur dans lib/config.js set()', err)
      throw err
    })
}

const AP_NAME = 'weblink-ap'
const AP_SCAN_CACHE = '/run/weblink-wifi-scan.txt'
const WLAN = 'wlan0'

module.exports.AP_NAME = AP_NAME

function nmcli(args, timeout = 60000) {
  return new Promise((resolve, reject) => {
    childProcess.execFile('nmcli', args, { timeout }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message || '').trim()))
      resolve(stdout || '')
    })
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

const syncDisk = () => exec('sync').catch(() => {})

const BUSY_FLAG = '/run/weblink-wifi-busy'
async function withBusy(fn) {
  await writeFile(BUSY_FLAG, String(Date.now())).catch(() => {})
  try {
    return await fn()
  } finally {
    fs.unlink(BUSY_FLAG, () => {})
  }
}

async function isApActive() {
  const out = await nmcli(['-t', '-f', 'NAME', 'connection', 'show', '--active']).catch(() => '')
  return out.split(/\r?\n/).includes(AP_NAME)
}
module.exports.isApActive = isApActive

function decodeIwSsid(raw) {
  const text = raw.replace(/^\s*SSID: ?/, '').replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  return Buffer.from(text, 'latin1').toString('utf8')
}

function parseScan(stdout) {
  const networks = stdout.split(/\r?\n/)
    .filter(line => line.trim() !== '' && line.includes(':'))
    .map(line => {
      const parts = line.split(':')
      const security = parts.pop() || 'None'
      const signal = parseInt(parts.pop()) || 0
      return { ssid: parts.join(':') || 'Inconnu', signal, security }
    })

  const uniqueNetworks = []
  const seenSsids = new Set()
  for (const net of networks) {
    if (net.ssid && net.ssid !== '--' && !seenSsids.has(net.ssid)) {
      uniqueNetworks.push(net)
      seenSsids.add(net.ssid)
    }
  }
  uniqueNetworks.sort((a, b) => b.signal - a.signal)
  return uniqueNetworks
}

module.exports.listSavedConnections = async function listSavedConnections() {
  const stdout = await nmcli(['-t', '-f', 'NAME,UUID,TYPE,AUTOCONNECT-PRIORITY,DEVICE', 'connection', 'show']).catch(() => '')
  if (!stdout.trim()) return []

  const networks = stdout.split(/\r?\n/)
    .filter(line => {
      const lowerLine = line.toLowerCase()
      return lowerLine.includes('wifi') || lowerLine.includes('wireless') || lowerLine.includes('802-11')
    })
    .map(line => {
      const parts = line.split(':')
      return {
        name: parts[0],
        uuid: parts[1],
        priority: parseInt(parts[3]) || 0,
        active: (parts[4] && parts[4].trim() !== '')
      }
    })
    .filter(net => net.name !== AP_NAME)

  networks.sort((a, b) => b.priority - a.priority)
  return networks
}

module.exports.deleteConnection = async function deleteConnection(name) {
  if (!name || name === AP_NAME) throw new Error('Connexion protégée')
  try {
    await nmcli(['connection', 'delete', name])
    await syncDisk()
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression connexion', error)
    throw error
  }
}

async function scanWithIw() {
  const out = await new Promise(resolve => {
    childProcess.execFile('iw', ['dev', WLAN, 'scan', 'ap-force'], { timeout: 20000 },
      (err, stdout) => resolve(err ? '' : (stdout || '')))
  })
  const lines = []
  let cur = null
  for (const raw of out.split(/\r?\n/)) {
    const line = raw.trim()
    if (raw.startsWith('BSS ')) {
      if (cur) lines.push(cur)
      cur = { ssid: '', signal: 0, security: '' }
    } else if (cur && line.startsWith('signal:')) {
      const dbm = parseFloat(line.split(/\s+/)[1])
      cur.signal = Math.max(0, Math.min(100, Math.round(2 * (dbm + 100))))
    } else if (cur && line.startsWith('SSID:')) {
      cur.ssid = decodeIwSsid(raw)
    } else if (cur && (line.startsWith('RSN:') || line.startsWith('WPA:'))) {
      cur.security = 'WPA'
    }
  }
  if (cur) lines.push(cur)
  return lines
    .filter(n => n.ssid)
    .map(n => `${n.ssid}:${n.signal}:${n.security}`)
    .join('\n')
}

const AP_IFACE = 'uap0'
async function hasConcurrentAp() {
  if (!fs.existsSync(`/sys/class/net/${AP_IFACE}`)) return false
  const ifname = await nmcli(['-g', 'connection.interface-name', 'connection', 'show', AP_NAME]).catch(() => '')
  return ifname.trim() === AP_IFACE
}

async function scanWlan(rescan = 'auto') {
  const out = await nmcli(['-t', '--escape', 'no', '-f', 'SSID,SIGNAL,SECURITY,CHAN',
    'device', 'wifi', 'list', 'ifname', WLAN, '--rescan', rescan]).catch(() => '')
  return out.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const parts = line.split(':')
    const chan = parseInt(parts.pop()) || 0
    const security = parts.pop() || ''
    const signal = parseInt(parts.pop()) || 0
    return { ssid: parts.join(':'), signal, security, chan }
  }).filter(n => n.ssid && n.ssid !== '--')
}

module.exports.scanAndListWifi = async function scanAndListWifi() {
  const apActive = await isApActive()

  if (!apActive || await hasConcurrentAp()) {
    const nets = await scanWlan('yes')
    if (nets.length) {
      await writeFile(AP_SCAN_CACHE, nets.map(n => `${n.ssid}:${n.signal}:${n.security}`).join('\n')).catch(() => {})
      return parseScan(nets.map(n => `${n.ssid}:${n.signal}:${n.security}`).join('\n'))
    }
    if (!apActive) return []
  }

  const live = await scanWithIw()
  if (live.trim()) return parseScan(live)
  const cached = await readFile(AP_SCAN_CACHE, 'utf8').catch(() => '')
  return parseScan(cached)
}

async function saveProfile(ssid, password, hidden = false) {
  await nmcli(['connection', 'delete', ssid]).catch(() => {})
  const args = ['connection', 'add', 'type', 'wifi', 'ifname', WLAN, 'con-name', ssid,
    'ssid', ssid, 'autoconnect', 'yes', '802-11-wireless.hidden', hidden ? 'yes' : 'no']
  if (password) args.push('wifi-sec.key-mgmt', 'wpa-psk', 'wifi-sec.psk', password)
  await nmcli(args)
  await syncDisk()
}

const TRY_WINDOW = 3 * 60 * 1000

async function leaveApAndTry(name) {
  await nmcli(['connection', 'down', AP_NAME]).catch(() => {})
  const end = Date.now() + TRY_WINDOW
  while (Date.now() < end) {
    await sleep(5000)
    try {
      await nmcli(['connection', 'up', name], 60000)
      console.log(`Wifi : connecté à ${name}, point d'accès arrêté`)
      return
    } catch (err) {
      console.log(`Wifi : ${name} pas encore joignable (${err.message})`)
      await sleep(10000)
    }
  }
  console.error(`Wifi : ${name} injoignable, retour en point d'accès`)
  await nmcli(['connection', 'up', AP_NAME]).catch(e => console.error('Impossible de relancer l\'Ap', e.message))
}

const AP_LINGER = 3 * 60 * 1000
let wifiJob = { state: 'idle' }
let apOffTimer = null

module.exports.getWifiJob = function getWifiJob() {
  const job = Object.assign({}, wifiJob, { hostname: require('os').hostname() })
  if (job.apOffAt) job.apOffIn = Math.max(0, Math.round((job.apOffAt - Date.now()) / 1000))
  if (job.endsAt) job.wpsIn = Math.max(0, Math.round((job.endsAt - Date.now()) / 1000))
  return job
}

async function wlanInfo() {
  const addr = await new Promise(resolve =>
    childProcess.execFile('ip', ['-4', '-o', 'addr', 'show', WLAN], (e, out) => resolve(out || '')))
  const ip = (addr.match(/inet (\d+\.\d+\.\d+\.\d+)/) || [])[1] || ''
  const link = await new Promise(resolve =>
    childProcess.execFile('iw', ['dev', WLAN, 'link'], (e, out) => resolve(out || '')))
  const freq = parseInt((link.match(/freq:\s*(\d+)/) || [])[1]) || 0
  const chan = freq === 2484 ? 14 : (freq >= 2412 && freq <= 2472 ? (freq - 2407) / 5 : 0)
  return { ip, chan }
}

async function setApChannel(chan) {
  await nmcli(['connection', 'modify', AP_NAME, '802-11-wireless.channel', String(chan)])
  await syncDisk()
}

async function stopApNow() {
  if (apOffTimer) { clearTimeout(apOffTimer); apOffTimer = null }
  await nmcli(['connection', 'down', AP_NAME]).catch(() => {})
  if (wifiJob.state === 'connected') wifiJob = Object.assign({}, wifiJob, { state: 'done', apOffAt: null })
  console.log('Wifi : point d\'accès arrêté')
}

async function connectLive(conName, ssid, targetChan) {
  wifiJob = { state: 'connecting', ssid, startedAt: Date.now() }
  if (apOffTimer) { clearTimeout(apOffTimer); apOffTimer = null }

  const apChan = parseInt(await nmcli(['-g', '802-11-wireless.channel', 'connection', 'show', AP_NAME]).catch(() => '')) || 6
  const mustMove = targetChan && targetChan !== apChan

  try {
    if (mustMove) await nmcli(['connection', 'down', AP_NAME]).catch(() => {})

    await nmcli(['connection', 'up', conName], 60000)
    const info = await wlanInfo()

    if (mustMove || (info.chan && info.chan !== apChan)) {
      await nmcli(['connection', 'down', AP_NAME]).catch(() => {})
      await setApChannel(info.chan || targetChan)
      await nmcli(['connection', 'up', AP_NAME]).catch(e => console.error('Ap non relancé', e.message))
    }

    wifiJob = { state: 'connected', ssid, ip: info.ip, apOffAt: Date.now() + AP_LINGER }
    apOffTimer = setTimeout(() => stopApNow(), AP_LINGER)
    console.log(`Wifi : connecté à ${ssid} (${info.ip}), Ap arrêté dans ${AP_LINGER / 1000}s`)
  } catch (err) {
    console.error(`Wifi : échec connexion ${ssid} :`, err.message)
    wifiJob = { state: 'failed', ssid, error: 'Connexion impossible : vérifiez le mot de passe' }
    if (mustMove) {
      await nmcli(['connection', 'up', AP_NAME]).catch(e => console.error('Ap non relancé', e.message))
    }
  }
}

module.exports.finishWifi = async function finishWifi() {
  if (wifiJob.state !== 'connected') return { success: false }
  await stopApNow()
  return { success: true }
}

async function startFromAp(conName, ssid) {
  if (await hasConcurrentAp()) {
    const net = (await scanWlan('yes')).find(n => n.ssid === ssid)
    if (net) {
      setTimeout(() => withBusy(() => connectLive(conName, ssid, net.chan)), 500)
      return { success: true, pending: true, mode: 'live' }
    }
  }
  setTimeout(() => withBusy(() => leaveApAndTry(conName)), 1500)
  return { success: true, pending: true, mode: 'blind' }
}

module.exports.connectWifi = async function connectWifi(ssid, password, hidden = false) {
  if (!ssid || ssid === AP_NAME) throw userError('Nom de réseau invalide')
  if (wpsRun) throw userError('Une opération Wps est en cours')
  if (password && (password.length < 8 || password.length > 63)) throw userError('Mot de passe de 8 à 63 caractères')
  await saveProfile(ssid, password, !!hidden)

  if (await isApActive()) return startFromAp(ssid, ssid)

  const wlanBusy = (await nmcli(['-t', '-f', 'DEVICE,STATE', 'device']).catch(() => ''))
    .split(/\r?\n/).includes(`${WLAN}:connected`)
  if (wlanBusy) return { success: true, saved: true, connected: false }
  try {
    await nmcli(['connection', 'up', ssid], 90000)
    return { success: true, saved: true, connected: true }
  } catch (err) {
    console.log(`Wifi : ${ssid} enregistré mais pas joignable pour l'instant (${err.message})`)
    return { success: true, saved: true, connected: false }
  }
}

module.exports.switchWifi = async function switchWifi(name) {
  if (!name || name === AP_NAME) throw userError('Connexion invalide')
  if (wpsRun) throw userError('Une opération Wps est en cours')

  if (await isApActive()) {
    const ssid = (await nmcli(['-g', '802-11-wireless.ssid', 'connection', 'show', name]).catch(() => '')).replace(/\r?\n$/, '') || name
    return startFromAp(name, ssid)
  }
  await nmcli(['connection', 'up', name], 90000)
  return { success: true }
}

const WPS_WINDOW = 120 * 1000
const WPS_EXCHANGE = 40 * 1000
const WPS_CTRL = '/run/weblink-wps'
const WPS_CONF = '/run/weblink-wps.conf'
const WPS_PID = '/run/weblink-wps.pid'
const WPS_ERRORS = {
  timeout: "Aucune box n'a répondu : bouton Wps non pressé, box trop loin ou Wps désactivé sur la box",
  overlap: 'Plusieurs box en Wps au même moment, réessayez dans 2 minutes',
  refused: "La box a refusé l'échange Wps ( box en WPA3 seul ? )",
  save: 'Identifiants reçus mais impossibles à enregistrer',
}

let wpsRun = null

function run(cmd, args, timeout = 20000) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(cmd, args, { timeout }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message || '').trim()))
      resolve(stdout || '')
    })
  })
}

function wpsError(code) {
  const err = new Error(code)
  err.code = code
  return err
}

function userError(message) {
  const err = new Error(message)
  err.userMessage = true
  return err
}

const wpaCli = args => run('wpa_cli', ['-p', WPS_CTRL, '-i', WLAN].concat(args), 10000)

async function ledMode(mode) {
  await exec(`systemctl stop 'weblink-led@*'; systemctl start weblink-led@${mode}`)
    .catch(err => console.error('Led :', err.message))
}

async function ledRestore() {
  const conf = await module.exports.get().catch(() => ({}))
  await ledMode(conf.ledEnabled === false ? 'off' : 'normal')
}

function ledResult(ok) {
  ledMode(ok ? 'wpsok' : 'wpserr').then(() => setTimeout(ledRestore, ok ? 3200 : 4800))
}

async function apChannel() {
  return parseInt(await nmcli(['-g', '802-11-wireless.channel', 'connection', 'show', AP_NAME]).catch(() => '')) || 6
}

function freqToChan(freq) {
  if (freq === 2484) return 14
  if (freq >= 2412 && freq <= 2472) return Math.round((freq - 2407) / 5)
  return 0
}

function parseBss(out) {
  const list = []
  let cur = null
  for (const raw of out.split(/\r?\n/)) {
    const line = raw.trim()
    const m = raw.match(/^BSS ([0-9a-f]{2}(?::[0-9a-f]{2}){5})/i)
    if (m) {
      cur = { bssid: m[1].toLowerCase(), ssid: '', signal: -100, chan: 0, wps: false, selected: false, pbc: false }
      list.push(cur)
      continue
    }
    if (!cur) continue
    if (line.startsWith('freq:')) cur.chan = freqToChan(Math.round(parseFloat(line.slice(5))))
    else if (line.startsWith('signal:')) cur.signal = parseFloat(line.split(/\s+/)[1]) || -100
    else if (line.startsWith('SSID:')) cur.ssid = decodeIwSsid(raw)
    else if (line.startsWith('WPS:')) cur.wps = true
    if (/Selected Registrar:\s*0x0*1\b/i.test(line)) cur.selected = true
    if (/Device Password ID:\s*4\b/.test(line)) cur.pbc = true
  }
  return list
}

function parsePbc(out) {
  return parseBss(out).filter(b => b.selected && b.pbc && b.chan)
}

function scanSummary(out) {
  const all = parseBss(out)
  const wps = all.filter(b => b.wps)
    .sort((a, b) => b.signal - a.signal)
    .slice(0, 5)
    .map(b => `${b.ssid || b.bssid} canal ${b.chan || '?'} ${Math.round(b.signal)} dBm sélection ${b.selected ? 'oui' : 'non'} bouton ${b.pbc ? 'oui' : 'non'}`)
  return `${all.length} réseaux vus, Wps annoncé par ${wps.length ? wps.join(' / ') : 'aucun'}`
}

async function waitPbc(endsAt) {
  let last = 'aucun scan abouti'
  let scans = 0
  while (Date.now() < endsAt) {
    if (wpsRun.cancel) throw wpsError('cancel')
    wpsRun.step = `scan des box ( ${++scans} )`
    const out = await run('iw', ['dev', WLAN, 'scan'], 20000).catch(err => { last = `scan impossible : ${err.message}`; return '' })
    if (out) last = scanSummary(out)
    const found = parsePbc(out)
    if (new Set(found.map(b => b.ssid)).size > 1) throw wpsError('overlap')
    if (found.length) return found.sort((a, b) => b.signal - a.signal)[0]
    await sleep(2000)
  }
  const err = wpsError('timeout')
  err.message = last
  throw err
}

function decodeWpaValue(value, isSsid) {
  if (!value) return ''
  let v = value.trim()
  if (v.startsWith('P"')) v = v.slice(1)
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
  if (isSsid && /^([0-9a-f]{2})+$/i.test(v)) return Buffer.from(v, 'hex').toString('utf8')
  return v
}

function parseWpsConf(text) {
  const blocks = text.match(/network=\{[\s\S]*?\n\}/g) || []
  for (const block of blocks) {
    const get = key => {
      const m = block.match(new RegExp(`^\\s*${key}=(.*)$`, 'm'))
      return m ? m[1].trim() : null
    }
    const keyMgmt = get('key_mgmt') || 'WPA-PSK'
    if (/WPS/.test(keyMgmt)) continue
    const ssid = decodeWpaValue(get('ssid'), true)
    if (!ssid) continue
    return { ssid, psk: /NONE/.test(keyMgmt) ? '' : decodeWpaValue(get('psk'), false) }
  }
  return null
}

async function stopSupplicant() {
  const pid = parseInt(await readFile(WPS_PID, 'utf8').catch(() => ''), 10)
  if (pid) {
    try { process.kill(pid, 'SIGTERM') } catch (e) {}
    await sleep(800)
  }
  await new Promise(resolve => fs.unlink(WPS_PID, () => resolve()))
  await new Promise(resolve => fs.unlink(WPS_CONF, () => resolve()))
}

async function readCreds() {
  return parseWpsConf(await readFile(WPS_CONF, 'utf8').catch(() => ''))
}

async function pbcExchange(bssid) {
  wpsRun.step = 'lancement wpa_supplicant'
  await writeFile(WPS_CONF, `ctrl_interface=${WPS_CTRL}\nupdate_config=1\n`, { mode: 0o600 })
  await run('wpa_supplicant', ['-B', '-i', WLAN, '-D', 'nl80211', '-c', WPS_CONF, '-P', WPS_PID])
  wpsRun.step = 'démarrage échange Wps'
  let started = false
  for (let i = 0; i < 4 && !started; i++) {
    await sleep(1000)
    started = /OK/.test(await wpaCli(['wps_pbc', bssid]).catch(() => ''))
  }
  if (!started) throw wpsError('refused')

  wpsRun.step = 'échange Wps avec la box'
  const end = Date.now() + WPS_EXCHANGE
  while (Date.now() < end) {
    if (wpsRun.cancel) throw wpsError('cancel')
    await sleep(1500)
    const creds = await readCreds()
    if (creds) return creds
    const status = await wpaCli(['status']).catch(() => '')
    if (/^wpa_state=COMPLETED/m.test(status)) {
      await wpaCli(['save_config']).catch(() => {})
      const saved = await readCreds()
      if (saved) return saved
    }
  }
  throw wpsError('refused')
}

async function raisePriority(conName) {
  const others = (await module.exports.listSavedConnections()).filter(n => n.name !== conName)
  const top = others.reduce((max, n) => Math.max(max, n.priority), 0)
  await nmcli(['connection', 'modify', conName, 'connection.autoconnect-priority', String(Math.min(top + 1, 999))])
  await syncDisk()
}

async function wpsFailed(err, restoreAp, cable) {
  if (restoreAp) await nmcli(['connection', 'up', AP_NAME]).catch(e => console.error('Ap non relancé', e.message))
  if (err.code === 'cancel') {
    console.log('Wps : annulé')
    wifiJob = { state: 'idle' }
    await ledRestore()
    return
  }
  const step = (wpsRun && wpsRun.step) || ''
  console.error(`Wps : échec à l'étape « ${step} » (${err.message})`)
  wifiJob = { state: 'failed', wps: true, cable, error: WPS_ERRORS[err.code] || "Erreur pendant l'opération Wps", step, detail: err.message, finishedAt: Date.now() }
  ledResult(false)
}

async function runWps(plan) {
  const { apActive, concurrent, cable } = plan
  const endsAt = Date.now() + WPS_WINDOW
  let apDown = false
  let bss = null
  let creds = null
  let failure = null

  wifiJob = { state: 'wps-wait', wps: true, cable, endsAt }
  await ledMode('wps')

  try {
    wpsRun.step = 'préparation'
    await stopSupplicant()
    if (apActive && !concurrent) {
      await nmcli(['connection', 'down', AP_NAME]).catch(() => {})
      apDown = true
    }
    wpsRun.step = 'retrait de wlan0 à NetworkManager'
    await nmcli(['device', 'set', WLAN, 'managed', 'no'])
    await run('ip', ['link', 'set', WLAN, 'up']).catch(() => {})
    await sleep(1500)

    bss = await waitPbc(endsAt)
    console.log(`Wps : box trouvée ${bss.ssid || bss.bssid} canal ${bss.chan}`)

    if (concurrent && bss.chan !== await apChannel()) {
      await nmcli(['connection', 'down', AP_NAME]).catch(() => {})
      apDown = true
    }
    wifiJob = { state: 'wps-cred', wps: true, cable, ssid: bss.ssid }
    creds = await pbcExchange(bss.bssid)
    if (creds.ssid === AP_NAME) throw wpsError('save')
  } catch (err) {
    failure = err
  } finally {
    await stopSupplicant()
    await nmcli(['device', 'set', WLAN, 'managed', 'yes']).catch(e => console.error('Wifi : wlan0 non rendu à NetworkManager', e.message))
    await sleep(2000)
  }

  if (failure) return wpsFailed(failure, apDown, cable)

  console.log(`Wps : identifiants reçus pour ${creds.ssid}`)
  try {
    await saveProfile(creds.ssid, creds.psk)
    await raisePriority(creds.ssid)
  } catch (err) {
    console.error('Wps : enregistrement impossible', err.message)
    return wpsFailed(wpsError('save'), apDown, cable)
  }

  if (concurrent) {
    await connectLive(creds.ssid, creds.ssid, bss.chan)
  } else {
    wifiJob = { state: 'connecting', wps: true, cable, ssid: creds.ssid }
    try {
      await nmcli(['connection', 'up', creds.ssid], 60000)
      const info = await wlanInfo()
      wifiJob = { state: 'connected', ssid: creds.ssid, ip: info.ip }
      console.log(`Wps : connecté à ${creds.ssid} (${info.ip})`)
    } catch (err) {
      console.error(`Wps : connexion à ${creds.ssid} impossible`, err.message)
      wifiJob = { state: 'failed', ssid: creds.ssid, error: `${creds.ssid} est enregistré mais la connexion a échoué` }
      if (apDown) await nmcli(['connection', 'up', AP_NAME]).catch(e => console.error('Ap non relancé', e.message))
    }
  }

  wifiJob = Object.assign({}, wifiJob, { wps: true, cable, finishedAt: Date.now() })
  ledResult(wifiJob.state === 'connected')
}

async function wpsPlan(clientIface) {
  const apActive = await isApActive()
  const concurrent = apActive && await hasConcurrentAp()
  const live = clientIface !== WLAN
  const cable = !!clientIface && ![WLAN, AP_IFACE, 'lo'].includes(clientIface)
  return { apActive, concurrent, live, cable }
}
module.exports.wpsPlan = wpsPlan

module.exports.startWps = async function startWps(clientIface) {
  if (wpsRun || fs.existsSync(BUSY_FLAG)) throw userError('Une opération Wifi est déjà en cours')
  const plan = await wpsPlan(clientIface)
  wpsRun = { cancel: false }
  if (apOffTimer) { clearTimeout(apOffTimer); apOffTimer = null }
  wifiJob = { state: 'wps-wait', wps: true, cable: plan.cable, endsAt: Date.now() + WPS_WINDOW }

  setTimeout(() => {
    withBusy(() => runWps(plan))
      .catch(err => {
        console.error('Wps :', err.message)
        wifiJob = { state: 'failed', wps: true, cable: plan.cable, error: "Erreur pendant l'opération Wps", step: (wpsRun && wpsRun.step) || '', detail: err.message, finishedAt: Date.now() }
        ledResult(false)
      })
      .finally(() => { wpsRun = null })
  }, plan.live ? 300 : 1500)

  return { success: true, pending: true, mode: plan.live ? 'live' : 'blind', cable: plan.cable }
}

module.exports.cancelWps = function cancelWps() {
  if (!wpsRun) return { success: false }
  wpsRun.cancel = true
  return { success: true }
}