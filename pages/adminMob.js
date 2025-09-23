import React from 'react'
import Layout from '../components/LayoutMob'
import fetch from '../lib/fetch'
import notie from '../lib/notie'

function restart() {
	fetch('/api/restart', { method: 'POST' })
		.then(() => notie.info('Redémarrage Pmr 446 MHz ..'))
		.catch(() => { })
}

function reboot() {
	fetch('/api/reboot', { method: 'POST' })
		.then(() => notie.info('Redémarrage Hotspot .. '))
		.catch(() => { })
}

function poweroff() {
	fetch('/api/poweroff', { method: 'POST' })
		.then(() => notie.info('Extinction ..'))
		.catch(() => { })
}

function updateInfo() {
	fetch('/api/updateInfo', {method: 'POST'})
		.then(() => notie.info('Mise à jour des infos .. !!'))
		.catch(() => {})
}

class Component extends React.Component {
	constructor() {
		super()
		this.state = { versions: { version: null, version_gui: null }, showInfo: false, countdown: '6m 0s', message: null }

		this.startCountdown = this.startCountdown.bind(this);
	}

	startCountdown = () => {
		let countdown = 6 * 60;
		this.setState({ countdown, message: 'C\'est parti mon kiki ;)' });
		const timer = setInterval(() => {
			countdown -= 1;
			const minutes = Math.floor(countdown / 60);
			const seconds = countdown % 60;

			let currentMessage = this.state.message;

			if (countdown === 356) {
				currentMessage = 'Récupération des fichiers sur le serveur WebSdr Bordeaux';
			} else if (countdown === 350) {
				currentMessage = 'Impec, fichiers à jour, on continue le process !!';
			} else if (countdown === 346) {
				currentMessage = 'Arrêt de Pmr446MHz';
			} else if (countdown === 342) {
				currentMessage = 'Compilation de la distribution ...';
			} else if (countdown === 48) {
				currentMessage = 'Compilation ok !!';
			} else if (countdown === 44) {
				currentMessage = 'Redémarrage de Pmr446MHz ...';
			} else if (countdown === 24) {
				currentMessage = 'On y est presque ...';
			} else if (countdown === 8) {
				currentMessage = 'Terminado, vous pouvez retourner sur la page principale ;)';
			}

			this.setState({
				countdown: countdown > 0 ? `${minutes}m ${seconds}s` : null,
				message: currentMessage,
			});

			if (countdown <= 0) {
				clearInterval(timer);
			}
		}, 1000);
	};

	render() {

		return (

			<Layout>

				<div className="list-group">

					<div className="list-group-item flex-column align-items-center">
						<button type="button" onClick={restart} className="btn btn-danger"> Redémarrer Pmr 446 MHz </button>
					</div>

					<div className="list-group-item flex-column align-items-center">
				    <button type="button" onClick={() => { updateInfo(); this.setState({ showInfo: true }); this.startCountdown(); }} className="btn btn-danger">Mise à jour Infos</button>
			    </div>

					<div className="list-group-item flex-column align-items-center">
						<button type="button" onClick={reboot} className="btn btn-danger">Redémarrer Hotspot</button>
					</div>

					<div className="list-group-item flex-column align-items-center">
						<button type="button" onClick={poweroff} className="btn btn-danger">Eteindre Hotspot</button>
					</div>

				</div >

				{this.state.showInfo && (

          <div className="info">

            <div> <button style={{ position: 'relative' , padding: '6px' , left: '138px' , borderRadius: '22px' }} type="button" onClick={() => this.setState({ showInfo: false })} className="btn btn-danger" > x </button> </div>

            <p style={{ marginTop: '8px' }}> Mise à jour des infos .. !! </p> <p style={{ marginTop: '16px' }}> Veuillez patienter quelques minutes </p>

          	{this.state.countdown !== null && <p style={{ marginBottom: '0' , color: '#d9534f' }}> {this.state.countdown} </p>}

						{this.state.message && ( <p style={{ margin: '14px 0 2px' , color: 'lime' }}> {this.state.message} </p>)}

          </div>

        )}

<style jsx>{`

	.list-group-item { background-color: rgba(206,206,206,0.74); padding: 26px; }

	.list-group { display: block; margin: 68px auto; width: 308px; }

	.info { background-color: rgba(206,206,206,0.74); padding: 0 0 1rem; margin: 1rem auto; border-radius: 22px; text-align: center; width: 308px; border: 1px solid rgba(0,0,0,.125); }

`}</style>

			</Layout >
		)
	}
}
export default Component