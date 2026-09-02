import React, { useState, useEffect } from 'react'
import styles from './Splash.module.css'

export default function Splash({ onEnter }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    setIsExiting(true)
    setTimeout(() => {
      onEnter()
    }, 500)
  }

  return (
    <div className={`${styles.splash} ${isVisible ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>🎬</div>
          <h1 className={styles.logo}>
            <span className={styles.logoAccent}>FILMNESIA</span>
            <span className={styles.logoDot}>·</span>
            <span className={styles.logoText}>21</span>
          </h1>
          <p className={styles.subtitle}>Nonton Film & Series Gratis</p>
        </div>

        <div className={styles.dividerContainer}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerIcon}>✦</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.description}>
          <p>
            Nikmati ribuan film dan series terbaik dengan subtitle Indonesia.
            <br />
            <span className={styles.tags}>
              🇮🇩 Film Indonesia • 🇰🇷 Drakor • 🇯🇵 Anime • 🎬 Hollywood
            </span>
          </p>
        </div>

        <button className={styles.enterBtn} onClick={handleEnter}>
          <span className={styles.btnText}>Masuk ke Filmnesia 21</span>
          <span className={styles.btnArrow}>→</span>
        </button>

        <p className={styles.footer}>
          <span>© 2024</span>
          <span className={styles.footerDot}>•</span>
          <span>Digital Entertainment Democratized</span>
        </p>
      </div>

      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.bgGlow3} />
    </div>
  )
}