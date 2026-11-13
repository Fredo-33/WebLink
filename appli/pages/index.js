import React from 'react';
import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import fetch from '../lib/fetch';
import dynamic from 'next/dynamic';
import { Notif } from '../lib/notif';
import Fsm from '../lib/svxlink/fsm';
import { emptyNodeInfo, loadNodeInfo } from '../lib/nodeInfoClient';
import { motion, AnimatePresence } from 'framer-motion';
import Chrono from '../lib/chrono';
import SelectCustom from '../lib/select';
import SettingsPanel from '../lib/settingsPanel';
const Snowfall = dynamic(() => import('../lib/Snowfall'), { ssr: false });
const FallLeaves = dynamic(() => import('../lib/FallLeaves'), { ssr: false });
const Rain = dynamic(() => import('../lib/Rain'), { ssr: false });
const Fireflies = dynamic(() => import('../lib/Fireflies'), { ssr: false });
const Bubbles = dynamic(() => import('../lib/Bubbles'), { ssr: false });
const Pong = dynamic(() => import('../lib/pong'), { ssr: false });
const Globe = dynamic(() => import('../lib/globe'), { ssr: false });
const FlatMap = dynamic(() => import('../lib/flatMap'), { ssr: false });
const sys = ['Sys1', 'Sys2', 'Sys3', 'Sys4'];
const Views = { Bar: 'bar', Circle: 'circle', Halo: 'halo', Flip: 'flip', Segments: 'segments' };
const radioAmateurNetworks = ['ri49', 'gir', 'rrf', 'tec', 'bav'];

const COLOR_KEYS = ['relayColor', 'relayBgColor', 'nodesColor', 'nodesBgColor', 'transColor', 'transBgColor', 'logsColor', 'logsBgColor', 'hmColor'];
const BG_KEYS = ['relayBgColor', 'nodesBgColor', 'transBgColor', 'logsBgColor'];
const POSITION_KEYS = ['logsX', 'logsY', 'nbNodesX', 'nbNodesY', 'transmitterX', 'transmitterY', 'chronoXvw', 'chronoYvh', 'mumbleX', 'mumbleY', 'mumbleW', 'mumbleH'];
const FLOAT_KEYS = [...POSITION_KEYS, 'contrast', 'brightness', 'pageZoom', 'nodeButtonWidth'];
const DISPLAY_KEYS = ['logo', 'setting', 'log1', 'log2', 'log3', 'nbNodes', 'mumble', 'globe', 'snowfall', 'fallLeaves', 'rain', 'fireflies', 'bubbles'];
const BOOL_KEYS = [...DISPLAY_KEYS, 'voice', 'notificationsEnabled'];
const STRING_KEYS = ['font', 'chronoView', 'activeTheme', 'image', 'mapMode', 'mapTiles'];
const PREF_KEYS = [...COLOR_KEYS, ...FLOAT_KEYS, ...BOOL_KEYS, ...STRING_KEYS, 'favoris', 'customImage'];

const CONFIG_KEYS = {
  colors: COLOR_KEYS,
  positions: POSITION_KEYS,
  display: DISPLAY_KEYS,
  misc: ['font', 'activeTheme', 'chronoView', 'mapMode', 'mapTiles', 'contrast', 'brightness', 'image', 'voice', 'notificationsEnabled', 'pageZoom', 'nodeButtonWidth', 'favoris'],
};

const LEGACY_TEXT = { grey: '#808080', white: '#ffffff', dodgerblue: '#1e90ff', 'rgb(30, 144, 255)': '#1e90ff', 'rgba(30, 144, 255, 0.7)': '#1e90ff', pink: '#ffc0cb', black: '#000000', yellow: '#ffff00', cyan: '#00ffff', orange: '#ffa500' };
const LEGACY_BG = { grey: 'rgba(121, 122, 128, 0.7)', '#4ade80': 'rgba(74, 222, 128, 0.8)', '#d9534f': 'rgba(217, 83, 79, 0.7)', dodgerblue: 'rgba(30, 144, 255, 0.7)', white: 'rgba(255, 255, 255, 0.72)', pink: 'rgba(255, 193, 203, 0.7)', black: 'rgba(0, 0, 0, 0.7)', yellow: 'rgba(255, 255, 0, 0.7)', cyan: 'rgba(0, 255, 251, 0.7)', orange: 'rgba(244, 102, 27, 0.88)' };

const normalizeColor = (key, val) => {
  if (typeof val !== 'string') return val;
  const map = BG_KEYS.includes(key) ? LEGACY_BG : LEGACY_TEXT;
  return map[val] || val;
};

const THEMES = {
  "Défaut": {
    relayColor: '#d9534f', relayBgColor: 'rgba(255, 255, 255, 0.72)',
    nodesColor: '#ffffff', nodesBgColor: 'rgba(121, 122, 128, 0.7)',
    transColor: '#ffffff', transBgColor: 'rgba(74, 222, 128, 0.74)',
    logsColor: '#f0f0f0', logsBgColor: 'rgba(121, 122, 128, 0.7)',
    hmColor: '#d9534f',
  },
  "Nuit": {
    relayColor: '#0f172a', relayBgColor: 'rgba(56, 189, 248, 0.74)',
    nodesColor: '#f8fafc', nodesBgColor: 'rgba(2, 6, 23, 0.74)',
    transColor: '#ffffff', transBgColor: 'rgba(29, 78, 216, 0.74)',
    logsColor: '#94a3b8', logsBgColor: 'rgba(15, 23, 42, 0.8)',
    hmColor: '#3ae7e1',
  },
  "Forêt": {
    relayColor: '#112211', relayBgColor: 'rgba(134, 239, 172, 0.74)',
    nodesColor: '#f0fdf4', nodesBgColor: 'rgba(11, 27, 16, 0.74)',
    transColor: '#ffffff', transBgColor: 'rgba(22, 101, 52, 0.74)',
    logsColor: '#bbf7d0', logsBgColor: 'rgba(20, 40, 25, 0.8)',
    hmColor: '#a3e635',
  },
  "Tactique": {
    relayColor: '#ffffff', relayBgColor: 'rgba(174, 124, 85, 0.74)',
    nodesColor: '#f5f5dc', nodesBgColor: 'rgba(23, 27, 21, 0.74)',
    transColor: '#ffffff', transBgColor: 'rgba(72, 86, 56, 0.78)',
    logsColor: '#a3b19b', logsBgColor: 'rgba(38, 44, 34, 0.8)',
    hmColor: '#ff5722',
  },
  "Néon": {
    relayColor: '#ffffff', relayBgColor: 'rgba(244, 63, 94, 0.74)',
    nodesColor: '#06b6d4', nodesBgColor: 'rgba(5, 5, 10, 0.74)',
    transColor: '#ffffff', transBgColor: 'rgba(13, 148, 136, 0.74)',
    logsColor: '#d946ef', logsBgColor: 'rgba(20, 0, 35, 0.8)',
    hmColor: '#eab308',
  },
};

const defaultState = { font: 'Arial, sans-serif', contrast: 100, brightness: 100, pageZoom: 100, nodeButtonWidth: null, relayColor: '#d9534f', relayBgColor: 'rgba(255, 255, 255, 0.72)', nodesColor: '#ffffff', nodesBgColor: 'rgba(121, 122, 128, 0.7)', hmColor: '#d9534f', transColor: '#ffffff', transBgColor: 'rgba(74, 222, 128, 0.84)', logsColor: '#ffffff', logsBgColor: 'rgba(121, 122, 128, 0.72)', activeTheme: 'Défaut', image: '../static/weblink1.jpg', logo: true, setting: true, log1: true, log2: false, log3: false, nbNodes: true, mumble: true, voice: false, notificationsEnabled: true, snowfall: false, fallLeaves: false, rain: false, fireflies: false, bubbles: false, chronoView: Views.Bar, logsX: 0.2, logsY: 53.23, nbNodesX: 20, nbNodesY: 0, transmitterX: 85.1, transmitterY: 10, chronoXvw: 6.4, chronoYvh: 14.0, mumbleX: 26, mumbleY: 9.5, mumbleW: 168, mumbleH: null, mapMode: 'off', mapTiles: 'voyager', globe: false, favoris: [] };

const savePref = (name, value) => { try { localStorage.setItem(name, String(value)); } catch (e) {} };
const loadPref = (name) => { try { const v = localStorage.getItem(name); return v === null ? undefined : v; } catch (e) { return undefined; } };
const clearPref = (name) => { try { localStorage.removeItem(name); } catch (e) {} };

const restorePrefs = () => {
  const out = {};
  FLOAT_KEYS.forEach(k => {
    const v = loadPref(k);
    if (v !== undefined && !isNaN(parseFloat(v))) out[k] = parseFloat(v);
  });
  COLOR_KEYS.forEach(k => {
    const v = loadPref(k);
    if (v === undefined) return;
    const n = normalizeColor(k, v);
    if (n !== v) savePref(k, n);
    out[k] = n;
  });
  STRING_KEYS.forEach(k => {
    const v = loadPref(k);
    if (v !== undefined && v !== 'null') out[k] = v;
  });
  BOOL_KEYS.forEach(k => {
    const v = loadPref(k);
    if (v === undefined) return;
    try { out[k] = JSON.parse(v); } catch (e) {}
  });
  const fav = loadPref('favoris');
  if (fav !== undefined) {
    try { const p = JSON.parse(fav); if (Array.isArray(p)) out.favoris = p; } catch (e) {}
  }
  if (out.mapMode === undefined && out.globe !== undefined) out.mapMode = out.globe ? 'globe' : 'off';
  if (out.mapMode !== undefined) out.globe = out.mapMode !== 'off';
  return out;
};

class Component extends React.Component {
  constructor(props) {
    super(props);

    this.mumbleListRef = React.createRef();

    this.dragKeys = { logs: { x: 'logsX', y: 'logsY' }, nbNodes: { x: 'nbNodesX', y: 'nbNodesY' }, transmitter: { x: 'transmitterX', y: 'transmitterY' }, chrono: { x: 'chronoXvw', y: 'chronoYvh', invertX: true }, mumble: { x: 'mumbleX', y: 'mumbleY' } };

    this.state = { ...defaultState, ...props, tri: '1', activeDrag: null, dragStartX: 0, dragStartY: 0, dragStartItemX: 0, dragStartItemY: 0, tab1: 'logs', tab2: 'other5', tab3: 'other10', isReset: false, showResetConfirm: false, showNotification: false, notificationMessage: '', showNodeLeftNotification: false, nodeLeftNotificationMessage: '', soundInitialized: false, soundEnabled: false, res2Name: 'Réseau 2', res3Name: 'Réseau 3', res4Name: 'Réseau 4', isNearTopEdge: false, isNearLeftEdge: false, ...emptyNodeInfo(), mumbleUsers: [], displayCount: 0, displayMumble: 0, nodePing: 0, streamStatus: 'connecting', imageGrid: false, showSaveTheme: false, saveThemeName: '', previewTheme: null, activePreset: '', presetName: '', showSavePreset: false };
  }

  voiceList = [ 'Michel' ];

  pendingJoinNames = [];
  pendingLeftNames = [];

  getNodeWidth = () => this.state.nodeButtonWidth || (this.state.network === 'ri49' ? 172 : 204);

  applyThemeVars = () => {
    if (typeof document === 'undefined') return;
    const s = this.state;
    const ri49 = s.network === 'ri49';
    const vars = {
      '--node-bg': s.nodesBgColor, '--node-color': s.nodesColor,
      '--nodes-bg': s.nodesBgColor, '--nodes-color': s.nodesColor,
      '--app-font': s.font, '--font': s.font,
      '--trans-color': s.transColor, '--trans-bg': s.transBgColor,
      '--relay-color': s.relayColor, '--relay-bg': s.relayBgColor,
      '--logs-color': s.logsColor, '--logs-bg': s.logsBgColor,
      '--hm-color': s.hmColor,
      '--node-btn-width': this.getNodeWidth() + 'px',
      '--ol-max-width': ri49 ? '2146px' : '1768px',
      '--ol-margin-top': ri49 ? '0' : '70px',
    };
    const r = document.documentElement.style;
    Object.entries(vars).forEach(([k, v]) => r.setProperty(k, v));
  };

  setFilter = (contrast, brightness) => {
    const el = document.getElementById('__next');
    if (el) el.style.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
    document.body.style.filter = '';
  };

  applyFilters = () => this.setFilter(this.state.contrast, this.state.brightness);

  initSound = () => {
    if (!this.state.soundInitialized) {
      this.connectionSound.play();
      this.setState({ soundInitialized: true, soundEnabled: true });
    } else {
      this.setState(prev => ({ soundEnabled: !prev.soundEnabled }));
    }
  };

  playSound = (sound) => {
    if (this.state.soundEnabled) sound.play();
  };

  _cutOpposite = (type) => {
    if (type === 'join' && this.state.showNodeLeftNotification) {
      const elapsed = this._nodeLeftNotifStart ? Date.now() - this._nodeLeftNotifStart : 9999;
      if (elapsed < 4000) {
        clearTimeout(this.nodeLeftNotifTimer);
        clearTimeout(this.nodeLeftFadeTimer);
        this._nodeLeftNotifStart = null;
        this.setState({ showNodeLeftNotification: false, nodeLeftNotificationFadeOut: false });
        return true;
      }
      return false;
    }
    if (type === 'left' && this.state.showNotification) {
      const elapsed = this._notifStart ? Date.now() - this._notifStart : 9999;
      if (elapsed < 4000) {
        clearTimeout(this.notifTimer);
        clearTimeout(this.notifFadeTimer);
        this._notifStart = null;
        this.setState({ showNotification: false, notificationFadeOut: false });
        return true;
      }
      return false;
    }
    return true;
  };

  showNotification = (name) => {
    if (!this.state.notificationsEnabled) return;
    this.pendingJoinNames.push(name);
    clearTimeout(this.notifGroupTimer);
    this.notifGroupTimer = setTimeout(() => {
      const names = this.pendingJoinNames;
      this.pendingJoinNames = [];
      const spaces = '\u00A0'.repeat(2);
      const message = names.length === 1
        ? `${names[0]}${spaces}s'est connecté`
        : `${names.join('\u00A0\u00A0')}${spaces}se sont connectés`;
      const immediate = this._cutOpposite('join');
      const delay = immediate ? 0 : 1488;
      clearTimeout(this.notifDelayTimer);
      this.notifDelayTimer = setTimeout(() => {
        this.playSound(this.connectionSound);
        this.speak(this.formatVoice(message));
        clearTimeout(this.notifTimer);
        clearTimeout(this.notifFadeTimer);
        this._notifStart = Date.now();
        this.setState({ showNotification: true, notificationMessage: message, notificationFadeOut: false });
        this.notifTimer = setTimeout(this.hideNotification, 6000);
      }, delay);
    }, 1000);
  };

  hideNotification = () => {
    this._notifStart = null;
    this.setState({ notificationFadeOut: true });
    this.notifFadeTimer = setTimeout(() => {
      this.setState({ showNotification: false, notificationFadeOut: false });
    }, 1448);
  };

  showNodeLeftNotification = (name) => {
    if (!this.state.notificationsEnabled) return;
    this.pendingLeftNames.push(name);
    clearTimeout(this.nodeLeftGroupTimer);
    this.nodeLeftGroupTimer = setTimeout(() => {
      const names = this.pendingLeftNames;
      this.pendingLeftNames = [];
      const spaces = '\u00A0'.repeat(2);
      const message = names.length === 1
        ? `${names[0]}${spaces}s'est déconnecté`
        : `${names.join('\u00A0\u00A0')}${spaces}se sont déconnectés`;
      const immediate = this._cutOpposite('left');
      const delay = immediate ? 0 : 1500;
      clearTimeout(this.nodeLeftDelayTimer);
      this.nodeLeftDelayTimer = setTimeout(() => {
        this.playSound(this.disconnectionSound);
        this.speak(this.formatVoice(message));
        clearTimeout(this.nodeLeftNotifTimer);
        clearTimeout(this.nodeLeftFadeTimer);
        this._nodeLeftNotifStart = Date.now();
        this.setState({ showNodeLeftNotification: true, nodeLeftNotificationMessage: message, nodeLeftNotificationFadeOut: false });
        this.nodeLeftNotifTimer = setTimeout(this.hideNodeLeftNotification, 4864);
      }, delay);
    }, 1000);
  };

  hideNodeLeftNotification = () => {
    this._nodeLeftNotifStart = null;
    this.setState({ nodeLeftNotificationFadeOut: true });
    this.nodeLeftFadeTimer = setTimeout(() => {
      this.setState({ showNodeLeftNotification: false, nodeLeftNotificationFadeOut: false });
    }, 1440);
  };

  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') return;

    this.pendingJoinNames = [];
    this.pendingLeftNames = [];

    clearTimeout(this.notifGroupTimer);
    clearTimeout(this.notifDelayTimer);
    clearTimeout(this.notifTimer);
    clearTimeout(this.notifFadeTimer);
    clearTimeout(this.nodeLeftGroupTimer);
    clearTimeout(this.nodeLeftDelayTimer);
    clearTimeout(this.nodeLeftNotifTimer);
    clearTimeout(this.nodeLeftFadeTimer);

    this.setState({ showNotification: false, notificationFadeOut: false, showNodeLeftNotification: false, nodeLeftNotificationFadeOut: false });

    this.fetchAllLogs();
    this.fetchMumble();

    if (!this.es || this.es.readyState === 2) this.reconnectEventSource();
  };

  speak = (text) => {
    if (!this.state.voice || typeof window === 'undefined' || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-FR';
    utter.volume = 0.8;
    utter.rate = 1;
    const voices = speechSynthesis.getVoices();
    const good = voices.find(v =>
      v.lang.startsWith('fr') &&
      (v.name.includes('Google') || v.name.includes('Microsoft'))
    ) || voices.find(v => v.lang.startsWith('fr'));
    if (good) utter.voice = good;
    speechSynthesis.speak(utter);
  };

  formatVoice = (raw) => {
    if (raw.startsWith('(CT)')) return raw.replace(/^\(CT\)\s*/, '');
    const m = raw.match(/^\((\d+)\)\s*(.+?)\s*(s'est connecté|s'est déconnecté)$/);
    if (!m) return raw;
    const [, num, prenom, fin] = m;
    if (this.voiceList.includes(prenom)) return `${prenom} ${num} ${fin}`;
    return `${prenom} ${fin}`;
  };

  toggleTab = (tab, tabNumber) => {
    this.setState({ [`tab${tabNumber}`]: tab });
  };

  fetchMumble = () => {
    if (this.state.network !== 'pmr' || !this.state.mumble) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    fetch('https://pmr.websdrbordeaux.fr/api/mumble')
      .then(res => res.json())
      .then(data => this.setState({ mumbleUsers: Array.isArray(data) ? data : [] }))
      .catch(err => console.error(err));
  };

  fetchLogs = (logType) => {
    const network = this.state.network;
    if (network === 'default' || network === 'conf') return;

    const endpoint = logType === 'logs' ? 'logsTemps' : logType;
    const url = (network === 'pmr' || network === 'bac')
      ? `https://${network}.websdrbordeaux.fr/api/${endpoint}`
      : `/api/${endpoint}`;

    fetch(url)
      .then(response => response.text())
      .then(data => this.setState({ [logType]: data }))
      .catch(error => console.error(`Erreur ${logType}`, error));
  };

  fetchAllLogs = () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.fetchLogs('logs');
    this.fetchLogs('logs2');
    this.fetchLogs('logs3');
  };

  loadConfig = () => {
    fetch('/api/configuration', { cache: 'no-store' })
      .then(response => response.json())
      .then(data => {
        this.setState({ res2Name: data.res2 || 'Réseau 2', res3Name: data.res3 || 'Réseau 3', res4Name: data.res4 || 'Réseau 4', isRadioAmateur: data.isRadioAmateur, res2Enabled: data.res2Enabled, res3Enabled: data.res3Enabled, res4Enabled: data.res4Enabled });
      })
      .catch(err => console.error('Configuration :', err));
  };

  loadNodeInfoNetwork = (network) => {
    const request = (this.nodeInfoRequest || 0) + 1;
    this.nodeInfoRequest = request;

    loadNodeInfo(network)
      .then(data => { if (request === this.nodeInfoRequest) this.setState(data); })
      .catch(err => console.error('nodeInfo :', err));
  };

  _computeCounts = () => {
    const nds = this.state.nodes ? [...this.state.nodes] : [];
    const buttonCount = Math.max(nds.filter(name => !sys.includes(name)).length - 2, 0);
    const mumbleCount = this.state.network === 'pmr'
      ? this.state.mumbleUsers.filter(u => u.name !== "Réseau" && u.name !== "SuperUser" && u.channel === 4).length
      : 0;
    return { buttonCount, mumbleCount };
  };

  animateValue = (stateKey, rafKey, target, duration = 2468) => {
    const start = this.state[stateKey] || 0;
    if (start === target) return;
    if (this[rafKey]) cancelAnimationFrame(this[rafKey]);

    const startTime = performance.now();
    const diff = target - start;

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const value = Math.round(start + diff * t);
      this.setState({ [stateKey]: value });
      if (t < 1) {
        this[rafKey] = requestAnimationFrame(tick);
      } else {
        this.setState({ [stateKey]: target });
        this[rafKey] = null;
      }
    };

    this[rafKey] = requestAnimationFrame(tick);
  };

  triggerNodePing = () => {
    this.setState({ nodePing: Date.now() });
    clearTimeout(this.nodePingTimer);
    this.nodePingTimer = setTimeout(() => this.setState({ nodePing: 0 }), 1424);
  };

  handleDragStart = (element, e) => {
    e.preventDefault();
    document.body.classList.add('noSelect');
    const config = this.dragKeys[element];
    this.setState({
      activeDrag: element,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
      dragStartItemX: this.state[config.x],
      dragStartItemY: this.state[config.y]
    });
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
  };

  handleDragMove = (e) => {
    if (!this.state.activeDrag) return;

    const { activeDrag, dragStartX, dragStartY, dragStartItemX, dragStartItemY } = this.state;
    const config = this.dragKeys[activeDrag];

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const deltaXvw = ((e.clientX - dragStartX) / windowWidth) * 100;
    const deltaYvh = ((e.clientY - dragStartY) / windowHeight) * 100;

    let newX = dragStartItemX + (config.invertX ? -deltaXvw : deltaXvw);
    let newY = dragStartItemY + deltaYvh;

    if (activeDrag === 'nbNodes') {
      const isNearTopEdge = e.clientY < windowHeight * 0.06;
      const isNearLeftEdge = e.clientX < windowWidth * 0.06;
      this.setState({ isNearTopEdge, isNearLeftEdge });
      if (isNearTopEdge) newY = 0;
      if (isNearLeftEdge) newX = 0;
    }

    this.setState({ [config.x]: newX, [config.y]: newY });
  };

  handleDragEnd = () => {
    if (!this.state.activeDrag) return;

    document.body.classList.remove('noSelect');
    const config = this.dragKeys[this.state.activeDrag];

    savePref(config.x, this.state[config.x]);
    savePref(config.y, this.state[config.y]);

    this.setState({ activeDrag: null, isNearTopEdge: false, isNearLeftEdge: false });

    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
  };

  _stopNative = (e) => e.stopPropagation();

  setMumbleHandle = (el) => {
    if (this._mumbleHandle) this._mumbleHandle.removeEventListener('pointerdown', this._stopNative);
    this._mumbleHandle = el;
    if (el) el.addEventListener('pointerdown', this._stopNative);
  };

  handleMumbleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = this.mumbleListRef.current;
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    this._mumbleResize = { x: e.clientX, y: e.clientY, w: this.state.mumbleW || 168, h: this.state.mumbleH != null ? this.state.mumbleH : (list ? list.offsetHeight : 120), z };
    document.body.classList.add('noSelect');
    document.body.style.cursor = 'nwse-resize';
    document.addEventListener('mousemove', this.handleMumbleResizeMove);
    document.addEventListener('mouseup', this.handleMumbleResizeEnd);
  };

  handleMumbleResizeMove = (e) => {
    const r = this._mumbleResize;
    if (!r) return;
    const maxW = Math.max(160, window.innerWidth / r.z - 20);
    const maxH = Math.max(60, window.innerHeight / r.z - 60);
    const mumbleW = Math.round(Math.min(Math.max(r.w + (e.clientX - r.x) / r.z, 140), maxW));
    const mumbleH = Math.round(Math.min(Math.max(r.h + (e.clientY - r.y) / r.z, 24), maxH));
    this.setState({ mumbleW, mumbleH });
  };

  handleMumbleResizeEnd = () => {
    if (!this._mumbleResize) return;
    this._mumbleResize = null;
    document.body.classList.remove('noSelect');
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', this.handleMumbleResizeMove);
    document.removeEventListener('mouseup', this.handleMumbleResizeEnd);
    if (this.state.mumbleH != null) {
      savePref('mumbleW', this.state.mumbleW);
      savePref('mumbleH', this.state.mumbleH);
    }
  };

  resetMumbleSize = (e) => {
    e.stopPropagation();
    clearPref('mumbleW');
    clearPref('mumbleH');
    this.setState({ mumbleW: 168, mumbleH: null });
  };

  connectEventSource = (initialProps = this.props) => {
    if (this.es) this.es.close();

    const es = new EventSource('/stream');
    this.es = es;

    const fsm = new Fsm(
      es,
      () => {
        const network = this.state.network || fsm.network || 'default';
        this.setState({ ...fsm, network });
      },
      initialProps
    );

    es.addEventListener('ReflectorLogic.MsgNodeJoined', (event) => {
      const [name] = JSON.parse(event.data);
      if (sys.includes(name)) return;
      const qrzName = this.state.trans && this.state.trans.get(name);
      this.showNotification(qrzName || name);
      this.triggerNodePing();
    });

    es.addEventListener('ReflectorLogic.MsgNodeLeft', (event) => {
      const [name] = JSON.parse(event.data);
      if (sys.includes(name)) return;
      const qrzName = this.state.trans && this.state.trans.get(name);
      this.showNodeLeftNotification(qrzName || name);
    });

    es.onopen = () => {
      if (this.state.streamStatus !== 'connected') this.setState({ streamStatus: 'connected' });
    };

    es.onerror = () => {
      if (es !== this.es) return;
      if (es.readyState === 2) {
        if (this.state.streamStatus !== 'closed') this.setState({ streamStatus: 'closed' });
        clearTimeout(this.esReconnectTimer);
        this.esReconnectTimer = setTimeout(this.reconnectEventSource, 5000);
      } else if (this.state.streamStatus !== 'reconnecting') {
        this.setState({ streamStatus: 'reconnecting' });
      }
    };
  };

  reconnectEventSource = () => {
    if (this._unmounted) return;
    clearTimeout(this.esReconnectTimer);
    fetch('/api/svxlink')
      .then(res => res.json())
      .catch(() => null)
      .then(data => {
        if (this._unmounted) return;
        this.connectEventSource(data || this.props);
      });
  };

  componentDidUpdate(prevProps, prevState) {
    const watched = ['nodesBgColor', 'nodesColor', 'relayColor', 'relayBgColor', 'transColor', 'transBgColor', 'logsColor', 'logsBgColor', 'hmColor', 'font', 'network', 'nodeButtonWidth'];
    if (watched.some(k => prevState[k] !== this.state[k])) this.applyThemeVars();

    const { buttonCount, mumbleCount } = this._computeCounts();

    if (buttonCount !== this.state.displayCount && this._countRaf == null) {
      this.animateValue('displayCount', '_countRaf', buttonCount);
    }
    if (mumbleCount !== this.state.displayMumble && this._mumbleRaf == null) {
      this.animateValue('displayMumble', '_mumbleRaf', mumbleCount);
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    if (this._countRaf) cancelAnimationFrame(this._countRaf);
    if (this._mumbleRaf) cancelAnimationFrame(this._mumbleRaf);
    clearInterval(this.logsInterval);
    clearInterval(this.mumbleTimer);

    clearTimeout(this.notifGroupTimer);
    clearTimeout(this.notifDelayTimer);
    clearTimeout(this.notifTimer);
    clearTimeout(this.notifFadeTimer);
    clearTimeout(this.nodeLeftGroupTimer);
    clearTimeout(this.nodeLeftDelayTimer);
    clearTimeout(this.nodeLeftNotifTimer);
    clearTimeout(this.nodeLeftFadeTimer);
    clearTimeout(this.esReconnectTimer);
    clearTimeout(this.nodePingTimer);
    clearTimeout(this.resetAnimTimer);

    if (this.es) this.es.close();

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
    document.removeEventListener('mousemove', this.handleMumbleResizeMove);
    document.removeEventListener('mouseup', this.handleMumbleResizeEnd);
  }

  componentDidMount() {
    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIPadOS = /Macintosh/i.test(userAgent) && typeof navigator.maxTouchPoints !== 'undefined' && navigator.maxTouchPoints > 0 && !/iPhone|Android/i.test(userAgent);
    if (isMobile || isIPadOS || /iPad/i.test(userAgent)) {
      window.location.href = '/mobile';
      return;
    }

    this.connectionSound = new Audio('../static/notifIn.wav');
    this.disconnectionSound = new Audio('../static/notifOut.wav');

    this.setState(restorePrefs(), () => {
      document.body.style.fontFamily = this.state.font;
      this.applyThemeVars();
      this.applyFilters();
      if (this.state.pageZoom && this.state.pageZoom !== 100) {
        document.documentElement.style.zoom = this.state.pageZoom + '%';
      }
      this.fetchMumble();
    });

    this.changeBackground(loadPref('customImage') || loadPref('image') || defaultState.image);

    this.loadConfig();
    this.loadNodeInfoNetwork(this.state.network || 'default');

    this.fetchAllLogs();
    this.logsInterval = setInterval(this.fetchAllLogs, 2822);
    this.mumbleTimer = setInterval(this.fetchMumble, 1824);

    if (window.speechSynthesis) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }

    this.connectEventSource();

    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    const { buttonCount, mumbleCount } = this._computeCounts();
    if (buttonCount > 0) this.animateValue('displayCount', '_countRaf', buttonCount, 2668);
    if (mumbleCount > 0) this.animateValue('displayMumble', '_mumbleRaf', mumbleCount, 2222);
  }

  toggleVisibility = (stateKey, prefKey = stateKey) => {
    const newVisibility = !this.state[stateKey];
    this.setState({ [stateKey]: newVisibility });
    savePref(prefKey, newVisibility);
  };

  toggleElement = (key) => {
    if (key === 'setting') {
      this.setState({ log3: false }, () => savePref('log3', false));
    } else if (key === 'log3') {
      this.setState({ setting: false }, () => savePref('setting', false));
    } else if (key === 'logo' && !this.state.logo) {
      this.setState({ globe: false, mapMode: 'off' }, () => {
        savePref('globe', false);
        savePref('mapMode', 'off');
      });
    }

    this.toggleVisibility(key);

    if (key === 'mumble' && !this.state.mumble) {
      setTimeout(() => this.fetchMumble(), 8);
    }
  };

  handleSettingToggle = (key) => {
    if (key === 'notificationsEnabled') {
      this.setState(p => {
        const v = !p.notificationsEnabled;
        savePref('notificationsEnabled', v);
        return { notificationsEnabled: v };
      });
      return;
    }
    this.toggleElement(key);
  };

  toggleFavori = (name) => {
    this.setState(prev => {
      const set = new Set(prev.favoris);
      set.has(name) ? set.delete(name) : set.add(name);
      const favoris = [...set];
      savePref('favoris', JSON.stringify(favoris));
      return { favoris };
    });
  };

  handleCustomImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.changeBackground(e.target.result);
    reader.readAsDataURL(file);
  };

  changeBackground = (imageID) => {
    document.body.style.backgroundImage = 'url(' + imageID + ')';

    if (imageID === '../static/weblink4.jpg') {
      document.body.style.backgroundSize = '100%';
      document.body.style.backgroundPositionY = '26%';
    } else {
      document.body.style.backgroundSize = '100% 100%';
      document.body.style.backgroundPositionY = 'initial';
    }

    if (imageID.startsWith('data:image')) {
      savePref('customImage', imageID);
      clearPref('image');
    } else {
      savePref('image', imageID);
      clearPref('customImage');
    }

    this.setState({ image: imageID });
  };

  handleColorPick = (key, hex, isRgba, raw) => {
    let finalVal = hex;
    if (isRgba) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const m = (raw || '').match(/[\d.]+/g);
      const alpha = m && m[3] !== undefined ? m[3] : '0.74';
      finalVal = `rgba(${r},${g},${b},${alpha})`;
    }
    this.setState({ [key]: finalVal, activeTheme: null, activePreset: null });
    savePref(key, finalVal);
    clearPref('activeTheme');
  };

  handleBgOpacityChangeVal = (key, alpha) => {
    const raw = normalizeColor(key, this.state[key] || 'rgba(128,128,128,0.7)');
    const m = raw.match(/[\d.]+/g);
    if (!m || m.length < 3) return;
    const [r, g, b] = m;
    const newVal = `rgba(${r},${g},${b},${alpha})`;
    this.setState({ [key]: newVal, activeTheme: null, activePreset: null });
    savePref(key, newVal);
    clearPref('activeTheme');
  };

  handleFontChangeVal = (font) => {
    this.setState({ font }, () => {
      document.body.style.fontFamily = font;
      savePref('font', font);
    });
  };

  handleMapModeChangeVal = (value) => {
    const [mode, tiles] = String(value).split(':');
    const active = mode !== 'off';
    const next = { mapMode: mode, globe: active };
    if (tiles) next.mapTiles = tiles;
    if (active && this.state.logo) next.logo = false;

    this.setState(next, () => {
      savePref('mapMode', mode);
      savePref('globe', active);
      if (tiles) savePref('mapTiles', tiles);
      if (next.logo === false) savePref('logo', false);
    });
  };

  handleChronoViewChangeVal = (mode) => {
    savePref('chronoView', mode);
    this.setState({ chronoView: mode });
  };

  commitContrast = (v) => { this.setState({ contrast: v }, this.applyFilters); savePref('contrast', v); };
  commitBrightness = (v) => { this.setState({ brightness: v }, this.applyFilters); savePref('brightness', v); };
  commitNodeWidth = (v) => { this.setState({ nodeButtonWidth: v }); savePref('nodeButtonWidth', v); };
  commitZoom = (v) => {
    this.setState({ pageZoom: v });
    document.documentElement.style.zoom = v + '%';
    savePref('pageZoom', v);
  };

  getCustomThemes = () => {
    try {
      const raw = localStorage.getItem('customThemes');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };

  applyTheme = (themeName) => {
    const theme = { ...THEMES, ...this.getCustomThemes() }[themeName];
    if (!theme) return;
    this.setState({ ...theme, activeTheme: themeName, previewTheme: null }, () => {
      Object.entries(theme).forEach(([key, val]) => savePref(key, val));
      savePref('activeTheme', themeName);
    });
  };

  previewThemeOn = (themeName) => {
    const theme = { ...THEMES, ...this.getCustomThemes() }[themeName];
    if (!theme) return;
    if (!this.state.previewTheme) {
      this._previewSnapshot = {};
      COLOR_KEYS.forEach(k => { this._previewSnapshot[k] = this.state[k]; });
    }
    this.setState({ ...theme, previewTheme: themeName });
  };

  previewThemeOff = () => {
    if (!this.state.previewTheme) return;
    this.setState({ ...this._previewSnapshot, previewTheme: null });
  };

  saveCustomTheme = () => {
    const name = (this.state.saveThemeName || '').trim();
    if (!name) return;
    const theme = {};
    COLOR_KEYS.forEach(k => { theme[k] = this.state[k]; });
    const customs = this.getCustomThemes();
    customs[name] = theme;
    try { localStorage.setItem('customThemes', JSON.stringify(customs)); } catch (e) { console.warn('Sauvegarde échouée :', e); }
    this.setState({ saveThemeName: '', showSaveTheme: false, activeTheme: name }, () => savePref('activeTheme', name));
  };

  deleteCustomTheme = (name) => {
    const customs = this.getCustomThemes();
    delete customs[name];
    try { localStorage.setItem('customThemes', JSON.stringify(customs)); } catch (e) {}
    if (this.state.activeTheme === name) {
      this.setState({ activeTheme: null });
      clearPref('activeTheme');
    }
    this.forceUpdate();
  };

  getPresets = () => {
    try {
      const raw = localStorage.getItem('dashboardPresets');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };

  savePreset = () => {
    const name = (this.state.presetName || '').trim();
    if (!name) return;
    const presets = this.getPresets();
    presets[name] = this.collectConfig();
    try {
      localStorage.setItem('dashboardPresets', JSON.stringify(presets));
    } catch (e) {
      console.warn('Sauvegarde échouée :', e);
      alert("❌ Impossible d'enregistrer ( plein ? trop lourde ? )");
      return;
    }
    this.setState({ presetName: '', showSavePreset: false, activePreset: name });
  };

  applyPreset = (name) => {
    if (!name) { this.setState({ activePreset: '' }); return; }
    const config = this.getPresets()[name];
    if (!config) return;
    this.applyConfig(config);
    this.setState({ activePreset: name });
  };

  deletePreset = (name) => {
    if (!name) return;
    const presets = this.getPresets();
    delete presets[name];
    try { localStorage.setItem('dashboardPresets', JSON.stringify(presets)); } catch (e) {}
    if (this.state.activePreset === name) this.setState({ activePreset: '' });
    this.forceUpdate();
  };

  collectConfig = () => {
    const config = { _version: 1, _date: new Date().toISOString(), _source: 'weblink' };
    Object.entries(CONFIG_KEYS).forEach(([section, keys]) => {
      config[section] = {};
      keys.forEach(key => { config[section][key] = this.state[key]; });
    });
    config.customThemes = this.getCustomThemes();
    const customImage = loadPref('customImage');
    if (customImage) config.customImage = customImage;
    return config;
  };

  applyConfig = (config) => {
    if (!config || !config._version) return;
    const next = {};

    Object.entries(CONFIG_KEYS).forEach(([section, keys]) => {
      const src = config[section];
      if (!src || typeof src !== 'object') return;
      keys.forEach(key => {
        let val = src[key];
        if (val === undefined || val === null) return;
        if (key === 'favoris') {
          next.favoris = Array.isArray(val) ? val : [];
          savePref('favoris', JSON.stringify(next.favoris));
          return;
        }
        if (FLOAT_KEYS.includes(key)) {
          val = parseFloat(val);
          if (isNaN(val)) return;
        }
        if (COLOR_KEYS.includes(key)) val = normalizeColor(key, val);
        next[key] = val;
        savePref(key, val);
      });
    });

    if (config.customThemes && typeof config.customThemes === 'object') {
      try { localStorage.setItem('customThemes', JSON.stringify({ ...this.getCustomThemes(), ...config.customThemes })); }
      catch (e) { console.warn('Import thèmes custom échoué :', e); }
    }
    if (config.presets && typeof config.presets === 'object') {
      try { localStorage.setItem('dashboardPresets', JSON.stringify({ ...this.getPresets(), ...config.presets })); }
      catch (e) { console.warn('Import dispositions échoué :', e); }
    }

    if (next.mapMode === undefined && next.globe !== undefined) {
      next.mapMode = next.globe ? 'globe' : 'off';
      savePref('mapMode', next.mapMode);
    }
    if (next.mapMode !== undefined) {
      next.globe = next.mapMode !== 'off';
      savePref('globe', next.globe);
      if (next.globe && next.logo === undefined && this.state.logo) {
        next.logo = false;
        savePref('logo', false);
      }
    }

    this.setState(next, () => {
      this.applyFilters();
      document.body.style.fontFamily = this.state.font;
      document.documentElement.style.zoom = (this.state.pageZoom || 100) + '%';
      this.changeBackground(config.customImage || this.state.image || defaultState.image);
    });
  };

  exportConfig = () => {
    const config = this.collectConfig();
    const presets = this.getPresets();
    if (presets && Object.keys(presets).length) config.presets = presets;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebLink-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  importConfig = (event) => {
    const inputEl = event.target;
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        if (!config._version) throw new Error('Fichier invalide');
        this.applyConfig(config);
      } catch (err) {
        console.error('Import config échoué :', err);
        alert('❌ Fichier invalide');
      }
      try { inputEl.value = ''; } catch (_) {}
    };
    reader.readAsText(file);
  };

  handleResetRequest = () => this.setState({ showResetConfirm: true });

  handleResetCancel = () => this.setState({ showResetConfirm: false });

  handleResetConfirm = () => {
    this.setState({ showResetConfirm: false });
    this.handleReset();
  };

  handleReset = () => {
    PREF_KEYS.forEach(clearPref);

    this.setState({ ...defaultState, activePreset: '', previewTheme: null, isReset: true }, () => {
      this.changeBackground(defaultState.image);
      this.applyFilters();
      document.body.style.fontFamily = defaultState.font;
      document.documentElement.style.zoom = '100%';
    });

    clearTimeout(this.resetAnimTimer);
    this.resetAnimTimer = setTimeout(() => this.setState({ isReset: false }), 288);
  };

  showModal = (content) => {
    const modal = document.getElementById('modal');

    modal.innerHTML = `
      <style> .fermer2 { position: absolute; top: 4px; right: 6px; font-size: 14px; cursor: pointer; border-radius: 8px; color: #d9534f; width: 18px; height: 20px; transition: background-color 0.2s; } .fermer2:hover { background-color: white; } </style>
      <div class="fermer2" onClick="this.parentNode.style.display='none'">X</div>
      ${content}
    `;

    modal.style.display = 'block';

    document.addEventListener('click', this.handleOutsideClick);
  };

  handleOutsideClick = (event) => {
    const modal = document.getElementById('modal');
    const buttons = document.querySelectorAll('button');
    const clickedInsideButton = Array.from(buttons).some(button => button.contains(event.target));
    if (modal && !modal.contains(event.target) && !clickedInsideButton && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.removeEventListener('click', this.handleOutsideClick);
    }
  };

  handleClickNode = (nodeName) => {
    if (nodeName === 'PMR446MHZ') {
      this.showModal('<div id="pongContainer"></div>');
      ReactDOM.render(<Pong />, document.getElementById('pongContainer'));
    } else {
      this.showModal(this.state.nodeInfo[nodeName] || '...');
    }
  };

  handleFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) element.requestFullscreen();
    else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    else if (element.msRequestFullscreen) element.msRequestFullscreen();
  };

  handleNetwork = (evt) => {
    const previousNetwork = this.state.network;
    const network = evt.target.value;

    this.loadNodeInfoNetwork(network);

    const headers = new Headers();
    headers.append('Content-Type', 'text/plain; charset=utf-8');
    fetch('/api/network', { method: 'POST', headers, body: network })
      .then(() => Notif.info('Redémarrage WebLink ..'))
      .catch(() => {
        this.setState({ network: previousNetwork });
        this.loadNodeInfoNetwork(previousNetwork);
      });

    this.setState({ network, nodes: [], mumbleUsers: network === 'pmr' ? this.state.mumbleUsers : [] }, () => {
      if (network === 'pmr') this.fetchMumble();
    });
  };

  handleTri = (evt) => {
    this.setState({ tri: evt.target.value });
  };

  static getInitialProps() {
    return fetch('/api/svxlink').then((res) => res.json());
  }

  renderTab = (tabNumber, id, label) => {
    const active = this.state[`tab${tabNumber}`] === id;
    return (
      <motion.button key={id} whileHover={{ scale: 1.02, color: '#d9534f', backgroundColor: '#ffffff' }} whileTap={{ scale: 0.98 }} animate={{ backgroundColor: active ? this.state.logsColor : this.state.logsBgColor, color: active ? this.state.logsBgColor : this.state.logsColor }} className={active ? 'active' : ''} onClick={() => this.toggleTab(id, tabNumber)} style={{ width: '76px', border: 'none', cursor: 'pointer', padding: '4px', margin: '4px 5px', borderRadius: '8.8px', fontFamily: this.state.font }}>{label}</motion.button>
    );
  };

  renderTabAction = (key, label, onClick, width = '34px') => (
    <motion.button key={key} whileHover={{ scale: 1.04, color: '#d9534f', backgroundColor: '#ffffff' }} whileTap={{ scale: 0.98 }} onClick={onClick} style={{ width, backgroundColor: this.state.logsBgColor, border: 'none', cursor: 'pointer', color: this.state.logsColor, padding: '4px', margin: '4px 5px', borderRadius: '8.8px', fontFamily: this.state.font }}> {label} </motion.button>
  );

  renderLogBody = (ids, tabNumber, className) => {
    const index = ids.indexOf(this.state[`tab${tabNumber}`]);
    if (index === -1) return null;
    return (
      <div className={className}>
        {index === 0
          ? <pre dangerouslySetInnerHTML={{ __html: this.state.logs || '' }} />
          : <pre>{index === 1 ? this.state.logs2 : this.state.logs3}</pre>}
      </div>
    );
  };

  render() {
    const { nodes, tri, transmitter, trans, relais } = this.state;

    let nds = nodes ? [...nodes] : [];

    if (nds.length > 0) {
      if (tri === '1') {
        nds.sort((a, b) => {
          if (a === 'PMR446MHZ') return 1;
          if (b === 'PMR446MHZ') return -1;

          if (a === 'MUMBLE') return 1;
          if (b === 'MUMBLE') return -1;

          if (a === 'DEMO' || a === 'DEMO2') {
            if (b === 'DEMO' || b === 'DEMO2') return a.localeCompare(b);
            return 1;
          }
          if (b === 'DEMO' || b === 'DEMO2') return -1;

          const getDept = (str) => {
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
          };

          const getPseudo = (str) => {
            const match = str.match(/\d+\)?[-\s]?(.*)/);
            return match ? match[1].trim().toLowerCase() : "";
          };

          const deptA = getDept(a);
          const deptB = getDept(b);
          if (deptA !== deptB) return deptA - deptB;

          return getPseudo(a).localeCompare(getPseudo(b));
        });
      } else if (tri === '2') {
        nds.sort((a, b) => {
          if (a === 'PMR446MHZ') return 1;
          if (b === 'PMR446MHZ') return -1;

          let at = a.split(' ');
          if (at.length === 1) at[1] = 'a' + at[0];
          let bt = b.split(' ');
          if (bt.length === 1) bt[1] = 'a' + bt[0];

          if (at[1] < bt[1]) return -1;
          if (at[1] > bt[1]) return 1;
          return 0;
        });
      }
    }

    if (nds.length > 0 && this.state.favoris.length) {
      const fav = new Set(this.state.favoris);
      nds.sort((a, b) => {
        if (a === 'PMR446MHZ') return 1;
        if (b === 'PMR446MHZ') return -1;
        const fa = fav.has(a), fb = fav.has(b);
        if (fa && !fb) return -1;
        if (!fa && fb) return 1;
        return 0;
      });
    }

    const isPmr = this.state.network === 'pmr';
    const mumbleCount = isPmr ? this.state.mumbleUsers.filter(u => u.name !== "Réseau" && u.name !== "SuperUser" && u.channel === 4).length : 0;
    const formattedTransmitter = (trans && trans.get(transmitter)) || transmitter;
    const mumbleTalker = isPmr ? this.state.mumbleUsers.find(u => u.name !== "Réseau" && u.name !== "SuperUser" && u.channel === 4 && (u.talking || u.idlesecs === 0)) : null;
    const mumbleTransmitter = mumbleTalker ? mumbleTalker.name : null;
    const roundedStyle = this.state.nbNodesY === 0 ? { borderRadius: '0 0 8px 8px' } : this.state.nbNodesX === 0 ? { borderRadius: '0 8px 8px 0' } : { borderRadius: '8px' };
    const tooltipStyle = { position: 'absolute', top: '108%', transform: 'translateX(-50%)', marginTop: '4px', backgroundColor: this.state.nodesBgColor, color: this.state.nodesColor, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap', zIndex: 10, fontFamily: this.state.font };

    const defaultNetworkOptions = [ { value: 'default', label: 'Perroquet' }, { value: 'pmr', label: 'Pmr 446 MHz' }, { value: 'bac', label: 'Bac à Sable' } ];
    const radioAmateurOptions = [ { value: 'ri49', label: 'Ri49' }, { value: 'gir', label: 'Girondin' }, { value: 'rrf', label: 'Rrf' }, { value: 'tec', label: 'Technique' }, { value: 'bav', label: 'Bavardage' } ];

    let filteredNetworkOptions = [...defaultNetworkOptions];
    if (this.state.res2Enabled) filteredNetworkOptions.push({ value: 'res2', label: this.state.res2Name });
    if (this.state.res3Enabled) filteredNetworkOptions.push({ value: 'res3', label: this.state.res3Name });
    if (this.state.res4Enabled) filteredNetworkOptions.push({ value: 'res4', label: this.state.res4Name });
    if (this.state.isRadioAmateur) filteredNetworkOptions = [...filteredNetworkOptions, ...radioAmateurOptions];

    const safeValue = filteredNetworkOptions.some(opt => opt.value === this.state.network) ? this.state.network : 'default';

    const streamCfg = this.state.streamStatus === 'connected'
      ? { led: 'var(--trans-bg)', txt: 'Flux Ok', color: 'var(--trans-bg)', bg: 'var(--node-bg)', blink: true }
      : this.state.streamStatus === 'closed'
        ? { led: '#d9534f', txt: 'Hors ligne', color: '#d9534f', bg: 'rgba(239,68,68,0.24)', blink: false }
        : { led: '#f59e0b', txt: 'Connexion ..', color: '#f59e0b', bg: 'rgba(245,158,11,0.24)', blink: true };

    return (

  <Layout nodesBgColor={this.state.nodesBgColor} nodesColor={this.state.nodesColor} version={this.props.version} font={this.state.font}>

  <div style={{ position: 'fixed', top: '6px', right: '12px', zIndex: 99999, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: this.state.font, padding: '2px 8px', borderRadius: '8px', background: streamCfg.bg, color: streamCfg.color, userSelect: 'none', pointerEvents: 'none', transition: 'all 0.4s' }}>
    <span className={streamCfg.blink ? 'streamLedBlink' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', background: streamCfg.led }} />
    {streamCfg.txt}
  </div>

  {this.state.snowfall && <Snowfall />} {this.state.fallLeaves && <FallLeaves />} {this.state.rain && <Rain />} {this.state.fireflies && <Fireflies />} {this.state.bubbles && <Bubbles />}

  <div>
    <SelectCustom options={filteredNetworkOptions} value={safeValue} onChange={this.handleNetwork} style={{ position: 'relative', width: '200px', marginLeft: '100px', top: '-2vw', fontFamily: this.state.font }} buttonBgColor={this.state.nodesBgColor} buttonColor={this.state.nodesColor} />

    <select name="tri" className="dNone" value={this.state.tri} onChange={this.handleTri}>
      <option value="0">Pas de Tri</option> <option value="1">Département</option> <option value="2">Prénom</option>
    </select>

    <motion.button onMouseDown={(e) => this.handleDragStart('transmitter', e)} whileHover={{ boxShadow: "0 0 42px rgba(255, 255, 255, 0.34)" }} whileTap={{ scale: 0.88, cursor: 'grabbing' }} style={{ position: 'absolute', left: `${this.state.transmitterX}vw`, top: `${this.state.transmitterY}vh`, zIndex: 8888, cursor: 'grab', color: this.state.nodesColor, backgroundColor: this.state.nodesBgColor, width: '238px', fontFamily: this.state.font }} className="transmitter brdr">
      <span> {transmitter !== ' ' && trans ? trans.get(this.state.lastid) : transmitter} </span>
      {this.state.lastStopTime && <span className="stopTime" style={{ color: this.state.hmColor }}>{this.state.lastStopTime}</span>}
    </motion.button>
  </div>

  <AnimatePresence>
    {this.state.isNearTopEdge && <motion.div key="edgeTop" initial={{ opacity: 0 }} animate={{ opacity: 0.88 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '0vh', boxShadow: '0 6px 8px 8px white', pointerEvents: 'none', zIndex: 8888 }} />}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.isNearLeftEdge && <motion.div key="edgeLeft" initial={{ opacity: 0 }} animate={{ opacity: 0.88 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', top: '0', left: '0', width: '0vw', height: '100%', boxShadow: '6px 0 8px 8px white', pointerEvents: 'none', zIndex: 8888 }} />}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.nbNodes && (
      <motion.p key="nbNodes" onMouseDown={(e) => this.handleDragStart('nbNodes', e)} whileHover={{ boxShadow: "0 0 42px rgba(255, 255, 255, 0.34)" }} whileTap={{ scale: 0.88, cursor: "grabbing" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} style={{ color: this.state.relayColor, ...roundedStyle, padding: '4px 4px 2px 4px', display: 'flex', gap: '4px', textAlign: 'center', width: 'fit-content', position: 'absolute', left: `${this.state.nbNodesX}vw`, top: `${this.state.nbNodesY}vh`, cursor: 'grab', backgroundColor: this.state.relayBgColor || 'transparent', userSelect: 'none', zIndex: '8888' }}>
        {this.state.nodePing > 0 && <span key={this.state.nodePing} className="nodePing" aria-hidden="true" />}
        {this.state.displayCount}
        {mumbleCount > 0 && <span style={{ color: 'var(--node-bg)', fontSize: '14.8px', fontWeight: 'bold', display: 'block', marginTop: '1px' }}>+ {this.state.displayMumble} </span>}
      </motion.p>
    )}
  </AnimatePresence>

  {isPmr && (
    <div style={{ position: 'absolute', top: '-4px', left: '24vw' }}>
      <button onClick={() => this.toggleElement('mumble')} onMouseEnter={() => this.setState({ isHoveredMumble: true })} onMouseLeave={() => this.setState({ isHoveredMumble: false })} style={{ width: '46.5px', borderRadius: '0 0 8px 8px' }} className="ripple2"> <img src='../static/mumble3.png' style={{ width: '20px', margin: '0' }} /> </button>
      {this.state.isHoveredMumble && <span style={{ ...tooltipStyle, left: '48%' }}>Liste Mumble</span>}
    </div>
  )}

  <AnimatePresence>
    {this.state.mumble && isPmr && (
      <motion.div key="mumble" className="mumbleBox" onMouseDown={(e) => this.handleDragStart('mumble', e)} whileHover={{ boxShadow: "0 0 42px rgba(255, 255, 255, 0.34)" }} whileTap={{ scale: 0.88, cursor: "grabbing" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: `${this.state.mumbleW || 168}px`, boxSizing: 'border-box', position: 'fixed', top: `${this.state.mumbleY}vh`, textAlign: 'center', left: `${this.state.mumbleX}vw`, backgroundColor: this.state.nodesBgColor, padding: '8px 6px 2px', borderRadius: '10px', fontSize: '14px', cursor: 'grab', zIndex: 8888, userSelect: 'none', boxShadow: '0 0 32px rgba(255,255,255,0.18)' }}>
        <div ref={this.mumbleListRef} className="mumbleList" style={{ height: this.state.mumbleH != null ? `${this.state.mumbleH}px` : 'auto', overflowY: this.state.mumbleH != null ? 'auto' : 'visible' }}>
        {(() => {
          const activeUsers = this.state.mumbleUsers.filter(user => user.name !== "Réseau" && user.name !== "SuperUser" && user.channel === 4);

          if (activeUsers.length === 0) return <p style={{ color: 'lightgray', height: '12.8px', width: '100%' }}>Personne</p>;

          return activeUsers.map((user, index) => {
            const isDeaf = user.deafened || user.selfDeaf || user.deaf;
            const isMuted = isDeaf || user.muted || user.selfMute || user.mute || user.suppress;
            const isTalking = !isMuted && (user.talking || user.idlesecs === 0);
            const dotColor = isDeaf ? '#ef4444' : isMuted ? '#f59e0b' : '#4ade80';
            const statusLabel = isDeaf ? 'Casque coupé (indisponible)' : isMuted ? 'Micro coupé' : 'Disponible';

            return (
              <div key={index} title={`${user.name} — ${statusLabel}`} style={{ margin: '0 0 6px', backgroundColor: isTalking ? 'var(--trans-bg)' : this.state.relayBgColor, borderRadius: '8px', height: '20px', width: 'fit-content', padding: '0px 6px 2px', opacity: isDeaf ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                <span style={{ color: dotColor, marginRight: '4px' }}>●</span>
                <span style={{ color: isTalking ? 'var(--trans-color)' : this.state.relayColor }}>{user.name}</span>
                {isTalking && <span style={{ fontSize: '12.6px', margin: '0 2px' }}> 🎤 </span>}
                {!isTalking && isMuted && (
                  <span style={{ display: 'inline-flex', gap: '2px', margin: '0 0 2px 6px', verticalAlign: 'middle', color: dotColor }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="2" y1="2" x2="22" y2="22" />
                      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                      <path d="M5 10v2a7 7 0 0 0 12 5" />
                      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                    {isDeaf && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="22" y1="9" x2="16" y2="15" />
                        <line x1="16" y1="9" x2="22" y2="15" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            );
          });
        })()}
        </div>
        <div ref={this.setMumbleHandle} className="mumbleResize" onMouseDown={this.handleMumbleResizeStart} onDoubleClick={this.resetMumbleSize} title="Redimensionner ( double-clic : taille auto )">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M9 1L1 9" /><path d="M9 5L5 9" /></svg>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  <ol>
    <AnimatePresence mode='popLayout'>
      {nds.map((name, index, array) => (!sys.includes(name) && (
        <motion.div key={name} layout initial={{ opacity: 0, scale: 0.6, y: -488 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.6 } }} transition={{ type: "spring", stiffness: 426, damping: 48, delay: (array.length - index - 1) * 0.04 }} style={{ display: 'inline-block' }} className="tooltipContainer">
          <button id="bouton" style={{ fontFamily: this.state.font, color: transmitter !== name && this.state.favoris.includes(name) ? 'var(--trans-bg)' : (name.includes("TEST") || name.includes("DEMO") ? '#4ade80' : (relais.includes(name) && transmitter !== name ? this.state.relayColor : undefined)), backgroundColor: transmitter !== name && this.state.favoris.includes(name) ? 'var(--node-bg)' : (relais.includes(name) && transmitter !== name ? this.state.relayBgColor : undefined) }} className={`${transmitter === name ? 'brdr transmitting pulse' : 'brdr'} ripple`} onClick={() => this.handleClickNode(name)} title="">
            <span className={this.state.favoris.includes(name) ? 'favStar favStarOn' : 'favStar'} onClick={(e) => { e.stopPropagation(); this.toggleFavori(name); }} title={this.state.favoris.includes(name) ? 'Retirer' : 'Épingler'}>{this.state.favoris.includes(name) ? '★' : '☆'}</span>
            <span className="nodeLabel">{trans && trans.get(name)}</span>
          </button>
          <span className="tooltip">Cliquez pour + d&apos;infos</span>
        </motion.div>
      )))}

      <motion.div key="bouton2" layout initial={{ opacity: 0, scale: 0.6, y: -488 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bouton2 noHoverParent">
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <button onClick={() => this.toggleElement('setting')} style={{ fontFamily: this.state.font, width: '97px', paddingLeft: '0' }} className="ripple">⚙️ Régl.</button>
          <button onClick={() => this.toggleElement('log1')} style={{ fontFamily: this.state.font, width: '97px', padding: '0', marginRight: '0' }} className="ripple">🕓 Hist.</button>
          <button onClick={this.initSound} onMouseEnter={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })} style={{ width: '46.5px', margin: '0 0 0 10px', padding: '2px 0 4px 3px' }} className="ripple2"> {this.state.soundEnabled ? '🔊' : '🔇'} </button>
          {this.state.isHovered && <span style={{ ...tooltipStyle, left: '91%' }}> {this.state.soundEnabled ? 'Notifs Sonore On' : 'Notifs Sonore Off'} </span>}
        </div>
      </motion.div>
    </AnimatePresence>
  </ol>

  <AnimatePresence>
    {this.state.setting && (
      <SettingsPanel
        {...this.state}
        variant="distri"
        isPmr={isPmr}
        nodeButtonWidth={this.getNodeWidth()}
        themes={THEMES}
        customThemes={this.getCustomThemes()}

        onClose={() => this.toggleElement('setting')}
        onApplyTheme={this.applyTheme}
        onPreviewOn={this.previewThemeOn}
        onPreviewOff={this.previewThemeOff}
        onDeleteCustomTheme={this.deleteCustomTheme}

        onColorPick={this.handleColorPick}
        onAlphaChange={this.handleBgOpacityChangeVal}

        onShowSaveTheme={() => this.setState({ showSaveTheme: true })}
        onSaveThemeNameChange={(v) => this.setState({ saveThemeName: v })}
        onSaveCustomTheme={this.saveCustomTheme}
        onCancelSaveTheme={() => this.setState({ showSaveTheme: false, saveThemeName: '' })}

        onFontChange={this.handleFontChangeVal}
        onToggleImageGrid={() => this.setState(p => ({ imageGrid: !p.imageGrid }))}
        onChangeBackground={(path) => { this.changeBackground(path); this.setState({ imageGrid: false }); }}
        onCustomImageClick={() => document.getElementById('customBackgroundInput').click()}

        onToggle={this.handleSettingToggle}
        onChronoViewChange={this.handleChronoViewChangeVal}
        onMapModeChange={this.handleMapModeChangeVal}
        onResetRequest={this.handleResetRequest}
        onFullScreen={this.handleFullScreen}

        onContrastLive={(v) => this.setFilter(v, this.state.brightness)}
        onContrastCommit={this.commitContrast}
        onBrightnessLive={(v) => this.setFilter(this.state.contrast, v)}
        onBrightnessCommit={this.commitBrightness}
        onNodeWidthLive={(v) => document.documentElement.style.setProperty('--node-btn-width', v + 'px')}
        onNodeWidthCommit={this.commitNodeWidth}
        onZoomLive={(v) => { document.documentElement.style.zoom = v + '%'; }}
        onZoomCommit={this.commitZoom}

        onExport={this.exportConfig}
        onImport={this.importConfig}

        categories={[]}
        onAddCategorie={() => null}
        onDeleteCategorie={() => {}}

        presets={this.getPresets()}
        activePreset={this.state.activePreset}
        presetName={this.state.presetName}
        showSavePreset={this.state.showSavePreset}
        onApplyPreset={this.applyPreset}
        onDeletePreset={this.deletePreset}
        onShowSavePreset={() => this.setState({ showSavePreset: true })}
        onPresetNameChange={(v) => this.setState({ presetName: v })}
        onSavePreset={this.savePreset}
        onCancelSavePreset={() => this.setState({ showSavePreset: false, presetName: '' })}
      />
    )}
  </AnimatePresence>

  <input type="file" id="customBackgroundInput" accept="image/*" style={{ display: 'none' }} onChange={this.handleCustomImageUpload} />

  <div id="modal"></div>

  {this.state.showResetConfirm && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 8888, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ backgroundColor: this.state.nodesBgColor, color: this.state.nodesColor, borderRadius: '22px', padding: '22px 26px', boxShadow: '0 0 60px rgba(255,255,255,0.18)', textAlign: 'center', fontFamily: this.state.font, maxWidth: '322px', width: '90%' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚠️</div>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '14.22px' }}>Réinitialiser les préférences ?</p>
        <p style={{ margin: '0 0 22px', fontSize: '12.88px', opacity: 0.72, lineHeight: 1.6 }}>Les couleurs, positions et réglages seront remis à zéro</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={this.handleResetCancel} style={{ width: '104px', padding: '0', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.12)', color: this.state.nodesColor, border: '1px solid rgba(255,255,255,0.24)', cursor: 'pointer', fontFamily: this.state.font, fontSize: '14px' }}> Annuler </button>
          <button onClick={this.handleResetConfirm} style={{ width: '104px', padding: '0', borderRadius: '10px', backgroundColor: 'rgba(217, 83, 79, 0.82)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: this.state.font, fontSize: '14px', fontWeight: 'bold' }}> Réinitialiser </button>
        </div>
      </div>
    </div>
  )}

  {this.state.showNotification && <div className={`notification ${this.state.notificationFadeOut ? 'fadeOut' : ''}`} style={{ border: '0.6px solid rgba(74, 222, 128,0.8)' }}> {this.state.notificationMessage} </div>}

  {this.state.showNodeLeftNotification && <div className={`notification ${this.state.nodeLeftNotificationFadeOut ? 'fadeOut' : ''}`} style={{ border: '0.6px solid rgba(217, 83, 79,0.8)' }}> {this.state.nodeLeftNotificationMessage} </div>}

  <div onMouseDown={(e) => this.handleDragStart('chrono', e)} style={{ color: 'white', fontSize: '11.4pt', top: `${this.state.chronoYvh}vh`, right: `${this.state.chronoXvw}vw`, position: 'absolute', marginTop: '42px', textAlign: 'center', width: '204px', cursor: 'grab', zIndex: 1000 }}>
    <div> <span style={{ color: this.state.nodesColor, backgroundColor: formattedTransmitter ? this.state.nodesBgColor : 'transparent', padding: '4px 8px', borderRadius: '8px' }}> {formattedTransmitter} </span> </div>
    <Chrono transmitter={transmitter} viewMode={this.state.chronoView} />
  </div>

  <AnimatePresence>
    {this.state.log1 && (
      <motion.div key="logs1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '480px', float: 'left', cursor: 'default', position: 'absolute', left: `${this.state.logsX}vw`, top: `max(${this.state.logsY}vh, 498px)`, letterSpacing: '1.4px', zIndex: 1000, borderRadius: '16px' }}>
        <div className="tab" style={{ marginLeft: '64px' }}>
          {this.renderTab(1, 'logs', 'Hist.')}
          {this.renderTab(1, 'other', 'Détails')}
          {this.renderTab(1, 'other2', 'Ent Sor')}
          {this.renderTabAction('plus', '+', () => this.toggleElement('log2'))}
          {this.renderTabAction('moins', '-', () => this.toggleElement('log1'))}
        </div>
        {this.renderLogBody(['logs', 'other', 'other2'], 1, 'onglet1')}
        <div onMouseDown={(e) => this.handleDragStart('logs', e)} style={{ position: 'absolute', bottom: '6px', right: '52px', cursor: 'grab', backgroundColor: 'transparent', border: 'none', padding: '0' }}> <img src="../static/drag.png" style={{ width: '16.8px', height: '16.8px' }} /> </div>
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.log3 && (
      <motion.div key="logs3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '414px', float: 'right', cursor: 'default', letterSpacing: '1.4px', position: 'absolute', right: '0.2vw', top: 'max(53.2vh, 498px)', borderRadius: '16px' }}>
        <div className="tab">
          {this.renderTab(3, 'other8', 'Hist.')}
          {this.renderTab(3, 'other9', 'Détails')}
          {this.renderTab(3, 'other10', 'Ent Sor')}
          {this.renderTabAction('moins', '-', () => this.toggleElement('log3'), '76px')}
        </div>
        {this.renderLogBody(['other8', 'other9', 'other10'], 3, 'onglet1')}
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.log2 && (
      <motion.div key="logs2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '374px', top: 'max(53.2vh, 498px)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', letterSpacing: '1.4px', zIndex: 888, borderRadius: '16px' }}>
        <div className="tab" style={{ marginLeft: '18px' }}>
          {this.renderTab(2, 'other4', 'Hist.')}
          {this.renderTab(2, 'other5', 'Détails')}
          {this.renderTab(2, 'other6', 'Ent Sor')}
          {this.renderTabAction('plus', '+', () => this.toggleElement('log3'))}
          {this.renderTabAction('moins', '-', () => this.toggleElement('log2'))}
        </div>
        {this.renderLogBody(['other4', 'other5', 'other6'], 2, 'onglet2')}
      </motion.div>
    )}
  </AnimatePresence>

  {this.state.mapMode && this.state.mapMode !== 'off' && (
    <div style={{ width: this.state.mapMode === 'flat' ? '520px' : '400px', maxWidth: '92vw', margin: '40px auto', position: 'relative', zIndex: 1 }}>
      {this.state.mapMode === 'globe' && <Globe transmitter={transmitter} mumbleTransmitter={mumbleTransmitter} trans={trans} />}
      {this.state.mapMode === 'flat' && <FlatMap transmitter={transmitter} mumbleTransmitter={mumbleTransmitter} trans={trans} tileStyle={this.state.mapTiles} />}
    </div>
  )}

  <AnimatePresence>
    {this.state.logo && (
      <motion.div key="logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '284px', margin: '68px auto' }}>
        <a target="_blank" href="https://www.websdrbordeaux.fr"> <img src="../static/logoRond2.png" className="image wiggleIn" /> </a>
      </motion.div>
    )}
  </AnimatePresence>

<style jsx global>{`

::selection { color: #d9534f; }

pre { font-family: var(--app-font); color: var(--logs-color); line-height: 1.1; margin-top: 2px; font-size: 90%; }

.dNone { display: none; }

select { max-width: 220px; background-color: var(--node-bg); color: var(--node-color); border: none; text-align-last: center; font-size: 14px; }

.brdr { border: none; }

button { display: inline-block; width: var(--node-btn-width, 204px); padding: 4px; border-radius: 8.8px; margin: 4px 5px; text-align: center; background-color: var(--node-bg); color: var(--node-color); font-size: 0.95em; font-family: var(--app-font); border: none; height: 32px; cursor: pointer; }

ol { padding: 2.8% 0% 2.48%; text-align: center; max-width: var(--ol-max-width, 1768px); margin: var(--ol-margin-top, 70px) auto 0; }

.transmitting { font-weight: bold; color: var(--trans-color) !important; background-color: var(--trans-bg) !important; }

.pulse { animation: pulsing 4.6s ease-in-out infinite; }

@keyframes pulsing { 0% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } 50% { box-shadow: 0 0 8.8px 4px rgba(255, 255, 255, 0.52); transform: scale(1.02); } 100% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } }

.transmitter { width: 238px; }

.stopTime { margin-left: 18px; font-size: 15.2px; color: #4ade80; font-weight: bold; }

#modal { display: none; position: fixed; top: 12%; left: 50%; transform: translateX(-50%); padding: 8px; background-color: var(--node-bg); box-shadow: white 0 0 60px; z-index: 8888; width: 288px; min-height: 28px; border-radius: 16px; text-align: center; color: var(--node-color); cursor: default; }

.tooltipContainer, .tooltipContainer2 { position: relative; display: inline-block; }

.tooltipContainer:hover { z-index: 9999; }

.favStar { position: absolute; left: 4px; top: 2px; font-size: 12.8px; cursor: pointer; line-height: 1; color: rgba(255,255,255,0.62); opacity: 0; transition: opacity 0.2s ease, transform 0.16s ease, color 0.2s ease; }

.tooltipContainer:hover .favStar { opacity: 1; }

.favStar:hover { transform: scale(1.2); color: var(--relay-color); }

.favStarOn { opacity: 1; color: var(--trans-bg); }

.nodeLabel { position: relative; display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }

.tooltip, .tooltip2 { visibility: hidden; background-color: white; color: #d9534f; text-align: center; border-radius: 6px; padding: 0 4px; position: absolute; transform: translateX(-50%); white-space: nowrap; z-index: 1; opacity: 0; transition: opacity 0.4s ease, visibility 0.4s ease; will-change: opacity, transform; font-family: var(--app-font); }

.tooltip { bottom: -82%; left: 100%; width: 168px; z-index: 8888; }

.tooltip2 { margin: 3px 0 0 32px; }

.tooltipContainer:hover .tooltip, .tooltipContainer2:hover .tooltip2 { visibility: visible; opacity: 1; }

.tooltip3 { visibility: hidden; background-color: rgba(255, 255, 255, 0.66); color: rgba(217, 83, 79, 0.74); text-align: center; border-radius: 6px; padding: 0 4px; position: absolute; transform: translateX(-50%); white-space: nowrap; z-index: 88; opacity: 0; transition: opacity 0.4s ease, visibility 0.4s ease; font-family: var(--app-font); bottom: -82%; left: 78%; font-size: 12px; }

.tooltip-target { position: relative; }

.tooltip-target:hover .tooltip3 { visibility: visible; opacity: 1; }

ol button { transition: transform 0.10s ease-out; }

ol button:hover { transform: scale(1.022); }

.ripple, .ripple2 { position: relative; overflow: hidden; transform: translateZ(0); }

.ripple:after { content: ""; display: block; position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; background-image: radial-gradient(circle, #fff 12%, transparent 12.01%); background-repeat: no-repeat; background-position: 50%; transform: scale(10, 10); opacity: 0; transition: transform 0.6s, opacity 0.6s; }

.ripple2:after { content: ""; display: block; position: absolute; width: 62%; height: 62%; top: 6px; left: 8px; pointer-events: none; background-image: radial-gradient(circle, #fff 12%, transparent 12.01%); background-repeat: no-repeat; background-position: 50%; transform: scale(10, 10); opacity: 0; transition: transform 0.6s, opacity 0.6s; }

.ripple:active:after, .ripple2:active:after { transform: scale(0, 0); opacity: 0.4; transition: 0s; }

.ripple:hover, .ripple2:hover { box-shadow: 0 0 10px rgba(255, 255, 255, 0.22); transition: box-shadow 0.2s ease-in-out; }

.ripple:active, .ripple2:active { transform: scale(0.94); }

.noHoverParent:hover::before { content: none !important; }

button > button:hover::before { content: none !important; }

.bouton2 { background-color: transparent; margin: 0 5px; padding: 0; display: inline-flex; }

.green { color: #4ade80; }

.grey { color: grey; }

.red { color: #d9534f; }

.dodgerblue { color: rgb(30, 144, 255); }

.white { color: white; }

.pink { color: pink; }

.black { color: black; }

.yellow { color: rgba(255, 255, 0, 0.7); }

.cyan { color: rgba(0, 255, 251, 0.7); }

.orange { color: rgba(244, 102, 27, 0.88); }

.bg-grey { background-color: rgba(121,122,128,0.7); }

.bg-green { background-color: rgba(74, 222, 128, 0.84); }

.bg-red { background-color: rgba(217, 83, 79, 0.7); }

.bg-dodgerblue { background-color: rgba(30, 144, 255, 0.7); }

.bg-white { background-color: rgba(255, 255, 255, 0.72); }

.bg-pink { background-color: rgba(255, 193, 203, 0.7); }

.bg-black { background-color: rgba(0, 0, 0, 0.7); }

.bg-yellow { background-color: rgba(255, 255, 0, 0.7); }

.bg-cyan { background-color: rgba(0, 255, 251, 0.7); }

.bg-orange { background-color: rgba(244, 102, 27, 0.88); }

@keyframes streamLedBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.24; } }

.streamLedBlink { animation: streamLedBlink 2.8s ease-in-out infinite; }

.reset { animation: rotate 0.4s ease-in-out; transform-origin: center center; }

.effect { transition: transform 0.2s ease-in-out; background-color: transparent; border: none; cursor: pointer; padding: 0; }

.effect:hover { transform: scale(1.16); }

@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

input[type=range] { -webkit-appearance: none; width: 88%; height: 4px; border-radius: 6px; background-color: white; outline: none; cursor: pointer; margin-top: 4.8px; }

input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background-color: var(--thumb-color, #4ade80); cursor: pointer; transition: background-color 0.4s ease; margin-top: 0; border: none; }

input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background-color: var(--thumb-color, #4ade80); cursor: pointer; transition: background-color 0.4s ease; border: none; }

.zoomImage { transition: transform 0.2s ease-in-out; }

.zoomImage:hover { transform: scale(1.62); z-index: 8888; }

.fermer { position: relative; background-color: transparent; border-radius: 8px; color: #d9534f; width: 18px; height: 20px; padding: 0; transition: background-color 0.2s; }

.fermer:hover { background-color: white; }

.tab button { background-color: var(--logs-bg); border: none; cursor: pointer; color: var(--logs-color); }

.tab button.active { background-color: var(--logs-color); color: var(--logs-bg); }

.tab button:hover { color: #d9534f; background-color: white; }

.onglet1 { float: right; border-radius: 16px; background-color: var(--logs-bg); padding: 18px; margin: 6px 50px 0 0; width: 384px; height: 380px; overflow: auto; scrollbar-width: none; }

.onglet2 { border-radius: 16px; background-color: var(--logs-bg); padding: 18px; margin-top: 6px; width: 375px; height: 380px; overflow: auto; scrollbar-width: none; }

*:focus { outline: none; }

.notification { position: fixed; top: 12%; left: 50%; transform: translateX(-50%); background-color: var(--node-bg); color: var(--node-color); padding: 12px 20px; border-radius: 16px; box-shadow: white 0 0 60px; z-index: 1; font-family: var(--app-font); max-width: 482px; text-align: center; }

.fadeOut { animation: FadeOut 1.8s forwards; }

@keyframes FadeOut { from { opacity: 1; } to { opacity: 0; } }

.nodePing { position: absolute; top: 50%; left: 50%; width: 18px; height: 18px; margin: -8px 0 0 -8px; border-radius: 50%; border: 1.6px solid rgba(74, 222, 128, 0.9); transform: scale(0.6); opacity: 0.9; pointer-events: none; animation: nodePingWave 1.4s ease-out forwards; }

@keyframes nodePingWave { 0% { transform: scale(0.4); opacity: 0.9; } 70% { opacity: 0.36; } 100% { transform: scale(4.2); opacity: 0; } }

.wiggleIn { animation: WiggleIn 1s ease-in-out forwards; animation-delay: 0.28s; opacity: 0; height: 284px; margin: 0; }

@keyframes WiggleIn { 0% { transform: translateX(0) rotate(0); opacity: 0; } 10% { transform: translateX(-3px) rotate(-2deg); opacity: 0.2; } 20% { transform: translateX(3px) rotate(2deg); opacity: 0.4; } 30% { transform: translateX(-3px) rotate(-1.5deg); } 40% { transform: translateX(3px) rotate(1.5deg); } 50% { transform: translateX(-2px) rotate(-1deg); } 60% { transform: translateX(2px) rotate(1deg); } 70% { transform: translateX(-1px) rotate(-0.5deg); } 80% { transform: translateX(1px) rotate(0.5deg); } 90% { transform: translateX(0) rotate(0); } 100% { opacity: 0.78; } }

.noSelect { user-select: none; -webkit-user-select: none; -moz-user-select: none; }

.mumbleList { display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start; column-gap: 6px; scrollbar-width: none; }

.mumbleList::-webkit-scrollbar { display: none; }

.mumbleResize { position: absolute; right: 2px; bottom: 2px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; cursor: nwse-resize; color: var(--node-color); opacity: 0.3; transition: opacity 0.2s; }

.mumbleBox:hover .mumbleResize { opacity: 0.9; }

@media (max-width: 1600px) {
  ol { padding: 1.98% 0% 1.88%; margin: 20px auto 0; }
  button { width: calc(var(--node-btn-width, 204px) * 0.843); padding: 4px; margin: 4px; }
  .transmitter { top: 5%; }
}

`}</style>

  </Layout>
    );
  }
}
export default Component;