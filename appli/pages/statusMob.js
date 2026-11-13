import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactDOM from 'react-dom'
import Layout from '../components/LayoutMob'
import fetch from '../lib/fetch'
import { Notif } from '../lib/notif'
import { useTheme, ThemeToggle } from '../lib/themeContext'
import io from 'socket.io-client'
import { SvxOnglets, SvxStats } from '../lib/svxStats'
import Nouveautes from '../lib/nouveautes'
import DiagnosticPanel from '../lib/diagnosticPanel'

const logFiles = [
  { label: 'SvxLink', value: '/tmp/svxlink.log' },
  { label: 'Système', value: '/var/log/syslog' },
];

function formatIpText(ipText) {
  if (!ipText) return '';
  return ipText.replace(/end0/g, 'Rj45').replace(/wlan0/g, 'Wifi').replace(/uap0/g, "Point d'accès").replace(/wg0/g, 'Vpn');
}

function formatUptime(uptimeText) {
  if (!uptimeText) return '--';
  return uptimeText
    .replace('up ', '') .replace(/ days?/, ' jour') .replace(/ hours?/, ' heures') .replace(/ minutes?/, ' minutes') .replace(/,/g, '');
}

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return null;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatCtcss(code) {
  if (!code || code === '0000') return 'Aucun';
const mapping = { '0001': '67.0', '0002': '71.9', '0003': '74.4', '0004': '77.0', '0005': '79.7', '0006': '82.5', '0007': '85.4', '0008': '88.5', '0009': '91.5', '0010': '94.8', '0011': '97.4', '0012': '100.0', '0013': '103.5', '0014': '107.2', '0015': '110.9', '0016': '114.8', '0017': '118.8', '0018': '123.0', '0019': '127.3', '0020': '131.8', '0021': '136.5', '0022': '141.3', '0023': '146.2', '0024': '151.4', '0025': '156.7', '0026': '162.2', '0027': '167.9', '0028': '173.8', '0029': '179.9', '0030': '186.2', '0031': '192.8', '0032': '203.5', '0033': '210.7', '0034': '218.1', '0035': '225.7', '0036': '233.6', '0037': '241.8' };
  return mapping[code] ? `${mapping[code]} Hz` : code;
}

function hotspotUrl(address, port) {
  return `http://${address}${port && port !== '80' ? ':' + port : ''}/`;
}

function formatBandwidth(bw) {
  if (!bw) return '--';
  return bw === '12.5K' ? 'Narrow (12.5k)' : bw === '25K' ? 'Wide (25k)' : bw;
}

const SYNC_LABELS = {
  ok: 'Synchro Ok',
  drift: 'Synchro en cours',
  stale: 'Synchro ancienne',
  nosync: 'Non synchronisé',
  unknown: 'Synchro ?',
};

const SYNC_CLASS = {
  ok: 'syncOk',
  drift: 'syncDrift',
  stale: 'syncStale',
  nosync: 'syncNoSync',
  unknown: 'syncUnknown',
};

const SYNC_DETAILS = {
  ok: 'Heure synchronisée !!',
  drift: 'Chrony rattrape un écart, typique après un démarrage',
  stale: 'Pas de mise à jour récente ..',
  nosync: 'Aucune source de temps joignable',
  unknown: 'Chrony ne répond pas',
};

function formatAgo(ms) {
  if (ms == null || isNaN(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${String(m % 60).padStart(2, '0')}`;
  const d = Math.floor(h / 24);
  return `${d} j ${h % 24} h`;
}

function formatChrono(ms) {
  if (ms == null || isNaN(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const IFACE_LABELS = { end0: 'Rj45', eth0: 'Rj45', wlan0: 'Wifi', uap0: "Point d'accès", wg0: 'VPN' };
const ifaceLabel = name => IFACE_LABELS[name] || name;

function latencyClass(lat) {
  if (!lat || lat.ms === null || lat.ms >= 200 || lat.lossPct >= 40) return 'refTipBad';
  if (lat.ms >= 80 || lat.lossPct > 0 || (lat.jitterMs !== null && lat.jitterMs >= 50)) return 'refTipWarn';
  return 'refTipGood';
}

function wifiClass(signal) {
  if (signal == null) return '';
  if (signal >= 60) return 'netTipGood';
  if (signal >= 35) return 'netTipWarn';
  return 'netTipBad';
}

const REFLECTOR_STATUS = {
  up:         { label: 'Connecté',             cls: 'refDotUp' },
  auth:       { label: 'Authentification ..',  cls: 'refDotWait' },
  connecting: { label: 'Connexion ..',         cls: 'refDotWait' },
  down:       { label: 'Déconnecté',           cls: 'refDotDown' },
  stopped:    { label: 'Arrêté',               cls: 'refDotDown' },
  unknown:    { label: 'État inconnu',         cls: 'refDotIdle' },
};

function apiAction(endpoint, message) {
  fetch(`/api/${endpoint}`, { method: 'POST' })
    .then(() => Notif.info(message))
    .catch(() => Notif.error('Erreur communication'));
}

const restart              = () => apiAction('restart', 'Redémarrage WebLink ..');
const reboot               = () => apiAction('reboot', 'Redémarrage Hotspot ..');
const poweroff             = () => apiAction('poweroff', 'Extinction ..');
const updateInterface      = () => apiAction('updateInterface', 'Mise à jour Interface ..');
const updateNodeInfo       = () => apiAction('updateNodeInfo', 'Mise à jour Infos Nodes ..');
const cancelUpdate         = () => apiAction('cancelUpdate', 'Mise à jour annulée !!');
const cancelNodeInfoUpdate = () => apiAction('cancelNodeInfoUpdate', 'Mise à jour annulée !!');

const DIALOG_TEXT = {
  reboot: 'Voulez-vous redémarrer le Hotspot ?',
  poweroff: 'Voulez-vous éteindre le Hotspot ?',
  restore: 'Restaurer cette configuration ?\nRedémarrage automatique ..',
};

const ACTIONS_TITLES = { idle: 'Actions', select: 'Mode mise à jour', progress: 'Mise à jour en cours' };

function ActionsBlock() {
  const { theme } = useTheme();

  const [mode, setMode]                     = useState('idle');
  const [updateType, setUpdateType]         = useState(null);
  const [progress, setProgress]             = useState(0);
  const [message, setMessage]               = useState(null);
  const [isComplete, setIsComplete]         = useState(false);
  const [updateError, setUpdateError]       = useState(false);
  const [upToDate, setUpToDate]             = useState(false);
  const [hasUpdate, setHasUpdate]           = useState(false);
  const [cancelDisabled, setCancelDisabled] = useState(false);

  const [dialog, setDialog]               = useState(null);
  const [pendingConfig, setPendingConfig] = useState(null);
  const [isRestoring, setIsRestoring]     = useState(false);
  const [restoreDone, setRestoreDone]     = useState(false);

  const pollTimeout        = useRef(null);
  const finishTimeout      = useRef(null);
  const startPollTimeout   = useRef(null);
  const countdownInterval  = useRef(null);
  const retryTimeout       = useRef(null);
  const restoreTimeout     = useRef(null);
  const restoringRef       = useRef(false);
  const originalNotifError = useRef(Notif.error);

  const muteNotifError = () => { Notif.error = () => {}; };

  const restoreNotifError = () => {
    if (Notif.error !== originalNotifError.current) Notif.error = originalNotifError.current;
  };

  const cleanupTimers = () => {
    clearTimeout(pollTimeout.current);
    clearTimeout(finishTimeout.current);
    clearTimeout(startPollTimeout.current);
    clearTimeout(retryTimeout.current);
    clearInterval(countdownInterval.current);
    restoreNotifError();
  };

  const waitForServer = onReady => {
    const tryConnect = () => {
      fetch('/api/configuration', { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error();
          onReady();
        })
        .catch(() => { retryTimeout.current = setTimeout(tryConnect, 2000); });
    };
    tryConnect();
  };

  const handleUpdateEnd = (value, isError) => {
    if (isError) {
      restoreNotifError();
      localStorage.removeItem('pendingUpdate');
      setUpdateType(null);
      setUpdateError(true);
      return;
    }
    if (value < 100) return;

    let remaining = 10;
    const tick = () => setMessage(`Mise à jour terminée !! \nRetour à l'accueil dans ${remaining}s`);
    tick();
    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      tick();
      if (remaining <= 0) clearInterval(countdownInterval.current);
    }, 1000);

    finishTimeout.current = setTimeout(() => {
      setMessage("Un p'tit peu plus long que prévu .. \nOn touche à rien ca va revenir tous seul ;) ");
      waitForServer(() => {
        localStorage.removeItem('pendingUpdate');
        window.location.reload();
      });
    }, 10000);
  };

  const startUpdateProcess = (type, isResuming = false) => {
    cleanupTimers();
    muteNotifError();
    if (!isResuming) localStorage.setItem('pendingUpdate', JSON.stringify({ type, active: true }));

    const apiUrl = type === 'full' ? '/api/updateProgress' : '/api/updateNodeInfoProgress';
    const lockAt = type === 'full' ? 44 : 46;

    setMode('progress');
    setUpdateType(type);
    setUpdateError(false);
    setUpToDate(false);

    if (!isResuming) {
      setProgress(0);
      setMessage(type === 'full' ? 'Mise à jour Interface ..' : 'Mise à jour Infos Nodes ..');
      setIsComplete(false);
      setCancelDisabled(false);
      (type === 'full' ? updateInterface : updateNodeInfo)();
    }

    let highestProgress = 0;

    const finish = () => {
      setProgress(100);
      setMessage('Mise à jour terminée !!');
      setIsComplete(true);
      setCancelDisabled(true);
      handleUpdateEnd(100, false);
    };

    const poll = () => {
      fetch(apiUrl)
        .then(r => r.json())
        .then(data => {
          if (data.progress === 'uptodate') {
            restoreNotifError();
            localStorage.removeItem('pendingUpdate');
            setProgress(100);
            setMessage(data.message ? data.message.replace(/\\n/g, '\n') : null);
            setUpToDate(true);
            setHasUpdate(false);
            setCancelDisabled(false);
            return;
          }

          const isError = data.progress === 'error';
          if (!isError && data.progress > highestProgress) highestProgress = data.progress;

          if (!isError && data.progress === 0 && highestProgress >= 86) {
            finish();
            return;
          }

          setProgress(isError ? 0 : data.progress);
          setMessage(data.message ? data.message.replace(/\\n/g, '\n') : null);
          setIsComplete(data.progress >= 100);
          setCancelDisabled(data.progress >= lockAt && data.progress < 100);

          if (data.progress < 100 && !isError) {
            pollTimeout.current = setTimeout(poll, 800);
          } else {
            handleUpdateEnd(data.progress, isError);
          }
        })
        .catch(() => {
          if (highestProgress >= 86) finish();
          else pollTimeout.current = setTimeout(poll, 2000);
        });
    };

    startPollTimeout.current = setTimeout(poll, isResuming ? 0 : 1000);
  };

  const handleCancel = () => {
    cleanupTimers();
    localStorage.removeItem('pendingUpdate');
    if (!isComplete && !updateError && !upToDate) {
      if (updateType === 'full') cancelUpdate();
      if (updateType === 'nodeInfo') cancelNodeInfoUpdate();
    }
    setMode('idle');
    setUpdateType(null);
    setProgress(0);
    setMessage(null);
    setIsComplete(false);
    setUpdateError(false);
    setUpToDate(false);
    setCancelDisabled(false);
  };

  const handleBackup = () => {
    fetch('/api/configuration')
      .then(res => res.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `config_weblink_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        Notif.info('Sauvegarde prête !!');
      })
      .catch(() => Notif.error('Erreur Sauvegarde ..'));
  };

  const handleRestore = event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        setPendingConfig(JSON.parse(e.target.result));
        setIsRestoring(false);
        setRestoreDone(false);
        setDialog('restore');
      } catch {
        Notif.error('Fichier Json invalide');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmRestore = () => {
    if (!pendingConfig || restoringRef.current) return;
    restoringRef.current = true;
    setIsRestoring(true);
    fetch('/api/configuration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingConfig) })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        muteNotifError();
        setRestoreDone(true);
        restoreTimeout.current = setTimeout(() => waitForServer(() => window.location.reload()), 2468);
      })
      .catch(() => {
        restoringRef.current = false;
        setIsRestoring(false);
        setDialog(null);
        setPendingConfig(null);
        Notif.error('Échec Restauration');
      });
  };

  const closeDialog = () => {
    if (restoringRef.current) return;
    setDialog(null);
    setPendingConfig(null);
  };

  const confirmDialog = () => {
    if (dialog === 'restore') return confirmRestore();
    const action = dialog === 'reboot' ? reboot : poweroff;
    setDialog(null);
    action();
  };

  useEffect(() => {
    window.fetch('/api/updateAvailable', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setHasUpdate(!!d.available))
      .catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem('pendingUpdate') || 'null');
      if (saved && saved.active) startUpdateProcess(saved.type, true);
    } catch {}
    return () => {
      cleanupTimers();
      clearTimeout(restoreTimeout.current);
    };
  }, []);

  return (
    <div className="actionsBlock">
      <div className="actionsHead">
        <svg className="actionsIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span className="actionsTitle">{ACTIONS_TITLES[mode]}</span>
        {mode === 'select' && (
          <button type="button" className="closeBtn" onClick={() => setMode('idle')} aria-label="Fermer">✕</button>
        )}
      </div>

      {mode === 'idle' && (
        <>
          <div className="actionsRow">
            <span className="actionsRowLabel">WebLink</span>
            <div className="actionsGrid">
              <button type="button" className="actBtn" onClick={restart}>Redémarrer</button>
              <button type="button" className="actBtn" onClick={() => setMode('select')}>Mise à jour{hasUpdate && <span className="updDot" title="Nouvelle version disponible" />}</button>
              <label className="actBtn">
                Import
                <input type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} />
              </label>
              <button type="button" className="actBtn" onClick={handleBackup}>Export</button>
            </div>
          </div>
          <div className="actionsRow">
            <span className="actionsRowLabel">Hotspot</span>
            <div className="actionsGrid">
              <button type="button" className="actBtn" onClick={() => setDialog('reboot')}>Redémarrer</button>
              <button type="button" className="actBtn actBtnDanger" onClick={() => setDialog('poweroff')}>Éteindre</button>
            </div>
          </div>
        </>
      )}

      {mode === 'select' && (
        <div className="actionsPanel">
          <span className="panelHint">Mise à jour ?</span>
          <div className="panelBtns">
            <button type="button" className="actBtn" onClick={() => startUpdateProcess('nodeInfo')}>Info Nodes</button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" className="actBtn" style={{ flex: 1 }} onClick={() => startUpdateProcess('full')}>Interface{hasUpdate && <span className="updDot" title="Nouvelle version disponible" />}</button>
              <Nouveautes hasUpdate={hasUpdate} onInstall={() => startUpdateProcess('full')} />
            </span>
          </div>
        </div>
      )}

      {mode === 'progress' && (
        <div className="actionsPanel">
          <div className="progressPct" style={{ color: isComplete ? '#4ade80' : theme.textSecondary }}>{upToDate ? 'À jour' : `${progress}%`}</div>
          <div className="progressTrack">
            <div className="progressFill" style={{ width: `${progress}%`, background: upToDate ? theme.textSecondary : isComplete ? '#4ade80' : theme.accentRed }} />
          </div>
          {message && (
            <p className="progressMsg" style={{ color: updateError || message.includes('Erreur') ? theme.accentRed : upToDate ? theme.textPrimary : '#4ade80' }}>{message}</p>
          )}
          {!isComplete && (
            <button type="button" className="actBtn actBtnMuted actBtnWide" onClick={handleCancel} disabled={cancelDisabled}>
              {updateError || upToDate ? 'Fermer' : 'Annuler'}
            </button>
          )}
        </div>
      )}

      {dialog && ReactDOM.createPortal(
        <div className="overlay" onClick={closeDialog}>
          <div className="popup" role="dialog" aria-modal="true" aria-live="polite" onClick={e => e.stopPropagation()}>
            {restoreDone ? (
              <>
                <div className="doneIcon">✓</div>
                <p className="popupText" style={{ margin: 0 }}>{'Configuration restaurée !!\nRedémarrage ..'}</p>
              </>
            ) : (
              <>
                <div>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <p className="popupText">{DIALOG_TEXT[dialog]}</p>
                <div className="popupActions">
                  <button type="button" className="popupBtn popupBtnConfirm" onClick={confirmDialog} disabled={isRestoring}>
                    {isRestoring ? <><span className="miniSpinner" /> Restauration ..</> : 'Confirmer'}
                  </button>
                  {!isRestoring && (
                    <button type="button" className="popupBtn" onClick={closeDialog}>Annuler</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      , document.body)}

<style jsx>{`

.actionsBlock { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 10px 14px; margin-bottom: 1rem; }

.actionsHead { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

.actionsIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.actionsTitle { font-size: 14.8px; color: ${theme.textPrimary}; }

.closeBtn { margin-left: auto; background: none; border: none; color: #4ade80; font-size: 16px; cursor: pointer; padding: 0 6px; border-radius: 8px; -webkit-tap-highlight-color: transparent; }

.closeBtn:active { background: ${theme.cardBorder}; }

.actionsRow { display: flex; align-items: flex-start; gap: 10px; padding: 3px 0; }

.actionsRowLabel { font-size: 13.6px; color: ${theme.textSecondary}; width: 60px; flex-shrink: 0; line-height: 32px; }

.actionsGrid { flex: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }

.actBtn { display: flex; align-items: center; justify-content: center; margin: 0; height: 32px; padding: 0 8px; background: ${theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(0,150,0,0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.3)' : 'rgba(0,150,0,0.3)'}; color: ${theme.textSecondary}; border-radius: 8px; font-size: 13.6px; cursor: pointer; transition: background 0.14s, color 0.14s, transform 0.1s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; -webkit-tap-highlight-color: transparent; user-select: none; }

.actBtn:active { background: #4ade80; color: white; transform: scale(0.96); }

.actBtnDanger { color: ${theme.textSecondary}; background: rgba(217,83,79,0.28); border-color: rgba(217,83,79,0.42); }

.actBtnDanger:active { background: ${theme.accentRed}; color: white; }

.updDot { flex-shrink: 0; width: 8px; height: 8px; margin-left: 10px; border-radius: 50%; background: #ef4444; animation: updPulse 1.4s ease-out infinite; }

@keyframes updPulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); } 80% { box-shadow: 0 0 0 4px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }

.actBtnMuted { color: ${theme.textSecondary}; background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; border-color: ${theme.cardBorder}; }

.actBtnMuted:active { background: ${theme.accentRed}; color: white; }

.actBtnWide { min-width: 120px; }

.actBtn:disabled { opacity: 0.45; cursor: not-allowed; }

.actBtn:disabled:active { background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; color: ${theme.textSecondary}; transform: none; }

.actionsPanel { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 4px 0 6px; }

.panelHint { font-size: 13.6px; color: ${theme.textSecondary}; }

.panelBtns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: 100%; }

.progressPct { font-size: 20px; font-weight: 500; font-variant-numeric: tabular-nums; }

.progressTrack { width: 86%; height: 6px; background: ${theme.hoverBg}; border-radius: 10px; overflow: hidden; }

.progressFill { height: 100%; border-radius: 10px; transition: width 0.28s ease; }

.progressMsg { margin: 0; font-size: 13.6px; text-align: center; white-space: pre-line; }

.overlay { position: fixed; inset: 0; background: ${theme.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)'}; display: flex; justify-content: center; align-items: center; z-index: 3000; backdrop-filter: blur(3px); }

.popup { background: ${theme.isDark ? 'rgba(121,122,128,0.95)' : 'rgba(200, 200, 200, 0.95)'}; padding: 28px 24px; border-radius: 22px; box-shadow: ${theme.shadow}; width: min(340px, calc(100vw - 32px)); text-align: center; }

.popupText { color: ${theme.textPrimary}; font-size: 14.8px; line-height: 1.6; margin: 8px 0 24px; white-space: pre-line; }

.popupActions { display: flex; justify-content: center; gap: 16px; }

.popupBtn { flex: 1; max-width: 130px; height: 34px; font-size: 14.6px; color: white; background: rgba(121,122,128,0.6); border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; cursor: pointer; transition: background 0.14s, transform 0.1s; -webkit-tap-highlight-color: transparent; }

.popupBtn:active { background: ${theme.hoverBg}; transform: scale(0.96); }

.popupBtnConfirm { background: #4ade80; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }

.popupBtnConfirm:active { background: #d9534f; }

.popupBtnConfirm:disabled { opacity: 0.85; cursor: wait; max-width: 180px; }

.popupBtnConfirm:disabled:active { background: #4ade80; transform: none; }

.miniSpinner { width: 12px; height: 12px; box-sizing: border-box; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: actSpin 1s linear infinite; }

@keyframes actSpin { to { transform: rotate(360deg); } }

.doneIcon { width: 34px; height: 34px; margin: 0 auto 16px; border-radius: 50%; background: #4ade80; color: white; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; animation: actPop 0.22s ease-out; }

@keyframes actPop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }

@media (prefers-reduced-motion: reduce) { .miniSpinner, .doneIcon { animation: none !important; } }

`}</style>
    </div>
  );
}

const Index = props => {
  const { theme } = useTheme();

  const [dynamicData, setDynamicData] = useState({
    uptime: props.uptime,
    memory: props.memory,
    memoryRaw: props.memoryRaw,
    cpuFreq: props.cpuFreq,
    cpuFreqRaw: props.cpuFreqRaw,
    cpuLoad: props.cpuLoad,
    ip: props.ip,
    ping: props.ping,
    temperature: props.temperature
  });

  const clockOffsetRef = useRef(null);
  if (clockOffsetRef.current === null) {
    const t = props.datetime ? new Date(props.datetime).getTime() : NaN;
    clockOffsetRef.current = isNaN(t) ? 0 : t - Date.now();
  }
  const [now, setNow] = useState(() => new Date(Date.now() + clockOffsetRef.current));
  const [timeSync, setTimeSync] = useState(null);
  const [reflectorState, setReflectorState] = useState(null);
  const [netInfo, setNetInfo] = useState(null);
  const [netInfoError, setNetInfoError] = useState(false);

  const [openPanel, setOpenPanel] = useState(null);
  const [refTab, setRefTab] = useState('direct');
  const togglePanel = id => setOpenPanel(p => (p === id ? null : id));
  const panelKeyDown = id => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(id); } };
  const chevron = open => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.8, transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}>
      <polyline points="2.5 4 5 6.5 7.5 4" />
    </svg>
  );

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [rssi, setRssi] = useState(null);
  const [squelchOpen, setSquelchOpen] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sa818Config, setSa818Config] = useState(null);

  const [selectedLog, setSelectedLog]     = useState(logFiles[0].value);
  const [showLogModal, setShowLogModal]   = useState(false);
  const [logContent, setLogContent]       = useState('');
  const [logLoading, setLogLoading]       = useState(false);
  const [logError, setLogError]           = useState('');
  const [logSearch, setLogSearch]         = useState('');
  const logSearchRef                      = useRef(null);

  const openLog = async () => {
    setLogLoading(true);
    setLogError('');
    setLogContent('');
    setLogSearch('');
    setShowLogModal(true);
    try {
      const res = await fetch(`/api/log?file=${encodeURIComponent(selectedLog)}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const text = await res.text();
      setLogContent(text);
    } catch (err) {
      setLogError(err.message || 'Lecture fichier impossible');
    } finally {
      setLogLoading(false);
    }
  };

  const downloadLog = () => {
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = selectedLog.split('/').pop();
    a.click();
    URL.revokeObjectURL(url);
  };

  const [storageData, setStorageData] = useState(null);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [resizeLog, setResizeLog] = useState('');
  const [resizeRunning, setResizeRunning] = useState(false);
  const [resizeDone, setResizeDone] = useState(false);
  const resizeLogRef = useRef(null);
  const resizePollRef = useRef(null);

  const [showTerminal, setShowTerminal] = useState(false);
  const [socketActive, setSocketActive] = useState(false);
  const termRef = useRef(null);
  const termInstance = useRef(null);
  const socketRef = useRef(null);
  const termTimeoutRef = useRef(null);

  const [hotspots, setHotspots] = useState([]);

  const fetchHotspots = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/hotspots');
      const data = await res.json();
      if (Array.isArray(data)) setHotspots(data);
    } catch {}
  }, []);

  const fetchTimeSync = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/timesync');
      if (!res.ok) return;
      setTimeSync(await res.json());
    } catch {}
  }, []);

  const fetchReflectors = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/reflectors');
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.reflectors)) setReflectorState(data);
    } catch {}
  }, []);

  const fetchNetInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/netinfo');
      if (!res.ok) throw new Error();
      setNetInfo(await res.json());
      setNetInfoError(false);
    } catch {
      setNetInfoError(true);
    }
  }, []);

  const clearTermTimeout = () => {
    if (termTimeoutRef.current) { clearTimeout(termTimeoutRef.current); termTimeoutRef.current = null; }
  };

  const resetTermTimeout = () => {
    clearTermTimeout();
    termTimeoutRef.current = setTimeout(() => {
      Notif.info('Fermeture Terminal ( inactivité 2 min )');
      setShowTerminal(false);
      if (termInstance.current) { termInstance.current.dispose(); termInstance.current = null; }
    }, 2 * 60 * 1000);
  };

  const toggleTerminal = () => {
    setShowTerminal(prev => {
      const next = !prev;
      if (next) {
        setTimeout(async () => {
          if (!termRef.current) return;
          const { Terminal } = await import('xterm');
          const { FitAddon } = await import('xterm-addon-fit');
          termInstance.current = new Terminal({
            cursorBlink: true,
            theme: { background: 'rgba(0,0,0,0.4)', foreground: '#eeeeeeff', cursor: '#4ade80', selection: '#4ade80' },
            rows: 24,
            cols: 80
          });
          const fitAddon = new FitAddon();
          termInstance.current.loadAddon(fitAddon);
          termInstance.current.open(termRef.current);
          fitAddon.fit();
          socketRef.current.emit('terminalReady');
          resetTermTimeout();
          const flash = () => { setSocketActive(true); setTimeout(() => setSocketActive(false), 100); };
          termInstance.current.onData(data => { socketRef.current.emit('termData', data); flash(); resetTermTimeout(); });
          socketRef.current.on('termData', data => { termInstance.current.write(data); flash(); resetTermTimeout(); });
        }, 100);
      } else {
        clearTermTimeout();
        if (termInstance.current) { termInstance.current.dispose(); termInstance.current = null; }
      }
      return next;
    });
  };

  const fetchStorage = useCallback(async () => {
    try {
      const res = await fetch('/api/storage');
      const data = await res.json();
      setStorageData(data);
    } catch {}
  }, []);

  const startResize = async () => {
    if (resizeRunning) return;

    setResizeLog('Extension de la carte micro Sd ..\n');
    setResizeRunning(true);
    setResizeDone(false);
    setShowResizeModal(true);
    const startTime = Date.now();

    try {
      await fetch('/api/resize2fs', { method: 'POST' });
    } catch {}

    if (resizePollRef.current) clearInterval(resizePollRef.current);

    resizePollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/resize2fs/log', { cache: 'no-store' });
        const data = await res.json();
        if (data.log) setResizeLog(data.log);
        const fini = data.etat === 'ok' || data.etat === 'max' || data.etat === 'erreur';
        const bloque = !fini && Date.now() - startTime > 120000;
        if (!fini && !bloque) return;

        clearInterval(resizePollRef.current);
        resizePollRef.current = null;
        setResizeRunning(false);
        fetchStorage();

        if (bloque) {
          setResizeLog(prev => prev + '\n - Pas de réponse du hotspot, relancez Étendre dans un moment ..');
          return;
        }
        if (data.etat === 'erreur') return;

        setResizeDone(true);
        setResizeLog(prev => prev + (data.etat === 'ok' ? '\n - Wouanegaine !! Fermeture automatique ..' : '\n - Rien à faire !! Fermeture automatique ..'));
        setTimeout(() => {
          setShowResizeModal(false);
          setResizeDone(false);
        }, 6000);
      } catch {}
    }, 1200);
  };

useEffect(() => {
  resizeLogRef.current?.scrollTo({
    top: resizeLogRef.current.scrollHeight,
    behavior: 'smooth'
  });
}, [resizeLog]);

  const closeResizeModal = () => {
    if (resizeRunning) return;
    setShowResizeModal(false);
    setResizeDone(false);
    if (resizePollRef.current) { clearInterval(resizePollRef.current); resizePollRef.current = null; }
  };

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.datetime) {
        const t = new Date(data.datetime).getTime();
        if (!isNaN(t)) clockOffsetRef.current = t - Date.now();
      }
      setDynamicData(data);
    } catch (error) {
      setDynamicData(prev => ({ ...prev, ping: 'horsLigne' }));
    }
  }, []);

  const handleClearCache = async () => {
    try {
      await fetch('/api/clearCache', { method: 'POST' });
      refreshData();
      Notif.info('Nettoyage cache effectué !!');
    } catch (err) {
      console.error('Erreur cache', err);
    }
  };

  const toggleMonitoring = async (checked) => {
    try {
      if (checked) setIsConfigLoading(true);
      const res = await fetch('/api/sa818/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked })
      });
      if (res.ok) {
        setIsMonitoring(checked);
        if (!checked) {
          setRssi(null);
          setSquelchOpen(false);
          setSessionDuration(0);
          setSa818Config(null);
          setIsConfigLoading(false);
        }
      } else {
        setIsConfigLoading(false);
      }
    } catch (error) {
      setIsConfigLoading(false);
    }
  };

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(new Date(Date.now() + clockOffsetRef.current)), 1000);

    let dataTimer = setInterval(refreshData, 4000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(dataTimer);
        dataTimer = null;
      } else {
        refreshData();
        fetchTimeSync();
        fetchReflectors();
        if (dataTimer) clearInterval(dataTimer);
        dataTimer = setInterval(refreshData, 4000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    fetchStorage();
    fetchHotspots();
    const hotspotsTimer = setInterval(fetchHotspots, 30000);
    fetchTimeSync();
    const syncTimer = setInterval(fetchTimeSync, 60000);
    fetchReflectors();
    const reflectorsTimer = setInterval(fetchReflectors, 30000);
    fetch('/api/sa818/status').then(res => res.json()).then(d => setIsMonitoring(d.enabled)).catch(() => {});
    fetch('/api/sa818/config').then(res => res.json()).then(d => { if (d && d.freq_rx) setSa818Config(d); }).catch(() => {});

    socketRef.current = io();
    const socket = socketRef.current;

    socket.on('sa818Realtime', (msg) => {
      setRssi(msg.rssi ?? null);
      setSquelchOpen(!!msg.squelch_open);
      setSessionDuration(msg.session_duration ?? 0);
    });
    socket.on('sa818Config', (cfg) => {
      setSa818Config(cfg);
      setIsConfigLoading(false);
    });
    socket.on('reflectorStatus', (data) => {
      if (data && Array.isArray(data.reflectors)) setReflectorState(data);
    });

    return () => {
      clearInterval(clockTimer);
      clearInterval(hotspotsTimer);
      clearInterval(syncTimer);
      clearInterval(reflectorsTimer);
      if (dataTimer) clearInterval(dataTimer);
      if (resizePollRef.current) { clearInterval(resizePollRef.current); resizePollRef.current = null; }
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTermTimeout();
      if (termInstance.current) { termInstance.current.dispose(); termInstance.current = null; }
      socket.disconnect();
    };
  }, [refreshData, fetchStorage, fetchHotspots, fetchTimeSync, fetchReflectors]);

  useEffect(() => {
    if (openPanel !== 'net') return undefined;
    fetchNetInfo();
    const timer = setInterval(fetchNetInfo, 15000);
    return () => clearInterval(timer);
  }, [openPanel, fetchNetInfo]);

  const renderedLogContent = useMemo(() => {
    if (!logContent) return <span style={{ color: theme.textSecondary }}>(fichier vide)</span>;
    const term = logSearch.trim();
    if (!term) return logContent;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = logContent.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase()
        ? <mark key={i} style={{ background: '#d9534f', color: 'white', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
        : part
    );
  }, [logContent, logSearch, theme.textSecondary]);

  const logMatchCount = useMemo(() => {
    if (!logSearch.trim() || !logContent) return 0;
    const escaped = logSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return (logContent.match(new RegExp(escaped, 'gi')) || []).length;
  }, [logContent, logSearch]);

  const temperatureValue = parseFloat(dynamicData.temperature);
  const tempKnown = !isNaN(temperatureValue);
  const tempOk = tempKnown && temperatureValue < 45;
  const internetOk = dynamicData.ping === 'ok';
  const timeStr = now.toLocaleTimeString('fr-FR');
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const nowMs = now.getTime();
  const clockOffsetS = Math.round(clockOffsetRef.current / 1000);

  const syncState = timeSync && SYNC_LABELS[timeSync.state] ? timeSync.state : 'unknown';
  const syncRows = [];
  if (timeSync) {
    if (timeSync.server) syncRows.push(['Serveur', timeSync.server]);
    if (timeSync.stratum) syncRows.push(['Strate', String(timeSync.stratum)]);
    if (timeSync.offsetMs != null) syncRows.push(['Correction', `${timeSync.offsetMs > 0 ? '+' : ''}${timeSync.offsetMs} ms`]);
    if (timeSync.lastSyncAgoS != null) syncRows.push(['Dernière mise à jour', `il y a ${formatAgo(timeSync.lastSyncAgoS * 1000)}`]);
    if (Math.abs(clockOffsetS) >= 2) syncRows.push(['Écart avec cet appareil', `${clockOffsetS > 0 ? '+' : ''}${clockOffsetS} s`, true]);
  }

  const reflectors = reflectorState ? reflectorState.reflectors : [];
  const mainReflector = reflectors.find(r => r.status === 'up') || reflectors[0] || null;
  const mainStatus = mainReflector ? (REFLECTOR_STATUS[mainReflector.status] || REFLECTOR_STATUS.unknown) : null;
  const connectedFor = mainReflector && mainReflector.status === 'up' && mainReflector.since ? formatAgo(nowMs - mainReflector.since) : '';
  const lastHeard = reflectorState && Array.isArray(reflectorState.lastHeard) ? reflectorState.lastHeard.slice(0, 6) : [];

  const refRows = [];
  if (mainReflector) {
    if (reflectors.length > 1) refRows.push(['Logique', mainReflector.name]);
    if (mainReflector.host) refRows.push(['Serveur', `${mainReflector.host}${mainReflector.port ? `:${mainReflector.port}` : ''}`]);
    const lat = mainReflector.latency;
    if (lat) {
      let latText = lat.ms === null ? 'sans réponse' : `${lat.ms} ms`;
      if (lat.ms !== null && lat.jitterMs !== null && lat.samples >= 3) latText += ` · gigue ${lat.jitterMs} ms`;
      if (lat.ms !== null && lat.lossPct > 0) latText += ` · ${lat.lossPct} % perdus`;
      refRows.push(['Latence', latText, latencyClass(lat)]);
    }
    if (mainReflector.callsign) refRows.push(['Indicatif', mainReflector.callsign]);
    if (mainReflector.status === 'up' && mainReflector.tg) refRows.push(['TG actif', String(mainReflector.tg)]);
    if (mainReflector.reconnects > 0) refRows.push(['Reconnexions', String(mainReflector.reconnects), mainReflector.reconnects > 3 ? 'refTipWarn' : '']);
    if (mainReflector.status !== 'up' && mainReflector.lastError) refRows.push(['Dernière erreur', mainReflector.lastError, 'refTipWarn']);
  }
  const refHeadText = mainReflector
    ? `${mainStatus.label}${mainReflector.since ? ` depuis ${formatAgo(nowMs - mainReflector.since)}` : ''}`
    : '';

  const netRows = [];
  if (netInfo) {
    netRows.push(['Passerelle', netInfo.gateway || 'aucune', netInfo.gateway ? '' : 'netTipBad']);
    netRows.push(['Ip publique', netInfo.publicIp || 'indisponible', netInfo.publicIp ? '' : 'netTipMuted']);
    (netInfo.interfaces || []).forEach(it => {
      if (it.mac) netRows.push([`Mac ${ifaceLabel(it.name)}`, it.mac.toUpperCase(), 'netTipMono']);
    });
  }
  const wifi = netInfo && netInfo.wifi;
  const netHeadText = !netInfo
    ? (netInfoError ? 'Infos réseau indisponibles' : 'Chargement ..')
    : netInfo.gatewayDev
      ? `${internetOk ? 'Internet' : 'Sortie'} via ${ifaceLabel(netInfo.gatewayDev)}${internetOk ? '' : ' · internet injoignable'}`
      : 'Aucune route vers internet';
  const netHeadOk = !!(netInfo && netInfo.gatewayDev && internetOk);

  const rfDotColor = !isMonitoring  ? '#d9534f' : (squelchOpen ? '#4ade80' : 'orange');

  const currentRssi = rssi || 0;
  const rssiWidth = isMonitoring ? `${Math.min(100, 20 + (Math.max(0, currentRssi - 45) / (120 - 45) * 80))}%` : '18%';
  const rssiBarColor = !isMonitoring ? '#555' : (currentRssi < 46 ? '#d9534f' : (currentRssi < 80 ? 'orange' : '#4ade80'));

  return (
    <Layout version={props.version}>
      <div className="themeToggle"><ThemeToggle /></div>

      <button type="button" onClick={toggleTerminal} className="terminalBtn">Terminal</button>

      {showTerminal && (
        <div className="terminalPopup">
          <div className="terminalContent">
            <div className="terminalHeader">
              <span style={{ fontFamily: 'monospace', color: theme.textPrimary, fontSize: '16px', marginLeft: '9px', cursor: 'default' }}>Terminal</span>
              <div className={`ledSocket ${socketActive ? 'active' : ''}`} />
              <select className="terminalSelect" onChange={(e) => { const cmd = e.target.value; if (cmd) { socketRef.current.emit('termData', cmd + '\n'); e.target.value = ''; } }}>
                <option value="">Commandes ..</option> <option value="cd /opt/weblink">Repertoire</option>
                <option value="alsamixer">Son</option>
                <option value="/etc/init.d/resize2fs start">Resize</option> <option value="sa818">Sa818</option>
                <option value="weblink">WebLink</option> <option value="fuseau">Fuseau</option>
                <option value="htop">Htop</option> <option value="clear">Clear</option>
              </select>
              <button onClick={toggleTerminal} className="closeBtn">✕</button>
            </div>
            <div ref={termRef} className="termContainer" />
          </div>
        </div>
      )}

      <div className="module">
        <div className="header">
          <div className="headerLeft">
            <div className="appName">WebLink</div>
            <div className="appSub">V {props.version} · Orange Pi</div>
          </div>
          <div className="headerRight">
            <div className="clockRow">
              {timeSync && (
                <button type="button" className={`syncPill ${SYNC_CLASS[syncState]}`} aria-expanded={openPanel === 'sync'} aria-controls="syncPanel" onClick={() => togglePanel('sync')}>
                  {SYNC_LABELS[syncState]}
                </button>
              )}
              <div className="clock">{timeStr}</div>
            </div>
            <div className="date">{dateStr}</div>
          </div>
        </div>

        {openPanel === 'sync' && timeSync && (
          <div id="syncPanel" className="panel syncPanel">
            <span className={`syncTipHead ${SYNC_CLASS[syncState]}`}>
              <span className="syncTipDot" />
              {SYNC_DETAILS[syncState]}
            </span>
            {syncRows.map(([k, v, warn]) => (
              <div key={k} className="tipRow">
                <span className="tipKey">{k}</span>
                <span className={`tipVal ${warn ? 'tipWarn' : ''}`}>{v}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`banner ${internetOk ? 'bannerOk' : 'bannerWarn'}`}>
          <span className={`dot ${internetOk ? 'dotOk' : 'dotWarn'}`} />
          <span>{internetOk ? 'Système opérationnel · Connexion internet active' : '⚠️ Connexion internet indisponible'}</span>
        </div>

        <ActionsBlock />

        {mainReflector && (
          <div className="refBlock">
            <div className="refRow" role="button" tabIndex={0} aria-expanded={openPanel === 'ref'} aria-controls="refPanel" onClick={() => togglePanel('ref')} onKeyDown={panelKeyDown('ref')}>
              <svg className="refIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>
              </svg>
              <span className="refTitle">SvxLink</span>
              {chevron(openPanel === 'ref')}
              <span className="refStatus">
                <span className={`refDot ${mainStatus.cls}`} />
                <span className={`refState ${mainReflector.status === 'up' ? 'refStateUp' : ''}`}>{mainStatus.label}</span>
                {connectedFor && <span className="refSince">{connectedFor}</span>}
              </span>
            </div>

            {openPanel !== 'ref' && mainReflector.talker && (
              <div className={`refTipTalker refTalkerInline ${mainReflector.talker.self ? 'refTipTalkerSelf' : ''}`}>
                <span className="refTipTalkDot" />
                <span className="refTipCall">{mainReflector.talker.label || mainReflector.talker.call}</span>
                <span className="refTipTalkText">{mainReflector.talker.self ? 'En émission' : 'parle'}{mainReflector.talker.tg ? ` · TG ${mainReflector.talker.tg}` : ''}</span>
                {mainReflector.talker.since && <span className="refTipChrono">{formatChrono(nowMs - mainReflector.talker.since)}</span>}
              </div>
            )}

            {openPanel === 'ref' && (
              <div id="refPanel" className="refPanel">
                <div className="refTipHead">
                  <span className={`refDot ${mainStatus.cls}`} />
                  <span className={mainReflector.status === 'up' ? 'refStateUp' : ''}>{refHeadText}</span>
                </div>

                <SvxOnglets value={refTab} onChange={setRefTab} />

                {refTab !== 'direct' ? <SvxStats reflector={mainReflector} vue={refTab} /> : (<>
                {refRows.map(([k, v, cls]) => (
                  <div key={k} className="tipRow">
                    <span className="tipKey">{k}</span>
                    <span className={`tipVal ${cls || ''}`}>{v}</span>
                  </div>
                ))}

                {mainReflector.talker && (
                  <div className={`refTipTalker ${mainReflector.talker.self ? 'refTipTalkerSelf' : ''}`}>
                    <span className="refTipTalkDot" />
                    <span className="refTipCall">{mainReflector.talker.label || mainReflector.talker.call}</span>
                    <span className="refTipTalkText">{mainReflector.talker.self ? 'En émission' : 'parle'}{mainReflector.talker.tg ? ` · TG ${mainReflector.talker.tg}` : ''}</span>
                    {mainReflector.talker.since && <span className="refTipChrono">{formatChrono(nowMs - mainReflector.talker.since)}</span>}
                  </div>
                )}

                <div className="tipSection">Derniers mouvements</div>
                {lastHeard.length === 0 ? (
                  <div className="tipEmpty">Aucun ..</div>
                ) : lastHeard.map((h, i) => (
                  <div key={`${h.call}-${h.end || i}-${i}`} className="refTipStation">
                    <span className={`refTipCall ${h.self ? 'refTipSelf' : ''}`}>{h.label || h.call}</span>
                    {h.tg ? <span className="refTipTg">TG {h.tg}</span> : null}
                    <span className="refTipDur">{h.durationS != null ? formatChrono(h.durationS * 1000) : ''}</span>
                    <span className="refTipAgo">{h.end ? formatAgo(nowMs - h.end) : ''}</span>
                  </div>
                ))}

                {reflectors.length > 1 && (
                  <>
                    <div className="tipSection">Autres réseaux</div>
                    {reflectors.filter(r => r !== mainReflector).map(r => {
                      const st = REFLECTOR_STATUS[r.status] || REFLECTOR_STATUS.unknown;
                      return (
                        <div key={r.name} className="tipRow">
                          <span className="tipKey"><span className={`refDot ${st.cls}`} /> {r.name}</span>
                          <span className="tipVal">{st.label}</span>
                        </div>
                      );
                    })}
                  </>
                )}
                </>)}
              </div>
            )}
          </div>
        )}

        <div className="cards">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="cardLabel">Mémoire</div>
              <button onClick={handleClearCache} className="clearBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
            <div className="cardValue">{dynamicData.memory || '--'}</div>
            {dynamicData.memoryRaw != null && (
              <div className="cpuLoadRow">
                <span className="cpuLoadLabel">Utilisé</span>
                <div className="cpuBarTrack cpuBarTrackLoad">
                  <div className={`cpuBarFill ${dynamicData.memoryRaw.pct > 80 ? 'cpuBarCrit' : dynamicData.memoryRaw.pct > 60 ? 'cpuBarWarn' : 'cpuBarOk'}`} style={{ width: `${dynamicData.memoryRaw.pct}%` }} />
                </div>
                <span className="cpuLoadPct">{dynamicData.memoryRaw.pct}%</span>
              </div>
            )}
          </div>
          <div className="card">
            <div className="cardLabel">Cpu</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="cardValue">{dynamicData.cpuFreq || '--'}</div>
              {dynamicData.cpuFreqRaw && (
                <div className="cpuBarTrack" title={`${dynamicData.cpuFreqRaw.cur} / ${dynamicData.cpuFreqRaw.max} MHz`}>
                  <div className="cpuBarFill cpuBarFreq" style={{ width: `${Math.min(100, Math.round((dynamicData.cpuFreqRaw.cur / dynamicData.cpuFreqRaw.max) * 100))}%` }} />
                </div>
              )}
            </div>
            {dynamicData.cpuLoad != null && (
              <div className="cpuLoadRow">
                <span className="cpuLoadLabel">Charge</span>
                <div className="cpuBarTrack cpuBarTrackLoad">
                  <div className={`cpuBarFill ${dynamicData.cpuLoad > 80 ? 'cpuBarCrit' : dynamicData.cpuLoad > 50 ? 'cpuBarWarn' : 'cpuBarOk'}`} style={{ width: `${dynamicData.cpuLoad}%` }} />
                </div>
                <span className="cpuLoadPct">{dynamicData.cpuLoad}%</span>
              </div>
            )}
          </div>
          <div className={`card ${tempOk ? 'cardOk' : ''}`}>
            <div className="cardLabel">Température</div>
            <div className={`cardValue ${!tempKnown ? '' : tempOk ? 'valueOk' : 'valueWarn'}`}>{tempKnown ? dynamicData.temperature : '--'}</div>
            <div className="cardSub">{!tempKnown ? '' : tempOk ? 'normale' : 'élevée'}</div>
          </div>
        </div>

        <div className="infoTable">
          <div className="infoRow netRow" role="button" tabIndex={0} aria-expanded={openPanel === 'net'} aria-controls="netPanel" onClick={() => togglePanel('net')} onKeyDown={panelKeyDown('net')}>
            <span className="infoKey netKey">Réseau {chevron(openPanel === 'net')}</span>
            <div className="netInfoContainer">
              <div className="speedStats">
                <span className="speed down">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
                  {dynamicData.downSpeed || 0} <small>KB/s</small>
                </span>
                <span className="speed up">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  {dynamicData.upSpeed || 0} <small>KB/s</small>
                </span>
              </div>
              <span className="infoVal">{formatIpText(dynamicData.ip)}</span>
            </div>
          </div>

          {openPanel === 'net' && (
            <div id="netPanel" className="netPanel">
              <div className="netTipHead">
                <span className={`netTipDot ${netInfo ? (netHeadOk ? 'netTipDotOk' : 'netTipDotBad') : ''}`} />
                <span className={netHeadOk ? 'netTipGood' : ''}>{netHeadText}</span>
              </div>

              {netRows.map(([k, v, cls]) => (
                <div key={k} className="tipRow">
                  <span className="tipKey">{k}</span>
                  <span className={`tipVal ${cls || ''}`}>{v}</span>
                </div>
              ))}

              {wifi && (
                <>
                  <div className="tipSection">Wifi</div>
                  {wifi.connected ? (
                    <>
                      <div className="tipRow">
                        <span className="tipKey">Réseau</span>
                        <span className="tipVal">{wifi.ssid || 'masqué'}</span>
                      </div>
                      <div className="tipRow">
                        <span className="tipKey">Signal</span>
                        <span className={`tipVal ${wifiClass(wifi.signal)}`}>
                          {wifi.signal != null ? `${wifi.signal} %` : '--'}{wifi.dbm != null ? ` · ${wifi.dbm} dBm` : ''}
                        </span>
                      </div>
                      {wifi.chan && (
                        <div className="tipRow">
                          <span className="tipKey">Canal</span>
                          <span className="tipVal">{wifi.chan}{wifi.rate ? ` · ${wifi.rate}` : ''}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="tipEmpty">Non connecté à un réseau ..</div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="infoRow">
            <span className="infoKey">Uptime</span>
            <span className="infoVal">{formatUptime(dynamicData.uptime)}</span>
          </div>
          <div className="infoRow">
            <span className="infoKey">Système</span>
            <span className="infoVal">{props.osInfo || '--'}</span>
          </div>
          <div className="infoRow infoRowLast">
            <span className="infoKey">Kernel</span>
            <span className="infoVal">{props.kernel || '--'}</span>
          </div>
        </div>

        <div className="logsBlock">
          <div className="logsRow">
            <svg className="logsIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="logsLabel">Logs</span>
            <select className="logsSelect" value={selectedLog} onChange={e => setSelectedLog(e.target.value)}>
              {logFiles.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button className="logsBtn" onClick={openLog}>Ouvrir</button>
          </div>
          <DiagnosticPanel />
        </div>

        {showLogModal && ReactDOM.createPortal(
          <div className="logOverlay" onClick={() => setShowLogModal(false)}>
            <div className="logModal" onClick={e => e.stopPropagation()}>
              <div className="logModalHeader">
                <span className="logModalTitle">{selectedLog.split('/').pop()}</span>
                <div className="research">
                  <div style={{ position: 'relative', flex: 1, maxWidth: '260px', marginLeft: '8px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, pointerEvents: 'none' }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input ref={logSearchRef} type="text" placeholder="Rechercher .." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="logSearchInput" />
                    {logSearch && <button onClick={() => setLogSearch('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}>✕</button>}
                  </div>
                  {logSearch.trim() && !logLoading && (
                    <span style={{ fontSize: '12px', color: logMatchCount > 0 ? '#4ade80' : theme.accentRed, whiteSpace: 'nowrap' }}>
                      {logMatchCount > 0 ? `${logMatchCount} résultat${logMatchCount > 1 ? 's' : ''}` : 'Aucun résultat'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!logLoading && !logError && logContent && (
                    <button className="logDownloadBtn" onClick={downloadLog} title="Télécharger">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Télécharger
                    </button>
                  )}
                  <button className="closeBtn" onClick={() => setShowLogModal(false)}>✕</button>
                </div>
              </div>
              <div className="logModalBody">
                {logLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>}
                {logError  && <div className="logError">{logError}</div>}
                {!logLoading && !logError && (
                  <pre className="logPre">{renderedLogContent}</pre>
                )}
              </div>
            </div>
          </div>
        , document.body)}

        <div className="sa818Block">
          <div className="sa818Header">
            <div className="sa818TitleGroup">
              <span className="sa818Title">Sa818</span>
              {isMonitoring && sa818Config?.firmware && (
                <span className="sa818Fw">{sa818Config.firmware}</span>
              )}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={isMonitoring} onChange={e => toggleMonitoring(e.target.checked)} />
              <span className="toggleSlider" />
            </label>
          </div>

          <div className="sa818RfRow">
            <div className="sa818RfLeft">
              <span className={`rfDot ${isMonitoring && squelchOpen ? 'rfDotActive' : ''}`} style={{ backgroundColor: rfDotColor }} />
              <span className="rfLabel">
                {!isMonitoring ? 'Inactif' : squelchOpen ? 'Signal reçu' : 'En écoute'}
              </span>
              {isMonitoring && squelchOpen && (
                <span className="rfDuration">{formatDuration(sessionDuration)}</span>
              )}
            </div>
            <div className="rssiTrack" style={{ opacity: isMonitoring ? 1 : 0.3 }}>
              <div className="rssiBar" style={{ width: rssiWidth, backgroundColor: rssiBarColor }} />
            </div>
            <div className="rssiValue" style={{ color: isMonitoring && rssi !== null ? rssiBarColor : theme.textSecondary }}>
              {isMonitoring && rssi !== null ? `${rssi} dBm` : '--'}
            </div>
          </div>

          {isMonitoring && sa818Config && (
            <div className="sa818Config">
              <div className="cfgRow">
                <span className="cfgKey">Fréquence</span>
                <span className="cfgKey" style={{marginLeft: '8px' }}>Rx</span>
                <span className="cfgVal">{sa818Config.freq_rx} MHz</span>
                <span className="cfgKey">Tx</span>
                <span className="cfgVal">{sa818Config.freq_tx} MHz</span>
              </div>
              <div className="cfgRow">
                <span className="cfgKey">Bande passante</span>
                <span className="cfgVal">{formatBandwidth(sa818Config.bandwidth)}</span>
              </div>
              <div className="cfgRow">
                <span className="cfgKey">Squelch</span>
                <span className="cfgVal">{sa818Config.squelch}</span>
              </div>
              <div className="cfgRow">
                <span className="cfgKey">Ctcss</span>
                <span className="cfgKey" style={{marginLeft: '104px'}}>Rx</span>
                <span className="cfgVal">{formatCtcss(sa818Config.ctcss_rx)}</span>
                <span className="cfgKey">Tx</span>
                <span className="cfgVal">{formatCtcss(sa818Config.ctcss_tx)}</span>
              </div>
              {sa818Config.volume !== undefined && (
                <div className="cfgRow cfgRowLast">
                  <span className="cfgKey">Volume</span>
                  <span className="cfgVal">{sa818Config.volume} / 8</span>
                </div>
              )}
            </div>
          )}
          {isMonitoring && isConfigLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="spinner" /></div>
          )}
        </div>

        <div className="storageBlock">
          <div className="storageRow">
            <span className="storageLabel">Stockage</span>
            {storageData ? (
              <div className="storageInfo">
                <span className="storageUsed">{storageData.used} Go</span>
                <span className="storageSep">/</span>
                <span className="storageTotal">{storageData.total} Go</span>
                <div className="storageTrack">
                  <div className={`storageFill ${storageData.pct > 85 ? 'storageFillCrit' : storageData.pct > 65 ? 'storageFillWarn' : 'storageFillOk'}`} style={{ width: `${storageData.pct}%` }} />
                </div>
                <span className="storagePct">{storageData.pct}%</span>
              </div>
            ) : (
              <span className="storageUsed" style={{ marginLeft: 'auto' }}>--</span>
            )}
            <button className="resizeBtn" onClick={startResize} title="Étendre Micro Sd"> Étendre </button>
          </div>
          {storageData && storageData.availMo != null && (storageData.availMo < 200 || (storageData.inodesLibres != null && storageData.inodesLibres < 4096)) && (
            <div style={{ marginTop: '8px', fontSize: '12.8px', color: theme.accentYellow }}>
              ⚠️ {storageData.availMo < 200 ? `Place faible : ${storageData.availMo} Mo libres` : `Carte presque saturée en fichiers : ${storageData.inodesLibres} restants`}{storageData.extensibleMo > 64 ? ` · cliquez sur Étendre pour récupérer ${storageData.extensibleMo >= 1024 ? `${(storageData.extensibleMo / 1024).toFixed(1).replace('.', ',')} Go` : `${storageData.extensibleMo} Mo`}` : ' · carte déjà à sa taille maximale'}
            </div>
          )}
        </div>

        {hotspots.length > 1 && (
          <div className="hotspotsBlock">
            <div className="hotspotsHeader">
              <svg className="hotspotsIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
              <span className="hotspotsTitle">Hotspots sur ce réseau</span>
              <span className="hotspotsCount">{hotspots.length}</span>
            </div>
            {hotspots.map((h, i) => (
              <div key={h.host} className={`hotspotRow ${i === hotspots.length - 1 ? 'hotspotRowLast' : ''}`}>
                <div className="hotspotId">
                  <span className={`hotspotDot ${h.self ? 'hotspotDotSelf' : ''}`} />
                  <a className="hotspotLink hotspotName" href={hotspotUrl(h.host, h.port)}>{h.host}</a>
                  {h.self && <span className="hotspotTag hotspotTagSelf">Ce hotspot</span>}
                  {h.alias && <span className="hotspotTag">weblink.local</span>}
                </div>
                <a className="hotspotLink hotspotIp" href={hotspotUrl(h.ip, h.port)}>{h.ip}</a>
              </div>
            ))}
          </div>
        )}

        {showResizeModal && ReactDOM.createPortal(
          <div className="logOverlay" onClick={closeResizeModal}>
            <div className="logModal" onClick={e => e.stopPropagation()}>
              <div className="logModalHeader">
                <span className="logModalTitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {resizeRunning && <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />}
                  Extension de la carte micro Sd
                </span>
                <button className="closeBtn" onClick={closeResizeModal}>✕</button>
              </div>
              <div className="logModalBody" ref={resizeLogRef}>
                {resizeDone ? (
                  <>
                    <pre className="logPre">{resizeLog.split('\n').slice(0, -2).join('\n')}</pre>
                    <pre className="logPre logFinished">{resizeLog.split('\n').slice(-2).join('\n')}</pre>
                  </>
                ) : (
                  <pre className="logPre">{resizeLog || 'En attente ..'}</pre>
                )}
              </div>
            </div>
          </div>
        , document.body)}

      </div>

<style jsx>{`

.themeToggle { position: absolute; top: 50px; right: 10px; z-index: 1000; }

.module { min-width: 350px; max-width: 562px; margin: 68px auto 0; background-color: ${theme.moduleBg}; padding: 16px 12px; border-radius: 22px; }

.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.24rem; }

.appName { font-size: 22px; font-weight: 600; color: ${theme.textPrimary}; letter-spacing: -0.3px; }

.appSub { font-size: 14.8px; color: ${theme.textSecondary}; margin-top: 2px; }

.headerRight { text-align: right; }

.clock { font-size: 22px; font-weight: 500; color: ${theme.textPrimary}; letter-spacing: -0.3px; font-variant-numeric: tabular-nums; }

.date { font-size: 14px; color: ${theme.textSecondary}; margin-top: 4px; text-transform: capitalize; }

.banner { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; font-size: 14.8px; font-weight: 500; margin-bottom: 1.25rem; }

.bannerOk { background: ${theme.isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0, 150, 0, 0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0, 150, 0, 0.3)'}; color: #4ade80; border-radius: 14px; }

.bannerWarn { background: ${theme.isDark ? 'rgba(251, 36, 36, 0.1)' : 'rgba(200, 0, 0, 0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(255, 0, 0, 0.3)' : 'rgba(200, 0, 0, 0.3)'}; color: ${theme.accentRed}; }

.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.dotOk { background: #4ade80; animation: pulse 2.4s ease-in-out infinite; }

.dotWarn { background: ${theme.accentRed}; }

@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }

.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 1rem; }

.card { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 8px 10px; }

.cardOk { border-color: ${theme.isDark ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0, 150, 0, 0.2)'}; }

.cardLabel { font-size: 14.8px; color: ${theme.textPrimary}; letter-spacing: 0.06em; margin-bottom: 8px; }

.cardValue { font-size: 16px; font-weight: 500; color: ${theme.textSecondary}; line-height: 1.2; }

.cardSub { font-size: 12.8px; color: ${theme.textSecondary}; margin-top: 3px; }

.valueOk  { color: #4ade80; }

.valueWarn { color: ${theme.accentYellow}; }

.infoTable { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; overflow: hidden; }

.infoRow { display: flex; justify-content: space-between; align-items: baseline; padding: 8.8px 16px; border-bottom: 0.6px solid ${theme.cardBorder}; gap: 12px; }

.infoRowLast { border-bottom: none; }

.infoKey { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; }

.infoVal { font-size: 14.8px; color: ${theme.textSecondary}; text-align: right; }

.netInfoContainer { display: flex; align-items: flex-end; }

.speedStats { display: flex; gap: 6px; margin: 2px 10px; }

.speed { display: flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; font-family: tabular-nums; }

.speed.down { color: #4ade80; }

.speed.up { color: #4ade80; }

.speed small { font-size: 12px; opacity: 0.8; font-weight: 460;}

.logsBlock { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 10px 16px; margin-top: 1rem; }

.logsRow { display: flex; align-items: center; gap: 10px; }

.logsIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.logsLabel { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; }

.logsSelect { flex: 1; background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textPrimary}; font-size: 13.6px; padding: 4px 16px; outline: none; cursor: pointer; appearance: none; text-align: center; }

.logsSelect:focus { border-color: #4ade80; }

.logsSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.logsBtn { background: ${theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(0,150,0,0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.3)' : 'rgba(0,150,0,0.3)'}; color: #4ade80; border-radius: 8px; font-size: 13.6px; padding: 2px 12px; cursor: pointer; transition: all 0.18s; flex-shrink: 0; }

.logsBtn:hover { background: #4ade80; color: white; }

.logsBtn:active { transform: scale(0.95); }

.logOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 3000; backdrop-filter: blur(3px); }

.logModal { background: ${theme.moduleBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 20px; width: min(720px, 92vw); max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 8px 60px rgba(0,0,0,0.4); overflow: hidden; }

.logModalHeader { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 0.6px solid ${theme.cardBorder}; flex-shrink: 0; }

.logModalTitle { font-size: 14.8px; font-weight: 600; color: ${theme.textPrimary}; font-family: monospace; }

.logDownloadBtn { display: flex; align-items: center; gap: 6px; background: ${theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(0,150,0,0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.3)' : 'rgba(0,150,0,0.3)'}; color: #4ade80; border-radius: 8px; font-size: 12.8px; padding: 2px 8px; cursor: pointer; transition: all 0.18s; margin-right: 12px; }

.logDownloadBtn:hover { background: #4ade80; color: white; }

.research { display: flex; gap: 8px; alignItems: center; flex: 1; margin: 0 12px; }

.logSearchInput { width: 100%; background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textPrimary}; font-size: 13px; padding: 2px 24px; outline: none; transition: border-color 0.14s; height: 26px; }

.logSearchInput:focus { border-color: #4ade80; }

.logSearchInput::placeholder { color: ${theme.textSecondary}; }

.logModalBody { overflow-y: auto; flex: 1; padding: 14px 18px; }

.logPre { font-family: monospace; font-size: 12.4px; color: ${theme.textSecondary}; white-space: pre-wrap; word-break: break-all; line-height: 1.55; margin: 0; }

.logError { color: ${theme.accentRed}; font-size: 14px; padding: 20px 0; text-align: center; }

.logFinished { color: #4ade80 !important; font-weight: 688; padding-bottom: 4px; }

.sa818Block { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; overflow: hidden; margin-top: 1rem; padding: 4px 16px 0; }

.sa818Header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }

.sa818TitleGroup { display: flex; align-items: center; gap: 10px; }

.sa818Title { font-size: 15px; font-weight: 600; color: ${theme.textPrimary}; }

.sa818Fw { font-size: 11.6px; color: ${theme.textSecondary}; background: ${theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}; padding: 2px 7px; border-radius: 6px; }

.toggle { position: relative; display: inline-block; width: 36px; height: 18px; cursor: pointer; margin: 0; }

.toggle input { opacity: 0; width: 0; height: 0; }

.toggleSlider { position: absolute; inset: 0; background: ${theme.isDark ? 'rgba(118, 120, 128, 0.88)' : 'rgba(162, 162, 162, 0.8)'}; border-radius: 22px; transition: background 0.24s; }

.toggleSlider:before { content: ''; position: absolute; width: 14px; height: 14px; left: 2.6px; bottom: 2px; background: white; border-radius: 50%; transition: transform 0.24s; }

.toggle input:checked + .toggleSlider { background: #4ade80; }

.toggle input:checked + .toggleSlider:before { transform: translateX(16px); }

.sa818RfRow { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.sa818RfLeft { display: flex; align-items: center; gap: 10px; margin-left: 30px; }

.rfDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; transition: background 0.28s; margin-top: 4px; }

.rfDotActive { animation: rfPulse 1s ease-in-out infinite; }

@keyframes rfPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 50% { opacity: 0.8; box-shadow: 0 0 0 5px rgba(74,222,128,0); } }

.rfLabel { font-size: 14px; color: ${theme.textSecondary}; }

.rfDuration { font-size: 12px; color: #4ade80; background: rgba(74,222,128,0.1); padding: 1px 7px; border-radius: 6px; font-variant-numeric: tabular-nums; }

.rssiValue { font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; transition: color 0.28s; margin-right: 80px; }

.rssiTrack { height: 4.4px; background: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 4px; overflow: hidden; margin-top: 6px; transition: opacity 0.4s; width: 126px; position: absolute; left: 38.7%; }

.rssiBar { height: 100%; border-radius: 4px; transition: width 0.34s ease-in-out, background-color 0.35s; }

.sa818Config { border-top: 0.6px solid ${theme.cardBorder}; display: flex; flex-direction: column; gap: 0; padding: 0 14px; }

.cfgRow { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 0.6px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; }

.cfgRowLast { border-bottom: none; }

.cfgKey { font-size: 13.6px; color: ${theme.textPrimary}; }

.cfgVal { font-size: 13.6px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; }

.spinner { width: 18px; height: 18px; border: 2.6px solid rgba(74,222,128,0.2); border-radius: 50%; border-top-color: #4ade80; animation: spin 1s ease-in-out infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

.clearBtn { background: ${theme.isDark ? 'rgba(118, 120, 128, 0.48)' : 'rgba(162, 162, 162, 0.6)'}; border: none; color: ${theme.textSecondary}; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; transition: all 0.2s; margin:-8px 0 0 6px; }

.clearBtn:hover { color: #4ade80; background: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; transform: scale(1.1); }

.clearBtn:active { transform: scale(0.9); }

.cpuBarTrack { height: 4px; background: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 4px; overflow: hidden; margin-left: 4px; width: 66px; }

.cpuBarTrackLoad { flex: 1; margin-top: 0; }

.cpuBarFill { height: 100%; border-radius: 4px; transition: width 0.5s ease-in-out, background-color 0.5s; }

.cpuBarFreq { background: ${theme.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'}; }

.cpuBarOk { background: #4ade80; }

.cpuBarWarn { background: ${theme.accentYellow}; }

.cpuBarCrit { background: ${theme.accentRed}; }

.cpuLoadRow { display: flex; align-items: center; gap: 6px; margin-top: 6px; }

.cpuLoadLabel { font-size: 12px; color: ${theme.textSecondary}; flex-shrink: 0; }

.cpuLoadPct { font-size: 12px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 28px; text-align: right; }

.terminalBtn { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 999; background: ${theme.moduleBg}; color: ${theme.textPrimary}; border-top-color: transparent; border: 1px solid #4ade80; border-radius: 0 0 10px 10px; cursor: pointer; padding: 2px 8px; font-size: 14.8px; transition: all 0.14s; }

.terminalBtn:hover { background: #4ade80; color: white; }

.terminalPopup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.12); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(2.8px); }

.terminalContent { background-color: ${theme.moduleBg}; padding: 10px; border-radius: 22px; box-shadow: 0 0 60px rgba(255, 255, 255, 0.28); }

.terminalHeader { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.termContainer { width: 368px; height: 462px; position: relative; overflow: hidden; background-color: rgba(0, 0, 0, 0.4); border-radius: 16px; }

.terminalSelect { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textPrimary}; font-size: 14.8px; outline: none; text-align-last: center; height: 22px; cursor: pointer; appearance: none; padding: 0 4px; margin: 0 16px 0 auto; width: 142px; }

.terminalSelect:focus { border-color: #4ade80; }

.terminalSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.terminalSelect:hover { background: ${theme.hoverBg}; }

.ledSocket { width: 8px; height: 8px; background: black; border-radius: 50%; transition: all 0.04s; margin-left: 6px; }

.ledSocket.active { background: #4ade80; box-shadow: 0 0 14px #d9534f; }

.closeBtn { background: none; border: none; color: #4ade80; font-size: 26.8px; cursor: pointer; padding: 0 4px; border-radius: 8px; transition: background 0.14s; height: 0; margin: -34px 4px 0; }

.closeBtn:hover { background: ${theme.cardBorder}; }

:global(.xterm) { padding: 10px !important; }

:global(.xterm-viewport) { border-radius: 10px !important; }

:global(.xterm-helpers) { position: absolute !important; top: -9999px !important; left: -9999px !important; opacity: 0 !important; }

:global(.xterm-rows) { color: #eeeeeeff !important; }

:global(.notification:not(.error)) { background-color: #4ade80 !important; color: white !important; }

:global(.notification.error) { background-color: ${theme.accentRed} !important; color: white !important; }

.storageBlock { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 10px 16px; margin-top: 1rem; }

.storageRow { display: flex; align-items: center; gap: 10px; }

.storageIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.storageLabel { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; }

.storageInfo { display: flex; align-items: center; gap: 5px; flex: 1; }

.storageUsed { font-size: 14px; font-weight: 600; color: ${theme.textPrimary}; font-variant-numeric: tabular-nums; }

.storageSep { font-size: 13px; color: ${theme.textSecondary}; }

.storageTotal { font-size: 13px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; }

.storageTrack { flex: 1; height: 4.4px; background: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 4px; overflow: hidden; min-width: 40px; }

.storageFill { height: 100%; border-radius: 4px; transition: width 0.5s ease-in-out, background-color 0.5s; }

.storageFillOk { background: #4ade80; }

.storageFillWarn { background: ${theme.accentYellow}; }

.storageFillCrit { background: ${theme.accentRed}; }

.storagePct { font-size: 12.8px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; min-width: 30px; text-align: right; }

.resizeBtn { background: ${theme.isDark ? 'rgba(74,222,128,0.10)' : 'rgba(0,150,0,0.08)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.28)' : 'rgba(0,150,0,0.28)'}; color: #4ade80; border-radius: 8px; font-size: 13px; padding: 2px 6px; cursor: pointer; transition: all 0.18s; flex-shrink: 0; display: flex; align-items: center; gap: 8px; }

.resizeBtn:hover { background: #4ade80; color: white; }

.resizeBtn:active { transform: scale(0.95); }

.hotspotsBlock { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; margin-top: 1rem; overflow: hidden; }

.hotspotsHeader { display: flex; align-items: center; gap: 10px; padding: 10px 16px 4px; }

.hotspotsIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.hotspotsTitle { font-size: 14.8px; color: ${theme.textPrimary}; }

.hotspotsCount { font-size: 12px; color: #4ade80; background: rgba(74,222,128,0.1); padding: 0 8px; border-radius: 6px; font-variant-numeric: tabular-nums; }

.hotspotRow { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px 10px; padding: 10px 16px; border-bottom: 0.6px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; }

.hotspotRowLast { border-bottom: none; }

.hotspotId { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; min-width: 0; }

.hotspotDot { width: 8px; height: 8px; border-radius: 50%; background: ${theme.textSecondary}; opacity: 0.6; flex-shrink: 0; }

.hotspotDotSelf { background: #4ade80; opacity: 1; }

.hotspotTag { font-size: 11px; color: ${theme.textSecondary}; background: ${theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }

.hotspotTagSelf { color: #4ade80; background: rgba(74,222,128,0.1); }

.hotspotLink { font-size: 14px; color: ${theme.textSecondary}; text-decoration: none; padding: 4px 0; border-bottom: 0.6px dashed transparent; transition: color 0.14s, border-color 0.14s; }

.hotspotLink:active { color: #4ade80; border-bottom-color: #4ade80; }

.hotspotName { font-size: 14px; font-weight: 600; color: ${theme.textPrimary}; }

.hotspotIp { margin-left: auto; font-variant-numeric: tabular-nums; }

@keyframes panelIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

.panel { display: flex; flex-direction: column; gap: 6px; background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 8px 14px 10px; animation: panelIn 0.14s ease-out; }

.tipRow { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; font-size: 13px; }

.tipKey { display: inline-flex; align-items: center; gap: 8px; color: ${theme.textSecondary}; white-space: nowrap; flex-shrink: 0; }

.tipVal { color: ${theme.textPrimary}; font-variant-numeric: tabular-nums; text-align: right; overflow-wrap: anywhere; min-width: 0; }

.tipWarn, .refTipWarn, .netTipWarn { color: ${theme.accentYellow}; }

.refTipGood, .netTipGood { color: #4ade80; }

.refTipBad, .netTipBad { color: ${theme.accentRed}; }

.tipSection { font-size: 12px; letter-spacing: 0.04em; color: ${theme.textSecondary}; margin-top: 6px; padding-top: 8px; border-top: 0.6px solid ${theme.cardBorder}; }

.tipEmpty { font-size: 13px; color: ${theme.textSecondary}; font-style: italic; }

.clockRow { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }

.syncPill { display: inline-flex; align-items: center; font: inherit; font-size: 12px; font-weight: 500; line-height: 1.6; padding: 1px 8px; border-radius: 10px; white-space: nowrap; cursor: pointer; border: 0.6px solid transparent; -webkit-tap-highlight-color: transparent; }

.syncPill:active { transform: scale(0.96); }

.syncPill:focus-visible { outline: 1.6px solid #4ade80; outline-offset: 2px; }

.syncOk { color: #4ade80; background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.28); }

.syncDrift, .syncStale { color: ${theme.accentYellow}; background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.3); }

.syncDrift { animation: pulse 1.4s ease-in-out infinite; }

.syncNoSync { color: ${theme.accentRed}; background: rgba(217,83,79,0.1); border-color: rgba(217,83,79,0.3); }

.syncUnknown { color: ${theme.textSecondary}; background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; }

.syncPanel { margin: -0.5rem 0 1.25rem; }

.syncTipHead { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; padding-bottom: 6px; margin-bottom: 2px; border-bottom: 0.6px solid ${theme.cardBorder}; background: none !important; border-radius: 0; animation: none !important; }

.syncTipDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: currentColor; }

.syncTipHead.syncDrift .syncTipDot { animation: pulse 1.4s ease-in-out infinite; }

.refBlock { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; padding: 10px 14px; margin-bottom: 1rem; }

.refRow { display: flex; align-items: center; gap: 8px; cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; user-select: none; }

.refRow:active { opacity: 0.8; }

.refRow:focus-visible { box-shadow: 0 0 0 1.4px #4ade80; border-radius: 8px; }

.refIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.refTitle { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; }

.refStatus { display: flex; align-items: center; gap: 8px; margin-left: auto; min-width: 0; }

.refDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.refDotUp { background: #4ade80; }

.refDotWait { background: ${theme.accentYellow}; animation: pulse 1.4s ease-in-out infinite; }

.refDotDown { background: ${theme.accentRed}; }

.refDotIdle { background: ${theme.textSecondary}; opacity: 0.6; }

.refState { font-size: 14px; color: ${theme.textSecondary}; white-space: nowrap; }

.refStateUp { color: #4ade80; }

.refSince { font-size: 12.4px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; white-space: nowrap; background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; padding: 1px 6px; border-radius: 6px; }

.refPanel { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 0.6px solid ${theme.cardBorder}; animation: panelIn 0.14s ease-out; }

.refTipHead { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: ${theme.textSecondary}; padding-bottom: 4px; }

.refTipTalker { display: flex; align-items: center; gap: 8px; margin-top: 4px; padding: 4px 8px; border-radius: 8px; font-size: 14px; color: ${theme.textPrimary}; background: rgba(74,222,128,0.1); border: 0.6px solid rgba(74,222,128,0.28); }

.refTalkerInline { margin-top: 8px; animation: panelIn 0.14s ease-out; }

.refTipTalkerSelf { background: rgba(217,83,79,0.1); border-color: rgba(217,83,79,0.3); }

.refTipTalkDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: #4ade80; animation: rfPulse 1s ease-in-out infinite; }

.refTipTalkerSelf .refTipTalkDot { background: ${theme.accentRed}; }

.refTipTalkText { color: ${theme.textSecondary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

.refTipChrono { margin-left: auto; font-variant-numeric: tabular-nums; color: ${theme.textSecondary}; }

.refTipStation { display: flex; align-items: baseline; gap: 10px; font-size: 13px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; }

.refTipCall { font-weight: 600; color: ${theme.textPrimary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

.refTipSelf { color: ${theme.accentRed}; }

.refTipTg { white-space: nowrap; }

.refTipDur { margin-left: auto; white-space: nowrap; }

.refTipAgo { min-width: 52px; text-align: right; white-space: nowrap; }

.netRow { cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; user-select: none; }

.netRow:active { background: ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}; }

.netRow:focus-visible { box-shadow: inset 0 0 0 1.4px #4ade80; border-radius: 14px 14px 0 0; }

.netKey { display: inline-flex; align-items: center; gap: 6px; }

.netPanel { display: flex; flex-direction: column; gap: 6px; padding: 8px 16px 10px; background: ${theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'}; border-bottom: 0.6px solid ${theme.cardBorder}; animation: panelIn 0.14s ease-out; }

.netTipHead { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; color: ${theme.textSecondary}; padding-bottom: 4px; }

.netTipDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: ${theme.textSecondary}; opacity: 0.6; }

.netTipDotOk { background: #4ade80; opacity: 1; }

.netTipDotBad { background: ${theme.accentRed}; opacity: 1; }

.netTipMono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.4px; letter-spacing: 0.02em; }

.netTipMuted { color: ${theme.textSecondary}; font-style: italic; }

@media (max-width: 400px) { .research { display: none; } }

@media (prefers-reduced-motion: reduce) {
  .syncDrift, .syncTipDot, .refDotWait, .refTipTalkDot, .panel, .refPanel, .netPanel, .refTalkerInline { animation: none !important; }
}

`}</style>

    </Layout>
  )
}

Index.getInitialProps = async function () {
  const json = url => fetch(url).then(res => res.json()).catch(() => ({}));
  const text = url => fetch(url).then(res => (res.ok ? res.text() : '')).catch(() => '');
  const [stats, osInfo, kernel, version] = await Promise.all([
    json('/api/stats'),
    text('/api/osInfo'),
    text('/api/kernel'),
    text('/api/version')
  ]);
  return { ...stats, osInfo, kernel, version };
};

export default Index