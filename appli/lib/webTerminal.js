import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'
import { Notif } from '../lib/notif'
import { useTheme } from '../lib/themeContext'

const IDLE_MS = 2 * 60 * 1000;

const COMMANDS = [
  { label: 'Repertoire', cmd: 'cd /opt/weblink' },
  { label: 'Son', cmd: 'alsamixer' },
  { label: 'Resize', cmd: '/etc/init.d/resize2fs start' },
  { label: 'Sa818', cmd: 'sa818' },
  { label: 'WebLink', cmd: 'weblink' },
  { label: 'Fuseau', cmd: 'fuseau' },
  { label: 'Chrony', cmd: 'chronyc tracking' },
  { label: 'Htop', cmd: 'htop' },
  { label: 'Clear', cmd: 'clear' },
];

export default function WebTerminal() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const containerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    let disposed = false;
    let term = null;
    let fit = null;
    let idleTimer = null;
    let flashTimer = null;

    const socket = io({ forceNew: true });
    socketRef.current = socket;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        Notif.info('Fermeture Terminal ( inactivité 2 min )');
        setOpen(false);
      }, IDLE_MS);
    };

    const flash = () => {
      if (disposed) return;
      setActive(true);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { if (!disposed) setActive(false); }, 100);
    };

    const onTermData = data => {
      if (term) term.write(data);
      flash();
      resetIdle();
    };

    const sendSize = () => {
      if (term) socket.emit('termResize', { cols: term.cols, rows: term.rows });
    };

    const onWindowResize = () => {
      if (!fit) return;
      try { fit.fit(); sendSize(); } catch {}
    };

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('xterm'), import('xterm-addon-fit')]);
      if (disposed || !containerRef.current) return;

      term = new Terminal({
        cursorBlink: true,
        theme: { background: 'rgba(0,0,0,0.4)', foreground: '#eeeeeeff', cursor: '#4ade80', selection: '#4ade80' },
        rows: 24,
        cols: 80,
      });
      fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();
      term.focus();

      term.onData(data => { socket.emit('termData', data); flash(); resetIdle(); });
      socket.on('termData', onTermData);
      socket.emit('terminalReady');
      sendSize();

      window.addEventListener('resize', onWindowResize);
      resetIdle();
    })();

    return () => {
      disposed = true;
      clearTimeout(idleTimer);
      clearTimeout(flashTimer);
      window.removeEventListener('resize', onWindowResize);
      socket.off('termData', onTermData);
      socket.disconnect();
      socketRef.current = null;
      if (term) term.dispose();
    };
  }, [open]);

  const toggle = () => {
    setActive(false);
    setOpen(prev => !prev);
  };

  const sendCommand = e => {
    const cmd = e.target.value;
    e.target.value = '';
    if (cmd && socketRef.current) socketRef.current.emit('termData', cmd + '\n');
  };

  return (
    <>
      <button type="button" onClick={toggle} className="terminalBtn">Terminal</button>

      {open && ReactDOM.createPortal(
        <div className="terminalPopup">
          <div className="terminalContent">
            <div className="terminalHeader">
              <span className="terminalTitle">WebLink — Terminal</span>
              <div className={`ledSocket ${active ? 'active' : ''}`} />
              <select className="terminalSelect" defaultValue="" onChange={sendCommand}>
                <option value="">Commandes ..</option>
                {COMMANDS.map(c => <option key={c.cmd} value={c.cmd}>{c.label}</option>)}
              </select>
              <button type="button" onClick={toggle} className="closeBtn" aria-label="Fermer le terminal">✕</button>
            </div>
            <div ref={containerRef} className="termContainer" />
          </div>
        </div>
      , document.body)}

<style jsx>{`

.terminalBtn { position: fixed; top: 0; right: 22%; z-index: 999; background: ${theme.moduleBg}; color: ${theme.textPrimary}; border: 1px solid #4ade80; border-top-color: transparent; border-radius: 0 0 10px 10px; cursor: pointer; padding: 2px 8px; font-size: 14.8px; transition: all 0.14s; }

.terminalBtn:hover { background: #4ade80; color: white; }

.terminalPopup { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.12); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(2.8px); }

.terminalContent { background-color: ${theme.moduleBg}; padding: 10px; border-radius: 22px; box-shadow: 0 0 60px rgba(255, 255, 255, 0.28); max-width: 96vw; }

.terminalHeader { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.terminalTitle { font-family: monospace; color: ${theme.textPrimary}; font-size: 16px; margin-left: 9px; cursor: default; white-space: nowrap; }

.termContainer { width: min(762px, 92vw); height: min(462px, 70vh); position: relative; overflow: hidden; background-color: rgba(0, 0, 0, 0.4); border-radius: 16px; }

.terminalSelect { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; color: ${theme.textPrimary}; font-size: 14.8px; outline: none; text-align-last: center; height: 22px; cursor: pointer; appearance: none; padding: 0 6px; margin: 0 0 0 auto; width: 142px; }

.terminalSelect:focus { border-color: #4ade80; }

.terminalSelect:hover { background: ${theme.hoverBg}; }

.terminalSelect option { background: ${theme.moduleBg}; color: ${theme.textPrimary}; }

.ledSocket { width: 8px; height: 8px; background: black; border-radius: 50%; transition: all 0.04s; flex-shrink: 0; }

.ledSocket.active { background: #4ade80; box-shadow: 0 0 14px #d9534f; }


.closeBtn { background: none; border: none; color: #4ade80; font-size: 14px; cursor: pointer; padding: 0 4px; border-radius: 8px; transition: background 0.14s; margin-left: 40px; }

.closeBtn:hover { background: ${theme.cardBorder}; }

@media (max-width: 600px) {
  .terminalBtn { right: 50%; transform: translateX(50%); }
  .terminalTitle { display: none; }
  .closeBtn { margin-left: 8px; }
}

:global(.xterm) { padding: 10px !important; }

:global(.xterm-viewport) { border-radius: 10px !important; }

:global(.xterm-helpers) { position: absolute !important; top: -9999px !important; left: -9999px !important; opacity: 0 !important; }

:global(.xterm-rows) { color: #eeeeeeff !important; }

`}</style>
    </>
  );
}
