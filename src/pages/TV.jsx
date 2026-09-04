import React, { useState, useEffect, useRef } from 'react'
import { 
  api, 
  formatRating, 
  getYear, 
  getGenreStringFromGroup,
  getSmartTvUrl,
  GENRE_NAMES,
  posterUrl
} from '../lib/api.js'
import MediaGrid from '../components/MediaGrid.jsx'
import Player from '../components/Player.jsx'
import VideoPlayer from '../components/VideoPlayer.jsx'
import SeasonPicker from '../components/SeasonPicker.jsx'
import FilterBar from '../components/FilterBar.jsx'
import SEO from '../components/SEO.jsx'
import styles from './TV.module.css'

function persist(key, val) { 
  try { sessionStorage.setItem(key, JSON.stringify(val)) } catch {} 
}
function hydrate(key) { 
  try { 
    const v = sessionStorage.getItem(key); 
    return v ? JSON.parse(v) : null 
  } catch { return null } 
}

export default function TV() {
  const [query, setQuery] = useState(() => hydrate('tv_query') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState(() => hydrate('tv_selected'))
  const [player, setPlayer] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [filter, setFilter] = useState(() => hydrate('tv_filter') || null)
  const [indonesianResults, setIndonesianResults] = useState([])
  const [showIndonesian, setShowIndonesian] = useState(false)
  const [showSubtitleNotice, setShowSubtitleNotice] = useState(true)
  const [seoData, setSeoData] = useState({
    title: 'Nonton TV Series Gratis - Filmnesia 21',
    description: 'Nonton streaming TV series gratis dengan subtitle Indonesia. Drama Korea, Anime, dan Series terbaik.',
    type: 'tv'
  })
  const playerAnchorRef = useRef(null)
  const didRestore = useRef(false)
  const searchInputRef = useRef(null)

  // DAFTAR SERIES INDONESIA - HANYA YANG VALID (TIDAK 404)
  const INDONESIAN_TV = [
    208988, // Wedding Agreement the Series
    231637, // Cinta setelah Cinta
    231638, // My Nerd Girl
    231641, // Buku Harian Seorang Istri
    231642, // Ikatan Cinta
    231643, // Jangan Bercerai Bunda
    231644, // Aku Bukan Ustazah
    231645, // Cinta Anak Sholeh
  ]

  const fetchIndonesianTV = async () => {
    try {
      console.log('🔄 Fetching Indonesian TV series...')
      const tvPromises = INDONESIAN_TV.map(id => api.tvDetails(id))
      const shows = await Promise.allSettled(tvPromises)
      const validShows = shows
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
      console.log(`✅ Found ${validShows.length} Indonesian TV series`)
      return validShows
    } catch (error) {
      console.error('Error fetching Indonesian TV:', error)
      return []
    }
  }

  const fetchWithFilter = async (p = 1, append = false) => {
    try {
      let d
      if (query) {
        d = await api.searchTV(query, p)
      } else if (filter) {
        const genreIds = getGenreStringFromGroup(filter)
        console.log(`🔍 Fetching with filter: ${filter}, genre IDs: ${genreIds}`)
        d = await api.discoverTV(p, genreIds)
      } else {
        d = await api.trendingTV(p)
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
      
      const indoShows = await fetchIndonesianTV()
      setIndonesianResults(indoShows)
      
      const savedQuery = hydrate('tv_query') || ''
      const savedFilter = hydrate('tv_filter') || null
      
      if (savedFilter) {
        setFilter(savedFilter)
        setShowIndonesian(false)
        await fetchWithFilter(1, false)
      } else if (savedQuery) {
        setQuery(savedQuery)
        setShowIndonesian(false)
        await fetchWithFilter(1, false)
      }
      setLoading(false)
    }
    loadInitial()
  }, [])

  useEffect(() => {
    if (didRestore.current) return
    const savedPlayer = hydrate('tv_player')
    if (savedPlayer) {
      setPlayer(savedPlayer)
      setShowPicker(false)
      didRestore.current = true
    }
  }, [])

  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter)
    persist('tv_filter', newFilter)
    setLoading(true)
    setResults([])
    setPage(1)
    
    if (newFilter) {
      setShowIndonesian(false)
      await fetchWithFilter(1, false)
    } else {
      setShowIndonesian(false)
      await fetchWithFilter(1, false)
    }
    setLoading(false)
  }

  async function search(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResults([])
    setShowIndonesian(false)
    setPage(1)
    persist('tv_query', q)
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

  function selectShow(item) {
    setSelected(item)
    persist('tv_selected', item)
    setShowPicker(true)
    setPlayer(null)
    setShowSubtitleNotice(true)
    
    setSeoData({
      title: `Nonton ${item.name} (${getYear(item.first_air_date)}) - Sub Indo`,
      description: item.overview?.slice(0, 160) || `Nonton series ${item.name} dengan subtitle Indonesia. Streaming gratis kualitas HD.`,
      type: 'tv',
      image: posterUrl(item.poster_path, true),
      rating: formatRating(item.vote_average),
      year: getYear(item.first_air_date),
      genre: item.genre_ids?.map(id => GENRE_NAMES[id]).filter(Boolean).join(', '),
      tags: [item.name, getYear(item.first_air_date), 'Sub Indo', 'Nonton Series']
    })
    
    setTimeout(() => {
      document.getElementById('season-picker-anchor')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }, 80)
  }

  async function handlePlay(season, episode) {
    if (!selected) return
    
    try {
      const result = await getSmartTvUrl(selected.id, season, episode)
      
      if (result.type === 'hls') {
        setPlayer({
          type: 'hls',
          hlsUrl: result.hlsUrl,
          subtitles: result.subtitles || [],
          title: selected.name,
          year: getYear(selected.first_air_date),
          rating: formatRating(selected.vote_average),
          overview: selected.overview?.slice(0, 220),
          badge: `S${season} · E${episode}`,
          selectedId: selected.id,
        })
      } else {
        setPlayer({
          type: 'iframe',
          src: result.src,
          title: selected.name,
          year: getYear(selected.first_air_date),
          rating: formatRating(selected.vote_average),
          overview: selected.overview?.slice(0, 220),
          badge: `S${season} · E${episode}`,
          selectedId: selected.id,
          provider: result.provider,
        })
      }
      setShowSubtitleNotice(false)
    } catch (error) {
      console.error('Error playing episode:', error)
      setPlayer({
        type: 'iframe',
        src: `https://api.codespecters.com/embed/tv/${selected.id}/${season}/${episode}?apikey=nx_f32590c3172aa9dcfabc0e4edb537f53`,
        title: selected.name,
        year: getYear(selected.first_air_date),
        rating: formatRating(selected.vote_average),
        overview: selected.overview?.slice(0, 220),
        badge: `S${season} · E${episode}`,
        selectedId: selected.id,
        provider: 'nexstream',
      })
      setShowSubtitleNotice(false)
    }
    
    persist('tv_player', player)
    setTimeout(() => {
      playerAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function closePlayer() {
    setPlayer(null)
    persist('tv_player', null)
    setShowSubtitleNotice(true)
  }

  const hasMore = page < totalPages && totalPages > 0
  const savedQuery = hydrate('tv_query') || ''
  const label = savedQuery ? 'Results' : filter || '🔥 Trending Now'
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
              placeholder="Cari Series, Drama Korea, Anime lengkap disini"
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

        {!player && showSubtitleNotice && selected && (
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
          type="tv"
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

        {selected && showPicker && (
          <div id="season-picker-anchor">
            <SeasonPicker show={selected} onPlay={handlePlay} />
          </div>
        )}

        <div className={styles.labelWrap}>
          <div className={styles.labelLeft}>
            <p className={styles.sectionLabel}>{label}</p>
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
          type="tv"
          loading={loading}
          onSelect={selectShow}
          selectedId={selected?.id}
          hasMore={!showIndonesian && hasMore}
          onLoadMore={loadMore}
          loadingMore={loadingMore}
          totalResults={displayTotal}
        />
      </div>
    </>
  )
}