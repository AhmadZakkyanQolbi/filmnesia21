import React, { useState, useEffect, useRef } from 'react'
import { searchManga, getTrendingManga, getMangaDetail, getMangaChapters } from '../lib/api.js'
import SEO from '../components/SEO.jsx'
import styles from './Comics.module.css'

export default function Comics() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedManga, setSelectedManga] = useState(null)
  const [chapters, setChapters] = useState([])
  const [showChapters, setShowChapters] = useState(false)
  const [error, setError] = useState(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const loadTrending = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getTrendingManga(20)
        if (data && data.length > 0) {
          setResults(data)
        } else {
          setError('Gagal memuat komik populer. Silakan refresh atau coba lagi nanti.')
        }
      } catch (err) {
        console.error('Error loading trending:', err)
        setError('Terjadi kesalahan saat memuat komik. Periksa koneksi internet Anda.')
      }
      setLoading(false)
    }
    loadTrending()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await searchManga(q)
      if (data && data.length > 0) {
        setResults(data)
      } else {
        setError(`Tidak ada komik ditemukan untuk "${q}"`)
        setResults([])
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Gagal mencari komik. Silakan coba lagi.')
      setResults([])
    }
    setLoading(false)
  }

  const handleSelectManga = async (manga) => {
    setLoading(true)
    setError(null)
    try {
      setSelectedManga(manga)
      
      const detail = await getMangaDetail(manga.id)
      if (detail) {
        setSelectedManga(detail)
      }
      
      const chapterList = await getMangaChapters(manga.id)
      setChapters(chapterList || [])
      setShowChapters(true)
    } catch (err) {
      console.error('Error loading manga:', err)
      setError('Gagal memuat detail komik.')
    }
    setLoading(false)
  }

  const handleCloseChapters = () => {
    setShowChapters(false)
    setSelectedManga(null)
    setChapters([])
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    } catch {
      return ''
    }
  }

  return (
    <>
      <SEO
        title="Baca Komik Online Gratis - Filmnesia 21"
        description="Baca komik dan manga online gratis dengan subtitle Indonesia. Ribuan judul komik terbaru dan terpopuler."
        type="website"
      />
      
      <div>
        <form className={styles.searchRow} onSubmit={handleSearch}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari komik… (contoh: One Piece, Naruto, Solo Leveling)"
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

        {error && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
            <button 
              className={styles.errorRetry}
              onClick={() => window.location.reload()}
            >
              🔄 Refresh
            </button>
          </div>
        )}

        {showChapters && selectedManga && (
          <div className={styles.chapterView}>
            <div className={styles.chapterHeader}>
              <div className={styles.chapterHeaderLeft}>
                <h2 className={styles.chapterTitle}>{selectedManga.title}</h2>
                <span className={styles.chapterCount}>
                  {chapters.length} Chapter
                </span>
              </div>
              <button className={styles.closeChapterBtn} onClick={handleCloseChapters}>
                ✕ Tutup
              </button>
            </div>
            
            <div className={styles.chapterList}>
              {chapters.length > 0 ? (
                chapters.map((chapter, index) => (
                  <a
                    key={chapter.id}
                    href={`https://mangadex.org/chapter/${chapter.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.chapterItem}
                  >
                    <span className={styles.chapterNumber}>
                      {chapter.chapter && chapter.chapter !== '0' 
                        ? `Chapter ${chapter.chapter}` 
                        : chapter.title || 'Chapter'}
                    </span>
                    <span className={styles.chapterMeta}>
                      {chapter.volume && `Vol. ${chapter.volume}`}
                      <span className={styles.chapterDate}>
                        {formatDate(chapter.publishedAt)}
                      </span>
                    </span>
                  </a>
                ))
              ) : (
                <p className={styles.noChapters}>Belum ada chapter tersedia</p>
              )}
            </div>
          </div>
        )}

        <div className={styles.labelWrap}>
          <div className={styles.labelLeft}>
            <p className={styles.sectionLabel}>
              {query ? `Hasil Pencarian: "${query}"` : '🔥 Komik Populer'}
            </p>
            <span className={styles.resultCount}>{results.length} judul</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.comicGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonSub} />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className={styles.comicGrid}>
            {results.map((manga) => (
              <div 
                key={manga.id} 
                className={`${styles.comicCard} ${selectedManga?.id === manga.id ? styles.active : ''}`}
                onClick={() => handleSelectManga(manga)}
              >
                <div className={styles.comicCover}>
                  {manga.coverUrl ? (
                    <img 
                      src={manga.coverUrl} 
                      alt={manga.title} 
                      loading="lazy"
                      className={styles.coverImage}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className={styles.noCover}><span>📖</span></div>
                  )}
                  <div className={styles.comicBadge}>
                    {manga.status === 'completed' ? '✅ Selesai' : 
                     manga.status === 'ongoing' ? '🔄 Ongoing' : 
                     manga.status === 'cancelled' ? '❌ Batal' :
                     '📖 ' + (manga.status || 'Unknown')}
                  </div>
                </div>
                <div className={styles.comicInfo}>
                  <div className={styles.comicTitle}>{manga.title}</div>
                  <div className={styles.comicMeta}>
                    <span className={styles.comicAuthor}>{manga.author}</span>
                    {manga.year && <span className={styles.comicYear}>{manga.year}</span>}
                  </div>
                  {manga.tags && manga.tags.length > 0 && (
                    <div className={styles.comicTags}>
                      {manga.tags.slice(0, 3).map(tag => (
                        <span key={tag.id} className={styles.tag}>{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📖</span>
            <p>Tidak ada komik ditemukan</p>
            <p className={styles.emptySub}>Coba kata kunci lain atau refresh halaman</p>
          </div>
        )}
      </div>
    </>
  )
}