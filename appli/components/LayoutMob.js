import React, { useEffect, useState } from 'react';
import Head from 'next/head'
import Cookies from 'js-cookie';
import Navigation from './NavigationMob'

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
			<title>WebLink V 6 Turbo - Mobile</title>
			<meta charSet="utf-8"/>
			<meta name="viewport" content="initial-scale=1.0, width=device-width"/>
			<meta name="theme-color" content="rgba(102, 104, 112, 0.94)" id="theme-color-meta"/>
			<link rel="icon" type="image/png" href="../static/favicon.ico"/>
		</Head>

		<Navigation/>

		<div style= {{ padding: '14% 0 26px 0' }}> {props.children} </div>

<style global jsx>{`

body { min-height: 100%; background-size: 100% 100%; background-image: url(${backgroundImage}); background-position: center; background-attachment: fixed; margin: 0; }

html { height: auto; }

a, strong {color: #d9534f; text-decoration: none; }

a:focus, a:hover {color: lime; text-decoration: none; }

.item a:active { background-color: rgba(255, 255, 255, 0.84) !important; color: #d9534f !important; transition: none; }

a {display: inline-block; text-decoration: none; }

.lien:hover { border-radius: 6px; }

.clignotage { animation: clignoter 4s infinite; transition: none; }

@keyframes clignoter { 0% { opacity:1; } 40% { opacity:0.2; } 100% { opacity:1; } }

@keyframes border-bottom-pulse { 0% { width: 0%; left: 0%; } 50% { width: 100%; left: 0%; } 100% { width: 0%; left: 100%; } }

.coche { display: inline-block; position: relative; padding-left: 0; margin: 12px 20px 2px; cursor: pointer; font-size: 16px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }

.coche input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }

.checkmark { position: absolute; top: 7px; left:50px; height: 14px; width: 14px; background-color: white; border-radius: 4px; }

.coche:hover input ~ .checkmark { background-color: red; }

.checkmark:after { content: ""; position: absolute; display: none; }

.coche input:checked ~ .checkmark:after { display: block; }

.coche .checkmark:after { left: 3px; top: 0; width: 6px; height: 10px; border: solid #4ade80; border-width: 0 3px 3px 0; -webkit-transform: rotate(45deg); -ms-transform: rotate(45deg); transform: rotate(45deg); }

.checkmark:hover:after { border-color: white; }

.coche:hover input:checked ~ .checkmark:after { border-color: white; }

.nav { position: fixed; top: 0; right: 0; left: 0; z-index: 1042; margin: 0 auto; max-width: 582px; border-radius: 0 0 16px 16px; background-color: transparent; transition: background-color 0.26s ease; }

.nav.open { background-color: rgba(121, 122, 128, 0.90); min-height: 52px; }

.hamburger { position: absolute; right: 12px; top: 12px; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 4.8px; z-index: 1046; }

.bar { width: 26px; height: 2.8px; background-color: red; border-radius: 2px; transition: 0.24s; }

.bar.open:nth-child(1) { transform: translateY(8px) rotate(45deg); }

.bar.open:nth-child(2) { opacity: 0; }

.bar.open:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

.menu { display: none; width: 100%; padding: 60px 0 20px 0; text-align: center; }

.menu.show { display: block; }

.list { list-style: none; padding: 0; margin: 0; line-height: 2.4; font-size: 20px; }

.item { margin: 0 82px; }

.item:last-child { border-bottom: none; }

.fadeOut { animation: FadeOut 1.8s forwards; }

@keyframes FadeOut {from { opacity: 1; } to { opacity: 0; } }

`}</style>

		</div>
  )
}
export default Layout