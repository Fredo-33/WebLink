import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const Views = { Bar: 'bar', Circle: 'circle', Halo: 'halo', Flip: 'flip', Segments: 'segments' };

function DebouncedRange({
  value, min, max, step = 1, delay = 250,
  onLiveInput, onCommit, thumbHover = true, style, ...rest
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);
  const dragging = useRef(false);

  useEffect(() => { if (!dragging.current) setLocal(value); }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    dragging.current = true;
    setLocal(v);
    if (onLiveInput) onLiveInput(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dragging.current = false;
      if (onCommit) onCommit(v);
    }, delay);
  }, [onLiveInput, onCommit, delay]);

  const handleCommitNow = useCallback(() => {
    clearTimeout(timer.current);
    dragging.current = false;
    if (onCommit) onCommit(local);
  }, [onCommit, local]);

  const hoverProps = thumbHover
    ? {
        onMouseEnter: (e) => e.target.style.setProperty('--thumb-color', '#d9534f'),
        onMouseLeave: (e) => e.target.style.setProperty('--thumb-color', '#4ade80'),
      }
    : {};

  return (
    <input
      type="range" min={min} max={max} step={step} value={local}
      onChange={handleChange} onMouseUp={handleCommitNow} onTouchEnd={handleCommitNow}
      style={{ '--thumb-color': '#4ade80', ...style }} {...hoverProps} {...rest}
    />
  );
}

function LabeledDebouncedRange({ label, value, format, color, onLiveInput, ...props }) {
  const [shown, setShown] = useState(value);
  useEffect(() => { setShown(value); }, [value]);
  const text = format ? format(shown) : shown;
  return (
    <label style={{ color, margin: '0 6px 0 36px' }}>
      {label}{label ? ' ' : ''}{text}
      <DebouncedRange value={value} onLiveInput={(v) => { setShown(v); if (onLiveInput) onLiveInput(v); }} {...props} />
    </label>
  );
}

function toHex(raw) {
  if (!raw) return '#888888';
  if (raw.startsWith('rgba') || raw.startsWith('rgb')) {
    const m = raw.match(/[\d.]+/g);
    if (!m) return '#888888';
    const h = (n) => parseInt(n).toString(16).padStart(2, '0');
    return `#${h(m[0])}${h(m[1])}${h(m[2])}`;
  }
  return raw.startsWith('#') ? raw : '#888888';
}

function alphaOf(raw) {
  const m = (raw || '').match(/[\d.]+/g);
  return m && m[3] !== undefined ? parseFloat(m[3]) : 0.75;
}

const COLOR_FIELDS = [
  { label: 'Relais', key: 'relayColor' }, { label: 'Fond', key: 'relayBgColor', isRgba: true },
  { label: 'Nodes',  key: 'nodesColor' }, { label: 'Fond', key: 'nodesBgColor', isRgba: true },
  { label: 'Trans',  key: 'transColor' }, { label: 'Fond', key: 'transBgColor', isRgba: true },
  { label: 'Hist',   key: 'logsColor'  }, { label: 'Fond', key: 'logsBgColor',  isRgba: true },
  { label: 'H m',    key: 'hmColor'     },
];

const FONTS = [
  ['Comic Sans MS, cursive', 'Comic'],['Arial, sans-serif', 'Arial'],
  ["'Courier New', monospace", 'Courier New'],['Georgia, serif', 'Georgia'],
  ["'Times New Roman', serif", 'Times New Roman'],['Verdana, sans-serif', 'Verdana'],
  ['Tahoma, sans-serif', 'Tahoma'],["'Trebuchet MS', sans-serif", 'Trebuchet MS'],
  ['Impact, sans-serif', 'Impact'],["'Lucida Console', monospace", 'Lucida Console'],
];

const MAX_CATEGORIES = 8;

const SYMBOLES = ['📻', '📡', '🎧', '🔊', '🖕🏼', '💬', '👍', '👤','🍺', '💯', '🔧', '📍', '🐧', '🤐','❤️','👀','🗣️', '✅', '❓', '❗', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪'];

function dernierSymbole(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segs = [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(t)];
    return segs.length ? segs[segs.length - 1].segment : '';
  }
  const chars = Array.from(t);
  return chars[chars.length - 1];
}

function MesCategories({ categories = [], color, onAdd, onDelete }) {
  const [ouvert, setOuvert] = useState(false);
  const [symbole, setSymbole] = useState('');
  const [nom, setNom] = useState('');
  const [erreur, setErreur] = useState('');

  const pris = new Set(categories.map(c => c.symbole));
  const plein = categories.length >= MAX_CATEGORIES;

  const fermer = () => { setOuvert(false); setSymbole(''); setNom(''); setErreur(''); };
  const valider = () => {
    const err = onAdd(nom, symbole);
    if (err) setErreur(err); else fermer();
  };
  const touches = (e) => {
    if (e.key === 'Enter') valider();
    if (e.key === 'Escape') { e.stopPropagation(); fermer(); }
  };

  const champ = { fontSize: '12px', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', color, outline: 'none', height: '20px', boxSizing: 'border-box' };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 10px 2px', color }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <span title="Classez les nœuds à votre façon. Vos catégories restent dans ce navigateur : personne d'autre ne les voit." style={{ fontSize: '14px', marginRight: '4px' }}>Catégories :</span>
        {categories.length === 0 && !ouvert && <span style={{ fontSize: '12px', opacity: 0.7 }}>aucune</span>}
        {categories.map(c => (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 6px 0 8px', height: '20px', borderRadius: '12px', fontSize: '11.4px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
            {c.symbole} {c.nom}
            <span role="button" tabIndex={0} onClick={() => onDelete(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDelete(c.id); } }} title={`Supprimer « ${c.nom} »`} aria-label={`Supprimer la catégorie ${c.nom}`} style={{ color: '#d9534f', cursor: 'pointer', fontSize: '10px', lineHeight: 1, marginLeft: '2px' }}>✕</span>
          </span>
        ))}
        {!ouvert && !plein && (
          <button onClick={() => setOuvert(true)} style={{ padding: '0 10px', borderRadius: '16px', fontSize: '12px', width: 'auto', height: '22px', margin: '0 0 0 2px', border: '1px dashed rgba(255,255,255,0.4)', backgroundColor: 'transparent', color, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>+ Ajouter</button>
        )}
      </div>

      {ouvert && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div role="radiogroup" aria-label="Symbole" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '330px' }}>
            {SYMBOLES.map((s) => {
              const off = pris.has(s);
              const on = symbole === s;
              return (
                <button key={s} role="radio" aria-checked={on} disabled={off} onClick={() => { setSymbole(s); setErreur(''); }} title={off ? 'Déjà utilisé' : undefined} style={{ width: '26px', height: '26px', padding: 0, margin: '1px', borderRadius: '6px', fontSize: '15px', lineHeight: 1, backgroundColor: on ? 'rgba(255,255,255,0.32)' : 'transparent', border: on ? '1px solid rgba(255,255,255,0.9)' : '1px solid transparent', opacity: off ? 0.25 : 1, cursor: off ? 'not-allowed' : 'pointer' }}>{s}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <input type="text" value={symbole} onChange={(e) => { setSymbole(dernierSymbole(e.target.value)); setErreur(''); }} onKeyDown={touches} placeholder="?" aria-label="Symbole" title="Choisissez un symbole ci-dessus, ou tapez le vôtre" style={{ ...champ, width: '34px', padding: '2px', textAlign: 'center' }} />
            <input autoFocus type="text" value={nom} maxLength={20} onChange={(e) => { setNom(e.target.value); setErreur(''); }} onKeyDown={touches} placeholder="Nom .." aria-label="Nom de la catégorie" style={{ ...champ, width: '112px' }} />
            <button onClick={valider} style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', width: 'auto', margin: '0 0 0 2px', backgroundColor: 'rgba(74,222,128,0.64)', color, cursor: 'pointer', height: '18px' }}>Ok</button>
            <button onClick={fermer} aria-label="Annuler" style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', width: 'auto', margin: 0, backgroundColor: 'rgba(217,83,79,0.66)', color, cursor: 'pointer', height: '20px' }}>✕</button>
          </div>
          {erreur && <span role="alert" style={{ fontSize: '12px', color: '#ffb4b1' }}>{erreur}</span>}
        </div>
      )}
    </div>
  );
}

function SettingsPanel(props) {
  const {
    logsColor, logsBgColor, font, image, activeTheme, previewTheme,
    contrast, brightness, nodeButtonWidth, pageZoom, chronoView,
    showSaveTheme, saveThemeName, imageGrid,
    globe, mapMode, mapTiles, logo, snowfall, fallLeaves, rain, bubbles, fireflies,
    notificationsEnabled, nbNodes, voice, isReset,
    themes, customThemes,
    onClose, onApplyTheme, onPreviewOn, onPreviewOff, onDeleteCustomTheme,
    onColorPick, onAlphaChange, onShowSaveTheme, onSaveThemeNameChange,
    onSaveCustomTheme, onCancelSaveTheme, onFontChange,
    onToggleImageGrid, onChangeBackground, onCustomImageClick,
    onToggle, onChronoViewChange, onMapModeChange, onResetRequest, onFullScreen,
    onContrastLive, onContrastCommit, onBrightnessLive, onBrightnessCommit,
    onNodeWidthLive, onNodeWidthCommit, onZoomLive, onZoomCommit,
    onExport, onImport,
    presets, activePreset, presetName, showSavePreset,
    onApplyPreset, onDeletePreset, onShowSavePreset,
    onPresetNameChange, onSavePreset, onCancelSavePreset,
    categories, onAddCategorie, onDeleteCategorie,
  } = props;

  const row = { display: 'flex', justifyContent: 'center', backgroundColor: logsBgColor };

  const baseMode = mapMode || (globe ? 'globe' : 'off');
  const currentMapMode = baseMode === 'flat' ? `flat:${mapTiles || 'voyager'}` : baseMode;

  return (
    <motion.div data-boot-zone="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.4 } }} role="dialog" aria-label="Réglages" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} style={{ width: '406px', position: 'absolute', top: 'max(53.2vh, 372px)', right: '2.8vw', fontSize: '14.88px', zIndex: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'center', borderRadius: '16px 16px 0 0', backgroundColor: logsBgColor }}>
        <button onClick={onClose} className="fermer" aria-label="Fermer les réglages" style={{ right: '-378px' }}> X </button>
        <div style={{ width: '100%', padding: '14px 8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', margin: '12px 0 0 -30px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
            {Object.keys(themes).map((name) => {
              const isActive = activeTheme === name;
              const isPreviewing = previewTheme === name;
              return (
                <button key={name} onClick={() => onApplyTheme(name)} onMouseEnter={() => onPreviewOn(name)} onMouseLeave={onPreviewOff} aria-pressed={isActive} style={{ padding: '2px 6.6px', borderRadius: '12px', fontSize: '10.88px', width: 'auto', margin: '2.4px', border: isActive ? '1.4px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.4)', backgroundColor: isActive ? 'rgba(255,255,255,0.28)' : isPreviewing ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)', color: logsColor, cursor: 'pointer', transition: 'all 0.28s', fontWeight: isActive ? 'bold' : 'normal', boxShadow: isActive ? '0 0 6px rgba(255,255,255,0.3)' : 'none', height: '20px' }}>
                  {isActive ? '✓ ' : ''}{name}
                </button>
              );
            })}
            {Object.keys(customThemes).map((name) => {
              const isActive = activeTheme === name;
              const isPreviewing = previewTheme === name;
              return (
                <div key={name} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <button onClick={() => onApplyTheme(name)} onMouseEnter={() => onPreviewOn(name)} onMouseLeave={onPreviewOff} aria-pressed={isActive} style={{ padding: '2px 16px 2px 6px', borderRadius: '12px', fontSize: '10.88px', width: 'auto', margin: '2px', border: isActive ? '1.4px solid #4ade80' : '1px solid rgba(74, 222, 128, 0.4)', backgroundColor: isActive ? 'rgba(74, 222, 128, 0.4)' : isPreviewing ? 'rgba(74, 222, 128, 0.2)' : 'rgba(74, 222, 128, 0.06)', color: logsColor, cursor: 'pointer', transition: 'all 0.28s', fontWeight: isActive ? 'bold' : 'normal', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '20px' }}>
                    {isActive ? '✓ ' : '⭐ '}{name}
                  </button>
                  <span onClick={() => onDeleteCustomTheme(name)} title="Supprimer" role="button" aria-label={`Supprimer le thème ${name}`} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#d9534f', cursor: 'pointer', lineHeight: 1 }}>✕</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', backgroundColor: logsBgColor, padding: '10px 8px 14px' }}>
        {COLOR_FIELDS.map(({ label, key, isRgba }) => {
          const raw = props[key] || '#888888';
          const hexVal = toHex(raw);
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <label style={{ color: logsColor, fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</label>
              <div style={{ position: 'relative', width: '32px', height: '22px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: raw, pointerEvents: 'none', borderRadius: '4px' }} />
                <input type="color" value={hexVal} aria-label={`Couleur ${label}`} onChange={(e) => onColorPick(key, e.target.value, isRgba, raw)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
              {isRgba && (
                <input type="range" min="0" max="1" step="0.05" value={alphaOf(raw)} title={`Opacité : ${Math.round(alphaOf(raw) * 100)}%`} aria-label={`Opacité ${label}`} onChange={(e) => onAlphaChange(key, parseFloat(e.target.value))} style={{ '--thumb-color': '#4ade80', width: '32px', marginTop: '6px', padding: '0' }} onMouseEnter={(e) => e.target.style.setProperty('--thumb-color', '#d9534f')} onMouseLeave={(e) => e.target.style.setProperty('--thumb-color', '#4ade80')} />
              )}
            </div>
          );
        })}
      </div>

      <div style={row}>
        {!showSaveTheme ? (
          <button onClick={onShowSaveTheme} style={{ padding: '0 10px', borderRadius: '16px', fontSize: '12px', width: 'auto', border: '1px dashed rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: logsColor, cursor: 'pointer', transition: 'all 0.2s', height: '28px' }} onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(255,255,255,0.12)')} onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}>💾 Sauvegarder</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '6px' }}>
            <input autoFocus type="text" placeholder="Nom thème .." value={saveThemeName} onChange={(e) => onSaveThemeNameChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSaveCustomTheme(); if (e.key === 'Escape') onCancelSaveTheme(); }} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', color: logsColor, outline: 'none', width: '98px' }} />
            <button onClick={onSaveCustomTheme} style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', width: 'auto', backgroundColor: 'rgba(74,222,128,0.64)', color: logsColor, cursor: 'pointer', height: '18px' }}>Ok</button>
            <button onClick={onCancelSaveTheme} style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', width: 'auto', backgroundColor: 'rgba(217,83,79,0.66)', color: logsColor, cursor: 'pointer', height: '20px' }}>✕</button>
          </div>
        )}
        <div style={{ margin: '8px 0 0 18px' }}>
          <label htmlFor="fontSelect" style={{ color: logsColor }}>Police :</label>
          <select id="fontSelect" value={font} onChange={(e) => onFontChange(e.target.value)} style={{ width: '86px', marginLeft: '6px', cursor: 'pointer',fontSize: '14px' }}>
            {FONTS.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
          </select>
        </div>
      </div>

      <div style={row}>
        <div>
          <label style={{ color: logsColor, marginRight: '6px' }}>Image : </label>
          <div style={{ position: 'relative', display: 'inline-block', top: '14px', marginRight: '20px' }}>
            <div onClick={onToggleImageGrid} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', width: '54px', height: '36px' }}>
              <img src={image} loading="lazy" alt="Fond actuel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {imageGrid && (
              <div style={{ position: 'absolute', bottom: '48px', left: '-200px', zIndex: 8888, display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', gap: '14.8px', padding: '10px', backgroundColor: 'rgba(106, 107, 108, 0.9)', borderRadius: '8px' }}>
                {Array.from({ length: 30 }, (_, i) => {
                  if (i === 29) {
                    return (
                      <div key="custom-upload" className="tooltipContainer2">
                        <div onClick={onCustomImageClick} style={{ width: '64px', height: '46px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#d9534f' }}>+</div>
                        <span className="tooltip2">Ajoutez votre image</span>
                      </div>
                    );
                  }
                  const path = `../static/weblink${i + 1}.jpg`;
                  const isSelected = image === path;
                  return (
                    <div key={i} className="zoomImage" onClick={() => onChangeBackground(path)} style={{ position: 'relative', width: '64px', height: '46px', borderRadius: '6px', overflow: 'hidden', border: isSelected ? '2px solid #d9534f' : '1px solid transparent', cursor: 'pointer', flexShrink: 0 }}>
                      <div className="imgSkeleton" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(160,160,160,0.38)', borderRadius: '6px', animation: 'skeletonShimmer 1.4s ease-in-out infinite' }} />
                      <img src={path} loading="lazy" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.4s ease', borderRadius: '6px' }} onLoad={(e) => { e.target.style.opacity = '1'; const sk = e.target.previousSibling; if (sk) sk.style.display = 'none'; }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <label className="coche" style={{ marginRight: '6px', color: logsColor }}> Logo : <input type="checkbox" checked={logo} onChange={() => onToggle('logo')} /> <span className="checkmark"></span> </label>
          <label style={{ color: logsColor, margin: '0 6px 0 34px' }}>Plein écran : </label>
          <button onClick={onFullScreen} className="effect" aria-label="Plein écran" style={{ width: '18px', marginLeft: '0', backgroundColor: 'transparent' }}><img src="../static/full.png" alt="" /></button>
        </div>
      </div>

      <div style={row}>
        <div style={{ margin: '6px 10px 0 0' }}>
          <label className="coche" style={{ color: logsColor, margin: '12px 30px 0 20px' }}> Notifs : <input type="checkbox" checked={notificationsEnabled} onChange={() => onToggle('notificationsEnabled')} /> <span className="checkmark" style={{ marginLeft: '8px' }}></span> </label>
          <label className="coche" style={{ color: logsColor, margin: '0 6px 0 36px' }}> Nb Nodes : <input type="checkbox" checked={nbNodes} onChange={() => onToggle('nbNodes')} /> <span className="checkmark" style={{ marginLeft: '38px' }}></span> </label>
          <label className="coche" style={{ color: logsColor, margin: '0 38px 0 48px' }}> Voix : <input type="checkbox" checked={voice} onChange={() => onToggle('voice')} /> <span className="checkmark"></span> </label>
        </div>
      </div>

      <div style={row}>
        <div style={{ margin: '4px 0 14px' }}>
          <label style={{ color: logsColor, marginRight: '2px' }}>Reset : </label>
          <button onClick={onResetRequest} className={`effect ${isReset ? 'reset' : ''}`} aria-label="Réinitialiser" style={{ width: '20px', margin: '14px 0 0 0', backgroundColor: 'transparent' }}><img src="../static/reset.png" alt="" style={{ width: '14.8px' }} /></button>
          <label htmlFor="choixCarte" style={{ margin: '0 4px 0 14px', whiteSpace: 'nowrap', color: logsColor }}> Carte : </label>
          <select id="choixCarte" value={currentMapMode} onChange={(e) => onMapModeChange(e.target.value)} style={{ padding: '4px', borderRadius: '8px', width: '72px' }}>
            <option value="off">Aucune</option>
            <option value="globe">Globe</option>
            <optgroup label="Plate">
              <option value="flat:voyager">Voyager</option> <option value="flat:light">Claire</option>
              <option value="flat:dark">Sombre</option> <option value="flat:osm">Osm</option>
              <option value="flat:satellite">Sat</option> <option value="flat:terrain">Relief</option>
            </optgroup>
          </select>
          <label htmlFor="choixChrono" style={{ margin: '0 4px 0 14px', whiteSpace: 'nowrap', color: logsColor }}> Chrono : </label>
          <select id="choixChrono" value={chronoView} onChange={(e) => onChronoViewChange(e.target.value)} style={{ padding: '4px', borderRadius: '8px', width: '64px' }}>
            <option value={Views.Bar}>Barre</option> <option value={Views.Circle}>Cercle</option>
            <option value={Views.Halo}>Halo</option> <option value={Views.Flip}>Flip</option>
            <option value={Views.Segments}>Segments</option>
          </select>
        </div>
      </div>

      <div style={row}>
        <LabeledDebouncedRange label="Contraste :" color={logsColor} value={contrast} min={50} max={150}
          format={(v) => `${v}%`} onLiveInput={onContrastLive} onCommit={onContrastCommit} />
        <LabeledDebouncedRange label="Luminosité :" color={logsColor} value={brightness} min={50} max={150}
          format={(v) => `${v}%`} onLiveInput={onBrightnessLive} onCommit={onBrightnessCommit} />
      </div>

      <div style={{ ...row, paddingTop: '8px' }}>
        <LabeledDebouncedRange label="Nodes :" color={logsColor} value={nodeButtonWidth || 204} min={120} max={300} step={2}
          format={(v) => `${Math.round(v)}px`} onLiveInput={onNodeWidthLive} onCommit={onNodeWidthCommit} />
        <LabeledDebouncedRange label="Zoom :" color={logsColor} value={pageZoom || 100} min={70} max={130} step={1}
          format={(v) => `${Math.round(v)}%`} onLiveInput={onZoomLive} onCommit={onZoomCommit} />
      </div>

      <div style={{ ...row, paddingBottom: '8px' }}>
        <div style={{ marginTop: '6px' }}>
          {[['snowfall', '❄️', 'Neige'], ['fallLeaves', '🍁', 'Feuilles'], ['rain', '💧', 'Pluie'], ['bubbles', '🫧', 'Bulles'], ['fireflies', '🔘', 'Lucioles']].map(([key, emoji, name], idx) => (
            <label key={key} className="coche" style={{ margin: idx === 0 ? '6px 12px 0 0' : '6px 12px 0 34px', color: 'white' }}>
              <span role="img" aria-label={name}>{emoji}</span>
              <input type="checkbox" checked={props[key]} onChange={() => onToggle(key)} aria-label={name} />
              <span className="checkmark" style={{ left: '32px' }}></span>
            </label>
          ))}
        </div>
      </div>

      <div style={{display: 'none'}}>
        <MesCategories categories={categories} color={logsColor} onAdd={onAddCategorie} onDelete={onDeleteCategorie} />
      </div>

      <div style={{ ...row, alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <label htmlFor="presetSelect" style={{ color: logsColor, fontSize: '14px', whiteSpace: 'nowrap', marginBottom: '2px' }}>DashBoard :</label>
          <select id="presetSelect" value={activePreset || ''} onChange={(e) => onApplyPreset(e.target.value)} style={{ minWidth: '86px', maxWidth: '126px', padding: '2px 6px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: logsColor }}>
            <option value="">Choisir</option>
            {Object.keys(presets || {}).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {activePreset && presets && presets[activePreset] && (
            <button onClick={() => onDeletePreset(activePreset)} title={`Supprimer « ${activePreset} »`} aria-label={`Supprimer DashBoard ${activePreset}`} style={{ padding: '0 4px', borderRadius: '8px', fontSize: '10px', height: '16px', width: 'auto', backgroundColor: 'rgba(217,83,79,0.64)', color: logsColor, border: '1px solid rgba(217,83,79,0.62)', cursor: 'pointer', margin: '2px 0 0 2px' }} >✕</button>
          )}
        </div>
        {!showSavePreset ? (
          <button onClick={onShowSavePreset} style={{ padding: '0 10px', borderRadius: '16px', fontSize: '12.6px', width: 'auto', border: '1px dashed rgba(255,255,255,0.4)', backgroundColor: 'transparent', color: logsColor, cursor: 'pointer', transition: 'all 0.2s', height: '26px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} >Enregistrer ..</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <input autoFocus type="text" placeholder="Nom .." value={presetName} onChange={(e) => onPresetNameChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSavePreset(); if (e.key === 'Escape') onCancelSavePreset(); }} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)', color: logsColor, outline: 'none', width: '88px' }} />
            <button onClick={onSavePreset} style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', width: 'auto', backgroundColor: 'rgba(74,222,128,0.64)', color: logsColor, cursor: 'pointer', height: '18px' }}>Ok</button>
            <button onClick={onCancelSavePreset} style={{ padding: '0 4px', borderRadius: '12px', fontSize: '10.8px', height: '20px', width: 'auto', backgroundColor: 'rgba(217,83,79,0.66)', color: logsColor, cursor: 'pointer' }}>✕</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', backgroundColor: logsBgColor, borderRadius: '0 0 16px 16px', padding: '12px 8px 14px' }}>
        <button onClick={onExport} style={{ height: '20px', padding: '0 12px', borderRadius: '8px', fontSize: '12px', width: 'auto', backgroundColor: 'rgba(74,222,128,0.88)', color: logsColor, border: '1px solid rgba(74,222,128,0.6)', cursor: 'pointer', transition: 'all 0.2s', margin: '4px'}} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(74,222,128,1)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.88)')}>Exporter</button>
        <label style={{ padding: '0 12px', borderRadius: '8px', fontSize: '12px', backgroundColor: 'rgba(217,83,79,0.88)', color: logsColor, border: '1px solid rgba(217,83,79,0.6)', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', margin: '4px' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(217,83,79,1)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(217,83,79,0.88)')}>
          Importer <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
        </label>
      </div>
    </motion.div>
  );
}

const WATCHED = [
  'logsColor', 'logsBgColor', 'font', 'image', 'activeTheme', 'previewTheme',
  'contrast', 'brightness', 'nodeButtonWidth', 'pageZoom', 'chronoView',
  'showSaveTheme', 'saveThemeName', 'imageGrid',
  'globe', 'mapMode', 'mapTiles', 'logo', 'snowfall', 'fallLeaves', 'rain', 'bubbles', 'fireflies',
  'notificationsEnabled', 'nbNodes', 'voice', 'isReset',
  'relayColor', 'relayBgColor', 'nodesColor', 'nodesBgColor',
  'transColor', 'transBgColor', 'hmColor',
  'themes', 'customThemes',
  'presets', 'activePreset', 'presetName', 'showSavePreset',
  'categories',
];

function areEqual(prev, next) {
  const byContent = ['themes', 'customThemes', 'presets', 'categories'];
  for (const k of byContent) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) return false;
  }
  return WATCHED.every((k) => byContent.includes(k) || prev[k] === next[k]);
}

export default React.memo(SettingsPanel, areEqual);