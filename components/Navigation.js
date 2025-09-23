import Link from 'next/link'
import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/router';
import Horloge from '../lib/horloge';

const Navigation = () => {

  const router = useRouter();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/static/hover.wav');
    audioRef.current.volume = 0.4;
  }, []);

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const controlAnimationCycle = () => {
      const marqueeInner = document.querySelector('.marquee__inner');

      const startAnimation = () => {
        marqueeInner.style.transform = 'translateX(-100%)';

        marqueeInner.style.animationPlayState = 'running';

        const animationDuration = 18 * 1000;
        setTimeout(() => {
          stopAnimation();
        }, animationDuration);
      };

      const stopAnimation = () => {
        marqueeInner.style.transform = 'translateX(100%)';

        marqueeInner.style.animationPlayState = 'paused';

        const pauseDuration = 88 * 1000;
        setTimeout(() => {
          startAnimation();
        }, pauseDuration);
      };

      startAnimation();
    };

    controlAnimationCycle();

    return () => {
      const marqueeInner = document.querySelector('.marquee__inner');
      marqueeInner.style.animationPlayState = 'paused';
    };
  }, []);

  const NavLink = ({ href, label, isFirst }) => {
    const isActive = router.pathname === href;
    return (
      <Link href={href}>
        <a className={`nav-link ${isActive ? 'active2' : ''}`} onMouseEnter={playHoverSound} style={{ padding: '3px 4px 3px 4px', margin: isFirst ? '8px 0 0 0' : '8px 0 0 32px', borderRadius: '6px', }} > {label} </a>
      </Link>
    );
  };

	return (

	<div>

		<a target="_blank" href="https://www.websdrbordeaux.fr" className="navbar-brand" style={{ position: 'absolute' , marginLeft: '20px' }}> <img src="../static/logo-rond.png" height="38" /> </a>

  	<div className="marquee"> <div className="marquee__inner"> <a target="_blank" href="https://www.websdrbordeaux.fr" className="lien">www.websdrbordeaux.fr</a> </div> </div>

    <Horloge />

		<nav className="navbar fixed-top navbar-toggleable-md navbar-light bg-faded" style={{ margin: '0 auto' ,  width: '624px' , borderBottomLeftRadius: '16px' , borderBottomRightRadius: '16px' }}>
			<button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
				<span className="navbar-toggler-icon" />
			</button>

			<div className="collapse navbar-collapse" id="navbarSupportedContent" style={{ height: '36px' }}>

				<ul className="navbar-nav mr-auto" style={{ lineHeight: '0.88' }}>

					<li className="nav-item"> <NavLink href="/index" label="Accueil" isFirst /> </li>

          <li className="nav-item"> <NavLink href="/dtmf" label="Dtmf" /> </li>

          <li className="nav-item"> <NavLink href="/configuration" label="Configuration" /> </li>

          <li className="nav-item"> <NavLink href="/status" label="Status" /> </li>

          <li className="nav-item"> <NavLink href="/admin" label="Admin" /> </li>

          <li className="nav-item"> <NavLink href="/liens" label="Liens" /> </li>

          <li className="nav-item"> <NavLink href="/infos" label="Infos" /> </li>

        </ul>

      </div>

		</nav>

	</div>
	)
}
export default Navigation