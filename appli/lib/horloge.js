import React, { useState, useEffect, useRef } from 'react';
import Meteo from '../lib/meteo';

const CLOCK_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

const LED_SEGMENTS = {
  0: [1, 1, 1, 0, 1, 1, 1], 1: [0, 0, 1, 0, 0, 1, 0], 2: [1, 0, 1, 1, 1, 0, 1],
  3: [1, 0, 1, 1, 0, 1, 1], 4: [0, 1, 1, 1, 0, 1, 0], 5: [1, 1, 0, 1, 0, 1, 1],
  6: [1, 1, 0, 1, 1, 1, 1], 7: [1, 0, 1, 0, 0, 1, 0], 8: [1, 1, 1, 1, 1, 1, 1], 9: [1, 1, 1, 1, 0, 1, 1],
};

const usePersistedState = (key, defaultValue, { json = false } = {}) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    if (json) {
      try { return JSON.parse(raw); } catch { return defaultValue; }
    }
    if (typeof defaultValue === 'boolean') return raw === 'true';
    return raw;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, json ? JSON.stringify(value) : String(value));
  }, [key, value, json]);

  return [value, setValue];
};

const useDraggable = (onDrag) => {
  const isDraggingRef = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    isDraggingRef.current = true;
    startPosition.current = { x: e.clientX, y: e.clientY };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPosition.current.x;
    const dy = e.clientY - startPosition.current.y;
    startPosition.current = { x: e.clientX, y: e.clientY };
    onDrag(prev => ({
      top: Math.max(0, prev.top + dy),
      left: Math.max(0, prev.left + dx),
    }));
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return onMouseDown;
};

const OFF_COLOR = 'rgba(255,255,255,0.1)';

const getZonedHMS = (date, timezone) => {
  if (!timezone) {
    return {
      hours: String(date.getHours()).padStart(2, '0'),
      minutes: String(date.getMinutes()).padStart(2, '0'),
      seconds: String(date.getSeconds()).padStart(2, '0'),
    };
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezone,
  }).formatToParts(date);
  const get = (t) => parts.find(p => p.type === t)?.value.padStart(2, '0') ?? '00';
  return { hours: get('hour'), minutes: get('minute'), seconds: get('second') };
};

const LedDigit = React.memo(({ digit, onColor }) => {
  const segs = LED_SEGMENTS[digit] || [0, 0, 0, 0, 0, 0, 0];
  const c = (on) => (on ? onColor : OFF_COLOR);
  return (
    <div style={{ display: 'inline-block', position: 'relative', width: '12px', height: '18px', margin: '0 1px' }}>
      <div style={{ position: 'absolute', top: '0', left: '2px', width: '8px', height: '2px', backgroundColor: c(segs[0]), clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }} />
      <div style={{ position: 'absolute', top: '2px', left: '0', width: '2px', height: '6px', backgroundColor: c(segs[1]) }} />
      <div style={{ position: 'absolute', top: '2px', right: '0', width: '2px', height: '6px', backgroundColor: c(segs[2]) }} />
      <div style={{ position: 'absolute', top: '8px', left: '2px', width: '8px', height: '2px', backgroundColor: c(segs[3]), clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }} />
      <div style={{ position: 'absolute', top: '10px', left: '0', width: '2px', height: '6px', backgroundColor: c(segs[4]) }} />
      <div style={{ position: 'absolute', top: '10px', right: '0', width: '2px', height: '6px', backgroundColor: c(segs[5]) }} />
      <div style={{ position: 'absolute', bottom: '0', left: '2px', width: '8px', height: '2px', backgroundColor: c(segs[6]), clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }} />
    </div>
  );
});

const LedSeparator = React.memo(({ color }) => (
  <div style={{ display: 'inline-block', margin: '0 2px', textAlign: 'center' }}>
    <div style={{ width: '2px', height: '2px', backgroundColor: color, margin: '4px auto' }} />
    <div style={{ width: '2px', height: '2px', backgroundColor: color, margin: '4px auto' }} />
  </div>
));

const LedClock = React.memo(({ time, timezone, fontColor, showSeconds }) => {
  const { hours, minutes, seconds } = getZonedHMS(time, timezone);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: '0', fontFamily: 'monospace' }}>
      <LedDigit digit={hours[0]} onColor={fontColor} /> <LedDigit digit={hours[1]} onColor={fontColor} />
      <LedSeparator color={fontColor} />
      <LedDigit digit={minutes[0]} onColor={fontColor} /> <LedDigit digit={minutes[1]} onColor={fontColor} />
      {showSeconds && (
        <>
          <LedSeparator color={fontColor} />
          <LedDigit digit={seconds[0]} onColor={fontColor} /> <LedDigit digit={seconds[1]} onColor={fontColor} />
        </>
      )}
    </div>
  );
});

const FlipDigit = React.memo(({ current, previous, fontColor }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  useEffect(() => {
    if (current !== previous) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [current, previous]);
  return (
    <div style={{ position: 'relative', width: '14px', height: '18px', margin: '0 1px', perspective: '100px' }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#333', color: fontColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', transform: isFlipping ? 'rotateX(-90deg)' : 'rotateX(0deg)', transformOrigin: 'center bottom', transition: 'transform 0.15s ease-in', border: '1px solid #555' }}> {isFlipping ? previous : current} </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#333', color: fontColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', borderRadius: '2px', transform: isFlipping ? 'rotateX(0deg)' : 'rotateX(90deg)', transformOrigin: 'center top', transition: 'transform 0.15s ease-out 0.15s', border: '1px solid #555' }}> {current} </div>
    </div>
  );
});

const FlipClock = React.memo(({ time, prevTime, timezone, fontColor, showSeconds }) => {
  const { hours, minutes, seconds } = getZonedHMS(time, timezone);
  const { hours: prevHours, minutes: prevMinutes, seconds: prevSeconds } = getZonedHMS(prevTime, timezone);
  const sep = <div style={{ margin: '0 2px', color: fontColor, fontSize: '12px', fontWeight: 'bold' }}>:</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
      <FlipDigit current={hours[0]} previous={prevHours[0]} fontColor={fontColor} /> <FlipDigit current={hours[1]} previous={prevHours[1]} fontColor={fontColor} />
      {sep}
      <FlipDigit current={minutes[0]} previous={prevMinutes[0]} fontColor={fontColor} /> <FlipDigit current={minutes[1]} previous={prevMinutes[1]} fontColor={fontColor} />
      {showSeconds && (
        <>
          {sep}
          <FlipDigit current={seconds[0]} previous={prevSeconds[0]} fontColor={fontColor} /> <FlipDigit current={seconds[1]} previous={prevSeconds[1]} fontColor={fontColor} />
        </>
      )}
    </div>
  );
});

const AnalogClock = React.memo(({ time, timezone, fontColor, bgColor, fontFamily }) => {
  const { hours, minutes, seconds } = getZonedHMS(time, timezone);
  const h = Number(hours), m = Number(minutes), s = Number(seconds);
  return (
    <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `1.2px solid ${fontColor}`, position: 'relative', backgroundColor: bgColor }}>
      {CLOCK_NUMBERS.map((number) => {
        const angle = (number - 3) * 30;
        const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);
        return (
          <div key={number} style={{ position: 'absolute', top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)', color: fontColor, fontSize: '6.8px', fontFamily: fontFamily }}> {number} </div>
        );
      })}
      <div style={{ position: 'absolute', width: '1px', height: '18px', backgroundColor: 'red', top: '6px', left: '24px', transformOrigin: 'bottom', transform: `rotate(${s * 6}deg)` }} />
      <div style={{ position: 'absolute', width: '1.6px', height: '14px', backgroundColor: fontColor, top: '10px', left: '23px', transformOrigin: 'bottom', transform: `rotate(${m * 6}deg)` }} />
      <div style={{ position: 'absolute', width: '1.6px', height: '12px', backgroundColor: fontColor, top: '12px', left: '23px', transformOrigin: 'bottom', transform: `rotate(${h * 30 + m * 0.5}deg)` }} />
    </div>
  );
});

const Horloge = () => {
  const defaultSettings = { bgColor: 'rgba(121, 122, 128, 0.7)',fontFamily: 'Comic Sans MS, cursive',fontColor: 'white',showSeconds: true,is12HourFormat: false,clockMode: 'digital', };

  const [time, setTime] = useState(new Date());
  const [prevTime, setPrevTime] = useState(new Date());
  const [bgColor, setBgColor] = usePersistedState('clockBgColor', defaultSettings.bgColor);
  const appliedBgColor = bgColor === 'rgba(121, 122, 128, 0.7)' ? '#5A5E6B' : bgColor;
  const [fontFamily, setFontFamily] = usePersistedState('clockFontFamily', defaultSettings.fontFamily);
  const [fontColor, setFontColor] = usePersistedState('clockFontColor', defaultSettings.fontColor);
  const [showSeconds, setShowSeconds] = usePersistedState('clockShowSeconds', defaultSettings.showSeconds);
  const [is12HourFormat, setIs12HourFormat] = usePersistedState('clockIs12HourFormat', defaultSettings.is12HourFormat);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showGearIcon, setShowGearIcon] = useState(false);
  const [clockMode, setClockMode] = usePersistedState('clockClockMode', defaultSettings.clockMode);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [showWeatherPopup, setShowWeatherPopup] = usePersistedState('meteo', false);
  const [weatherPopupPosition, setWeatherPopupPosition] = usePersistedState('meteoPosition', { top: 0, left: 0 }, { json: true });
  const handleMouseDown = useDraggable(setWeatherPopupPosition);

  const DefaultTimezone = { id: 'france-local', value: undefined };

  const PredefinedTimezones = [
    { id: 'france-metropolitan', name: 'France', value: 'Europe/Paris' },
    { id: 'martinique', name: 'Martinique', value: 'America/Martinique' },
    { id: 'reunion', name: 'La Réunion', value: 'Indian/Reunion' },
    { id: 'guadeloupe', name: 'Guadeloupe', value: 'America/Guadeloupe' },
    { id: 'guyane', name: 'Guyane', value: 'America/Cayenne' },
    { id: 'polynesie', name: 'Polynésie française', value: 'Pacific/Tahiti' },
  ];

  const [userTimezones, setUserTimezones] = usePersistedState('clockUserTimezones', [], { json: true });
  const [newTimezone, setNewTimezone] = useState('');
  const [selectedPredefinedTimezone, setSelectedPredefinedTimezone] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('meteoPosition')) return;
    const clockElement = document.getElementById('clock');
    if (clockElement) {
      const rect = clockElement.getBoundingClientRect();
      setWeatherPopupPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX - 88 });
    }
  }, []);

  useEffect(() => {
    let timeoutId;
    const tick = () => {
      setTime(prev => { setPrevTime(prev); return new Date(); });
      timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => clearTimeout(timeoutId);
  }, []);

  const resetToDefaults = () => {
    setBgColor(defaultSettings.bgColor);
    setFontFamily(defaultSettings.fontFamily);
    setFontColor(defaultSettings.fontColor);
    setShowSeconds(defaultSettings.showSeconds);
    setIs12HourFormat(defaultSettings.is12HourFormat);
    setClockMode(defaultSettings.clockMode);
    setUserTimezones([]);
    setNewTimezone('');
    setSelectedPredefinedTimezone('');
  };

  const formatTime = (date, timezone) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: is12HourFormat,
      timeZone: timezone,
    };

    if (timezone === undefined) {
      delete options.timeZone;
    }

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  };

  const formatFullDate = (date, timezone) => {
    const options = {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: timezone,
    };

    if (timezone === undefined) {
      delete options.timeZone;
    }

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  };

  const FullScreenClock = ({ time, bgColor, fontColor, fontFamily, is12HourFormat, showSeconds, onExitFullScreen, timezone }) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: is12HourFormat,
      timeZone: timezone,
    };

    if (timezone === undefined) {
      delete options.timeZone;
    }

    const formattedTime = new Intl.DateTimeFormat('fr-FR', options).format(time);

    return (

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appliedBgColor, color: fontColor, fontFamily: fontFamily, fontSize: '18rem', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, }}> {formattedTime}

        <button onClick={onExitFullScreen} style={{ position: 'absolute', bottom: '20px', right: '20px', padding: '0 6px', backgroundColor: 'rgba(121, 122, 128, 0.90)', color: 'white', border: 'none', borderRadius: '4.8px', cursor: 'pointer', zIndex: 2000, fontSize: '16px', fontWeight: 'bold' }}> --> </button>

      </div>
    );
  };

  const renderClock = (timezone) => {
    switch (clockMode) {
      case 'analog':
        return <AnalogClock time={time} timezone={timezone} fontColor={fontColor} bgColor={bgColor} fontFamily={fontFamily} />;
      case 'led':
        return <LedClock time={time} timezone={timezone} fontColor={fontColor} showSeconds={showSeconds} />;
      case 'flip':
        return <FlipClock time={time} prevTime={prevTime} timezone={timezone} fontColor={fontColor} showSeconds={showSeconds} />;
      default:
        return formatTime(time, timezone);
    }
  };

  const addTimezone = (timezoneObject) => {
    if (timezoneObject.value !== DefaultTimezone.value && !userTimezones.some(tz => tz.value === timezoneObject.value)) {
      setUserTimezones([...userTimezones, timezoneObject]);
    }
  };

  const handleManualAddTimezone = () => {
    if (newTimezone) {
      const name = newTimezone.includes('/') ? newTimezone.split('/').pop().replace(/_/g, ' ') : newTimezone;
      addTimezone({ id: newTimezone, name: name, value: newTimezone });
      setNewTimezone('');
    }
  };

  const handlePredefinedTimezoneSelect = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const selectedTimezone = PredefinedTimezones.find(tz => tz.value === selectedValue);
      if (selectedTimezone) {
        addTimezone(selectedTimezone);
        setSelectedPredefinedTimezone('');
      }
    }
  };

  const handleRemoveTimezone = (id) => {
    setUserTimezones(userTimezones.filter(tz => tz.id !== id));
  };

  const allTimezonesToDisplay = [DefaultTimezone, ...userTimezones];

  const getClockWidth = (isMainClock) => {
    if (clockMode === 'flip') {
      return isMainClock ? '140px' : '160px';
    }
    return isMainClock ? '88px' : '88px';
  };

  return (
    <div>
      {allTimezonesToDisplay.map(tz => (
        <div key={tz.id} id="clock" style={{ float: 'right', marginRight: tz.id === DefaultTimezone.id ? '8.48vw' : '64px', backgroundColor: bgColor, borderRadius: '0 0 8px 8px', padding: '0', fontSize: '18px', color: fontColor, fontFamily: fontFamily, cursor: 'pointer', textAlign: 'center', position: 'relative', width: getClockWidth(tz.id === DefaultTimezone.id), display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowCustomization(!showCustomization)} onMouseEnter={() => { setShowTooltip(true); setShowGearIcon(true); }} onMouseLeave={() => { setShowTooltip(false); setShowGearIcon(false); }} >

          {tz.id === DefaultTimezone.id && (
            <div onClick={(e) => { e.stopPropagation(); setShowWeatherPopup(!showWeatherPopup); }} style={{ position: 'relative', opacity: showGearIcon ? 1 : 0, visibility: showGearIcon ? 'visible' : 'hidden', transition: 'opacity 0.68s ease-in-out, visibility 0.68s ease-in-out', cursor: 'pointer', fontSize: '20px', userSelect: 'none', right: '14px' }}> ☀️ </div>
          )}

          <div style={{ flexGrow: 1, cursor: 'pointer', margin: '0' }} onClick={() => setShowCustomization(!showCustomization)}> {renderClock(tz.value)} </div>

          {showTooltip && ( <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', width: '148px', backgroundColor: bgColor, borderRadius: '8px', padding: '2px', fontSize: '14px', color: fontColor, fontFamily: fontFamily, textAlign: 'center', zIndex: 100, }} > {tz.id !== DefaultTimezone.id && ( <> {tz.name} <br/> </> )} {formatFullDate(time, tz.value)} </div> )}

          {tz.id === DefaultTimezone.id && (
            <div style={{ position: 'relative', opacity: showGearIcon ? 1 : 0, visibility: showGearIcon ? 'visible' : 'hidden', transition: 'opacity 0.68s ease-in-out, visibility 0.68s ease-in-out', cursor: 'pointer', fontSize: '20px', userSelect: 'none', left: '14px' }} onClick={() => setShowCustomization(!showCustomization)}> ⚙️ </div>
          )}

          {tz.id !== DefaultTimezone.id && (
            <button onClick={() => handleRemoveTimezone(tz.id)} className="btnClose2" >X</button>
          )}
        </div>
      ))}

      {isFullScreen && ( <FullScreenClock time={time} bgColor={bgColor} fontColor={fontColor} fontFamily={fontFamily} is12HourFormat={is12HourFormat} showSeconds={showSeconds} onExitFullScreen={() => setIsFullScreen(false)} timezone={DefaultTimezone.value} /> )}

      {showCustomization && (

        <div style={{ position: 'absolute', top: '48px', right: '116px', backgroundColor: 'rgba(121, 122, 128, 0.90)', borderRadius: '12px', padding: '4px', width: '286px', color: 'white', zIndex: 9999 }}>

          <button onClick={() => setShowCustomization(!showCustomization)} className="btnClose">X</button>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <label>Mode :</label>
            <select value={clockMode} onChange={(e) => setClockMode(e.target.value)} style={{ marginLeft: '10px', color: 'rgba(121,122,128)', backgroundColor: 'white', height: '20px', paddingTop: '0', borderRadius: '6px', cursor: 'pointer', border: 'none', textAlignLast: 'center' }} >
              <option value="digital">Numérique</option> <option value="analog">Analogique</option>
              <option value="led">Led</option> <option value="flip">Flip</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '14px', marginTop: '16px' }}>

            <div style={{ marginRight: '26px' }}>
              <label>Horloge :</label>
              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} style={{ marginLeft: '8px', cursor: 'pointer' }} />
            </div>

            <div>
              <label>Fond :</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ marginLeft: '8px', cursor: 'pointer' }} />
            </div>

          </div>

          <div style={{ textAlign: 'center'}}>
            <label>Police :</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ marginLeft: '10px', color: 'rgba(121,122,128)', backgroundColor: 'white', height: '18px', paddingTop: '0', borderRadius: '6px', cursor: 'pointer', border: 'none', textAlignLast: 'center' }}>
              <option value="Comic Sans MS, cursive">Comic Sans</option> <option value="Arial, sans-serif">Arial</option> <option value="'Courier New', monospace">Courier New</option> <option value="Georgia, serif">Georgia</option> <option value="'Times New Roman', serif">Times New Roman</option> <option value="Verdana, sans-serif">Verdana</option> <option value="Tahoma, sans-serif">Tahoma</option> <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option> <option value="Impact, sans-serif">Impact</option> <option value="'Lucida Console', monospace">Lucida Console</option>
              </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>

            <label className="coche"> Secondes
              <input type="checkbox" checked={showSeconds} onChange={() => setShowSeconds(!showSeconds)} />
              <span className="checkmark" style={{ marginLeft: '28px' }}></span>
            </label>

            <label className="coche" style={{ marginLeft: '46px', paddingRight: '22px' }}> 12 / 24
              <input type="checkbox" checked={is12HourFormat} onChange={() => setIs12HourFormat(!is12HourFormat)} />
              <span className="checkmark" style={{ marginLeft: '4.8px' }}></span>
            </label>

          </div>

          <hr className="line" />

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <label>Fuseau horaire</label>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <label htmlFor="domtom-timezone-select">Prédéfinis :</label>
            <select id="domtom-timezone-select" value={selectedPredefinedTimezone} onChange={handlePredefinedTimezoneSelect} style={{ marginLeft: '8px', padding: '4px', borderRadius: '6px', border: '1px solid #ccc', color: 'rgb(121, 122, 128)', backgroundColor: 'white', cursor: 'pointer', width: '122px' }}>
              <option value="">Ajouter ..</option>
              {PredefinedTimezones.map(tz => ( <option key={tz.id} value={tz.value} disabled={userTimezones.some(u_tz => u_tz.value === tz.value) || DefaultTimezone.value === tz.value}> {tz.name} </option> ))}
            </select>
          </div>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <label htmlFor="timezone-input">Ou manuellement</label>
            <input id="timezone-input" type="text" value={newTimezone} onChange={(e) => setNewTimezone(e.target.value)} placeholder="Ex: America/New_York" style={{ marginLeft: '8px', padding: '4px', borderRadius: '6px', border: 'none', color: 'black' }} />
            <button onClick={handleManualAddTimezone} style={{ marginLeft: '10px', padding: '0 4px', backgroundColor: '#4ade80', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', width: '62px', fontSize: '14px' }}>Ajouter</button>
          </div>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <span style={{ display: 'inline-block', backgroundColor: 'transparent' }}> {DefaultTimezone.name} </span>
            {userTimezones.map(tz => (
              <span key={tz.id} style={{ display: 'initial', backgroundColor: '#4ade80', color: 'white', padding: '0 6px 2px', borderRadius: '12px', fontSize: '12px' }}>
                {tz.name}
                <button onClick={() => handleRemoveTimezone(tz.id)} style={{ marginLeft: '2px', backgroundColor: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', paddingRight: '0', width: '0'  }}>x</button>
              </span>
            ))}
          </div>

          <hr className="line" />

          <div style={{ textAlign: 'center' }}>
            <label htmlFor="" style={{ color: 'white', margin: '6px 6px 0 0' }}>Plein écran : </label>
            <button style={{ backgroundColor: 'transparent', border: 'none', width: '26px' }} onClick={() => setIsFullScreen(!isFullScreen)} > <img src="../static/full.png"/> </button>

            <label htmlFor="" style={{ color: 'white', margin: '6px 6px 0 18px' }}>Reset : </label>
            <button style={{ backgroundColor: 'transparent', paddingRight: '0', border: 'none', width: '26px' }} onClick={resetToDefaults}> <img src="../static/reset.png" style={{ marginRight: '0' }}/> </button>
          </div>

        </div>
      )}

      {showWeatherPopup && (
        <div onMouseDown={handleMouseDown} style={{ position: 'absolute', top: `${weatherPopupPosition.top}px`, left: `${weatherPopupPosition.left}px`, backgroundColor: bgColor, borderRadius: '12px', padding: '0 12px', fontFamily: fontFamily, color: 'white', zIndex: 200, width: '298px', cursor: 'grab' }}> <Meteo onClose={() => setShowWeatherPopup(false)} />
        </div>
      )}

<style jsx>{`

.btnClose { position: absolute; top: 0; right: 1px; float: right; color: #d9534f; background-color: transparent; border: none; border-radius: 8px; width: 18px; height: 20px; padding: 0; transition: transform 0.18s; }

.btnClose:hover { background-color: white; }

.btnClose2 { position: absolute; top: -6px; left: -16px; background-color: transparent; color: #d9534f; border: none; border-radius: 6px; cursor: pointer; padding: 0 1px; font-size: 10px; width: 8.8px; height: 18px; }

.btnClose2:hover { background-color: white; }

.btnClose2:active { transform: scale(0.94); }

.line { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0)); margin: 6px auto; width: 100%; }

`}</style>

    </div>
  )
}
export default Horloge