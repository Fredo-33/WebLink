import React, { useState, useEffect, useRef } from 'react';

const weatherIconMap = {
  "01d": "../static/soleil.svg","01n": "../static/soleil.svg",
  "02d": "../static/nuageux3.svg","02n": "../static/nuageux3.svg",
  "03d": "../static/nuageux3.svg","03n": "../static/nuageux3.svg",
  "04d": "../static/nuageux2.svg","04n": "../static/nuageux2.svg",
  "09d": "../static/pluie.svg","09n": "../static/pluie.svg",
  "10d": "../static/pluie.svg","10n": "../static/pluie.svg",
  "13d": "../static/pluie.svg","13n": "../static/pluie.svg",
  "50d": "../static/brume.svg","50n": "../static/brume.svg",
};

const ApiKey = 'votre-cle-openweathermap';

const Saints = {
  "01-01": "Jour de l'An", "01-02": "Basile", "01-03": "Geneviève", "01-04": "Odilon", "01-05": "Édouard", "01-06": "Mélaine", "01-07": "Raymond", "01-08": "Lucien", "01-09": "Alix", "01-10": "Guillaume", "01-11": "Pauline", "01-12": "Tatiana", "01-13": "Yvette", "01-14": "Nina", "01-15": "Rémi", "01-16": "Marcel", "01-17": "Roseline", "01-18": "Prisca", "01-19": "Marius", "01-20": "Sébastien", "01-21": "Agnès", "01-22": "Vincent", "01-23": "Barnard", "01-24": "Fr. de Sales", "01-25": "Conv. de Paul", "01-26": "Paule", "01-27": "Angèle", "01-28": "Th. d'Aquin", "01-29": "Gildas", "01-30": "Martine", "01-31": "Marcelle",
  "02-01": "Ella", "02-02": "Présentation", "02-03": "Blaise", "02-04": "Véronique", "02-05": "Agathe", "02-06": "Gaston", "02-07": "Eugénie", "02-08": "Jacqueline", "02-09": "Apolline", "02-10": "Arnaud", "02-11": "ND Lourdes", "02-12": "Félix", "02-13": "Béatrice", "02-14": "Valentin", "02-15": "Claude", "02-16": "Julienne", "02-17": "Alexis", "02-18": "Bernadette", "02-19": "Gabin", "02-20": "Aimée", "02-21": "Damien", "02-22": "Isabelle", "02-23": "Lazare", "02-24": "Modeste", "02-25": "Roméo", "02-26": "Nestor", "02-27": "Honorine", "02-28": "Romain", "02-29": "Auguste",
  "03-01": "Aubin", "03-02": "Charles le Bon", "03-03": "Gwenola", "03-04": "Casimir", "03-05": "Olive", "03-06": "Colette", "03-07": "Félicité", "03-08": "Jean de Dieu", "03-09": "Françoise", "03-10": "Vivien", "03-11": "Rosine", "03-12": "Justine", "03-13": "Rodrigue", "03-14": "Mathilde", "03-15": "Louise", "03-16": "Bénédicte", "03-17": "Patrick", "03-18": "Cyrille", "03-19": "Joseph", "03-20": "Herbert", "03-21": "Clémence", "03-22": "Léa", "03-23": "Victorien", "03-24": "Catherine", "03-25": "Annonciation", "03-26": "Larissa", "03-27": "Habib", "03-28": "Gontran", "03-29": "Gwladys", "03-30": "Amédée", "03-31": "Benjamin",
  "04-01": "Hugues", "04-02": "Sandrine", "04-03": "Richard", "04-04": "Isidore", "04-05": "Irène", "04-06": "Marcellin", "04-07": "Jean-B. de la Salle", "04-08": "Julie", "04-09": "Gautier", "04-10": "Fulbert", "04-11": "Stanislas", "04-12": "Jules", "04-13": "Ida", "04-14": "Maxime", "04-15": "Paterne", "04-16": "Benoît-Joseph", "04-17": "Anicet", "04-18": "Parfait", "04-19": "Emma", "04-20": "Odette", "04-21": "Anselme", "04-22": "Alexandre", "04-23": "Georges", "04-24": "Fidèle", "04-25": "Marc", "04-26": "Alida", "04-27": "Zita", "04-28": "Valérie", "04-29": "Catherine de Sienne", "04-30": "Robert",
  "05-01": "Fête du Travail", "05-02": "Boris", "05-03": "Philippe", "05-04": "Sylvain", "05-05": "Judith", "05-06": "Prudence", "05-07": "Gisèle", "05-08": "Victoire 1945", "05-09": "Pacôme", "05-10": "Solange", "05-11": "Estelle", "05-12": "Achille", "05-13": "Rolande", "05-14": "Matthias", "05-15": "Denise", "05-16": "Honoré", "05-17": "Pascal", "05-18": "Eric", "05-19": "Yves", "05-20": "Bernardin", "05-21": "Constantin", "05-22": "Émile", "05-23": "Didier", "05-24": "Donatien", "05-25": "Sophie", "05-26": "Bérenger", "05-27": "Augustin", "05-28": "Germain", "05-29": "Aymar", "05-30": "Ferdinand", "05-31": "Visitation",
  "06-01": "Justin", "06-02": "Blandine", "06-03": "Kévin", "06-04": "Clotilde", "06-05": "Igor", "06-06": "Norbert", "06-07": "Gilbert", "06-08": "Médard", "06-09": "Diane", "06-10": "Landry", "06-11": "Barnabé", "06-12": "Guy", "06-13": "Antoine de Padoue", "06-14": "Élisée", "06-15": "Germaine", "06-16": "Jean-François Régis", "06-17": "Hervé", "06-18": "Léonce", "06-19": "Romuald", "06-20": "Silvère", "06-21": "Été", "06-22": "Alban", "06-23": "Audrey", "06-24": "Jean-Baptiste", "06-25": "Prosper", "06-26": "Anthelme", "06-27": "Fernand", "06-28": "Irénée", "06-29": "Pierre-Paul", "06-30": "Martial",
  "07-01": "Thierry", "07-02": "Martinien", "07-03": "Thomas", "07-04": "Florent", "07-05": "Antoine", "07-06": "Mariette", "07-07": "Raoul", "07-08": "Thibault", "07-09": "Amandine", "07-10": "Ulrich", "07-11": "Benoît", "07-12": "Olivier", "07-13": "Henri", "07-14": "Fête Nationale", "07-15": "Donald", "07-16": "ND Mt Carmel", "07-17": "Charlotte", "07-18": "Frédéric", "07-19": "Arsène", "07-20": "Marina", "07-21": "Victor", "07-22": "Marie-Madeleine", "07-23": "Brigitte", "07-24": "Christine", "07-25": "Jacques", "07-26": "Anne", "07-27": "Nathalie", "07-28": "Samson", "07-29": "Marthe", "07-30": "Juliette", "07-31": "Ignace de Loyola",
  "08-01": "Alphonse", "08-02": "Julien Eymard", "08-03": "Lydie", "08-04": "Jean-Marie Vianney", "08-05": "Abel", "08-06": "Transfiguration", "08-07": "Gaétan", "08-08": "Dominique", "08-09": "Amour", "08-10": "Laurent", "08-11": "Claire", "08-12": "Clarisse", "08-13": "Hippolyte", "08-14": "Evrard", "08-15": "Assomption", "08-16": "Armel", "08-17": "Hyacinthe", "08-18": "Hélène", "08-19": "Jean Eudes", "08-20": "Bernard", "08-21": "Christophe", "08-22": "Fabrice", "08-23": "Rose de Lima", "08-24": "Barthélemy", "08-25": "Louis", "08-26": "Natacha", "08-27": "Monique", "08-28": "Augustin", "08-29": "Sabine", "08-30": "Fiacre", "08-31": "Aristide",
  "09-01": "Gilles", "09-02": "Ingrid", "09-03": "Grégoire", "09-04": "Rosalie", "09-05": "Raïssa", "09-06": "Bertrand", "09-07": "Reine", "09-08": "Nativité de Marie", "09-09": "Alain", "09-10": "Inès", "09-11": "Adelphe", "09-12": "Apollinaire", "09-13": "Aimé", "09-14": "Croix Glorieuse", "09-15": "Roland", "09-16": "Édith", "09-17": "Renaud", "09-18": "Nadège", "09-19": "Émilie", "09-20": "Davy", "09-21": "Matthieu", "09-22": "Maurice", "09-23": "Constant", "09-24": "Thècle", "09-25": "Hermann", "09-26": "Côme", "09-27": "Vincent de Paul", "09-28": "Venceslas", "09-29": "Michel", "09-30": "Jérôme",
  "10-01": "Thérèse de l'Enfant Jésus", "10-02": "Léger", "10-03": "Gérard", "10-04": "François d'Assise", "10-05": "Fleur", "10-06": "Bruno", "10-07": "Serge", "10-08": "Pélagie", "10-09": "Denis", "10-10": "Ghislain", "10-11": "Firmin", "10-12": "Wilfried", "10-13": "Géraud", "10-14": "Juste", "10-15": "Thérèse d'Avila", "10-16": "Edwige", "10-17": "Baudouin", "10-18": "Luc", "10-19": "René Goupil", "10-20": "Adeline", "10-21": "Céline", "10-22": "Élodie", "10-23": "Jean de Capistran", "10-24": "Florentin", "10-25": "Crépin", "10-26": "Dimitri", "10-27": "Émeline", "10-28": "Jude", "10-29": "Narcisse", "10-30": "Bienvenue", "10-31": "Quentin",
  "11-01": "Toussaint", "11-02": "Défunts", "11-03": "Hubert", "11-04": "Charles", "11-05": "Sylvie", "11-06": "Bertille", "11-07": "Carine", "11-08": "Geoffroy", "11-09": "Théodore", "11-10": "Léon", "11-11": "Armistice 1918", "11-12": "Christian", "11-13": "Brice", "11-14": "Sidoine", "11-15": "Albert", "11-16": "Marguerite", "11-17": "Élisabeth", "11-18": "Aude", "11-19": "Tanguy", "11-20": "Edmond", "11-21": "Présentation de Marie", "11-22": "Cécile", "11-23": "Clément", "11-24": "Flora", "11-25": "Catherine", "11-26": "Delphine", "11-27": "Séverin", "11-28": "Jacques de la Marche", "11-29": "Saturnin", "11-30": "André",
  "12-01": "Florence", "12-02": "Viviane", "12-03": "François-Xavier", "12-04": "Barbara", "12-05": "Gérald", "12-06": "Nicolas", "12-07": "Ambroise", "12-08": "Immaculée Conception", "12-09": "Pierre Fourier", "12-10": "Romaric", "12-11": "Daniel", "12-12": "Jeanne-Françoise de Chantal", "12-13": "Lucie", "12-14": "Odile", "12-15": "Ninon", "12-16": "Alice", "12-17": "Gaël", "12-18": "Gatien", "12-19": "Urbain", "12-20": "Théophile", "12-21": "Pierre Canisius", "12-22": "Françoise-Xavière", "12-23": "Armand", "12-24": "Adèle", "12-25": "Noël", "12-26": "Étienne", "12-27": "Jean", "12-28": "Innocents", "12-29": "David", "12-30": "Roger", "12-31": "Sylvestre"
};

const getMoonPhase = (date) => {
  const jd = date / 86400000 + 2440587.5;
  const synodicMonth = 29.53058867;
  const refNewMoon = 2451549.75694;
  const age = ((jd - refNewMoon) % synodicMonth + synodicMonth) % synodicMonth;

  if (age < 1.85)  return { name: 'Nouvelle lune',        icon: '🌑' };
  if (age < 5.54)  return { name: 'Premier croissant',    icon: '🌒' };
  if (age < 9.23)  return { name: 'Premier quartier',     icon: '🌓' };
  if (age < 12.92) return { name: 'Gibbeuse croissante',  icon: '🌔' };
  if (age < 16.61) return { name: 'Pleine lune',          icon: '🌕' };
  if (age < 20.30) return { name: 'Gibbeuse décroissante',icon: '🌖' };
  if (age < 23.99) return { name: 'Dernier quartier',     icon: '🌗' };
  if (age < 27.68) return { name: 'Dernier croissant',    icon: '🌘' };
  return { name: 'Nouvelle lune', icon: '🌑' };
};

const getWindDirection = (deg) => {
  const directions = ['Nord', 'Nord Est', 'Est', 'Sud Est', 'Sud', 'Sud Ouest', 'Ouest', 'Nord Ouest'];
  return directions[Math.round(deg / 45) % 8];
};

const getAQIDetails = (index) => {
  const levels = {
    1: { label: 'Bon',        color: '#4ade80' },
    2: { label: 'Passable',   color: '#facc15' },
    3: { label: 'Moyen',      color: '#fb923c' },
    4: { label: 'Mauvais',    color: '#d9534f' },
    5: { label: 'Très Mauvais', color: '#f43f5e' }
  };
  return levels[index] || { label: '--', color: '#94a3b8' };
};

const getUVIndexColor = (uv) => {
  if (uv === null || uv === undefined) return '#94a3b8';
  if (uv <= 2)  return '#4ade80';
  if (uv <= 5)  return '#facc15';
  if (uv <= 7)  return '#fb923c';
  if (uv <= 10) return '#d9534f';
  return '#a855f7';
};

const getUVLabel = (uv) => {
  if (uv === null || uv === undefined) return '--';
  if (uv <= 2)  return 'Faible';
  if (uv <= 5)  return 'Modéré';
  if (uv <= 7)  return 'Élevé';
  return 'Très élevé';
};

const getVisibilityStatus = (km) => {
  if (km >= 10) return { label: 'Excellente', color: '#4ade80' };
  if (km >= 5)  return { label: 'Bonne',      color: '#4ade80' };
  if (km >= 2)  return { label: 'Moyenne',    color: '#facc15' };
  return { label: 'Faible', color: '#d9534f' };
};

const isDarkColor = (color) => {
  if (!color) return true;
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
  }
  const match = color.match(/[\d.]+/g);
  if (match && match.length >= 3) {
    const [r, g, b] = match.map(Number);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
  }
  return true;
};

const DayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const Meteo = ({ onClose, bgColor: parentBgColor }) => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [aqi, setAqi] = useState(null);
  const [uvi, setUvi] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mode, setMode] = useState('actuel');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const prevPressureRef = useRef(null);

  const isDark = isDarkColor(parentBgColor || 'rgba(121, 122, 128, 0.4)');

  const colors = {
    text:              isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,30,0.92)',
    textSub:           isDark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.52)',
    cardBg:            isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    cardBorder:        isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    barTrack:          isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    accent:            '#4ade80',
    inputBg:           isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    toggleBg:          isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    toggleActiveBg:    'rgba(74,222,128,0.18)',
    toggleActiveBorder:'rgba(74,222,128,0.5)',
  };

  useEffect(() => {
    const savedCity = localStorage.getItem('meteoVille');
    if (savedCity) {
      setCity(savedCity);
      setIsEditing(false);
      fetchAll({ cityName: savedCity });
    }
  }, []);

  useEffect(() => {
    if (!weather || !city) return;
    const interval = setInterval(() => fetchAll({ cityName: city }), 240000);
    return () => clearInterval(interval);
  }, [city, weather]);

  const fetchExtraData = async (lat, lon) => {
    const base = 'https://api.openweathermap.org/data/2.5';
    try {
      const aqiRes = await fetch(`${base}/air_pollution?lat=${lat}&lon=${lon}&appid=${ApiKey}`);
      if (aqiRes.ok) {
        const aqiData = await aqiRes.json();
        setAqi(aqiData.list[0].main.aqi);
      }

      const uviRes = await fetch(`${base}/uvi?lat=${lat}&lon=${lon}&appid=${ApiKey}`);
      if (uviRes.ok) {
        const uviData = await uviRes.json();
        setUvi(uviData.value);
      }
    } catch (err) {
      console.error('Erreur données extra', err);
    }
  };

  const fetchAll = async ({ cityName, lat, lon }) => {
    setLoading(true);
    const base = 'https://api.openweathermap.org/data/2.5';
    const common = `&units=metric&lang=fr&appid=${ApiKey}`;

    const locationQuery = cityName
      ? `q=${encodeURIComponent(cityName)}`
      : `lat=${lat}&lon=${lon}`;

    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${base}/weather?${locationQuery}${common}`),
        fetch(`${base}/forecast?${locationQuery}${common}&cnt=40`),
      ]);

      if (!wRes.ok) {
        setError('Lieu introuvable');
        setLoading(false);
        return;
      }

      const wData = await wRes.json();
      const fData = fRes.ok ? await fRes.json() : null;

      setWeather(prev => {
        if (prev) prevPressureRef.current = prev.main.pressure;
        return wData;
      });

      setCity(wData.name);
      localStorage.setItem('meteoVille', wData.name);
      setError('');
      setLastUpdated(new Date());
      setIsEditing(false);

      if (fData) processForecast(fData);

      fetchExtraData(wData.coord.lat, wData.coord.lon);
    } catch {
      setError('Erreur connexion');
    } finally {
      setLoading(false);
    }
  };

  const processForecast = (fData) => {
    const byDay = {};
    fData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toLocaleDateString('fr-FR');
      const hour = date.getHours();
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push({ ...item, hour });
    });
    const days = Object.entries(byDay).slice(0, 5).map(([key, items]) => {
      const best = items.find(i => i.hour >= 12 && i.hour <= 15) || items[Math.floor(items.length / 2)];
      const temps = items.map(i => i.main.temp);
      return {
        key,
        date: new Date(best.dt * 1000),
        icon: best.weather[0].icon,
        desc: best.weather[0].description,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        humidity: best.main.humidity,
        windSpeed: (best.wind.speed * 3.6).toFixed(0),
        pop: Math.round((best.pop || 0) * 100),
      };
    });
    setForecast(days);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) { setError('Géolocalisation non supportée'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchAll({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError('Accès position refusé')
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) fetchAll({ cityName: city });
  };

  const formatSunTime = (ts) =>
    new Date(ts * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const windKmH      = weather ? (weather.wind.speed * 3.6).toFixed(1) : 0;
  const humidityPct  = weather?.main.humidity || 0;
  const pressure     = weather?.main.pressure || 0;
  const visibility   = weather ? (weather.visibility / 1000).toFixed(1) : 0;
  const humidityColor = humidityPct > 80 ? '#60a5fa' : humidityPct > 50 ? colors.accent : '#facc15';

  const getPressureTrend = () => {
    const prev = prevPressureRef.current;
    if (prev === null || prev === pressure) return { label: 'Stable', icon: '→' };
    return pressure > prev
      ? { label: 'Hausse', icon: '↑', color: '#4ade80' }
      : { label: 'Baisse', icon: '↓', color: '#d9534f' };
  };

  const trend     = getPressureTrend();
  const visStatus = getVisibilityStatus(visibility);

  const getSaintDuJour = () => {
    const d = new Date();
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return Saints[key] || 'Inconnu';
  };

  const moon = getMoonPhase(Date.now());
  const stopDrag = (e) => e.stopPropagation();

  return (
    <div style={{ fontFamily: 'inherit', color: colors.text, position: 'relative', minHeight: '40px' }}>

      <button onClick={onClose} className="btnClose" onMouseDown={stopDrag}>X</button>

      {!isEditing && (
        <button onClick={() => setIsEditing(true)} className="btnEdit" title="Changer Ville" onMouseDown={stopDrag}>✏️</button>
      )}

      {isEditing && (
        <div style={{ margin: '6px 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="text" placeholder="Ville .." value={city} onChange={(e) => setCity(e.target.value)} ref={inputRef} onMouseDown={stopDrag} style={{ width: '118px', height: '26px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, padding: '0 8px', fontSize: '14px', textAlign: 'center', outline: 'none' }} />
            <button type="submit" style={{ background: colors.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Ok</button>
          </form>
          <button onClick={handleGeolocation} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0' }} title="Ma position">📍</button>
        </div>
      )}

      {error && <p style={{ color: '#d9534f', textAlign: 'center', fontSize: '12px', margin: '4px 0' }}>{error}</p>}

      {loading && !weather && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {weather && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isEditing ? '4px' : '4px', marginBottom: '4px', padding: '0 2px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.2px', marginLeft: '42px' }}>{weather.name}</div>
            </div>
            <div onMouseDown={stopDrag} style={{ display: 'flex', gap: '2px', background: 'transparent', border: 'none', borderRadius: '10px', padding: '2px', marginRight: '12px' }}>
              {['actuel', 'previsions'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? colors.toggleActiveBg : 'transparent', border: mode === m ? `1px dotted ${colors.toggleActiveBorder}` : '1px solid transparent', color: 'white', borderRadius: '6px', padding: '2px 6px 0', fontSize: '10px', cursor: 'pointer' }}>
                  {m === 'actuel' ? 'Actuel' : '5 jours'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'actuel' && (
            <div style={{ background: colors.cardBg, borderRadius: '12px'}}>
              <div style={{ padding: '6px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 608, lineHeight: 1 }}>
                    {Math.round(weather.main.temp)}°
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSub, marginTop: '2px' }}>
                    Ressenti {Math.round(weather.main.feels_like)}°
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4.8px' }}>
                    <span style={{ fontSize: '11px', color: '#60a5fa' }}>{Math.round(weather.main.temp_min)}°</span>
                    <div style={{ flex: 1, height: '3px', background: colors.barTrack, borderRadius: '3px', width: '60px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #60a5fa, #f97316)', width: '100%' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#f97316' }}>{Math.round(weather.main.temp_max)}°</span>
                  </div>
                </div>
                <div>
                  <img src={weatherIconMap[weather.weather[0].icon] || '../static/soleil.svg'} alt={weather.weather[0].description} style={{ width: '42px', height: '42px', opacity: 0.92 }} />
                  <div style={{ fontSize: '11px', color: colors.textSub, textTransform: 'capitalize', marginTop: '1px' }}>{weather.weather[0].description}</div>
                </div>
              </div>


              <hr className="line2" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '7px' }}>
                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 22px 0 0', letterSpacing: '0.04em',  }}>Humidité</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{humidityPct}<span style={{ fontSize: '12px', fontWeight: 400 }}> %</span></div>
                  </div>
                  <div style={{ height: '3px', background: colors.barTrack, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${humidityPct}%`, background: humidityColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 14px 0 0', letterSpacing: '0.04em' }}>Vent</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{windKmH}<span style={{ fontSize: '12px', fontWeight: 400 }}> km/h</span></div>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSub, marginTop: '1px' }}>{getWindDirection(weather.wind.deg)}</div>
                </div>

                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                  <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 10px 0 0', letterSpacing: '0.04em' }}>Pression</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{pressure}<span style={{ fontSize: '11px', fontWeight: 400 }}> hPa</span></div>
                  </div>
                  <div style={{ fontSize: '10px', color: trend.color || colors.textSub, marginTop: '1px', fontWeight: 500 }}>
                    {trend.icon} {trend.label}
                  </div>
                </div>

                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 20px 0 0', letterSpacing: '0.04em' }}>Air</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: getAQIDetails(aqi).color }}>{getAQIDetails(aqi).label}</div>
                  </div>
                  <div style={{ fontSize: '10px', color: colors.textSub, marginTop: '1px' }}>Indice : {aqi || '-'}</div>
                </div>

                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 22px 0 0', letterSpacing: '0.04em' }}>Indice Uv</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: getUVIndexColor(uvi) }}>
                      {uvi !== null && uvi !== undefined ? uvi.toFixed(1) : '-'}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: colors.textSub, marginTop: '1px' }}>
                    {getUVLabel(uvi)}
                  </div>
                </div>

                <div style={{ padding: '2.8px 11px' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ fontSize: '10px', color: colors.textSub, margin: '3px 12px 0 0', letterSpacing: '0.04em' }}>Visibilité</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{visibility}<span style={{ fontSize: '11px', fontWeight: 400 }}> km</span></div>
                  </div>
                  <div style={{ fontSize: '10px', color: visStatus.color, marginTop: '1px', fontWeight: 500 }}>
                    {visStatus.label}
                  </div>
                </div>
              </div>

              <hr className="line3" />

              <div style={{ padding: '2.8px 14px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ fontSize: '10px', color: colors.textSub, marginTop: '2px' }}>Lever</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginLeft: '8px' }}>{formatSunTime(weather.sys.sunrise)}</div>
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{ fontSize: '10px', color: colors.textSub, marginTop: '2px' }}>Coucher</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginLeft: '8px' }}>{formatSunTime(weather.sys.sunset)}</div>
                </div>
              </div>

              <div style={{ padding: '4px 14px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '10px', color: colors.textSub }}>Lune</div>
                  <div style={{ fontSize: '12px' }} title={moon.name}>{moon.icon}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '10px', color: colors.textSub }}>Saint</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: colors.accent }}>{getSaintDuJour()}</div>
                </div>
              </div>

            </div>
          )}

          {mode === 'previsions' && (
            <div>
              {forecast ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {forecast.map((day, i) => {
                    const isToday = i === 0;
                    return (
                      <div key={day.key} style={{ background: isToday ? 'rgba(74,222,128,0.08)' : colors.cardBg, border: `1px solid ${isToday ? 'rgba(74,222,128,0.3)' : colors.cardBorder}`, borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '30px', fontSize: '12px', color: isToday ? colors.accent : colors.textSub, fontWeight: isToday ? 600 : 400 }}>
                          {isToday ? 'Auj.' : DayNames[day.date.getDay()]}
                        </div>
                        <img src={weatherIconMap[day.icon] || '../static/soleil.svg'} alt={day.desc} style={{ width: '26px', height: '26px' }} />
                        <div style={{ flex: 1, fontSize: '11px', color: colors.textSub, textTransform: 'capitalize', lineHeight: 1.2 }}>
                          {day.desc}
                          {day.pop > 10 && (
                            <span style={{ color: '#60a5fa', marginLeft: '5px' }}>💧{day.pop}%</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <span style={{ color: '#60a5fa' }}>{Math.round(day.tempMin)}°</span>
                          <div style={{ width: '28px', height: '3px', background: colors.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #f97316)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ color: '#f97316' }}>{Math.round(day.tempMax)}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div className="spinner" />
                </div>
              )}

            </div>

          )}

          {lastUpdated && (
            <div style={{ fontSize: '10.6px', textAlign: 'center', color: colors.textSub, fontStyle: 'italic', padding: '2px' }}>
                Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </>
      )}

<style jsx>{`

.btnClose { position: absolute; top: -2px; right: -10px; color: #d9534f; background: transparent; border: none; border-radius: 8px; width: 18px; height: 18px; padding: 0; cursor: pointer; font-size: 12px; transition: background 0.16s; display: flex; align-items: center; justify-content: center; }

.btnClose:hover { background: white; }

.btnEdit { position: absolute; top: 0; left: -6px; background: transparent; border: none; cursor: pointer; font-size: 11px; padding: 0; opacity: 0.7; transition: opacity 0.16s; }

.btnEdit:hover { opacity: 1; }

.spinner { width: 18px; height: 18px; border: 2.5px solid rgba(74,222,128,0.2); border-top-color: #4ade80; border-radius: 50%; animation: spin 0.86s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

.line2, .line3 { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0)); margin: 4px auto; width: 82%; }

.line3 { width: 62%; }

`}</style>

    </div>
  )
}
export default Meteo