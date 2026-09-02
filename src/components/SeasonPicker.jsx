import React, { useState, useEffect } from 'react'
import { api, posterUrl } from '../lib/api.js'
import styles from './SeasonPicker.module.css'

export default function SeasonPicker({ show, onPlay }) {
  const [seasons, setSeasons] = useState([])
  const [activeSeason, setActiveSeason] = useState(1)
  const [episodes, setEpisodes] = useState([])
  const [epLoading, setEpLoading] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState(null)

  // Build season list from show data
  useEffect(() => {
    if (!show) return
    api.tvDetails(show.id).then(details => {
      const s = (details.seasons || []).filter(s => s.season_number > 0)
      if (s.length === 0 && details.number_of_seasons) {
        const arr = []
        for (let i = 1; i <= details.number_of_seasons; i++) {
          arr.push({ 
            season_number: i, 
            name: `Season ${i}`, 
            episode_count: null,
            poster_path: null
          })
        }
        setSeasons(arr)
      } else {
        setSeasons(s)
      }
      setActiveSeason(s[0]?.season_number || 1)
    }).catch(() => {
      const n = show.number_of_seasons || 1
      const arr = []
      for (let i = 1; i <= n; i++) {
        arr.push({ 
          season_number: i, 
          name: `Season ${i}`, 
          episode_count: null,
          poster_path: null
        })
      }
      setSeasons(arr)
      setActiveSeason(1)
    })
  }, [show.id])

  // Load episodes for activeSeason
  useEffect(() => {
    if (!activeSeason) return
    setEpLoading(true)
    setEpisodes([])
    setSelectedEpisode(null)
    api.seasonDetails(show.id, activeSeason).then(data => {
      setEpisodes(data.episodes || [])
    }).catch(() => setEpisodes([])).finally(() => setEpLoading(false))
  }, [show.id, activeSeason])

  if (!show) return null

  const poster = posterUrl(show.poster_path)
  const activeSeasonData = seasons.find(s => s.season_number === activeSeason)

  return (
    <div className={styles.wrap}>
      {/* Show Header */}
      <div className={styles.showHeader}>
        <div className={styles.showHeaderLeft}>
          {poster && <img src={poster} alt={show.name} className={styles.showPoster} />}
          <div className={styles.showMeta}>
            <h3 className={styles.showName}>{show.name}</h3>
            <div className={styles.showMetaRow}>
              {show.first_air_date && (
                <span className={styles.showYear}>{show.first_air_date.slice(0, 4)}</span>
              )}
              {show.vote_average > 0 && (
                <span className={styles.showRating}>★ {parseFloat(show.vote_average).toFixed(1)}</span>
              )}
              {activeSeasonData && (
                <span className={styles.showSeason}>
                  Season {activeSeason}
                  {activeSeasonData.episode_count && (
                    <span className={styles.showEpisodeCount}>
                      · {activeSeasonData.episode_count} episodes
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.showStats}>
          <span className={styles.statBadge}>
            <span className={styles.statIcon}>📺</span>
            {episodes.length} Episodes
          </span>
        </div>
      </div>

      {/* Season tabs */}
      <div className={styles.seasonTabs}>
        {seasons.map(s => (
          <button
            key={s.season_number}
            className={`${styles.seasonTab} ${activeSeason === s.season_number ? styles.seasonActive : ''}`}
            onClick={() => setActiveSeason(s.season_number)}
          >
            <span className={styles.seasonTabNum}>S{s.season_number}</span>
            {s.episode_count && (
              <span className={styles.seasonTabCount}>{s.episode_count} eps</span>
            )}
          </button>
        ))}
      </div>

      {/* Episodes grid */}
      <div className={styles.episodesWrap}>
        {epLoading ? (
          <div className={styles.epGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.epSkeleton}>
                <div className={styles.skeletonInner} />
              </div>
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <>
            <div className={styles.epGrid}>
              {episodes.map(ep => (
                <button
                  key={ep.episode_number}
                  className={`${styles.epCard} ${selectedEpisode === ep.episode_number ? styles.epSelected : ''}`}
                  onClick={() => {
                    setSelectedEpisode(ep.episode_number)
                    onPlay(activeSeason, ep.episode_number)
                  }}
                  title={ep.name}
                >
                  <div className={styles.epThumb}>
                    {ep.still_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} 
                        alt={ep.name} 
                        loading="lazy" 
                      />
                    ) : (
                      <div className={styles.epThumbFallback}>
                        <span className={styles.fallbackIcon}>▶</span>
                      </div>
                    )}
                    <div className={styles.epPlayOverlay}>
                      <span className={styles.playIcon}>▶</span>
                    </div>
                    {ep.vote_average > 0 && (
                      <div className={styles.epRatingBadge}>
                        ★ {ep.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className={styles.epInfo}>
                    <div className={styles.epInfoTop}>
                      <span className={styles.epNum}>E{ep.episode_number}</span>
                      {ep.runtime && (
                        <span className={styles.epRuntime}>{ep.runtime}m</span>
                      )}
                    </div>
                    <span className={styles.epName}>{ep.name}</span>
                    {ep.air_date && (
                      <span className={styles.epDate}>
                        {new Date(ep.air_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.noEpsWrap}>
            <span className={styles.noEpsIcon}>📺</span>
            <p className={styles.noEps}>No episode data available.</p>
            <p className={styles.noEpsSub}>Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  )
}