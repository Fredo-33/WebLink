import React from 'react'
import ReactDOM from 'react-dom'
import formatcoords from 'formatcoords'
import Layout from '../components/LayoutMob'
import fetch from '../lib/fetch'
import { Notif } from '../lib/notif';
import io from 'socket.io-client';
import { useTheme, ThemeToggle, ThemeContext } from '../lib/themeContext'
import dynamic from 'next/dynamic'
import Router from 'next/router'

const MapPicker = dynamic(() => import('../lib/map'), {
  ssr: false,
  loading: () => <p style={{ color: '#4ade80', textAlign: 'center' }}>Chargement carte ..</p>
});

if (typeof window !== 'undefined') {
  const preload = () => import('../lib/map');
  if ('requestIdleCallback' in window) { requestIdleCallback(preload); }
  else { setTimeout(preload, 2000); }
}

const CTCSS_FREQUENCIES = ['Pas de Ctcss','67','71.9','74.4','77','79.7','82.5','85.4','88.5','91.5','94.8','97.4','100','103.5','107.2','110.9','114.8','118.8','123','127.3','131.8','136.5','141.3','146.2','151.4','156.7','162.2','167.9','173.8','179.9','186.2','192.8','203.5','210.7','218.1','225.7','233.6','241.8']
const DCS_CODES = ['023','025','026','031','032','036','043','047','051','053','054','065','071','072','073','074','114','115','116','122','125','131','132','134','143','145','152','155','156','162','165','172','174','205','212','223','225','226','243','244','245','246','251','252','255','261','263','265','266','271','274','306','311','315','325','331','332','343','346','351','356','364','365','371','411','412','413','423','431','432','445','446','452','454','455','462','464','465','466','503','506','516','523','526','532','546','565','606','612','624','627','631','632','654','662','664','703','712','723','731','732','734','743','754']
const NO_DCS = '0000'
const NO_CTCSS = 'Pas de Ctcss'
const DCS_OPTIONS = [NO_DCS, ...DCS_CODES.reduce((a, c) => a.concat(c + 'N', c + 'I'), [])]
const hasDcs = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== NO_DCS

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'France' },
  { value: 'America/Martinique', label: 'Martinique' },
  { value: 'Pacific/Tahiti', label: 'Polynésie française' },
];

const IMMEDIATE_KEYS = ['ledEnabled', 'timezone'];

const WPS_RUNNING = ['wps-wait', 'wps-cred', 'connecting'];

const FREQ_RE = /^\d{3}\.\d{4}$/;
const NO_TRIM_KEYS = /^passres/;
const isFreqValid = v => !v || FREQ_RE.test(String(v).trim());
const isPortValid = v => {
  const t = String(v === undefined || v === null ? '' : v).trim();
  if (!t) return true;
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
};
const wifiPassError = p => (p && (p.length < 8 || p.length > 63) ? 'Mot de passe de 8 à 63 caractères' : '');

const RESEAUX_RA = ['ri49', 'gir', 'rrf', 'tec', 'bav'];

const UI_STATE_KEYS = [
  'isSaving', 'currentNetwork', 'saveFlow', 'activeTab', 'showMap',
  'availableWifiNetworks', 'savedNetworks', 'isScanningWifi', 'wifiScanError', 'showWifiPopup', 'showWifiPasswordPopup',
  'selectedSsid', 'wifiPasswordInput', 'wifiManual', 'wifiJob', 'showWifiDeletePopup', 'networkToDelete',
  'isSwitchingWifi', 'switchingNetworkName', 'pingStatus',
  'vpnMode', 'vpnRunning', 'vpnConnected', 'vpnExpiresAt', 'vpnBusy', 'vpnDuration', 'showVpnLogPopup', 'vpnLog',
  'enrollStatus', 'enrollCode', 'enrollMessage', 'enrollLabel', 'codeCopied', 'isImporting818',
  'showTerminal', 'socketActive', 'tone_mode',
  'wifiActive', 'tzCurrent', 'tzBusy', 'leaveTarget',
  'showWpsPopup', 'wpsPlan', 'wpsBusy', 'clockTick',
];

const SAVE_POLL_MS = 880;
const SAVE_NO_RESTART_MS = 16000;
const SAVE_TIMEOUT_MS = 48000;
const SAVE_AUTOCLOSE_MS = 2800;
const SAVE_LEAVE_MS = 1400;

function reflectorErrorText(err) {
  const e = String(err || '');
  if (/authentification|access denied|auth/i.test(e)) return 'Connexion refusée : identifiants incorrects ou pseudo déjà connecté';
  if (/locally ordered disconnect/i.test(e)) return 'Connexion interrompue ..';
  if (/refused/i.test(e)) return "Connexion refusée, vérifiez l'adresse et le port";
  if (/timed? ?out|plus de réponse|unreachable/i.test(e)) return "Vérifiez l'adresse du serveur et la connexion internet";
  if (/not found|resolve|lookup|unknown host/i.test(e)) return 'Adresse serveur introuvable';
  return e || 'Déconnecté';
}

const STEP_CLASS = { wait: 'stepWait', run: 'stepRun', ok: 'stepOk', err: 'stepErr', warn: 'stepWarn', skip: 'stepSkip' };
const STEP_ICON = { ok: '✓', err: '✕', warn: '!', skip: '–' };
const RESULT_CLASS = { ok: 'resultOk', warn: 'resultWarn', err: 'resultErr' };

const isAuthError = err => /authentification|access denied|auth/i.test(String(err || ''));

const getSignalColor = (signal) => {
  if (signal >= 68) return '#4ade80';
  if (signal >= 40) return '#fbbf24';
  return '#d9534f';
};

class Configuration extends React.Component {
  static contextType = ThemeContext;

  constructor(props) {
    super(props)
    const cfg = props.config || {};
    this.state = { isSaving: false, isRadioAmateur: false, activeTab: '1', id_long: '60', id_short: '15', showTerminal: false, availableWifiNetworks: [], savedNetworks: [], isScanningWifi: false, wifiScanError: null, showWifiPopup: false, showWifiPasswordPopup: false, selectedSsid: '', wifiPasswordInput: '', wifiManual: false, wifiJob: null, showWifiDeletePopup: false, networkToDelete: '', isSwitchingWifi: false, switchingNetworkName: '', showMap: false, pingStatus: {}, vpnMode: 'off', vpnRunning: false, vpnConnected: false, vpnExpiresAt: null, vpnBusy: false, vpnDuration: '4', showVpnLogPopup: false, vpnLog: '', enrollStatus: 'none', enrollCode: '', enrollMessage: '', enrollLabel: '', codeCopied: false, isImporting818: false, wifiActive: null, tzCurrent: cfg.timezone || '', tzBusy: false, leaveTarget: null, showWpsPopup: false, wpsPlan: null, wpsBusy: false, ...cfg, res2Enabled: cfg.res2Enabled || false, res3Enabled: cfg.res3Enabled || false, res4Enabled: cfg.res4Enabled || false, bw_818:  cfg.bw_818  || '1', vol_818: cfg.vol_818 || '4', pre_818: cfg.pre_818 !== undefined ? cfg.pre_818 : true, lp_818:  cfg.lp_818  !== undefined ? cfg.lp_818  : true, hp_818:  cfg.hp_818  !== undefined ? cfg.hp_818  : true,
      ctcss_fq: CTCSS_FREQUENCIES.includes(cfg.ctcss_fq) ? cfg.ctcss_fq : NO_CTCSS,
      ctcss_fqt: CTCSS_FREQUENCIES.includes(cfg.ctcss_fqt) ? cfg.ctcss_fqt : NO_CTCSS,
      dcs_fq: hasDcs(cfg.dcs_fq) ? String(cfg.dcs_fq).trim().toUpperCase() : NO_DCS,
      dcs_fqt: hasDcs(cfg.dcs_fqt) ? String(cfg.dcs_fqt).trim().toUpperCase() : NO_DCS,
      tone_mode: hasDcs(cfg.dcs_fq) || hasDcs(cfg.dcs_fqt) ? 'Dcs' : 'Ctcss',
    }
    if (this.state.tone_mode === 'Dcs' && this.state.sql_det === 'CTCSS') this.state.sql_det = 'GPIO';

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleLocationChange = this.handleLocationChange.bind(this)
    this.handleScanWifi = this.handleScanWifi.bind(this)
    this.toggleWifiHelpPopup = this.toggleWifiHelpPopup.bind(this)
    this.loadSavedNetworks = this.loadSavedNetworks.bind(this)
    this.handleDeleteWifi = this.handleDeleteWifi.bind(this)
    this.handleConnectWifi = this.handleConnectWifi.bind(this)
    this.copyRxToTx = this.copyRxToTx.bind(this)
    this.copyRxCtcssToTx = this.copyRxCtcssToTx.bind(this)
    this.handleToneMode = this.handleToneMode.bind(this)
    this.importFromSa818 = this.importFromSa818.bind(this)
    this.loadVpnStatus = this.loadVpnStatus.bind(this)
    this.handleVpnChange = this.handleVpnChange.bind(this)
    this.handleVpnCancel = this.handleVpnCancel.bind(this)
    this.toggleVpnLogPopup = this.toggleVpnLogPopup.bind(this)
    this.toggleMap = this.toggleMap.bind(this)
    this.onLocationSelected = this.onLocationSelected.bind(this)
    this.toggleTerminal = this.toggleTerminal.bind(this)
    this.loadActiveWifi = this.loadActiveWifi.bind(this)
    this.handleLedChange = this.handleLedChange.bind(this)
    this.loadTimezone = this.loadTimezone.bind(this)
    this.handleTimezoneChange = this.handleTimezoneChange.bind(this)
    this.termRef = React.createRef();
    this._savedNetworksCache = null;
    this._savedNetworksCacheAt = 0;
    this._savedNetworkTtl = 28 * 1000;
    this.closeSaveFlow = this.closeSaveFlow.bind(this)
    this._savedSnapshot = this.configSnapshot(this.state);
  }

  configValues(state = this.state) {
    const out = {};
    Object.keys(state).forEach(k => { if (!UI_STATE_KEYS.includes(k)) out[k] = state[k]; });
    return out;
  }

  configSnapshot(state = this.state) {
    const vals = this.configValues(state);
    return JSON.stringify(Object.keys(vals).filter(k => !IMMEDIATE_KEYS.includes(k)).sort().map(k => [k, vals[k]]));
  }

  isDirty() {
    return this.configSnapshot() !== this._savedSnapshot;
  }

  markSaved() {
    this._savedSnapshot = this.configSnapshot();
    this.forceUpdate();
  }

  componentDidMount() {
    this.handleScanWifi();
    this.loadSavedNetworks();
    this.loadVpnStatus();
    this._vpnPoll = setInterval(this.loadVpnStatus, 20000);
    this.loadActiveWifi();
    this._wifiPoll = setInterval(() => { if (!document.hidden) this.loadActiveWifi(); }, 15000);
    this.loadTimezone();
    this.loadNetwork();
    this.checkWpsJob();
    this.scheduleClockTick();
    this.socket = io();

    this._onBeforeUnload = e => {
      if (this._leaving || !this.isDirty()) return undefined;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', this._onBeforeUnload);

    this._onLinkClick = e => {
      if (this._leaving || !this.isDirty()) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (!/^https?:$/.test(url.protocol)) return;
      const loc = window.location;
      const internal = url.origin === loc.origin;
      if (internal && url.pathname === loc.pathname && url.search === loc.search) return;
      e.preventDefault();
      this.setState({ leaveTarget: { href: internal ? url.pathname + url.search + url.hash : url.href, external: !internal } });
    };
    document.addEventListener('click', this._onLinkClick, true);

    this._onRouteChange = url => {
      if (this._leaving || !this.isDirty()) return;
      this.setState({ leaveTarget: { href: url, external: false } });
      Router.events.emit('routeChangeError');
      throw 'Navigation annulée : modifications non enregistrées';
    };
    Router.events.on('routeChangeStart', this._onRouteChange);
  }

  static getInitialProps() {
    return fetch('/api/configuration').then(res => res.json()).then(config => ({ config }))
  }

  loadSavedNetworks(force = false) {
    const now = Date.now();
    if (!force && this._savedNetworksCache && (now - this._savedNetworksCacheAt) < this._savedNetworkTtl) {
      this.setState({ savedNetworks: this._savedNetworksCache });
      return;
    }
    fetch('/api/wifi/saved')
      .then(res => res.json())
      .then(savedNetworks => {
        const list = Array.isArray(savedNetworks) ? savedNetworks : [];
        this._savedNetworksCache = list;
        this._savedNetworksCacheAt = Date.now();
        this.setState({ savedNetworks: list });
        if (force) this.loadActiveWifi();
      })
      .catch(err => console.error('Erreur chargement réseaux', err));
  }

  loadActiveWifi() {
    fetch('/api/wifi/active', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(a => { if (!this._unmounted) this.setState({ wifiActive: a && a.connected !== false && (a.ssid || a.name) ? a : null }); })
      .catch(() => {});
  }

  activeWifiInfo(net) {
    const a = this.state.wifiActive;
    const own = a || {};
    const scan = (this.state.availableWifiNetworks || []).find(n => n.ssid === (own.ssid || net.name));
    const signal = [own.signal, net.signal, scan && scan.signal].find(v => v !== undefined && v !== null && v !== '');
    const ip = String(own.ip || net.ip || '').split('/')[0];
    return { ip, signal: signal !== undefined ? Number(signal) : null };
  }

  handleLedChange(e) {
    const val = e.target.value === 'true';
    const prev = this.state.ledEnabled;
    this.setState({ ledEnabled: val });
    fetch('/api/led', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: val }) })
      .then(res => { if (!res.ok) throw new Error(); })
      .catch(() => { this.setState({ ledEnabled: prev }); Notif.error('Échec réglage Led'); });
  }

  loadNetwork = () => {
    fetch('/api/network', { cache: 'no-store' })
      .then(res => (res.ok ? res.text() : ''))
      .then(t => { if (!this._unmounted) this.setState({ currentNetwork: String(t || '').trim().toLowerCase() }); })
      .catch(() => {});
  }

  identRa() {
    return RESEAUX_RA.includes(this.state.currentNetwork) && String(this.state.callsign5 || '').trim() !== '';
  }

  loadTimezone() {
    fetch('/api/timezone', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(r => { if (!this._unmounted && r && r.timezone) this.setState({ tzCurrent: r.timezone }); })
      .catch(() => {});
  }

  handleTimezoneChange(e) {
    const timezone = e.target.value;
    const prev = this.state.tzCurrent;
    if (!timezone || timezone === prev) return;
    this.setState({ tzCurrent: timezone, tzBusy: true });
    fetch('/api/timezone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timezone }) })
      .then(res => res.json().catch(() => ({})).then(body => { if (!res.ok) throw new Error(body.error || 'Erreur'); }))
      .then(() => {
        this.setState({ timezone });
        const t = TIMEZONES.find(z => z.value === timezone);
        Notif.info(`Fuseau ${t ? t.label : timezone} appliqué, WebLink redémarre ..`);
      })
      .catch(err => { this.setState({ tzCurrent: prev }); Notif.error(err.message && err.message !== 'Erreur' ? err.message : 'Échec changement de fuseau'); })
      .finally(() => { if (!this._unmounted) this.setState({ tzBusy: false }); });
  }

  loadVpnStatus() {
    fetch('/api/vpn/status')
      .then(res => res.json())
      .then(s => {
        if (this._unmounted) return;
        const e = s.enroll || {};
        this.setState({
          vpnMode: s.mode || 'off',
          vpnRunning: !!s.running,
          vpnConnected: !!s.connected,
          vpnExpiresAt: s.expiresAt || null,
          enrollStatus: e.status || 'none',
          enrollLabel: e.label || '',
          enrollCode: e.code || '',
          enrollMessage: e.message || ''
        });
      })
      .catch(() => {});
  }

  handleVpnCancel() {
    this.setState({ vpnBusy: true });
    fetch('/api/vpn/cancel', { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        this.setState({ vpnBusy: false, vpnMode: 'off' });
        Notif.info('Demande annulée !!');
        this.loadVpnStatus();
      })
      .catch(() => {
        this.setState({ vpnBusy: false });
        Notif.error('Échec de l\'annulation');
      });
  }

  handleVpnChange(mode) {
    const hours = parseInt(this.state.vpnDuration, 10) || 4;
    this.setState({ vpnBusy: true });

    fetch('/api/vpn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, hours })
    })
      .then(res => res.json().then(body => {
        if (!res.ok) throw new Error(body.error || 'Erreur Vpn');
        return body;
      }))
      .then(() => {
        this.setState({ vpnMode: mode, vpnBusy: false });
        if (mode === 'off') Notif.info('Assistance désactivée !!');
        else if (this.state.enrollStatus === 'approved') Notif.info('Assistance activée !!');
        else Notif.info('Demande envoyée !!');
        setTimeout(this.loadVpnStatus, 2500);
        setTimeout(this.loadVpnStatus, 8000);
      })
      .catch(err => {
        this.setState({ vpnBusy: false, vpnMode: 'off' });
        Notif.error(err.message || 'Échec activation Vpn');
        this.loadVpnStatus();
      });
  }

  toggleVpnLogPopup() {
    if (!this.state.showVpnLogPopup) {
      fetch('/api/vpn/log?lines=50')
        .then(res => res.json())
        .then(({ log }) => this.setState({ vpnLog: log || '', showVpnLogPopup: true }))
        .catch(() => this.setState({ vpnLog: '', showVpnLogPopup: true }));
    } else {
      this.setState({ showVpnLogPopup: false });
    }
  }

  onLocationSelected(lat, lng) {
    const [latitude, longitude] = formatcoords(lat, lng)
      .format('D.M.sX', { decimalPlaces: 0 }).split(' ')
    this.setState({
      location_latitude: latitude,
      location_longitude: longitude,
      showMap: false
    })
    Notif.info('Coordonnées Aprs mises à jour !!')
  }

  handleLocationChange({ target }) { this.setState({ location_enabled: target.checked }) }

  handleChange({ target }) {
    const { name, value, id, type, checked } = target;
    let formattedValue = type === 'checkbox' ? checked : value;
    if (id === 'majuscule' && typeof formattedValue === 'string') {
      formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1).toLowerCase();
    } else if (['callsign1','callsign2','callsign3','callsign4','callsign5'].includes(name) && typeof formattedValue === 'string') {
      formattedValue = formattedValue.toUpperCase();
    }
    this.setState({ [name]: formattedValue });
  }

  copyRxToTx() {
    if (this.state.rx_qrg) {
      this.setState({ tx_qrg: this.state.rx_qrg });
    }
  }

  copyRxCtcssToTx() {
    if (this.state.tone_mode === 'Dcs') this.setState({ dcs_fqt: this.state.dcs_fq });
    else this.setState({ ctcss_fqt: this.state.ctcss_fq });
  }

  handleToneMode(event) {
    const mode = event.target.value;
    if (mode === this.state.tone_mode) return;
    if (mode === 'Dcs') {
      this.setState(prev => ({
        tone_mode: 'Dcs',
        ctcss_fq: NO_CTCSS,
        ctcss_fqt: NO_CTCSS,
        sql_det: prev.sql_det === 'CTCSS' ? 'GPIO' : prev.sql_det,
      }));
    } else {
      this.setState({ tone_mode: 'Ctcss', dcs_fq: NO_DCS, dcs_fqt: NO_DCS });
    }
  }

  async importFromSa818() {
    if (this.state.isImporting818) return;
    this.setState({ isImporting818: true });
    try {
      const st = await fetch('/api/sa818/status').then(r => r.json()).catch(() => ({}));
      const wasEnabled = !!(st && st.enabled);
      let cfg = null;
      if (wasEnabled) cfg = await fetch('/api/sa818/config').then(r => r.json()).catch(() => null);
      if (!cfg || !cfg.freq_rx) cfg = await this._readSa818ViaMonitoring(wasEnabled);
      this._applySa818Config(cfg);
    } catch (err) {
      Notif.error(err.message || 'Lecture du module impossible');
    } finally {
      if (!this._unmounted) this.setState({ isImporting818: false });
    }
  }

  _readSa818ViaMonitoring(wasEnabled) {
    return new Promise((resolve, reject) => {
      const socket = this.socket;
      if (!socket.connected) socket.connect();
      let done = false;
      const toggle = enabled => fetch('/api/sa818/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const finish = (err, cfg) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        socket.off('sa818Config', onCfg);
        if (!wasEnabled) toggle(false).catch(() => {});
        err ? reject(err) : resolve(cfg);
      };
      const onCfg = cfg => { if (cfg && cfg.freq_rx) finish(null, cfg); };
      const timer = setTimeout(() => finish(new Error('Pas de réponse du module Sa818')), 15000);
      socket.on('sa818Config', onCfg);
      toggle(true)
        .then(res => { if (!res.ok) finish(new Error('Activation du module impossible')); })
        .catch(() => finish(new Error('Activation du module impossible')));
    });
  }

  _applySa818Config(cfg) {
    const upd = {};
    const warn = [];

    const freq = v => { const n = parseFloat(v); return isNaN(n) ? null : n.toFixed(4); };
    const tone = (code, label) => {
      if (code === undefined || code === null || code === '') return;
      const c = String(code).trim().toUpperCase();
      if (/^\d{3}[NI]$/.test(c)) return { dcs: c };
      const f = /^\d{1,4}$/.test(c) ? CTCSS_FREQUENCIES[parseInt(c, 10)] : undefined;
      if (f) return { ctcss: f };
      warn.push(`${label} (${c})`);
    };

    const rx = freq(cfg.freq_rx); if (rx) upd.rx_qrg = rx;
    const tx = freq(cfg.freq_tx); if (tx) upd.tx_qrg = tx;
    const trx = tone(cfg.ctcss_rx, 'Tonalité Rx');
    const ttx = tone(cfg.ctcss_tx, 'Tonalité Tx');
    if (trx || ttx) {
      if ((trx && trx.dcs) || (ttx && ttx.dcs)) {
        [[trx, 'Rx'], [ttx, 'Tx']].forEach(([t, side]) => {
          if (t && t.ctcss && t.ctcss !== NO_CTCSS) warn.push(`Ctcss ${side} ${t.ctcss} (mode Dcs)`);
        });
        Object.assign(upd, {
          tone_mode: 'Dcs',
          dcs_fq: trx && trx.dcs ? trx.dcs : NO_DCS,
          dcs_fqt: ttx && ttx.dcs ? ttx.dcs : NO_DCS,
          ctcss_fq: NO_CTCSS,
          ctcss_fqt: NO_CTCSS,
        });
        if (this.state.sql_det === 'CTCSS') upd.sql_det = 'GPIO';
      } else {
        Object.assign(upd, { tone_mode: 'Ctcss', dcs_fq: NO_DCS, dcs_fqt: NO_DCS });
        if (trx) upd.ctcss_fq = trx.ctcss;
        if (ttx) upd.ctcss_fqt = ttx.ctcss;
      }
    }
    if (cfg.bandwidth === '12.5K') upd.bw_818 = '0';
    else if (cfg.bandwidth === '25K') upd.bw_818 = '1';
    if (/^[0-8]$/.test(String(cfg.squelch))) upd.sql_lvl = String(cfg.squelch);
    if (/^[1-8]$/.test(String(cfg.volume))) upd.vol_818 = String(cfg.volume);

    if (!Object.keys(upd).length) throw new Error('Aucune donnée exploitable lue dans le module');
    this.setState(upd);
    Notif.info('Réglages du Sa818 importés, pensez à Enregistrer !!');
    if (warn.length) Notif.error('Non importé : ' + warn.join(', '));
  }

  trimmedConfig() {
    const out = {};
    Object.entries(this.configValues()).forEach(([k, v]) => {
      if (typeof v === 'string' && !NO_TRIM_KEYS.test(k) && v !== v.trim()) out[k] = v.trim();
    });
    return out;
  }

  async handleSubmit(event) {
    if (event) event.preventDefault();
    if (this.state.isSaving) { this._pendingLeave = null; return; }
    const trimmed = this.trimmedConfig();
    if (Object.keys(trimmed).length) await new Promise(resolve => this.setState(trimmed, resolve));
    const portsInvalid = ['port2','port3','port4'].some(p => !isPortValid(this.state[p]));
    if (portsInvalid) { this._pendingLeave = null; Notif.error('Port invalide ( 1 – 65535 )'); return; }
    if (!isFreqValid(this.state.rx_qrg) || !isFreqValid(this.state.tx_qrg)) {
      this._pendingLeave = null;
      Notif.error('Fréquence invalide ( format 000.0000 )'); return;
    }
    if (this.state.location_enabled && (!this.validateAprsLat(this.state.location_latitude) || !this.validateAprsLon(this.state.location_longitude))) {
      this._pendingLeave = null;
      Notif.error('Format Aprs invalides : 44.50.12N / 000.36.24W'); return;
    }

    clearTimeout(this._saveTimer);
    clearTimeout(this._saveCloseTimer);
    this.setState({
      isSaving: true,
      saveFlow: { save: 'run', restart: 'wait', connect: 'wait', detail: '', result: 'running', message: '' },
    });

    const before = await this.readReflectors();
    const payload = this.configValues();

    try {
      const res = await fetch('/api/configuration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      this.finishSaveFlow('err', "L'enregistrement a échoué, rien n'a été modifié.", { save: 'err' });
      return;
    }

    this.setState({ lSA818: 'Non' }, () => this.markSaved());

    if (!before || !before.reflectors.length) {
      this.finishSaveFlow('ok', 'Configuration enregistrée, WebLink redémarre.', { save: 'ok', restart: 'ok', connect: 'skip' });
      return;
    }

    this.updateSaveFlow({ save: 'ok', restart: 'run' });
    this.watchReconnect(Math.floor(before.at / 1000) * 1000, Date.now(), false);
  }

  async readReflectors() {
    try {
      const res = await fetch('/api/reflectors', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && Array.isArray(data.reflectors) && data.at ? data : null;
    } catch {
      return null;
    }
  }

  updateSaveFlow(patch) {
    if (this._unmounted) return;
    this.setState(prev => (prev.saveFlow ? { saveFlow: Object.assign({}, prev.saveFlow, patch) } : null));
  }

  finishSaveFlow(result, message, patch = {}) {
    if (this._unmounted) return;
    clearTimeout(this._saveTimer);
    this.updateSaveFlow(Object.assign({}, patch, { result, message }));
    this.setState({ isSaving: false });
    if (this._pendingLeave) {
      if (result === 'err') this._pendingLeave = null;
      else { this._saveCloseTimer = setTimeout(this.closeSaveFlow, SAVE_LEAVE_MS); return; }
    }
    if (result === 'ok') this._saveCloseTimer = setTimeout(this.closeSaveFlow, SAVE_AUTOCLOSE_MS);
  }

  closeSaveFlow() {
    clearTimeout(this._saveTimer);
    clearTimeout(this._saveCloseTimer);
    if (this._unmounted) return;
    const leave = this._pendingLeave;
    this._pendingLeave = null;
    this.setState({ saveFlow: null, isSaving: false });
    if (leave && !this.isDirty()) this.leaveTo(leave);
  }

  leaveTo(target) {
    this._leaving = true;
    if (target.external) window.location.assign(target.href);
    else Router.push(target.href);
  }

  confirmLeave = () => {
    const t = this.state.leaveTarget;
    if (!t) return;
    this.setState({ leaveTarget: null });
    this.leaveTo(t);
  }

  saveAndLeave = () => {
    const t = this.state.leaveTarget;
    if (!t) return;
    this._pendingLeave = t;
    this.setState({ leaveTarget: null });
    this.handleSubmit();
  }

  cancelLeave = () => { this.setState({ leaveTarget: null }); }

  async watchReconnect(t0, startedAt, restarted) {
    if (this._unmounted || !this.state.saveFlow) return;
    const elapsed = Date.now() - startedAt;
    const data = await this.readReflectors();
    if (this._unmounted || !this.state.saveFlow) return;

    const fresh = r => !!r.since && r.since >= t0;

    if (!data) {
      restarted = true;
    } else {
      const refl = data.reflectors;
      if (data.running === false || refl.some(r => fresh(r) || r.status === 'unknown')) restarted = true;

      if (restarted) {
        const pending = refl.filter(r => !(r.status === 'up' && fresh(r)));
        const failed = refl.filter(r => r.status === 'down' && fresh(r) && r.lastError);

        if (!pending.length) {
          const host = refl.length === 1 && refl[0].host ? ` à ${refl[0].host}` : '';
          this.finishSaveFlow('ok', `Configuration enregistrée et connecté${host} !!`, { restart: 'ok', connect: 'ok', detail: '' });
          return;
        }
        if (String(this.state.callsign1 || '').toUpperCase() !== 'YOP' && failed.some(r => isAuthError(r.lastError))) {
          const r = failed.find(x => isAuthError(x.lastError));
          this.finishSaveFlow('err', 'La configuration est enregistrée, mais le serveur refuse la connexion.', { restart: 'ok', connect: 'err', detail: reflectorErrorText(r.lastError) });
          return;
        }
        const first = pending[0];
        const detail = failed.length
          ? `${reflectorErrorText(failed[0].lastError)} · nouvel essai ..`
          : (first.status === 'auth' ? 'Authentification ..' : 'Connexion ..');
        this.updateSaveFlow({ restart: 'ok', connect: 'run', detail });
      } else if (elapsed > SAVE_NO_RESTART_MS) {
        const allUp = refl.every(r => r.status === 'up');
        this.finishSaveFlow('ok', `Configuration enregistrée. SvxLink n'a pas redémarré${allUp ? ', la connexion au serveur est inchangée' : ''}.`,
          { restart: 'skip', connect: allUp ? 'ok' : 'skip', detail: '' });
        return;
      }

      if (elapsed > SAVE_TIMEOUT_MS) {
        const up = refl.filter(r => r.status === 'up' && fresh(r));
        const failed = refl.find(r => r.lastError && r.status !== 'up');
        if (up.length) {
          this.finishSaveFlow('warn', `Connecté à ${up.map(r => r.host || r.name).join(', ')}, mais pas à ${refl.filter(r => !up.includes(r)).map(r => r.host || r.name).join(', ')}.`,
            { connect: 'warn', detail: failed ? reflectorErrorText(failed.lastError) : '' });
        } else {
          this.finishSaveFlow('err', 'La configuration est enregistrée, mais pas de connexion au serveur ..',
            { restart: restarted ? 'ok' : 'skip', connect: 'err', detail: failed ? reflectorErrorText(failed.lastError) : 'Aucune réponse' });
        }
        return;
      }
    }

    if (restarted && this.state.saveFlow && this.state.saveFlow.restart !== 'ok') this.updateSaveFlow({ restart: 'ok', connect: 'run', detail: 'Connexion ..' });
    this._saveTimer = setTimeout(() => this.watchReconnect(t0, startedAt, restarted), SAVE_POLL_MS);
  }

  handleTabChange = (tab) => { this.setState({ activeTab: tab }); }

  handleCheckboxChange = () => { this.setState(prev => ({ isRadioAmateur: !prev.isRadioAmateur })); }

  handleScanWifi = async () => {
    this.setState({ isScanningWifi: true, wifiScanError: null, availableWifiNetworks: [] });
    try {
      const response = await fetch('/api/wifi/scan');
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || `Erreur ${response.status}`); }
      const networks = await response.json();
      networks.sort((a, b) => b.signal - a.signal);
      this.setState({ availableWifiNetworks: networks });
    } catch (error) {
      this.setState({ wifiScanError: error.message || 'Scan Wifi impossible' });
      Notif.error('Échec scan Wifi');
    } finally {
      this.setState({ isScanningWifi: false });
    }
  }

  startWifiWatch(ssid, mode) {
    if (mode !== 'live') {
      Notif.info(`Le hotspot quitte WebLink et rejoint ${ssid}. Reconnectez votre téléphone à votre réseau ( ou activez le partage de connexion ) Retour de WebLink sous 3 min en cas d'échec.`);
      return;
    }
    this.stopWifiWatch();
    this._wifiWatchStart = Date.now();
    this.setState({ wifiJob: { state: 'connecting', ssid } });
    this._wifiWatch = setInterval(() => this.pollWifiJob(), 2000);
  }

  stopWifiWatch() {
    if (this._wifiWatch) { clearInterval(this._wifiWatch); this._wifiWatch = null; }
  }

  async pollWifiJob() {
    try {
      const response = await fetch('/api/wifi/status', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const job = await response.json();
      const cur = this.state.wifiJob;
      const wps = !!(cur && cur.wps);
      if (job.state === 'idle') {
        if (wps && Date.now() - this._wifiWatchStart > 6000) { this.stopWifiWatch(); this.setState({ wifiJob: null }); }
        return;
      }
      const next = wps ? Object.assign({}, job, { wps: true, cable: job.cable !== undefined ? job.cable : cur.cable }) : job;
      if (WPS_RUNNING.includes(job.state)) {
        if (wps) this.setState({ wifiJob: next });
        return;
      }
      this.stopWifiWatch();
      this.setState({ wifiJob: next });
      if (wps) this.markWpsSeen(next);
      if (job.state === 'connected' || job.state === 'failed') setTimeout(() => this.loadSavedNetworks(true), 1000);
    } catch {
      if (Date.now() - this._wifiWatchStart > 4 * 60 * 1000) {
        this.stopWifiWatch();
        this.setState(prev => ({ wifiJob: Object.assign({}, prev.wifiJob, { state: 'lost' }) }));
      }
    }
  }

  async finishWifiAp() {
    try { await fetch('/api/wifi/finish', { method: 'POST' }); } catch {}
    this.setState(prev => ({ wifiJob: Object.assign({}, prev.wifiJob, { state: 'done' }) }));
  }

  openWps = async () => {
    this.stopWifiWatch();
    this.setState({ wifiJob: null, showWpsPopup: true, wpsPlan: null });
    const fallback = { mode: 'blind', cable: false, ap: true, host: 'weblink' };
    try {
      const res = await fetch('/api/wifi/wps', { cache: 'no-store' });
      const plan = res.ok ? await res.json() : null;
      if (!this._unmounted) this.setState({ wpsPlan: plan || fallback });
    } catch {
      if (!this._unmounted) this.setState({ wpsPlan: fallback });
    }
  }

  watchWps(job) {
    this.stopWifiWatch();
    this._wifiWatchStart = Date.now();
    this.setState({ wifiJob: job });
    this._wifiWatch = setInterval(() => this.pollWifiJob(), 2000);
  }

  startWps = async () => {
    if (this.state.wpsBusy) return;
    this.setState({ wpsBusy: true });
    try {
      const res = await fetch('/api/wifi/wps', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Échec Wps');
      this.setState({ showWpsPopup: false });
      if (body.mode === 'live') this.watchWps({ state: 'wps-wait', wps: true, cable: !!body.cable, wpsIn: 120 });
      else Notif.info('Wps lancé, appuyez sur le bouton Wps de votre box !!');
    } catch (err) {
      Notif.error(err.message || 'Échec Wps');
    } finally {
      if (!this._unmounted) this.setState({ wpsBusy: false });
    }
  }

  cancelWps = async () => {
    this.stopWifiWatch();
    this.setState({ wifiJob: null });
    try {
      await fetch('/api/wifi/wps/cancel', { method: 'POST' });
      Notif.info('Wps annulé');
    } catch {}
  }

  markWpsSeen(job) {
    if (!job || !job.finishedAt) return;
    try { window.localStorage.setItem('weblinkWpsSeen', String(job.finishedAt)); } catch {}
  }

  checkWpsJob() {
    fetch('/api/wifi/status', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(job => {
        if (this._unmounted || !job || !job.wps || this.state.wifiJob) return;
        if (WPS_RUNNING.includes(job.state)) { this.watchWps(job); return; }
        if (!job.finishedAt || !['connected', 'done', 'failed'].includes(job.state)) return;
        let seen = '';
        try { seen = window.localStorage.getItem('weblinkWpsSeen') || ''; } catch {}
        if (seen === String(job.finishedAt)) return;
        this.markWpsSeen(job);
        this.setState({ wifiJob: job });
      })
      .catch(() => {});
  }

  async handleConnectWifi(ssid, password) {
    Notif.info(`Ajout de ${ssid} ..`);
    try {
      const response = await fetch('/api/wifi/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ssid, password }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw Object.assign(new Error(body.error || ''), { shown: !!body.error });
      }
      const result = await response.json().catch(() => ({}));
      if (result.pending) {
        this.startWifiWatch(ssid, result.mode);
      } else if (result.connected) {
        Notif.info(`Connecté à ${ssid} !!`);
      } else {
        Notif.info(`${ssid} enregistré, il sera utilisé dès qu'il sera à portée.`);
      }
      setTimeout(() => this.loadSavedNetworks(true), 2000);
    } catch (err) { Notif.error(err.shown ? err.message : 'Échec configuration'); }
  }

  async handleDeleteWifi(name) {
    try {
      const response = await fetch(`/api/wifi/delete?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (response.ok) { Notif.info('Réseau supprimé !!'); setTimeout(() => this.loadSavedNetworks(true), 1000); }
      else throw new Error('Erreur suppression');
    } catch (error) { console.error(error); Notif.error('Échec suppression'); }
  }

  async handleSwitchWifi(name) {
    this.setState({ isSwitchingWifi: true, switchingNetworkName: name });
    Notif.info(`Connexion à ${name} ..`);
    try {
      const response = await fetch('/api/wifi/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw Object.assign(new Error(body.error || ''), { shown: !!body.error });
      }
      const result = await response.json().catch(() => ({}));
      if (result.pending) {
        this.setState({ isSwitchingWifi: false, switchingNetworkName: '' });
        this.startWifiWatch(name, result.mode);
      } else {
        setTimeout(() => { this.loadSavedNetworks(true); this.setState({ isSwitchingWifi: false, switchingNetworkName: '' }); Notif.info('Changement effectué !!'); }, 4000);
      }
    } catch (err) { this.setState({ isSwitchingWifi: false, switchingNetworkName: '' }); Notif.error(err.shown ? err.message : 'Échec changement'); }
  }

  connectKnownWifi(name) {
    const net = (this.state.savedNetworks || []).find(n => n.name === name);
    if (net && net.active) { Notif.info(`Déjà connecté à ${name} !!`); return; }
    if (this.state.isSwitchingWifi) return;
    this.handleSwitchWifi(name);
  }

  submitWifiPassword = () => {
    const ssid = this.state.selectedSsid.trim();
    const password = this.state.wifiPasswordInput;
    if (!ssid || wifiPassError(password)) return;
    this.setState({ showWifiPasswordPopup: false, wifiPasswordInput: '', wifiManual: false });
    this.handleConnectWifi(ssid, password);
  }

  toggleWifiHelpPopup() { this.setState(prev => ({ showWifiPopup: !prev.showWifiPopup })); }

  async handlePing(tabKey) {
    const names = { '1': { host: 'host2', port: 'port2' }, '2': { host: 'host3', port: 'port3' }, '3': { host: 'host4', port: 'port4' } };
    const { host: hKey, port: pKey } = names[tabKey];
    const host = this.state[hKey];
    const port = this.state[pKey];

    if (!host) { this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: 'nohost' } })); return; }

    const lastKey = `_pingAt_${tabKey}`;
    if (this[lastKey] && Date.now() - this[lastKey] < 6000) {
      Notif.error('Patientez 6 secondes ..'); return;
    }

    const privatePattern = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1)/i;
    if (privatePattern.test(host)) { Notif.error('Ping non autorisé'); return; }

    this[lastKey] = Date.now();
    this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: 'pending' } }));
    try {
      const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}&port=${encodeURIComponent(port || 80)}`, { signal: AbortSignal.timeout(6000) });
      if (res.status === 429) { Notif.error('Trop de pings ..'); this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: null } })); return; }
      const data = await res.json();
      this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: data.ok ? 'ok' : 'fail' } }));
    } catch {
      this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: 'fail' } }));
    }
    setTimeout(() => this.setState(prev => ({ pingStatus: { ...prev.pingStatus, [tabKey]: null } })), 4000);
  }

  toggleMap() { this.setState(prev => ({ showMap: !prev.showMap })); }

  validateAprsLat(val) {
    if (!val || String(val).trim() === '') return true;
    return /^\d{1,3}\.\d{1,2}\.\d{1,2}[NS]$/i.test(String(val).trim());
  }

  validateAprsLon(val) {
    if (!val || String(val).trim() === '') return true;
    return /^\d{1,3}\.\d{1,2}\.\d{1,2}[EW]$/i.test(String(val).trim());
  }

  scheduleClockTick() {
    clearTimeout(this._clockTimer);
    this._clockTimer = setTimeout(() => {
      if (this._unmounted) return;
      this.setState({ clockTick: Date.now() });
      this.scheduleClockTick();
    }, 60000 - (Date.now() % 60000) + 200);
  }

  toggleTerminal() {
    this.setState(prev => {
      const newState = !prev.showTerminal;
      if (newState) { setTimeout(() => this.initTerminal(), 100); }
      else { if (this.socket) this.socket.disconnect(); if (this.term) { this.term.dispose(); this.term = null; } }
      return { showTerminal: newState };
    });
  }

  async initTerminal() {
    if (!this.termRef.current) return;
    if (!this.socket.connected) this.socket.connect();
    const { Terminal } = await import('xterm');
    const { FitAddon } = await import('xterm-addon-fit');
    this.term = new Terminal({ cursorBlink: true, theme: { background: 'rgba(0,0,0,0.4)', foreground: '#eeeeeeff', cursor: '#4ade80', selection: '#4ade80' }, rows: 24, cols: 80 });
    const fitAddon = new FitAddon();
    this.term.loadAddon(fitAddon);
    this.term.open(this.termRef.current);
    fitAddon.fit();
    this.socket.emit('terminalReady');
    const flashLed = () => { this.setState({ socketActive: true }); setTimeout(() => this.setState({ socketActive: false }), 100); };
    this.term.onData(data => { this.socket.emit('termData', data); flashLed(); });
    this.socket.off('termData');
    this.socket.on('termData', data => { if (this.term) this.term.write(data); flashLed(); });
  }

  playAnnounce(type) {
    const code = type === 'long' ? '90#' : '91#';
    const label = type === 'long' ? 'longue' : 'courte';
    let i = 0;
    const sendNext = () => {
      if (i < code.length) { fetch(`/api/dtmf/${encodeURIComponent(code[i])}`, { method: 'POST' }).catch(() => {}); i++; setTimeout(sendNext, 250); }
      else { Notif.info(`Annonce ${label} en cours ..`); }
    };
    sendNext();
  }

  componentWillUnmount() {
    this.stopWifiWatch();
    clearTimeout(this._clockTimer);
    this._unmounted = true;
    if (this._vpnPoll) clearInterval(this._vpnPoll);
    if (this._wifiPoll) clearInterval(this._wifiPoll);
    clearTimeout(this._saveTimer);
    clearTimeout(this._saveCloseTimer);
    if (this._onBeforeUnload) window.removeEventListener('beforeunload', this._onBeforeUnload);
    if (this._onLinkClick) document.removeEventListener('click', this._onLinkClick, true);
    if (this._onRouteChange) Router.events.off('routeChangeStart', this._onRouteChange);
    if (this.socket) this.socket.disconnect();
    if (this.term) this.term.dispose();
  }

  render() {
    const { theme } = this.context;
    const value = prop => this.state[prop]
    const isDirty = this.isDirty()
    const saveFlow = this.state.saveFlow

    const validateFreq = isFreqValid;
    const validatePort = isPortValid;

    const allPortsValid = ['port2','port3','port4'].every(p => validatePort(this.state[p]));
    const freqValid = validateFreq(this.state.rx_qrg) && validateFreq(this.state.tx_qrg);
    const canSave = allPortsValid && freqValid;
    const wifiPassErr = wifiPassError(this.state.wifiPasswordInput);
    const wifiCanConnect = !!this.state.selectedSsid.trim() && !wifiPassErr;
    const onWifiEnter = e => { if (e.key === 'Enter') { e.preventDefault(); this.submitWifiPassword(); } };

    const aprsValid = this.validateAprsLat(this.state.location_latitude) && this.validateAprsLon(this.state.location_longitude);
    const band_typ = { ' -': ' -', 'H': 'H', 'U': 'U', 'V': 'V', 'T': 'T', 'R': 'R', 'S': 'S' }
    const ctcssFrequencies = CTCSS_FREQUENCIES
    const isDcsMode = this.state.tone_mode === 'Dcs'
    const dcsOptions = v => (DCS_OPTIONS.includes(v) ? DCS_OPTIONS : DCS_OPTIONS.concat(v))
    const toneLabel = v => (v === NO_DCS ? 'Pas de Dcs' : v)
    const sql_lvl = ['0','1','2','3','4','5','6','7','8']
    const lSA818 = ['Non','Oui']
    const tabs = [{ key: '1', label: '2' }, { key: '2', label: '3' }, { key: '3', label: '4' }]
    const resEnabled = { '1': this.state.res2Enabled, '2': this.state.res3Enabled, '3': this.state.res4Enabled }
    const resSetEnabled = { '1': e => this.setState({ res2Enabled: e.target.checked }), '2': e => this.setState({ res3Enabled: e.target.checked }), '3': e => this.setState({ res4Enabled: e.target.checked }) }
    const resNames = { '1': { name: 'res2', host: 'host2', port: 'port2', cs: 'callsign2', dep: 'departement2', bt: 'band_type2', pass: 'passres2' }, '2': { name: 'res3', host: 'host3', port: 'port3', cs: 'callsign3', dep: 'departement3', bt: 'band_type3', pass: 'passres3' }, '3': { name: 'res4', host: 'host4', port: 'port4', cs: 'callsign4', dep: 'departement4', bt: 'band_type4', pass: 'passres4' } }
    const activeResNames = resNames[this.state.activeTab]
    const activeEnabled = resEnabled[this.state.activeTab]

    return (
      <Layout version={this.props.version}>

        <div className="themeToggle"> <ThemeToggle /> </div>

        <button type="button" onClick={this.toggleTerminal} className="terminalBtn">Terminal</button>

        {this.state.showTerminal && (
          <div className="terminalPopup">
            <div className="terminalContent">
              <div className="terminalHeader">
                <span style={{ fontFamily: 'monospace', color: theme.textPrimary, fontSize: '16px', marginLeft: '16px', cursor: 'default' }}>Terminal</span>
                <div className={`ledSocket ${this.state.socketActive ? 'active' : ''}`} />
                <select className="terminalSelect" onChange={(e) => { const cmd = e.target.value; if (cmd) { this.socket.emit('termData', cmd + '\n'); e.target.value = ''; } }}>
                  <option value="">Commandes ..</option> <option value="cd /opt/weblink">Repertoire</option>
                  <option value="alsamixer">Son</option>
                  <option value="/etc/init.d/resize2fs start">Resize</option> <option value="sa818">Sa818</option>
                  <option value="weblink">WebLink</option> <option value="fuseau">Fuseau</option>
                  <option value="htop">Htop</option> <option value="clear">Clear</option>
                </select>
                <button onClick={this.toggleTerminal} className="closeBtn">✕</button>
              </div>
              <div ref={this.termRef} className="termContainer" />
            </div>
          </div>
        )}

        {this.state.showMap && ReactDOM.createPortal(
          <div className="overlay">
            <div className="popup" style={{ maxWidth: '642px', width: '95%', padding: '0 28px' }}>
              <button onClick={this.toggleMap} className="closeBtn" style={{ position: 'relative', left: '100%' }}>✕</button>
              <div style={{ height: '422px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                <MapPicker onSelect={this.onLocationSelected} />
              </div>
              <p style={{ color: theme.textSecondary, fontSize: '12.4px', textAlign: 'center', margin: '6px' }}>
                Cliquez sur la carte pour définir votre position puis valider
              </p>
            </div>
          </div>
        , document.body)}

        <form onSubmit={this.handleSubmit}>
          <div className="grid">

            <div className="card">

              <div className="sectionTitle">Général</div>
              <div className="subCard2">
                <div className="subLabel" style={{ color: theme.accentRed, marginBottom: '10px' }}>WebLink - Pmr446Mhz</div>
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 3 }}>
                    <label className="fieldLabel">Pseudo</label>
                    <input required placeholder="----" id="call1" type="text" className="fieldInput" style={{ textTransform: 'uppercase', width: '88%' }} name="callsign1" value={value('callsign1')} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel" style={{ width: '74%' }}>Dépt</label>
                    <input required placeholder="--" type="text" className="fieldInput" style={{ width: '62%' }} name="departement1" value={value('departement1')} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel" style={{ width: '62%' }}>Type</label>
                    <select required name="band_type1" className="fieldInput" value={value('band_type1')} style={{ height: '26px', width: '62%' }} onChange={this.handleChange}>
                      {Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="fieldGroup" style={{ flex: 2 }}>
                    <label className="fieldLabel">Mot de passe</label>
                    <input placeholder="----" type="text" className="fieldInput" name="passres1" value={value('passres1')} onChange={this.handleChange} />
                  </div>
                </div>
              </div>

              <div className="tabsRow">
                {tabs.map(tab => (
                  <button key={tab.key} type="button" onClick={() => this.handleTabChange(tab.key)}
                    className={`tabBtn ${this.state.activeTab === tab.key ? 'tabActive' : ''}`}>
                    {tab.label}
                  </button>
                ))}
                <label className="color coche" style={{ marginLeft: '12px', top: '-2px' }}>
                  <input type="checkbox" checked={resEnabled[this.state.activeTab]} onChange={resSetEnabled[this.state.activeTab]} />
                  <span className="checkmark" style={{ marginLeft: '8px', top: '3px' }}></span> Activer
                </label>
              </div>

              <div className="subCard2" style={{ opacity: activeEnabled ? 1 : 0.26, pointerEvents: activeEnabled ? 'auto' : 'none', transition: 'opacity 0.4s' }}>
                <div className="fieldRow" style={{ marginBottom: '10px' }}>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <div className="netNameRow">
                      <label className="fieldLabel">Nom réseau</label>
                      {(() => {
                        const ps = this.state.pingStatus[this.state.activeTab];
                        const label = ps === 'pending' ? '⏳' : ps === 'ok' ? 'Ok' : ps === 'fail' ? 'KO' : ps === 'nohost' ? '?' : 'Ping';
                        const cls = ps === 'ok' ? 'pingBtnOk' : ps === 'fail' ? 'pingBtnFail' : ps === 'nohost' ? 'pingBtnWarn' : '';
                        return (
                          <button type="button" onClick={() => this.handlePing(this.state.activeTab)} disabled={ps === 'pending'} className={`pingBtn ${cls}`}>
                            {label}
                          </button>
                        );
                      })()}
                    </div>
                    <input placeholder="------" id="majuscule" type="text" className="fieldInput" name={activeResNames.name} value={value(activeResNames.name)} onChange={this.handleChange} />
                  </div>
                </div>
                <div className="fieldRow" style={{ marginBottom: '10px' }}>
                  <div className="fieldGroup" style={{ flex: 3 }}>
                    <label className="fieldLabel">Adresse</label>
                    <input placeholder="----------" type="text" className="fieldInput" name={activeResNames.host} value={value(activeResNames.host)} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Port</label>
                    <input placeholder="----" type="text" inputMode="numeric" className={`fieldInput ${!validatePort(value(activeResNames.port)) ? 'invalidInput' : ''}`} name={activeResNames.port} value={value(activeResNames.port)} onChange={this.handleChange} />
                  </div>
                </div>
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 3 }}>
                    <label className="fieldLabel">Pseudo</label>
                    <input placeholder="----" type="text" className="fieldInput" style={{ textTransform: 'uppercase' }} name={activeResNames.cs} value={value(activeResNames.cs)} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Dépt</label>
                    <input placeholder="--" type="text" className="fieldInput" name={activeResNames.dep} value={value(activeResNames.dep)} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Type</label>
                    <select name={activeResNames.bt} className="fieldInput" value={value(activeResNames.bt)} style={{ height: '26px' }} onChange={this.handleChange}>
                      {Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="fieldGroup" style={{ flex: 2 }}>
                    <label className="fieldLabel">Mot de passe</label>
                    <input placeholder="----" type="text" className="fieldInput" name={activeResNames.pass} value={value(activeResNames.pass)} onChange={this.handleChange} />
                  </div>
                </div>
              </div>

              <label className="color coche" style={{ margin: '10px' }}>
                Licencié et autorisé à utiliser cette section <input type="checkbox" id="radioAmateurCheck" checked={this.state.isRadioAmateur} onChange={this.handleCheckboxChange} /> <span className="checkmark" style={{ margin: '0 0 0 270px', top: '4.2px' }}></span>
              </label>

              <div className="subCard2" style={{ opacity: this.state.isRadioAmateur ? 1 : 0.2, pointerEvents: this.state.isRadioAmateur ? 'auto' : 'none', transition: 'opacity 0.4s', margin: '2px 0 8px 0' }}>
                <div className="subLabel" style={{ color: theme.accentRed, marginBottom: '10px' }}>Ri49 / Girondin / Rrf</div>
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 3 }}>
                    <label className="fieldLabel">Indicatif</label>
                    <input placeholder="----" type="text" className="fieldInput" name="callsign5" value={value('callsign5')} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Dépt</label>
                    <input placeholder="--" type="text" className="fieldInput" name="departement5" value={value('departement5')} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Type</label>
                    <select name="band_type5" className="fieldInput" value={value('band_type5')} style={{ height: '26px' }} onChange={this.handleChange}>
                      {Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <p style={{ color: theme.textSecondary, fontSize: '12.4px', textAlign: 'center', margin: '6px 0 0' }}>Sur ces réseaux, l'annonce courte se fait toutes les 15 min</p>
              </div>

            </div>

            <div className="card">

              <div className="sectionTitle">Information météo</div>
              <div className="subCard">
                <div className="fieldGroup">
                  <label className="fieldLabel">Code ICAO aéroport</label>
                  <input placeholder="LFBD" type="text" className="fieldInput" name="airport_code" value={value('airport_code')} onChange={this.handleChange} />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <a href="http://fr.allmetsat.com/metar-taf/france.php" target="_blank" className="extLink">Voir codes aéroports →</a>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Annonce</div>
              <div className="subCard">
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Longue</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select required name="id_long" className="fieldInput" value={value('id_long')} onChange={this.handleChange}>
                        {['0','15','30','45','60','75','90'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <button type="button" title="Écouter" onClick={() => this.playAnnounce('long')} className="soundBtn">🔊</button>
                    </div>
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Courte</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select required name="id_short" className="fieldInput" value={this.identRa() ? '15' : value('id_short')} disabled={this.identRa()} title={this.identRa() ? 'Réseau radioamateur : identification toutes les 15 min' : undefined} onChange={this.handleChange}>
                        {['0','15','30','45','60','75','90'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <button type="button" title="Écouter" onClick={() => this.playAnnounce('short')} className="soundBtn">🔊</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Aprs</div>
              <div className="subCard">
                <div className="fieldRow" style={{ marginBottom: '12px', alignItems: 'center' }}>
                  <label className="color coche" style={{ margin: '0 0 0 10px' }}><input type="checkbox" className="coche" onChange={this.handleLocationChange} checked={value('location_enabled')} /> <span className="checkmark" style={{ margin: '-4px 0 0 26px' }}></span> Activation </label>

                  <div className="fieldGroup" style={{ width: '142px', marginLeft: '50px', flexDirection: 'initial' }}>
                    <label className="fieldLabel" style={{ margin: '4px 4px 0 0' }}>Type node</label>
                    <select name="type" className="fieldInput" value={value('type')} onChange={this.handleChange} style={{ width: '82px' }}>
                      <option value="EL">HotSpot</option><option value="ER">Relais</option>
                    </select>
                  </div>

                  <button type="button" onClick={this.toggleMap} className="mapBtn" title="Choisir sur la carte">Carte 📍</button>
                </div>
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Latitude <span style={{ color: theme.accentRed }}>dd.mm.ssN</span></label>
                    <input placeholder="24.48.12N" type="text" className={`fieldInput ${!this.validateAprsLat(value('location_latitude')) ? 'invalidInput' : ''}`} name="location_latitude" value={value('location_latitude')} onChange={this.handleChange} />
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Longitude <span style={{ color: theme.accentRed }}>dd.mm.ssW</span></label>
                    <input placeholder="12.48.24W" type="text" className={`fieldInput ${!this.validateAprsLon(value('location_longitude')) ? 'invalidInput' : ''}`} name="location_longitude" value={value('location_longitude')} onChange={this.handleChange} />
                  </div>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Fuseau horaire</div>
              <div className="subCard2" style={{ marginBottom: '14px' }}>
                <div className="tzRow">
                  <select className="tzSelect" value={this.state.tzCurrent} disabled={this.state.tzBusy} onChange={this.handleTimezoneChange}>
                    {!this.state.tzCurrent && <option value="">..</option>}
                    {TIMEZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                    {this.state.tzCurrent && !TIMEZONES.some(z => z.value === this.state.tzCurrent) && (
                      <option value={this.state.tzCurrent}>{this.state.tzCurrent}</option>
                    )}
                  </select>
                  {this.state.tzBusy ? (
                    <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                  ) : this.state.tzCurrent ? (
                    <span className="tzTime">
                      {new Date().toLocaleTimeString('fr-FR', { timeZone: this.state.tzCurrent, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : null}
                </div>
              </div>

            </div>

            <div className="card">

              <div className="sectionTitle">
                Wifi
                <button type="button" onClick={this.toggleWifiHelpPopup} className="helpBtn">📖</button>
              </div>

              {this.state.showWifiPopup && ReactDOM.createPortal(
                <div className="overlay">
                  <div className="popup">
                    <div className="popupHeader">
                      <span style={{ color: theme.accentRed, fontWeight: 500 }}>Instructions Wifi</span>
                      <button onClick={this.toggleWifiHelpPopup} className="closeBtn">✕</button>
                    </div>
                    <ol style={{ color: theme.textPrimary, fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: '16px 0 0', textAlign: 'left' }}>
                      <li>Appuyez sur "Scan" pour rechercher les réseaux disponibles.</li>
                      <li>La liste des réseaux s&apos;affiche avec le SSID et le niveau de signal.</li>
                      <li>Appuyez sur le réseau souhaité,</li>
                      <li>Entrez le mot de passe dans la fenêtre qui s&apos;ouvre ( un réseau déjà enregistré se connecte directement ),</li>
                      <li>Le réseau s&apos;ajoute aux réseaux enregistrés et le hotspot s&apos;y connecte.</li>
                      <li>Ou appuyez sur "Wps" puis sur le bouton Wps de votre box : aucun mot de passe à saisir.</li>
                    </ol>
                  </div>
                </div>
              , document.body)}

              {this.state.wifiJob && (() => {
                const job = this.state.wifiJob;
                const accent = { color: '#4ade80', fontWeight: 500 };
                const running = WPS_RUNNING.includes(job.state);
                const left = Math.max(0, parseInt(job.wpsIn, 10) || 0);
                const host = job.hostname ? `http://${job.hostname}.local` : null;
                const closeJob = () => { this.stopWifiWatch(); this.setState({ wifiJob: null }); };
                const cancelRow = (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={this.cancelWps} className="popupBtn">Annuler</button>
                  </div>
                );
                const links = job.ip && !job.cable ? (
                  <p style={{ margin: '0 0 12px' }}>Reconnectez votre téléphone à <span style={accent}>{job.ssid}</span>, puis ouvrez :<br />
                    <a href={`http://${job.ip}`} style={accent}>http://{job.ip}</a>
                    {host && (<><br />ou <a href={host} style={accent}>{host}</a></>)}
                  </p>
                ) : null;
                return ReactDOM.createPortal(
                  <div className="overlay">
                    <div className="popup">
                      <div className="popupHeader">
                        <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{job.wps && !job.ssid ? 'Wps' : `Wifi ${job.ssid}`}</span>
                        {!running && (
                          <button onClick={closeJob} className="closeBtn">✕</button>
                        )}
                      </div>
                      <div style={{ padding: '16px 0 0', color: theme.textPrimary, fontSize: '14.8px', lineHeight: 1.6 }}>
                        {job.state === 'wps-wait' && (<>
                          <p style={{ margin: '0 0 4px', textAlign: 'center' }}>Appuyez sur le bouton Wps de votre box ..</p>
                          <div className="wpsCount">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div>
                          {!job.cable && <p className="wpsHint">Votre téléphone peut être déconnecté quelques secondes du Wifi WebLink, il se reconnectera tout seul. Ne fermez pas cette page.</p>}
                          {cancelRow}
                        </>)}
                        {job.state === 'wps-cred' && (<>
                          <p style={{ margin: '0 0 12px', textAlign: 'center' }}>Box trouvée{job.ssid ? <> : <span style={accent}>{job.ssid}</span></> : ''}<br />Réception des identifiants ..</p>
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 16px' }}><div className="spinner" /></div>
                          {cancelRow}
                        </>)}
                        {job.state === 'connecting' && (job.wps ? (
                          <p style={{ margin: '0 0 12px' }}>Identifiants reçus, connexion à <span style={accent}>{job.ssid}</span> ..<br />Ne fermez pas cette page.</p>
                        ) : (
                          <p style={{ margin: '0 0 12px' }}>Connexion en cours ..<br />Votre téléphone peut être déconnecté quelques secondes du Wifi WebLink, il se reconnectera tout seul. Ne fermez pas cette page.</p>
                        ))}
                        {job.state === 'connected' && (<>
                          <p style={{ margin: '0 0 12px' }}>Connecté à <span style={accent}>{job.ssid}</span> !!<br />{job.cable ? 'Adresse Wifi du hotspot' : 'Nouvelle adresse du hotspot'} : <span style={accent}>{job.ip}</span></p>
                          {links}
                          {job.cable && (<>
                            <p style={{ margin: '0 0 8px' }}>Vous pouvez débrancher le câble, le hotspot restera accessible sur {host ? <a href={host} style={accent}>{host}</a> : <span style={accent}>http://{job.ip}</span>}</p>
                            <p className="wpsHint">Vérifiez le signal une fois le hotspot à son emplacement définitif. La connexion au serveur se coupera quelques secondes au débranchement.</p>
                          </>)}
                          {job.apOffAt ? (<>
                            <p style={{ margin: '0 0 24px' }}>Le Wifi WebLink s&apos;éteindra dans 3 minutes.</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                              <button onClick={() => this.finishWifiAp()} className="popupBtn popupBtnOk">Terminer maintenant</button>
                            </div>
                          </>) : (
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                              <button onClick={closeJob} className="popupBtn popupBtnOk">Fermer</button>
                            </div>
                          )}
                        </>)}
                        {job.state === 'done' && (<>
                          <p style={{ margin: '0 0 12px' }}>Le Wifi WebLink est arrêté.</p>
                          {links}
                        </>)}
                        {job.state === 'failed' && (<>
                          <p style={{ margin: job.detail ? '0 0 12px' : '0 0 24px' }}>{job.error || 'Connexion impossible'}<br />{job.wps ? 'Vous pouvez réessayer.' : 'Le Wifi WebLink reste disponible, vous pouvez réessayer.'}</p>
                          {job.detail && <p className="wpsHint wpsDetail">{job.step ? `Étape : ${job.step} · ` : ''}{job.detail}</p>}
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {job.wps && <button onClick={this.openWps} className="popupBtn popupBtnOk">Réessayer</button>}
                            <button onClick={closeJob} className={`popupBtn ${job.wps ? '' : 'popupBtnOk'}`}>Fermer</button>
                          </div>
                        </>)}
                        {job.state === 'lost' && (
                          <p style={{ margin: '0 0 12px' }}>Plus de nouvelles du hotspot ..<br />Reconnectez-vous à votre réseau habituel, ou au Wifi WebLink qui revient sous 3 min en cas d'échec.</p>
                        )}
                      </div>
                    </div>
                  </div>
                , document.body);
              })()}

              {this.state.showWpsPopup && (() => {
                const plan = this.state.wpsPlan;
                const accent = { color: '#4ade80', fontWeight: 500 };
                const close = () => this.setState({ showWpsPopup: false });
                return ReactDOM.createPortal(
                  <div className="overlay">
                    <div className="popup">
                      <div className="popupHeader">
                        <span style={{ color: theme.textPrimary, fontWeight: 500 }}>Connexion Wps</span>
                        <button onClick={close} className="closeBtn">✕</button>
                      </div>
                      {!plan ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div className="spinner" /></div>
                      ) : (
                        <div style={{ padding: '16px 0 0', color: theme.textPrimary, fontSize: '14.8px', lineHeight: 1.6 }}>
                          {plan.mode === 'live' ? (<>
                            <p style={{ margin: '0 0 12px' }}>Appuyez sur <span style={accent}>Démarrer</span> puis aussitôt sur le bouton Wps de votre box ( 2 minutes max )</p>
                            <p className="wpsHint">{plan.cable ? "Le suivi s'affichera ici, le hotspot reste accessible .." : "Le suivi s'affiche ici. Votre téléphone peut être déconnecté quelques secondes du Wifi WebLink .."}</p>
                          </>) : (<>
                            <p style={{ margin: '0 0 8px', color: theme.accentYellow }}>{plan.ap ? "Le Wifi WebLink va s'éteindre pendant l'opération, cette page ne sera plus accessible .." : "Votre téléphone va perdre la connexion au hotspot pendant l'opération .."}</p>
                            <ol className="wpsSteps">
                              <li>Appuyez sur <span style={accent}>Démarrer</span></li>
                              <li>Appuyez aussitôt sur le bouton Wps de votre box ( 2 minutes max )</li>
                              <li>Led qui scintille très vite : c&apos;est réussi, reconnectez votre téléphone au Wifi de votre box et ouvrez <span style={accent}>http://{plan.host}.local</span></li>
                              <li>Led avec 3 éclats longs : échec, {plan.ap ? 'le Wifi WebLink revient tout seul' : 'le hotspot revient sur son réseau habituel'}</li>
                            </ol>
                          </>)}
                          <p className="wpsHint">Le Wifi 2,4 GHz de la box doit être actif. Les box réglées en WPA3 seul ne sont pas compatibles.</p>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={this.startWps} disabled={this.state.wpsBusy} className="popupBtn popupBtnOk">{this.state.wpsBusy ? 'Démarrage ..' : 'Démarrer'}</button>
                            <button onClick={close} className="popupBtn">Annuler</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                , document.body);
              })()}

              {this.state.showWifiPasswordPopup && ReactDOM.createPortal(
                <div className="overlay">
                  <div className="popup">
                    <div className="popupHeader">
                      <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{this.state.wifiManual ? 'Autre réseau' : this.state.selectedSsid}</span>
                      <button onClick={() => this.setState({ showWifiPasswordPopup: false, wifiPasswordInput: '', wifiManual: false })} className="closeBtn">✕</button>
                    </div>
                    <div style={{ padding: '16px 0 0' }}>
                      {this.state.wifiManual && (
                        <input type="text" placeholder="Nom du réseau .." className="fieldInput" autoCapitalize="none" autoCorrect="off" value={this.state.selectedSsid} onChange={(e) => this.setState({ selectedSsid: e.target.value })} onKeyDown={onWifiEnter} style={{ marginBottom: '12px' }} />
                      )}
                      <input type="text" placeholder="Mot de passe .." className={`fieldInput ${wifiPassErr ? 'invalidInput' : ''}`} value={this.state.wifiPasswordInput} onChange={(e) => this.setState({ wifiPasswordInput: e.target.value })} onKeyDown={onWifiEnter} style={{ marginBottom: wifiPassErr ? '6px' : '24px' }} />
                      {wifiPassErr && <p className="passHint">{wifiPassErr}</p>}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button disabled={!wifiCanConnect} onClick={this.submitWifiPassword} className="popupBtn popupBtnOk">Connecter</button>
                        <button onClick={() => this.setState({ showWifiPasswordPopup: false, wifiPasswordInput: '', wifiManual: false })} className="popupBtn">Annuler</button>
                      </div>
                    </div>
                  </div>
                </div>
              , document.body)}

              {this.state.showWifiDeletePopup && ReactDOM.createPortal(
                <div className="overlay">
                  <div className="popup">
                    <p style={{ color: theme.textPrimary, fontSize: '14.8px', textAlign: 'center', margin: '0 0 20px' }}>
                      Supprimer le réseau <strong style={{ color: theme.accentRed }}>{this.state.networkToDelete}</strong> ?
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button onClick={() => { this.handleDeleteWifi(this.state.networkToDelete); this.setState({ showWifiDeletePopup: false, networkToDelete: '' }); }} className="popupBtn popupBtnDanger">Supprimer</button>
                      <button onClick={() => this.setState({ showWifiDeletePopup: false, networkToDelete: '' })} className="popupBtn">Annuler</button>
                    </div>
                  </div>
                </div>
              , document.body)}

              <div className="subCard2">
                <button type="button" onClick={this.handleScanWifi} disabled={this.state.isScanningWifi} className="scanBtn">
                  {this.state.isScanningWifi ? 'Scan en cours ..' : 'Scan'}
                </button>
                <button type="button" onClick={() => this.setState({ showWifiPasswordPopup: true, selectedSsid: '', wifiPasswordInput: '', wifiManual: true })} className="scanBtn" style={{ marginLeft: '12px' }}>
                  Autre ..
                </button>
                <button type="button" onClick={this.openWps} disabled={this.state.wpsBusy || !!(this.state.wifiJob && WPS_RUNNING.includes(this.state.wifiJob.state))} className="scanBtn" style={{ marginLeft: '12px' }}>
                  Wps
                </button>
                {this.state.isScanningWifi && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}><div className="spinner" /></div>}
                {this.state.wifiScanError && <p style={{ color: theme.accentRed, fontSize: '14px', margin: '8px 0 0' }}>{this.state.wifiScanError}</p>}

                {Array.isArray(this.state.availableWifiNetworks) && this.state.availableWifiNetworks.length > 0 && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px' }}>
                    {this.state.availableWifiNetworks.map((network, i) => {
                      const sc = getSignalColor(network.signal)
                      const savedNames = (this.state.savedNetworks || []).map(n => n.name)
                      const isKnown = savedNames.includes(network.ssid)
                      return (
                        <div key={`${network.ssid}-${i}`} onClick={() => (isKnown ? this.connectKnownWifi(network.ssid) : this.setState({ showWifiPasswordPopup: true, selectedSsid: network.ssid, wifiManual: false }))} className="wifiRow">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span className="wifiSsid">{network.ssid}</span>
                            {isKnown && <span className="knownBadge">Enregistré</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="signalTrack" style={{ width: '60px' }}>
                              <div className="signalFill" style={{ width: `${network.signal}%`, background: sc }} />
                            </div>
                            <span style={{ color: sc, fontSize: '12px', minWidth: '36px', textAlign: 'right', fontWeight: 500 }}>{network.signal}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Réseaux enregistrés</div>
              <div className="subCard">
                {(!this.state.savedNetworks || this.state.savedNetworks.length === 0) ? (
                  <p style={{ color: theme.textSecondary, fontSize: '14px', textAlign: 'center', margin: '8px 0' }}> .. </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {this.state.savedNetworks.map((net, i) => (
                      <div key={i} className="savedNet" style={{ borderColor: net.active ? 'rgba(74,222,128,0.4)' : theme.cardBorder }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: theme.textPrimary, fontSize: '14px' }}>{net.name}</span>
                            {net.active && <span className="activeBadge">actif</span>}
                            {net.active && (() => {
                            	const { ip, signal } = this.activeWifiInfo(net);
                            	if (!ip && signal === null) return null;
                            	const sc = signal !== null ? getSignalColor(signal) : null;
                            	return (
                              	<div className="activeInfo">
                                	{ip && <span className="activeIp">{ip}</span>}
                                	{signal !== null && (
                                  	<span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    	<span className="signalTrack" style={{ width: '42px', flex: 'none' }}>
                                      	<span className="signalFill" style={{ display: 'block', width: `${signal}%`, background: sc }} />
                                    	</span>
                                    	<span style={{ color: sc, fontWeight: 500, fontSize: '12px' }}>{signal}%</span>
                                  	</span>
                                	)}
                              	</div>
                            	);
                          	})()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!net.active && (
                            <button type="button" onClick={() => this.handleSwitchWifi(net.name)} disabled={this.state.isSwitchingWifi} className="netBtn netBtnOk">
                              {this.state.isSwitchingWifi && this.state.switchingNetworkName === net.name ? '⏳' : 'Connecter'}
                            </button>
                          )}
                          <button type="button" onClick={() => this.setState({ showWifiDeletePopup: true, networkToDelete: net.name })} className="netBtn netBtnDel">x</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Led</div>
              <div className="subCard2">
                <span className="fieldLabel">Clignotement</span>
                <select  className="ledSelect" value={this.state.ledEnabled ? "true" : "false"} onChange={this.handleLedChange}>
                  <option value="true">Activée</option> <option value="false">Désactivée</option>
                </select>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>
                Assistance
                <button type="button" onClick={this.toggleVpnLogPopup} className="helpBtn">🕑</button>
              </div>

              {this.state.showVpnLogPopup && ReactDOM.createPortal(
                <div className="overlay">
                  <div className="popup">
                    <div className="popupHeader">
                      <span style={{ color: theme.textPrimary, fontWeight: 500 }}>Historique des connexions</span>
                      <button onClick={this.toggleVpnLogPopup} className="closeBtn">✕</button>
                    </div>
                    <pre className="vpnLog">{this.state.vpnLog ? this.state.vpnLog : 'Aucune connexion enregistrée ..'}</pre>
                  </div>
                </div>
              , document.body)}

              <div className="subCard2" style={{ marginBottom: '10px' }}>
                <div className="vpnRow">
                  <span className="fieldLabel">Accès distant</span>
                  <select className="vpnSelect" value={this.state.vpnMode} disabled={this.state.vpnBusy}
                    onChange={(e) => this.handleVpnChange(e.target.value)}>
                    <option value="off">Désactivé</option> <option value="always">Permanent</option> <option value="temp">Temporaire</option>
                  </select>
                </div>

                {this.state.vpnMode === 'temp' && (
                  <div className="vpnRow" style={{ marginTop: '8px' }}>
                    <span className="fieldLabel">Durée</span>
                    <select className="vpnSelect" value={this.state.vpnDuration} disabled={this.state.vpnBusy}
                      onChange={(e) => { this.setState({ vpnDuration: e.target.value }, () => this.handleVpnChange('temp')); }}>
                      <option value="1">1 heure</option> <option value="4">4 heures</option>
                      <option value="8">8 heures</option> <option value="24">24 heures</option>
                    </select>
                  </div>
                )}

                {this.state.enrollStatus === 'pending' && (
                  <div className="pairingBox">
                    <span className="pairingHint">
                      Demande envoyée, communiquez ce code à l&apos;administrateur !!
                    </span>
                    <div className="pairingCode">{this.state.enrollCode}</div>
                    <button type="button" className="copyBtn" style={{ margin: '0 auto' }}
                      onClick={() => {
                        if (navigator.clipboard) navigator.clipboard.writeText(this.state.enrollCode);
                        this.setState({ codeCopied: true });
                        setTimeout(() => this.setState({ codeCopied: false }), 1800);
                      }}>
                      {this.state.codeCopied ? 'Copié !!' : 'Copier'}
                    </button>
                    <button type="button" className="copyBtn" disabled={this.state.vpnBusy}
                      style={{ margin: '0 auto' }} onClick={this.handleVpnCancel}>
                      Annuler demande
                    </button>
                  </div>
                )}

                {(this.state.enrollStatus === 'revoked' || this.state.enrollStatus === 'blocked') && (
                  <div className="pairingBox">
                    <span className="pairingHint">
                      {this.state.enrollMessage || 'Accès retiré par l&apos;administrateur.'}
                      {this.state.enrollStatus === 'revoked' &&
                        " Vous pouvez en faire la demande à nouveau en rebasculant le sélecteur."}
                    </span>
                  </div>
                )}

                {(this.state.enrollStatus === 'conflict' || this.state.enrollStatus === 'expired') && (
                  <div className="pairingBox">
                    <span className="pairingHint" style={{ color: theme.accentRed }}>
                      {this.state.enrollMessage || 'Enrôlement impossible'}
                    </span>
                    <span className="pairingHint">
                      Contactez l&apos;administrateur du réseau.
                    </span>
                  </div>
                )}

                <div className="vpnStatus">
                  {this.state.vpnBusy ? (
                    <><div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} /><span>Application ..</span></>
                  ) : this.state.vpnRunning ? (
                    <>
                      <div className="ledSocket" style={{ background: this.state.vpnConnected ? '#4ade80' : '#fbbf24', boxShadow: this.state.vpnConnected ? '0 0 8px #4ade80' : 'none' }} />
                      <span>
                        {this.state.vpnConnected ? 'Tunnel établi' : 'Connexion en cours ..'}
                        {this.state.vpnMode === 'temp' && this.state.vpnExpiresAt &&
                          ` — fermeture dans ${Math.max(0, Math.round((this.state.vpnExpiresAt - Date.now()) / 60000))} min`}
                      </span>
                    </>
                  ) : this.state.enrollStatus === 'pending' ? (
                    <>
                      <div className="ledSocket" style={{ background: '#fbbf24' }} />
                      <span>En attente d&apos;autorisation</span>
                    </>
                  ) : (
                    <>
                      <div className="ledSocket" />
                      <span>Aucun accès distant</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            <div className="card">

              <div className="sectionTitle">
                Fréquence
                <button type="button" className="importBtn" onClick={this.importFromSa818} disabled={this.state.isImporting818} title="Récupère fréquences, Ctcss / Dcs, squelch, bande et volume programmés dans le module">
                  {this.state.isImporting818 ? 'Lecture module ..' : 'Lire Sa818'}
                </button>
              </div>
              <div className="subCard">
                <div className="fieldRow" style={{ alignItems: 'center' }}>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Rx</label>
                    <input placeholder="---.----" type="text" inputMode="decimal" className={`fieldInput ${!validateFreq(value('rx_qrg')) ? 'invalidInput' : ''}`} name="rx_qrg" value={value('rx_qrg')} onChange={this.handleChange} />
                  </div>

                  <button  type="button" onClick={this.copyRxToTx} className="copyBtn" title="Copie vers TX"> ➔ </button>

                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Tx</label>
                    <input placeholder="---.----" type="text" inputMode="decimal" className={`fieldInput ${!validateFreq(value('tx_qrg')) ? 'invalidInput' : ''}`} name="tx_qrg" value={value('tx_qrg')} onChange={this.handleChange} />
                  </div>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Tonalité</div>
              <div className="subCard">
                <div className="fieldRow">
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Rx</label>
                    {isDcsMode ? (
                      <select required name="dcs_fq" className="fieldInput" value={value('dcs_fq')} onChange={this.handleChange}>
                        {dcsOptions(value('dcs_fq')).map(c => <option key={c} value={c}>{toneLabel(c)}</option>)}
                      </select>
                    ) : (
                      <select required name="ctcss_fq" className="fieldInput" value={value('ctcss_fq')} onChange={this.handleChange}>
                        {ctcssFrequencies.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="toneCenter">
                    <select name="tone_mode" className="toneModeSelect" value={isDcsMode ? 'Dcs' : 'Ctcss'} onChange={this.handleToneMode} title="Type de tonalité">
                      <option value="Ctcss">Ctcss</option>
                      <option value="Dcs">Dcs</option>
                    </select>
                    <button type="button" onClick={this.copyRxCtcssToTx} className="copyBtn" title="Copie vers TX" style={{ margin: '2px 0' }}>➔</button>
                  </div>

                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Tx</label>
                    {isDcsMode ? (
                      <select required name="dcs_fqt" className="fieldInput" value={value('dcs_fqt')} onChange={this.handleChange}>
                        {dcsOptions(value('dcs_fqt')).map(c => <option key={c} value={c}>{toneLabel(c)}</option>)}
                      </select>
                    ) : (
                      <select required name="ctcss_fqt" className="fieldInput" value={value('ctcss_fqt')} onChange={this.handleChange}>
                        {ctcssFrequencies.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="sectionTitle" style={{ marginTop: '20px' }}>Option SA818</div>
              <div className="subCard">
                <div className="fieldRow" style={{ marginBottom: '12px' }}>
                  <div className="fieldGroup" style={{ flex: 2 }}>
                    <label className="fieldLabel">Méthode détection</label>
                    <select required name="sql_det" className="fieldInput" value={value('sql_det')} onChange={this.handleChange}>
                      <option value="GPIO">GPIO</option>{!isDcsMode && <option value="CTCSS">Ctcss</option>}
                      <option value="VOX">VOX</option><option value="SIGLEV">SIGLEV</option>
                    </select>
                  </div>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Squelch</label>
                    <select required name="sql_lvl" className="fieldInput" value={value('sql_lvl')} onChange={this.handleChange}>
                      {sql_lvl.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fieldGroup" style={{ flex: 2, flexDirection: 'row', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="fieldLabel">Bande</label>
                      <select name="bw_818" className="fieldInput" value={this.state.bw_818} onChange={this.handleChange}>
                        <option value="0">Narrow</option><option value="1">Wide</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="fieldLabel">Vol</label>
                      <select name="vol_818" className="fieldInput" value={this.state.vol_818} onChange={this.handleChange}>
                        {['1','2','3','4','5','6','7','8'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="checkboxRow">
                  <label className="color coche" style={{ marginLeft: '0' }}><input type="checkbox" name="hp_818" className="coche" checked={this.state.hp_818} onChange={this.handleChange} /> <span className="checkmark" style={{ margin: '-4px 0 0 32px' }}></span> Passe Haut </label>
                  <label className="color coche"><input type="checkbox" name="lp_818" className="coche" checked={this.state.lp_818} onChange={this.handleChange} /> <span className="checkmark" style={{ margin: '-4px 0 0 -14px' }}></span> Bas</label>
                  <label className="color coche"><input type="checkbox" name="pre_818" className="coche" checked={this.state.pre_818} onChange={this.handleChange} /> <span className="checkmark" style={{ margin: '-4px 0 0 32px' }}></span> Déphasage </label>
                </div>

                <div className="fieldRow" style={{ marginTop: '12px' }}>
                  <div className="fieldGroup" style={{ flex: 1 }}>
                    <label className="fieldLabel">Reprogrammer le module radio ?</label>
                    <select required name="lSA818" className="fieldInput" value={value('lSA818') || 'Non'} onChange={this.handleChange}>
                      {lSA818.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '42px', marginBottom: isDirty ? '72px' : 0 }}>
            <button type="submit" className={`saveBtn ${this.state.isSaving ? 'saving' : ''}`} disabled={this.state.isSaving || !canSave}>
              {this.state.isSaving ? 'Enregistrement ..' : 'Enregistrer'}
            </button>
          </div>

          {isDirty && !saveFlow && (
            <div className="dirtyBar" role="status">
              <span className="dirtyDot" />
              <span className="dirtyText">Modifications non enregistrées</span>
              <button type="submit" className="dirtySaveBtn" disabled={this.state.isSaving || !canSave}>Enregistrer</button>
            </div>
          )}

          {saveFlow && ReactDOM.createPortal(
            <div className="overlay">
              <div className="popup" role="dialog" aria-live="polite">
                <div className="popupHeader">
                  <span style={{ color: theme.textPrimary, fontWeight: 500 }}>Enregistrement</span>
                  <button type="button" onClick={this.closeSaveFlow} className="closeBtn" aria-label="Fermer">✕</button>
                </div>
                <div className="saveSteps">
                  {[
                    ['save', 'Enregistrement de la configuration'],
                    ['restart', 'Redémarrage de SvxLink'],
                    ['connect', 'Connexion au serveur'],
                  ].map(([key, label]) => (
                    <div key={key} className={`saveStep ${STEP_CLASS[saveFlow[key]] || ''}`}>
                      <span className="saveStepIcon">
                        {saveFlow[key] === 'run' ? <span className="saveStepSpinner" /> : (STEP_ICON[saveFlow[key]] || '')}
                      </span>
                      <span className="saveStepText">
                        {label}
                        {key === 'connect' && saveFlow.detail && <span className="saveStepDetail">{saveFlow.detail}</span>}
                      </span>
                    </div>
                  ))}
                </div>
                {saveFlow.result !== 'running' && (
                  <>
                    <p className={`saveResult ${RESULT_CLASS[saveFlow.result] || ''}`}>{saveFlow.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button type="button" onClick={this.closeSaveFlow} className="popupBtn popupBtnOk">Fermer</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          , document.body)}

          {this.state.leaveTarget && ReactDOM.createPortal(
            <div className="overlay" onClick={this.cancelLeave}>
              <div className="popup" role="alertdialog" aria-modal="true" aria-labelledby="leaveTitle"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === 'Escape') this.cancelLeave(); }}>
                <div className="popupHeader">
                  <span id="leaveTitle" style={{ color: theme.accentYellow, fontWeight: 500 }}>Modifications non enregistrées</span>
                  <button type="button" onClick={this.cancelLeave} className="closeBtn" aria-label="Fermer">✕</button>
                </div>
                <p style={{ color: theme.textPrimary, fontSize: '14.8px', textAlign: 'center', margin: '16px 0 22px', lineHeight: 1.6 }}>
                  Vos changements seront perdus si vous quittez la page.
                </p>
                <div className="leaveBtns">
                  <button type="button" onClick={this.saveAndLeave} disabled={this.state.isSaving || !canSave} className="popupBtn popupBtnOk leaveSaveBtn">Enregistrer et quitter</button>
                  <button type="button" onClick={this.confirmLeave} className="popupBtn popupBtnDanger">Quitter</button>
                  <button type="button" onClick={this.cancelLeave} className="popupBtn">Rester</button>
                </div>
              </div>
            </div>
          , document.body)}

        </form>

<style jsx>{`

.themeToggle { position: absolute; top: 50px; right: 10px; z-index: 1000; }

.grid { display: grid; grid-template-columns: auto; gap: 22px; justify-content: center; margin-top: 68px; }

.card { background-color: ${theme.moduleBg}; padding: 0 8px; border-radius: 22px; box-shadow: ${theme.shadow}; border: 1px solid ${theme.cardBorder}; }

.sectionTitle { font-size: 18.8px; font-weight: 500; color: ${theme.accentRed}; margin: 10px auto; align-items: center; text-align: center; width: 80%; position: relative; }

.subCard { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 14px 12px; text-align: center; }

.subCard2 { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 6px 8px; text-align: center; }

.subLabel { font-size: 14.8px; color: ${theme.textSecondary}; text-align: center; }

.fieldRow { display: flex; gap: 4px; align-items: flex-end; }

.fieldGroup { display: flex; flex-direction: column; gap: 4px; }

.fieldLabel { font-size: 14.8px; color: ${theme.textPrimary}; text-transform: none; margin: 0; white-space: nowrap; }

.fieldInput { background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textSecondary}; font-size: 14.8px; padding: 4px; width: 100%; outline: none; transition: all 0.14s; text-align-last: center; height: 26px; cursor: pointer; appearance: none; box-sizing: border-box; }

.fieldInput:focus { border-color: #4ade80; background: ${theme.cardBg2}; }

.invalidInput { border-color: ${theme.accentRed} !important; }

.invalidInput:focus { border-color: ${theme.accentRed} !important; }

.copyBtn { background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 6px; color: #4ade80; cursor: pointer; font-size: 10px; margin-top: 24px; padding: 0 6px; transition: all 0.14s; height: 20px; display: flex; align-items: center; justify-content: center; }

.copyBtn:hover { background: #4ade80; color: white; border-color: #4ade80; }

.copyBtn:active { transform: scale(0.8); }

.fieldInput option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.fieldInput:hover { background: ${theme.hoverBg}; }

.tabsRow { display: flex; align-items: center; gap: 28px; margin: 16px auto 4px auto; flex-wrap: wrap; width: 268px; }

.tabBtn { font-size: 12px; color: ${theme.textPrimary}; background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 6px; padding: 2px 12px; cursor: pointer; transition: all 0.14s; }

.tabBtn:hover { background: #4ade80; color: white; }

.tabActive { color: white; background: ${theme.accentRed}; border-color: ${theme.accentRed}; opacity: 0.68; }

.toggleText { font-size: 12px; color: ${theme.textPrimary}; }

.checkboxRow { display: flex; gap: 10px; flex-wrap: wrap; }

.color { color: ${theme.textPrimary}; }

.signalTrack { flex: 1; height: 6px; background: ${theme.cardBorder}; border-radius: 10px; overflow: hidden; }

.signalFill { height: 100%; border-radius: 10px; transition: width 0.26s ease-in-out; }

.wifiRow { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 8px; cursor: pointer; transition: background 0.14s; background: ${theme.cardBg2}; margin-bottom: 8px; }

.wifiRow:hover { background: ${theme.hoverBg}; }

.wifiSsid { font-size: 14.8px; color: ${theme.textPrimary}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.activeInfo { display: flex; align-items: center; gap: 10px; font-size: 12px; color: ${theme.textSecondary}; }

.activeIp { font-size: 12.4px; color: ${theme.textSecondary}; user-select: all; }

.tzRow { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 26px; }

.tzSelect { background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textSecondary}; font-size: 14.8px; padding: 4px 8px; outline: none; transition: all 0.14s; text-align-last: center; height: 26px; cursor: pointer; appearance: none; width: 178px; position: absolute; }

.tzSelect:focus { border-color: #4ade80; background: ${theme.cardBg2}; }

.tzSelect:hover:not(:disabled) { background: ${theme.hoverBg}; }

.tzSelect:disabled { opacity: 0.5; cursor: wait; }

.tzSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.tzTime { font-family: monospace; font-size: 14px; color: #4ade80; margin-left: 240px; }

.savedNet { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; margin-bottom: 8px; }

.activeBadge { font-size: 12.2px; color: #4ade80; background: rgba(74, 222, 128, 0.24); padding: 2px 6px; border-radius: 6px; }

.netBtn { font-size: 14.8px; color: white; border: none; border-radius: 6px; padding: 0 4px; cursor: pointer; transition: background 0.14s; }

.netBtnOk { background: rgba(74, 222, 128, 0.6); }

.netBtnOk:hover  { background: #4ade80; }

.netBtnOk:disabled { opacity: 0.4; cursor: not-allowed; }

.netBtnDel { background: rgba(217,83,79,0.6); }

.netBtnDel:hover { background: ${theme.accentRed}; }

.scanBtn { font-size: 14.8px; color: ${theme.textSecondary}; background: rgba(74,222,128,0.26); border: 0.6px solid #4ade80; border-radius: 8px; padding: 0 12px; cursor: pointer; transition: all 0.14s; margin-top: 2px; }

.scanBtn:hover:not(:disabled) { background: rgba(74,222,128,0.66); }

.scanBtn:disabled { opacity: 0.6; }

.spinner { width: 18px; height: 18px; border: 2.6px solid rgba(74,222,128,0.2); border-radius: 50%; border-top-color: #4ade80; animation: spin 1s ease-in-out infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

.helpBtn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 0 2px; opacity: 0.68; transition: opacity 0.14s; position: absolute; right: 0; top: 50%; transform: translateY(-50%); }

.helpBtn:hover { opacity: 1; transform: translateY(-50%) scale(1.2); }

.mapBtn { background: rgba(74,222,128,0.2); border: 0.6px solid #4ade80; border-radius: 6px; color: ${theme.textSecondary}; cursor: pointer; font-size: 12px; padding: 0 6px; margin: 0 0 0 30px; transition: all 0.14s; height: 22px; display: flex; align-items: center; width: 66px; }

.mapBtn:hover { background: #4ade80; color: white; }

.soundBtn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 4px; transition: transform 0.14s; opacity: 0.68; }

.soundBtn:hover { opacity: 1; transform: scale(1.2); }

.extLink { font-size: 14.8px; color: #4ade80; text-decoration: none; border-radius: 8px; border: 1px solid transparent; padding: 0 8px; }

.extLink:hover { border-color: #4ade80; }

.saveBtn { padding: 8px 28px; border: none; border-radius: 10px; color: white; background: #4ade80; font-size: 14.8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }

.saveBtn:hover:not(.saving):not(:disabled) { background: ${theme.accentRed}; }

.saveBtn:active { transform: scale(0.96); }

.saveBtn.saving { background: ${theme.accentRed}; color: white; cursor: not-allowed; }

.ledSelect { background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textSecondary}; font-size: 14.8px; padding: 4px 8px; width: 100%; outline: none; transition: all 0.14s; text-align-last: center; height: 26px; cursor: pointer; appearance: none; margin:0 0 0 28px; width: 118px; }

.ledSelect:focus { border-color: #4ade80; background: ${theme.cardBg2}; }

.ledSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.ledSelect:hover { background: ${theme.hoverBg}; }

.netNameRow { align-items: center; justify-content: center; }

.pingBtn { font-size: 12px; font-weight: 482; border: 0.6px solid ${theme.cardBorder}; border-radius: 6px; background: ${theme.cardBg2}; color: ${theme.textSecondary}; cursor: pointer; padding: 0 8px; height: 20px; min-width: 38px; transition: all 0.18s; white-space: nowrap; margin: -1px 0 0 104px; position: absolute; }

.pingBtn:hover:not(:disabled) { background: ${theme.hoverBg}; border-color: #4ade80; color: #4ade80; }

.pingBtn:disabled { opacity: 0.6; cursor: not-allowed; }

.pingBtnOk { background: rgba(74,222,128,0.15) !important; border-color: #4ade80 !important; color: #4ade80 !important; }

.pingBtnFail { background: rgba(217,83,79,0.15) !important; border-color: ${theme.accentRed} !important; color: ${theme.accentRed} !important; }

.pingBtnWarn { background: rgba(251,191,36,0.15) !important; border-color: #fbbf24 !important; color: #fbbf24 !important; }

.knownBadge { font-size: 11.4px; color: ${theme.textSecondary}; background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; padding: 1px 5px; border-radius: 6px; flex-shrink: 0; }

.toneCenter { display: flex; flex-direction: column; align-items: center; gap: 4px; }

.toneModeSelect { background: rgba(74,222,128,0.26); border: 0.6px solid #4ade80; border-radius: 6px; color: ${theme.textSecondary}; cursor: pointer; font-size: 12.8px; height: 20px; padding: 0 6px; outline: none; appearance: none; text-align-last: center; transition: all 0.14s; margin: -6px 0 8px 0; }

.toneModeSelect:hover, .toneModeSelect:focus { background: rgba(74,222,128,0.66); }

.toneModeSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.importBtn { background: rgba(74,222,128,0.2); border: 0.6px solid #4ade80; border-radius: 8px; color: ${theme.textSecondary}; cursor: pointer; font-size: 13.4px; padding: 2px 6px; transition: all 0.14s; position absolute; right: -28px; }

.importBtn:hover:not(:disabled) { background: #4ade80; color: white; border-color: #4ade80; }

.importBtn:disabled { opacity: 0.6; cursor: wait; }

.vpnRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

.vpnSelect { background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textSecondary}; font-size: 14.8px; padding: 4px 8px; outline: none; transition: all 0.14s; text-align-last: center; height: 26px; cursor: pointer; appearance: none; width: 118px; }

.vpnSelect:focus { border-color: #4ade80; background: ${theme.cardBg2}; }

.vpnSelect:hover:not(:disabled) { background: ${theme.hoverBg}; }

.vpnSelect:disabled { opacity: 0.5; cursor: not-allowed; }

.vpnSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.vpnStatus { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 10px 0 4px; font-size: 12px; color: ${theme.textSecondary}; min-height: 14px; }

.pairingBox { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 12px 0 4px; }

.pairingHint { font-size: 12.8px; color: ${theme.textSecondary}; text-align: center; line-height: 1.4; max-width: 100%; }

.pairingCode { font-family: monospace; font-size: 18px; letter-spacing: 6px; color: #4ade80; padding: 0 6px; border: 0.6px dashed ${theme.cardBorder}; border-radius: 10px; background: ${theme.cardBg2}; }

.vpnLog { color: ${theme.textSecondary}; font-size: 12px; line-height: 1.6; margin: 16px 0 0; max-height: 52vh; overflow-y: auto; white-space: pre-wrap; word-break: break-word; text-align: left; font-family: monospace; }

.dirtyBar { position: fixed; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); z-index: 900; display: flex; align-items: center; gap: 10px; max-width: calc(100vw - 20px); box-sizing: border-box; padding: 6px 6px 6px 14px; background: ${theme.moduleBg}; border: 0.6px solid rgba(251,191,36,0.4); border-radius: 14px; box-shadow: 0 8px 28px rgba(0,0,0,0.28); animation: dirtyIn 0.18s ease-out; }

@keyframes dirtyIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

.dirtyDot { width: 8px; height: 8px; border-radius: 50%; background: ${theme.accentYellow}; flex-shrink: 0; }

.dirtyText { font-size: 13.4px; color: ${theme.textPrimary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dirtySaveBtn { padding: 4px 14px; border: none; border-radius: 10px; color: white; background: #4ade80; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }

.dirtySaveBtn:hover:not(:disabled) { background: ${theme.accentRed}; }

.dirtySaveBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.saveSteps { display: flex; flex-direction: column; gap: 12px; padding: 18px 0 8px; }

.saveStep { display: flex; align-items: flex-start; gap: 12px; font-size: 14.8px; color: ${theme.textSecondary}; transition: color 0.2s; }

.saveStep.stepRun, .saveStep.stepOk { color: ${theme.textPrimary}; }

.saveStepIcon { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; border: 1.4px solid ${theme.cardBorder}; color: white; }

.stepOk .saveStepIcon { background: #4ade80; border-color: #4ade80; }

.stepErr .saveStepIcon { background: ${theme.accentRed}; border-color: ${theme.accentRed}; }

.stepWarn .saveStepIcon { background: ${theme.accentYellow}; border-color: ${theme.accentYellow}; }

.stepSkip .saveStepIcon { color: ${theme.textSecondary}; }

.stepRun .saveStepIcon { border: none; }

.saveStepSpinner { width: 20px; height: 20px; box-sizing: border-box; border: 2.4px solid rgba(74,222,128,0.2); border-radius: 50%; border-top-color: #4ade80; animation: spin 1s linear infinite; }

.saveStepText { display: flex; flex-direction: column; gap: 2px; line-height: 20px; }

.saveStepDetail { font-size: 14px; line-height: 1.4; color: ${theme.textSecondary}; }

.stepErr .saveStepDetail { color: ${theme.accentRed}; }

.saveResult { margin: 12px 0 20px; padding-top: 14px; border-top: 0.6px solid ${theme.cardBorder}; font-size: 14.8px; line-height: 1.6; color: ${theme.textPrimary}; text-align: center; }

.saveResult.resultOk { color: #4ade80; }

.saveResult.resultWarn { color: ${theme.accentYellow}; }

.saveResult.resultErr { color: ${theme.accentRed}; }

@media (prefers-reduced-motion: reduce) {
  .dirtyBar, .saveStepSpinner { animation: none !important; }
}

.terminalBtn { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 999; background: ${theme.moduleBg}; color: ${theme.textPrimary}; border-top-color: transparent; border: 1px solid #4ade80; border-radius: 0 0 10px 10px; cursor: pointer; padding: 2px 8px; font-size: 14.8px; transition: all 0.14s; }

.terminalBtn:hover { background: #4ade80; color: white; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(4px); }

.popup { background: ${theme.moduleBg}; padding: 24px 26px; border-radius: 22px; box-shadow: ${theme.shadow}; max-width: 420px; width: 90%; }

.popupHeader { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }

.closeBtn { background: none; border: none; color: #4ade80; font-size: 26.8px; cursor: pointer; padding: 0 4px; border-radius: 8px; transition: background 0.14s; height: 0; margin: -34px 4px 0; }

.closeBtn:hover { background: ${theme.cardBorder}; }

.popupBtn { font-size: 14.8px; color: #4ade80; background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; padding: 4px 14px; cursor: pointer; transition: background 0.14s; }

.popupBtn:hover { background: ${theme.cardBorder}; }

.popupBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.popupBtnOk { background: rgba(74,222,128,0.4); color: white; }

.popupBtnOk:hover:not(:disabled) { background: #4ade80; }

.popupBtnDanger { background: rgba(217,83,79,0.6); color: white; }

.popupBtnDanger:hover { background: ${theme.accentRed}; color: white; }

.passHint { font-size: 13px; color: ${theme.accentRed}; margin: 0 0 18px; text-align: center; }

.wpsCount { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 26px; letter-spacing: 2px; color: #4ade80; text-align: center; margin: 4px 0 14px; font-variant-numeric: tabular-nums; }

.wpsHint { font-size: 13.6px; color: ${theme.textSecondary}; line-height: 1.5; margin: 0 0 16px; }

.wpsDetail { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; word-break: break-word; user-select: all; margin: 0 0 20px; }

.wpsSteps { font-size: 14px; line-height: 1.7; padding-left: 20px; margin: 0 0 12px; }

.leaveBtns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }

.leaveBtns .popupBtn { flex: 1 1 0; min-height: 36px; }

.leaveBtns .leaveSaveBtn { flex-basis: 100%; font-weight: 500; }

.terminalPopup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.12); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(2.8px); }

.terminalContent { background-color: ${theme.moduleBg}; padding: 10px; border-radius: 22px; box-shadow: 0 0 60px rgba(255, 255, 255, 0.28); }

.terminalHeader { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.termContainer { width: 368px; height: 462px; position: relative; overflow: hidden; background-color: rgba(0, 0, 0, 0.4); border-radius: 16px; }

.terminalSelect { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textPrimary}; font-size: 14.8px; outline: none; text-align-last: center; height: 22px; cursor: pointer; appearance: none; padding: 0 4px; margin: 0 16px 0 auto; width: 142px; }

.terminalSelect:focus { border-color: #4ade80; background: ${theme.cardBg2}; }

.terminalSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.terminalSelect:hover { background: ${theme.hoverBg}; }

.ledSocket { width: 8px; height: 8px; background: black; border-radius: 50%; transition: all 0.04s; margin-left: 6px; }

.ledSocket.active { background: #4ade80; box-shadow: 0 0 14px #d9534f; }

:global(.xterm) { padding: 10px !important; }

:global(.xterm-viewport) { border-radius: 10px !important; }

:global(.xterm-helpers) { position: absolute !important; top: -9999px !important; left: -9999px !important; opacity: 0 !important; }

:global(.xterm-rows) { color: #eeeeeeff !important; }

:global(.notification:not(.error)) { background-color: #4ade80 !important; color: white !important; }

`}</style>

      </Layout>
    )
  }
}
export default Configuration