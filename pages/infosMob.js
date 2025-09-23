import React from 'react'
import Layout from '../components/LayoutMob'

export default () => (

	<Layout>

		<div style={{ margin: '0 auto' , maxWidth: '188px' }}>
			<img src="../static/logo-rond.png" className="pixel" style={{ margin: '0' }} />
		</div>

		<br /><br />

		<div style={{ backgroundColor: 'rgba(206,206,206,0.74)' , borderRadius: '22px' , maxWidth: '690px' , margin: '0 auto' , textAlign: 'center' , cursor: 'default' }}>

		  <br />
		  <a className="navbar-brand" style={{ margin: '0' }} > <img src="../static/spotnik2.svg" height="28" className="filter brightness-0 invert spotnik" /> &ensp; </a>
			<a href="http://spotnik.org" target="_blank" className= "clignotage">http://spotnik.org</a>
			<br /><br />

			<p> Spotnik réalisé sous <a href="https://github.com/spotnik-ham/gui/blob/master/LICENSE">license GPL-3.0</a> ,
			pour toutes questions, utilisez <a href="https://github.com/spotnik-ham/gui/issues" target="_blank">leur Github</a> . </p>

			<p> Pmr446Mhz est également sous <a href="https://github.com/spotnik-ham/gui/blob/master/LICENSE">license GPL-3.0</a> ,
			créé / modifier par Frédo <br /> pour le "WebSdr Bordeaux", infos et téléchargement ici &ensp; <a href="https://github.com/Fredo-33?tab=repositories" target="_blank" className="clignotage zoom"> <img src="../static/github.png" style={{ height: '28px' }} className="github" /> </a> <a href="https://github.com/Fredo-33?tab=repositories" target="_blank">{`Fredo-33`}</a> </p>

			<ul style={{ listStyleType: 'none' , paddingBottom: '22px'}}>
				<li>Développement initial Spotnik Gui : Sonny Piers & F4GBV Isabelle</li>
				<li>Développement actuel Spotnik GUI : F1EVM Jean-Francois, Frédo</li>
				<li>Hardware : F1EVM Jean-Francois, F5NLG Jean-Philippe</li>
				<li>Low Level Script : F1EVM Jean-Francois, F4HWN Armel, F5NLG Jean-Philippe, Frédo</li>
				<li>Distrib et packaging : F5NLG, Frédo</li>
				<li>Svxlink de Tobias : <a href="http://www.svxlink.org">{`www.svxlink.org`}</a></li>
				<li>Raptor, Timersalon : F4HWN</li>
				<li>Sons : F5VMR Chris, F8ASB Juan, Frédo</li>
				<li>Alpha et Beta Testeurs</li>
				<li>Merci à tous, nos excuses si nous avons oublié une personne .. </li>
			</ul>

		</div>

<style jsx>{`

  .pixel { width: 188px; height: auto; image-rendering: pixelated; filter: blur(4px); transform: scale(1.05); transition: all 2.4s ease; opacity: 0; animation: pixelIn 2.4s forwards; }

  @keyframes pixelIn { 0% { opacity: 0; filter: blur(4px); transform: scale(1.1); } 100% { opacity: 1; filter: blur(0); image-rendering: auto; transform: scale(1); } }

  .github:hover { transform: rotate(-16deg) scale(1.1); }

  .github { transition: transform 0.24s ease; }

`}</style>

	</Layout>
)