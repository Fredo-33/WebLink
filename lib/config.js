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

module.exports.set = async function set(config) {
  const callsign = config.callsign ? config.callsign.toUpperCase() : ''
  const band_type = config.band_type ? config.band_type.toUpperCase() : ''
  const departement = config.departement ? config.departement.toUpperCase() : ''

  const wifi_ssid_box = config.wifi_ssid_box
  const wpa_key_box = config.wpa_key_box

  const wifi_ssid_phone = config.wifi_ssid_phone
  const wpa_key_phone = config.wpa_key_phone

  const wifi_priority_choice = config.wifi_priority_choice || 'none'

  let priority_box = 0
  let priority_phone = 0

  switch (wifi_priority_choice) {
    case 'box':
      priority_box = 50
      priority_phone = 10
      break
    case 'phone':
      priority_box = 10
      priority_phone = 50
      break
    case 'none':
    default:
      priority_box = 0
      priority_phone = 0
      break
  }

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

  var Rxct = 0
  var sRxct = ''
  var Txct = 0
  var sTxct = ''
  var Group = ''

  const targetConfigPath = path.join(dir, 'config.json')

  return readFile(path.join(dir, `svxlink.cfg`), 'utf8')
    .then(data => {
      const current = ini.decode(data)

      if (current.SimplexLogic) current.SimplexLogic.CALLSIGN = callsign
      if (current.ReflectorLogic) {
        current.ReflectorLogic.CALLSIGN = `(${departement}) ${callsign} ${band_type}`
      }
      if (current.LocationInfo) current.LocationInfo.CALLSIGN = `${config.type}-${callsign}`

      if (current.Rx1) current.Rx1.SQL_DET = config.sql_det

      if (current.SimplexLogic) current.SimplexLogic.REPORT_CTCSS = config.ctcss_rx
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
    .then(async () => {
      if (wifi_ssid_box && wpa_key_box) {
        try {
          const { stdout: conList } = await exec('nmcli connection show')
          const connectionExists = conList.includes(wifi_ssid_box)

          if (!connectionExists) {
            await exec(`nmcli device wifi connect "${wifi_ssid_box}" password "${wpa_key_box}"`)
            await exec(`nmcli connection modify "${wifi_ssid_box}" connection.autoconnect yes connection.autoconnect-priority ${priority_box}`)
          } else {
            await exec(`nmcli connection modify "${wifi_ssid_box}" wifi-sec.psk "${wpa_key_box}" connection.autoconnect yes connection.autoconnect-priority ${priority_box}`)
            await exec(`nmcli connection up "${wifi_ssid_box}"`)
          }
        } catch (err) {
          console.error('Erreur configuration Wifi Box :', err)
        }
      }

      if (wifi_ssid_phone && wpa_key_phone) {
        try {
          const { stdout: conList } = await exec('nmcli connection show')
          const connectionExists = conList.includes(wifi_ssid_phone)

          if (!connectionExists) {
            await exec(`nmcli device wifi connect "${wifi_ssid_phone}" password "${wpa_key_phone}"`)
            await exec(`nmcli connection modify "${wifi_ssid_phone}" connection.autoconnect yes connection.autoconnect-priority ${priority_phone}`)
          } else {
            await exec(`nmcli connection modify "${wifi_ssid_phone}" wifi-sec.psk "${wpa_key_phone}" connection.autoconnect yes connection.autoconnect-priority ${priority_phone}`)
            await exec(`nmcli connection up "${wifi_ssid_phone}"`)
          }
        } catch (err) {
          console.error('Erreur configuration Wifi Phone :', err)
        }
      }
    })
    .then(() => {
      return readFile("/proc/cpuinfo", 'utf8')
        .then(data => {
          if (data.indexOf("a020d3") > -1) {
            return readFile(
              path.join('/etc', 'wpa_supplicant', 'wpa_supplicant.conf'),
              'utf8'
            ).then(data => {
              const regex = /network=\{\s*ssid="(.*)"\s*psk="(.*)"\s*key_mgmt=(.*)\n\}/gm
              let [, ssid, psk, key_mgmt] = regex.exec(data) || []

              return writeFile(
                path.join('/etc', 'wpa_supplicant', 'wpa_supplicant.conf'),
                data
              )
            })
          }
          return null
        })
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
    .then(async () => {
      const ctcss818 = [ '67', '71.9', '74.4', '77', '79.7', '82.5', '85.4', '88.5', '91.5', '94.8', '97.4', '100', '103.5', '107.2', '110.9', '114.8', '118.8', '123', '127.3', '131.8', '136.5', '141.3', '146.2', '151.4', '156.7', '162.2', '167.9', '173.8', '179.9', '186.2', '192.8', '203.5', '210.7', '218.1', '225.7', '233.6', '241.8','Pas de Ctcss' ]

      rx_818 = parseFloat(rx_818 || 0).toFixed(4)
      tx_818 = parseFloat(tx_818 || 0).toFixed(4)

      if (`${Rx_dcs}` === "0000" || Rx_dcs === undefined) {
        Rxct = ctcss818.indexOf(Rx_ctcss)
        Rxct = Rxct + 10001
        sRxct = Rxct.toString().substring(1, 5)
      } else {
        sRxct = Rx_dcs.toString()
      }

      if (`${Tx_dcs}` === "0000" || Tx_dcs === undefined) {
        Txct = ctcss818.indexOf(Tx_ctcss)
        Txct = Txct + 10001
        sTxct = Txct.toString().substring(1, 5)
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
          const cmd = path.join('/usr', 'local/sbin', `818cli-prog -g ${Group}`)
          const { stdout, stderr } = await exec(cmd)
          if (stdout) console.log('818cli-prog stdout:', stdout)
          if (stderr) console.error('818cli-prog stderr:', stderr)
        }
        catch (err) {
          console.error('Erreur exécution 818cli-prog :', err)
        }
      }
    })
    .catch(err => {
      console.error('Erreur FATALE dans lib/config.js set() :', err)
      throw err
    })
}

module.exports.scanAndListWifi = async function scanAndListWifi() {
  try {
    await exec('nmcli device wifi rescan')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const { stdout } = await exec('nmcli -t -f SSID,SIGNAL,SECURITY device wifi list')

    const networks = stdout.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [ssid, signal, security] = line.split(':')
        return {
          ssid: ssid,
          signal: parseInt(signal),
          security: security || 'None'
        }
      })

    const uniqueNetworks = []
    const seenSsids = new Set()
    for (const net of networks) {
      if (!seenSsids.has(net.ssid)) {
        uniqueNetworks.push(net)
        seenSsids.add(net.ssid)
      }
    }

    uniqueNetworks.sort((a, b) => b.signal - a.signal)

    return uniqueNetworks

  } catch (error) {
    console.error("Erreur scan Wifi (Node.js) :", error)
    throw new Error("Scanne Wifi impossible : " + error.message)
  }
}