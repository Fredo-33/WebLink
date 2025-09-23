import React from 'react'
import Layout from '../components/LayoutMob'
import { motion } from 'framer-motion';

export default () => (

  <Layout>

    <div style={{ textAlign: 'center' , marginTop: '68px' }}>
      <h8 style={{ cursor: 'default' , textAlign: 'center' , margin: '0 auto' }}>

        <motion.div style={{ display: 'inline-block' }} initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="http://ham.websdrbordeaux.fr:8000" target="_blank"> <img src="../static/drapeau.gif" style={{ borderRadius: '18px' , width: '60px', height: '60px' }} /> </a>
        </motion.div>

        <span>&emsp; &emsp;</span>

        <motion.div style={{ display: 'inline-block' }} initial={{ y: -400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="https://www.facebook.com/groups/490497292936258" target="_blank"> <img src="../static/facebook2.png" style={{ borderRadius: '18px', width: '60px' }} /> </a>
        </motion.div>

        <span>&emsp; &emsp;</span>

        <motion.div style={{ display: 'inline-block' }} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}> <a href="http://freebands.websdrbordeaux.fr:9000" target="_blank"> <img src="../static/drapeau.gif" style={{ borderRadius: '18px', width: '60px', height: '60px' }} /> </a>
        </motion.div>

      </h8>

      <motion.div style={{ paddingTop: '22px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}>
        <span style={{ color: 'transparent', marginLeft: '2px' }}>12</span>
        <span style={{ marginRight: '36px' }}>
          <a href="http://ham.websdrbordeaux.fr:8000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Ham</a>
        </span>
        <span>
          <a href="https://www.facebook.com/groups/490497292936258" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Facebook</a>
        </span>
        <span style={{ marginLeft: '20px' }}>
          <a href="http://freebands.websdrbordeaux.fr:9000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">Freebands</a>
        </span>
      </motion.div>

      <div style={{ marginTop: '58px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>

        <motion.div initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4 }}> <a href="http://adsb.websdrbordeaux.fr:8504" target="_blank"> <img src="../static/adsb.png" style={{ borderRadius: '18px', marginRight: '28px', width: '60px' }} /> </a>
        </motion.div>

        <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4 }}> <a href="http://www.websdrbordeaux.fr/index6.html" target="_blank">
          <img src="../static/ogn.jpg" style={{ borderRadius: '18px', marginRight: '28px', width: '60px', height: '60px' }} />
        </a>
        </motion.div>

        <motion.div initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4 }}> <a href="http://openwebrx.websdrbordeaux.fr:86" target="_blank"> <img src="../static/open.jpg" style={{ borderRadius: '18px', marginRight: '28px', width: '60px', height: '60px' }} /> </a>
        </motion.div>

        <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.4 }}> <a href="http://autorx.websdrbordeaux.fr:5000" target="_blank"> <img src="../static/sonde.png" style={{ borderRadius: '18px', marginRight: '8px', width: '60px' }} /> </a>
        </motion.div>

      </div>

      <motion.div style={{ paddingTop: '22px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}>
        <a href="http://adsb.websdrbordeaux.fr:8504" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 4px 0 8px', margin: '0 22px 0 2px' }} target="_blank">Ads-B</a>
        <a href="http://www.websdrbordeaux.fr/index6.html" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' }} target="_blank">O. Glider</a>
        <a href="http://openwebrx.websdrbordeaux.fr:86" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px' , marginLeft: '9px'}} target="_blank">O. Web Rx</a>
        <a href="http://autorx.websdrbordeaux.fr:5000" className="lien2" style={{ color: 'white', textDecoration: 'none', padding: '0 6px', margin: '0 5px 0 16px' }} target="_blank">Auto Rx</a>
      </motion.div>

    </div>

    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '82px' }}>
      <span style={{ marginLeft: '19px' }}> <a href="https://www.sat24.com/en-gb/country/fr" target="_blank"> <img src="../static/sat.gif" style={{ borderRadius: '6px' , width: '58px'}} /> </a> &ensp; Sat </span> &ensp; &ensp;
      <span style={{ marginLeft: '8px' }}> <a href="https://www.lightningmaps.org/#m=oss;t=3;s=0;o=1;b=8.30;ts=0;d=2;dl=9;dc=0;z=7;y=46.657;x=1.1206;" target="_blank"> <img src="../static/foudre.gif" style={{ borderRadius: '6px' , width: '58px'}} /> </a> &ensp; Foudre </span>
    </div>
    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '18px'}}>
      <span> <a href="https://aprs.fi/#!mt=roadmap&z=11&lat=44.83990&lng=-0.49290" target="_blank"> <img src="../static/aprs.gif" style={{ borderRadius: '6px' , width: '58px'}} /> </a> &ensp; Aprs </span> &ensp; &ensp;
      <span> <a href="https://fr.windfinder.com/#5/47.6654/-0.2637" target="_blank"> <img src="../static/vent.gif" style={{ borderRadius: '6px' , width: '58px' }} /> </a> &ensp; Vent </span>
    </div>

    <div style={{ cursor: 'default' }}>

    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '72px' }}>
      <span> <a href="https://www.youtube.com/@F4JPC" target="_blank"> <img src="../static/niko.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; F4jpc </span>
      <span> &emsp; &nbsp; <a href="https://www.youtube.com/@f4jjb/featured" target="_blank"> <img src="../static/maxime.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; F4jjb </span>
    </div>
    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '16px' }}>
      <span style={{ marginRight: '8px' }}> &emsp; &nbsp; <a href="https://les-ondes-du-routier.soforums.com/index.php" target="_blank"> <img src="../static/odr.jpg" style={{ borderRadius: '6px' , marginRight: '14px' }}/> </a> &ensp; Odr </span>
      <span style={{ marginRight: '14px' }}> &emsp; &nbsp; <a href="http://radio.f6kpw.fr/accueil.php" target="_blank"> <img src="../static/kpw-2.png" style={{ borderRadius: '6px' }}/> </a> &ensp; F6kpw </span>
    </div>
    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '16px' }}>
      <span style={{ margin: '0 6px 0 2px' }}> &emsp; &nbsp; <a href="https://sites.google.com/view/projet-14ham-dk2/accueil" target="_blank"> <img src="../static/saxon33.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; F4jgl </span>
      <span> &emsp; &nbsp; <a href="http://www.sav-radio33.eu" target="_blank"> <img src="../static/sav.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; Radio 33 </span>
    </div>
    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '16px' }}>
      <span> &emsp; &nbsp; <a href="https://www.youtube.com/channel/UCoMqj_Xtdo226S3_GWNROQw" target="_blank"> <img src="../static/svp.png" style={{ borderRadius: '6px' }}/> </a> &ensp; F5svp </span>
      <span style={{ marginRight: '5px' }}> &emsp; &nbsp; <a href="https://rag-ref33.r-e-f.org" target="_blank"> <img src="../static/ref33-2.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; R.a.g 33</span>
    </div>
    <div style={{ cursor: 'default' , color: 'white' , textAlign: 'center' , marginTop: '16px' , paddingBottom: '18px' }}>
      <span style={{ marginRight: '6px' }}> &emsp; &nbsp; <a href="http://fcba33.e-monsite.com" target="_blank"> <img src="../static/fcba.png" style={{ borderRadius: '6px' }}/> </a> &ensp; Fcba </span>
      <span style={{ marginRight: '6px' }}> &emsp; &nbsp; <a href="https://qsodesgascons.fr" target="_blank"> <img src="../static/gascon.jpg" style={{ borderRadius: '6px' }}/> </a> &ensp; Gascon </span>
    </div>

    </div>

  </Layout>
)