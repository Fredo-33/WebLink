import React from 'react';
import { useTheme } from './themeContext';

const HEURE = 60 * 60 * 1000;

const ONGLETS = [
  { id: 'direct', label: 'Direct' },
  { id: 'qualite', label: 'Qualité' },
  { id: 'activite', label: 'Activité' },
];

const deux = n => String(n).padStart(2, '0');

const heure = t => `${deux(new Date(t).getHours())} h`;

function duree(s) {
  if (!s) return '0 s';
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${deux(s % 60)}`;
  return `${Math.floor(m / 60)} h ${deux(m % 60)}`;
}

function periode(depuis) {
  if (!depuis || Date.now() - depuis > 24 * HEURE - 2 * 60 * 1000) return '24 h';
  return `depuis ${deux(new Date(depuis).getHours())}:${deux(new Date(depuis).getMinutes())}`;
}

function classeLatence(ms, pertes) {
  if (ms === null || ms >= 200 || pertes >= 40) return 'mauvais';
  if (ms >= 80 || pertes > 0) return 'moyen';
  return 'bon';
}

function Barres({ debut, valeurs, max, classe, titre }) {
  const { theme } = useTheme();
  return (
    <div className="graphe">
      <div className="barres">
        {valeurs.map((v, i) => {
          const h = v === null || !max ? 0 : Math.max(8, Math.round((v / max) * 100));
          return (
            <div key={i} className="colonne" title={titre(i, debut + i * HEURE)}>
              <div className={`barre ${v === null ? 'vide' : classe(i)}`} style={{ height: v === null ? '2px' : `${h}%` }} />
            </div>
          );
        })}
      </div>
      <div className="axe">
        <span>{heure(debut)}</span>
        <span>{heure(debut + 12 * HEURE)}</span>
        <span>maintenant</span>
      </div>

<style jsx>{`

.graphe { margin-top: 4px; min-width: 276px; }

.barres { display: flex; align-items: flex-end; gap: 2px; height: 46px; padding: 0 2px; border-bottom: 0.6px solid ${theme.cardBorder}; }

.colonne { flex: 1; height: 100%; display: flex; align-items: flex-end; cursor: default; }

.barre { width: 100%; border-radius: 2px 2px 0 0; transition: height 0.28s ease; }

.bon { background: #4ade80; }

.moyen { background: ${theme.accentYellow}; }

.mauvais { background: ${theme.accentRed}; }

.activite { background: ${theme.isDark ? 'rgba(74,222,128,0.68)' : 'rgba(0,150,0,0.56)'}; }

.pic { background: #4ade80; }

.vide { background: ${theme.cardBorder}; }

.colonne:hover .barre { filter: brightness(1.2); }

.axe { display: flex; justify-content: space-between; font-size: 10.8px; color: ${theme.textSecondary}; margin-top: 2px; font-variant-numeric: tabular-nums; }

`}</style>
    </div>
  );
}

export function SvxOnglets({ value, onChange }) {
  const { theme } = useTheme();
  return (
    <div className="onglets" role="tablist" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      {ONGLETS.map(o => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={`onglet ${value === o.id ? 'ongletActif' : ''}`} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}

<style jsx>{`

.onglets { display: flex; gap: 4px; padding: 2px; margin: 2px 0 4px; border-radius: 8px; background: ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}; }

.onglet { flex: 1; margin: 0; font: inherit; font-size: 12.4px; line-height: 1.6; padding: 2px 8px; border: none; border-radius: 6px; background: none; color: ${theme.textSecondary}; cursor: pointer; transition: background 0.14s, color 0.14s; -webkit-tap-highlight-color: transparent; }

.onglet:hover { color: ${theme.textPrimary}; }

.ongletActif, .ongletActif:hover { background: #4ade80; color: white; }

`}</style>
    </div>
  );
}

export function SvxStats({ reflector, vue }) {
  const { theme } = useTheme();
  const q = reflector && reflector.qualite;
  const a = reflector && reflector.activite;

  const mesurees = q ? q.heures.filter(h => h && h.ms !== null).map(h => h.ms) : [];
  const maxLatence = Math.max(100, ...mesurees);
  const latences = q ? q.heures.map(h => (!h ? null : h.ms === null ? maxLatence : h.ms)) : [];
  const lignes = q ? [
    ['Latence médiane', q.ms === null ? (q.mesures ? 'sans réponse' : '--') : `${q.ms} ms`, q.mesures ? classeLatence(q.ms, q.pertes || 0) : ''],
    ['Paquets perdus', q.pertes === null ? '--' : `${q.pertes} %`, q.pertes ? (q.pertes >= 40 ? 'mauvais' : 'moyen') : (q.pertes === 0 ? 'bon' : '')],
    ['Coupures', String(q.coupures), q.coupures > 2 ? 'mauvais' : q.coupures ? 'moyen' : 'bon'],
    ['Disponibilité', q.dispo === null ? '--' : `${String(q.dispo).replace('.', ',')} %`, q.dispo === null ? '' : q.dispo >= 98 ? 'bon' : q.dispo >= 90 ? 'moyen' : 'mauvais'],
  ] : [];
  const maxActivite = a ? Math.max(...a.secondes) : 0;

  return (
    <div className="stats" onClick={e => e.stopPropagation()}>
      {vue === 'qualite' && !q && <div className="vide">Pas encore de mesures ..</div>}
      {vue === 'qualite' && q && (
        <>
          <div className="titre">Qualité de la liaison · {periode(q.depuis)}</div>
          {lignes.map(([k, v, c]) => (
            <div key={k} className="ligne"><span className="cle">{k}</span><span className={`val ${c}`}>{v}</span></div>
          ))}
          {q.mesures > 0 ? (
            <Barres debut={q.debutHeures} valeurs={latences} max={maxLatence}
              classe={i => classeLatence(q.heures[i].ms, q.heures[i].pertes)}
              titre={(i, t) => (q.heures[i] ? `${heure(t)} · ${q.heures[i].ms === null ? 'sans réponse' : `${q.heures[i].ms} ms`}${q.heures[i].pertes ? ` · ${q.heures[i].pertes} % perdus` : ''}` : `${heure(t)} · pas de mesure`)} />
          ) : <div className="vide">Première mesure dans une minute ..</div>}
          <div className="note">Latence vers le réflecteur, mesurée chaque minute</div>
        </>
      )}

      {vue === 'activite' && !a && <div className="vide">Pas encore d&apos;activité ..</div>}
      {vue === 'activite' && a && (
        <>
          <div className="titre">Activité du réseau · {periode(a.depuis)}</div>
          <div className="ligne"><span className="cle">Passages</span><span className="val">{a.passages}</span></div>
          <div className="ligne"><span className="cle">Temps d&apos;émission</span><span className="val">{duree(a.duree)}</span></div>
          <div className="ligne"><span className="cle">Nodes actifs</span><span className="val">{a.nodes}</span></div>
          <div className="ligne"><span className="cle">Heure la plus active</span><span className="val">{a.pic ? heure(a.pic) : '--'}</span></div>
          {a.passages > 0 ? (
            <>
              <Barres debut={a.debutHeures} valeurs={a.secondes.map(v => (v ? v : null))} max={maxActivite}
                classe={i => (a.secondes[i] === maxActivite ? 'pic' : 'activite')}
                titre={(i, t) => `${heure(t)} · ${a.nombre[i]} passage${a.nombre[i] > 1 ? 's' : ''} · ${duree(a.secondes[i])}`} />
              <div className="sousTitre">Les plus actifs</div>
              {a.top.map(n => (
                <div key={n.label} className="ligne">
                  <span className={`node ${n.self ? 'moi' : ''}`}>{n.label}</span>
                  <span className="cle">{n.passages} passage{n.passages > 1 ? 's' : ''}</span>
                  <span className="valCourte">{duree(n.secondes)}</span>
                </div>
              ))}
            </>
          ) : <div className="vide">Personne n&apos;a encore parlé ..</div>}
        </>
      )}

<style jsx>{`

.stats { display: flex; flex-direction: column; gap: 6px; min-width: 276px; }

.titre { font-size: 12.4px; font-weight: 500; color: ${theme.textSecondary}; margin-bottom: 2px; }

.sousTitre { font-size: 12px; letter-spacing: 0.04em; color: ${theme.textSecondary}; margin-top: 4px; padding-top: 6px; border-top: 0.6px solid ${theme.cardBorder}; }

.ligne { display: flex; align-items: baseline; gap: 12px; font-size: 12.4px; }

.cle { color: ${theme.textSecondary}; white-space: nowrap; }

.val { margin-left: auto; color: ${theme.textPrimary}; font-variant-numeric: tabular-nums; white-space: nowrap; }

.valCourte { min-width: 64px; text-align: right; color: ${theme.textPrimary}; font-variant-numeric: tabular-nums; white-space: nowrap; }

.node { font-weight: 600; color: ${theme.textPrimary}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; }

.moi { color: ${theme.accentRed}; }

.bon { color: #4ade80; }

.moyen { color: ${theme.accentYellow}; }

.mauvais { color: ${theme.accentRed}; }

.vide { font-size: 12.4px; color: ${theme.textSecondary}; font-style: italic; }

.note { font-size: 10.8px; color: ${theme.textSecondary}; opacity: 0.8; }

`}</style>
    </div>
  );
}
