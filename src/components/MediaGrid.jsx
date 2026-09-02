import React from 'react'
import MediaCard from './MediaCard.jsx'
import styles from './MediaGrid.module.css'

export default function MediaGrid({ 
  items, 
  type, 
  onSelect, 
  selectedId, 
  loading,
  hasMore,
  onLoadMore,
  loadingMore,
  totalResults 
}) {
  if (loading && items.length === 0) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={`skeleton-${i}-${Date.now()}`} className={styles.skeleton}>
            <div className={styles.skeletonInner} />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className={styles.emptyIcon}>🎬</div>
        <p className={styles.empty}>No results found.</p>
        <p className={styles.emptySub}>Try searching for something else</p>
      </div>
    )
  }

  // Gunakan key yang unik dengan kombinasi id + index + random
  return (
    <>
      <div className={styles.grid}>
        {items.map((item, index) => {
          // Buat key unik
          const uniqueKey = `${item.id}-${index}-${Math.random().toString(36).substr(2, 5)}`
          return (
            <MediaCard
              key={uniqueKey}
              item={item}
              type={type}
              onClick={onSelect}
              selected={item.id === selectedId}
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          )
        })}
      </div>

      {/* Load More Section */}
      {hasMore && (
        <div className={styles.loadMoreWrap}>
          <button 
            className={styles.loadMoreBtn} 
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className={styles.spinner} />
                Loading...
              </>
            ) : (
              <>
                <span className={styles.loadMoreIcon}>✦</span>
                Load More
                <span className={styles.loadMoreCount}>
                  {items.length} of {totalResults || '...'}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* End Message */}
      {!hasMore && items.length > 0 && (
        <div className={styles.endWrap}>
          <div className={styles.endLine} />
          <p className={styles.endMsg}>✨ You've reached the end</p>
          <div className={styles.endLine} />
        </div>
      )}
    </>
  )
}