import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from './themeContext';

export default function Nouveautes({ hasUpdate, onInstall }) {
  const { theme } = useTheme();
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState('attente');
  const [donnees, setDonnees] = useState(null);

  const ouvrir = e => {
    e.stopPropagation();
    setOuvert(true);
    setEtat('chargement');
    window.fetch('/api/nouveautes', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setDonnees(d); setEtat('pret'); })
      .catch(() => setEtat('erreur'));
  };

  const fermer = () => setOuvert(false);

  useEffect(() => {
    if (!ouvert) return undefined;
    const onKey = e => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ouvert]);

  const versions = donnees && Array.isArray(donnees.versions) ? donnees.versions : [];
  const installable = hasUpdate && donnees && !donnees.aJour;

  return (
    <>
      <button type="button" className="aide" onClick={ouvrir} title="Quoi de neuf ?" aria-label="Quoi de neuf ?">?</button>

      {ouvert && ReactDOM.createPortal(
        <div className="voile" onClick={fermer}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="titreNouveautes" onClick={e => e.stopPropagation()}>
            <div className="entete">
              <span id="titreNouveautes" className="titre">Quoi de neuf ?</span>
              <button type="button" className="croix" onClick={fermer} aria-label="Fermer">✕</button>
            </div>

            <div className="corps">
              {etat === 'chargement' && <p className="info">Chargement ..</p>}
              {etat === 'erreur' && <p className="info infoErreur">Notes indisponibles, vérifiez la connexion internet.</p>}
              {etat === 'pret' && versions.length === 0 && <p className="info">Aucune note pour cette version.</p>}
              {etat === 'pret' && versions.map(v => (
                <div key={v.id} className="version">
                  <div className="versionTete">
                    <span className="versionNom">{v.id}</span>
                    <span className="versionDate">{v.date}</span>
                    <span className={`etiquette ${donnees.aJour ? 'etiquetteInstallee' : ''}`}>{donnees.aJour ? 'Installée' : 'Nouvelle'}</span>
                  </div>
                  {v.sections.map((s, i) => (
                    <div key={i} className="section">
                      {s.titre && <div className="sectionTitre">{s.titre}</div>}
                      {s.points.length > 0 && (
                        <ul className="points">
                          {s.points.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="actions">
              {installable && <button type="button" className="bouton boutonVert" onClick={() => { fermer(); onInstall(); }}>Mettre à jour</button>}
              <button type="button" className="bouton" onClick={fermer}>Fermer</button>
            </div>
          </div>
        </div>
      , document.body)}

<style jsx>{`

.aide { flex-shrink: 0; width: 22px; height: 22px; margin: 0; padding: 0; border-radius: 50%; font: inherit; font-size: 13.6px; font-weight: 600; line-height: 1; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #4ade80; background: ${theme.isDark ? 'rgba(74,222,128,0.12)' : 'rgba(0,150,0,0.1)'}; border: 0.6px solid ${theme.isDark ? 'rgba(74,222,128,0.4)' : 'rgba(0,150,0,0.4)'}; transition: background 0.18s, color 0.18s, transform 0.1s; -webkit-tap-highlight-color: transparent; }

.aide:hover { background: #4ade80; color: white; }

.aide:active { transform: scale(0.92); }

.voile { position: fixed; inset: 0; background: ${theme.isDark ? 'rgba(0,0,0,0.36)' : 'rgba(0,0,0,0.2)'}; display: flex; justify-content: center; align-items: center; z-index: 3000; backdrop-filter: blur(4px); }

.fenetre { display: flex; flex-direction: column; width: min(440px, calc(100vw - 32px)); max-height: 76vh; background: ${theme.isDark ? 'rgba(121,122,128,0.96)' : 'rgba(200,200,200,0.96)'}; border-radius: 22px; box-shadow: ${theme.shadow}; overflow: hidden; animation: entree 0.16s ease-out; }

@keyframes entree { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }

.entete { display: flex; align-items: center; padding: 14px 18px 10px; border-bottom: 0.6px solid ${theme.cardBorder}; }

.titre { font-size: 16px; font-weight: 600; color: ${theme.textPrimary}; }

.croix { margin-left: auto; background: none; border: none; color: #4ade80; font-size: 16px; cursor: pointer; padding: 0 6px; border-radius: 8px; }

.croix:hover { background: ${theme.cardBorder}; }

.corps { overflow-y: auto; padding: 12px 18px; display: flex; flex-direction: column; gap: 14px; text-align: left; }

.info { margin: 0; font-size: 14px; color: ${theme.textSecondary}; text-align: center; }

.infoErreur { color: ${theme.accentRed}; }

.versionTete { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; }

.versionNom { font-size: 14.8px; font-weight: 600; color: ${theme.textPrimary}; }

.versionDate { font-size: 12.8px; color: ${theme.textSecondary}; font-variant-numeric: tabular-nums; }

.etiquette { margin-left: auto; font-size: 11.6px; color: white; background: #4ade80; padding: 0 8px; border-radius: 6px; }

.etiquetteInstallee { color: ${theme.textSecondary}; background: ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}; }

.section + .section { margin-top: 8px; }

.sectionTitre { font-size: 13.6px; font-weight: 500; color: ${theme.textPrimary}; margin-bottom: 2px; }

.points { margin: 0; padding-left: 18px; }

.points li { font-size: 13.6px; line-height: 1.5; color: ${theme.textSecondary}; }

.points li::marker { color: #4ade80; }

.actions { display: flex; justify-content: center; gap: 16px; padding: 12px 18px 16px; border-top: 0.6px solid ${theme.cardBorder}; }

.bouton { min-width: 110px; height: 32px; font: inherit; font-size: 14px; color: white; background: rgba(121,122,128,0.6); border: 0.6px solid ${theme.cardBorder}; border-radius: 8px; cursor: pointer; transition: background 0.14s, transform 0.1s; }

.bouton:hover { background: ${theme.accentRed}; }

.boutonVert { background: #4ade80; border: none; }

.bouton:active { transform: scale(0.96); }

@media (prefers-reduced-motion: reduce) { .fenetre { animation: none; } }

`}</style>
    </>
  );
}
