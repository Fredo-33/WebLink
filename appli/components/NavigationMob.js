import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  const NavLink = ({ href, label }) => {
    const isActive = router.pathname === href;

    return (
      <Link href={href}>
        <a className={isActive ? 'active-link' : ''} style={{ color: 'white', display: 'block', borderRadius: '14px', backgroundColor: isActive ? '#4ade80' : 'transparent' }} > {label} </a>
      </Link>
    );
  };

  return (
    <div>

      <a target="_blank" href="https://www.websdrbordeaux.fr" style={{ position: 'absolute', margin: '6px 0 0 10px', zIndex: '1043' }}> <img src="../static/logoRond1.png" height="38" /> </a>

			<nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
        <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span> <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span> <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`menu ${isMenuOpen ? 'show' : ''}`}>
          <ul className="list">
            <li className="item"> <NavLink href="/mobile" label="Accueil" /> </li>
            <li className="item"> <NavLink href="/dtmfMob" label="Dtmf" /> </li>
            <li className="item"> <NavLink href="/configurationMob" label="Configuration" /> </li>
            <li className="item"> <NavLink href="/statusMob" label="Status" /> </li>
            <li className="item"> <NavLink href="/liensMob" label="Liens" /> </li>
            <li className="item"> <NavLink href="/infosMob" label="Infos" /> </li>
          </ul>
        </div>
      </nav>

    </div>
  )
}
export default Navigation