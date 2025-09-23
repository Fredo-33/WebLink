import React, { useState, useEffect } from 'react';

const weatherIconMap = {
  "01d": "../static/soleil.svg",
  "01n": "../static/soleil.svg",
  "02d": "../static/nuageux3.svg",
  "03d": "../static/nuageux3.svg",
  "04d": "../static/nuageux2.svg",
  "04n": "../static/nuageux2.svg",
  "10d": "../static/pluie.svg",
};

const API_KEY = '18992aea6b77fd7963436def376ec693';

const getWindDirection = (deg) => {
  const directions = ['Nord', 'Nors Est', 'Est', 'SE', 'Sud', 'Sud Ouest', 'Ouest', 'Nord Ouest'];
  return directions[Math.round(deg / 45) % 8];
};

const Meteo = ({ onClose }) => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    const savedCity = localStorage.getItem('meteo-city');
    if (savedCity) {
      setCity(savedCity);
      setIsEditing(false);
    }
  }, []);

  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, [city]);

  useEffect(() => {
    if (!city) return;

    const interval = setInterval(() => {
      fetchWeather();
    }, 240000); // 4 minutes

    return () => clearInterval(interval);
  }, [city]);

  const fetchWeather = async () => {
    if (!city) return;
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${API_KEY}`
      );
      if (!response.ok) {
        setError('Ville introuvable');
        setWeather(null);
        return;
      }
      const data = await response.json();
      setWeather(data);
      console.log("Code météo :", data.weather[0].icon);
      setError('');
    } catch (err) {
      setError('Erreur connexion');
      setWeather(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('meteo-city', city);
    fetchWeather();
  };

  return (
    <div>
      <button onClick={onClose} className="fermer" >X</button>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); localStorage.setItem('meteo-city', city); fetchWeather(); setIsEditing(false); }} style={{ marginTop: '8px', textAlign: 'center' }}>
          <input type="text" placeholder="Ville" value={city} onChange={(e) => { const value = e.target.value; const capitalized = value.charAt(0).toUpperCase() + value.slice(1); setCity(capitalized); }} style={{ width: '140px', height: '24px', borderRadius: '8px', border: 'none', padding: '6px', margin: '0 8px', textAlign: 'center' }}/>
          <button style={{ backgroundColor: 'transparent', color: 'white' }} type="submit">Ok</button>
        </form>
        ) : (
        <button onClick={() => setIsEditing(true)} style={{ position: 'absolute', top: '4px', left: '6px', backgroundColor: 'transparent', fontSize: '12px', cursor: 'pointer', padding: 0 }}> ✏️ </button>
      )}

      {error && <p style={{ color: 'red' , textAlign: 'center' }}>{error}</p>}

      {weather && (
        <div>
          <h3 style={{ margin: ' 22px 0 28px 0' , textAlign: 'center' }}>{weather.name}</h3>
    	    <div style={{ display: 'flex', alignItems: 'center' }}>
        		<span style={{ display: 'flex', margin: 'auto' }}>
        		  <p style={{ width: '114px' , textAlign: 'center' }}>{weather.weather[0].description}</p>
						  <img src={weatherIconMap[weather.weather[0].icon] || "/static/default.svg"} alt={weather.weather[0].description} style={{ width: '44px', height: '44px', margin: '-8px 0 0 10px' }}/>
						</span>
    	  	</div>
        	<p style={{ marginTop: '6px' }}>Température : {weather.main.temp} °C</p>
        	<p>Humidité : {weather.main.humidity} %</p>
        	<p>Pression : {weather.main.pressure} hPa</p>
        	<p>Vent : {weather.wind.speed} m/s <span style={{ marginLeft: '12px' }}>( {getWindDirection(weather.wind.deg)} )</span> </p>
        	<p>Visibilité : {(weather.visibility / 1000).toFixed(1)} km</p>
        </div>
      )}

<style jsx>{`

	.fermer { position: absolute; top: 2px; right: 3px; float: right; color: red; background-color: transparent; border-radius: 8px; width: 18px; height: 20px; padding: 0; transition: background-color 0.18s; }

	.fermer:hover { background-color: white; }

`}</style>

    </div>
  )
}
export default Meteo