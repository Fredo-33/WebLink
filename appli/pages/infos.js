import React from 'react'
import Layout from '../components/Layout'
import { useTheme, ThemeToggle } from '../lib/themeContext'

export default (props) => {
  const { theme } = useTheme();

  return (
    <Layout version={props.version}>

      <div className="themeToggle"> <ThemeToggle /> </div>

      <div className="logoWrap"> <img src="../static/logoRond2.png" className="logo" /> </div>

      <div className="module">

        <div className="headRow">
          <span className="headTitle">WebLink</span>
          <a href="https://github.com/Fredo-33?tab=repositories" target="_blank" className="link linkGithub">
            <img src="../static/github.png" className="github" /> Fredo-33
          </a>
        </div>

        <div className="infoTable">

          <div className="infoRow">
            <span className="infoKey">Projet</span>
            <span className="infoVal">Distribution hotspots · Créée par Frédo pour le "WebSdr Bordeaux"</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Licence</span>
            <span className="infoVal">
              <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" className="link">GPL-3.0</a>
              {' '}· Version modifiée et étendue de Spotnik Gui
            </span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Développement</span>
            <span className="infoVal">Frédo</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Distrib &amp; packaging</span>
            <span className="infoVal">Frédo · Base Armbian</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Svxlink</span>
            <span className="infoVal">
              Tobias · <a href="http://www.svxlink.org" target="_blank" className="link">www.svxlink.org</a>
            </span>
          </div>

          <div className="infoRow infoRowLast">
            <span className="infoKey">Sons</span>
            <span className="infoVal">Frédo</span>
          </div>

        </div>

        <div className="sectionTitle">Historique</div>

        <div className="infoTable">

          <div className="infoRow">
            <span className="infoKey">Basé à l'origine sur</span>
            <span className="infoVal infoValIcon">
              <img src="../static/spotnik.svg" height="20" className="spotnik" />
              <a href="http://spotnik.org" target="_blank" className="link">Spotnik</a>
            </span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Spotnik Gui</span>
            <span className="infoVal">
              Sonny Piers &amp; F4GBV Isabelle · {' '}
              <a href="https://github.com/spotnik-ham/gui/blob/master/LICENSE" target="_blank" className="link">GPL-3.0</a>
              {' '}· <a href="https://github.com/spotnik-ham/gui" target="_blank" className="link">Github</a>
            </span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Développement Spotnik</span>
            <span className="infoVal">F1EVM Jean-Francois</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Scripts d'origine</span>
            <span className="infoVal">F1EVM Jean-Francois, F4HWN Armel, F5NLG Jean-Philippe</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Distrib d'origine</span>
            <span className="infoVal">F5NLG Jean-Philippe</span>
          </div>

          <div className="infoRow">
            <span className="infoKey">Sons d'origine</span>
            <span className="infoVal">F5VMR Chris, F8ASB Juan</span>
          </div>

          <div className="infoRow infoRowLast">
            <span className="infoKey">Remerciements</span>
            <span className="infoVal">Beta testeurs · Merci à tous, nos excuses si nous oublions quelqu&apos;un</span>
          </div>

        </div>

        <div className="pulse" />

      </div>

<style jsx>{`

.themeToggle { position: fixed; top: 20px; right: 20px; z-index: 100; }

.module { max-width: 748px; margin: 0 auto; background-color: ${theme.moduleBg}; padding: 28px 52px; border-radius: 84px; box-shadow: ${theme.shadow}; cursor: default; }

.logoWrap { text-align: center; margin: -100px 0 46px 0; }

.logo { width: 168px; height: auto; opacity: 0; filter: blur(4px); transform: scale(1.1); animation: pixelIn 2.4s forwards; }

@keyframes pixelIn { 0% { opacity: 0; filter: blur(4px); transform: scale(1.1); } 100% { opacity: 1; filter: blur(0); transform: scale(1); } }

.headRow { display: flex; align-items: center; justify-content: center; gap: 28px; margin-bottom: 20px; }

.headTitle { font-size: 18px; font-weight: 600; color: ${theme.accentRed}; }

.sectionTitle { font-size: 14px; text-transform: uppercase; letter-spacing: 1.2px; color: ${theme.textSecondary}; text-align: center; margin: 22px 0 10px 0; opacity: 0.8; }

.infoTable { background: ${theme.cardBg}; border: 0.6px solid ${theme.cardBorder}; border-radius: 28px; overflow: hidden; }

.infoRow { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 10px 16px; border-bottom: 0.48px solid ${theme.cardBorder}; }

.infoRowLast { border-bottom: none; }

.infoKey { font-size: 14.8px; color: ${theme.textPrimary}; flex-shrink: 0; min-width: 140px; }

.infoVal { font-size: 14.8px; color: ${theme.textSecondary}; text-align: right; line-height: 1.6; }

.infoValIcon { display: inline-flex; align-items: center; gap: 8px; align-self: center; }

.spotnik { transition: all 0.84s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }

.spotnik:hover { transform: rotate(360deg) scale(1.2); filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8)); }

.link { color: #4ade80; text-decoration: none; }

.link:hover { color: ${theme.accentRed}; }

.linkGithub { display: inline-flex; align-items: center; gap: 6px; font-size: 14.8px; position: absolute; margin-left: 428px; }

.github { height: 18px; vertical-align: middle; transition: transform 0.24s ease; }

.github:hover { transform: rotate(-16deg) scale(1.1); }

.pulse { width: 100%; height: 4px; margin-top: 20px; background: linear-gradient(90deg, transparent 0%, ${theme.isDark ? 'rgba(255,0,0,0.18)' : 'rgba(200,0,0,0.12)'} 25%, ${theme.isDark ? 'rgba(255,60,60,0.68)' : 'rgba(220,0,0,0.28)'} 50%, ${theme.isDark ? 'rgba(255,0,0,0.22)' : 'rgba(200,0,0,0.12)'} 75%, transparent 100% ); border-radius: 0 0 56px 56px; animation: gradientPulse 4.6s ease-in-out infinite; }

@keyframes gradientPulse { 0%, 100% { opacity: 0.1; transform: scaleY(0.6); } 50% { opacity: 0.56; transform: scaleY(1.1); } }

`}</style>

    </Layout>
  )
}