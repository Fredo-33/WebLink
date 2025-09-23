import React from 'react'
import Layout from '../components/LayoutMob'
import fetch from '../lib/fetch'

function get(id) {
  return fetch(`/api/${encodeURIComponent(id)}`).then(res => res.text())
}

function formatIpText(ipText) {
  if (!ipText) return '';
  let formattedText = ipText.replace(/eth0/g, 'Rj45');
  formattedText = formattedText.replace(/wlan0/g, ' Wifi');
  return formattedText;
}

const Index = props => {

  const temperatureValue = parseFloat(props.temperature);
  const temperatureStyle = temperatureValue < 40 ? { color: 'lime' } : {};

  const internetStatus = props.ping === 'ok' ? 'ok' : 'hors ligne';

  return (
    <Layout>
      <div className="list-group">
        <div className="list-group-item flex-column align-items-start">
          <h5>date - heure</h5>
          <p>{
            new Date(props.datetime).toLocaleDateString('fr-FR') + ' - ' +
            new Date(props.datetime).toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>temps de fonctionnement</h5>
          <p>{props.uptime}</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>mémoire utilisé</h5>
          <p>{props.memory}</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>connexion internet</h5>
          <p className={internetStatus === 'ok' ? 'pingOk' : 'pingHorsLigne'}>{internetStatus}</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>ip</h5>
          <p>{formatIpText(props.ip)}</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>versions</h5>
          <p>Pmr 446 MHz : V2</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>os - kernel</h5>
          <p style={{ marginBottom: '0' }}>{props.osInfo}</p>
          <p>{props.kernel}</p>
        </div>
        <div className="list-group-item flex-column align-items-start">
          <h5>température</h5>
          <p style={temperatureStyle}>{props.temperature}</p>
        </div>
      </div>

<style jsx>{`

  .list-group-item { background-color: rgba(206,206,206,0.74); }

  .list-group-item:first-child { border-top-radius: 22px 22px; }

  .list-group-item:last-child { border-bottom-radius: 22px 22px; }

  .list-group { display: block; margin: 0 auto; width: 348px; cursor: default; }

  .pingOk { color: lime; animation: pulseOk 2.2s infinite ease-in-out; }

  .pingHorsLigne { color: red; }

  @keyframes pulseOk { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.48; } 100% { transform: scale(1); opacity: 1; } }

`}</style>

<style global jsx>{`

  .content { padding-top: 75px; }

`}</style>

    </Layout>
  );
};

Index.getInitialProps = async function () {
  return {
    uptime: await get('uptime'),
    memory: await get('memory'),
    ip: await get('ip'),
    datetime: await get('datetime'),
    network: await get('network'),
    ping: await get('ping'),
    temperature: await get('temperature'),
    osInfo: await get('osInfo'),
    kernel: await get('kernel'),
  }
}
export default Index