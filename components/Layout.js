import React, { useEffect, useState } from 'react';
import Head from 'next/head'
import Cookies from 'js-cookie';
import Navigation from './Navigation'

const Layout = props => {
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    const imageFromCookie = Cookies.get('selectedImage');
    if (imageFromCookie) {
      setBackgroundImage(imageFromCookie);
    }
  }, []);

  return (

	<div>

		<Head>

			<title>Hotspot - Pmr446MHz</title>
			<meta charSet="utf-8"/>
			<meta name="viewport" content="initial-scale=1.0, width=device-width"/>
			<link rel="icon" type="image/png" href="../static/favicon.ico"/>
			<link href="../static/notie.min.css" rel="stylesheet" type="text/css"/>
			<link href="../static/bootstrap.min.css" rel="stylesheet" type="text/css"/>
			<script src="../static/jquery.slim.min.js"/>
			<script src="../static/bootstrap.min.js"/>

		</Head>

		<Navigation/>

		<div className="content" style= {{ height: '1284px' }} > {props.children} </div>

<style jsx>{`

	.content { padding: 9% 10px 0; }

`}</style>

<style global jsx>{`

	html, body { min-height: 100%; background-size: 100% 100%; background-image: url(${backgroundImage}); }

	.lien { color: white; text-decoration: none; padding: 0 6px; border-radius: 6px; }

	.lien:hover { color: lime; }

	.lien2:hover { border-radius: 6px; background-color: lime; }

	.zoom { transition: transform .2s; margin: 0 auto; }

	.zoom:hover {-ms-transform: scale(1.4); -webkit-transform: scale(1.4); transform: scale(1.4); }

 	.clignotage { animation: clignoter 4s infinite; transition: none; }

	@keyframes clignoter { 0% { opacity:1; } 40% { opacity:0.2; } 100% { opacity:1; } }

	.marquee { display: inline-flex; width: 248px; margin: 11px 0 0 86px; background-color: transparent; color: white; font-size: 11.6pt; font-weight: normal; overflow: hidden; position: absolute; box-sizing: border-box; }

	.marquee__inner { display: inline-block; white-space: nowrap; animation: marquee 44s cubic-bezier(0.8, 0.8, 0.36, 1.40) infinite, marquee-delay 0s step-start infinite; }

	@keyframes marquee { 0% { transform: translateX(-100%); } 15% { transform: translateX(0); } 30% { transform: translateX(0); } 45% { transform: translateX(-100%); } 100% { transform: translateX(-100%); } }

  @media only screen and (max-width: 1506px) { html { zoom: 90%; } #bouton { width: 177px; } }

  .coche { display: inline-block; position: relative; padding-left: 0; margin: 12px 0 2px; cursor: pointer; font-size: 16px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }

	.coche input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }

	.checkmark { position: absolute; top: 7px; left:50px; height: 14px; width: 14px; background-color: white; border-radius: 4px; }

  .coche:hover input ~ .checkmark { background-color: red; }

	.checkmark:after { content: ""; position: absolute; display: none; }

	.coche input:checked ~ .checkmark:after { display: block; }

	.coche .checkmark:after { left: 3px; top: 1px; width: 6px; height: 10px; border: solid rgba(121,122,128); border-width: 0 3px 3px 0; -webkit-transform: rotate(45deg); -ms-transform: rotate(45deg); transform: rotate(45deg); }

  .checkmark:hover:after { border-color: white; }

  .coche:hover input:checked ~ .checkmark:after { border-color: white; }

	.spotnik { transition: all 0.84s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }

	.spotnik:hover { transform: rotate(360deg) scale(1.2); filter: brightness-0 invert drop-shadow(0 0 15px rgba(59, 130, 246, 0.8)); }

	.nav-link { transition: transform 0.4s ease; }

  .nav-link:hover { color: red; transform: scale(1.06); background-color: rgba(255,255,255,0.84)!important; }

  .nav-link:active { color: lime; text-decoration: none; }

  .nav-link.active2 { color: white; background-color: lime; }

`}</style>

	</div>
  )
}
export default Layout