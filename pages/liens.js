import React from 'react'
import Layout from '../components/Layout'
import { motion } from 'framer-motion';

const Items1 = [
  { name: 'Image sat', img: 'sat.gif', link: 'https://www.sat24.com/en-gb/country/fr' },
  { name: 'Impact foudre', img: 'foudre.gif', link: 'https://www.lightningmaps.org/#m=oss;t=3;s=0;o=1;b=8.30;ts=0;d=2;dl=9;dc=0;z=7;y=46.657;x=1.1206;' },
  { name: 'F6ZCF', img: 'F6ZCF.png', link: 'http://f6zcf.websdrbordeaux.fr:88' },
  { name: 'iGate Aprs', img: 'aprs.gif', link: 'https://aprs.fi/#!mt=roadmap&z=11&lat=44.83990&lng=-0.49290' },
  { name: 'Carte vent', img: 'vent.gif', link: 'https://fr.windfinder.com/#5/47.6654/-0.2637' },
];

const items2 = [
  { name: 'F4jpc', img: 'niko.jpg', link: 'https://www.youtube.com/@F4JPC' },
  { name: 'F4jjb', img: 'maxime.jpg', link: 'https://www.youtube.com/@f4jjb/featured' },
  { name: 'Forum Odr', img: 'odr.jpg', link: 'https://les-ondes-du-routier.soforums.com/index.php' },
  { name: 'F6kpw', img: 'kpw-2.png', link: 'http://radio.f6kpw.fr/accueil.php' },
  { name: 'F4jgl', img: 'saxon33.jpg', link: 'https://sites.google.com/view/projet-14ham-dk2/accueil' },
  { name: 'Sav radio 33', img: 'sav.jpg', link: 'http://www.sav-radio33.eu' },
  { name: 'R.a.g Ref 33', img: 'ref33-2.jpg', link: 'https://rag-ref33.r-e-f.org' },
  { name: 'F5svp', img: 'svp.png', link: 'https://www.youtube.com/channel/UCoMqj_Xtdo226S3_GWNROQw' },
  { name: 'Asso Fcba', img: 'fcba.png', link: 'http://fcba33.e-monsite.com' },
  { name: 'Gascon', img: 'gascon.jpg', link: 'https://qsodesgascons.fr' },
];

const randomizeOffsets = (arr) =>
  arr.map(item => ({
    ...item,
    x: Math.floor(Math.random() * 448 - 186),
    y: Math.floor(Math.random() * 448 - 186),
  }));

const randomizedItems1 = randomizeOffsets(Items1);
const randomizedItems2 = randomizeOffsets(items2);

export default () => (

  <Layout>

    <div style={{ textAlign: 'center', marginTop: '6px' }}>
      <div style={{ textAlign: 'center', margin: '0 auto' }}>

        <motion.div style={{ display: 'inline-block' }} initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="http://ham.websdrbordeaux.fr:8000" target="_blank" rel="noopener noreferrer"> <img src="../static/drapeau.gif" className="zoom" style={{ borderRadius: '18px', marginRight: '4px', width: '80px', height: '80px' }}/> </a>
        </motion.div>

        <span style={{ display: 'inline-block', width: '208px' }}/>

        <motion.div style={{ display: 'inline-block' }} initial={{ y: -400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="https://www.facebook.com/groups/490497292936258" target="_blank" rel="noopener noreferrer"> <img src="../static/facebook2.png" className="zoom" style={{ borderRadius: '18px', width: '80px' }}/> </a>
        </motion.div>

        <span style={{ display: 'inline-block', width: '208px' }} />

        <motion.div style={{ display: 'inline-block' }} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="http://freebands.websdrbordeaux.fr:9000" target="_blank" rel="noopener noreferrer"> <img src="../static/drapeau.gif" className="zoom" style={{ borderRadius: '18px', marginLeft: '4px', width: '80px', height: '80px' }}/> </a>
        </motion.div>

      </div>

      <motion.div style={{ paddingTop: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}>
        <span style={{ color: 'transparent', marginLeft: '7px' }}>12</span>
        <span style={{ marginRight: '200px' }}>
          <a href="http://ham.websdrbordeaux.fr:8000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Ham</a>
        </span>
        <span>
          <a href="https://www.facebook.com/groups/490497292936258" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Groupe Facebook</a>
        </span>
        <span style={{ marginLeft: '180px' }}>
          <a href="http://freebands.websdrbordeaux.fr:9000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Freebands</a>
        </span>
      </motion.div>

      <div style={{ marginTop: '114px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>

        <motion.div initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2 }}> <a href="http://adsb.websdrbordeaux.fr:8504" target="_blank"> <img src="../static/adsb.png" className="zoom" style={{ borderRadius: '18px', marginRight: '38px', width: '80px' }}/> </a>
        </motion.div>

        <span style={{ display: 'inline-block', width: '154px' }} />

        <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }}> <a href="http://www.websdrbordeaux.fr/index6.html" target="_blank"> <img src="../static/ogn.jpg" className="zoom" style={{ borderRadius: '18px', width: '80px', height: '80px' }}/> </a>
        </motion.div>

        <span style={{ display: 'inline-block', width: '148px' }} />

        <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }}> <a href="http://openwebrx.websdrbordeaux.fr:86" target="_blank"> <img src="../static/open.jpg" className="zoom" style={{ borderRadius: '18px', width: '80px', height: '80px' }}/> </a>
        </motion.div>

        <span style={{ display: 'inline-block', width: '154px' }} />

        <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.2 }}> <a href="http://autorx.websdrbordeaux.fr:5000" target="_blank"> <img src="../static/sonde.png" className="zoom" style={{ borderRadius: '18px', marginLeft: '40px', width: '80px' }}/> </a>
        </motion.div>

      </div>

      <motion.div style={{ paddingTop: '22px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}>
        <a href="http://adsb.websdrbordeaux.fr:8504" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 4px 0 8px', margin: '0 198px 0 2px' }} target="_blank">Ads-B</a>
        <a href="http://www.websdrbordeaux.fr/index6.html" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Open Glider</a>
        <a href="http://openwebrx.websdrbordeaux.fr:86" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px', marginLeft: '132px'}} target="_blank">Open Web Rx</a>
        <a href="http://autorx.websdrbordeaux.fr:5000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px', marginLeft: '180px' }} target="_blank">Auto Rx</a>
      </motion.div>

    </div>

    <div style={{ cursor: 'default', color: 'white', textAlign: 'center', marginTop: '128px' }}>
      {randomizedItems1.map((item, i) => ( <motion.span key={item.name} initial={{ opacity: 0, x: item.x, y: item.y }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1.6 + i * 0.15, duration: 1.2, ease: 'easeOut', }} style={{ display: 'inline-block', margin: '0 12px' }}> {item.name} &ensp; <a href={item.link} target="_blank" rel="noopener noreferrer"> <img src={`../static/${item.img}`} className="zoom" style={{ borderRadius: '6px', verticalAlign: 'middle' }}/> </a> </motion.span> ))}
    </div>

    <div style={{ color: 'white', textAlign: 'center', marginTop: '142px' }}>
      {randomizedItems2.map((item, i) => ( <motion.span key={item.name} initial={{ opacity: 0, x: item.x, y: item.y }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 2.2 + i * 0.15, duration: 1.2, ease: 'easeOut', }} style={{ display: 'inline-block', margin: '0 12px' }}> {item.name} &ensp; <a href={item.link} target="_blank" rel="noopener noreferrer"> <img src={`../static/${item.img}`} className="zoom" style={{ borderRadius: '6px', verticalAlign: 'middle' }}/> </a> </motion.span> ))}
    </div>

    <motion.div style={{ display: 'flex' , position: 'fixed' , bottom: '20px' , left: '50%' , transform: 'translateX(-50%)' , gap: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 0.64 }} whileHover={{ opacity: 1, transition: { duration: 0.18 } }} transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}>

      <span style={{ color: 'white' , position: 'absolute' , left: '-110px' , top: '8px' , cursor: 'default' }}> Partagez sur </span>

      <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${fixedUrlToShare}`, '_blank', 'width=600,height=400'); }} style={{ backgroundColor: '#1877F2', color: 'white', padding: '10px 9px 1px 9px', border: 'none', borderRadius: '10px', cursor: 'pointer' , transition: 'background-color 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#166FE5'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1877F2'} >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" > <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.812c-3.268 0-4.188 1.504-4.188 4.035v2.965z"/> </svg>
      </button>

      <button onClick={() => { const message = encodeURIComponent("Dashboard officiel réseaux Pmr446MHz : "); window.open(`https://wa.me/?text=${message}${fixedUrlToShare}`, '_blank', 'width=600,height=400'); }} style={{ backgroundColor: '#25D366', color: 'white', padding: '8px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', transition: 'background-color 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1DA851'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#25D366'} >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" >
          <path d="M12.031 6.031c-3.344 0-6.062 2.719-6.062 6.062s2.719 6.062 6.062 6.062 6.062-2.719 6.062-6.062-2.719-6.062-6.062-6.062zm0 10.938c-2.688 0-4.875-2.188-4.875-4.875s2.188-4.875 4.875-4.875 4.875 2.188 4.875 4.875-2.188 4.875-4.875 4.875zm-.031-8.719c-.656 0-1.188.531-1.188 1.188s.531 1.188 1.188 1.188c.656 0 1.188-.531 1.188-1.188s-.531-1.188-1.188-1.188zm-2.312 2.375c-.281.281-.719.344-1.062.156-.344-.188-.438-.625-.156-.906.281-.281.719-.344 1.062-.156.344.188.438.625.156.906zm4.625 0c-.281.281-.719.344-1.062.156-.344-.188-.438-.625-.156-.906.281-.281.719-.344 1.062-.156.344.188.438.625.156.906zm-2.312 4.625c-.281-.281-.344-.719-.156-1.062.188-.344.625-.438.906-.156.281.281.344.719.156 1.062-.188.344-.625.438-.906.156zm-4.906-.188c-.281-.281-.344-.719-.156-1.062.188-.344.625-.438.906-.156.281.281.344.719.156 1.062-.188.344-.625.438-.906.156zm4.906-4.625c-.281.281-.719.344-1.062.156-.344-.188-.438-.625-.156-.906.281-.281.719-.344 1.062-.156.344.188.438.625.156.906z"/> <path d="M12 0c-6.625 0-12 5.375-12 12s5.375 12 12 12 12-5.375 12-12-5.375-12-12-12zm0 22.812c-5.969 0-10.812-4.844-10.812-10.812s4.844-10.812 10.812-10.812 10.812 4.844 10.812 10.812-4.844 10.812-10.812 10.812z"/> </svg>
      </button>

    </motion.div>

  </Layout>
)