const fs = require('fs')
const os = require('os')
const path = require('path')
const childProcess = require('child_process')
const http = require('http')
const https = require('https')
const promisify = require('util.promisify')
const humanizeDuration = require('humanize-duration')
const prettyBytes = require('pretty-bytes')
const config = require('../config')
const svxlink = require('./svxlink').fsm

const weblinkConfig = require('./config')

const exec = promisify(childProcess.exec)
const execFile = promisify(childProcess.execFile)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const appendFile = promisify(fs.appendFile)

const VPN_UNIT = 'wg-quick@wg0'
const VPN_IFACE = 'wg0'
const VPN_TIMER = 'weblink-vpn-autoclose'
const VPN_LOG = '/var/log/vpnAccess.log'
const VPN_MODES = ['off', 'always', 'temp']
const VPN_CONF = '/etc/wireguard/wg0.conf'
const ENROLL_BIN = '/usr/local/sbin/vpnenroll'
const ENROLL_STATE = '/etc/weblinkVpn/state.json'
const ENROLL_TIMER = 'weblink-vpn-enrolement.timer'

const PUBLIC_IP_URL = 'https://www.websdrbordeaux.fr/monip.php'
const PUBLIC_IP_TTL_OK = 30 * 60 * 1000
const PUBLIC_IP_TTL_KO = 2 * 60 * 1000
const WIFI_IFACE = 'wlan0'
const TIMEZONES = ['Europe/Paris', 'America/Martinique', 'Pacific/Tahiti']
const ZONEINFO = '/usr/share/zoneinfo/'

function getNetwork() {
	return readFile(path.join(config.dir, 'network'), 'utf8').then(v => v.trim()).then(v => v.replace('\n', ''))
}

function restart(network) {
	return exec(path.join(config.dir, `restart.${network}`))
}

function setNetwork(network) {
	return writeFile(path.join(config.dir, 'network'), network)
}

const clearCache = () => {
	return exec("sync && echo 3 > /proc/sys/vm/drop_caches")
}

const stats = {
	temperature() {
		return Promise.all(config.thermal.map(p => readFile(p, 'utf8')))
			.then(temps => Math.round(temps.reduce((a, b) => Number(a) + Number(b), 0) / (1000 * temps.length)))
			.then(temp => `${temp}°C`)
	},
	uptime() {
		return humanizeDuration(os.uptime() * 1000, { round: true, largest: 3, language: 'fr' })
	},
	hostname() {
		return os.hostname()
	},
	memory() {
		return readFile('/proc/meminfo', 'utf8').then(data => {
			const total = parseInt(data.match(/^MemTotal:\s+(\d+)/m)[1]) * 1024;
			const free = parseInt(data.match(/^MemFree:\s+(\d+)/m)[1]) * 1024;
			const cached = parseInt(data.match(/^Cached:\s+(\d+)/m)[1]) * 1024;
			const buffers = parseInt(data.match(/^Buffers:\s+(\d+)/m)[1]) * 1024;
			const used = total - free - cached - buffers;
			return `${prettyBytes(used)} sur ${prettyBytes(total)}`;
		});
	},
	memoryRaw() {
		return readFile('/proc/meminfo', 'utf8').then(data => {
			const total = parseInt(data.match(/^MemTotal:\s+(\d+)/m)[1]) * 1024;
			const free = parseInt(data.match(/^MemFree:\s+(\d+)/m)[1]) * 1024;
			const cached = parseInt(data.match(/^Cached:\s+(\d+)/m)[1]) * 1024;
			const buffers = parseInt(data.match(/^Buffers:\s+(\d+)/m)[1]) * 1024;
			const used = total - free - cached - buffers;
			return { pct: Math.round((used / total) * 100) };
		});
	},
	cpuFreq() {
		return readFile('/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq', 'utf8')
			.then(data => {
				const khz = parseInt(data.trim(), 10);
				const mhz = Math.round(khz / 1000);
				return `${mhz} MHz`;
			});
	},
	cpuFreqRaw() {
		return Promise.all([
			readFile('/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq', 'utf8'),
			readFile('/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq', 'utf8')
				.catch(() => readFile('/sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq', 'utf8'))
		]).then(([cur, max]) => ({
			cur: Math.round(parseInt(cur.trim(), 10) / 1000),
			max: Math.round(parseInt(max.trim(), 10) / 1000)
		}));
	},
	cpuLoad() {
		const readStat = () => readFile('/proc/stat', 'utf8').then(data => {
			const line = data.split('\n')[0];
			const parts = line.trim().split(/\s+/).slice(1).map(Number);
			const idle = parts[3] + (parts[4] || 0);
			const total = parts.reduce((a, b) => a + b, 0);
			return { idle, total };
		});
		return readStat().then(s1 => new Promise(resolve => {
			setTimeout(() => readStat().then(s2 => {
				const dIdle = s2.idle - s1.idle;
				const dTotal = s2.total - s1.total;
				const load = dTotal > 0 ? Math.round((1 - dIdle / dTotal) * 100) : 0;
				resolve(load);
			}), 400);
		}));
	},
	network() {
		return getNetwork()
	},
	ip() {
		return Object.entries(os.networkInterfaces())
			.map(([k, v]) => Object.assign({}, v.find(a => a.family === 'IPv4'), { name: k }))
			.filter(int => !int.internal)
			.map(({ name, address }) => `${name} ${address}`)
			.join(' - ');
	},
	datetime() {
		return new Date().toISOString()
	},
	osInfo() {
		return readFile('/etc/os-release', 'utf8')
			.then(data => {
				const lines = data.split('\n');
				let prettyName = '';
				for (const line of lines) {
					if (line.startsWith('PRETTY_NAME=')) {
						prettyName = line.substring('PRETTY_NAME='.length).replace(/"/g, '');
						break;
					}
				}
				return prettyName || `${os.type()} ${os.release()}`;
			})
			.catch(() => `${os.type()} ${os.release()}`);
	},
	kernel() {
		return os.release();
	},
	ping() {
		return exec('ping -c 1 -W 5 www.websdrbordeaux.fr')
			.then(() => 'ok')
			.catch(() => 'horsLigne');
	},
}

let publicIpCache = { ip: null, at: 0 }
let publicIpPending = null

function fetchPublicIp() {
	return new Promise(resolve => {
		let url
		try { url = new URL(PUBLIC_IP_URL) } catch (e) { return resolve(null) }
		const lib = url.protocol === 'http:' ? http : https
		const req = lib.get(url, { family: 4, timeout: 4000, headers: { 'User-Agent': 'WebLink', 'Cache-Control': 'no-cache' } }, res => {
			if (res.statusCode !== 200) { res.resume(); return resolve(null) }
			let body = ''
			res.setEncoding('utf8')
			res.on('data', chunk => { body += chunk; if (body.length > 100) req.destroy() })
			res.on('end', () => {
				const ip = body.trim()
				resolve(/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) ? ip : null)
			})
		})
		req.on('timeout', () => req.destroy())
		req.on('error', () => resolve(null))
	})
}

function getPublicIp() {
	const age = Date.now() - publicIpCache.at
	const ttl = publicIpCache.ip ? PUBLIC_IP_TTL_OK : PUBLIC_IP_TTL_KO
	if (publicIpCache.at && age < ttl) return Promise.resolve(publicIpCache.ip)
	if (!publicIpPending) {
		publicIpPending = fetchPublicIp()
			.then(ip => { publicIpCache = { ip, at: Date.now() }; return ip })
			.finally(() => { publicIpPending = null })
	}
	return publicIpPending
}

function getDefaultRoute() {
	return execFile('ip', ['-4', 'route', 'show', 'default'], { timeout: 3000 })
		.then(({ stdout }) => {
			const routes = String(stdout).split('\n')
				.map(line => {
					const m = line.match(/^default via (\S+) dev (\S+)(?:.*\bmetric (\d+))?/)
					return m ? { via: m[1], dev: m[2], metric: parseInt(m[3] || '0', 10) } : null
				})
				.filter(Boolean)
				.sort((a, b) => a.metric - b.metric)
			return routes[0] || null
		})
		.catch(() => null)
}

function getPhysicalInterfaces() {
	const addrs = os.networkInterfaces()
	let names = []
	try { names = fs.readdirSync('/sys/class/net') } catch (e) { return [] }
	return names
		.filter(n => n !== 'lo' && !/^(uap|wg|docker|veth|br-|tun|tap)/.test(n))
		.filter(n => fs.existsSync(`/sys/class/net/${n}/device`))
		.map(n => {
			const read = f => { try { return fs.readFileSync(`/sys/class/net/${n}/${f}`, 'utf8').trim() } catch (e) { return '' } }
			const v4 = (addrs[n] || []).find(a => a.family === 'IPv4' || a.family === 4)
			return { name: n, mac: read('address') || null, up: read('operstate') === 'up', ip: v4 ? v4.address : null }
		})
		.sort((a, b) => a.name.localeCompare(b.name))
}

function splitNmcli(line) {
	const out = []
	let cur = ''
	for (let i = 0; i < line.length; i++) {
		const c = line[i]
		if (c === '\\' && i + 1 < line.length) { cur += line[++i]; continue }
		if (c === ':') { out.push(cur); cur = ''; continue }
		cur += c
	}
	out.push(cur)
	return out
}

function getWifiInfo() {
	if (!fs.existsSync(`/sys/class/net/${WIFI_IFACE}`)) return Promise.resolve(null)
	const nm = execFile('nmcli', ['-t', '-f', 'ACTIVE,SSID,SIGNAL,CHAN,RATE', 'device', 'wifi', 'list', 'ifname', WIFI_IFACE, '--rescan', 'no'],
		{ timeout: 5000, env: Object.assign({}, process.env, { LC_ALL: 'C' }) })
		.then(({ stdout }) => {
			const active = String(stdout).split('\n').map(splitNmcli).find(f => f[0] === 'yes')
			if (!active) return { connected: false }
			return { connected: true, ssid: active[1] || null, signal: parseInt(active[2], 10) || null, chan: active[3] || null, rate: active[4] || null }
		})
		.catch(() => ({ connected: false }))
	const dbm = readFile('/proc/net/wireless', 'utf8')
		.then(data => {
			const line = data.split('\n').find(l => l.trim().startsWith(`${WIFI_IFACE}:`))
			if (!line) return null
			const level = parseFloat(line.trim().split(/\s+/)[3])
			return isNaN(level) || level >= 0 ? null : Math.round(level)
		})
		.catch(() => null)
	return Promise.all([nm, dbm]).then(([info, level]) => (info.connected ? Object.assign(info, { dbm: level }) : info))
}

function getNetInfo() {
	return Promise.all([getDefaultRoute(), getWifiInfo(), getPublicIp()])
		.then(([route, wifi, publicIp]) => ({
			gateway: route ? route.via : null,
			gatewayDev: route ? route.dev : null,
			interfaces: getPhysicalInterfaces(),
			wifi,
			publicIp,
		}))
}

function getActiveWifi() {
	return getWifiInfo().then(info => {
		if (!info || !info.connected) return { connected: false }
		const v4 = (os.networkInterfaces()[WIFI_IFACE] || []).find(a => a.family === 'IPv4' || a.family === 4)
		return Object.assign({}, info, { ip: v4 ? v4.address : null, iface: WIFI_IFACE })
	})
}

function getTimezone() {
	return execFile('timedatectl', ['show', '-p', 'Timezone', '--value'], { timeout: 5000 })
		.then(({ stdout }) => String(stdout).trim())
		.catch(() => '')
		.then(tz => tz || promisify(fs.readlink)('/etc/localtime')
			.then(link => link.split(ZONEINFO)[1] || '')
			.catch(() => ''))
		.then(tz => tz || 'UTC')
}

function setTimezone(tz) {
	if (!TIMEZONES.includes(tz)) {
		const err = new Error('Fuseau non autorisé')
		err.userMessage = true
		return Promise.reject(err)
	}
	return execFile('timedatectl', ['set-timezone', tz], { timeout: 10000 })
		.catch(err => {
			console.error(`timedatectl indisponible (${err.message}), repli /etc/localtime`)
			if (!fs.existsSync(ZONEINFO + tz)) throw new Error(`Fuseau ${tz} absent du système`)
			return execFile('ln', ['-sf', ZONEINFO + tz, '/etc/localtime'])
				.then(() => writeFile('/etc/timezone', `${tz}\n`))
		})
		.then(() => exec('sync').catch(() => {}))
		.then(() => {
			process.env.TZ = tz
			console.log(`Fuseau horaire : ${tz}`)
			return { timezone: tz }
		})
}

module.exports.getNetInfo = getNetInfo
module.exports.getActiveWifi = getActiveWifi
module.exports.getTimezone = getTimezone
module.exports.setTimezone = setTimezone
module.exports.TIMEZONES = TIMEZONES

module.exports.getStats = async function () {
	const keys = ['uptime', 'memory', 'memoryRaw', 'cpuFreq', 'cpuFreqRaw', 'cpuLoad', 'ip', 'ping', 'temperature', 'datetime'];
	const results = {};
	await Promise.all(keys.map(async (key) => {
		try {
			results[key] = await stats[key]();
		} catch (err) {
			results[key] = 'n/a';
		}
	}));
	return results;
};

module.exports.clearCache = clearCache
module.exports.getNetwork = getNetwork
module.exports.setNetwork = setNetwork
module.exports.get = function get(id) {
	if (stats[id] && typeof stats[id] === 'function') {
		return Promise.resolve(stats[id]()).catch(err => {
			console.error(`Erreur ${id}:`, err);
			return 'horsLigne';
		});
	}
	return Promise.reject(new Error(`Statistique ${id} non trouvée`));
}
module.exports.setLed = function (enabled) {
	const on = enabled === true || enabled === 'true';
	const mode = on ? 'normal' : 'off';
	return exec(`systemctl start weblink-led@${mode}`)
		.catch(err => {
			console.error(`Erreur Led: ${err}`);
			throw err;
		})
		.then(() => weblinkConfig.patch({ ledEnabled: on }).catch(err => console.error(`Erreur sauvegarde Led: ${err}`)));
}
function getVpnStatus() {
	const cmd = [
		`A=$(systemctl is-active ${VPN_UNIT} 2>/dev/null || true)`,
		`E=$(systemctl is-enabled ${VPN_UNIT} 2>/dev/null || true)`,
		`H=$(wg show ${VPN_IFACE} latest-handshakes 2>/dev/null | awk 'NR==1{print $2}' || true)`,
		`T=$(systemctl show -p NextElapseUSecRealtime --value ${VPN_TIMER}.timer 2>/dev/null || true)`,
		`echo "\${A:-inactive}|\${E:-disabled}|\${H:-0}|\${T:-0}"`
	].join('; ')

	return exec(cmd)
		.then(({ stdout }) => {
			const [active, enabled, hs, next] = String(stdout).trim().split('|')
			const handshake = parseInt(hs, 10) || 0
			const nextElapse = parseInt(next, 10) || 0
			const running = active === 'active'

			return {
				running,
				persistent: enabled === 'enabled',
				connected: handshake > 0 && (Date.now() / 1000 - handshake) < 180,
				lastHandshake: handshake,
				expiresAt: nextElapse ? Math.round(nextElapse / 1000) : null,
				mode: !running ? 'off' : (enabled === 'enabled' ? 'always' : 'temp')
			}
		})
		.catch(err => {
			console.error(`Erreur statut Vpn: ${err}`)
			return { running: false, persistent: false, connected: false, lastHandshake: 0, expiresAt: null, mode: 'off' }
		})
}

function getEnrollState() {
	return readFile(ENROLL_STATE, 'utf8')
		.then(raw => JSON.parse(raw))
		.then(s => ({
			status: s.status || 'none',
			nodeId: s.nodeId || '',
			label: s.label || '',
			code: s.status === 'pending' ? (s.code || '') : '',
			message: s.message || ''
		}))
		.catch(() => ({ status: 'none', nodeId: '', label: '', code: '', message: '' }))
}

function isEnrolled() {
	return new Promise(resolve => {
		fs.access(VPN_CONF, fs.constants.R_OK, err => resolve(!err))
	})
}

function applyVpnMode(mode, h) {
	const stopTimer =
		`systemctl stop ${VPN_TIMER}.timer 2>/dev/null || true; ` +
		`systemctl reset-failed ${VPN_TIMER}.service 2>/dev/null || true; `

	let cmd
	if (mode === 'off') {
		cmd = stopTimer +
			`systemctl disable --now ${ENROLL_TIMER} 2>/dev/null || true; ` +
			`systemctl disable --now ${VPN_UNIT}`
	} else if (mode === 'always') {
		cmd = stopTimer + `systemctl enable --now ${VPN_UNIT}`
	} else {
		cmd = stopTimer +
			`systemctl disable ${VPN_UNIT} 2>/dev/null || true; ` +
			`systemctl start ${VPN_UNIT} && ` +
			`systemd-run --on-active=${h}h --unit=${VPN_TIMER} --description="WebLink - Fermeture automatique du VPN" systemctl stop ${VPN_UNIT}`
	}

	return exec(cmd)
}

function requestEnrollment(mode, h) {
	return weblinkConfig.get()
		.then(conf => String((conf && conf.callsign1) || '').trim())
		.catch(() => '')
		.then(label =>
			execFile(ENROLL_BIN, ['request', mode, String(h), label])
		)
}

function setVpn(mode, hours) {
	if (!VPN_MODES.includes(mode)) {
		return Promise.reject(new Error(`Mode Vpn invalide: ${mode}`))
	}

	const h = Math.min(Math.max(parseInt(hours, 10) || 4, 1), 24)

	return isEnrolled()
		.then(enrolled => {
			if (enrolled || mode === 'off') return applyVpnMode(mode, h)
			return requestEnrollment(mode, h)
		})
		.then(() => {
			const label = mode === 'temp' ? `temp ${h}h` : mode
			return appendFile(VPN_LOG, `${new Date().toISOString()} ${label}\n`).catch(() => {})
		})
		.then(() => ({ mode, hours: mode === 'temp' ? h : null }))
		.catch(err => {
			console.error(`Erreur Vpn: ${err}`)
			throw err
		})
}

function getVpnLog(lines = 50) {
	const n = Math.min(Math.max(parseInt(lines, 10) || 50, 1), 500)
	return exec(`tail -n ${n} ${VPN_LOG} 2>/dev/null || true`)
		.then(({ stdout }) => String(stdout || ''))
		.catch(() => '')
}

module.exports.getVpnStatus = getVpnStatus
function cancelEnrollment() {
	return execFile(ENROLL_BIN, ['cancel'])
		.then(() => ({ cancelled: true }))
		.catch(err => {
			console.error(`Erreur annulation Vpn: ${err}`)
			throw err
		})
}

module.exports.cancelEnrollment = cancelEnrollment
module.exports.getEnrollState = getEnrollState
module.exports.setVpn = setVpn
module.exports.getVpnLog = getVpnLog
module.exports.reboot = () => exec('systemctl reboot')
module.exports.poweroff = () => exec('systemctl poweroff')
module.exports.svxlink = () => Object.assign({}, svxlink, { nodes: [...svxlink.nodes] })
module.exports.restart = restart