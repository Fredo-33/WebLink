const fs = require('fs')
const fsPromises = require('fs').promises
const http = require('http')
const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const socketIO = require('socket.io')
const pty = require('node-pty')
const api = require('./lib/api')
const config = require('./lib/config')
const dtmf = require('./lib/dtmf')
const { port, hostname } = require('./config')
const sse = require('./lib/sse')
const { exec, execFile } = require('child_process');
const os = require('os')
const net = require('net')
const { getTimeSync } = require('./lib/timeSync')
const { createReflectorWatcher } = require('./lib/reflectorStatus')
const { construireDiag } = require('./lib/diagnostic')
const app = next({})
const handle = app.getRequestHandler()
const path = require('path')

process.title = 'WebLink'

let sa818Config = null;
let reflectorWatcher = null;

const SVXLINK_CONF = '/etc/weblink/svxlink.conf';

const logFilePath = '/tmp/svxlink.log';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replacements = [ ['start:', ' On'],['stop:', 'Off'], ['joined:', '<--'],['left:', '-->'] ];

const applyReplacements = line => {
  let modifiedLine = line;

  for (const [pattern, replacement] of replacements) {
    const regexPattern = (pattern instanceof RegExp) ? pattern : new RegExp(escapeRegExp(pattern), 'g');
    modifiedLine = modifiedLine.replace(regexPattern, replacement);
  }

  const nameRegex = /(\(\d{2,3}\)\s*)([A-Z]+)/g;
  modifiedLine = modifiedLine.replace(nameRegex, (match, prefix, name) => {
    return prefix + name.replace(/\s[HVTUBR],?$/, '');
  });

  modifiedLine = modifiedLine.replace(/([A-Z0-9-]{3,})\s[HVTUBR],?$/, '$1');

  return modifiedLine;
};

async function getFormattedLogs(filterPredicate, cleanAndFormatLine, numberOfLines, uniqueByDate = false) {
  const data = await fsPromises.readFile(logFilePath, 'utf8');
  let lines = data.split('\n');

  lines = lines.filter(filterPredicate);
  let cleanedLines = lines.map(cleanAndFormatLine);

  if (uniqueByDate) {
    const currentYear = new Date().getFullYear();
    const uniqueLogEntries = {};
    cleanedLines.forEach(line => {
      const dateRegex = /(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
      const match = line.match(dateRegex);

      if (match) {
        const [, day, month, hour, minute, second] = match;
        const monthInt = parseInt(month, 10);
        const year = monthInt === 12 && new Date().getMonth() === 0 ? currentYear - 1 : currentYear;

        const fullDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
        const key = line.replace(/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+/, '');
        uniqueLogEntries[key] = { line, date: fullDate };
      }
    });
    cleanedLines = Object.values(uniqueLogEntries)
      .sort((a, b) => a.date - b.date)
      .map(entry => entry.line);
  }

  const relevantLines = cleanedLines.slice(-numberOfLines).map(line => line.slice(0, -2));
  const replacedLines = relevantLines.map(applyReplacements);

  return replacedLines
    .reverse()
    .join('\n\n')
    .replace(/^\[|\]$/g, '');
}

function parseLogLineForDuration(line) {
  const regex = /(\d{2}\/\d{2})\s(\d{2}:\d{2}:\d{2})\s:\sReflectorLogic:\sTalker\s(start|stop):\s(.+)/;
  const match = line.match(regex);
  if (match) {
    const [_, date, time, type, talkerId] = match;
    const currentYear = new Date().getFullYear();
    const month = parseInt(date.substring(3, 5), 10);
    const yearToUse = (month === 12 && new Date().getMonth() === 0) ? currentYear - 1 : currentYear;

    const fullDateStr = `${yearToUse}-${date.substring(3, 5)}-${date.substring(0, 2)}T${time}`;
    const timestamp = new Date(fullDateStr).getTime();
    return {
      timestamp: timestamp,
      type: type,
      talkerId: talkerId.trim(),
      originalLine: line
    };
  }
  return null;
}

async function getFormattedLogsWithDuration(numberOfLines = 200, uniqueByDate = true) {
  const data = await fsPromises.readFile(logFilePath, 'utf8');
  const lines = data.split('\n');

  const talkerStarts = {};
  const allTalkSegments = [];

  for (const line of lines) {
    const parsed = parseLogLineForDuration(line);
    if (parsed) {
      const { timestamp, type, talkerId, originalLine } = parsed;

      if (type === 'start') {
        talkerStarts[talkerId] = timestamp;
      } else if (type === 'stop') {
        if (talkerStarts[talkerId]) {
          const startTime = talkerStarts[talkerId];
          const endTime = timestamp;
          const durationMs = endTime - startTime;

          const dateRegex = /(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
          const match = originalLine.match(dateRegex);
          let fullDate = null;
          if (match) {
            const [, day, month, hour, minute, second] = match;
            const monthInt = parseInt(month, 10);
            const currentYear = new Date().getFullYear();
            const year = (monthInt === 12 && new Date().getMonth() === 0) ? currentYear - 1 : currentYear;
            fullDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
          }

          allTalkSegments.push({
            talkerId: talkerId,
            startTime: startTime,
            endTime: endTime,
            durationMs: durationMs,
            originalStopLine: originalLine,
            fullDate: fullDate
          });
          delete talkerStarts[talkerId];
        }
      }
    }
  }

  let processedSegments = allTalkSegments;

  if (uniqueByDate) {
    const uniqueLogEntries = {};

    processedSegments.sort((a, b) => b.endTime - a.endTime);

    for (const segment of processedSegments) {
      const cleanedPart = segment.originalStopLine.replace(': ReflectorLogic: Talker stop:', '').trim();
      const key = cleanedPart.replace(/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+/, '');

      if (!uniqueLogEntries[key] || (segment.fullDate && uniqueLogEntries[key].date < segment.fullDate)) {
        uniqueLogEntries[key] = { segment: segment, date: segment.fullDate };
      }
    }
    processedSegments = Object.values(uniqueLogEntries).map(entry => entry.segment);

    processedSegments.sort((a, b) => a.fullDate - b.fullDate);
  } else {
    processedSegments.sort((a, b) => a.fullDate - b.fullDate);
  }

  let formattedLines = [];
  processedSegments.forEach(segment => {
    const cleaned = segment.originalStopLine.replace(': ReflectorLogic: Talker stop:', '').trim();
    let parts = cleaned.split(/\s+/);
    let formattedLineBase = cleaned;

    if (parts.length >= 3) {
      const [date, time, ...rest] = parts;
      let namePart = rest.join(' ');
      if (namePart.match(/[HUVBRTSA]$/)) {
        namePart = namePart.slice(0, -1).trim();
      }
      formattedLineBase = `${date}  ${time}  ${namePart}`;
    }

    const totalSeconds = Math.round(segment.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let durationStr;
    if (minutes === 0) {
      durationStr = `${seconds}s`;
    } else {
      durationStr = `${minutes}m ${seconds}s`;
    }

    formattedLines.push(`${formattedLineBase}   ${durationStr}`);
  });

  const relevantLines = formattedLines.slice(-numberOfLines);
  const replacedLines = relevantLines.map(applyReplacements);

  return replacedLines
    .reverse()
    .join('\n\n')
    .replace(/^\[|\]$/g, '');
}

const avahiServicePath = '/etc/avahi/services/weblink.service'

function publishAvahiService() {
  const content = `<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">%h</name>
  <service>
    <type>_weblink._tcp</type>
    <port>${port}</port>
  </service>
</service-group>
`
  return fsPromises
    .readFile(avahiServicePath, 'utf8')
    .catch(() => '')
    .then(current => (current === content ? null : fsPromises.writeFile(avahiServicePath, content)))
    .catch(err => console.error('Erreur publication Avahi', err.message))
}

const HOST_RE = /^(?=.{1,253}$)[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$|^[0-9a-fA-F:]{2,39}$/;
const pingLastByIp = new Map();

function tcpCheck(host, tcpPort, timeoutMs) {
  return new Promise(resolve => {
    const start = Date.now();
    const sock = net.connect({ host, port: tcpPort });
    const done = ok => { sock.destroy(); resolve(ok ? Date.now() - start : null); };
    sock.setTimeout(timeoutMs, () => done(false));
    sock.once('connect', () => done(true));
    sock.once('error', () => done(false));
  });
}

function icmpCheck(host) {
  return new Promise(resolve => {
    const start = Date.now();
    execFile('ping', ['-c', '1', '-W', '2', host], { timeout: 4000 }, err => resolve(err ? null : Date.now() - start));
  });
}

let hotspotsCache = { time: 0, data: [] }

const nodeInfoCache = {}

function readNodeInfo(set) {
  const file = path.join(__dirname, 'data', `${set}.json`)
  return fsPromises.stat(file).then(st => {
    const cached = nodeInfoCache[set]
    if (cached && cached.mtime === st.mtimeMs) return cached.data
    return fsPromises.readFile(file, 'utf8').then(txt => {
      const data = JSON.parse(txt)
      nodeInfoCache[set] = { mtime: st.mtimeMs, data }
      return data
    })
  })
}

function runCommand(cmd, args, timeout) {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout }, (err, stdout) => resolve(stdout || ''))
  })
}

function getLocalIps() {
  const ips = new Set()
  Object.values(os.networkInterfaces()).forEach(list => {
    (list || []).forEach(addr => {
      if (addr.family === 'IPv4' || addr.family === 4) ips.add(addr.address)
    })
  })
  return ips
}

function requestIface(req) {
  const local = String((req.socket && req.socket.localAddress) || '').replace(/^::ffff:/, '')
  if (!local) return null
  const found = Object.entries(os.networkInterfaces()).find(([, list]) => (list || []).some(a => a.address === local))
  return found ? found[0] : null
}

function placeExtensibleMo() {
  try {
    const racine = fs.readFileSync('/proc/self/mounts', 'utf8').split('\n').map(l => l.split(' ')).find(c => c[1] === '/')
    const part = racine ? path.basename(racine[0]) : null
    if (!part || !fs.existsSync(`/sys/class/block/${part}/partition`)) return 0
    const disque = path.basename(fs.realpathSync(`/sys/class/block/${part}/..`))
    const lire = f => parseInt(fs.readFileSync(f, 'utf8'), 10)
    const libre = lire(`/sys/block/${disque}/size`) - lire(`/sys/class/block/${part}/start`) - lire(`/sys/class/block/${part}/size`)
    return Math.max(0, Math.round(libre / 2048))
  } catch {
    return 0
  }
}

async function getHotspots() {
  if (Date.now() - hotspotsCache.time < 15000) return hotspotsCache.data

  const [browse, alias] = await Promise.all([
    runCommand('avahi-browse', ['-rpt', '_weblink._tcp'], 6000),
    runCommand('avahi-resolve', ['-4', '-n', 'weblink.local'], 3000)
  ])

  const aliasIp = alias.trim().split(/\s+/)[1] || null
  const localIps = getLocalIps()
  const list = new Map()

  browse.split('\n').forEach(line => {
    const f = line.split(';')
    if (f[0] !== '=' || f[2] !== 'IPv4' || f.length < 9) return
    if (f[1] === 'lo' || f[7].startsWith('127.') || f[7].startsWith('169.254.')) return
    const host = f[6].toLowerCase()
    list.set(host, {
      name: f[3],
      host,
      ip: f[7],
      port: f[8],
      self: localIps.has(f[7]),
      alias: f[7] === aliasIp
    })
  })

  const data = [...list.values()].sort((a, b) => (b.self - a.self) || a.host.localeCompare(b.host))
  hotspotsCache = { time: Date.now(), data }
  return data
}

function restart() {
	return api.getNetwork().then(network => {
		return api.restart(network)
	})
}

function getVersion() {
	return new Promise((resolve, reject) => {
		fs.readFile('/opt/weblink/version.txt', 'utf8', (err, data) => {
			if (err) {
				if (err.code === 'ENOENT') {
					return resolve('2.x Inconnu');
				}
				return reject(err);
			}
			resolve(data.split(/\r?\n/)[0].trim());
		});
	});
}

let lastNetworkData = {
  rx: 0,
  tx: 0,
  time: Date.now()
};

function getNetworkSpeed() {
  return new Promise((resolve) => {
    fs.readFile('/proc/net/dev', 'utf8', (err, data) => {
      if (err) return resolve({ up: 0, down: 0 });

      const lines = data.split('\n');
      let totalRx = 0;
      let totalTx = 0;

      lines.forEach(line => {
        if (line.includes('eth0') || line.includes('wlan0') || line.includes('end0')) {
          const parts = line.trim().split(/\s+/);
          totalRx += parseInt(parts[1]);
          totalTx += parseInt(parts[9]);
        }
      });

      const now = Date.now();
      const deltaSeconds = (now - lastNetworkData.time) / 1000;

      if (deltaSeconds <= 0) return resolve({ up: 0, down: 0 });

      const downSpeed = Math.round(((totalRx - lastNetworkData.rx) / 1024) / deltaSeconds);
      const upSpeed = Math.round(((totalTx - lastNetworkData.tx) / 1024) / deltaSeconds);

      lastNetworkData = { rx: totalRx, tx: totalTx, time: now };

      resolve({
        up: upSpeed > 0 ? upSpeed : 0,
        down: downSpeed > 0 ? downSpeed : 0
      });
    });
  });
}

app
	.prepare()
	.then(() => {

		const progressFiles = [ '/tmp/updateProgress.txt', '/tmp/updateNodeInfoProgress.txt' ];

		progressFiles.forEach(file => {
			if (fs.existsSync(file)) {
				fs.unlinkSync(file)
			}
		})

		publishAvahiService()

		const server = express()

		server.setMaxListeners(22)

		server.use(bodyParser.text())
		server.use(bodyParser.json())

		server.get('/stream', sse.init)

		server.get('/api/version', (req, res, next) => {
			getVersion()
				.then(version => {
					res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
					res.end(version)
				})
				.catch(next)
		})

		server.post('/api/restart', (req, res, next) => {
			res.writeHead(202)
			res.end()
			restart().catch(next)
		})

		server.get('/api/network', (req, res, next) => {
			api
				.getNetwork()
				.then(r => {
					res.writeHead(202, { 'Content-Type': 'text/plain; charset=utf-8' })
					res.end(r.toString())
				})
				.catch(next)
		})

		server.post('/api/network', (req, res, next) => {
			api
				.setNetwork(req.body)
				.then(() => {
					res.status(202)
					res.end()
					return api.restart(req.body)
				})
				.catch(next)
		})

		server.get('/api/svxlink', (req, res, next) => {
			config
				.get()
				.then(({ callsign1 }) => {
					res.json(Object.assign(api.svxlink(), { node: `weblink-${callsign1}` }))
				})
				.catch(next)
		})

		server.post('/api/dtmf/:key', (req, res, next) => {
			dtmf(req.params.key)
				.then(() => {
					res.end()
				})
				.catch(next)
		})

		server.post('/api/configuration', async (req, res, next) => {
			try {
				const body = req.body && typeof req.body === 'object' ? req.body : {}
    		const tz = body.timezone
    		if (tz && api.TIMEZONES.includes(tz) && tz !== await api.getTimezone()) {
      		await api.setTimezone(tz).catch(err => console.error('Fuseau non appliqué', err && err.message))
    		}
    		const current = await config.get().catch(() => ({}))
    		await config.set({ ...current, ...body })
				res.status(202)
				res.end()
				restart().catch(err => console.error('Erreur redémarrage', err && err.message))
			} catch (err) {
				next(err)
			}
		})

		server.get('/api/configuration', (req, res, next) => {
			Promise.all([config.get(), api.getTimezone()])
				.then(([conf, timezone]) => {
					res.json({ ...conf, timezone })
				})
				.catch(next)
		})

		server.post('/api/reboot', (req, res, next) => {
			res.writeHead(202)
			res.end()
			api.reboot().catch(next)
		})

		server.post('/api/poweroff', (req, res, next) => {
			res.writeHead(202)
			res.end()
			api.poweroff().catch(next)
		})

		server.post('/api/clearCache', (req, res, next) => {
			api
				.clearCache()
				.then(() => {
					res.status(200).json({ success: true })
				})
				.catch(next)
		})

		server.get('/api/ping', async (req, res) => {
			const host = String(req.query.host || '').trim();
			const tcpPort = parseInt(req.query.port, 10);
			if (!host || !HOST_RE.test(host)) return res.json({ ok: false, error: 'Adresse invalide' });

			const ip = req.socket.remoteAddress || '';
			const last = pingLastByIp.get(ip) || 0;
			if (Date.now() - last < 3000) return res.status(429).json({ ok: false });
			pingLastByIp.set(ip, Date.now());
			if (pingLastByIp.size > 200) pingLastByIp.clear();

			let ms = null, method = null;
			if (tcpPort >= 1 && tcpPort <= 65535) { ms = await tcpCheck(host, tcpPort, 3000); if (ms !== null) method = 'tcp'; }
			if (ms === null) { ms = await icmpCheck(host); if (ms !== null) method = 'icmp'; }
			res.json({ ok: ms !== null, method, ms });
		})

		server.post('/api/updateInterface', (req, res) => {
			res.writeHead(202)
			res.end()
			exec('nohup /usr/local/sbin/updateinterface &', { shell: '/bin/bash' })
		})

		const UPDATE_BASE_URL = 'https://www.websdrbordeaux.fr/WebLink/'

		const propre = v => String(v || '').trim().replace(/[^A-Za-z0-9._-]/g, '').slice(0, 24)

		const agentWebLink = async () => {
			const [version, conf] = await Promise.all([
				fsPromises.readFile('/opt/weblink/version.txt', 'utf8').catch(() => ''),
				config.get().catch(() => ({})),
			])
			const id = propre(version.split('\n')[2]) || 'inconnue'
			const indicatif = propre((conf.callsign1 || '').toUpperCase())
			return { 'User-Agent': indicatif ? `WebLink/${id} (${indicatif})` : `WebLink/${id}` }
		}
		const updateCheck = { available: false, version: null }

		const dateKey = d => {
			const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((d || '').trim())
			return m ? Number(m[3] + m[2] + m[1]) : 0
		}

		const checkUpdate = async () => {
			let delay = 600000
			try {
				const res = await fetch(UPDATE_BASE_URL + 'latestVersion.txt', { cache: 'no-store', headers: await agentWebLink(), signal: AbortSignal.timeout(10000) })
				if (!res.ok) throw new Error()
				const [latestId = '', latestDate = ''] = (await res.text()).split('\n').map(l => l.trim())
				const local = (await fsPromises.readFile('/opt/weblink/version.txt', 'utf8')).split('\n').map(l => l.trim())
				const remote = dateKey(latestDate)
				updateCheck.available = remote > 0 && remote > dateKey(local[1]) && latestId !== local[2]
				updateCheck.version = updateCheck.available ? latestId : null
				delay = 7200000
			} catch {}
			setTimeout(checkUpdate, delay)
		}

		setTimeout(checkUpdate, 24000)

		server.get('/api/updateAvailable', (req, res) => res.json(updateCheck))

		const nouveautes = { at: 0, texte: null }

		const lireNouveautes = async () => {
			if (nouveautes.texte !== null && Date.now() - nouveautes.at < 600000) return nouveautes.texte
			const res = await fetch(UPDATE_BASE_URL + 'nouveautes.txt', { cache: 'no-store', headers: await agentWebLink(), signal: AbortSignal.timeout(8000) })
			if (!res.ok) throw new Error()
			nouveautes.texte = await res.text()
			nouveautes.at = Date.now()
			return nouveautes.texte
		}

		const analyserNouveautes = texte => {
			const versions = []
			let section = null
			for (const brut of texte.split(/\r?\n/)) {
				const ligne = brut.trim()
				if (!ligne || ligne.startsWith('#')) continue
				const entete = /^(\S+)\s+[·|-]\s+(\d{2}\/\d{2}\/\d{4})$/.exec(ligne)
				if (entete) {
					versions.push({ id: entete[1], date: entete[2], sections: [] })
					section = null
					continue
				}
				const version = versions[versions.length - 1]
				if (!version) continue
				const point = /^[-*•]\s+(.*)$/.exec(ligne)
				if (point) {
					if (!section) {
						section = { titre: null, points: [] }
						version.sections.push(section)
					}
					section.points.push(point[1])
				} else {
					section = { titre: ligne, points: [] }
					version.sections.push(section)
				}
			}
			return versions
		}

		const DIAG_URL = 'https://pmr.websdrbordeaux.fr/api/diagnostic'
		let dernierDiag = null

		server.get('/api/diag', async (req, res) => {
			try {
				const [version, configuration] = await Promise.all([
					fsPromises.readFile('/opt/weblink/version.txt', 'utf8').catch(() => ''),
					config.get().catch(() => ({})),
				])
				dernierDiag = await construireDiag({ version, configuration, reflecteurs: reflectorWatcher ? reflectorWatcher.getState() : null })
				res.set('Cache-Control', 'no-cache')
				res.json(dernierDiag)
			} catch (err) {
				console.error('Diagnostic :', err && err.message)
				res.status(500).json({ error: 'Diagnostic impossible' })
			}
		})

		server.post('/api/diag/envoyer', async (req, res) => {
			const body = req.body && typeof req.body === 'object' ? req.body : {}
			if (!dernierDiag || Date.now() - dernierDiag.at > 30 * 60 * 1000) {
				return res.status(400).json({ error: "Relancez le diagnostic avant de l'envoyer" })
			}
			const { hotspot, version, indicatif, bilan, texte, at } = dernierDiag
			try {
				const r = await fetch(DIAG_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', ...(await agentWebLink()) },
					body: JSON.stringify({
						hotspot,
						version,
						indicatif,
						contact: String(body.contact || '').trim().slice(0, 200),
						message: String(body.message || '').trim().slice(0, 2000),
						date: new Date(at).toISOString(),
						bilan,
						rapport: texte,
					}),
					signal: AbortSignal.timeout(16000),
				})
				if (!r.ok) {
					const d = await r.json().catch(() => ({}))
					console.error(`Envoi diagnostic : Http ${r.status}`)
					return res.status(502).json({ error: d.error || 'Envoi impossible pour le moment' })
				}
				res.json({ success: true })
			} catch (err) {
				console.error('Envoi diagnostic :', err && err.message)
				res.status(502).json({ error: 'Envoi impossible, vérifiez la connexion internet' })
			}
		})

		server.get('/api/nouveautes', async (req, res) => {
			try {
				const versions = analyserNouveautes(await lireNouveautes())
				const local = (await fsPromises.readFile('/opt/weblink/version.txt', 'utf8')).split('\n').map(l => l.trim())
				const nouvelles = versions.filter(v => dateKey(v.date) > dateKey(local[1]) && v.id !== local[2])
				res.set('Cache-Control', 'no-cache')
				res.json({
					installee: local[2] || null,
					aJour: nouvelles.length === 0,
					versions: nouvelles.length ? nouvelles : versions.filter(v => v.id === local[2]).slice(0, 1),
				})
			} catch {
				res.status(502).json({ error: 'Nouveautés indisponibles' })
			}
		})

		server.get('/api/updateProgress', (req, res) => {
			fs.readFile('/tmp/updateProgress.txt', 'utf8', (err, data) => {
				if (err) {
					return res.json({ progress: 0, message: 'En attente ..' })
				}
				const [progress, message] = data.trim().split('|')
				res.json({
					progress: ['error', 'uptodate'].includes(progress) ? progress : (parseInt(progress) || 0),
					message: message || 'En cours ..'
				})
			})
		})

		server.post('/api/updateNodeInfo', (req, res) => {
			res.writeHead(202)
			res.end()
			exec('nohup /usr/local/sbin/updatenodeinfo &', { shell: '/bin/bash' })
		})

		server.get('/api/updateNodeInfoProgress', (req, res) => {
			fs.readFile('/tmp/updateNodeInfoProgress.txt', 'utf8', (err, data) => {
				if (err) {
					return res.json({ progress: 0, message: 'En attente infos Node ..' })
				}
				const [progress, message] = data.trim().split('|')
				res.json({
					progress: ['error', 'uptodate'].includes(progress) ? progress : (parseInt(progress) || 0),
					message: message || 'En cours ..'
				})
			})
		})

		server.post('/api/cancelUpdate', (req, res) => {
			res.writeHead(202);
			res.end();
			exec( '/usr/bin/killall -9 updateinterface || true; ' + 'systemctl start weblink-led@normal; ' + 'rm -f /tmp/updateProgress.txt',
				{ shell: '/bin/bash' }
			);
		});

		server.post('/api/cancelNodeInfoUpdate', (req, res) => {
			res.writeHead(202);
			res.end();
			exec( '/usr/bin/killall -9 updatenodeinfo || true; ' + 'systemctl start weblink-led@normal; ' + 'rm -f /tmp/updateNodeInfoProgress.txt',
				{ shell: '/bin/bash' }
			);
		});

		server.get('/api/wifi/scan', async (req, res) => {
			try {
				const networks = await config.scanAndListWifi();
				res.json(networks);
			} catch (error) {
				res.status(500).json({ error: "Erreur scan Wifi" });
			}
		})

		server.get('/api/wifi/saved', async (req, res) => {
			try {
				const saved = await config.listSavedConnections();
				res.json(saved);
			} catch (error) {
				res.status(500).json({ error: "Erreur liste réseaux" });
			}
		})

		server.delete('/api/wifi/delete', async (req, res) => {
			try {
				const { name } = req.query;
				await config.deleteConnection(name);
				res.json({ success: true });
			} catch (error) {
				res.status(500).json({ error: "Erreur suppression" });
			}
		})

		server.post('/api/wifi/connect', async (req, res) => {
			try {
				const { ssid, password } = req.body || {};
				const result = await config.connectWifi(ssid, password);
				res.json(result);
			} catch (error) {
				if (error.userMessage) return res.status(400).json({ error: error.message });
				console.error('Erreur connexion wifi', error.message);
				res.status(500).json({ error: "Erreur connexion" });
			}
		})

		server.get('/api/wifi/status', (req, res) => {
			res.json(config.getWifiJob());
		})

		server.post('/api/wifi/finish', async (req, res) => {
			try {
				res.json(await config.finishWifi());
			} catch (error) {
				res.status(500).json({ error: "Erreur arrêt point d'accès" });
			}
		})

		server.post('/api/wifi/switch', async (req, res) => {
			try {
				const { name } = req.body || {};
				const result = await config.switchWifi(name);
				res.json(result);
			} catch (error) {
				if (error.userMessage) return res.status(400).json({ error: error.message });
				console.error('Erreur changement wifi', error.message);
				res.status(500).json({ error: "Erreur changement réseaux" });
			}
		})

		server.get('/api/wifi/wps', async (req, res) => {
			try {
				const plan = await config.wpsPlan(requestIface(req))
				res.json({ mode: plan.live ? 'live' : 'blind', cable: plan.cable, ap: plan.apActive, host: os.hostname() })
			} catch (error) {
				res.status(500).json({ error: 'Erreur Wps' })
			}
		})

		server.post('/api/wifi/wps', async (req, res) => {
			try {
				res.json(await config.startWps(requestIface(req)))
			} catch (error) {
				if (error.userMessage) return res.status(409).json({ error: error.message })
				console.error('Erreur Wps', error.message)
				res.status(500).json({ error: 'Erreur Wps' })
			}
		})

		server.post('/api/wifi/wps/cancel', (req, res) => {
			res.json(config.cancelWps())
		})

		server.get('/api/wifi/active', (req, res) => {
			api.getActiveWifi()
				.then(data => res.json(data))
				.catch(() => res.json({ connected: false }))
		})

		server.get('/api/timezone', (req, res) => {
			api.getTimezone()
				.then(timezone => res.json({ timezone, available: api.TIMEZONES }))
				.catch(() => res.status(500).json({ error: 'Fuseau horaire indisponible' }))
		})

		server.post('/api/timezone', (req, res) => {
			const { timezone } = req.body || {}
			api.setTimezone(timezone)
				.then(result => {
					res.json({ success: true, ...result })
					return restart()
				})
				.catch(err => {
					if (res.headersSent) return console.error('Erreur redémarrage après fuseau', err && err.message)
					if (err && err.userMessage) return res.status(400).json({ error: err.message })
					console.error('Erreur fuseau horaire', err && err.message)
					res.status(500).json({ error: 'Changement de fuseau impossible' })
				})
		})

		server.post('/api/led', (req, res, next) => {
    	const { enabled } = req.body;
    	api.setLed(enabled)
      	.then(() => {
        	res.json({ success: true });
      	})
      	.catch(next);
		});

		server.get('/api/vpn/status', (req, res, next) => {
			Promise.all([api.getVpnStatus(), api.getEnrollState()])
				.then(([status, enroll]) => {
					res.json({ ...status, enroll });
				})
				.catch(next);
		});

		server.post('/api/vpn', (req, res, next) => {
			const { mode, hours } = req.body;
			api.setVpn(mode, hours)
				.then(result => {
					res.json({ success: true, ...result });
				})
				.catch(err => {
					if (err && err.userMessage) {
						return res.status(400).json({ error: err.message });
					}
					res.status(500).json({ error: 'Erreur service Vpn' });
				});
		});

		server.post('/api/vpn/cancel', (req, res, next) => {
			api.cancelEnrollment()
				.then(result => {
					res.json({ success: true, ...result });
				})
				.catch(() => {
					res.status(500).json({ error: 'Erreur annulation' });
				});
		});

		server.get('/api/vpn/log', (req, res, next) => {
			api.getVpnLog(req.query.lines)
				.then(log => {
					res.json({ log });
				})
				.catch(next);
		});

		server.get('/api/stats', async (req, res, next) => {
  		try {
    		const stats = await api.getStats();
    		const speed = await getNetworkSpeed();
    		res.json({ ...stats, upSpeed: speed.up, downSpeed: speed.down });
  		} catch (err) {
    		next(err);
  		}
		});

		server.post('/api/sa818', (req, res) => {
  		const rssi = req.body.rssi ?? req.body.rssi_raw;
  		const { squelch_open, session_duration } = req.body;

  		io.emit('sa818Realtime', {
    		rssi: rssi ?? null,
    		squelch_open: !!squelch_open,
    		session_duration: session_duration ?? 0
  		});
  		res.status(200).json({ success: true });
		});

		server.post('/api/sa818/config', (req, res) => {
  		if (req.body.bandwidth_khz) {
  		    req.body.bandwidth = req.body.bandwidth_khz;
  		}
  		sa818Config = req.body;
  		io.emit('sa818Config', sa818Config);
  		res.status(200).json({ success: true });
		});

		server.get('/api/sa818/config', (req, res) => {
  		res.json(sa818Config || {});
		});

		server.post('/api/sa818/toggle', (req, res) => {
  		const { enabled } = req.body;
  		const action = enabled ? 'start' : 'stop';

  		exec(`systemctl ${action} weblink-sa818.service`, (err) => {
    		if (err) {
      		console.error(`Erreur systemctl ${action}:`, err);
      		return res.status(500).json({ error: "Erreur service" });
    		}

    		if (!enabled) {
      		sa818Config = null;
      		io.emit('sa818Realtime', { rssi: null, squelch_open: false, session_duration: 0 });
      		io.emit('sa818Config', null);
    		}
    		res.json({ status: action + 'ed' });
  		});
		});

		server.get('/api/sa818/status', (req, res) => {
  		exec('systemctl is-active weblink-sa818.service', (err, stdout) => {
    		const isActive = stdout.trim() === 'active';
    		res.json({ enabled: isActive });
  		});
		});

		server.get('/api/log', (req, res) => {
			const AllowedLogPaths = [
				'/tmp/svxlink.log',
				'/var/log/syslog',
			];
			const file = req.query.file;
			if (!file || !AllowedLogPaths.includes(file)) {
				return res.status(403).json({ error: 'Fichier non autorisé' });
			}
			exec(`tail -n 888 "${file}" 2>&1`, { shell: '/bin/bash' }, (err, stdout, stderr) => {
				if (err && !stdout) {
					return res.status(500).send(stderr || 'Erreur lecture fichier');
				}
				res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
				res.end(stdout);
			});
		});

		server.get('/api/storage', (req, res) => {
			exec("df -B1 / | tail -1; df -Pi / | tail -1", (err, stdout) => {
				if (err) return res.status(500).json({ error: 'Erreur lecture carte' });
				const [ligne, ligneInodes = ''] = stdout.trim().split('\n');
				const parts = ligne.trim().split(/\s+/);
				const inodesLibres = parseInt(ligneInodes.trim().split(/\s+/)[3], 10);
				const total = parseInt(parts[1]);
				const used  = parseInt(parts[2]);
				const avail = parseInt(parts[3]);
				const pct   = Math.round((used / total) * 100);
				const toGB  = v => (v / 1073741824).toFixed(1);
				res.json({ total: toGB(total), used: toGB(used), avail: toGB(avail), pct, availMo: Math.round(avail / 1048576), inodesLibres: isNaN(inodesLibres) ? null : inodesLibres, extensibleMo: placeExtensibleMo() });
			});
		});

		server.post('/api/resize2fs', (req, res) => {
			const etat = (() => { try { return fs.readFileSync('/run/weblink-etendre.etat', 'utf8').trim() } catch { return '' } })();
			if (etat === 'encours') return res.status(409).json({ error: 'Extension déjà en cours' });
			try { fs.writeFileSync('/run/weblink-etendre.etat', 'encours') } catch {}
			const p = require('child_process').spawn('/usr/local/sbin/weblink-etendre', [], { detached: true, stdio: 'ignore' });
			p.on('error', () => { try { fs.writeFileSync('/run/weblink-etendre.etat', 'erreur') } catch {} });
			p.unref();
			res.status(202).json({ success: true });
		});

		server.get('/api/resize2fs/log', (req, res) => {
			const lire = f => { try { return fs.readFileSync(f, 'utf8') } catch { return '' } };
			res.set('Cache-Control', 'no-cache');
			res.json({ log: lire('/var/log/weblink-etendre.log'), etat: lire('/run/weblink-etendre.etat').trim() || 'inconnu' });
		});

		server.get('/api/logsTemps', async (req, res) => {
  		try {
    		const numberOfLines = req.query.lines ? parseInt(req.query.lines) : 200;
    		const uniqueByDate = req.query.uniqueByDate === 'false' ? false : true;

    		const formattedResult = await getFormattedLogsWithDuration(numberOfLines, uniqueByDate);
    		res.setHeader('Content-Type', 'text/plain');
    		res.send(formattedResult);
  		} catch (error) {
    		console.error('Erreur récupération logs durée', error);
    		res.status(500).send('Erreur récupération logs durée');
  		}
		});

		server.get('/api/logs2', async (req, res) => {
  		const formattedResult = await getFormattedLogs(
    		line => line.includes('ReflectorLogic: Talker start:') || line.includes('ReflectorLogic: Talker stop:'),
    		line => {
      		let cleaned = line.trim().replace(': ReflectorLogic: Talker', '');
      		const parts = cleaned.split(/\s+/);
      		if (parts.length >= 4) {
        		const [date, time, status, ...rest] = parts;
        		return `${date}  ${time}  ${status}  ${rest.join(' ')}`;
      		}
      		return cleaned;
    		},
    		180
  		);
  		res.setHeader('Content-Type', 'text/plain');
  		res.send(formattedResult);
		});

		server.get('/api/logs3', async (req, res) => {
  		const formattedResult = await getFormattedLogs(
    		line => line.includes('ReflectorLogic: Node left:') || line.includes('ReflectorLogic: Node joined:'),
    		line => {
      		let cleaned = line.trim().replace(': ReflectorLogic: Node', '');
      		const parts = cleaned.split(/\s+/);
      		if (parts.length >= 4) {
        		const [date, time, arrow, ...rest] = parts;
        		return `${date}  ${time}  ${arrow}  ${rest.join(' ')}`;
      		}
      		return cleaned;
    		},
    		180
  		);
  		res.setHeader('Content-Type', 'text/plain');
  		res.send(formattedResult);
		});

		server.get('/api/nodeInfo/:set', (req, res) => {
			const set = req.params.set
			if (set !== 'nodeInfo' && set !== 'nodeInfo2') return res.status(404).json({ error: 'Liste inconnue' })
			readNodeInfo(set)
				.then(data => {
					res.set('Cache-Control', 'no-cache')
					res.json(data)
				})
				.catch(() => res.status(500).json({ error: 'Infos nodes indisponibles' }))
		})

		server.get('/api/hotspots', (req, res) => {
			getHotspots()
				.then(data => res.json(data))
				.catch(() => res.json([]))
		})

		server.get('/api/timesync', (req, res) => {
			getTimeSync()
				.then(data => res.json(data))
				.catch(() => res.json({ state: 'unknown' }))
		})

		server.get('/api/netinfo', (req, res) => {
			api.getNetInfo()
				.then(data => res.json(data))
				.catch(() => res.status(500).json({ error: 'Infos réseau indisponibles' }))
		})

		server.get('/api/reflectors', (req, res) => {
			res.json(reflectorWatcher ? reflectorWatcher.getState() : { running: null, reflectors: [], lastHeard: [] })
		})

		server.get('/api/:id', (req, res, next) => {
			api
				.get(req.params.id)
				.then(r => {
					res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
					res.end(r.toString())
				})
				.catch(next)
		})

		server.get('*', (req, res) => {
			return handle(req, res)
		})

		const httpSrv = http.createServer(server);

		const io = socketIO();
		io.attach(httpSrv);

		reflectorWatcher = createReflectorWatcher({
			logFile: logFilePath,
			confFile: SVXLINK_CONF,
			onChange: state => io.emit('reflectorStatus', state),
		});

		io.on('connection', (socket) => {
			if (sa818Config) {
				socket.emit('sa818Config', sa818Config);
			}
			socket.emit('reflectorStatus', reflectorWatcher.getState());

			let term = null;

			const killTerm = () => {
				if (!term) return;
				const t = term;
				term = null;
				try { t.kill(); } catch {}
			};

			socket.on('terminalReady', () => {
				if (term) { term.write('\x0c'); return; }
				term = pty.spawn('bash', ['-i'], {
					name: 'xterm-256color',
					cols: 80,
					rows: 24,
					cwd: process.env.HOME,
					env: { ...process.env, TERM: 'xterm-256color' }
				});
				const current = term;
				current.on('data', data => socket.emit('termData', data));
				current.on('exit', () => {
					if (term !== current) return;
					term = null;
					socket.emit('termData', '\r\n\x1b[33m[ Session terminée, fermez et rouvrez le terminal ]\x1b[0m\r\n');
				});
			});

			socket.on('termData', (data) => {
				if (term && typeof data === 'string') term.write(data);
			});

			socket.on('termResize', (size) => {
				const cols = parseInt(size && size.cols, 10);
				const rows = parseInt(size && size.rows, 10);
				if (!term || !(cols >= 20 && cols <= 400) || !(rows >= 5 && rows <= 200)) return;
				try { term.resize(cols, rows); } catch {}
			});

			socket.on('disconnect', () => {
				killTerm();

				setTimeout(() => {
					const connectedCount = io.engine.clientsCount;
					if (connectedCount === 0) {
						console.log("Client inactif, arrêt service");
						exec('systemctl stop weblink-sa818.service');
					}
				}, 2000);
			});
		});

		httpSrv.listen(port, err => {
			if (err) throw err;
			console.log(`--> http://${hostname}:${port}`)
			console.log()
		})
	})
	.catch(err => {
		throw err
	})