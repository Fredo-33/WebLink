import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from './themeContext';
import { Notif } from './notif';

const deux = n => String(n).padStart(2, '0');

function copier(texte) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texte);
  return new Promise((resolve, reject) => {
    const zone = document.createElement('textarea');
    zone.value = texte;
    zone.setAttribute('readonly', '');
    zone.style.position = 'fixed';
    zone.style.opacity = '0';
    document.body.appendChild(zone);
    zone.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(zone);
    if (ok) resolve(); else reject(new Error());
  });
}

export default function DiagnosticPanel() {
  const { theme } = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState('attente');
  const [diag, setDiag] = useState(null);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [envoi, setEnvoi] = useState('attente');
  const [erreurEnvoi, setErreurEnvoi] = useState('');
  const enCours = useRef(false);

  const lancer = () => {
    if (enCours.current) return;
    enCours.current = true;
    setOuvert(true);
    setEtat('analyse');
    setEnvoi('attente');
    setErreurEnvoi('');
    window.fetch('/api/diag', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setDiag(d); setEtat('pret'); })
      .catch(() => setEtat('erreur'))
      .finally(() => { enCours.current = false; });
  };

  const fermer = () => { if (envoi !== 'envoi') setOuvert(false); };

  useEffect(() => {
    if (!ouvert) return undefined;
    const onKey = e => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ouvert, envoi]);

  const nomFichier = () => {
    const d = new Date(diag ? diag.at : Date.now());
    return `diagnostic_${diag && diag.hotspot ? diag.hotspot : 'weblink'}_${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}_${deux(d.getHours())}h${deux(d.getMinutes())}.txt`;
  };

  const telecharger = () => {
    const url = URL.createObjectURL(new Blob([diag.texte], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier();
    a.click();
    URL.revokeObjectURL(url);
  };

  const copierRapport = () => {
    copier(diag.texte).then(() => Notif.info('Rapport copié !!')).catch(() => Notif.error('Copie impossible, utilisez Télécharger'));
  };

  const envoyer = () => {
    setEnvoi('envoi');
    setErreurEnvoi('');
    window.fetch('/api/diag/envoyer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, contact }) })
      .then(r => r.json().catch(() => ({})).then(d => { if (!r.ok) throw new Error(d.error || 'Envoi impossible'); }))
      .then(() => { setEnvoi('envoye'); setMessage(''); })
      .catch(err => { setEnvoi('attente'); setErreurEnvoi(err.message || 'Envoi impossible'); });
  };

  const bilan = diag && Array.isArray(diag.bilan) ? diag.bilan : [];
  const nbProblemes = bilan.filter(b => b.niveau === 'probleme').length;
  const nbAttention = bilan.filter(b => b.niveau === 'attention').length;
  const resume = !diag ? '' : nbProblemes ? `${nbProblemes} problème${nbProblemes > 1 ? 's' : ''} détecté${nbProblemes > 1 ? 's' : ''}` : nbAttention ? `${nbAttention} point${nbAttention > 1 ? 's' : ''} à surveiller` : 'Tout est en ordre';

  return (
    <>
      <div className="diagRow">
        <svg className="diagIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <span className="diagLabel">Diagnostic</span>
        <span className="diagHint">Bilan hotspot, pour diagnostic, à envoyer ..</span>
        <button type="button" className="diagBtn" onClick={lancer}>Lancer</button>
      </div>

      {ouvert && ReactDOM.createPortal(
        <div className="voile" onClick={fermer}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="titreDiag" onClick={e => e.stopPropagation()}>
            <div className="entete">
              <span id="titreDiag" className="titre">Diagnostic</span>
              {diag && etat === 'pret' && <span className="sousTitre">{diag.hotspot} · {new Date(diag.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
              <button type="button" className="croix" onClick={fermer} aria-label="Fermer">✕</button>
            </div>

            <div className="corps">
              {etat === 'analyse' && (
                <div className="analyse"><span className="rond" /> Analyse du hotspot ..</div>
              )}
              {etat === 'erreur' && (
                <div className="analyse erreur">Diagnostic impossible ..</div>
              )}
              {etat === 'pret' && diag && (
                <>
                  <div className={`resume ${nbProblemes ? 'resumeProbleme' : nbAttention ? 'resumeAttention' : 'resumeOk'}`}>{resume}</div>

                  <div className="bilan">
                    {bilan.map((b, i) => (
                      <div key={i} className="point">
                        <span className={`pastille ${b.niveau}`} />
                        <span className="pointTexte">{b.texte}</span>
                      </div>
                    ))}
                  </div>

                  <details className="details">
                    <summary>Rapport complet</summary>
                    <pre className="rapport">{diag.texte}</pre>
                  </details>

                  {envoi === 'envoye' ? (
                    <div className="envoye">✓ Diagnostic envoyé, merci !!</div>
                  ) : (
                    <div className="formulaire">
                      <textarea className="champ" rows={4} maxLength={2000} placeholder="Décrivez le problème (facultatif) .." value={message} onChange={e => setMessage(e.target.value)} />
                      <input className="champ" type="text" maxLength={200} placeholder="Votre indicatif ou e-mail pour la réponse .." value={contact} onChange={e => setContact(e.target.value)} />
                      {erreurEnvoi && <div className="erreurEnvoi">{erreurEnvoi}</div>}
                    </div>
                  )}
                </>
              )}
            </div>

            {etat === 'pret' && diag && (
              <div className="actions">
                <button type="button" className="bouton" onClick={copierRapport}>Copier</button>
                <button type="button" className="bouton" onClick={telecharger}>Télécharger</button>
                {envoi !== 'envoye' && (
                  <button type="button" className="bouton boutonVert" onClick={envoyer} disabled={envoi === 'envoi'}>
                    {envoi === 'envoi' ? <><span className="mini" /> Envoi ..</> : 'Envoyer'}
                  </button>
                )}
              </div>
            )}
            {etat === 'erreur' && (
              <div className="actions">
                <button type="button" className="bouton boutonVert" onClick={lancer}>Réessayer</button>
              </div>
            )}
          </div>
        </div>
      , document.body)}

<style jsx>{`

.diagRow { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding-top: 10px; border-top: 0.6px solid ${theme.cardBorder}; }

.diagIcon { width: 16px; height: 16px; color: ${theme.textSecondary}; flex-shrink: 0; }

.diagLabel { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; }

.diagHint { flex: 1; font-size: 12.4px; color: ${theme.textSecondary}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

.diagBtn { background: ${theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(0,150,0,0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.3)' : 'rgba(0,150,0,0.3)'}; color: #4ade80; border-radius: 8px; font: inherit; font-size: 13.6px; padding: 2px 12px; cursor: pointer; transition: all 0.18s; flex-shrink: 0; }

.diagBtn:hover { background: #4ade80; color: white; }

.diagBtn:active { transform: scale(0.95); }

.voile { position: fixed; inset: 0; background: rgba(0,0,0,0.42); display: flex; justify-content: center; align-items: center; z-index: 3000; backdrop-filter: blur(4px); }

.fenetre { display: flex; flex-direction: column; width: min(560px, calc(100vw - 24px)); max-height: 86vh; background: ${theme.moduleBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 20px; box-shadow: 0 8px 60px rgba(0,0,0,0.4); overflow: hidden; animation: entree 0.16s ease-out; }

@keyframes entree { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }

.entete { display: flex; align-items: baseline; gap: 12px; padding: 14px 18px 10px; border-bottom: 0.6px solid ${theme.cardBorder}; }

.titre { font-size: 16px; font-weight: 600; color: ${theme.textPrimary}; }

.sousTitre { font-size: 12.4px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }

.croix { margin-left: auto; background: none; border: none; color: #4ade80; font-size: 16px; cursor: pointer; padding: 0 6px; border-radius: 8px; }

.croix:hover { background: ${theme.cardBorder}; }

.corps { overflow-y: auto; padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; }

.analyse { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 28px 0; font-size: 14px; color: ${theme.textSecondary}; }

.erreur { color: ${theme.accentRed}; }

.rond { width: 16px; height: 16px; border: 2.4px solid rgba(74,222,128,0.2); border-top-color: #4ade80; border-radius: 50%; animation: tourne 1s linear infinite; }

@keyframes tourne { to { transform: rotate(360deg); } }

.resume { font-size: 14.8px; font-weight: 600; padding: 6px 12px; border-radius: 10px; }

.resumeOk { color: #4ade80; background: rgba(74,222,128,0.1); border: 0.6px solid rgba(74,222,128,0.3); }

.resumeAttention { color: ${theme.accentYellow}; background: rgba(251,191,36,0.1); border: 0.6px solid rgba(251,191,36,0.3); }

.resumeProbleme { color: ${theme.accentRed}; background: rgba(217,83,79,0.12); border: 0.6px solid rgba(217,83,79,0.34); }

.bilan { display: flex; flex-direction: column; gap: 6px; }

.point { display: flex; align-items: baseline; gap: 10px; font-size: 13.6px; color: ${theme.textPrimary}; }

.pastille { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; transform: translateY(-1px); }

.ok { background: #4ade80; }

.attention { background: ${theme.accentYellow}; }

.probleme { background: ${theme.accentRed}; }

.details summary { font-size: 13.6px; color: ${theme.textSecondary}; cursor: pointer; user-select: none; }

.details summary:hover { color: #4ade80; }

.rapport { margin: 8px 0 0; max-height: 34vh; overflow: auto; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,${theme.isDark ? '0.28' : '0.08'}); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11.6px; line-height: 1.5; color: ${theme.textSecondary}; white-space: pre; }

.formulaire { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 0.6px solid ${theme.cardBorder}; }

.champ { width: 100%; box-sizing: border-box; font: inherit; font-size: 13.6px; color: ${theme.textPrimary}; background: ${theme.cardBg2}; border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; padding: 6px 10px; outline: none; resize: vertical; }

.champ:focus { border-color: #4ade80; }

.champ::placeholder { color: ${theme.textSecondary}; }

.erreurEnvoi { font-size: 12.8px; color: ${theme.accentRed}; }

.envoye { font-size: 14px; color: #4ade80; text-align: center; padding: 8px 0 2px; }

.actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; padding: 12px 18px 16px; border-top: 0.6px solid ${theme.cardBorder}; }

.bouton { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 104px; height: 32px; font: inherit; font-size: 14px; color: white; background: rgba(121,122,128,0.6); border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; cursor: pointer; padding: 0 12px; white-space: nowrap; transition: background 0.14s, transform 0.1s; }

.bouton:hover { background: ${theme.hoverBg}; color: ${theme.textPrimary}; }

.boutonVert { background: #4ade80; border: none; }

.boutonVert:hover { background: #22c55e; color: white; }

.bouton:active { transform: scale(0.96); }

.bouton:disabled { opacity: 0.8; cursor: wait; }

.mini { width: 12px; height: 12px; box-sizing: border-box; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: tourne 1s linear infinite; }

@media (max-width: 480px) { .diagHint { display: none; } .bouton { min-width: 0; flex: 1; } .boutonVert { flex-basis: 100%; order: -1; height: 36px; } }

@media (prefers-reduced-motion: reduce) { .fenetre, .rond, .mini { animation: none; } }

`}</style>
    </>
  );
}
