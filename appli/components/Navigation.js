import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router';
import Horloge from '../lib/horloge';

const Navigation = ({ nodesBgColor, nodesColor }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/static/hover.wav');
    audioRef.current.volume = 0.4;
  }, []);

  const playHoverSound = () => {
    audioRef.current?.play();
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const controlAnimationCycle = () => {
      const marqueeInner = document.querySelector('.marqueeInner');
      if (!marqueeInner) return;
      const startAnimation = () => {
        marqueeInner.style.transform = 'translateX(-100%)';
        marqueeInner.style.animationPlayState = 'running';
        setTimeout(() => stopAnimation(), 18000);
      };
      const stopAnimation = () => {
        marqueeInner.style.transform = 'translateX(100%)';
        marqueeInner.style.animationPlayState = 'paused';
        setTimeout(() => startAnimation(), 88000);
      };
      startAnimation();
    };
    controlAnimationCycle();
  }, []);

  const NavLink = ({ href, label, isFirst }) => {
    const isActive = router.pathname === href;
    return (
      <Link href={href}>
        <a className={`navLink ${isActive ? 'active2' : ''}`} onMouseEnter={playHoverSound} style={{ padding: '3px 4px', margin: isFirst ? '8px 0 0 0' : '8px 0 0 32px', borderRadius: '6px', color: nodesColor }} > {label} </a>
      </Link>
    );
  };

  return (
    <div>

      <a target="_blank" href="https://www.websdrbordeaux.fr" className="zoom" style={{ position: 'absolute', margin: '.25rem 0 0 20px' }}> <img src="../static/logoRond1.png" height="38" /> </a>

      <div className="marquee"> <div className="marqueeInner"> <a target="_blank" href="https://www.websdrbordeaux.fr" className="lien" rel="noopener noreferrer">www.websdrbordeaux.fr</a> </div> </div>

      <Horloge />

      <nav className="nav" style={{ backgroundColor: nodesBgColor }}>

          <ul className="list">
            <li> <NavLink href="/index" label="Accueil" isFirst /> </li>
            <li> <NavLink href="/dtmf" label="Dtmf" /> </li>
            <li> <NavLink href="/configuration" label="Configuration" /> </li>
            <li> <NavLink href="/status" label="Status" /> </li>
            <li> <NavLink href="/liens" label="Liens" /> </li>
            <li> <NavLink href="/infos" label="Infos" /> </li>
          </ul>
      </nav>

    </div>
  )
}
export default Navigation