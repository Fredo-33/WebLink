import React from 'react'
import { Map, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
}) : null;

export default class MapPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPos: null
    };
  }

  handleClick = (e) => {
    this.setState({ currentPos: [e.latlng.lat, e.latlng.lng] });
  }

  handleConfirm = (e) => {
    e.stopPropagation();
    if (this.state.currentPos) {
      this.props.onSelect(this.state.currentPos[0], this.state.currentPos[1]);
    }
  }

  render() {

		const center = [46.603354, 1.888334];

    return (
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <Map center={center} zoom={4.8} onClick={this.handleClick} style={{ height: '100%', width: '100%', cursor: 'crosshair' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {this.state.currentPos && <Marker position={this.state.currentPos} icon={icon} />}
        </Map>

        {this.state.currentPos && (
          <button onClick={this.handleConfirm} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: '#4ade80', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 22px 8px rgba(182,182,182,1)' }}> « Valider » </button>
        )}
      </div>
    )
  }
}