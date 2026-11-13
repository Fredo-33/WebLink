import React from 'react'
import ReactDOM from 'react-dom';
import Layout from '../components/LayoutMob'
import fetch from '../lib/fetch'
import dynamic from 'next/dynamic';
import { Notif } from '../lib/notif';
import Fsm from '../lib/svxlink/fsm'
import { emptyNodeInfo, loadNodeInfo } from '../lib/nodeInfoClient';
import Cookies from 'js-cookie';
import Chrono from '../lib/chrono';
import SelectCustom from '../lib/select';
const sys = ['Sys1', 'Sys2', 'Sys3', 'Sys4'];
const Snowfall = dynamic(() => import('../lib/Snowfall'), { ssr: false });
const FallLeaves = dynamic(() => import('../lib/FallLeaves'), { ssr: false });
const Rain = dynamic(() => import('../lib/Rain'), { ssr: false });
const Fireflies = dynamic(() => import('../lib/Fireflies'), { ssr: false });
const Bubbles = dynamic(() => import('../lib/Bubbles'), { ssr: false });

class Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...props, tri: "1", contrast: 100, brightness: 100, selectedFont: "Arial, sans-serif", selectedColor: '#d9534f', selectedBgColor: 'rgba(255,255,255,0.72)', selectedButtonColor: 'white', selectedButtonBgColor: 'rgba(121, 122, 128, 0.7)', selectedButtonHmColor: '#d9534f', selectedButtonTransColor: 'white', selectedButtonTransBgColor: '#4ade80', selectedLogsColor: 'white' , selectedLogsBgColor: 'rgba(121, 122, 128, 0.72)' , logo: false, setting: false, floconVisible: false, feuilleVisible: false, pluieVisible: false, particuleVisible: false, bulleVisible: false, logsVisible: true, activeTab1: 'logs', selectedImage: '../static/weblink1.jpg', showNotification: false, notificationMessage: '', showNodeLeftNotification: false, nodeLeftNotificationMessage: '', notificationsEnabled: true, soundInitialized: false, soundEnabled: false, res2Name: 'Réseau 2', res3Name: 'Réseau 3', res4Name: 'Réseau 4', ...emptyNodeInfo(), }
  }

  setAppCookie = (name, value, expiresDays = 200) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresDays);
    Cookies.set(name, value, { expires });
  };

  getAppCookie = (name) => {
    return Cookies.get(name);
  };

  removeAppCookie = (name) => {
    Cookies.remove(name);
  };

  initializeSound = () => {
    if (!this.state.soundInitialized) {
      this.connectionSound.play();
      this.setState({
        soundInitialized: true,
        soundEnabled: true,
      });
    }
  };

  playSound = (sound) => {
    if (this.state.soundEnabled) {
      sound.play();
    }
  };

  handleNotificationsToggle(event) {
    this.setState({
      notificationsEnabled: event.target.checked,
    });
  };

  showNotification = (message) => {
    if (this.state.notificationsEnabled) {
      this.setState({
        showNotification: true,
        notificationMessage: message,
      });
      this.playSound(this.connectionSound);
      setTimeout(this.hideNotification, 8888);
    }
  };

  hideNotification = () => {
    this.setState({
      notificationFadeOut: true,
    });
    setTimeout(() => {
      this.setState({
        showNotification: false,
        notificationFadeOut: false,
      });
    }, 1440);
  };

  showNodeLeftNotification = (message) => {
    if (this.state.notificationsEnabled) {
      this.setState({
        showNodeLeftNotification: true,
        nodeLeftNotificationMessage: message,
      });
      this.playSound(this.disconnectionSound);
      setTimeout(this.hideNodeLeftNotification, 8888);
    }
  };

  hideNodeLeftNotification = () => {
    this.setState({
      nodeLeftNotificationFadeOut: true,
    });
    setTimeout(() => {
      this.setState({
        showNodeLeftNotification: false,
        nodeLeftNotificationFadeOut: false,
      });
    }, 1440);
  };

  toggleTab = (tab, tabNumber) => {
    this.setState({ [`activeTab${tabNumber}`]: tab });
  };

  fetchData = (type) => {
    const network = this.state.network;

    if (network === 'default' || network === 'conf') {
      return;
    }

    let apiUrlSegment = type;
    let responseHandler = response => response.text();
    let url;

    if (type === 'logs') {
      apiUrlSegment = 'logsTemps';
    }

    if (network === 'pmr' || network === 'bac') {
      url = `https://${network}.websdrbordeaux.fr/api/${apiUrlSegment}`;
    } else {
      url = `:3004/api/${apiUrlSegment}`;
    }

    fetch(url)
      .then(responseHandler)
      .then(data => {
        this.setState({ [type]: data });
      })
      .catch(error => {
        console.error(`Erreur récupération ${type}`, error);
      });
  };

  loadConfig = () => {
    fetch('/api/configuration', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        this.setState({ res2Name: data.res2 || 'Réseau 2', res3Name: data.res3 || 'Réseau 3', res4Name: data.res4 || 'Réseau 4', isRadioAmateur: data.isRadioAmateur, res2Enabled: data.res2Enabled, res3Enabled: data.res3Enabled, res4Enabled: data.res4Enabled, });
      })
      .catch((error) => console.error('Erreur chargement Json', error));
  };

  loadNodeInfoForNetwork = (network) => {
    const request = (this.nodeInfoRequest || 0) + 1;
    this.nodeInfoRequest = request;

    loadNodeInfo(network)
      .then(data => { if (request === this.nodeInfoRequest) this.setState(data); })
      .catch(error => console.error("Erreur chargement infos nodes", error));
  };

  componentWillUnmount() {
    clearInterval(this.logsInterval);document.removeEventListener('click', this.handleOutsideClick);
  }

  componentDidMount() {

    this.connectionSound = new Audio('../static/notifIn.wav');this.disconnectionSound = new Audio('../static/notifOut.wav');

    this.loadConfig();

    this.loadNodeInfoForNetwork(this.state.network || 'default');

    this.logsInterval = setInterval(() => {this.fetchData('logs');this.fetchData('logs2');this.fetchData('logs3');}, 2822);

    this.fetchData('logs');this.fetchData('logs2');this.fetchData('logs3');

    this.applyFilters();

    const savedFont = this.getAppCookie('selectedFont');
    const fontToUse = savedFont || this.state.selectedFont;
    this.setState({ selectedFont: fontToUse }, () => {
      document.body.style.fontFamily = fontToUse;
    });

    const customImage = localStorage.getItem('customImage');
    const cookieImage = this.getAppCookie('selectedImage');

    let imageToUse;
    if (customImage) {
      imageToUse = customImage;
      this.setAppCookie('selectedImage', customImage);
    } else if (cookieImage) {
      imageToUse = cookieImage;
    } else {
      imageToUse = '../static/weblink1.jpg';
      this.setAppCookie('selectedImage', imageToUse);
    }

    this.changeBackground(imageToUse);

    const stateKeys = [ 'selectedButtonColor','selectedButtonBgColor','selectedColor','selectedBgColor','selectedButtonHmColor','selectedButtonTransColor','selectedButtonTransBgColor','selectedLogsColor','selectedLogsBgColor','selectedImage' ];

    const newState = {};

    stateKeys.forEach(key => {
      const value = this.getAppCookie(key);
      if (value !== undefined) {
        newState[key] = value;
      }
    });

    const booleanKeys = [ 'logo','setting','bac','logsVisible','floconVisible','feuilleVisible','pluieVisible','particuleVisible','bulleVisible' ];

    booleanKeys.forEach(key => {
      const value = this.getAppCookie(key);
      if (value !== undefined) {
        try {
          newState[key] = JSON.parse(value);
        } catch (e) {
          console.warn(`Erreur parsing ${key}`, e);
        }
      }
    });

    this.setState(newState);

    const es = new EventSource('/stream');

		const fsm = new Fsm(
  		es,
  		() => {
    		const userSelectedNetwork = this.state.network;

    		this.setState({
      		...fsm,
      		network: userSelectedNetwork || fsm.network || 'default'
    		});
  		},
  		this.props
		);

    es.addEventListener('ReflectorLogic.MsgNodeJoined', (event) => {
      const [name] = JSON.parse(event.data);
      if (sys.includes(name)) return;
      const qrzName = this.state.trans && this.state.trans.get(name);
      const spaces = '\u00A0'.repeat(2);
      this.showNotification(`${qrzName ? `${qrzName} ` : ''}${spaces}s'est connecté`);
    });

    es.addEventListener('ReflectorLogic.MsgNodeLeft', (event) => {
      const [name] = JSON.parse(event.data);
      if (sys.includes(name)) return;
      const qrzName = this.state.trans && this.state.trans.get(name);
      const spaces = '\u00A0'.repeat(2);
      this.showNodeLeftNotification(`${qrzName ? `${qrzName} ` : ''}${spaces}s'est déconnecté`);
    });

    es.onerror = error => {
      console.error('EventSource error', error)
    };
  }

  toggleVisibility = (stateKey, cookieKey = stateKey) => {
    const newVisibility = !this.state[stateKey];
    this.setState({ [stateKey]: newVisibility });
    this.setAppCookie(cookieKey, newVisibility);
  };

  toggleElementVisibility = (key) => {
    this.toggleVisibility(key);
  };

  handleContrastChange = (evt) => {
    const contrast = evt.target.value;
    this.setState({ contrast }, () => {
      this.applyFilters();
    });
  };

  handleBrightnessChange = (evt) => {
    const brightness = evt.target.value;
    this.setState({ brightness }, () => {
      this.applyFilters();
    });
  };

  applyFilters = () => {
    const { contrast, brightness } = this.state;
    document.body.style.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
  };

  handleFontChange = (evt) => {
    const font = evt.target.value;
    this.setState({ selectedFont: font }, () => {
      document.body.style.fontFamily = font;
      this.setAppCookie('selectedFont', font);
    });
  };

  handleCustomImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      this.changeBackground(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  changeBackground = (imageID) => {
    const imageURL = "url(" + imageID + ")";
    document.body.style.backgroundImage = imageURL;

    if (imageID === '../static/weblink4.jpg') {
      document.body.style.backgroundSize = '100%';
      document.body.style.backgroundPositionY = '26%';
    } else {
      document.body.style.backgroundSize = '100% 100%';
      document.body.style.backgroundPositionY = 'initial';
    }

    if (imageID.startsWith("data:image")) {
      try {
        localStorage.setItem('customImage', imageID);
        this.removeAppCookie('selectedImage');
      } catch (e) {
      }
    } else {
      this.setAppCookie('selectedImage', imageID);
      localStorage.removeItem('customImage');
    }

    this.setState({ selectedImage: imageID });
  };

  handleColorChange = (stateKey, cookieKey, evt) => {
    const selectedValue = evt.target.value;
    this.setState({ [stateKey]: selectedValue });
    this.setAppCookie(cookieKey, selectedValue);
  };

  handleColorNodeChange = (colorType) => (evt) => {
    this.handleColorChange(`selected${colorType}`, `selected${colorType}`, evt);
  };

  showCustomModal = (content) => {
    const modal = document.getElementById('customModal');

    modal.innerHTML = `
      <div onClick="this.parentNode.style.display='none'" style="position: absolute; top: 0; right: 6px; font-size: 20px; cursor: pointer; color: #d9534f; font-weight: bold;">&times;</div>
      ${content}
    `;

    modal.style.display = 'block';

    document.addEventListener('click', this.handleOutsideClick);
  };

  handleOutsideClick = (event) => {
    const modal = document.getElementById('customModal');
    const buttons = document.querySelectorAll('button');

    const clickedInsideButton = Array.from(buttons).some(button => button.contains(event.target));
    if (modal && !modal.contains(event.target) && !clickedInsideButton && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.removeEventListener('click', this.handleOutsideClick);
    }
  };

  handleClickNode = (nodeName) => {
    const nodeInformation = this.state.nodeInfo[nodeName];
    if (nodeInformation) {
      this.showCustomModal(nodeInformation);
    } else {
      this.showCustomModal("...");
    }
  };

  handleReset = () => {
    const defaultState = { selectedFont: "Arial, sans-serif", selectedButtonColor: 'white', selectedButtonBgColor: 'rgba(121, 122, 128, 0.7)', selectedColor: '#d9534f', selectedBgColor: 'rgba(255,255,255,0.72)', selectedButtonHmColor: '#d9534f', selectedButtonTransColor: 'white', selectedButtonTransBgColor: '#4ade80', selectedLogsColor: 'white', selectedLogsBgColor: 'rgba(121, 122, 128, 0.72)', selectedImage: '../static/weblink1.jpg', logo: false, setting: false, bac: false, logsVisible: true, floconVisible: false, feuilleVisible: false, pluieVisible: false, particuleVisible: false,bulleVisible: false, };

    Object.keys(defaultState).forEach(key => this.removeAppCookie(key));
    localStorage.removeItem('customImage');
    this.setState(defaultState, () => this.changeBackground(defaultState.selectedImage));
    document.body.style.fontFamily = defaultState.selectedFont;
  };

  handleNetworkChange = (evt) => {
    const previousNetwork = this.state.network;
    const network = evt.target.value;

    this.loadNodeInfoForNetwork(network);

    const headers = new Headers()
    headers.append('Content-Type', 'text/plain; charset=utf-8')
    fetch('/api/network', {
      method: 'POST',
      headers,
      body: network,
    })
      .then(() => {
        Notif.info(' ')
      })
      .catch(() => {
        this.setState({
          network: previousNetwork,
        });
        this.loadNodeInfoForNetwork(previousNetwork);
      });

    this.setState({
      network,
      nodes: [],
    });
  };

  handleTriChange = (evt) => {
    const Tri = evt.target.value;
    this.setState({ tri: Tri });
  };

  static getInitialProps() {
    return fetch('/api/svxlink').then(res => res.json())
  }

  render() {
    const { nodes, tri, transmitter } = this.state;

    let nds = nodes;
    if (nodes) {
      if (tri === '1') {
        nds.sort((a, b) => {
          if (a === 'PMR446MHZ') return 1;
          if (b === 'PMR446MHZ') return -1;

          if (a === 'MUMBLE') return 1;
          if (b === 'MUMBLE') return -1;

          if (a === 'DEMO' || a === 'DEMO2') {
            if (b === 'DEMO' || b === 'DEMO2') return a.localeCompare(b);
            return 1;
          }
          if (b === 'DEMO' || b === 'DEMO2') return -1;

          const getDept = (str) => {
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
          };

          const getPseudo = (str) => {
            const match = str.match(/\d+\)?[-\s]?(.*)/);
            return match ? match[1].trim().toLowerCase() : "";
          };

          const deptA = getDept(a);
          const deptB = getDept(b);

          if (deptA !== deptB) return deptA - deptB;

          const pseudoA = getPseudo(a);
          const pseudoB = getPseudo(b);

          return pseudoA.localeCompare(pseudoB);
        });

      } else if (tri === '2') {
        nds.sort((a, b) => {
          if (a === 'PMR446MHZ') return 1;
          if (b === 'PMR446MHZ') return -1;

          let at = a.split(' ');
          if (at.length === 1) at[1] = 'a' + at[0];
          let bt = b.split(' ');
          if (bt.length === 1) bt[1] = 'a' + bt[0];

          if (at[1] < bt[1]) return -1;
          if (at[1] === bt[1]) return 0;
          if (at[1] > bt[1]) return 1;
          return 0;
        });
      }
    }

    const buttonCount = Math.max(nds.filter(name => !sys.includes(name)).length - 1, 0);
    const formattedTransmitter = (this.state.trans && this.state.trans.get(this.state.transmitter)) || this.state.transmitter;
		const defaultNetworkOptions = [ { value: 'default', label: 'Perroquet' },{ value: 'pmr', label: 'Pmr 446 MHz' },{ value: 'bac', label: 'Bac à Sable' }, ];
    const radioAmateurOptions = [ { value: 'ri49', label: 'Ri49' },{ value: 'gir', label: 'Girondin' },{ value: 'rrf', label: 'Rrf' },{ value: 'tec', label: 'Technique' },{ value: 'bav', label: 'Bavardage' }, ];

    let filteredNetworkOptions = [...defaultNetworkOptions];

    if (this.state.res2Enabled) { filteredNetworkOptions.push({ value: 'res2', label: this.state.res2Name }); }
    if (this.state.res3Enabled) { filteredNetworkOptions.push({ value: 'res3', label: this.state.res3Name }); }
    if (this.state.res4Enabled) { filteredNetworkOptions.push({ value: 'res4', label: this.state.res4Name }); }
    if (this.state.isRadioAmateur) { filteredNetworkOptions = [...filteredNetworkOptions, ...radioAmateurOptions]; }

    return (

			<Layout>

  {this.state.floconVisible && ( <Snowfall /> )} {this.state.feuilleVisible && ( <FallLeaves /> )} {this.state.pluieVisible && ( <Rain /> )} {this.state.particuleVisible && ( <Fireflies /> )} {this.state.bulleVisible && ( <Bubbles /> )}

	<div className="chrono"> <span style={{ color: this.state.selectedButtonColor , backgroundColor: formattedTransmitter ? this.state.selectedButtonBgColor : 'transparent', padding: '6px', borderRadius: '8px' }}> {formattedTransmitter} </span> <Chrono transmitter={this.state.transmitter} /> </div>

	<div style={{ textAlign: 'center' }}>

		<SelectCustom options={filteredNetworkOptions} value={this.state.network} onChange={this.handleNetworkChange} className="brdr" style={{ marginLeft: '44px', fontFamily: this.state.selectedFont, width: '168px', position: 'absolute' }} buttonBgColor={this.state.selectedButtonBgColor} buttonColor={this.state.selectedButtonColor} />

		<select required style={{ display: 'none' }} name="network" value={this.state.network} onChange={this.handleNetworkChange}>
			<option value=""> </option> <option value=""> </option> <option value=""> </option>
		</select>

		<select name="tri" style={{ display: 'none' }} value={this.state.tri} onChange={this.handleTriChange}>
			<option value="0"> </option> <option value="1"> </option> <option value="2"> </option>
		</select>

		<button className="transmitter brdr bgrd" style={{ color: this.state.selectedButtonColor , backgroundColor : this.state.selectedButtonBgColor , cursor: 'default' }}>

      <span> {this.state.transmitter !== ' ' && this.state.trans ? this.state.trans.get(this.state.lastid) : this.state.transmitter} </span>

    	{this.state.lastStopTime && ( <span className="stopTime" style={{ color: this.state.selectedButtonHmColor }}>{this.state.lastStopTime}</span> )}

  	</button>

  </div>

{ <ol>
	{nds.map(name => ( name !== 'PMR446MHZ' && !sys.includes(name) && (
		<button key={name} className={this.state.transmitter === name ? 'brdr transmitting pulse' : 'brdr'} style={{ color: name.includes("TEST") || name.includes("DEMO") || name.includes("DEMO2") ? '#4ade80' : (this.state.transmitter === name ? undefined : (this.state.relais.includes(name) ? this.state.selectedColor : this.state.selectedButtonColor)), backgroundColor: this.state.transmitter === name ? undefined : (this.state.relais.includes(name) ? this.state.selectedBgColor : this.state.selectedButtonBgColor) }}
			onClick={() => this.handleClickNode(name)} title="">

      <span> {this.state.trans && this.state.trans.get(name)} </span>

    </button>
	)
	))}

  <div className="bouton2">
    <div style={{ display: 'inline-block', position: 'relative' }}>
	    <button onClick={() => this.toggleElementVisibility('setting')} style={{ width: '77px', padding: '2px 0 0', margin: '0 5px 0 0' }} >⚙️ Régl.</button>
	    <button onClick={() => this.toggleElementVisibility('logsVisible')} style={{ width: '77px', padding: '0', margin: '0 0 0 5px' }} >🕓 Hist.</button>
      <button onClick={this.initializeSound} style={{ width: '38.5px' , margin: '0 5px 0 10px', padding: '0 4px 0 6px' }} > {this.state.soundEnabled ? '🔊' : '🔇'} </button>
      <button style={{ width: '38.5px', margin: '10px 0 0 5px', padding: '6px 0 4px' }} > <p style={{ color: this.state.selectedColor , margin: '0' }}> {buttonCount} </p> </button>
    </div>
  </div>
</ol> }

{this.state.bac && ( <div className="bac"> <iframe src="https://pmr.websdrbordeaux.fr/iframeMob" frameborder="0" style={{ width: '1800px', height: '68px' }}></iframe> </div> )}

{this.state.setting && ( <div style={{ width: '375px', margin: '0 auto' }}>

	<div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', backgroundColor: this.state.selectedLogsBgColor, paddingLeft: '4px' }}>
		<div style={{ margin: '18px 34px 0 0' }}>
      <label htmlFor="colorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Relais : </label>
      <select id="colorSelect" value={this.state.selectedColor} onChange={this.handleColorNodeChange('Color')}>
        <option value="#4ade80">Vert</option> <option value="grey">Gris</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="blue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 0' }}>
      <label htmlFor="bgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="bgColorSelect" value={this.state.selectedBgColor} onChange={this.handleColorNodeChange('BgColor')}>
        <option value="rgba(121,122,128,0.7)">Gris</option> <option value="rgba(74,222,128,0.8)">Vert</option> <option value="rgba(217,83,79,0.7)">Rouge</option> <option value="rgba(255,255,255,0.72)">Blanc</option> <option value="rgba(30,144,255,0.7)">Bleu</option> <option value="rgba(255,193,203,0.7)">Rose</option>
        <option value="rgba(0,0,0,0.7)">Noir</option> <option value="rgba(255,255,0,0.7)">Jaune</option> <option value="rgba(0,255,251,0.7)">Cyan</option> <option value="rgba(244,102,27,0.88)">Orange</option>
      </select>
		</div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ margin: '18px 34px 0 0' }}>
      <label htmlFor="buttonColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Nodes : </label>
      <select id="buttonColorSelect" value={this.state.selectedButtonColor} onChange={this.handleColorNodeChange('ButtonColor')}>
        <option value="#4ade80">Vert</option> <option value="grey">Gris</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="blue">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 0' }}>
      <label htmlFor="buttonBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonBgColorSelect" value={this.state.selectedButtonBgColor} onChange={this.handleColorNodeChange('ButtonBgColor')}>
        <option value="rgba(121, 122, 128, 0.7)">Gris</option> <option value="rgba(74,222,128,0.8)">Vert</option> <option value="rgba(217, 83, 79, 0.7)">Rouge</option> <option value="rgba(255, 255, 255, 0.7)">Blanc</option>
        <option value="rgba(0, 0, 255, 0.7)">Bleu</option> <option value="rgba(255, 193, 203, 0.7)">Rose</option> <option value="rgba(0, 0, 0, 0.7)">Noir</option>
        <option value="rgba(255, 255, 0, 0.7)">Jaune</option> <option value="rgba(0, 255, 251, 0.7)">Cyan</option> <option value="rgba(244, 102, 27, 0.88)">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ margin: '18px 28px 0 9px' }}>
      <label htmlFor="buttonTransColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Trans : </label>
      <select id="buttonTransColorSelect" value={this.state.selectedButtonTransColor} onChange={this.handleColorNodeChange('ButtonTransColor')}>
        <option value="grey">Gris</option> <option value="#4ade80">Vert</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="rgba(30, 144, 255, 0.7)">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 2px 0 7px' }}>
      <label htmlFor="buttonTransBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonTransBgColorSelect" value={this.state.selectedButtonTransBgColor} onChange={this.handleColorNodeChange('ButtonTransBgColor')}>
        <option value="#4ade80">Vert</option> <option value="grey">Gris</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor , paddingLeft: '12px' }}>
		<div style={{ margin: '18px 33px 0 2px' }}>
      <label htmlFor="buttonLogsColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Hist. : </label>
      <select id="buttonLogsColorSelect" value={this.state.selectedLogsColor} onChange={this.handleColorNodeChange('LogsColor')}>
        <option value="#4ade80">Vert</option> <option value="grey">Gris</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="rgba(30, 144, 255, 0.7)">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 2px' }}>
      <label htmlFor="buttonLogsBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonLogsBgColorSelect" value={this.state.selectedLogsBgColor} onChange={this.handleColorNodeChange('LogsBgColor')}>
        <option value="rgba(121, 122, 128, 0.72)">Gris</option> <option value="rgba(74,222,128,0.8)">Vert</option> <option value="rgba(217, 83, 79, 0.72)">Rouge</option> <option value="rgba(255, 255, 255, 0.74)">Blanc</option>
        <option value="rgba(30, 144, 255, 0.72)">Bleu</option> <option value="rgba(255, 193, 203, 0.72)">Rose</option> <option value="rgba(0, 0, 0, 0.7)">Noir</option>
        <option value="rgba(255, 255, 0, 0.72)">Jaune</option> <option value="rgba(0, 255, 251, 0.72)">Cyan</option> <option value="rgba(244, 102, 27, 0.88)">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor , paddingLeft: '12px' }}>
		<div style={{ margin: '18px 2px 0 0' }}>
      <label htmlFor="buttonHmColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>H m : </label>
      <select id="buttonHmColorSelect" value={this.state.selectedButtonHmColor} onChange={this.handleColorNodeChange('ButtonHmColor')}>
        <option value="#4ade80">Vert</option> <option value="grey">Gris</option> <option value="#d9534f">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 32px' }}>
      <label htmlFor="fontSelect" style={{ color: this.state.selectedLogsColor }}>Police :</label>
      <select id="fontSelect" value={this.state.selectedFont} onChange={this.handleFontChange} style={{ width: '122px' , marginLeft: '6px' }}>
        <option value="Comic Sans MS, cursive">Comic</option> <option value="Arial, sans-serif">Arial</option> <option value="'Courier New', monospace">Courier New</option> <option value="Georgia, serif">Georgia</option> <option value="'Times New Roman', serif">Times New Roman</option> <option value="Verdana, sans-serif">Verdana</option> <option value="Tahoma, sans-serif">Tahoma</option> <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option> <option value="Impact, sans-serif">Impact</option> <option value="'Lucida Console', monospace">Lucida Console</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ marginRight: '6px' }}>

      <label htmlFor="" style={{ color: this.state.selectedLogsColor , marginRight: '0 38px 0 28px' }}>Image : </label>

      <div style={{ position: 'relative', display: 'inline-block', top: '14px', margin: '0 20px 0 12px' }}>

        <div onClick={() => this.setState(prev => ({ showImageGrid: !prev.showImageGrid }))} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', width: '60px', height: '40px' }}> <img src={this.state.selectedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> </div>

        {this.state.showImageGrid && (
          <div style={{ position: 'absolute', bottom: '48px', left: '-150px', zIndex: 9999, display: 'grid', gridTemplateColumns: 'repeat(5, 60px)', gap: '12.8px', padding: '10px', backgroundColor: 'rgba(106, 107, 108, 0.9)', borderRadius: '8px' }}>

            {Array.from({ length: 30 }, (_, i) => {
              if (i === 29) {
                return (
                  <div>
                    <div key="custom-upload" onClick={() => document.getElementById('customBackgroundInput').click()} style={{ width: '64px', height: '46px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#d9534f' }} title="" > + </div>
                  </div>
                );
              }

              const path = `../static/weblink${i + 1}.jpg`;
              return (
                <img key={i} src={path} alt={`Fond ${i + 1}`} onClick={() => { this.changeBackground(path); this.setState({ showImageGrid: false }); }} style={{ width: '64px', height: '46px', borderRadius: '6px', cursor: 'pointer', objectFit: 'cover', border: this.state.selectedImage === path ? '2px solid #d9534f' : '1px solid transparent' }}/>
              );
            })}

          </div>
        )}

      </div>

      <input type="file" id="customBackgroundInput" accept="image/*" style={{ display: 'none' }} onChange={this.handleCustomImageUpload} />

      <label className="coche" style={{ marginRight: '6px', color: this.state.selectedLogsColor }}> Logo : <input type="checkbox" checked={this.state.logo} onChange={() => this.toggleElementVisibility('logo')} /> <span className="checkmark"></span> </label>

    </div>
  </div>

	<div style={{ display: 'flex', justifyContent: 'center', backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ margin: '14px 6px 0 0' }}>
      <label htmlFor="" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Reset : </label>
      <button onClick={this.handleReset} style={{ width: '20px', marginLeft: '0', backgroundColor: 'transparent' }}> <img src="../static/reset.png"/> </button>
      <label className="coche" style={{ color: this.state.selectedLogsColor, margin: '0 12px 0 44px' }}>Notif : <input type="checkbox" checked={this.state.notificationsEnabled} onChange={this.handleNotificationsToggle} /> <span className="checkmark"></span> </label>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', backgroundColor: this.state.selectedLogsBgColor, paddingBottom: '14px' }}>
    <div style={{ marginTop: '4px' }}>
      <label className="coche" style={{ margin: '6px 12px 0 0', color: 'white' }}> ❄️ <input type="checkbox" checked={this.state.floconVisible} onChange={() => this.toggleElementVisibility('floconVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px', color: 'white' }}> 🍁 <input type="checkbox" checked={this.state.feuilleVisible} onChange={() => this.toggleElementVisibility('feuilleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px', color: 'white' }}> 💧 <input type="checkbox" checked={this.state.pluieVisible} onChange={() => this.toggleElementVisibility('pluieVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px', color: 'white' }}> 🫧 <input type="checkbox" checked={this.state.bulleVisible} onChange={() => this.toggleElementVisibility('bulleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px', color: 'white' }}> 🔘 <input type="checkbox" checked={this.state.particuleVisible} onChange={() => this.toggleElementVisibility('particuleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>
    </div>
  </div>

</div>
)}

		<div id="customModal"></div>

    {this.state.showNotification && ( <div className={`notification ${this.state.notificationFadeOut ? 'fadeOut' : ''}`}> {this.state.notificationMessage} </div> )}

    {this.state.showNodeLeftNotification && ( <div className={`notification ${this.state.nodeLeftNotificationFadeOut ? 'fadeOut' : ''}`}> {this.state.nodeLeftNotificationMessage} </div> )}

		{this.state.logsVisible && (
			<div style={{ width: '375px', cursor: 'default', margin: '0 auto'}}>
        <div className="tab" style={{ margin: '20px 0 0 17px' }}>
          <button className={this.state.activeTab1 === 'logs' ? 'active' : ''} onClick={() => this.toggleTab('logs',1)} style={{ width: '104px' }} >Historique</button>
          <button className={this.state.activeTab1 === 'other' ? 'active' : ''} onClick={() => this.toggleTab('other',1)} style={{ width: '104px' }}>Détails</button>
          <button className={this.state.activeTab1 === 'other2' ? 'active' : ''} onClick={() => this.toggleTab('other2',1)} style={{ width: '104px' }}>Entr / Sort</button>
        </div>
        <div className="tab-content">
          {this.state.activeTab1 === 'logs' && ( <div className="onglet" > <pre dangerouslySetInnerHTML={{ __html: this.state.logs }} /> </div> )}
          {this.state.activeTab1 === 'other' && ( <div className="onglet" > <pre>{this.state.logs2}</pre> </div> )}
          {this.state.activeTab1 === 'other2' && ( <div className="onglet" > <pre>{this.state.logs3}</pre> </div> )}
        </div>
      </div>
		)}

  {this.state.logo && ( <div style={{ margin: '0 auto', width: '284px' }}> <a target="_blank" href="https://www.websdrbordeaux.fr"> <img src="../static/logoRond2.png" className="image wiggle" /> </a> </div> )}

<style jsx>{`

	pre { font-family: ${this.state.selectedFont}; color: ${this.state.selectedLogsColor}; line-height: 0.9; margin-top: 0; letter-spacing: 1px; }

	select { max-width: 220px; background-color: ${this.state.selectedButtonBgColor}; color:${this.state.selectedButtonColor}; border: none; text-align-last: center;}

	#buttonColorSelect { max-width: 220px; background-color: ${this.state.selectedButtonColor}; color: white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonBgColorSelect { max-width: 220px; background-color: ${this.state.selectedButtonBgColor}; color: white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#colorSelect { max-width: 220px; background-color: ${this.state.selectedColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#bgColorSelect { max-width: 220px; background-color: ${this.state.selectedBgColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonTransColorSelect { max-width: 220px; background-color: ${this.state.selectedButtonTransColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonTransBgColorSelect { max-width: 220px; background-color: ${this.state.selectedButtonTransBgColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonHmColorSelect { max-width: 220px; background-color: ${this.state.selectedButtonHmColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonLogsColorSelect { max-width: 220px; background-color: ${this.state.selectedLogsColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

	#buttonLogsBgColorSelect { max-width: 220px; background-color: ${this.state.selectedLogsBgColor}; color:white; border: none; text-align-last: center; border-radius: 6px; cursor: pointer; }

  :global(.colorTime) { color: ${this.state.selectedButtonHmColor}; margin-left: 10px; }

	.tri { margin-left: 50px; }

	.brdr { border: none; }

	.bgrd { background-color: rgba(206, 206, 206, 0.90); }

	button { display: inline-block; width: 164px; height: 30px; padding: 4px; border: none; border-radius: 8.8px; margin: 4px 5px; text-align: center; background-color: ${this.state.selectedButtonBgColor}; color: ${this.state.selectedButtonColor}; font-size: 0.95em; font-family: ${this.state.selectedFont}; }

	ol { padding: 12% 0% 0%; text-align: center; max-width: 1900px; margin: 6px auto 0; }

	.transmitting { font-weight: bold; color: ${this.state.selectedButtonTransColor} !important; background-color: ${this.state.selectedButtonTransBgColor}; }

	.transmitter { margin: 22px auto 0; top: 88px; width: 194px; background-color: rgba(121, 122, 128, 0.7); }

	.stopTime { margin-left: 24px; font-size: 14.8px; color: #d9534f; font-weight: bold; }

  .pulse { animation: pulsing 4.6s ease-in-out infinite; }

  @keyframes pulsing { 0% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } 50% { box-shadow: 0 0 8.8px 4px rgba(255, 255, 255, 0.52); transform: scale(1.02); } 100% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } }

	#customModal { display: none; position: fixed; top: 80px; left: 50%; transform: translateX(-50%); padding: 8px 8px 12px; background-color: rgba(121, 122, 128, 0.88); box-shadow: white 0 0 60px; z-index: 9999; width: 298px; min-height: 34px; border-radius: 16px; text-align: center; color: white; cursor: default; }

 	.visible { display: block; }

	.green {color: #4ade80; }

	.grey {color: grey; }

	.red { color: #d9534f; }

	.blue { color: blue; }

	.white { color: white; }

	.pink {color: pink; }

	.black {color: black; }

	.yellow {color: rgba(255, 255, 0, 0.7); }

	.cyan {color: rgba(0, 255, 251, 0.7); }

	.orange {color: rgba(244, 102, 27, 0.88); }

	.bg-grey { background-color: rgba(121,122,128,0.7); }

	.bg-green { background-color: rgba(74, 222, 128, 0.8); }

	.bg-red { background-color: rgba(217, 83, 79, 0.7); }

	.bg-blue { background-color: rgba(0, 0, 255, 0.7); }

	.bg-white { background-color: rgba(255, 255, 255, 0.7); }

	.bg-pink { background-color: rgba(255, 193, 203, 0.7); }

	.bg-black { background-color: rgba(0, 0, 0, 0.7); }

	.bg-yellow { background-color: rgba(255, 255, 0, 0.7); }

	.bg-cyan { background-color: rgba(0, 255, 251, 0.7); }

	.bg-orange { background-color: rgba(244, 102, 27, 0.88); }

	.coche { display: inline-block; position: relative; padding-left: 0; margin: 12px 0 2px 0; cursor: pointer; font-size: 16px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }

	.coche input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }

	.checkmark { position: absolute; top: 6px; left:50px; height: 13px; width: 13px; background-color: white; border-radius: 4px; }

	.coche:hover input ~ .checkmark { background-color: white; }

	.coche input:checked ~ .checkmark { background-color: white; }

	.checkmark:after { content: ""; position: absolute; display: none; }

	.coche input:checked ~ .checkmark:after { display: block; }

	.coche .checkmark:after { left: 2px; top: 0px; width: 6px; height: 8px; border: solid #4ade80; border-width: 0 3px 3px 0; -webkit-transform: rotate(45deg); -ms-transform: rotate(45deg); transform: rotate(45deg); }

	.tab button { background-color: ${this.state.selectedLogsBgColor}; border: none; cursor: pointer; color: ${this.state.selectedLogsColor}; }

  .tab button.active { background-color: ${this.state.selectedLogsColor}; color: ${this.state.selectedLogsBgColor}; }

  .onglet { border-radius: 16px; background-color: ${this.state.selectedLogsBgColor}; padding: 18px; margin-top: 6px; width: 339px; height: 380px; overflow: auto; }}

  *:focus { outline: none; }

  .bac { display: flex; max-width: 1340px; margin: 0 auto; }

	.bouton2 { background-color: transparent; margin: 14px auto 0; padding: 0; width: 262px; display: flex; }

  .chrono { color: white; fontSize: 12pt; width: 200px; margin: 0 auto; position: absolute; left: 50%; transform: translate(-50%); top: 12px; text-align: center; }

  .wiggle { animation: wiggleIn 1s ease-in-out forwards; animation-delay: 0.28s; opacity: 0; height: 284px; margin: 0; }

  .notification { position: fixed; top: 148px; left: 50%; transform: translateX(-50%); background-color: ${this.state.selectedButtonBgColor}; color: ${this.state.selectedButtonColor}; padding: 12px 22px; border-radius: 16px; box-shadow: white 0 0 60px; z-index: 1; width: 242px; }

  @keyframes wiggleIn { 0% { transform: translateX(0) rotate(0); opacity: 0; } 10% { transform: translateX(-3px) rotate(-2deg); opacity: 0.2; } 20% { transform: translateX(3px) rotate(2deg); opacity: 0.4; } 30% { transform: translateX(-3px) rotate(-1.5deg); } 40% { transform: translateX(3px) rotate(1.5deg); } 50% { transform: translateX(-2px) rotate(-1deg); } 60% { transform: translateX(2px) rotate(1deg); } 70% { transform: translateX(-1px) rotate(-0.5deg); } 80% { transform: translateX(1px) rotate(0.5deg); } 90% { transform: translateX(0) rotate(0); } 100% { opacity: 0.78; } }

  @media (max-width: 600px) {
	  ol { padding: 0.8% 0% 0%; }
  }

`}</style>

	    </Layout>
	  )
	}
}
export default Component