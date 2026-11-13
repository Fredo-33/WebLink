import React, { useEffect, useState, useRef } from 'react';

const Views = { Bar: 'bar', Circle: 'circle', Halo: 'halo', Flip: 'flip', Segments: 'segments' };

const ChronoBar = ({ progress, progressColor }) => (
  <div style={{ marginLeft: '12px', width: '148px', height: '4.8px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.86)', overflow: 'hidden' }}>
    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progressColor, borderRadius: '6px' }}></div>
  </div>
);

const ChronoSegments = ({ elapsedSeconds, totalTime, progressColor }) => {
  const segmentDuration = totalTime / 4;
  const numSegments = 4;
  const segments = Array.from({ length: numSegments }, (_, i) => {
    const start = i * segmentDuration;
    const end = (i + 1) * segmentDuration;
    let segmentProgress = 0;

    if (elapsedSeconds >= end) {
      segmentProgress = 100;
    } else if (elapsedSeconds > start) {
      segmentProgress = ((elapsedSeconds - start) / segmentDuration) * 100;
    }

    let segColor = '#4ade80';
    if (i === 2) {
      segColor = 'orange';
    } else if (i >= 3) {
      segColor = '#d9534f';
    }

    return (
      <div key={i} style={{ flex: 1, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.48)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${segmentProgress}%`, height: '100%', backgroundColor: segColor, transition: 'width 1s linear', borderRadius: '4px' }}></div>
      </div>
    );
  });

  return (
    <div style={{ marginTop: '14px', width: '148px', height: '10.8px', display: 'flex', gap: '4px' }}>
      {segments}
    </div>
  );
};

const ChronoFlip = ({ minutes, seconds }) => {
  const formatTime = (time) => String(time).padStart(2, '0');
  const minuteString = formatTime(minutes);
  const secondString = formatTime(seconds);

  const cardStyle = { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '0 4px', fontSize: '18px', color: 'white', minWidth: '36px', textAlign: 'center' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4.6px', filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.92))', marginTop: '8px' }}>
      <div style={cardStyle}>{minuteString[0]}</div> <div style={cardStyle}>{minuteString[1]}</div>
      <div style={{ fontSize: '24px', color: 'white', fontWeight: 'lighter' }}>:</div>
      <div style={cardStyle}>{secondString[0]}</div> <div style={cardStyle}>{secondString[1]}</div>
    </div>
  );
};

const getPieSlicePath = (progress, radius, center) => {
  if (progress >= 100) {
    return `M ${center} ${center} m -${radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`;
  }

  const angle = (progress / 100) * 360;
  const radians = (angle - 90) * Math.PI / 180;
  const x = center + radius * Math.cos(radians);
  const y = center + radius * Math.sin(radians);
  const largeArcFlag = angle > 180 ? 1 : 0;

  return `M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y} Z`;
};

const ChronoCircle = ({ progress, progressColor }) => {
  const radius = 14;
  const center = 15;

  const pathData = getPieSlicePath(progress, radius, center);

  return (
    <svg width="30" height="30" style={{ marginLeft: '12px' }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
      <path d={pathData} fill={progressColor} />
    </svg>
  );
};

const ChronoHalo = ({ progressColor, flashing, elapsedSeconds }) => {
  const getHaloIntensity = () => {
    if (elapsedSeconds <= 120) return 0.6;
    if (elapsedSeconds <= 180) return 0.75;
    return 0.9;
  };

  const getHaloSize = () => {
    if (elapsedSeconds <= 120) return '20px';
    if (elapsedSeconds <= 180) return '30px';
    return '40px';
  };

  const haloStyle = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '82%', height: '82%', borderRadius: '50%', boxShadow: `0 0 ${getHaloSize()} ${progressColor}`, opacity: flashing ? 0 : getHaloIntensity(), transition: flashing ? 'opacity 0.246s ease-in-out' : 'all 0.5s ease-in-out', pointerEvents: 'none' };

  const innerBackgroundStyle = { ...haloStyle, backgroundColor: progressColor, opacity: 0.28, boxShadow: 'none', transition: 'background-color 0.5s ease-in-out' };

  return (
    <>
      <div style={innerBackgroundStyle}></div>
      <div style={haloStyle}></div>
    </>
  );
};

const Chrono = ({ transmitter, viewMode }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const previousTransmitterRef = useRef('');

  useEffect(() => {
    let interval = null;
    if (transmitter !== '') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [transmitter]);

  useEffect(() => {
    if (transmitter !== previousTransmitterRef.current) {
      setElapsedSeconds(0);
      setFlashing(false);
      previousTransmitterRef.current = transmitter;
    }
  }, [transmitter]);

  useEffect(() => {
    let flashInterval = null;
    if (elapsedSeconds === 210) {
      flashInterval = setInterval(() => {
        setFlashing(prev => !prev);
      }, 246);
    }
    return () => {
      if (flashInterval) clearInterval(flashInterval);
    };
  }, [elapsedSeconds]);

  if (transmitter === '') return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const totalTime = 4 * 60;
  const progress = (elapsedSeconds / totalTime) * 100;

  let progressColor = '#4ade80';
  if (elapsedSeconds > 120 && elapsedSeconds <= 180) {
    progressColor = 'orange';
  } else if (elapsedSeconds > 180) {
    progressColor = flashing ? 'transparent' : '#d9534f';
  }

  if (viewMode === Views.Halo) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '12px', gap: '12px' }}>
        <div style={{ position: 'relative', display: 'inline-block', padding: '14px' }}>
          <ChronoHalo progressColor={progressColor} flashing={flashing} elapsedSeconds={elapsedSeconds} />
          <div style={{ position: 'relative', zIndex: 1, fontSize: '18px', color: 'white' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === Views.Flip) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '10px', gap: '12px' }}>
        <ChronoFlip minutes={minutes} seconds={seconds} />
      </div>
    );
  }

  let VisualComponent = ChronoBar;
  if (viewMode === Views.Circle) {
    VisualComponent = ChronoCircle;
  } else if (viewMode === Views.Segments) {
    VisualComponent = ChronoSegments;
  }

  const isSegmented = viewMode === Views.Segments;

  return (

    <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '8px', gap: '12px' }}>
      {isSegmented ? null : (
        <div style={{ fontWeight: 'bold' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      )}

      <VisualComponent progress={progress} progressColor={progressColor} elapsedSeconds={elapsedSeconds} totalTime={totalTime} />
    </div>

  )
}
export default Chrono