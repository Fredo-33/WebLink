import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { resolveTransmitter } from '../lib/geoNodes';

export const TILES = {
  voyager: {
    label: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  light: {
    label: 'Claire',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  dark: {
    label: 'Sombre',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    brightness: 1.8,
  },
  osm: {
    label: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    subdomains: [],
    maxZoom: 18,
  },
  terrain: {
    label: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, SRTM &copy; OpenTopoMap',
    maxZoom: 16,
  },
};

export const TILE_STYLES = Object.entries(TILES).map(([key, v]) => ({ key, label: v.label }));

const FRANCE = [46.6, 2.4];
const ZOOM_IDLE = 4;
const ZOOM_TX   = 10;

const CSS_ID = 'flatmap-inline-css';
const LEAFLET_CSS_ID = 'leaflet-css-cdn';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const INLINE_CSS = `
.flatmap-wrap .leaflet-container { background: transparent; font: inherit; outline: none; }
.flatmap-wrap .leaflet-control-attribution { background: rgba(0,0,0,0.42); color: #ccc; font-size: 8px; padding: 0 4px; }
.flatmap-wrap .leaflet-control-attribution a { color: #8cf; }
.flatmap-halo { border-radius: 50%; border: 2px solid #4ade80; animation: flatmapPulse 1.6s ease-out infinite; }
.flatmap-wrap .leaflet-control-attribution { display: none; }
@keyframes flatmapPulse { 0% { transform: scale(0.24); opacity: 0.96; } 100% { transform: scale(1); opacity: 0; } }
.flatmap-label { background: none; border: none; box-shadow: none; color: #fff; font-size: 12px; font-weight: 600; text-shadow: 0 0 4px #000, 0 0 8px #000; white-space: nowrap; pointer-events: none; text-align: center; }
`;

function ensureLeafletCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LEAFLET_CSS_ID)) return;

  const probe = document.createElement('div');
  probe.className = 'leaflet-pane';
  probe.style.cssText = 'position:static;visibility:hidden';
  document.body.appendChild(probe);
  const loaded = getComputedStyle(probe).position === 'absolute';
  document.body.removeChild(probe);
  if (loaded) return;

  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = LEAFLET_CSS_URL;
  document.head.appendChild(link);
  console.info(' -- ');
}

function injectCss() {
  if (typeof document === 'undefined' || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = INLINE_CSS;
  document.head.appendChild(el);
}

export default function FlatMap({
  transmitter,
  mumbleTransmitter,
  trans,
  tileStyle = 'voyager',
  size = 400,
  showLabel = true,
  style,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    ensureLeafletCss();
    injectCss();
    if (!hostRef.current || mapRef.current) return;

    const map = L.map(hostRef.current, {
      center: FRANCE,
      zoom: ZOOM_IDLE,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    markerRef.current = L.layerGroup().addTo(map);

    L.DomEvent.disableClickPropagation(hostRef.current);
    L.DomEvent.disableScrollPropagation(hostRef.current);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => map.invalidateSize({ animate: false }));
      ro.observe(hostRef.current);
    }
    const timers = [60, 400, 1200].map((d) =>
      setTimeout(() => map.invalidateSize({ animate: false }), d)
    );

    return () => {
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);

    const conf = TILES[tileStyle] || TILES.voyager;
    const opts = {
      attribution: conf.attribution,
      maxZoom: conf.maxZoom || 18,
      detectRetina: true,
    };
    if (conf.subdomains !== undefined) opts.subdomains = conf.subdomains;

    tileRef.current = L.tileLayer(conf.url, opts).addTo(map);

    const pane = map.getPane('tilePane');
    if (pane) {
      const b = conf.brightness || 1;
      pane.style.filter = b === 1 ? '' : `brightness(${b})`;
    }
  }, [tileStyle]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const tx = resolveTransmitter(transmitter, mumbleTransmitter, trans);

    if (!tx) {
      map.flyTo(FRANCE, ZOOM_IDLE, { duration: 1.1 });
      return;
    }

    const pos = [tx.lat, tx.lng];
    const color = tx.isMumble ? '#60a5fa' : '#4ade80';

    L.marker(pos, {
      interactive: false,
      icon: L.divIcon({
        className: '',
        html: `<div class="flatmap-halo" style="width:48px;height:48px;border-color:${color}"></div>`,
        iconSize: [40, 40],
        iconAnchor: [24, 24],
      }),
    }).addTo(layer);

    L.circleMarker(pos, {
      radius: 7,
      color,
      fillColor: color,
      fillOpacity: 0.88,
      weight: 2,
      interactive: false,
    }).addTo(layer);

    if (showLabel && tx.name) {
      L.marker(pos, {
        interactive: false,
        icon: L.divIcon({
          className: 'flatmap-label',
          html: tx.name,
          iconSize: [160, 16],
          iconAnchor: [80, -24],
        }),
      }).addTo(layer);
    }

    map.flyTo(pos, ZOOM_TX, { duration: 1.2 });
  }, [transmitter, mumbleTransmitter, trans, showLabel]);

  return (
    <div className="flatmap-wrap" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: `${size}px`, height: `${size}px`, position: 'relative', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', ...style }}>
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}