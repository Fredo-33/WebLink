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

			<title>Pmr446MHz - Mobile</title>
			<meta charSet="utf-8"/>
			<meta name="viewport" content="initial-scale=1.0, width=device-width"/>
			<link rel="icon" type="image/png" href="../static/favicon.ico"/>
			<link href="../static/notie.min.css" rel="stylesheet" type="text/css"/>
			<link href="../static/bootstrap.min.css" rel="stylesheet" type="text/css"/>
			<script src="../static/jquery.slim.min.js"/>
			<script src="../static/bootstrap.min.js"/>

		</Head>

		<Navigation/>

		<div className="content"> {props.children} </div>

<style jsx>{`

	.content { padding: 12% 0 26px 0 }

`}</style>

<style global jsx>{`

	html, body { width: 100%; height: 100%; background-repeat: no-repeat; background-size: 100% 100%; margin-bottom: 10px; background-attachment: fixed; background-image: url(${backgroundImage}); }

	a { transition: color 0.6s cubic-bezier(0.2, 1, 0.3, 1); }

  a:hover { color: lime; text-decoration: none; }

	.lien:hover { border-radius: 6px; }

	.zoom { transition: transform .2s; margin: 0 auto; }

	.zoom:hover {-ms-transform: scale(1.4); -webkit-transform: scale(1.4); transform: scale(1.4); }

 	.clignotage { animation: clignoter 4s infinite; transition: none; }

	@keyframes clignoter { 0% { opacity:1; } 40% { opacity:0.2; } 100% { opacity:1; } }

  .github { position: relative; display: inline-flex; align-items: center; padding: 10px 20px; border: 1px solid transparent; border-radius: 16px; overflow: hidden; transition: border-color 0.4s ease, box-shadow 0.4s ease; margin-bottom: 36px; }

  .github::before { content: ''; position: absolute; background: rgba(0, 255, 0, 0.68); height: 2px; bottom: 0; left: 0; width: 0; animation: border-bottom-pulse 4s linear infinite alternate; }

  @keyframes border-bottom-pulse { 0% { width: 0%; left: 0%; } 50% { width: 100%; left: 0%; } 100% { width: 0%; left: 100%; } }

  .github:hover { border-color: rgba(0, 255, 0, 0.48); box-shadow: 0 0 8px rgba(0, 255, 0, 0.68); }

  .github:hover::before { animation: none; width: 100%; background: transparent; }

`}</style>

	</div>
  )
}
export default Layout