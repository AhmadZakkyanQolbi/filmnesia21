// ============================================
// KONFIGURASI - Environment Variables
// ============================================
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY
const EMBED_BASE = import.meta.env.VITE_EMBED_BASE || 'https://embed.nexstream.com'
const EMBED_API_KEY = import.meta.env.VITE_EMBED_API_KEY || ''

export const IMG_BASE = 'https://image.tmdb.org/t/p/w300'
export const IMG_BASE_LG = 'https://image.tmdb.org/t/p/w780'

// Import package untuk berbagai provider
import { buildMovieSources, buildTvSources, probeProvider } from 'tmdb-embed-providers'

// Import scraper untuk HLS + Subtitle
import { scrapeVidsrc } from '@definisi/vidsrc-scraper'

// ============================================
// VALIDASI & SANITASI
// ============================================
function validateTMDBId(id) {
  if (!id || !/^\d+$/.test(id.toString())) {
    throw new Error('Invalid TMDB ID format')
  }
  return parseInt(id)
}

function validateSeasonEpisode(season, episode) {
  if (season !== undefined && (!Number.isInteger(season) || season < 1)) {
    throw new Error('Invalid season number')
  }
  if (episode !== undefined && (!Number.isInteger(episode) || episode < 1)) {
    throw new Error('Invalid episode number')
  }
}

function sanitizeUrl(url) {
  if (!url) return null
  if (!url.startsWith('https://')) {
    console.warn('URL tidak aman (bukan HTTPS):', url)
    return null
  }
  
  const allowedDomains = [
    'vidcore.org',
    'nontongo.win',
    'autoembed.to',
    'vidsrc.me',
    'vidsrc.xyz',
    'embed.nexstream.com',
    'themoviedb.org'
  ]
  
  try {
    const urlObj = new URL(url)
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    )
    if (!isAllowed) {
      console.warn('Domain tidak diizinkan:', urlObj.hostname)
      return null
    }
    return url
  } catch {
    return null
  }
}

// ============================================
// TMDB FETCH
// ============================================
async function tmdbFetch(path) {
  if (!TMDB_KEY) {
    throw new Error('TMDB API key is not configured')
  }
  
  if (typeof path !== 'string' || path.length > 500) {
    throw new Error('Invalid path')
  }
  
  const sep = path.includes('?') ? '&' : '?'
  const url = `https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_KEY}`
  
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
    return res.json()
  } catch (error) {
    console.error('TMDB fetch error:', error)
    throw error
  }
}

// ============================================
// API OBJECT
// ============================================
export const api = {
  trendingMovies: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/trending/movie/week?page=${validPage}`)
  },
  searchMovies: (q, page = 1) => {
    if (!q || typeof q !== 'string') return Promise.reject(new Error('Search query required'))
    const sanitizedQuery = q.trim().slice(0, 100)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/search/movie?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}`)
  },
  movieDetails: (id) => {
    const validId = validateTMDBId(id)
    return tmdbFetch(`/movie/${validId}`)
  },
  discoverMovies: (page = 1, genre = '') => {
    const validPage = Math.max(1, parseInt(page) || 1)
    let url = `/discover/movie?sort_by=popularity.desc&page=${validPage}`
    if (genre) {
      const validGenre = String(genre).replace(/[^0-9,]/g, '')
      if (validGenre) url += `&with_genres=${validGenre}`
    }
    return tmdbFetch(url)
  },
  popularMovies: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/popular?page=${validPage}`)
  },
  topRatedMovies: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/top_rated?page=${validPage}`)
  },
  upcomingMovies: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/upcoming?page=${validPage}`)
  },
  nowPlayingMovies: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/now_playing?page=${validPage}`)
  },
  movieRecommendations: (id, page = 1) => {
    const validId = validateTMDBId(id)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/${validId}/recommendations?page=${validPage}`)
  },
  similarMovies: (id, page = 1) => {
    const validId = validateTMDBId(id)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/movie/${validId}/similar?page=${validPage}`)
  },
  getMovieGenres: () => tmdbFetch('/genre/movie/list'),
  
  // TV SHOWS
  trendingTV: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/trending/tv/week?page=${validPage}`)
  },
  searchTV: (q, page = 1) => {
    if (!q || typeof q !== 'string') return Promise.reject(new Error('Search query required'))
    const sanitizedQuery = q.trim().slice(0, 100)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/search/tv?query=${encodeURIComponent(sanitizedQuery)}&page=${validPage}`)
  },
  tvDetails: (id) => {
    const validId = validateTMDBId(id)
    return tmdbFetch(`/tv/${validId}`)
  },
  seasonDetails: (id, season) => {
    const validId = validateTMDBId(id)
    validateSeasonEpisode(season)
    return tmdbFetch(`/tv/${validId}/season/${season}`)
  },
  discoverTV: (page = 1, genre = '') => {
    const validPage = Math.max(1, parseInt(page) || 1)
    let url = `/discover/tv?sort_by=popularity.desc&page=${validPage}`
    if (genre) {
      const validGenre = String(genre).replace(/[^0-9,]/g, '')
      if (validGenre) url += `&with_genres=${validGenre}`
    }
    return tmdbFetch(url)
  },
  popularTV: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/popular?page=${validPage}`)
  },
  topRatedTV: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/top_rated?page=${validPage}`)
  },
  airingTodayTV: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/airing_today?page=${validPage}`)
  },
  onTheAirTV: (page = 1) => {
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/on_the_air?page=${validPage}`)
  },
  tvRecommendations: (id, page = 1) => {
    const validId = validateTMDBId(id)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/${validId}/recommendations?page=${validPage}`)
  },
  similarTV: (id, page = 1) => {
    const validId = validateTMDBId(id)
    const validPage = Math.max(1, parseInt(page) || 1)
    return tmdbFetch(`/tv/${validId}/similar?page=${validPage}`)
  },
  getTVGenres: () => tmdbFetch('/genre/tv/list'),
}

// ============================================
// 1. HLS + SUBTITLE SCRAPER
// ============================================
export async function getVideoWithSubtitles(tmdbId, type = 'movie', season, episode) {
  try {
    const validId = validateTMDBId(tmdbId)
    
    if (type !== 'movie' && type !== 'tv') {
      throw new Error('Invalid type. Must be "movie" or "tv"')
    }
    
    const result = await scrapeVidsrc(validId, type, { season, episode })
    
    if (result.success && result.hlsUrl) {
      const hlsUrl = sanitizeUrl(result.hlsUrl)
      if (!hlsUrl) {
        return { success: false, error: 'Invalid HLS URL' }
      }
      
      const validSubtitles = (result.subtitles || [])
        .filter(s => s.url && s.url.startsWith('https://'))
        .map(s => ({
          ...s,
          url: sanitizeUrl(s.url)
        }))
        .filter(s => s.url !== null)
      
      const indoSub = findIndonesianSubtitle(validSubtitles)
      
      return {
        hlsUrl,
        subtitles: validSubtitles,
        audioTracks: result.audioTracks || [],
        success: true,
        provider: 'vidsrc',
        hasSubtitle: validSubtitles.length > 0,
        hasIndonesianSubtitle: !!indoSub,
        selectedSubtitle: indoSub
      }
    }
    return { success: false, error: result.error || 'No HLS URL found' }
  } catch (error) {
    console.error('Error scraping video:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// 2. CARI SUBTITLE INDONESIA
// ============================================
export function findIndonesianSubtitle(subtitles) {
  if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) return null
  
  const priorityList = [
    'indonesian', 'indonesia', 'ind', 'id', 
    'bahasa indonesia', 'sub indo', 'indo',
    'indonesian (id)', 'id (indonesian)',
    'bahasa', 'indonesian (auto-generated)',
    'indonesian subtitles', 'id subtitles'
  ]
  
  const indoSub = subtitles.find(s => {
    if (!s || typeof s !== 'object') return false
    const label = (s.label || s.lang || '').toLowerCase()
    return priorityList.some(keyword => label.includes(keyword))
  })
  
  return indoSub || subtitles[0] || null
}

// ============================================
// 3. NEXSTREAM - FALLBACK
// ============================================
export function movieEmbedUrl(tmdbId) {
  try {
    const validId = validateTMDBId(tmdbId)
    const url = `${EMBED_BASE}/embed/movie/${validId}?apikey=${EMBED_API_KEY}`
    return sanitizeUrl(url)
  } catch (error) {
    console.error('Error creating movie embed URL:', error)
    return null
  }
}

export function tvEmbedUrl(tmdbId, season, episode) {
  try {
    const validId = validateTMDBId(tmdbId)
    validateSeasonEpisode(season, episode)
    const url = `${EMBED_BASE}/embed/tv/${validId}/${season}/${episode}?apikey=${EMBED_API_KEY}`
    return sanitizeUrl(url)
  } catch (error) {
    console.error('Error creating TV embed URL:', error)
    return null
  }
}

// ============================================
// 4. VIDCORE - SUBTITLE INDONESIA (PRIORITAS)
// ============================================
export function movieEmbedVidCore(tmdbId, options = {}) {
  try {
    const validId = validateTMDBId(tmdbId)
    
    const subtitle = 'id'
    const theme = 'dark'
    const quality = '480'
    const autoplay = true
    
    const url = `https://vidcore.org/embed/movie/${validId}`
    const params = new URLSearchParams({
      subtitle: subtitle,
      autoplay: 'true',
      theme: theme,
      logo: 'false',
      quality: quality
    })
    
    return sanitizeUrl(`${url}?${params.toString()}`)
  } catch (error) {
    console.error('Error creating VidCore URL:', error)
    return null
  }
}

export function tvEmbedVidCore(tmdbId, season, episode, options = {}) {
  try {
    const validId = validateTMDBId(tmdbId)
    validateSeasonEpisode(season, episode)
    
    const subtitle = 'id'
    const theme = 'dark'
    const quality = '480'
    const autoplay = true
    
    const url = `https://vidcore.org/embed/tv/${validId}/${season}/${episode}`
    const params = new URLSearchParams({
      subtitle: subtitle,
      autoplay: 'true',
      theme: theme,
      logo: 'false',
      quality: quality
    })
    
    return sanitizeUrl(`${url}?${params.toString()}`)
  } catch (error) {
    console.error('Error creating VidCore TV URL:', error)
    return null
  }
}

// ============================================
// 5. NONTONGO.WIN - SUBTITLE INDONESIA
// ============================================
export async function getNontongoMovieUrl(tmdbId) {
  try {
    const validId = validateTMDBId(tmdbId)
    
    const urls = buildMovieSources(validId, { ids: ['nontongo'] })
    if (urls && urls.length > 0) {
      const probe = await probeProvider('nontongo', { timeoutMs: 3000 })
      if (probe.status === 'alive') {
        const url = urls[0]
        const finalUrl = url.includes('?') ? `${url}&subtitle=id` : `${url}?subtitle=id`
        return sanitizeUrl(finalUrl)
      }
    }
    return null
  } catch (error) {
    console.error('Error getting nontongo movie URL:', error)
    return null
  }
}

export async function getNontongoTvUrl(tmdbId, season, episode) {
  try {
    const validId = validateTMDBId(tmdbId)
    validateSeasonEpisode(season, episode)
    
    const urls = buildTvSources(validId, season, episode, { ids: ['nontongo'] })
    if (urls && urls.length > 0) {
      const probe = await probeProvider('nontongo', { timeoutMs: 3000 })
      if (probe.status === 'alive') {
        const url = urls[0]
        const finalUrl = url.includes('?') ? `${url}&subtitle=id` : `${url}?subtitle=id`
        return sanitizeUrl(finalUrl)
      }
    }
    return null
  } catch (error) {
    console.error('Error getting nontongo TV URL:', error)
    return null
  }
}

// ============================================
// 6. SMART FALLBACK - PRIORITAS SUBTITLE
// ============================================
export async function getSmartMovieUrl(tmdbId) {
  try {
    const validId = validateTMDBId(tmdbId)
    console.log(`🔍 Fetching movie ${validId}...`)
    
    // PRIORITAS 1: HLS + Subtitle
    try {
      const result = await getVideoWithSubtitles(validId, 'movie')
      if (result.success && result.hlsUrl) {
        const indoSub = findIndonesianSubtitle(result.subtitles)
        console.log(`✅ Using HLS for movie ${validId}, subtitles: ${result.subtitles.length} tracks, indo: ${!!indoSub}`)
        return { 
          type: 'hls',
          hlsUrl: result.hlsUrl,
          subtitles: result.subtitles,
          selectedSubtitle: indoSub,
          hasIndonesianSubtitle: !!indoSub,
          provider: 'hls'
        }
      }
    } catch (e) {
      console.log('HLS failed, trying fallback...')
    }

    // PRIORITAS 2: VidCore
    try {
      const url = movieEmbedVidCore(validId)
      if (url) {
        console.log(`✅ Using VidCore for movie ${validId}`)
        return { type: 'iframe', src: url, provider: 'vidcore', hasIndonesianSubtitle: true }
      }
    } catch (e) {}

    // PRIORITAS 3: Nontongo
    try {
      const url = await getNontongoMovieUrl(validId)
      if (url) {
        console.log(`✅ Using Nontongo for movie ${validId}`)
        return { type: 'iframe', src: url, provider: 'nontongo', hasIndonesianSubtitle: true }
      }
    } catch (e) {}

    // FALLBACK: NexStream
    console.warn(`⚠️ Fallback to NexStream for ${validId} (no subtitle)`)
    const fallbackUrl = movieEmbedUrl(validId)
    if (fallbackUrl) {
      return { type: 'iframe', src: fallbackUrl, provider: 'nexstream', hasIndonesianSubtitle: false }
    }
    
    throw new Error('No working provider found')
  } catch (error) {
    console.error('Error getting smart movie URL:', error)
    return { type: 'error', error: error.message, hasIndonesianSubtitle: false }
  }
}

export async function getSmartTvUrl(tmdbId, season, episode) {
  try {
    const validId = validateTMDBId(tmdbId)
    validateSeasonEpisode(season, episode)
    console.log(`🔍 Fetching TV ${validId} S${season}E${episode}...`)
    
    // PRIORITAS 1: HLS + Subtitle
    try {
      const result = await getVideoWithSubtitles(validId, 'tv', season, episode)
      if (result.success && result.hlsUrl) {
        const indoSub = findIndonesianSubtitle(result.subtitles)
        console.log(`✅ Using HLS for TV ${validId} S${season}E${episode}, subtitles: ${result.subtitles.length} tracks, indo: ${!!indoSub}`)
        return { 
          type: 'hls',
          hlsUrl: result.hlsUrl,
          subtitles: result.subtitles,
          selectedSubtitle: indoSub,
          hasIndonesianSubtitle: !!indoSub,
          provider: 'hls'
        }
      }
    } catch (e) {
      console.log('HLS failed, trying fallback...')
    }

    // PRIORITAS 2: VidCore
    try {
      const url = tvEmbedVidCore(validId, season, episode)
      if (url) {
        console.log(`✅ Using VidCore for TV ${validId} S${season}E${episode}`)
        return { type: 'iframe', src: url, provider: 'vidcore', hasIndonesianSubtitle: true }
      }
    } catch (e) {}

    // PRIORITAS 3: Nontongo
    try {
      const url = await getNontongoTvUrl(validId, season, episode)
      if (url) {
        console.log(`✅ Using Nontongo for TV ${validId} S${season}E${episode}`)
        return { type: 'iframe', src: url, provider: 'nontongo', hasIndonesianSubtitle: true }
      }
    } catch (e) {}

    // FALLBACK: NexStream
    console.warn(`⚠️ Fallback to NexStream for ${validId}`)
    const fallbackUrl = tvEmbedUrl(validId, season, episode)
    if (fallbackUrl) {
      return { type: 'iframe', src: fallbackUrl, provider: 'nexstream', hasIndonesianSubtitle: false }
    }
    
    throw new Error('No working provider found')
  } catch (error) {
    console.error('Error getting smart TV URL:', error)
    return { type: 'error', error: error.message, hasIndonesianSubtitle: false }
  }
}

// ============================================
// 7. IMAGE URLs
// ============================================
export function posterUrl(path, large = false) {
  if (!path || typeof path !== 'string') return null
  const cleanPath = path.replace(/[^a-zA-Z0-9/._-]/g, '')
  return (large ? IMG_BASE_LG : IMG_BASE) + cleanPath
}

export function backdropUrl(path, large = false) {
  if (!path || typeof path !== 'string') return null
  const cleanPath = path.replace(/[^a-zA-Z0-9/._-]/g, '')
  const base = large ? 'https://image.tmdb.org/t/p/w1280' : 'https://image.tmdb.org/t/p/w780'
  return base + cleanPath
}

// ============================================
// 8. FORMATTING HELPERS
// ============================================
export function formatRating(rating) {
  if (!rating || isNaN(rating)) return null
  return parseFloat(rating).toFixed(1)
}

export function getYear(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  return dateStr.slice(0, 4)
}

export function formatDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return null
  }
}

export function formatRuntime(minutes) {
  if (!minutes || isNaN(minutes)) return null
  const mins = parseInt(minutes)
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`
}

// ============================================
// 9. UTILITY FUNCTIONS
// ============================================
export function getPaginationInfo(data) {
  if (!data || typeof data !== 'object') {
    return { page: 1, totalPages: 0, totalResults: 0, hasMore: false }
  }
  return {
    page: data.page || 1,
    totalPages: data.total_pages || 0,
    totalResults: data.total_results || 0,
    hasMore: data.page < data.total_pages
  }
}

// ============================================
// 10. GENRE MAPPING
// ============================================
export const GENRE_GROUPS = {
  'All': [],
  '🇰🇷 Drakor': [18, 10759, 10765],
  '🇯🇵 Anime': [16],
  '🎬 Western': [37],
  '🎭 Drama': [18],
  '😂 Comedy': [35],
  '🎯 Action': [28],
  '🔫 Thriller': [53],
  '👻 Horror': [27],
  '🧙 Fantasy': [14],
  '🚀 Sci-Fi': [878],
}

export const GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
}

export function getGenreIdsFromGroup(groupName) {
  if (!groupName || typeof groupName !== 'string') return []
  return GENRE_GROUPS[groupName] || []
}

export function getGenreNamesFromIds(ids) {
  if (!ids || !Array.isArray(ids)) return []
  return ids.map(id => GENRE_NAMES[id] || id).filter(Boolean)
}

export function getGenreStringFromGroup(groupName) {
  const ids = getGenreIdsFromGroup(groupName)
  return ids.length > 0 ? ids.join(',') : ''
}

export function isFilterActive(filter) {
  return filter && filter !== 'All'
}

export function getMediaTitle(item, type) {
  if (!item || typeof item !== 'object') return null
  return type === 'movie' ? item.title : item.name
}

export function getMediaDate(item, type) {
  if (!item || typeof item !== 'object') return null
  return type === 'movie' ? item.release_date : item.first_air_date
}

export function getMediaYear(item, type) {
  const date = getMediaDate(item, type)
  return getYear(date)
}

export function getMediaRuntime(item, type) {
  if (type === 'movie' && item && item.runtime) {
    return formatRuntime(item.runtime)
  }
  return null
}

export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
    if (ytMatch) return ytMatch[1]
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return vimeoMatch[1]
    return null
  } catch {
    return null
  }
}

export function buildSearchQuery(query, filters = {}) {
  let q = (query || '').trim().slice(0, 100)
  if (filters.genre) {
    q += q ? ` genre:${filters.genre}` : filters.genre
  }
  if (filters.year) {
    q += q ? ` year:${filters.year}` : filters.year
  }
  if (filters.rating) {
    q += q ? ` rating:${filters.rating}+` : `rating:${filters.rating}+`
  }
  return q
}