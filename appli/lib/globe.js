import React from 'react';
import { resolveTransmitter } from '../lib/geoNodes';

const DECALAGE_VERTICAL = 0.48;
const GLOBE_SCRIPT = 'https://unpkg.com/globe.gl@2';

let scriptPromise = null;

const loadGlobeScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.Globe) return Promise.resolve(window.Globe);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-globe-gl]');
    const script = existing || document.createElement('script');
    const done = () => (window.Globe ? resolve(window.Globe) : reject(new Error('globe.gl chargé mais window.Globe absent')));
    script.addEventListener('load', done);
    script.addEventListener('error', () => {
      scriptPromise = null;
      script.remove();
      reject(new Error('Impossible de charger ' + GLOBE_SCRIPT));
    });
    if (!existing) {
      script.src = GLOBE_SCRIPT;
      script.async = true;
      script.setAttribute('data-globe-gl', '1');
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
};

class Globe extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.globeInstance = null;
    this.animationFrameId = null;
    this.state = {
      pulseRadius: 0.6,
      error: null
    };
  }

  componentDidMount() {
    this._mounted = true;
    loadGlobeScript()
      .then(() => {
        if (!this._mounted) return;
        this.initGlobe();
        this.animatePulse();
      })
      .catch(err => {
        console.error('Globe :', err);
        if (this._mounted) this.setState({ error: err.message });
      });
  }

  componentWillUnmount() {
    this._mounted = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.globeInstance && typeof this.globeInstance._destructor === 'function') {
      this.globeInstance._destructor();
    } else if (this.globeInstance && typeof this.globeInstance._destruct === 'function') {
      this.globeInstance._destruct();
    }
    this.globeInstance = null;
  }

  animatePulse = () => {
    const time = performance.now() * 0.002;
    const nextRadius = 0.14 + Math.abs(Math.sin(time)) * 0.6;

    this.setState({ pulseRadius: nextRadius }, () => {
      if (this.globeInstance) {
        this.globeInstance.pointsData(this.globeInstance.pointsData());
      }
    });

    this.animationFrameId = requestAnimationFrame(this.animatePulse);
  };

  initGlobe = () => {
    if (!window.Globe || !this.containerRef.current) return;

    this.globeInstance = window.Globe()(this.containerRef.current)
      .globeImageUrl('https://unpkg.com/three-globe@2.45.2/example/img/earth-day.jpg')
      .backgroundColor('rgba(0,0,0,0)')
      .width(400)
      .height(400)
      .pointsMerge(true)
      .pointRadius(() => this.state.pulseRadius)
      .pointAltitude(0.02)
      .pointColor(() => '#4ade80')
      .labelLat(d => d.lat)
      .labelLng(d => d.lng)
      .labelText(d => d.name)
      .labelSize(1.84)
      .labelDotRadius(0)
      .labelColor(() => 'white');

    const controls = this.globeInstance.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = -0.6;
    }

    this.updatePosition();
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.transmitter !== this.props.transmitter ||
      prevProps.mumbleTransmitter !== this.props.mumbleTransmitter ||
      prevProps.trans !== this.props.trans
    ) {
      this.updatePosition();
    }
  }

  updatePosition() {
    if (!this.globeInstance) return;

    const controls = this.globeInstance.controls();
    const tx = resolveTransmitter(this.props.transmitter, this.props.mumbleTransmitter, this.props.trans);

    if (!tx) {
      this.globeInstance.pointsData([]);
      this.globeInstance.labelsData([]);
      this.globeInstance.pointOfView({ altitude: 2.6 }, 1000);
      if (controls) controls.autoRotate = true;
      return;
    }

    if (controls) controls.autoRotate = false;

    this.globeInstance.pointOfView({ lat: tx.lat, lng: tx.lng, altitude: 1.48 }, 1200);
    this.globeInstance.pointsData([{ lat: tx.lat, lng: tx.lng }]);
    this.globeInstance.labelsData([{
      lat: tx.lat - DECALAGE_VERTICAL,
      lng: tx.lng,
      name: tx.name,
    }]);
  }

  render() {
    return (
      <div ref={this.containerRef} style={{ width: '400px', height: '400px', backgroundColor: 'transparent', overflow: 'hidden', position: 'relative', left: '50%', transform: 'translateX(-50%)', marginTop: '68px' }}>
        {this.state.error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d9534f', fontSize: '13px', textAlign: 'center', padding: '0 24px' }}>
            Globe indisponible ( script globe.gl non chargé )
          </div>
        )}
      </div>
    );
  }
}
export default Globe