import React, { useState, useEffect } from 'react'
import styles from './Player.module.css'

export default function Player({ src, title, year, rating, overview, badge, onClose, provider }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [src])

  if (!src) return null

  return (
    <div className={`${styles.wrap} ${isLoaded ? styles.loaded : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>▶</div>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.pills}>
              {year && <span className={styles.pill}>{year}</span>}
              {rating && <span className={`${styles.pill} ${styles.gold}`}>★ {rating}</span>}
              {badge && <span className={`${styles.pill} ${styles.badge}`}>{badge}</span>}
              {provider && (
                <span className={`${styles.pill} ${styles.provider}`}>
                  {provider === 'nontongo' ? '🇮🇩 Sub Indo' : '🎬 Stream'}
                </span>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close player">
            <span className={styles.closeIcon}>✕</span>
          </button>
        )}
      </div>

      <div className={styles.playerWrap}>
        <div className={styles.playerBox}>
          {!isLoaded && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Loading player...</p>
            </div>
          )}
          
          <iframe
            src={src}
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            title={title}
            className={styles.iframe}
            onLoad={() => setIsLoaded(true)}
          />
          
          <button 
            className={styles.fullscreenBtn}
            onClick={() => {
              const iframe = document.querySelector(`iframe[title="${title}"]`)
              if (iframe?.requestFullscreen) {
                iframe.requestFullscreen()
              }
            }}
            aria-label="Fullscreen"
          >
            <span className={styles.fullscreenIcon}>⛶</span>
          </button>
        </div>
      </div>

      {overview && (
        <div className={styles.overviewWrap}>
          <div className={styles.overviewLine} />
          <p className={styles.overview}>{overview}</p>
          <div className={styles.overviewLine} />
        </div>
      )}
    </div>
  )
}