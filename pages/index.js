import React from 'react';
import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import fetch from '../lib/fetch';
import dynamic from 'next/dynamic';
import notie from '../lib/notie';
import Fsm from '../lib/svxlink/fsm';
import qrz from '../lib/qrz';
import { NodeInfo, Trans, Relais } from '../lib/nodeInfo';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import Chrono from '../lib/chrono';
import SelectCustom from '../lib/select';
const Snowfall = dynamic(() => import('../lib/Snowfall'), { ssr: false });
const FallLeaves = dynamic(() => import('../lib/FallLeaves'), { ssr: false });
const Rain = dynamic(() => import('../lib/Rain'), { ssr: false });
const Fireflies = dynamic(() => import('../lib/Fireflies'), { ssr: false });
const Bubbles = dynamic(() => import('../lib/Bubbles'), { ssr: false });
const Pong = dynamic(() => import('../lib/pong'), { ssr: false });

class Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...props, tri: '1', contrast: 100, brightness: 100, selectedFont: 'Arial, sans-serif', selectedColor: 'red', selectedBgColor: 'white', selectedButtonColor: 'white', selectedButtonBgColor: 'rgba(121, 122, 128, 0.7)', selectedButtonHmColor: 'red', selectedButtonTransColor: 'white', selectedButtonTransBgColor: 'lime', selectedLogsColor: 'white', selectedLogsBgColor: 'rgba(121, 122, 128, 0.72)', imageVisible: true, reglageVisible: true, floconVisible: false, feuilleVisible: false, pluieVisible: false, particuleVisible: false, bulleVisible: false, isDragging: false, dragStartX: 0, dragStartY: 0, currentOffsetX: 0, currentOffsetY: 0, logsDivX: 0.2, logsDivY: 53.23, logsVisible: true, logs2Visible: false, logs3Visible: false, activeTab1: 'logs', activeTab2: 'other5', activeTab3: 'other10', selectedImage: '../static/spotnik1.jpg', isResetClicked: false, showNotification: false, notificationMessage: '', showNodeLeftNotification: false, nodeLeftNotificationMessage: '', notificationsEnabled: true, soundInitialized: false, soundEnabled: false, nbNodesVisible: true, res2Name: 'Réseau 2', res3Name: 'Réseau 3', res4Name: 'Réseau 4', isDraggingNbNodes: false, dragStartXNbNodes: 0, dragStartYNbNodes: 0, currentOffsetXNbNodes: 0, currentOffsetYNbNodes: 0, nbNodesDivX: 20, nbNodesDivY: 0, isNearTopEdge: false, isNearLeftEdge: false, };
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

  handleNotificationsToggle = (event) => {
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

  fetchLogs = (logType) => {
    const url = `:3004/api/${logType === 'logs' ? 'logsTemps' : logType}`;

    fetch(url)
      .then((response) => response.text())
      .then((data) => {
        this.setState({ [logType]: data });
      })
      .catch((error) => {
      console.error(`Erreur récupération ${logType} :`, error);
      });
  };

  loadConfig = () => {
    fetch('/api/configuration', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        this.setState({ res2Name: data.res2 || 'Réseau 2', res3Name: data.res3 || 'Réseau 3', res4Name: data.res4 || 'Réseau 4', });
      })
      .catch((error) => console.error('Erreur chargement fichier Json :', error));
  };

  handleMouseDown = (e) => {
    this.setState({
      isDragging: true,dragStartX: e.clientX - this.state.currentOffsetX,dragStartY: e.clientY - this.state.currentOffsetY,
    });
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  };

  handleMouseMove = (e) => {
    if (this.state.isDragging) {
      const newOffsetX = e.clientX - this.state.dragStartX;
      const newOffsetY = e.clientY - this.state.dragStartY;

      this.setState({
        currentOffsetX: newOffsetX,currentOffsetY: newOffsetY,
      });
    }
  };

  handleMouseUp = () => {
    this.setState((prevState) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const offsetXVW = (prevState.currentOffsetX / windowWidth) * 100;
      const offsetYVH = (prevState.currentOffsetY / windowHeight) * 100;

      const newLogsDivX = prevState.logsDivX + offsetXVW;
      const newLogsDivY = prevState.logsDivY + offsetYVH;

      this.setAppCookie('logsDivX', newLogsDivX);
      this.setAppCookie('logsDivY', newLogsDivY);

      return {
        isDragging: false,currentOffsetX: 0,currentOffsetY: 0,logsDivX: newLogsDivX,logsDivY: newLogsDivY,
      };
    });
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  handleMouseDownNbNodes = (e) => {
    e.preventDefault();

    document.body.classList.add('no-select');

    this.setState({
      isDraggingNbNodes: true,dragStartXNbNodes: e.clientX,dragStartYNbNodes: e.clientY,
    });
    document.addEventListener('mousemove', this.handleMouseMoveNbNodes);
    document.addEventListener('mouseup', this.handleMouseUpNbNodes);
  };

  handleMouseMoveNbNodes = (e) => {
    if (this.state.isDraggingNbNodes) {
      const mouseY = e.clientY;
      const mouseX = e.clientX;
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      const isNearTopEdge = mouseY < windowHeight * 0.06;
      const isNearLeftEdge = mouseX < windowWidth * 0.06;

      this.setState({
        isNearTopEdge: isNearTopEdge,
        isNearLeftEdge: isNearLeftEdge,
      });

      if (isNearTopEdge) {
        const newOffsetX = e.clientX - this.state.dragStartXNbNodes;
        this.setState({
          currentOffsetXNbNodes: newOffsetX,
          currentOffsetYNbNodes: -window.innerHeight * (this.state.nbNodesDivY / 100),
        });
      } else if (isNearLeftEdge) {
        const newOffsetY = e.clientY - this.state.dragStartYNbNodes;
        this.setState({
          currentOffsetXNbNodes: -window.innerWidth * (this.state.nbNodesDivX / 100),
          currentOffsetYNbNodes: newOffsetY,
        });
      } else {
        const newOffsetX = e.clientX - this.state.dragStartXNbNodes;
        const newOffsetY = e.clientY - this.state.dragStartYNbNodes;
        this.setState({
          currentOffsetXNbNodes: newOffsetX,
          currentOffsetYNbNodes: newOffsetY,
        });
      }
    }
  };

  handleMouseUpNbNodes = () => {
    document.body.classList.remove('no-select');

    this.setState((prevState) => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let newNbNodesDivX = prevState.nbNodesDivX;
      let newNbNodesDivY = prevState.nbNodesDivY;

      if (prevState.isNearTopEdge) {
        newNbNodesDivX = (prevState.nbNodesDivX + (prevState.currentOffsetXNbNodes / windowWidth) * 100);
        newNbNodesDivY = 0;
      } else if (prevState.isNearLeftEdge) {
        newNbNodesDivX = 0;
        newNbNodesDivY = (prevState.nbNodesDivY + (prevState.currentOffsetYNbNodes / windowHeight) * 100);
      } else {
        newNbNodesDivX = (prevState.nbNodesDivX + (prevState.currentOffsetXNbNodes / windowWidth) * 100);
        newNbNodesDivY = (prevState.nbNodesDivY + (prevState.currentOffsetYNbNodes / windowHeight) * 100);
      }

      this.setAppCookie('nbNodesDivX', newNbNodesDivX);
      this.setAppCookie('nbNodesDivY', newNbNodesDivY);

      return {
        isDraggingNbNodes: false,currentOffsetXNbNodes: 0,currentOffsetYNbNodes: 0,nbNodesDivX: newNbNodesDivX,nbNodesDivY: newNbNodesDivY,isNearTopEdge: false,isNearLeftEdge: false,
      };
    });
    document.removeEventListener('mousemove', this.handleMouseMoveNbNodes);
    document.removeEventListener('mouseup', this.handleMouseUpNbNodes);
  };

  componentWillUnmount() {
    clearInterval(this.logsInterval);document.removeEventListener('click', this.handleOutsideClick);document.removeEventListener('mousemove', this.handleMouseMoveNbNodes);document.removeEventListener('mouseup', this.handleMouseUpNbNodes);
  }

  componentDidMount() {
    this.connectionSound = new Audio('../static/notifIn.wav'); this.disconnectionSound = new Audio('../static/notifOut.wav');

    this.loadConfig();

    this.logsInterval = setInterval(() => {this.fetchLogs('logs');this.fetchLogs('logs2');this.fetchLogs('logs3');}, 2822);

    this.fetchLogs('logs'); this.fetchLogs('logs2'); this.fetchLogs('logs3');

    this.applyFilters();

    const savedLogsDivX = this.getAppCookie('logsDivX');
    const savedLogsDivY = this.getAppCookie('logsDivY');

    if (savedLogsDivX !== undefined) {
      this.setState({ logsDivX: parseFloat(savedLogsDivX) });
    }
    if (savedLogsDivY !== undefined) {
      this.setState({ logsDivY: parseFloat(savedLogsDivY) });
    }

    const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
      window.location.href = '/mobile';
    }

    const savedNbNodesDivX = this.getAppCookie('nbNodesDivX');
    const savedNbNodesDivY = this.getAppCookie('nbNodesDivY');
    if (savedNbNodesDivX !== undefined) {
      this.setState({ nbNodesDivX: parseFloat(savedNbNodesDivX) });
    }
    if (savedNbNodesDivY !== undefined) {
      this.setState({ nbNodesDivY: parseFloat(savedNbNodesDivY) });
    }

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
      imageToUse = '../static/spotnik1.jpg';
      this.setAppCookie('selectedImage', imageToUse);
    }

    this.changeBackground(imageToUse);

    const stateKeys = ['selectedButtonColor','selectedButtonBgColor','selectedColor','selectedBgColor','selectedButtonHmColor','selectedButtonTransColor','selectedButtonTransBgColor','selectedLogsColor','selectedLogsBgColor','selectedImage'];

    const newState = {};

    stateKeys.forEach((key) => {
      const value = this.getAppCookie(key);
      if (value !== undefined) {
        newState[key] = value;
      }
    });

    const booleanKeys = ['imageVisible','reglageVisible','floconVisible','feuilleVisible','pluieVisible','particuleVisible','bulleVisible', 'logsVisible','logs2Visible','logs3Visible','nbNodesVisible'];

    booleanKeys.forEach((key) => {
      const value = this.getAppCookie(key);
      if (value !== undefined) {
        try {
          newState[key] = JSON.parse(value);
        } catch (e) {
          console.warn(`Erreur parsing pour ${key} :`, e);
        }
      }
    });

    this.setState(newState);

    const es = new EventSource('/stream');

    const fsm = new Fsm(
      es,
      () => {
        this.setState(fsm);
      },
      this.props
    );

    es.addEventListener('ReflectorLogic.MsgNodeJoined', (event) => {
      const [name] = JSON.parse(event.data);
      const qrzName = Trans.get(name);
      const spaces = '\u00A0'.repeat(2);
      this.showNotification(`${qrzName ? `${qrzName} ` : ''}${spaces}s'est connecté`);
    });

    es.addEventListener('ReflectorLogic.MsgNodeLeft', (event) => {
      const [name] = JSON.parse(event.data);
      const qrzName = Trans.get(name);
      const spaces = '\u00A0'.repeat(2);
      this.showNodeLeftNotification(`${qrzName ? `${qrzName} ` : ''}${spaces}s'est déconnecté`);
    });

    es.onerror = (error) => {
      console.error('EventSource error', error);
    };
  }

  toggleVisibility = (stateKey, cookieKey = stateKey) => {
    const newVisibility = !this.state[stateKey];
    this.setState({ [stateKey]: newVisibility });
    this.setAppCookie(cookieKey, newVisibility);
  };

  toggleElementVisibility = (key) => {
    if (key === 'reglageVisible') {
      this.setState({
        logs3Visible: false,
      }, () => this.setAppCookie('logs3Visible', false));
    } else if (key === 'logs3Visible') {
      this.setState({
        reglageVisible: false,
      }, () => this.setAppCookie('reglageVisible', false));
    }

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
    const imageURL = 'url(' + imageID + ')';
    document.body.style.backgroundImage = imageURL;

    if (imageID === '../static/spotnik4.jpg') {
      document.body.style.backgroundSize = '100%';
      document.body.style.backgroundPositionY = '26%';
    } else {
      document.body.style.backgroundSize = '100% 100%';
      document.body.style.backgroundPositionY = 'initial';
    }

    if (imageID.startsWith('data:image')) {
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
      <style> .fermer2 { position: absolute; top: 4px; right: 6px; font-size: 14px; cursor: pointer; border-radius: 8px; color: red; width: 18px; height: 20px; transition: background-color 0.2s; } .fermer2:hover { background-color: white; } </style>
      <div class="fermer2" onClick="this.parentNode.style.display='none'">X</div>
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
    if (nodeName === 'PMR446MHZ') {
      this.showCustomModal('<div id="pong-container"></div>');
      const modal = document.getElementById('pong-container');
      ReactDOM.render(<Pong />, modal);
    } else {
      const nodeInformation = NodeInfo[nodeName];
      if (nodeInformation) {
        this.showCustomModal(nodeInformation);
      } else {
        this.showCustomModal('...');
      }
    }
  };

  handleFullScreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  handleReset = () => {
    const defaultState = { selectedFont: "Arial, sans-serif", selectedButtonColor: 'white', selectedButtonBgColor: 'rgba(121, 122, 128, 0.7)', selectedColor: 'red', selectedBgColor: 'white', selectedButtonHmColor: 'red', selectedButtonTransColor: 'white', selectedButtonTransBgColor: 'lime', selectedLogsColor: 'white', selectedLogsBgColor: 'rgba(121, 122, 128, 0.72)', selectedImage: '../static/spotnik1.jpg', imageVisible: true, reglageVisible: true, logsDivX: 0.2, logsDivY: 53.23, logsVisible: true, logs2Visible: false, logs3Visible: false, nbNodesVisible: true, floconVisible: false, feuilleVisible: false, pluieVisible: false, particuleVisible: false, bulleVisible: false, nbNodesDivX: 20, nbNodesDivY: 0, };

    this.removeAppCookie('logsDivX'); this.removeAppCookie('logsDivY');
    this.removeAppCookie('nbNodesDivX');this.removeAppCookie('nbNodesDivY');

    Object.keys(defaultState).forEach(key => this.removeAppCookie(key));
    localStorage.removeItem('customImage');
    this.setState(defaultState, () => this.changeBackground(defaultState.selectedImage));
    document.body.style.fontFamily = defaultState.selectedFont;

    this.setState({ isResetClicked: true });
    setTimeout(() => {
      this.setState({ isResetClicked: false });
    }, 288);
  };

  handleNetworkChange = (evt) => {
    const previousNetwork = this.state.network;
    const network = evt.target.value;
    const headers = new Headers();
    headers.append('Content-Type', 'text/plain; charset=utf-8');
    fetch('/api/network', {
      method: 'POST',
      headers,
      body: network,
    })
      .then(() => {
        notie.info('Redémarrage Pmr 446 MHz ..');
      })
      .catch(() => {
        this.setState({
          network: previousNetwork,
        });
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
    return fetch('/api/svxlink').then((res) => res.json());
  }

  render() {
    const { nodes, tri, transmitter } = this.state;

    let nds = nodes;
    if (nodes) {
      if (tri === '1') {
        nds.sort();
      } else if (tri === '2') {
        nds.sort((a, b) => {
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

    const bgColors = { grey: 'rgba(121,122,128,0.7)', lime: 'rgba(0, 255, 0, 0.8)', red: 'rgba(217, 83, 79, 0.7)', dodgerblue: 'rgba(30, 144, 255, 0.7)', white: 'rgba(255, 255, 255, 0.72)', pink: 'rgba(255, 193, 203, 0.7)', black: 'rgba(0, 0, 0, 0.7)', yellow: 'rgba(255, 255, 0, 0.7)', cyan: 'rgba(0, 255, 251, 0.7)', orange: 'rgba(244, 102, 27, 0.88)' };
    const buttonCount = Math.max(nds.filter((name) => name !== 'pouet').length - 1, 0);
    const formattedTransmitter = Trans.get(this.state.transmitter) || this.state.transmitter;
    const roundedStyle = this.state.nbNodesDivY === 0 ? { borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', } : this.state.nbNodesDivX === 0 ? { borderTopRightRadius: '8px', borderBottomRightRadius: '8px', } : { borderRadius: '8px' };
		const networkOptions = [
      { value: 'default', label: 'Perroquet' },
      { value: 'pmr', label: 'Pmr 446 MHz' },{ value: 'bac', label: 'Bac à Sable' },
      { value: 'res2', label: this.state.res2Name },{ value: 'res3', label: this.state.res3Name },{ value: 'res4', label: this.state.res4Name },
      { value: 'ri49', label: 'Ri49' },
      { value: 'rrf', label: 'Rrf' },{ value: 'tec', label: 'Technique' },{ value: 'bav', label: 'Bavardage' },
    ];

    return (

    <Layout>

  {this.state.floconVisible && ( <Snowfall /> )} {this.state.feuilleVisible && ( <FallLeaves /> )} {this.state.pluieVisible && ( <Rain /> )} {this.state.particuleVisible && ( <Fireflies /> )} {this.state.bulleVisible && ( <Bubbles /> )}

	<div className="form-inline">

		<SelectCustom options={networkOptions} value={this.state.network} onChange={this.handleNetworkChange} className="brdr" style={{ marginLeft: '100px', fontFamily: this.state.selectedFont }} buttonBgColor={this.state.selectedButtonBgColor} buttonColor={this.state.selectedButtonColor} />

		<select name="tri" className="form-control brdr tri d-none" value={this.state.tri} onChange={this.handleTriChange}>
			<option value="0">Pas de Tri</option> <option value="1">Sur le Département</option> <option value="2">Sur le Prénom</option>
		</select>

		<button className="transmitter brdr bgrd" style={{ color: this.state.selectedButtonColor , backgroundColor : this.state.selectedButtonBgColor , cursor: 'default' }}>

      <span> {this.state.transmitter !== ' ' ? Trans.get(this.state.lastid) : this.state.transmitter} </span>

    	{this.state.lastStopTime && ( <span className="stopTime" style={{ color: this.state.selectedButtonHmColor }}>{this.state.lastStopTime}</span> )}

  	</button>

  </div>

  <AnimatePresence>
    {this.state.isNearTopEdge && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.88 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '0vh', boxShadow: '0 6px 8px 8px white', pointerEvents: 'none', zIndex: 999, }} /> )}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.isNearLeftEdge && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.88 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', top: '0', left: '0', width: '0vw', height: '100%', boxShadow: '6px 0 8px 8px white', pointerEvents: 'none', zIndex: 999, }} /> )}
  </AnimatePresence>

  <AnimatePresence>
    {this.state.nbNodesVisible && ( <motion.p onMouseDown={this.handleMouseDownNbNodes} initial={{ opacity: 0, scale: 0.9 }}animate={{ opacity: 1, scale: 1, x: this.state.currentOffsetXNbNodes, y: this.state.currentOffsetYNbNodes, }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} style={{ color: this.state.selectedColor, ...roundedStyle, padding: '4px 0', textAlign: 'center', width: '34px', position: 'absolute', left: `${this.state.nbNodesDivX}vw`, top: `${this.state.nbNodesDivY}vh`, cursor: 'grab', backgroundColor: bgColors[this.state.selectedBgColor] || 'transparent', userSelect: 'none' }}> {buttonCount} </motion.p> )}
  </AnimatePresence>

{ <ol>
	{nds.map(name => ( name !== 'pouet' && (
	<div className="tooltip-container">
    <button key={name} id="bouton" style={{ fontFamily: this.state.selectedFont, color: name.includes("TEST") ? 'lime' : undefined, }} className={`${this.state.transmitter === name ? 'brdr transmitting pulse'

  		: Relais.includes(name)

      ? `brdr ${this.state.selectedColor} bg-${this.state.selectedBgColor}`
      : `brdr ${qrz(name) ? '' : this.state.selectedButtonColor} ${qrz(name) ? '' : 'bg-' + this.state.selectedButtonBgColor}`} ripple` }
  		onClick={() => this.handleClickNode(name)} title="">

  		<span style={{ fontWeight: 'bold' }}>{qrz(name)}</span> <span> {Trans.get(name)} </span>

		</button>
		<span className="tooltip">Cliquez pour + d&apos;infos</span>
 </div>
		)
	))}

  <div className="bouton2 no-hover-parent">
    <div style={{ display: 'inline-block', position: 'relative' }}>

    	<button onClick={() => this.toggleElementVisibility('reglageVisible')} style={{ fontFamily: this.state.selectedFont , width: '97px' , paddingLeft: '0' }} className="ripple" >⚙️ Régl.</button>
	    <button onClick={() => this.toggleElementVisibility('logsVisible')} style={{ fontFamily: this.state.selectedFont , width: '97px' , paddingRight: '0' , marginRight: '0' }} className="ripple" >🕓 Hist.</button>
      <button onClick={this.initializeSound} onMouseEnter={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })} style={{ width: '46.5px' , margin: '0 0 0 10px' , padding: '3px 0px 4.4px 3px' }} className="ripple2" > {this.state.soundEnabled ? '🔊' : '🔇'} </button>
        {this.state.isHovered && ( <span style={{ position: 'absolute', top: '108%', left: '91%', transform: 'translateX(-50%)', marginTop: '5px', backgroundColor: this.state.selectedButtonBgColor, color: this.state.selectedButtonColor, padding: '4px 8px', borderRadius: '5px', fontSize: '12px', whiteSpace: 'nowrap', zIndex: 10, fontFamily: this.state.selectedFont }}> {this.state.soundEnabled ? 'Notifs Sonore On' : 'Notifs Sonore Off'} </span> )}

    </div>
  </div>

</ol> }

<AnimatePresence>
  {this.state.reglageVisible && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '375px' , position: 'absolute' , top: '53.7vh' , right: '2.8vw' }} >

	<div style={{ display: 'flex', justifyContent: 'center' , borderTopLeftRadius: '16px' , borderTopRightRadius: '16px' , backgroundColor: this.state.selectedLogsBgColor , paddingLeft: '4px' }}>

		<button onClick={() => this.toggleElementVisibility('reglageVisible')} className="fermer"> X </button>

		<div style={{ margin: '18px 34px 0 0' }}>
      <label htmlFor="colorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Relais : </label>
      <select id="colorSelect" value={this.state.selectedColor} onChange={this.handleColorNodeChange('Color')}>
        <option value="lime">Vert</option> <option value="grey">Gris</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 26px 0 0' }}>
      <label htmlFor="bgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="bgColorSelect" value={this.state.selectedBgColor} onChange={this.handleColorNodeChange('BgColor')}>
        <option value="grey">Gris</option> <option value="lime">Vert</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
		</div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ margin: '18px 34px 0 0' }}>
      <label htmlFor="buttonColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Nodes : </label>
      <select id="buttonColorSelect" value={this.state.selectedButtonColor} onChange={this.handleColorNodeChange('ButtonColor')}>
        <option value="lime">Vert</option> <option value="grey">Gris</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="rgb(30, 144, 255)">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 0' }}>
      <label htmlFor="buttonBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonBgColorSelect" value={this.state.selectedButtonBgColor} onChange={this.handleColorNodeChange('ButtonBgColor')}>
        <option value="rgba(121, 122, 128, 0.7)">Gris</option> <option value="rgba(0, 255, 0, 0.8)">Vert</option> <option value="rgba(217, 83, 79, 0.7)">Rouge</option> <option value="rgba(255, 255, 255, 0.7)">Blanc</option>
        <option value="rgba(30, 144, 255, 0.7)">Bleu</option> <option value="rgba(255, 193, 203, 0.7)">Rose</option> <option value="rgba(0, 0, 0, 0.7)">Noir</option>
        <option value="rgba(255, 255, 0, 0.7)">Jaune</option> <option value="rgba(0, 255, 251, 0.7)">Cyan</option> <option value="rgba(244, 102, 27, 0.88)">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
		<div style={{ margin: '18px 28px 0 9px' }}>
      <label htmlFor="buttonTransColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Trans : </label>
      <select id="buttonTransColorSelect" value={this.state.selectedButtonTransColor} onChange={this.handleColorNodeChange('ButtonTransColor')}>
        <option value="grey">Gris</option> <option value="lime">Vert</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="rgba(30, 144, 255, 0.7)">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 2px 0 7px' }}>
      <label htmlFor="buttonTransBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonTransBgColorSelect" value={this.state.selectedButtonTransBgColor}onChange={this.handleColorNodeChange('ButtonTransBgColor')}>
        <option value="lime">Vert</option> <option value="grey">Gris</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor , paddingLeft: '12px' }}>
		<div style={{ margin: '18px 33px 0 2px' }}>
      <label htmlFor="buttonLogsColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Hist. : </label>
      <select id="buttonLogsColorSelect" value={this.state.selectedLogsColor} onChange={this.handleColorNodeChange('LogsColor')}>
        <option value="lime">Vert</option> <option value="grey">Gris</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="rgba(30, 144, 255, 0.7)">Bleu</option> <option value="pink">Rose</option>
        <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 2px' }}>
      <label htmlFor="buttonLogsBgColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Fond : </label>
      <select id="buttonLogsBgColorSelect" value={this.state.selectedLogsBgColor} onChange={this.handleColorNodeChange('LogsBgColor')}>
        <option value="rgba(121, 122, 128, 0.72)">Gris</option> <option value="rgba(0, 255, 0, 0.8)">Vert</option> <option value="rgba(217, 83, 79, 0.72)">Rouge</option> <option value="rgba(255, 255, 255, 0.74)">Blanc</option>
        <option value="rgba(30, 144, 255, 0.72)">Bleu</option> <option value="rgba(255, 193, 203, 0.72)">Rose</option> <option value="rgba(0, 0, 0, 0.7)">Noir</option>
        <option value="rgba(255, 255, 0, 0.72)">Jaune</option> <option value="rgba(0, 255, 251, 0.72)">Cyan</option> <option value="rgba(244, 102, 27, 0.88)">Orange</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor , paddingLeft: '12px' }}>
		<div style={{ margin: '18px 2px 0 0' }}>
      <label htmlFor="buttonHmColorSelect" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>H m : </label>
      <select id="buttonHmColorSelect" value={this.state.selectedButtonHmColor} onChange={this.handleColorNodeChange('ButtonHmColor')}>
        <option value="lime">Vert</option> <option value="grey">Gris</option> <option value="red">Rouge</option> <option value="white">Blanc</option> <option value="dodgerblue">Bleu</option>
        <option value="pink">Rose</option> <option value="black">Noir</option> <option value="yellow">Jaune</option> <option value="cyan">Cyan</option> <option value="orange">Orange</option>
      </select>
    </div>
    <div style={{ margin: '18px 0 0 18px' }}>
      <label htmlFor="fontSelect" style={{ color: this.state.selectedLogsColor }}>Police :</label>
      <select id="fontSelect" value={this.state.selectedFont} onChange={this.handleFontChange} style={{ width: '122px' , marginLeft: '6px' }}>
        <option value="Comic Sans MS, cursive">Comic</option> <option value="Arial, sans-serif">Arial</option> <option value="'Courier New', monospace">Courier New</option> <option value="Georgia, serif">Georgia</option> <option value="'Times New Roman', serif">Times New Roman</option> <option value="Verdana, sans-serif">Verdana</option> <option value="Tahoma, sans-serif">Tahoma</option> <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option> <option value="Impact, sans-serif">Impact</option> <option value="'Lucida Console', monospace">Lucida Console</option>
      </select>
    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
    <div style={{ marginTop: '2px' }}>

      <label htmlFor="" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}> Image </label>

      <div style={{ position: 'relative', display: 'inline-block', top: '14px', marginRight: '20px' }}>

        <div onClick={() => this.setState(prev => ({ showImageGrid: !prev.showImageGrid }))} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', width: '60px', height: '40px' }}> <img src={this.state.selectedImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> </div>

        {this.state.showImageGrid && (
          <div style={{ position: 'absolute', bottom: '48px', left: '-200px', zIndex: 9999, display: 'grid', gridTemplateColumns: 'repeat(6, 60px)', gap: '14.8px', padding: '10px', backgroundColor: 'rgba(106, 107, 108, 0.9)', borderRadius: '8px' }}>

            {Array.from({ length: 30 }, (_, i) => {
              if (i === 29) {
                return (
                  <div className="tooltip-container2">
                    <div key="custom-upload" onClick={() => document.getElementById('customBackgroundInput').click()} style={{ width: '64px', height: '46px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: 'red' }} title="" > + </div>
                    <span className="tooltip2">Ajoutez votre image</span>
                  </div>
                );
              }

              const path = `../static/spotnik${i + 1}.jpg`;
              return (
                <img key={i} src={path} alt={`Fond ${i + 1}`} onClick={() => { this.changeBackground(path); this.setState({ showImageGrid: false }); }} className="zoomImage" style={{ width: '64px', height: '46px', borderRadius: '6px', cursor: 'pointer', objectFit: 'cover', border: this.state.selectedImage === path ? '2px solid red' : '1px solid transparent' }}/>
              );
            })}

          </div>
        )}

      </div>

      <input type="file" id="customBackgroundInput" accept="image/*" style={{ display: 'none' }} onChange={this.handleCustomImageUpload} />

      <label className="coche" style={{ marginRight: '6px', color: this.state.selectedLogsColor }}> Logo : <input type="checkbox" checked={this.state.imageVisible} onChange={() => this.toggleElementVisibility('imageVisible')} /> <span className="checkmark"></span> </label>

      <label htmlFor="" style={{ color: this.state.selectedLogsColor , margin: '0 6px 0 34px' }}>Plein écran : </label>
      <button onClick={this.handleFullScreen} style={{ width: '18px' , marginLeft: '0' , backgroundColor: 'transparent' }} className="effect" > <img src="../static/full.png"/> </button>

    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
    <div style={{ margin: '6px 10px 0 0' }}>
      <label htmlFor="" style={{ color: this.state.selectedLogsColor , marginRight: '6px' }}>Reset : </label>
      <button onClick={this.handleReset} style={{ width: '20px' , marginLeft: '0' , backgroundColor: 'transparent' }} className={`effect ${this.state.isResetClicked ? 'resetClicked' : ''}`} > <img src="../static/reset.png" style={{ width: '14.8px' }} /> </button>

      <label className="coche" style={{ color: this.state.selectedLogsColor , margin: '0 6px 0 16px' }}>Notif : <input type="checkbox" checked={this.state.notificationsEnabled} onChange={this.handleNotificationsToggle} /> <span className="checkmark"></span> </label>

      <label className="coche" style={{ color: this.state.selectedLogsColor , margin: '0 6px 0 36px' }}>Nb Nodes : <input type="checkbox" checked={this.state.nbNodesVisible} onChange={() => this.toggleElementVisibility('nbNodesVisible')} /> <span className="checkmark" style={{ marginLeft: '38px' }}></span> </label>

    </div>
	</div>

	<div style={{ display: 'flex', justifyContent: 'center' , backgroundColor: this.state.selectedLogsBgColor }}>
    <div style={{ margin: '10px 0 0 0' }}>
      <label style={{ color: this.state.selectedLogsColor , margin: '0 6px 0 36px' }}> Contraste : {this.state.contrast}% <input type="range" min="50" max="150" value={this.state.contrast} onChange={this.handleContrastChange} onMouseEnter={e => e.target.style.setProperty('--thumb-color', 'red')} onMouseLeave={e => e.target.style.setProperty('--thumb-color', 'lime')} /> </label>
    </div>
    <div style={{ margin: '10px 0 0 0' }}>
      <label style={{ color: this.state.selectedLogsColor , margin: '0 6px 0 36px' }}> Luminosité : {this.state.brightness}% <input type="range" min="50" max="150" value={this.state.brightness} onChange={this.handleBrightnessChange} onMouseEnter={e => e.target.style.setProperty('--thumb-color', 'red')} onMouseLeave={e => e.target.style.setProperty('--thumb-color', 'lime')} /> </label>
    </div>
  </div>

	<div style={{ display: 'flex', justifyContent: 'center' , borderBottomLeftRadius: '16px' , borderBottomRightRadius: '16px' , backgroundColor: this.state.selectedLogsBgColor , paddingBottom: '8px' }}>
    <div style={{ marginTop: '6px' }}>
      <label className="coche" style={{ margin: '6px 12px 0 0' , color: 'white' }}> ❄️ <input type="checkbox" checked={this.state.floconVisible} onChange={() => this.toggleElementVisibility('floconVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px' , color: 'white' }}> 🍁 <input type="checkbox" checked={this.state.feuilleVisible} onChange={() => this.toggleElementVisibility('feuilleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px' , color: 'white' }}> 💧 <input type="checkbox" checked={this.state.pluieVisible} onChange={() => this.toggleElementVisibility('pluieVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px' , color: 'white' }}> 🫧 <input type="checkbox" checked={this.state.bulleVisible} onChange={() => this.toggleElementVisibility('bulleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>

      <label className="coche" style={{ margin: '6px 12px 0 34px' , color: 'white' }}> 🔘 <input type="checkbox" checked={this.state.particuleVisible} onChange={() => this.toggleElementVisibility('particuleVisible')} /> <span className="checkmark" style={{ left: '32px' }}></span> </label>
    </div>
	</div>

  </motion.div>
  )}
</AnimatePresence>

	<div id="customModal"></div>

  {this.state.showNotification && ( <div className={`notification ${this.state.notificationFadeOut ? 'fade-out' : ''}`}> {this.state.notificationMessage} </div> )}

  {this.state.showNodeLeftNotification && ( <div className={`notification ${this.state.nodeLeftNotificationFadeOut ? 'fade-out' : ''}`}> {this.state.nodeLeftNotificationMessage} </div> )}

	<div style={{ color: 'white' , fontSize: '11.4pt' , top: '14%' , right: '119px' , position: 'absolute' , marginTop: '42px' , textAlign: 'center' }}> <span style={{ color: 'white' , backgroundColor: formattedTransmitter ? 'rgba(121, 122, 128, 0.7)' : 'transparent' , padding: '6px' , borderRadius: '8px' }}> {formattedTransmitter} </span> <Chrono transmitter={this.state.transmitter} /> </div>

<AnimatePresence>
  {this.state.logsVisible && (
    <motion.div ref={this.logsDivRef} initial={{ opacity: 0 }} animate={{ opacity: 1, x: this.state.currentOffsetX, y: this.state.currentOffsetY, }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '480px', float: 'left', cursor: 'default', position: 'absolute', left: `${this.state.logsDivX}vw`, top: `${this.state.logsDivY}vh`, letterSpacing: '1.4px', zIndex: 1000 }}>
      <div className="tab" style={{ marginLeft: '67px' }}>
        <button className={this.state.activeTab1 === 'logs' ? 'active' : ''} onClick={() => this.toggleTab('logs',1)} style={{ width: '76px' }}>Hist.</button>
        <button className={this.state.activeTab1 === 'other' ? 'active' : ''} onClick={() => this.toggleTab('other',1)} style={{ width: '76px' }}>Détails</button>
        <button className={this.state.activeTab1 === 'other2' ? 'active' : ''} onClick={() => this.toggleTab('other2',1)} style={{ width: '76px' }}>Ent / Sor</button>
        <button onClick={() => this.toggleElementVisibility('logs2Visible')} style={{ width: '34px' }} > + </button>
        <button onClick={() => this.toggleElementVisibility('logsVisible')} style={{ width: '34px' }} > - </button>
      </div>
      <div>
        {this.state.activeTab1 === 'logs' && (
          <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs}</pre> </div>
        )}
        {this.state.activeTab1 === 'other' && (
          <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs2}</pre> </div>
        )}
        {this.state.activeTab1 === 'other2' && (
          <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs3}</pre> </div>
        )}
        {this.state.activeTab1 === 'other3' && (
          <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}> + </pre> </div>
        )}
      </div>

      <div onMouseDown={this.handleMouseDown} style={{ position: 'absolute', bottom: '6px', right: '52px', cursor: 'grab', backgroundColor: 'transparent', border: 'none', padding: '0' }} > <img src="../static/drag.png" style={{ width: '16.8px', height: '16.8px' }}/> </div>

    </motion.div>
  )}
</AnimatePresence>

  <AnimatePresence>
		{this.state.logs3Visible && (

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '414px' , float: 'right' , cursor: 'default' , letterSpacing: '1.4px' , position: 'absolute' , right: '0.2vw' , top: '53.1vh' }}>
        <div className="tab">
          <button className={this.state.activeTab3 === 'other8' ? 'active' : ''} onClick={() => this.toggleTab('other8',3)} style={{ width: '76px' }}>Hist.</button>
          <button className={this.state.activeTab3 === 'other9' ? 'active' : ''} onClick={() => this.toggleTab('other9',3)} style={{ width: '76px' }}>Détails</button>
          <button className={this.state.activeTab3 === 'other10' ? 'active' : ''} onClick={() => this.toggleTab('other10',3)} style={{ width: '76px' }}>Ent / Sor</button>
          <button onClick={() => this.toggleElementVisibility('logs3Visible')} style={{ width: '76px' }} > - </button>
        </div>
        <div>
          {this.state.activeTab3 === 'other8' && (
            <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs}</pre> </div>
          )}
          {this.state.activeTab3 === 'other9' && (
            <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs2}</pre> </div>
          )}
          {this.state.activeTab3 === 'other10' && (
            <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs3}</pre> </div>
          )}
          {this.state.activeTab3 === 'other11' && (
            <div className="onglet1"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}> - </pre> </div>
          )}
        </div>
      </motion.div>
		)}
  </AnimatePresence>

  <AnimatePresence>
		{this.state.logs2Visible && (

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '374px' , top: '53.2vh' , position: 'absolute' , left: '50%' , transform: 'translateX(-50%)' , letterSpacing: '1.4px' , zIndex: 888 }}>
        <div className="tab" style={{ marginLeft: '18px' }}>
          <button className={this.state.activeTab2 === 'other4' ? 'active' : ''} onClick={() => this.toggleTab('other4',2)} style={{ width: '76px' }}>Hist.</button>
          <button className={this.state.activeTab2 === 'other5' ? 'active' : ''} onClick={() => this.toggleTab('other5',2)} style={{ width: '76px' }}>Détails</button>
          <button className={this.state.activeTab2 === 'other6' ? 'active' : ''} onClick={() => this.toggleTab('other6',2)} style={{ width: '76px' }}>Ent / Sor</button>
          <button onClick={() => this.toggleElementVisibility('logs3Visible')} style={{ width: '34px' }} > + </button>
          <button onClick={() => this.toggleElementVisibility('logs2Visible')} style={{ width: '34px' }} > - </button>
        </div>
        <div>
          {this.state.activeTab2 === 'other4' && (
            <div className="onglet2"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs}</pre> </div>
          )}
          {this.state.activeTab2 === 'other5' && (
            <div className="onglet2"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs2}</pre> </div>
          )}
          {this.state.activeTab2 === 'other6' && (
            <div className="onglet2"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}>{this.state.logs3}</pre> </div>
          )}
          {this.state.activeTab2 === 'other7' && (
            <div className="onglet2"> <pre style={{ fontFamily: this.state.selectedFont , color: this.state.selectedLogsColor , lineHeight: '1.1' }}> - </pre> </div>
          )}
        </div>
      </motion.div>
		)}
  </AnimatePresence>

  <AnimatePresence>
	  {this.state.imageVisible && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.3 } }} style={{ width: '284px' , margin: '68px auto' }}> <a target="_blank" href="https://www.websdrbordeaux.fr"> <img src="../static/logo-rond.png" className="image wiggle-in" /> </a> </motion.div> )}
  </AnimatePresence>

	<style jsx>{`

	::selection { color: red; }

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

	.tri { margin-left: 50px; }

	.brdr { border: none; }

	.bgrd { background-color: rgb(206, 206, 206, 0.90); }

	button { display: inline-block; width: 204px; padding: 4px; border-radius: 8.8px; margin: 4px 5px; text-align: center; background-color: ${this.state.selectedButtonBgColor}; color: ${this.state.selectedButtonColor}; font-size: 0.95em; font-family: ${this.state.selectedFont}; }

	ol { padding: 2.8% 0% 2.48%; text-align: center; max-width: 1768px; margin: 70px auto 0; }

	ol img { float: right; }

	.transmitting { font-weight: bold; color: ${this.state.selectedButtonTransColor}; background-color: ${this.state.selectedButtonTransBgColor}; }

	.transmitter { position: absolute; right: 104px; top: 10%; width: 220px; background-color: rgba(121, 122, 128, 0.72); }

	.stopTime { margin-left: 24px; font-size: 14.8px; color: lime; font-weight: bold; }

  .pulse { animation: pulsing 4.6s ease-in-out infinite; }

  @keyframes pulsing { 0% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } 50% { box-shadow: 0 0 8.8px 4px rgba(255, 255, 255, 0.52); transform: scale(1.02); } 100% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); } }

	#customModal { display: none; position: fixed; top: 12%; left: 50%; transform: translateX(-50%); padding: 8px; background-color: ${this.state.selectedButtonBgColor}; box-shadow: white 0 0 60px; z-index: 9999; width: 288px; min-height: 28px; border-radius: 16px; text-align: center; color: ${this.state.selectedButtonColor}; cursor: default; }

  .tooltip-container, .tooltip-container2 { position: relative; display: inline-block; }

  .tooltip, .tooltip2 { visibility: hidden; background-color: white; color: red; text-align: center; border-radius: 5px; padding: 0 4px; position: absolute; transform: translateX(-50%); white-space: nowrap; z-index: 1; opacity: 0; transition: opacity 0.4s ease, visibility 0.4s ease; will-change: opacity, transform; font-family: ${this.state.selectedFont}; }

  .tooltip { bottom: -82%; left: 100%; }

  .tooltip2 { margin: 3px 0 0 32px; }

  .tooltip-container:hover .tooltip, .tooltip-container2:hover .tooltip2 { visibility: visible; opacity: 1; }

	.tooltip-container button { transition: transform 0.2s ease; }

  .tooltip-container button:hover { transform: scale(1.06); }

  .ripple, .ripple2 { position: relative; overflow: hidden; transform: translate3d(0, 0, 0); }

  .ripple:after { content: ""; display: block; position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none; background-image: radial-gradient(circle, #fff 12%, transparent 12.01%); background-repeat: no-repeat; background-position: 50%; transform: scale(10, 10); opacity: 0; transition: transform 0.6s, opacity 0.6s; }

  .ripple2:after { content: ""; display: block; position: absolute; width: 62%; height: 62%; top: 6px; left: 8px; pointer-events: none; background-image: radial-gradient(circle, #fff 12%, transparent 12.01%); background-repeat: no-repeat; background-position: 50%; transform: scale(10, 10); opacity: 0; transition: transform 0.6s, opacity 0.6s; }

  .ripple:active:after, .ripple2:active:after { transform: scale(0, 0); opacity: 0.4; transition: 0s; }

  .no-hover-parent:hover::before { content: none !important; }

  button > button:hover::before { content: none !important; }

  .no-hover:hover::before { content: none !important; }

	@keyframes fadeIn { to { opacity: 1; } }

	.chrono-progress-container { display: none; position: absolute; top: 18%; right: 110px; color: rgba(255,255,255,0.84); font-size: 14.8px; width: 220px; border-radius: 5px; padding-left: 16px; height: 28px; border-top-style: solid; border-top-width: 4px; border-color: rgba(121,122,128,0); }

	.progress-container { float: right; right: -42px; width: 128px; height: 4.8px; background-color: rgba(255,255,255,0.84); border-radius: 8px; margin-right: 16px; margin-top: 8.6px; overflow: hidden; }

	.progress-bar { height: 100%; background-color: lime; border-radius: 8px; }

  .progress-bar { height: 100%; }

	.green .progress-bar { background-color: lime; }

	.orange .progress-bar { background-color: orange; }

	.red .progress-bar { background-color: #d9534f; }

 	.visible { display: block; }

 	@keyframes flash { from, to { opacity: 1; } 50% { opacity: 0; } }

	.flash-progress .progress-bar { animation: flash 0.8s infinite; }

	.lime {color: lime; }

	.grey {color: grey; }

	.red { color: #d9534f; }

	.dodgerblue { color: rgb(30, 144, 255); }

	.white { color: white; }

	.pink {color: pink; }

	.black {color: black; }

	.yellow {color: rgba(255, 255, 0, 0.7); }

	.cyan {color: rgba(0, 255, 251, 0.7); }

	.orange {color: rgba(244, 102, 27, 0.88); }

	.bg-grey { background-color: rgba(121,122,128,0.7); }

	.bg-lime { background-color: rgba(0, 255, 0, 0.8); }

	.bg-red { background-color: rgba(217, 83, 79, 0.7); }

	.bg-dodgerblue { background-color: rgba(30, 144, 255, 0.7); }

	.bg-white { background-color: rgba(255, 255, 255, 0.72); }

	.bg-pink { background-color: rgba(255, 193, 203, 0.7); }

	.bg-black { background-color: rgba(0, 0, 0, 0.7); }

	.bg-yellow { background-color: rgba(255, 255, 0, 0.7); }

	.bg-cyan { background-color: rgba(0, 255, 251, 0.7); }

	.bg-orange { background-color: rgba(244, 102, 27, 0.88); }

  .resetClicked { animation: rotate 0.3s ease-in-out; transform-origin: center center; }

  .effect { transition: transform 0.2s ease-in-out; background-color: transparent; border: none; cursor: pointer; padding: 0; }

  .effect:hover { transform: scale(1.16); }

  @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  input[type=range] { -webkit-appearance: none; width: 88%; height: 4px; border-radius: 6px; background-color: white; outline: none; cursor: pointer; margin-top: 4.8px; }

  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background-color: var(--thumb-color, lime); cursor: pointer; transition: background-color 0.4s ease; margin-top: 0; border: none; }

  input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background-color: var(--thumb-color, lime); cursor: pointer; transition: background-color 0.4s ease; border: none; }

	.zoomImage { transition: transform 0.2s ease-in-out;}

  .zoomImage:hover { transform: scale(1.62); z-index: 10000; }

	.fermer { position: relative; right: -343px; background-color: transparent; border-radius: 8px; color: red; width: 18px; height: 20px; padding: 0; transition: background-color 0.2s; }

	.fermer:hover { background-color: white; }

	.tab button { background-color: ${this.state.selectedLogsBgColor}; border: none; cursor: pointer; color: ${this.state.selectedLogsColor}; }

  .tab button.active { background-color: ${this.state.selectedLogsColor}; color: ${this.state.selectedLogsBgColor}; }

  .tab button:hover { color: red; background-color: white; }

  .onglet1 { float: right; border-radius: 16px; background-color: ${this.state.selectedLogsBgColor}; padding: 18px; margin: 6px 50px 0 0; width: 375px; height: 380px; overflow: auto; scrollbar-width: none; }

  .onglet2 { border-radius: 16px; background-color: ${this.state.selectedLogsBgColor}; padding: 18px; margin-top: 6px; width: 375px; height: 380px; overflow: auto; scrollbar-width: none; }

  *:focus { outline: none; }

	.bouton2 { background-color: transparent; margin-right: 5px; padding: 0; display: inline-flex; }

  .notification { position: fixed; top: 12%; left: 50%; transform: translateX(-50%); background-color: ${this.state.selectedButtonBgColor}; color: ${this.state.selectedButtonColor}; padding: 12px 20px; border-radius: 16px; box-shadow: white 0 0 60px; z-index: 1; font-family: ${this.state.selectedFont}; }

  .fade-out { animation: fadeOut 1.8s forwards; }

  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

  .wiggle-in { animation: wiggleIn 1s ease-in-out forwards; animation-delay: 0.28s; opacity: 0; height: 284px; margin: 0; }

  @keyframes wiggleIn { 0% { transform: translateX(0) rotate(0); opacity: 0; } 10% { transform: translateX(-3px) rotate(-2deg); opacity: 0.2; } 20% { transform: translateX(3px) rotate(2deg); opacity: 0.4; } 30% { transform: translateX(-3px) rotate(-1.5deg); } 40% { transform: translateX(3px) rotate(1.5deg); } 50% { transform: translateX(-2px) rotate(-1deg); } 60% { transform: translateX(2px) rotate(1deg); } 70% { transform: translateX(-1px) rotate(-0.5deg); } 80% { transform: translateX(1px) rotate(0.5deg); } 90% { transform: translateX(0) rotate(0); } 100% { opacity: 0.78; } }

  .no-select { user-select: none; -webkit-user-select: none; -moz-user-select: none; }

  `}</style>

    </Layout>
	  )
	}
}
export default Component