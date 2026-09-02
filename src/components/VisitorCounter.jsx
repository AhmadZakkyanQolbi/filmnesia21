import React, { useState, useEffect } from 'react'
import styles from './VisitorCounter.module.css'

export default function VisitorCounter() {
  const [visitors, setVisitors] = useState(0)
  const [todayVisitors, setTodayVisitors] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateVisitor = () => {
      const today = new Date().toDateString()
      const storedData = localStorage.getItem('cinema21_visitors')
      const storedToday = localStorage.getItem('cinema21_visitors_today')
      const storedDate = localStorage.getItem('cinema21_visitors_date')

      let totalVisitors = parseInt(storedData) || 0
      let todayCount = parseInt(storedToday) || 0

      if (storedDate !== today) {
        todayCount = 0
        localStorage.setItem('cinema21_visitors_date', today)
      }

      const sessionKey = 'cinema21_visitor_session'
      if (!sessionStorage.getItem(sessionKey)) {
        totalVisitors += 1
        todayCount += 1
        sessionStorage.setItem(sessionKey, 'true')
        
        localStorage.setItem('cinema21_visitors', totalVisitors.toString())
        localStorage.setItem('cinema21_visitors_today', todayCount.toString())
        localStorage.setItem('cinema21_visitors_date', today)
      }

      setVisitors(totalVisitors)
      setTodayVisitors(todayCount)
      setIsLoading(false)
    }

    updateVisitor()
  }, [])

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <span className={styles.loadingDot}>●</span>
          <span className={styles.loadingDot}>●</span>
          <span className={styles.loadingDot}>●</span>
        </div>
      </div>
    )
  }

  // Format angka dengan suffix (K, M, B)
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stat}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>👥</span>
        </div>
        <div className={styles.statInfo}>
          <span className={styles.number}>{formatNumber(visitors)}</span>
          <span className={styles.label}>Total Pengunjung</span>
        </div>
      </div>
      
      <div className={styles.divider} />
      
      <div className={styles.stat}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>📊</span>
        </div>
        <div className={styles.statInfo}>
          <span className={styles.number}>{formatNumber(todayVisitors)}</span>
          <span className={styles.label}>Hari Ini</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.stat}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>⏳</span>
        </div>
        <div className={styles.statInfo}>
          <span className={styles.number}>
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
          <span className={styles.label}>Update Terakhir</span>
        </div>
      </div>
    </div>
  )
}