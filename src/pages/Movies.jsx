import React, { useState, useEffect, useRef } from 'react'
import { 
  api, 
  formatRating, 
  getYear, 
  getGenreStringFromGroup,
  getSmartMovieUrl,
  GENRE_NAMES,
  posterUrl
} from '../lib/api.js'
import MediaGrid from '../components/MediaGrid.jsx'
import Player from '../components/Player.jsx'
import VideoPlayer from '../components/VideoPlayer.jsx'
import FilterBar from '../components/FilterBar.jsx'
import SEO from '../components/SEO.jsx'
import styles from './Movies.module.css'

function persist(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)) } catch {}
}
function hydrate(key) {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null }
}

export default function Movies() {
  const savedQuery = hydrate('mv_query') || ''
  const savedPlayer = hydrate('mv_player')
  const savedFilter = hydrate('mv_filter') || null

  const [query, setQuery] = useState(savedQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [label, setLabel] = useState(savedQuery ? 'Results' : savedFilter || '🔥 Trending Now')
  const [player, setPlayer] = useState(savedPlayer)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [filter, setFilter] = useState(savedFilter)
  const [indonesianResults, setIndonesianResults] = useState([])
  const [showIndonesian, setShowIndonesian] = useState(false)
  const [showSubtitleNotice, setShowSubtitleNotice] = useState(true)
  const [seoData, setSeoData] = useState({
    title: 'Nonton Film Gratis - Filmnesia 21',
    description: 'Nonton streaming film gratis dengan subtitle Indonesia. Ribuan film Hollywood, Drakor, Anime, dan Film Indonesia terlengkap.',
    type: 'movie'
  })
  const playerAnchorRef = useRef(null)
  const searchInputRef = useRef(null)

  const INDONESIAN_MOVIES = [
    829704, 1005062, 1036313, 838088, 654140, 1013750, 1066015,
    593778, 497594, 572822, 1056712, 814788, 467454, 1070450, 1097430
  ]

  const fetchIndonesianMovies = async () => {
    try {
      console.log('🔄 Fetching Indonesian movies...')
      const moviePromises = INDONESIAN_MOVIES.map(id => api.movieDetails(id))
      const movies = await Promise.allSettled(moviePromises)
      const validMovies = movies
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
      console.log(`✅ Found ${validMovies.length} Indonesian movies`)
      return validMovies
    } catch (error) {
      console.error('Error fetching Indonesian movies:', error)
      return []
    }
  }

  const fetchWithFilter = async (p = 1, append = false) => {
    try {
      let d
      if (query) {
        d = await api.searchMovies(query, p)
      } else if (filter) {
        const genreIds = getGenreStringFromGroup(filter)
        console.log(`🔍 Fetching with filter: ${filter}, genre IDs: ${genreIds}`)
        d = await api.discoverMovies(p, genreIds)
      } else {
        d = await api.trendingMovies(p)
      }
      
      const newResults = d.results || []
      const uniqueResults = newResults.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      )
      
      setResults(prev => append ? [...prev, ...uniqueResults] : uniqueResults)
      setTotalPages(d.total_pages || 0)
      setTotalResults(d.total_results || 0)
      return d
    } catch (e) {
      console.error('Error fetching:', e)
      return null
    }
  }

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true)
      
      await fetchWithFilter(1, false)
      setShowIndonesian(false)
      
      const indoMovies = await fetchIndonesianMovies()
      setIndonesianResults(indoMovies)
      
      const savedQueryNow = hydrate('mv_query') || ''
      const savedFilterNow = hydrate('mv_filter') || null
      
      if (savedFilterNow) {
        setFilter(savedFilterNow)
        setShowIndonesian(false)
        await fetchWithFilter(1, false)
      } else if (savedQueryNow) {
        setQuery(savedQueryNow)
        setShowIndonesian(false)
        await fetchWithFilter(1, false)
      }
      setLoading(false)
    }
    loadInitial()
  }, [])

  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter)
    persist('mv_filter', newFilter)
    setLoading(true)
    setResults([])
    setPage(1)
    
    if (newFilter) {
      setShowIndonesian(false)
      await fetchWithFilter(1, false)
      setLabel(newFilter)
    } else {
      setShowIndonesian(false)
      await fetchWithFilter(1, false)
      setLabel('🔥 Trending Now')
    }
    setLoading(false)
  }

  async function search(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setLabel('Results')
    setResults([])
    setShowIndonesian(false)
    setPage(1)
    persist('mv_query', q)
    await fetchWithFilter(1, false)
    setLoading(false)
    searchInputRef.current?.focus()
  }

  async function loadMore() {
    if (loadingMore || page >= totalPages || showIndonesian) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    await fetchWithFilter(nextPage, true)
    setLoadingMore(false)
  }

  async function select(item) {
    try {
      // Update SEO
      setSeoData({
        title: `Nonton ${item.title} (${getYear(item.release_date)}) - Sub Indo`,
        description: item.overview?.slice(0, 160) || `Nonton film ${item.title} dengan subtitle Indonesia. Streaming gratis kualitas HD.`,
        type: 'movie',
        image: posterUrl(item.poster_path, true),
        rating: formatRating(item.vote_average),
        year: getYear(item.release_date),
        genre: item.genre_ids?.map(id => GENRE_NAMES[id]).filter(Boolean).join(', '),
        tags: [item.title, getYear(item.release_date), 'Sub Indo', 'Nonton Gratis']
      })

      const result = await getSmartMovieUrl(item.id)
      
      if (result.type === 'hls') {
        setPlayer({
          type: 'hls',
          hlsUrl: result.hlsUrl,
          subtitles: result.subtitles || [],
          title: item.title,
          year: getYear(item.release_date),
          rating: formatRating(item.vote_average),
          overview: item.overview?.slice(0, 220),
          selectedId: item.id,
        })
      } else {
        setPlayer({
          type: 'iframe',
          src: result.src,
          title: item.title,
          year: getYear(item.release_date),
          rating: formatRating(item.vote_average),
          overview: item.overview?.slice(0, 220),
          selectedId: item.id,
          provider: result.provider,
        })
      }
      setShowSubtitleNotice(false)
    } catch (error) {
      console.error('Error selecting movie:', error)
      setPlayer({
        type: 'iframe',
        src: `https://api.codespecters.com/embed/movie/${item.id}?apikey=nx_f32590c3172aa9dcfabc0e4edb537f53`,
        title: item.title,
        year: getYear(item.release_date),
        rating: formatRating(item.vote_average),
        overview: item.overview?.slice(0, 220),
        selectedId: item.id,
        provider: 'nexstream',
      })
      setShowSubtitleNotice(false)
    }
    
    persist('mv_player', player)
    setTimeout(() => {
      playerAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function closePlayer() {
    setPlayer(null)
    persist('mv_player', null)
    setShowSubtitleNotice(true)
  }

  const hasMore = page < totalPages && totalPages > 0
  const savedQueryNow = hydrate('mv_query') || ''
  const labelNow = savedQueryNow ? 'Results' : filter || '🔥 Trending Now'
  const displayItems = showIndonesian ? indonesianResults : results
  const displayTotal = showIndonesian ? indonesianResults.length : totalResults

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        image={seoData.image}
        type={seoData.type}
        rating={seoData.rating}
        year={seoData.year}
        genre={seoData.genre}
        tags={seoData.tags}
      />
      
      <div>
        <form className={styles.searchRow} onSubmit={search}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari film… (contoh: Avatar, Star Wars, Inception)"
              className={styles.input}
            />
            {query && (
              <button 
                type="button" 
                className={styles.clearBtn}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className={styles.btn}>
            <span className={styles.btnIcon}>✦</span>
            Search
          </button>
        </form>

        {!player && showSubtitleNotice && (
          <div className={styles.subtitleNotice}>
            <div className={styles.noticeLeft}>
              <div className={styles.noticeIconWrapper}>
                <span>🎬</span>
              </div>
            </div>
            <div className={styles.noticeContent}>
              <div className={styles.noticeTitle}>
                Pilih Subtitle & Ukuran Sebelum Nonton
                <span className={styles.badge}>PENTING</span>
              </div>
              <p className={styles.noticeDesc}>
                <span className={styles.step}>①</span> Klik tombol <strong>CC / Subtitle</strong> di player untuk pilih bahasa <span className={styles.highlight}>Indonesia</span>
                <br />
                <span className={styles.step}>②</span> Klik <strong>⚙️ Settings / Gear</strong> untuk atur <span className={styles.highlight}>ukuran subtitle</span>
                <br />
                <span className={styles.step}>③</span> Subtitle Indonesia tersedia untuk sebagian besar konten
              </p>
              <div className={styles.noticeTags}>
                <span className={`${styles.noticeTag} ${styles.active}`}>
                  <span className={styles.tagIcon}>🇮🇩</span> Subtitle Indonesia
                </span>
                <span className={styles.noticeTag}>
                  <span className={styles.tagIcon}>⚙️</span> Atur Ukuran
                </span>
                <span className={styles.noticeTag}>
                  <span className={styles.tagIcon}>💡</span> Tips Nonton
                </span>
              </div>
            </div>
          </div>
        )}

        <FilterBar 
          type="movie"
          onFilterChange={handleFilterChange}
          activeFilter={filter}
        />

        {player && (
          <div ref={playerAnchorRef}>
            {player.type === 'hls' ? (
              <>
                <div className={styles.playerNotice}>
                  <span className={styles.playerNoticeIcon}>💬</span>
                  <span className={styles.playerNoticeText}>
                    Gunakan tombol <strong>CC / Subtitle</strong> untuk pilih subtitle & 
                    <span className={styles.shortcut}>⚙️ Settings</span> untuk ukuran
                  </span>
                </div>
                <VideoPlayer
                  hlsUrl={player.hlsUrl}
                  subtitles={player.subtitles}
                  title={player.title}
                  year={player.year}
                  rating={player.rating}
                  overview={player.overview}
                  onClose={closePlayer}
                />
              </>
            ) : (
              <>
                <div className={styles.playerNotice}>
                  <span className={styles.playerNoticeIcon}>💬</span>
                  <span className={styles.playerNoticeText}>
                    Gunakan tombol <strong>CC / Subtitle</strong> untuk pilih subtitle & 
                    <span className={styles.shortcut}>⚙️ Settings</span> untuk ukuran
                  </span>
                </div>
                <Player 
                  src={player.src}
                  title={player.title}
                  year={player.year}
                  rating={player.rating}
                  overview={player.overview}
                  badge={player.badge || (player.provider ? `📡 ${player.provider}` : '')}
                  onClose={closePlayer}
                />
              </>
            )}
          </div>
        )}

        <div className={styles.labelWrap}>
          <div className={styles.labelLeft}>
            <p className={styles.sectionLabel}>{labelNow}</p>
            {displayTotal > 0 && (
              <span className={styles.resultCount}>
                {displayTotal.toLocaleString()} titles
              </span>
            )}
          </div>
          {displayItems.length > 0 && (
            <span className={styles.showingCount}>
              Showing {displayItems.length}
              {displayTotal > 0 && ` of ${displayTotal.toLocaleString()}`}
            </span>
          )}
        </div>

        <MediaGrid
          items={displayItems}
          type="movie"
          loading={loading}
          onSelect={select}
          selectedId={player?.selectedId}
          hasMore={!showIndonesian && hasMore}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          totalResults={displayTotal}
        />
      </div>
    </>
  )
}