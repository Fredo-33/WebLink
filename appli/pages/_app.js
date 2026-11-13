import App from 'next/app'
import fetch from '../lib/fetch'
import { ThemeProvider } from '../lib/themeContext'

async function getVersion() {
  return fetch('/api/version').then(res => res.text()).catch(() => 'N/A')
}

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

MyApp.getInitialProps = async (appContext) => {
  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(appContext.ctx);
  }
  const version = await getVersion();
  return { pageProps: { ...pageProps, version } };
}

export default MyApp