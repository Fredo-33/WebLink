import React, { useState, useEffect, useRef } from 'react';
import Meteo from '../lib/meteo';

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

const Horloge = () => {
  const DEFAULT_SETTINGS = { bgColor: 'rgba(121, 122, 128, 0.7)',fontFamily: 'Comic Sans MS, cursive',fontColor: '#FFFFFF',showSeconds: true,is12HourFormat: false,isAnalogMode: false, };

  const [time, setTime] = useState(new Date());
  const [bgColor, setBgColor] = useState(DEFAULT_SETTINGS.bgColor);
  const appliedBgColor = bgColor === 'rgba(121, 122, 128, 0.7)' ? '#5A5E6B' : bgColor;
  const [fontFamily, setFontFamily] = useState(DEFAULT_SETTINGS.fontFamily);
  const [fontColor, setFontColor] = useState(DEFAULT_SETTINGS.fontColor);
  const [showSeconds, setShowSeconds] = useState(DEFAULT_SETTINGS.showSeconds);
  const [is12HourFormat, setIs12HourFormat] = useState(DEFAULT_SETTINGS.is12HourFormat);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showGearIcon, setShowGearIcon] = useState(false);
  const [isAnalogMode, setIsAnalogMode] = useState(DEFAULT_SETTINGS.isAnalogMode);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const [weatherPopupPosition, setWeatherPopupPosition] = useState({ top: 0, left: 0 });
  const handleMouseDown = useDraggable(setWeatherPopupPosition);

  const FIXED_DEFAULT_TIMEZONE = { id: 'france-metropolitan', value: 'Europe/Paris' };

  const PREDEFINED_DOMTOM_TIMEZONES = [
    { id: 'martinique', name: 'Martinique', value: 'America/Martinique' },
    { id: 'reunion', name: 'La Réunion', value: 'Indian/Reunion' },
    { id: 'guadeloupe', name: 'Guadeloupe', value: 'America/Guadeloupe' },
    { id: 'guyane', name: 'Guyane', value: 'America/Cayenne' },
  ];

  const [userTimezones, setUserTimezones] = useState([]);
  const [newTimezone, setNewTimezone] = useState('');
  const [selectedDomTomTimezone, setSelectedDomTomTimezone] = useState('');

  useEffect(() => {
    const savedShowWeatherPopup = localStorage.getItem('show-weather-popup');
    if (savedShowWeatherPopup === 'true') {
      setShowWeatherPopup(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('show-weather-popup', showWeatherPopup ? 'true' : 'false');
  }, [showWeatherPopup]);

  useEffect(() => {
    const savedWeatherPosition = localStorage.getItem('weather-popup-position');
    if (savedWeatherPosition) {
      setWeatherPopupPosition(JSON.parse(savedWeatherPosition));
    } else {
      const clockElement = document.getElementById('clock');
      if (clockElement) {
        const rect = clockElement.getBoundingClientRect();
        setWeatherPopupPosition({ top: rect.bottom + window.scrollY + 5 , left: rect.left + window.scrollX - 88 });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('weather-popup-position', JSON.stringify(weatherPopupPosition));
  }, [weatherPopupPosition]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedSettings = {
      bgColor: localStorage.getItem('clock-bgColor'),
      fontFamily: localStorage.getItem('clock-fontFamily'),
      fontColor: localStorage.getItem('clock-fontColor'),
      showSeconds: localStorage.getItem('clock-showSeconds') !== null
        ? localStorage.getItem('clock-showSeconds') === 'true'
        : DEFAULT_SETTINGS.showSeconds,
      is12HourFormat: localStorage.getItem('clock-is12HourFormat') !== null
        ? localStorage.getItem('clock-is12HourFormat') === 'true'
        : DEFAULT_SETTINGS.is12HourFormat,
      isAnalogMode: localStorage.getItem('clock-isAnalogMode') !== null
        ? localStorage.getItem('clock-isAnalogMode') === 'true'
        : DEFAULT_SETTINGS.isAnalogMode,
    };

    if (savedSettings.bgColor) setBgColor(savedSettings.bgColor);
    if (savedSettings.fontFamily) setFontFamily(savedSettings.fontFamily);
    if (savedSettings.fontColor) setFontColor(savedSettings.fontColor);
    setShowSeconds(savedSettings.showSeconds);
    setIs12HourFormat(savedSettings.is12HourFormat);
    setIsAnalogMode(savedSettings.isAnalogMode);

    const savedUserTimezones = localStorage.getItem('clock-userTimezones');
    if (savedUserTimezones) {
      setUserTimezones(JSON.parse(savedUserTimezones));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('clock-bgColor', bgColor);
    localStorage.setItem('clock-fontFamily', fontFamily);
    localStorage.setItem('clock-fontColor', fontColor);
    localStorage.setItem('clock-showSeconds', showSeconds);
    localStorage.setItem('clock-is12HourFormat', is12HourFormat);
    localStorage.setItem('clock-isAnalogMode', isAnalogMode);
    localStorage.setItem('clock-userTimezones', JSON.stringify(userTimezones));
  }, [bgColor, fontFamily, fontColor, showSeconds, is12HourFormat, isAnalogMode, userTimezones]);

  const resetToDefaults = () => {
    setBgColor(DEFAULT_SETTINGS.bgColor);
    setFontFamily(DEFAULT_SETTINGS.fontFamily);
    setFontColor(DEFAULT_SETTINGS.fontColor);
    setShowSeconds(DEFAULT_SETTINGS.showSeconds);
    setIs12HourFormat(DEFAULT_SETTINGS.is12HourFormat);
    setIsAnalogMode(DEFAULT_SETTINGS.isAnalogMode);
    setUserTimezones([]);
    setNewTimezone('');
    setSelectedDomTomTimezone('');

    localStorage.removeItem('clock-bgColor');
    localStorage.removeItem('clock-fontFamily');
    localStorage.removeItem('clock-fontColor');
    localStorage.removeItem('clock-showSeconds');
    localStorage.removeItem('clock-is12HourFormat');
    localStorage.removeItem('clock-isAnalogMode');
    localStorage.removeItem('clock-userTimezones');
  };

  const formatTime = (date, timezone) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: is12HourFormat,
      timeZone: timezone,
    };
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  };

  const formatFullDate = (date, timezone) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    };
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
    const formattedTime = new Intl.DateTimeFormat('fr-FR', options).format(time);

    return (

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: appliedBgColor, color: fontColor, fontFamily: fontFamily, fontSize: '18rem', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, }}> {formattedTime}

        <button onClick={onExitFullScreen} style={{ position: 'absolute', bottom: '20px', right: '20px', padding: '0 6px', backgroundColor: 'rgba(121, 122, 128, 0.90)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', zIndex: 2000, fontSize: '16px', fontWeight: 'bold' }}> --> </button>

      </div>
    );
  };

  const AnalogClock = ({ time, timezone }) => {
    const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

    const zonedDate = new Date(time.toLocaleString('en-US', { timeZone: timezone }));

    const hours = zonedDate.getHours();
    const minutes = zonedDate.getMinutes();
    const seconds = zonedDate.getSeconds();

    return (

    <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `1.2px solid ${fontColor}`, position: 'relative', backgroundColor: bgColor }} >

        {numbers.map((number) => {
          const angle = (number - 3) * 30;
          const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);

          return (

            <div key={number} style={{ position: 'absolute', top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)', color: fontColor, fontSize: '6.8px', fontFamily: fontFamily }}> {number} </div> ); })}

              <div style={{ position: 'absolute', width: '1px', height: '18px', backgroundColor: 'red', top: '6px', left: '24px', transformOrigin: 'bottom', transform: `rotate(${seconds * 6}deg)` }} />

              <div style={{ position: 'absolute', width: '1.5px', height: '14px', backgroundColor: fontColor, top: '10px', left: '23px', transformOrigin: 'bottom', transform: `rotate(${minutes * 6}deg)` }} />

              <div style={{ position: 'absolute', width: '1.5px', height: '12px', backgroundColor: fontColor, top: '12px', left: '23px', transformOrigin: 'bottom', transform: `rotate(${hours * 30 + minutes * 0.5}deg)` }} />

            </div>
          );
        };

  const addTimezone = (timezoneObject) => {
    if (timezoneObject.value !== FIXED_DEFAULT_TIMEZONE.value &&
        !userTimezones.some(tz => tz.value === timezoneObject.value)) {
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

  const handleDomTomTimezoneSelect = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const selectedDomTom = PREDEFINED_DOMTOM_TIMEZONES.find(tz => tz.value === selectedValue);
      if (selectedDomTom) {
        addTimezone(selectedDomTom);
        setSelectedDomTomTimezone('');
      }
    }
  };

  const handleRemoveTimezone = (id) => {
    setUserTimezones(userTimezones.filter(tz => tz.id !== id));
  };

  const allTimezonesToDisplay = [FIXED_DEFAULT_TIMEZONE, ...userTimezones];

  return (

    <div>
      {allTimezonesToDisplay.map(tz => (
        <div key={tz.id} id="clock" style={{ float: 'right', marginRight: tz.id === FIXED_DEFAULT_TIMEZONE.id ? '164px' : '68px', backgroundColor: bgColor, borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', padding: '6px 14px 5px 12px', fontSize: '18px', color: fontColor, fontFamily: fontFamily, cursor: 'pointer', textAlign: 'center', position: 'relative', width: tz.id === FIXED_DEFAULT_TIMEZONE.id ? '96px' : '128px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowCustomization(!showCustomization)} onMouseEnter={() => { setShowTooltip(true); setShowGearIcon(true); }} onMouseLeave={() => { setShowTooltip(false); setShowGearIcon(false); }} >

          {tz.id === FIXED_DEFAULT_TIMEZONE.id && (
            <div onClick={(e) => { e.stopPropagation(); setShowWeatherPopup(!showWeatherPopup); }} style={{ position: 'relative', opacity: showGearIcon ? 1 : 0, visibility: showGearIcon ? 'visible' : 'hidden', transition: 'opacity 0.68s ease-in-out, visibility 0.68s ease-in-out', cursor: 'pointer', fontSize: '20px', userSelect: 'none', right: '15px' }}> ☀️ </div>
          )}

          <div style={{ flexGrow: 1, cursor: 'pointer', marginLeft: '8px' }} onClick={() => setShowCustomization(!showCustomization)} > {isAnalogMode ? <AnalogClock time={time} timezone={tz.value} /> : formatTime(time, tz.value)} </div>

          {showTooltip && ( <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', width: '164px', backgroundColor: bgColor, borderRadius: '8px', padding: '4.8px', fontSize: '14px', color: fontColor, fontFamily: fontFamily, textAlign: 'center', zIndex: 100, }} > {tz.id !== FIXED_DEFAULT_TIMEZONE.id && ( <> {tz.name} <br/> </> )} {formatFullDate(time, tz.value)} </div> )}

          {tz.id === FIXED_DEFAULT_TIMEZONE.id && (
            <div style={{ position: 'relative', opacity: showGearIcon ? 1 : 0, visibility: showGearIcon ? 'visible' : 'hidden', transition: 'opacity 0.68s ease-in-out, visibility 0.68s ease-in-out', cursor: 'pointer', marginLeft: '6px', fontSize: '20px', userSelect: 'none' , left: '16px' }} onClick={() => setShowCustomization(!showCustomization)}> ⚙️ </div>
          )}

          {tz.id !== FIXED_DEFAULT_TIMEZONE.id && (
            <button onClick={() => handleRemoveTimezone(tz.id)} className="fermer2" >X</button>
          )}
        </div>
      ))}

      {isFullScreen && ( <FullScreenClock time={time} bgColor={bgColor} fontColor={fontColor} fontFamily={fontFamily} is12HourFormat={is12HourFormat} showSeconds={showSeconds} onExitFullScreen={() => setIsFullScreen(false)} timezone={FIXED_DEFAULT_TIMEZONE.value} /> )}

      {showCustomization && (

        <div style={{ position: 'absolute', top: '48px', right: '74px', backgroundColor: 'rgba(121, 122, 128, 0.90)', borderRadius: '12px', padding: '12px 12px 6px 12px' , width: '286px', color: 'white', zIndex: 100 }}>

          <button onClick={() => setShowCustomization(!showCustomization)} className="fermer" > X </button>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '18px' }}>
            <input type="checkbox" checked={isAnalogMode} onChange={() => setIsAnalogMode(!isAnalogMode)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ddd', transition: '.4s', borderRadius: '24px' }} ></span>
            <span style={{ position: 'absolute', height: '14px', width: '14px', left: isAnalogMode ? '20px' : '4px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} ></span>
            {isAnalogMode && ( <span style={{ position: 'absolute', top: '50%', left: '46px', transform: 'translateY(-50%)', fontSize: '16px', color: 'white' }} > Analogique </span> )}
            {!isAnalogMode && ( <span style={{ position: 'absolute', top: '50%', right: '46px', transform: 'translateY(-50%)', fontSize: '16px', color: 'white', }} > Numérique </span> )}
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' , paddingBottom: '14px' , marginTop: '20px' }}>

            <div style={{ marginRight: '26px' }}>
              <label>Horloge :</label>
              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} style={{ marginLeft: '8px' }} />
            </div>

            <div>
              <label>Fond :</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ marginLeft: '8px' }} />
            </div>

          </div>

          <div style={{ textAlign: 'center'}}>
            <label>Police :</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ marginLeft: '10px' , color: 'rgba(121,122,128)' , backgroundColor: 'white' , height: '18px' , paddingTop: '0' , borderRadius: '6px' , cursor: 'pointer', border: 'none' , textAlignLast: 'center' }}>
              <option value="Comic Sans MS, cursive">Comic Sans</option> <option value="Arial, sans-serif">Arial</option> <option value="'Courier New', monospace">Courier New</option> <option value="Georgia, serif">Georgia</option> <option value="'Times New Roman', serif">Times New Roman</option> <option value="Verdana, sans-serif">Verdana</option> <option value="Tahoma, sans-serif">Tahoma</option> <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option> <option value="Impact, sans-serif">Impact</option> <option value="'Lucida Console', monospace">Lucida Console</option>
              </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>

            <label className="coche"> Secondes
              <input type="checkbox" checked={showSeconds} onChange={() => setShowSeconds(!showSeconds)} />
              <span className="checkmark" style={{ marginLeft: '28px' }}></span>
            </label>

            <label className="coche" style={{ marginLeft: '46px' , paddingRight: '22px' }}> 12 / 24
              <input type="checkbox" checked={is12HourFormat} onChange={() => setIs12HourFormat(!is12HourFormat)} />
              <span className="checkmark" style={{ marginLeft: '5px' }}></span>
            </label>

          </div>

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <label htmlFor="domtom-timezone-select">Dom Tom :</label>
            <select id="domtom-timezone-select" value={selectedDomTomTimezone} onChange={handleDomTomTimezoneSelect} style={{ marginLeft: '8px', padding: '4px', borderRadius: '6px', border: '1px solid #ccc', color: 'rgb(121, 122, 128)', backgroundColor: 'white', cursor: 'pointer' }}>
              <option value="">Ajouter ..</option>
              {PREDEFINED_DOMTOM_TIMEZONES.map(tz => ( <option key={tz.id} value={tz.value} disabled={userTimezones.some(u_tz => u_tz.value === tz.value) || FIXED_DEFAULT_TIMEZONE.value === tz.value}> {tz.name} </option> ))}
            </select>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <label htmlFor="timezone-input">Ajouter un fuseau horaire</label>
            <input id="timezone-input" type="text" value={newTimezone} onChange={(e) => setNewTimezone(e.target.value)} placeholder="Ex: America/New_York" style={{ marginLeft: '8px', padding: '2px', borderRadius: '6px', border: 'none', color: 'black' }} />
            <button onClick={handleManualAddTimezone} style={{ marginLeft: '8px', padding: '0 4px', backgroundColor: 'lime', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Ajouter</button>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <span style={{ display: 'inline-block', backgroundColor: 'transparent' }}> {FIXED_DEFAULT_TIMEZONE.name} </span>
            {userTimezones.map(tz => (
              <span key={tz.id} style={{ display: 'inline-block', backgroundColor: 'lime', color: 'white', padding: '0 6px', borderRadius: '12px', fontSize: '12px' }}>
                {tz.name}
                <button onClick={() => handleRemoveTimezone(tz.id)} style={{ marginLeft: '4px', backgroundColor: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', paddingRight: 'O' }}>x</button>
              </span>
            ))}
          </div>

          <div style={{ textAlign: 'center' , marginTop: '6px' }}>

            <button style={{ padding: '0', backgroundColor: 'transparent', color: 'white', cursor: 'pointer' }} onClick={() => setIsFullScreen(!isFullScreen)} > Plein écran <img src="../static/full.png"/> </button>

            <label htmlFor="" style={{ color: 'white' , margin: '6px 6px 0 18px' }}>Reset : </label>
            <button style={{ backgroundColor: 'transparent' , paddingRight: '0' }} onClick={resetToDefaults}> <img src="../static/reset.png" style={{ marginRight: '0' }}/> </button>

          </div>

        </div>
      )}

      {showWeatherPopup && (
        <div style={{ position: 'absolute', top: `${weatherPopupPosition.top}px`, left: `${weatherPopupPosition.left}px`, backgroundColor: bgColor, borderRadius: '12px', padding: '12px 12px 0 12px', fontFamily: fontFamily, color: 'white', zIndex: 200, width: '268px' , cursor: 'default' }}> <Meteo onClose={() => setShowWeatherPopup(false)} />
          <div onMouseDown={handleMouseDown} style={{ position: 'absolute', bottom: '5px', right: '0', cursor: 'grab', userSelect: 'none', backgroundColor: 'transparent' }}> <img src="../static/drag.png" style={{ width: '16.8px', height: '16.8px' }}/> </div>
        </div> )}

<style jsx>{`

	.fermer { position: absolute; top: 0; right: 1px; float: right; color: red; background-color: transparent; border-radius: 8px; width: 18px; height: 20px; padding: 0; transition: transform 0.18s; }

	.fermer:hover { background-color: white; }

	.fermer2 { position: absolute; top: 0; right: 0; background-color: transparent; color: red; border: none; cursor: pointer; padding: 2px 5px; font-size: 10px; }}

	.fermer2:hover { background-color: white; }

`}</style>

    </div>
  )
}
export default Horloge