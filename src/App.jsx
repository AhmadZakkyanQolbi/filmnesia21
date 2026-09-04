import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Movies from './pages/Movies.jsx'
import TV from './pages/TV.jsx'
import Comments from './components/Comments.jsx'
import VisitorCounter from './components/VisitorCounter.jsx'
import Splash from './pages/Splash.jsx'
import styles from './App.module.css'

// ==========================================
// ✅ ERROR BOUNDARY - CEGAH CRASH
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px' }}>⚠️</h1>
          <h2 style={{ color: '#ff6b6b' }}>Terjadi Kesalahan</h2>
          <p style={{ color: '#888' }}>Silakan refresh halaman</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 40px',
              background: '#c8a96e',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '20px'
            }}
          >
            🔄 Refresh Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function clearMovieSession() {
  ['mv_query', 'mv_player'].forEach(k => sessionStorage.removeItem(k))
}

export default function App() {
  const [tab, setTab] = useState(() => sessionStorage.getItem('cs_tab') || 'movies')
  const [homeKey, setHomeKey] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('filmnesia21_visited')
    if (hasVisited) {
      setShowSplash(false)
    }
  }, [])

  const handleEnter = () => {
    sessionStorage.setItem('filmnesia21_visited', 'true')
    setShowSplash(false)
  }

  function goTab(t) {
    setTab(t)
    sessionStorage.setItem('cs_tab', t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome() {
    clearMovieSession()
    setTab('movies')
    sessionStorage.setItem('cs_tab', 'movies')
    setHomeKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (showSplash) {
    return <Splash onEnter={handleEnter} />
  }

  return (
    <ErrorBoundary>
      <>
        <Helmet>
          <html lang="id" />
          <title>Filmnesia 21 - Nonton Film & TV Series Gratis Subtitle Indonesia</title>
          <meta name="description" content="Nonton streaming film dan TV series gratis dengan subtitle Indonesia. Ribuan film Hollywood, Drakor, Anime, dan Film Indonesia terlengkap. Filmnesia 21 - Nonton Gratis Tanpa Batas." />
          <meta name="keywords" content="nonton film gratis, streaming film indonesia, drakor subtitle indonesia, anime sub indo, film hollywood, filmnesia 21, nonton online gratis" />
          <link rel="canonical" href="https://filmnesia21.website/" />
          
          <meta property="og:title" content="Filmnesia 21 - Nonton Film & TV Series Gratis Subtitle Indonesia" />
          <meta property="og:description" content="Nonton streaming film dan TV series gratis dengan subtitle Indonesia. Ribuan film Hollywood, Drakor, Anime, dan Film Indonesia terlengkap." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://filmnesia21.website/" />
          <meta property="og:image" content="https://filmnesia21.website/og-image.jpg" />
          <meta property="og:site_name" content="Filmnesia 21" />
          <meta property="og:locale" content="id_ID" />
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Filmnesia 21 - Nonton Film & TV Series Gratis" />
          <meta name="twitter:description" content="Nonton streaming film dan TV series gratis dengan subtitle Indonesia." />
          <meta name="twitter:image" content="https://filmnesia21.website/og-image.jpg" />
          
          <meta name="robots" content="index, follow" />
          
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': 'Filmnesia 21',
              'url': 'https://filmnesia21.website/',
              'description': 'Nonton streaming film dan TV series gratis dengan subtitle Indonesia. Ribuan film Hollywood, Drakor, Anime, dan Film Indonesia terlengkap.',
              'inLanguage': 'id',
              'potentialAction': {
                '@type': 'SearchAction',
                'target': 'https://filmnesia21.website/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })}
          </script>
        </Helmet>

        <div className={styles.app}>
          <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
            <div className={styles.headerLeft}>
              <button className={styles.logo} onClick={goHome} aria-label="Go to home">
                <span className={styles.logoAccent}>FILMNESIA</span>
                <span className={styles.logoDot}>·</span>
                <span className={styles.logoText}>21</span>
              </button>
              <span className={styles.tagline}>
                Nonton Film & Series Gratis • Drakor • Anime • Movies • TV Series
              </span>
            </div>
            
            <nav className={styles.tabs}>
              <button
                className={`${styles.tab} ${tab === 'movies' ? styles.active : ''}`}
                onClick={() => goTab('movies')}
              >
                <span className={styles.tabIcon}>🎬</span>
                Movies
              </button>
              <button
                className={`${styles.tab} ${tab === 'tv' ? styles.active : ''}`}
                onClick={() => goTab('tv')}
              >
                <span className={styles.tabIcon}>📺</span>
                TV Series
              </button>
            </nav>
          </header>

          <main className={styles.main}>
            {tab === 'movies' && (
              <VisitorCounter />
            )}

            {tab === 'movies' && homeKey === 0 && (
              <div className={styles.hero}>
                <div className={styles.streamingBadge}>
                  🎬 <span className={styles.highlight}>Nonton Gratis</span> • Subtitle Indonesia
                </div>
                <h1 className={styles.heroTitle}>
                  Nonton Film & TV Series <br />
                  <span className={styles.gold}>Gratis Tanpa Batas</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  🇮🇩 Film Indonesia • 🇰🇷 Drakor • 🇯🇵 Anime • 🎬 Hollywood
                </p>
                <p className={styles.heroDescription}>
                  Ribuan film dan series terbaik dengan subtitle Indonesia. 
                  Streaming gratis, kualitas HD, update setiap hari!
                </p>
                <p className={styles.heroContact}>
                  📧 For Business / Contact : <a href="mailto:filmnesia21@gmail.com">filmnesia21@gmail.com</a>
                </p>
              </div>
            )}
            
            {tab === 'movies'
              ? <Movies key={homeKey} />
              : <TV />
            }

            {tab === 'movies' && homeKey === 0 && (
              <Comments />
            )}
          </main>

          <footer className={styles.footer}>
            <div className={styles.footerContent}>
              <div className={styles.footerBrand}>
                <span className={styles.footerLogo}>FILMNESIA<span className={styles.footerLogoAccent}>·</span>21</span>
                <span className={styles.footerTagline}>Nonton Film & Series Gratis • Drakor • Anime • Movies • TV Series</span>
              </div>
              <p className={styles.footerText}>
                &copy; {new Date().getFullYear()} All rights reserved
                <span className={styles.footerDivider}>•</span>
                {/* ✅ FIX: href="#" diubah menjadi href="/" */}
                <a href="/" className={styles.footerLink}>FILMNESIA 21</a>
                <span className={styles.footerDivider}>•</span>
                <span className={styles.footerSub}>Digital Entertainment Democratized</span>
                <span className={styles.footerDivider}>•</span>
                <span className={styles.footerEmail}>
                  📧 <a href="mailto:filmnesia21@gmail.com">filmnesia21@gmail.com</a>
                </span>
              </p>
            </div>
          </footer>
        </div>
      </>
    </ErrorBoundary>
  )
}