import Link from 'next/link'
import React, { useEffect } from 'react'

const Navigation = () => {

  const NavLink = ({ href, label, }) => {
    return (
      <Link href={href}>
        <a style={{ color: 'white', padding: '3px 4px 3px 4px', margin: '8px 0 0 8px', borderRadius: '6px' }} > {label} </a>
      </Link>
    );
  };

	return (

	<div>

		<a target="_blank" href="https://www.websdrbordeaux.fr" className="navbar-brand" style={{ position: 'absolute' , marginLeft: '4px' }}> <img src="../static/logo-rond.png" height="38" /> </a>

		<nav className="navbar fixed-top navbar-toggleable-md navbar-light bg-faded" style={{ margin: '0 auto' ,  maxWidth: '582px' , borderBottomLeftRadius: '16px' , borderBottomRightRadius: '16px' }}>
			<button className="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
				<span className="navbar-toggler-icon" />
			</button>

			<div className="collapse navbar-collapse" id="navbarSupportedContent" style={{ textAlign: 'center' , margin: '0 auto' , left: '0' , right: '0' }}>

				<ul className="navbar-nav mr-auto" style={{ lineHeight: '2' , fontSize: '20px' }}>

					<li className="nav-item"> <NavLink href="/mobile" label="Accueil" /> </li>

          <li className="nav-item"> <NavLink href="/dtmfMob" label="Dtmf" /> </li>

          <li className="nav-item"> <NavLink href="/configurationMob" label="Configuration" /> </li>

          <li className="nav-item"> <NavLink href="/statusMob" label="Status" /> </li>

          <li className="nav-item"> <NavLink href="/adminMob" label="Admin" /> </li>

          <li className="nav-item"> <NavLink href="/liensMob" label="Liens" /> </li>

          <li className="nav-item"> <NavLink href="/infosMob" label="Infos" /> </li>

        </ul>

      </div>

		</nav>

	</div>
	)
}
export default Navigation