import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from './Navigation'
import { Notif } from '../lib/notif';
import { useTheme } from '../lib/themeContext';

const Layout = props => {
	const [navBg, setNavBg] = useState(props.nodesBgColor);
	const [navColor, setNavColor] = useState(props.nodesColor);
		const [font, setFont] = useState(() => {
  	if (typeof window !== 'undefined') {
    	return localStorage.getItem('font') || props.font || 'sans-serif';
  	}
  	return props.font || 'sans-serif';
	});
	const [notification, setNotification] = useState(Notif.getCurrentState());
	const [showClass, setShowClass] = useState('');
	const { theme } = useTheme();

	const displayTimerRef = useRef(null);
	const fadeTimerRef = useRef(null);

	const router = useRouter();

	const notificationStyle = {
		backgroundColor: notification.type === 'error' ? '#d9534f' : navBg,
		color: notification.type === 'error' ? 'white' : navColor,
	};

	useEffect(() => {
		const savedImage = localStorage.getItem('image');
		const savedBgColor = localStorage.getItem('nodesBgColor');
		const savedColor = localStorage.getItem('nodesColor');
    const savedFont = localStorage.getItem('font');

		if (savedImage) {
			document.body.style.backgroundImage = `url(${savedImage})`;
		} else {
			document.body.style.backgroundImage = '';
		}

		const bg = savedBgColor || props.nodesBgColor || 'rgba(121, 122, 128, 0.90)';
		const color = savedColor || props.nodesColor || 'white';
		const f = savedFont || props.font || 'sans-serif';

		setNavBg(bg);
		setNavColor(color);
    setFont(f);

		const root = document.documentElement;
		root.style.setProperty('--nav-bg', bg);
		root.style.setProperty('--nav-color', color);
		root.style.setProperty('--layout-font', f);

		const handleNotification = (newState) => {
			clearTimeout(displayTimerRef.current);
			clearTimeout(fadeTimerRef.current);

			setNotification(newState);
			setShowClass('');

			if (newState.message) {
				displayTimerRef.current = setTimeout(() => {
					setShowClass('fadeOut');
				}, 3000);

				fadeTimerRef.current = setTimeout(() => {
					setNotification({ message: null, type: 'info' });
					setShowClass('');
				}, 4800);
			}
		};

		const unsubscribe = Notif.subscribe(handleNotification);

		return () => {
			unsubscribe();
			clearTimeout(displayTimerRef.current);
			clearTimeout(fadeTimerRef.current);
		};

	}, [props.nodesBgColor, props.nodesColor, props.font]);

	useEffect(() => {
		if (notification.message) {
			Notif.hide();
		}
	}, [router.asPath]);

	return (

		<div>

			<Head>
				<title>Hotspot - WebLink V {props.version}</title>
				<meta charSet="utf-8"/>
				<meta name="viewport" content="initial-scale=1.0, width=device-width"/>
				<link rel="icon" type="image/png" href="../static/favicon.ico"/>
			</Head>

			{notification.message && ( <div className={`notification ${notification.type} ${showClass}`} style={notificationStyle} > {notification.message} </div> )}

			<Navigation nodesBgColor={navBg} nodesColor={navColor} />

			<div className="content" style= {{ height: '100%', padding: '9% 10px 0' }} > {props.children} </div>

<style global jsx>{`

body { min-height: 100%; background-size: 100% 100%; background-position: center; background-attachment: fixed; margin: 0; line-height: 1.48; }

html { height: auto; -webkit-box-sizing: border-box; box-sizing: border-box; }

*, ::after, ::before { -webkit-box-sizing: inherit; box-sizing: inherit; }

a, strong {color: #d9534f; text-decoration: none; }

a:focus, a:hover {color: #4ade80; text-decoration: none; }

a {display: inline-block; text-decoration: none; }

.lien { color: white; text-decoration: none; padding: 0 6px; border-radius: 6px; }

.lien:hover { color: #4ade80; }

.lien2:hover { border-radius: 6px; background-color: #4ade80; }

img {vertical-align: middle; cursor: pointer; }

p { margin:0 0 1rem 0;}

.colorTime { color: var(--hm-color); margin-left: 10px; }

label { display: inline-block; margin-bottom: .48rem; }

button:active, .commande:active, .fermer2:active, img:active, .enregistrer:active, a:active, .clignotage:active, .github:active, .ripple:active, .ripple2:active { transform: scale(0.94) }

body, button, select { font-family: var(--layout-font, var(--font, sans-serif)); }

.zoom { transition: transform .2s; margin: 0 auto; }

.zoom:hover {-ms-transform: scale(1.4); -webkit-transform: scale(1.4); transform: scale(1.4); }

.clignotage { animation: clignoter 4s infinite; transition: none; }

@keyframes clignoter { 0% { opacity:1; } 40% { opacity:0.2; } 100% { opacity:1; } }

.marquee { display: inline-flex; width: 248px; margin: 11px 0 0 86px; background-color: transparent; color: white; font-size: 11.6pt; font-weight: normal; overflow: hidden; position: absolute; box-sizing: border-box; }

.marqueeInner { display: inline-block; white-space: nowrap; animation: marquee 44s cubic-bezier(0.8, 0.8, 0.36, 1.40) infinite, marquee-delay 0s step-start infinite; }

@keyframes marquee { 0% { transform: translateX(-100%); } 15% { transform: translateX(0); } 30% { transform: translateX(0); } 45% { transform: translateX(-100%); } 100% { transform: translateX(-100%); } }

@media only screen and (max-width: 1506px) { html { zoom: 90%; } #bouton { width: 172px; } }

.coche { display: inline-block; position: relative; padding-left: 0; margin: 8px 0 2px 28px; cursor: pointer; font-size: 14px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }

.coche input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }

.checkmark { position: absolute; top: 6px; left: 50px; height: 14px; width: 14px; background-color: white; border-radius: 4px; }

.coche:hover input ~ .checkmark { background-color: #4ade80; }

.checkmark:after { content: ""; position: absolute; display: none; }

.coche input:checked ~ .checkmark:after { display: block; }

.coche .checkmark:after { left: 3px; top: 1px; width: 6px; height: 10px; border: solid #4ade80; border-width: 0 3px 3px 0; -webkit-transform: rotate(45deg); -ms-transform: rotate(45deg); transform: rotate(45deg); }

.checkmark:hover:after { border-color: white; }

.coche:hover input:checked ~ .checkmark:after { border-color: white; }

.nav { position: fixed; top: 0; right: 0; left: 0; z-index: 1042; margin: 0 auto; width: 562px; height: 42px; border-radius: 0 0 16px 16px; display: flex; align-items: center; justify-content: center; padding:0 12px 8px 12px; min-width: fit-content; }

.list { display: flex; list-style: none; margin: 0; padding: 0; line-height: 0.88; }

.navLink { transition: transform 0.4s ease; }

.navLink:hover { color: #d9534f!important; transform: scale(1.06); background-color: rgba(255,255,255,0.84)!important; }

.navLink:active { color: #4ade80; text-decoration: none; }

.navLink.active2 { color: white; background-color: #4ade80; }

.notification { position: fixed; top: 12%; left: 50%; transform: translateX(-50%); background-color: var(--nav-bg); color: var(--nav-color); padding: 12px 20px; border-radius: 16px; box-shadow: white 0 0 60px; z-index: 1; font-family: var(--layout-font, var(--font, sans-serif)); max-width: 482px; text-align: center; }

.notification.error { background-color: #d9534f !important; color: white !important; }

.fadeOut { animation: FadeOut 1.8s forwards; }

@keyframes FadeOut {from { opacity: 1; } to { opacity: 0; } }

`}</style>

		</div>
	)
}
export default Layout