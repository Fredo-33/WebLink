import React from 'react'
import Layout from '../components/Layout'
import DtmfPlayer from '../lib/play-dtmf'
import fetch from '../lib/fetch'
import notie from '../lib/notie';

const g = global || window

const keys = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];

class Component extends React.Component {
	constructor(...args) {
		super(...args)
		this.state = {
			display: '',

			cmds: {

			'Informations': '*',
			'Météo': '*81#',
			'Arrêt Hotspot': '88',
		//'Raptor': '90',
			'Heure': '91',
			'Température': '92',
			'Adresse ip': '93',
			'Status connexion': '94',
			'Perroquet': '95',
			'vide1': '',
			'Pmr 446 MHz': '33',
			'Bac à Sable': '34',
			'vide2': '',
			'Réseau 2 ': '36',
			'Réseau 3 ': '37',
			'Réseau 4 ': '38',
			'vide3': '',
			'Ri49 ': '49',
			'vide4': '',
			'Salon RRF': '96',
			'Salon TEC ': '98',
			'Salon BAV ': '100',

			}

		}

		if (g.AudioContext) {
			this.dtmfPlayer = new DtmfPlayer()
		}
	}

	vibrate() {
		if (navigator.vibrate) {
			navigator.vibrate(50)
		}
	}

	play(key) {
		if (!this.dtmfPlayer) {
			return
		}
		this.dtmfPlayer.play(key)
		setTimeout(() => {
			this.dtmfPlayer.stop()
		}, 150)
	}

	key(key) {
		this.vibrate()
		this.play(key)
		fetch(`/api/dtmf/${encodeURIComponent(key)}`, { method: 'POST' })
			.then(() => {
				const display = this.state.display + key
				this.setState({ display })
			})
			.catch(() => { })
	}

	sendKey(code, i) {
		if (i < code.length) {
			this.key(code[i]);
			i = i + 1;
			setTimeout(() => {
				this.sendKey(code, i);
			}, 250)
		}
	}

	sendCode(code) {
		var i = 0;
		this.sendKey(code, i);
	}

	static getInitialProps() {
		return fetch(`/api/configuration`)
			.then(res => res.json())
			.then(config => {
				config.callsign = config.callsign || '5P07N1K'
				return config
			})
	}

	componentDidMount() {
		this.loadConfig();
	}

	loadConfig() {
		fetch('/api/configuration', { cache: "no-store" })
			.then(response => response.json())
			.then(data => {
				const replacements = { 'Réseau 2': data.res2 || 'Réseau 2', 'Réseau 3': data.res3 || 'Réseau 3', 'Réseau 4': data.res4 || 'Réseau 4', };
				const updatedCmds = {};

				for (const [label, code] of Object.entries(this.state.cmds)) {
					const newLabel = replacements[label.trim()] || label;
					updatedCmds[newLabel] = code;
				}

				this.setState({ cmds: updatedCmds });
			})
			.catch(err => {
				console.error("Erreur chargement configuration.json :", err);
			});
	}

	render() {

		const display = this.state.display || this.props.callsign
		const cmds = this.state.cmds;

		return (

			<Layout>

				<div className="grid-container">

					<div className="grid-item">
						<ul style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
							{Object.entries(cmds).map(([v, k]) => {
								if (v.startsWith('vide')) {
									return <li key={v} style={{ height: '1.6rem', listStyleType: 'none' }}></li>;
								}
								return (
									<li key={k} onClick={() => { this.sendCode(k === '#' ? '#' : k + '#'); notie.info('Envoi commande .. !!'); }} className="commande">
										<strong>{k} &nbsp; </strong> {v}
									</li>
								)
							})}
						</ul>
					</div>

				</div>

<style jsx>{`

	.commande { cursor: pointer; display: block; }

	.grid-container { display: grid; grid-template-columns: 1fr; background-color: rgba(206,206,206,0.74); border-radius: 22px; text-align: center; width: 308px; margin: 0 auto; }

	.grid-item { padding: 12px 34px 6px 0; }

	.grid-item ul li:hover { font-weight: bold; color: lime; }

`}</style>

			</Layout>
		)
	}
}
export default Component