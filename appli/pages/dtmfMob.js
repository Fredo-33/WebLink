import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Layout from '../components/LayoutMob'
import DtmfPlayer from '../lib/play-dtmf'
import fetch from '../lib/fetch'
import { Notif } from '../lib/notif'
import { useTheme, ThemeToggle } from '../lib/themeContext'

const InitialCmds = {
  'Informations':    '*',
  'Météo':           '*81#',
  'Arrêt Hotspot':   '88',
  'Heure':           '91',
  'Température':     '92',
  'Adresse ip':      '93',
  'Status connexion':'94',
  'Perroquet':       '95',
  'sep1':            '',
  'Pmr 446 MHz':     '33',
  'Bac à Sable':     '34',
  'sep2':            '',
  'Réseau 2 ':       '36',
  'Réseau 3 ':       '37',
  'Réseau 4 ':       '38',
  'sep3':            '',
  'Ri49 ':           '49',
  'sep4':            '',
  'Girondin ':       '66',
  'sep5':            '',
  'Rrf':             '96',
  'Technique ':      '98',
  'Bavardage ':      '100',
};

const confirmCodes = { '88': 'Arrêt Hotspot' };

function Dtmf(props) {
  const { theme } = useTheme();
  const [display, setDisplay]         = useState(props.callsign || 'WEBLINK');
  const [cmds, setCmds]               = useState(InitialCmds);
  const [activeRow, setActiveRow]     = useState(null);
  const [confirmCode, setConfirmCode] = useState(null);

  const dtmfPlayer = useRef(null);
  const isSending  = useRef(false);
  const flashTimer = useRef(null);
  const lockTimer  = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      dtmfPlayer.current = new DtmfPlayer();
    }
    loadConfig();
    return () => {
      clearTimeout(flashTimer.current);
      clearTimeout(lockTimer.current);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const r = await fetch('/api/configuration', { cache: 'no-store' });
      const data = await r.json();
      const replacements = { 'Réseau 2': data.res2, 'Réseau 3': data.res3, 'Réseau 4': data.res4 };
      setCmds(prev => {
        const updated = {};
        Object.entries(prev).forEach(([label, code]) => {
          const trimmed = label.trim();
          updated[replacements[trimmed] || label] = code;
        });
        return updated;
      });
    } catch (err) {
      console.error('Erreur config:', err);
    }
  };

  const executeKey = async (keyValue) => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (dtmfPlayer.current) {
      dtmfPlayer.current.play(keyValue);
      setTimeout(() => dtmfPlayer.current.stop(), 148);
    }
    try {
      await fetch(`/api/dtmf/${encodeURIComponent(keyValue)}`, { method: 'POST' });
      setDisplay(prev => {
        if (prev === props.callsign) return keyValue;
        if (prev.endsWith('#')) return prev + '-' + keyValue;
        return prev + keyValue;
      });
    } catch (e) {
      Notif.error('Erreur transmission');
    }
  };

  const fireCode = useCallback((code, rowKey) => {
    if (isSending.current) return;

    const fullCode = code === '#' ? '#' : code + '#';
    const sequence = fullCode.split('');
    const duration = sequence.length * 250;

    isSending.current = true;

    setActiveRow(rowKey);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setActiveRow(null), 380);

    sequence.forEach((char, i) => {
      setTimeout(() => executeKey(char), i * 250);
    });

    Notif.info(`Envoi de ${fullCode}`);

    clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => { isSending.current = false; }, duration + 400);
  }, []);

  const sendCode = useCallback((code, rowKey) => {
    if (isSending.current) return;
    if (confirmCodes[code]) {
      setConfirmCode({ code, rowKey, label: confirmCodes[code] });
      return;
    }
    fireCode(code, rowKey);
  }, [fireCode]);

  const handleConfirm = () => {
    if (!confirmCode) return;
    const { code, rowKey } = confirmCode;
    setConfirmCode(null);
    fireCode(code, rowKey);
  };

  const handleCancel = () => setConfirmCode(null);

  const clearDisplay = useCallback(() => {
    setDisplay(props.callsign || 'WEBLINK');
  }, [props.callsign]);

  const groups = useMemo(() => {
    const res = [];
    let current = [];
    Object.entries(cmds).forEach(([label, code]) => {
      if (label.startsWith('sep') || label.startsWith('vide')) {
        if (current.length) { res.push(current); current = []; }
      } else {
        current.push([label, code]);
      }
    });
    if (current.length) res.push(current);
    return res;
  }, [cmds]);

  return (
    <Layout version={props.version}>

      <div className="themeToggle"><ThemeToggle /></div>

      {confirmCode && (
        <div className="overlay" onClick={handleCancel}>
          <div className="box" onClick={e => e.stopPropagation()}>
            <div>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="msg">
              Confirmer l'envoi de la commande<br />
              <span className="cmd">{confirmCode.label}</span>
              <span className="codeBadge">{confirmCode.code}#</span>
            </div>
            <div className="actions">
              <button className="confirm" onClick={handleConfirm}>Confirmer</button>
              <button className="cancel" onClick={handleCancel}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="module">

        <div className="displayRow">
          <span className="displayText">
            {display.split('-').map((part, index, array) => (
              <React.Fragment key={index}>
                {part}{index < array.length - 1 && <span className="cmdSeparator"> - </span>}
              </React.Fragment>
            ))}
          </span>
          <button className="clearBtn" onClick={clearDisplay} title="Effacer l'affichage" aria-label="Effacer l'affichage">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>

        {groups.map((group, gi) => (
          <div key={`group-${gi}`} className={`infoTable ${gi === 0 ? 'firstTable' : ''} ${gi === groups.length - 1 ? 'lastTable' : ''}`} style={{ marginBottom: gi < groups.length - 1 ? '10px' : '0' }}>
            {group.map(([label, code], i) => {
              const rowKey  = `${gi}-${i}`;
              const isActive  = activeRow === rowKey;
              const isDanger  = confirmCodes[code] !== undefined;
              return (
                <div key={rowKey} className={`cmdRow${isActive ? ' cmdRowFlash' : ''}${isDanger ? ' cmdRowDanger' : ''}`} onClick={() => sendCode(code, rowKey)}>
                  <span className="cmdLabel">{label.trim()}</span>
                  <span className="cmdCode">{code}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

<style jsx>{`

.themeToggle { position: absolute; top: 50px; right: 10px; z-index: 1000; }

.module { min-width: 350px; max-width: 562px; margin: 68px auto 0; background-color: ${theme.moduleBg}; padding: 16px 12px; border-radius: 22px; }

.displayRow { text-align: center; margin-bottom: 4px; }

.displayText { font-size: 18px; font-weight: 500; color: #4ade80; letter-spacing: 0.12em; font-variant-numeric: tabular-nums; }

.clearBtn { display: inline-block; background: none; border: none; padding: 4px; border-radius: 6px; color: ${theme.textSecondary}; cursor: pointer; opacity: 0.4; transition: opacity 0.16s ease, color 0.16s ease; line-height: 0; margin-left: 28px; }

.clearBtn:hover { opacity: 1; color: #d9534f; }

.infoTable { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 14px; overflow: hidden; }

.firstTable { border-top-left-radius: 28px; border-top-right-radius: 28px; }

.lastTable { border-bottom-left-radius: 28px; border-bottom-right-radius: 28px; }

.cmdRow { display: flex; align-items: center; justify-content: space-between; padding: 6px 20px; border-bottom: 0.6px solid ${theme.cardBorder}; cursor: pointer; transition: background 0.14s ease; user-select: none; }

.cmdRow:last-child { border-bottom: none; }

.cmdRow:hover { background: ${theme.hoverBg}; }

.cmdRow:hover .cmdLabel { color: #4ade80; }

.cmdRow:hover .cmdCode  { color: #d9534f; }

.cmdRowFlash { background: ${theme.hoverBg} !important; }

.cmdRowFlash .cmdLabel { color: #4ade80 !important; transition: none !important; }

.cmdRowFlash .cmdCode  { color: #d9534f !important; transition: none !important; }

.cmdRowDanger .cmdCode { color: #d9534f; }

.cmdRowDanger:hover .cmdLabel { color: #d9534f !important; }

.cmdRowDanger:hover .cmdCode  { opacity: 1; }

.cmdCode { font-size: 14.8px; font-weight: 500; color: ${theme.textSecondary}; min-width: 40px; font-variant-numeric: tabular-nums; transition: color 0.14s ease; }

.cmdLabel { font-size: 14.8px; color: ${theme.textPrimary}; transition: color 0.14s ease; }

.cmdSeparator { color: #d9534f; font-weight: bold; }

.overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.18); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; }

.box { background: ${theme.moduleBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 22px; box-shadow: ${theme.shadow}; padding: 14px 38px; min-width: 288px; max-width: 368px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }

.msg { font-size: 13.8px; color: ${theme.textPrimary}; line-height: 1.6; }

.cmd { display: block; font-size: 14.8px; font-weight: 500; color: #d9534f; margin-top: 8px; }

.codeBadge { display: inline-block; margin-top: 4px; font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; color: ${theme.textSecondary}; background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 6px; padding: 1px 8px; margin-left: 6px; }

.actions { display: flex; gap: 22px; margin-top: 10px; width: 100%; }

.cancel { flex: 1; padding: 0; border-radius: 8px; border: 0.6px solid ${theme.cardBorder}; background: ${theme.cardBg}; color: ${theme.textPrimary}; font-size: 14px; cursor: pointer; transition: background 0.14s; }

.cancel:hover { background: ${theme.hoverBg}; }

.confirm { flex: 1; padding: 0; border-radius: 8px; border: none; background: #d9534f; color: white; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity 0.14s; height: 24px;  }

.confirm:hover { opacity: 0.86; }

.confirm:active { opacity: 0.7; }

:global(.notification:not(.error)) { background-color: #4ade80 !important; color: white !important; }

`}</style>

    </Layout>
  )
}

Dtmf.getInitialProps = async () => {
  try {
    const res = await fetch(`/api/configuration`);
    const config = await res.json();
    return { ...config, callsign: config.callsign || 'WEBLINK' };
  } catch (e) {
    return { callsign: 'WEBLINK' };
  }
};

export default Dtmf