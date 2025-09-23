import React from 'react'
import formatcoords from 'formatcoords'
import Layout from '../components/Layout'
import fetch from '../lib/fetch'
import notie from '../lib/notie'

class Component extends React.Component {
	constructor() {
		super()

    this.state = { isRadioAmateur: false, activeTab: '1', availableWifiNetworks: [], isScanningWifi: false, wifiScanError: null, showWifiPopup: false, id_long: '60', id_short: '15', }

		this.handleChange = this.handleChange.bind(this)
		this.handleSubmit = this.handleSubmit.bind(this)
		this.handleLocationChange = this.handleLocationChange.bind(this)
		this.handleGetLocation = this.handleGetLocation.bind(this)
		this.handleScanWifi = this.handleScanWifi.bind(this)
		this.toggleWifiHelpPopup = this.toggleWifiHelpPopup.bind(this)
	}

	componentWillMount() {
		this.setState(this.props.config)
	}

	static getInitialProps() {
		return fetch('/api/configuration').then(res => res.json()).then(config => {
			return { config }
		})
	}

	handleGetLocation() {
		notie.info('Looking for location')
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				notie.info('Location acquired')
				const [latitude, longitude] = formatcoords(coords.latitude, coords.longitude)
					.format('D.M.sX', { decimalPlaces: 0 })
					.split(' ')
				this.setState({ location_latitude: latitude, location_longitude: longitude })
			},
			err => notie.error(err),
			{ enableHighAccuracy: true }
		)
	}

	handleLocationChange({ target }) {
		this.setState({ location_enabled: target.checked })
	}

	handleChange({ target }) {
    const { name, value, id } = target;

    let formattedValue = value.trim();

    if (id === "majuscule") {
      formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1).toLowerCase();
    } else if (name === "callsign" || name === "callsign2" || name === "callsign3" || name === "callsign4" || name === "callsign5") {
      formattedValue = formattedValue.toUpperCase();
    }

    this.setState({ [name]: formattedValue });
	}

	handleSubmit(event) {
  	event.preventDefault();
 		const headers = new Headers();
  	headers.append('Content-Type', 'application/json');
    const { activeTab, availableWifiNetworks, isScanningWifi, wifiScanError, showWifiPopup, ...savedState } = this.state;
  	fetch('/api/configuration', { method: 'POST', headers, body: JSON.stringify(savedState) })
    	.then(() => notie.success('Enregistré !! Re-démarrage de Pmr 446 MHz ..'))
    	.catch(() => { });
	}

  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

	handleCheckboxChange = () => {
  	this.setState(prevState => ({
    	isRadioAmateur: !prevState.isRadioAmateur
  	}));
	};

  handleScanWifi = async () => {
    this.setState({ isScanningWifi: true, wifiScanError: null, availableWifiNetworks: [] });
    try {
      const response = await fetch('/api/wifi/scan');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur serveur : ${response.status}`);
      }
      const networks = await response.json();
      this.setState({ availableWifiNetworks: networks });
      notie.success('Scan Wifi terminé !!');
    } catch (error) {
      console.error('Erreur scan Wifi :', error);
      this.setState({ wifiScanError: error.message || 'Scan Wifi impossible' });
      notie.error('Échec scan Wifi');
    } finally {
      this.setState({ isScanningWifi: false });
    }
  };

  toggleWifiHelpPopup() {
		this.setState(prevState => ({
			showWifiPopup: !prevState.showWifiPopup
		}));
	};

	render() {
		const value = prop => this.state[prop]
		const band_typ = { ' -': ' -', 'H': 'H', 'U': 'U', 'V': 'V', 'T': 'T', 'R': 'R', 'S': 'S' }
		this.lSA818 = 'Non'

		const ctcssFrequencies = [
			'Pas de Ctcss','67', '71.9', '74.4', '77', '79.7', '82.5', '85.4', '88.5', '91.5',
			'94.8', '97.4', '100', '103.5', '107.2', '110.9', '114.8', '118.8', '123',
			'127.3', '131.8', '136.5', '141.3', '146.2', '151.4', '156.7', '162.2', '167.9',
			'173.8', '179.9', '186.2', '192.8', '203.5', '210.7', '218.1', '225.7', '233.6',
			'241.8'
		]

		const dcsFrequencies = [
			"0000", "023I", "025I", "026I", "031I", "032I", "043I", "047I", "051I", "065I",
			"071I", "072I", "073I", "074I", "114I", "115I", "116I", "125I", "131I",
			"132I", "134I", "143I", "152I", "155I", "156I", "162I", "172I", "174I",
			"205I", "223I", "226I", "243I", "244I", "245I", "251I", "261I", "263I",
			"265I", "271I", "306I", "311I", "315I", "331I", "343I", "346I", "351I",
			"364I", "365I", "371I", "411I", "412I", "413I", "423I", "431I", "432I",
			"445I", "464I", "465I", "466I", "503I", "506I", "516I", "532I", "546I",
			"565I", "606I", "612I", "624I", "627I", "631I", "632I", "654I", "662I",
			"664I", "703I", "712I", "723I", "731I", "732I", "734I", "743I", "754I",
			"023N", "025N", "026N", "031N", "032N", "043N", "047N", "051N", "065N",
			"071N", "072N", "073N", "074N", "114N", "115N", "116N", "125N", "131N",
			"132N", "134N", "143N", "152N", "155N", "156N", "162N", "172N", "174N",
			"205N", "223N", "226N", "243N", "244N", "245N", "251N", "261N", "263N",
			"265N", "271N", "306N", "311N", "315N", "331N", "343N", "346N", "351N",
			"364N", "365N", "371N", "411N", "412N", "413N", "423N", "431N", "432N",
			"445N", "464N", "465N", "466N", "503N", "506N", "516N", "532N", "546N",
			"565N", "606N", "612N", "624N", "627N", "631N", "632N", "654N", "662N",
			"664N", "703N", "712N", "723N", "731N", "732N", "734N", "743N", "754N"
		]

		const sql_lvl = ['0', '1', '2', '3', '4', '5', '6', '7', '8']
		const lSA818 = ['Non', 'Oui']
    const tabs = [ { key: '1', label: ' 2 ' }, { key: '2', label: ' 3 ' }, { key: '3', label: ' 4 ' }, ];

		return (

			<Layout>

				<form onSubmit={this.handleSubmit}>
					<div className="grid-container">

						<fieldset className="form-group grid-item">
							<div className="titre">Général</div>
							<div className="subtitle"> </div>

							<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' }}>

								<div className="subtitle" style={{ top: '2px' , marginBottom: '12px' , paddingTop: '4px' , color: '#d9534f' , fontSize: '16px' }}>WebSdr Bordeaux</div>

								<div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , backgroundColor: 'transparent' }}>
									<label htmlFor="callsign"> <span style={{ marginRight: '41px' , marginLeft: '30px' }}>Pseudo</span> <span style={{ marginRight: '7px' }}>Département</span> <span style={{ marginRight: '42px' }}>Type</span> <span style={{ marginLeft: '5px' }}>Mot de Pass</span> </label>
								</div>

								<div className="form-group" style={{ display: 'inline-block' , width: '144px' , marginRight: '16px' }}>
									<input required placeholder="----" id="call1" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' , textTransform: 'uppercase' }} name="callsign" value={value('callsign')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '48px' , marginRight: '16px' }}>
									<input required placeholder="--" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="departement" value={value('departement')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '62px' , marginRight: '16px' }}>
									<select required name="band_type" className="form-control" style={{ height: '24px' }} value={value('band_type')} onChange={this.handleChange}>
										{Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
									</select>
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '116px' }}>
                	<input placeholder="----" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="passres1" value={value('passres1')} onChange={this.handleChange} />
              	</div>
								<div className="form-group d-none">
									<select name="default_lang" className="form-control" value={value('default_lang')} onChange={this.handleChange}>
										<option value="en_US">Anglais</option> <option value="fr_FR">Français</option>
									</select>
								</div>

							</div>

					<div className="form-group" style={{ marginTop: '28px' , backgroundColor: ' transparent' , display: 'flex', gap: '14px', justifyContent: 'center', }}>
  					{tabs.map(tab => ( <button key={tab.key} type="button" onClick={() => this.handleTabChange(tab.key)} style={{ padding: '0 6px', border: 'none', color: this.state.activeTab === tab.key ? 'red' : 'black', transform: this.state.activeTab === tab.key ? 'scale(1.2)' : 'scale(1)', backgroundColor: 'rgba(212,212,212,0.62)', borderRadius: '8px', cursor: 'pointer', }}> {tab.label} </button> ))}
					</div>

					<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' }}>

  					{this.state.activeTab === '1' && (

							<div>

								<div className="form-group" style={{ marginTop: '8px' , top: '2px' , marginBottom: '14px' , paddingTop: '8px' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<input placeholder="------" id="majuscule" type="text" className="form-control placeholder" style={{ textAlign: 'center' , padding: '.1rem .75rem' , width: '146px' , margin: 'auto' }} name="res2" value={value('res2')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , backgroundColor: 'transparent' }}>
									<label htmlFor="host2"> <span style={{ marginRight: '126px' , marginLeft: '73px' , marginTop: '12px' }}>Adresse</span> <span style={{ marginRight: '7px' }}>Port</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '246px' , marginRight: '16px' }}>
									<input placeholder="----------" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="host2" value={value('host2')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '60px' , marginRight: '16px' }}>
									<input placeholder="  ----" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="port2" value={value('port2')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , marginTop: '12px', backgroundColor: 'transparent' }}>
									<label htmlFor="callsign2"> <span style={{ marginRight: '41px' , marginLeft: '30px' }}>Pseudo</span> <span style={{ marginRight: '7px' }}>Département</span> <span style={{ marginRight: '42px' }}>Type</span> <span style={{ marginLeft: '5px' }}>Mot de Pass</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '144px' , marginRight: '16px' }}>
									<input placeholder="----" id="call2" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' , textTransform: 'uppercase' }} name="callsign2" value={value('callsign2')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '48px' , marginRight: '16px' }}>
									<input placeholder="  --" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="departement2" value={value('departement2')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '62px' , marginRight: '16px' }}>
									<select name="band_type2" className="form-control" style={{ textAlign: 'center' , height: '23px' }} value={value('band_type2')} onChange={this.handleChange}>
									{Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
									</select>
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '116px' }}>
                	<input placeholder="----" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="passres2" value={value('passres2')} onChange={this.handleChange} />
              	</div>

							</div>

						)}

  					{this.state.activeTab === '2' && (

							<div>

								<div className="form-group" style={{ marginTop: '8px' , top: '2px' , marginBottom: '14px' , paddingTop: '8px' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<input placeholder="------" id="majuscule" type="text" className="form-control placeholder" style={{ textAlign: 'center' , padding: '.1rem .75rem' , width: '146px' , margin: 'auto' }} name="res3" value={value('res3')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , backgroundColor: 'transparent' }}>
									<label htmlFor="host3"> <span style={{ marginRight: '126px' , marginLeft: '73px' , marginTop: '12px' }}>Adresse</span> <span style={{ marginRight: '7px' }}>Port</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '246px' , marginRight: '16px' }}>
									<input placeholder="----------" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="host3" value={value('host3')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '60px' , marginRight: '16px' }}>
									<input placeholder="  ----" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="port3" value={value('port3')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , marginTop: '12px', backgroundColor: 'transparent' }}>
									<label htmlFor="callsign3"> <span style={{ marginRight: '41px' , marginLeft: '30px' }}>Pseudo</span> <span style={{ marginRight: '7px' }}>Département</span> <span style={{ marginRight: '42px' }}>Type</span> <span style={{ marginLeft: '5px' }}>Mot de Pass</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '144px' , marginRight: '16px' }}>
									<input placeholder="----" id="call3" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' , textTransform: 'uppercase' }} name="callsign3" value={value('callsign3')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '48px' , marginRight: '16px' }}>
									<input placeholder="  --" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="departement3" value={value('departement3')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '62px' , marginRight: '16px' }}>
									<select name="band_type3" className="form-control" style={{ textAlign: 'center' , height: '23px' }} value={value('band_type3')} onChange={this.handleChange}>
									{Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
									</select>
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '116px' }}>
                	<input placeholder="----" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="passres3" value={value('passres3')} onChange={this.handleChange} />
              	</div>

							</div>

						)}

  					{this.state.activeTab === '3' && (

							<div>

								<div className="form-group" style={{ marginTop: '8px' , top: '2px' , marginBottom: '14px' , paddingTop: '8px' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<input placeholder="------" id="majuscule" type="text" className="form-control placeholder" style={{ textAlign: 'center' , padding: '.1rem .75rem' , width: '146px' , margin: 'auto' }} name="res4" value={value('res4')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , backgroundColor: 'transparent' }}>
									<label htmlFor="host4"> <span style={{ marginRight: '126px' , marginLeft: '73px' , marginTop: '12px' }}>Adresse</span> <span style={{ marginRight: '7px' }}>Port</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '246px' , marginRight: '16px' }}>
									<input placeholder="----------" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="host4" value={value('host4')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '60px' , marginRight: '16px' }}>
									<input placeholder="  ----" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="port4" value={value('port4')} onChange={this.handleChange} />
								</div>

							  <div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '14px' , marginTop: '12px', backgroundColor: 'transparent' }}>
									<label htmlFor="callsign4"> <span style={{ marginRight: '41px' , marginLeft: '30px' }}>Pseudo</span> <span style={{ marginRight: '7px' }}>Département</span> <span style={{ marginRight: '42px' }}>Type</span> <span style={{ marginLeft: '5px' }}>Mot de Pass</span> </label>
							  </div>

								<div className="form-group" style={{ display: 'inline-block' , width: '144px' , marginRight: '16px' }}>
									<input placeholder="----" id="call4" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' , textTransform: 'uppercase' }} name="callsign4" value={value('callsign4')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '48px' , marginRight: '16px' }}>
									<input placeholder="  --" type="text" className="form-control" style={{ padding: '.1rem .75rem' }} name="departement4" value={value('departement4')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '62px' , marginRight: '16px' }}>
									<select name="band_type4" className="form-control" style={{ textAlign: 'center' , height: '23px' }} value={value('band_type4')} onChange={this.handleChange}>
									{Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
									</select>
								</div>
								<div className="form-group" style={{ display: 'inline-block' , width: '116px' }}>
                	<input placeholder="----" type="text" className="form-control" style={{ textAlign: 'center' , padding: '.1rem .75rem' }} name="passres4" value={value('passres4')} onChange={this.handleChange} />
              	</div>

							</div>

						)}

					</div>

							<div className="form-group" style={{ marginTop: '28px' , backgroundColor: 'transparent' , borderRadius: '10px 10px 0 0' }}>
								<label htmlFor="radioAmateurCheck" style={{ marginLeft: '10px' , cursor: 'pointer' }}> Licencié et autorisé à utiliser la section çi dessous </label>
								<input type="checkbox" id="radioAmateurCheck" checked={this.state.isRadioAmateur} onChange={this.handleCheckboxChange} style={{ cursor: 'pointer' , marginLeft: '30px' , marginRight: '12px'}}/>
							</div>

  						<div style={{ backgroundColor: 'rgba(212,212,212,0.62)', borderRadius: '0 0 10px 10px', opacity: this.state.isRadioAmateur ? 1 : 0.2, pointerEvents: this.state.isRadioAmateur ? 'auto' : 'none', transition: 'opacity 0.3s ease-in-out' }}>

								<div className="subtitle" style={{ marginTop: '0px', top: '2px', marginBottom: '12px', paddingTop: '4px', color: '#d9534f', fontSize: '16px' }}> Rff / Ri49 </div>

								<div className="form-group" style={{ width: '270px', margin: '0 auto' , fontSize: '14px' , backgroundColor: 'transparent' }}>
      					<label htmlFor="callsign5"> <span style={{ marginRight: '38px', marginLeft: '33px' }}>Indicatif</span> <span style={{ marginRight: '7px' }}>Département</span> <span style={{ marginRight: '16px' }}>Type</span> </label>
  						  </div>

								<div className="form-group" style={{ display: 'inline-block', width: '144px', marginRight: '16px' }}>
									<input placeholder="----" type="text" className="form-control" style={{ textAlign: 'center', padding: '.1rem .75rem' }} name="callsign5" value={value('callsign5')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block', width: '48px', marginRight: '16px' }}>
									<input placeholder="--" type="text" className="form-control" style={{ textAlign: 'center', padding: '.1rem .75rem' }} name="departement5" value={value('departement5')} onChange={this.handleChange} />
								</div>
								<div className="form-group" style={{ display: 'inline-block', width: '62px', marginRight: '16px' }}>
									<select name="band_type5" className="form-control" style={{ height: '23px' }} value={value('band_type5')} onChange={this.handleChange}>
									{Object.entries(band_typ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
									</select>
								</div>

					    </div>

						</fieldset>

						<fieldset className="form-group grid-item">
							<div className="titre">Squelch</div>
							<div className="form-group" style={{ borderRadius: '10px' }}>
								<label htmlFor="sql_det">Méthode de détection</label>
								<select required name="sql_det" className="form-control" value={value('sql_det')} onChange={this.handleChange}>
									<option value="GPIO">GPIO</option> <option value="CTCSS">CTCSS</option>
									<option value="VOX">VOX</option> <option value="SIGLEV">SIGLEV</option>
								</select>
							</div>
							<br /> <br />
							<div className="titre">Ctcss</div>
							<small>( Hotspot avec SA818 <strong style={{ color: '#d9534f' }}>=</strong> CTCSS <strong style={{ color: '#d9534f' }}>en dessous de 100Hz</strong> )</small>
							<br /><br />
							<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' , paddingBottom: '10px' }}>
								<div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<label htmlFor="ctcss_fq"> <span style={{ marginRight: '237px' }}>Rx</span> <span style={{ marginRight: '8px' }}>Tx</span> </label>
								</div>
								<div style={{ display: 'inline-block' , marginRight: '68px' }}>
									<select required name="ctcss_fq" className="form-control"  style={{ width: '188px' }} value={value('ctcss_fq')} onChange={this.handleChange}>
										{ctcssFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
									</select>
								</div>
								<div style={{ display: 'inline-block' }}>
									<select required name="ctcss_fqt" className="form-control" style={{ width: '188px' }} value={value('ctcss_fqt')} onChange={this.handleChange}>
										{ctcssFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
									</select>
								</div>
							</div>
							<br /> <br />
							<div className="titre">Dcs</div>
							<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' , paddingBottom: '10px' }}>
								<div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<label htmlFor="dcs_fq"> <span style={{ marginRight: '237px' }}>Rx</span> <span style={{ marginRight: '8px' }}>Tx</span> </label>
								</div>
								<div style={{ display: 'inline-block' , marginRight: '68px' }}>
									<select required name="dcs_fq" className="form-control" style={{ width: '188px' }} value={value('dcs_fq')} onChange={this.handleChange}>
									  {dcsFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
									</select>
								</div>
								<div style={{ display: 'inline-block' }}>
									<select required name="dcs_fqt" className="form-control" style={{ width: '188px' }} value={value('dcs_fqt')} onChange={this.handleChange}>
										{dcsFrequencies.map(freq => <option key={freq} value={freq}>{freq}</option>)}
									</select>
								</div>
							</div>
						</fieldset>

						<fieldset className="form-group grid-item">
							<div className="titre">Information météo</div>
							<div className="form-group" style={{ borderRadius: '10px' }}>
								<label htmlFor="airport_code">Code ICAO aéroports</label>
								<input placeholder="LFBD" type="text" className="form-control" name="airport_code" value={value('airport_code')} onChange={this.handleChange} />
							</div>
							<p>Voir <a href="http://fr.allmetsat.com/metar-taf/france.php" target="_blank">codes aéroports</a></p>
							<br />
							<div className="titre">Annonce</div>
							<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' , paddingBottom: '10px' }}>
								<div className="form-group" style={{ width: '418px' , margin: '0 auto' , fontSize: '16px' , backgroundColor: 'transparent' }}>
									<label htmlFor=" "> <span style={{ marginRight: '66px' }}>Longue</span> <span style={{ marginRight: '8px' }}>Courte</span> </label>
								</div>
								<div style={{ display: 'inline-block' , marginRight: '68px' }}>
									<select required name="id_long" className="form-control" value={value('id_long')} onChange={this.handleChange}>
										<option value="0">0</option> <option value="15">15</option> <option value="30">30</option> <option value="45">45</option> <option value="60">60</option> <option value="75">75</option> <option value="90">90</option>
									</select>
								</div>
								<div style={{ display: 'inline-block' }}>
									<select required name="id_short" className="form-control" value={value('id_short')} onChange={this.handleChange}>
										<option value="0">0</option> <option value="15">15</option> <option value="30">30</option> <option value="45">45</option> <option value="60">60</option> <option value="75">75</option> <option value="90">90</option>
									</select>
								</div>
							</div>
							<br />
							<div className="titre">Aprs</div>
							<div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' , padding: '10px 0 8px 0' }}>
								<span style={{ margin: '0 28px 0 70px' }}><input className="form-check-input" type="checkbox" onChange={this.handleLocationChange} checked={value('location_enabled') ? 'checked' : ''} /> Activation </span>
								<span style={{ marginRight: '8px' }}>Type node</span>
								<div style={{ display: 'inline-block' }}>
									<select name="type" className="form-control" style={{ width: '188px' }} value={value('type')} onChange={this.handleChange}>
										<option value="EL">HotSpot</option> <option value="ER">Relais</option>
									</select>
								</div>
							</div>
							  <div style={{ backgroundColor: 'rgba(212,212,212,0.62)' , borderRadius: '10px' , paddingBottom: '10px' , marginTop: '8px'}}>
									<label htmlFor=" "> <span style={{ margin: '0 94px 0 9px' }}> Latitude <small>( <i> <strong style={{ color: '#d9534f' }} >dd.mm.ssN</strong></i> )</small> </span> <span>Longitude <small>( <i> <strong style={{ color: '#d9534f' }} >dd.mm.ssW</strong></i>)</small> </span> </label>
								  <div style={{ display: 'inline-block' , marginRight: '68px' }}>
										<input placeholder="55.48.58S" type="text" className="form-control" style={{ width: '188px' }} name="location_latitude" value={value('location_latitude')} onChange={this.handleChange} />
									</div>
									<div style={{ display: 'inline-block' }}>
										<input placeholder="11.15.00E" type="text" className="form-control" style={{ width: '188px' }} name="location_longitude" value={value('location_longitude')} onChange={this.handleChange} />
									</div>
								</div>
						</fieldset>

            <fieldset className="form-group grid-item">
              <div className="titre"> Wifi <span className="iconeAide" onClick={this.toggleWifiHelpPopup} > 📖 </span> </div>
              {this.state.showWifiPopup && (
								<div className="wifiPopup">
									<div className="wifiPopupContent">
										<h3>Instructions Wifi</h3>
										<ol>
											<li>Cliquez sur le bouton "Lancer Scan" pour rechercher les réseaux Wifi disponibles ..</li>
											<li>La liste des réseaux détectés s&apos;affichera avec leur SSID et la force du signal. Une fois ceci fait ..</li>
											<li>Dans la section "Box", entrez le Nom du réseau (SSID) et le Mot de passe.</li>
											<li>Si vous souhaitez utiliser le partage de connexion de votre téléphone, entrez le Nom du réseau (SSID) et le Mot de passe de votre téléphone dans la section "Téléphone".</li>
											<li>"Réseau prioritaire", choisissez quel réseau doit être privilégié si les deux sont disponibles. Sélectionnez "Aucun" si aucune priorité n&apos;est nécessaire.</li>
											<li>N&apos;oubliez pas de cliquer sur "Enregistrer" en bas de la page, pour appliquer vos modifications.</li>
											<li>* Lors d&apos;une configuration Wifi, l&apos;enregistrement est plus lent que d&apos;habitude, pas d&apos;inquiétude ;)</li>
										</ol>
										<button onClick={this.toggleWifiHelpPopup} className="fermer">Fermer</button>
									</div>
								</div>
							)}
              <div className="form-group" style={{ marginTop: '24px', borderRadius: '10px' }}>
                <button type="button" className="btn" onClick={this.handleScanWifi} disabled={this.state.isScanningWifi} style={{ padding: '8.8px 6px', fontSize: '0.9rem', backgroundColor: 'lime', color: 'white' , marginTop: '10px' }}>
                  {this.state.isScanningWifi ? 'Scan en cours ..' : 'Lancer Scan'}
                </button>
                {this.state.wifiScanError && (
                  <p style={{ color: 'red', marginTop: '10px', paddingBottom: '4px' }}>{this.state.wifiScanError}</p>
                )}

                {Array.isArray(this.state.availableWifiNetworks) && this.state.availableWifiNetworks.length > 0 && (
                  <div style={{ marginTop: '4px', maxHeight: '200px', overflowY: 'auto', border: 'none', borderRadius: '12px', padding: '6px 6px 8px 6px' }}>
                    <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                      {this.state.availableWifiNetworks.map((network, index) => (
                        <li key={`${network.ssid}-${index}`} style={{ padding: '0', borderBottom: '1px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{network.ssid}</span>
                          <span style={{ fontSize: '0.8em', color: 'black' }}>
                            Signal: {network.signal}% {network.security !== 'None' ? `(${network.security})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {this.state.isScanningWifi && !this.state.wifiScanError && (
                  <p style={{ marginTop: '10px', color: '#464a4c', paddingBottom: '4px' }}>Recherche réseaux Wifi en cours ..</p>
                )}
                {Array.isArray(this.state.availableWifiNetworks) && this.state.availableWifiNetworks.length === 0 && !this.state.isScanningWifi && !this.state.wifiScanError && (
                  <p style={{ marginTop: '4px', color: '#464a4c', fontSize: '14px', paddingBottom: '4px' }}>Aucun réseau disponible ..</p>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '24px', paddingBottom: '8px', borderRadius: '10px' }}>
                <label htmlFor="wifi_ssid_box">Box</label>
                <input placeholder="Nom du réseau" type="text" className="form-control" name="wifi_ssid_box" value={value('wifi_ssid_box')} onChange={this.handleChange} />
                <input placeholder="Mot de passe" type="text" className="form-control" style={{ marginTop: '8.6px' }} name="wpa_key_box" value={value('wpa_key_box')} onChange={this.handleChange} />
              </div>

              <div className="form-group" style={{ marginTop: '24px', paddingBottom: '8px', borderRadius: '10px' }}>
                <label htmlFor="wifi_ssid_phone">Téléphone</label>
                <input placeholder="Nom du réseau" type="text" className="form-control" name="wifi_ssid_phone" value={value('wifi_ssid_phone')} onChange={this.handleChange} />
                <input placeholder="Mot de passe" type="text" className="form-control" style={{ marginTop: '8.6px' }} name="wpa_key_phone" value={value('wpa_key_phone')} onChange={this.handleChange} />
              </div>

              <div className="form-group" style={{ marginTop: '24px', borderRadius: '10px' }}>
                <label htmlFor="wifi_priority_choice">Réseau prioritaire</label>
                <select className="form-control" name="wifi_priority_choice" value={value('wifi_priority_choice')} onChange={this.handleChange}>
                  <option value="none">Aucun</option> <option value="box">Box</option> <option value="phone">Téléphone</option>
                </select>
              </div>
            </fieldset>

						<fieldset className="form-group grid-item">
							<div className="titre">SA818</div>
							<div className="subtitle">pour spotnik Delta ou Zeta avec radio integrée</div>
							<div className="form-group" style={{ borderRadius: '10px' }}>
								<label htmlFor="Tx_qrg">Fréquence Tx</label>
								<input placeholder="---.----" type="text" className="form-control" name="tx_qrg" value={value('tx_qrg')} onChange={this.handleChange} />
							</div>
							<div className="form-group" style={{ marginTop: '24px' , borderRadius: '10px' }}>
								<label htmlFor="Rx_qrg">Fréquence Rx</label>
								<input placeholder="---.----" type="text" className="form-control" name="rx_qrg" value={value('rx_qrg')} onChange={this.handleChange} />
							</div>
							<div className="form-group" style={{ marginTop: '24px' , borderRadius: '10px' }}>
								<label htmlFor="sql_lvl">Squelch</label>
								<select required name="sql_lvl" className="form-control" value={value('sql_lvl')} onChange={this.handleChange}>
									{sql_lvl.map(sql => <option key={sql} value={sql} >{sql}</option>)}
								</select>
							</div>
							<div className="form-group" style={{ marginTop: '24px' , borderRadius: '10px' }}>
								<label htmlFor="lSA818">Voulez vous programmer le Sa818 maintenant ? <br /> Choisissez -Oui- puis cliquez sur Enregistrer !!</label>
								<select required name="lSA818" className="form-control" value={value('l_818')} onChange={this.handleChange}>
									{lSA818.map(lSA818 => <option key={lSA818} value={lSA818} >{lSA818}</option>)}
								</select>
							</div>
						</fieldset>

					</div>

					<div className="clignotage" style={{ textAlign: 'center' }}>
					<input type="submit" className="btn btn-primary enregistrer" value="Enregistrer" />
					</div>

				</form>

<style jsx>{`

	.grid-container { display: grid; grid-template-columns: repeat(auto-fit,minmax(466px,1fr)); grid-gap: 28px; cursor: default; }

	.grid-item { padding: 10px; border: none; margin: 0; }

	.titre { margin: 0 0 28px ; color: #d9534f; text-align: center; font-size: 1.5rem; }

	.subtitle { position: relative; top: -15px; font-size: small; }

	label { margin: 0; color: black; }

	.form-group { margin-bottom: 0.5rem; text-align: center; }

	.enregistrer { margin: 20px 0; padding: 14px 20px; }

	.placeholder { color: #d9534f; }

  #majuscule::placeholder { color: #d9534f; }

  .iconeAide { cursor: pointer; position: absolute; margin-left: 182px; font-size: 1.2rem; vertical-align: middle; }

	.wifiPopup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(78, 78, 78, 0.74); display: flex; justify-content: center; align-items: center; z-index: 1000; }

	.wifiPopupContent { background-color: rgb(212,212,212,0.84); padding: 14px; border-radius: 12px; max-width: 528px; position: relative; color: black; }

	.wifiPopupContent h3 { color: #d9534f; margin-bottom: 16px; text-align: center; }

	.wifiPopupContent ol { text-align: left; }

	.wifiPopupContent ol li { margin-bottom: 8px; }

	.fermer { background-color: lime; color: white; border: none; padding: 0 6px; border-radius: 6px; cursor: pointer; display: block; margin: 0 auto; font-size: 1rem; }

	.fermer:hover { background-color: #d9534f; color: white; }

`}</style>

			</Layout>
		)
	}
}
export default Component