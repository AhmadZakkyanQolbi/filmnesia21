import React, { useState } from 'react'
import { posterUrl, formatRating, getYear } from '../lib/api.js'
import styles from './MediaCard.module.css'

export default function MediaCard({ item, type = 'movie', onClick, selected }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const title = type === 'movie' ? item.title : item.name
  const date = type === 'movie' ? item.release_date : item.first_air_date
  const year = getYear(date)
  const rating = formatRating(item.vote_average)
  const poster = posterUrl(item.poster_path)
  
  // Ambil genre pertama untuk badge
  const genre = item.genre_ids?.[0] || null

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.posterWrap}>
        <div className={styles.poster}>
          {poster ? (
            <img 
              src={poster} 
              alt={title} 
              loading="lazy"
              className={isHovered ? styles.imgZoom : ''}
            />
          ) : (
            <div className={styles.noPoster}>
              <span className={styles.noPosterText}>{title?.slice(0, 2)}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className={styles.overlay} />
          
          {/* Play button on hover */}
          <div className={`${styles.playBtn} ${isHovered ? styles.playBtnShow : ''}`}>
            <span className={styles.playIcon}>▶</span>
          </div>
          
          {/* Rating badge on top */}
          {rating && (
            <div className={styles.ratingBadge}>
              <span className={styles.starIcon}>★</span>
              {rating}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.info}>
        <div className={styles.titleWrap}>
          <div className={styles.title}>{title}</div>
          {year && <div className={styles.year}>{year}</div>}
        </div>
        
        {/* Progress bar (decorative) */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        </div>
      </div>
    </div>
  )
}