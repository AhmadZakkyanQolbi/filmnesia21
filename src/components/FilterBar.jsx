import React, { useState, useEffect } from 'react'
import { api, GENRE_GROUPS } from '../lib/api.js'
import styles from './FilterBar.module.css'

export default function FilterBar({ type = 'movie', onFilterChange, activeFilter }) {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true)
      try {
        const data = type === 'movie' 
          ? await api.getMovieGenres() 
          : await api.getTVGenres()
        setGenres(data.genres || [])
      } catch (e) {
        console.error('Error fetching genres:', e)
      }
      setLoading(false)
    }
    fetchGenres()
  }, [type])

  const isActive = (group) => {
    if (group === 'All' && !activeFilter) return true
    if (group === activeFilter) return true
    return false
  }

  // Debug: log genre yang dipilih
  const handleFilterClick = (group) => {
    console.log(`🔍 Filter clicked: ${group}`)
    if (group === 'All') {
      console.log('📋 Showing All (trending)')
      onFilterChange(null)
    } else {
      const genreIds = GENRE_GROUPS[group] || []
      console.log(`📋 Filter ${group} with genre IDs:`, genreIds)
      onFilterChange(group)
    }
  }

  return (
    <div className={styles.filterWrap}>
      <div className={styles.filterHeader}>
        <span className={styles.filterIcon}>🎯</span>
        <span className={styles.filterLabel}>Filter</span>
        {activeFilter && activeFilter !== 'All' && (
          <button 
            className={styles.clearFilter}
            onClick={() => handleFilterClick('All')}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div className={styles.filterGroups}>
        {Object.keys(GENRE_GROUPS).map((group, index) => (
          <button
            key={`filter-${group}-${index}`}
            className={`${styles.filterBtn} ${isActive(group) ? styles.active : ''}`}
            onClick={() => handleFilterClick(group)}
          >
            <span className={styles.filterBtnLabel}>{group}</span>
            {isActive(group) && group !== 'All' && (
              <span className={styles.filterBadge}>✓</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.filterDivider} />

      <div className={styles.filterAdvanced}>
        <button 
          className={styles.advancedBtn}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className={styles.advancedIcon}>⚙️</span>
          Advanced
          <span className={styles.advancedArrow}>{showDropdown ? '▲' : '▼'}</span>
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownContent}>
              <p className={styles.dropdownTitle}>Select specific genre:</p>
              <div className={styles.genreGrid}>
                {loading ? (
                  <div className={styles.genreLoading}>Loading genres...</div>
                ) : (
                  genres.map((genre, index) => (
                    <button
                      key={`genre-${genre.id}-${index}`}
                      className={`${styles.genreBtn} ${activeFilter === genre.name ? styles.active : ''}`}
                      onClick={() => {
                        // Cari group yang sesuai dengan genre ini
                        let foundGroup = null
                        for (const [group, ids] of Object.entries(GENRE_GROUPS)) {
                          if (ids.includes(genre.id)) {
                            foundGroup = group
                            break
                          }
                        }
                        if (foundGroup) {
                          handleFilterClick(foundGroup)
                        } else {
                          onFilterChange(genre.name)
                        }
                        setShowDropdown(false)
                      }}
                    >
                      {genre.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}