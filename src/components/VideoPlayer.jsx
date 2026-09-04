import React, { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import styles from './VideoPlayer.module.css'

export default function VideoPlayer({ 
  hlsUrl, 
  subtitles, 
  title, 
  year, 
  rating, 
  overview, 
  onClose,
  hasIndonesianSubtitle = false,
  selectedSubtitle = null
}) {
  const videoRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentSubtitle, setCurrentSubtitle] = useState(null)
  const [subtitlesList, setSubtitlesList] = useState([])
  const [subtitleActivated, setSubtitleActivated] = useState(false)

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return

    const video = videoRef.current
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoaded(true)
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
      })

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
      video.addEventListener('loadedmetadata', () => {
        setIsLoaded(true)
        video.play().catch(() => {})
      })
    }
  }, [hlsUrl])

  // Setup subtitle tracks - AUTO AKTIFKAN SUBTITLE INDONESIA
  useEffect(() => {
    if (!videoRef.current || !subtitles || subtitles.length === 0) {
      return
    }

    const video = videoRef.current
    
    // Bersihkan track lama
    while (video.textTracks.length > 0) {
      video.removeChild(video.textTracks[0])
    }

    // Cari subtitle Indonesia dengan keyword lengkap
    const indoIndex = subtitles.findIndex(s => {
      const label = (s.label || s.lang || '').toLowerCase()
      const keywords = ['indonesian', 'indonesia', 'ind', 'id', 'bahasa indonesia', 'sub indo', 'indo']
      return keywords.some(keyword => label.includes(keyword))
    })

    // Tambahkan subtitle tracks
    const trackList = []
    subtitles.forEach((sub, index) => {
      const track = document.createElement('track')
      track.kind = 'subtitles'
      track.label = sub.label || `Subtitle ${index + 1}`
      track.src = sub.url
      track.srcLang = sub.lang || 'id'
      track.default = index === (indoIndex !== -1 ? indoIndex : 0)
      video.appendChild(track)
      trackList.push({ 
        label: track.label, 
        lang: track.srcLang, 
        index,
        url: sub.url
      })
    })
    
    setSubtitlesList(trackList)
    setSubtitleActivated(false)
    
    // AKTIFKAN SUBTITLE INDONESIA SECARA OTOMATIS
    const activateSubtitle = () => {
      if (video.textTracks.length > 0 && !subtitleActivated) {
        // Cari track yang mengandung "Indonesian" atau "id"
        let targetIndex = -1
        for (let i = 0; i < video.textTracks.length; i++) {
          const label = video.textTracks[i].label || ''
          if (label.toLowerCase().includes('indonesian') || 
              label.toLowerCase().includes('indonesia') ||
              label.toLowerCase().includes('id') ||
              label.toLowerCase().includes('bahasa')) {
            targetIndex = i
            break
          }
        }
        
        // Jika tidak ditemukan, gunakan indoIndex atau track pertama
        if (targetIndex === -1) {
          targetIndex = indoIndex !== -1 ? indoIndex : 0
        }
        
        // Aktifkan subtitle
        if (targetIndex !== -1 && video.textTracks[targetIndex]) {
          video.textTracks[targetIndex].mode = 'showing'
          // Sembunyikan track lain
          for (let i = 0; i < video.textTracks.length; i++) {
            if (i !== targetIndex) {
              video.textTracks[i].mode = 'hidden'
            }
          }
          setCurrentSubtitle(trackList[targetIndex] || trackList[0])
          setSubtitleActivated(true)
          console.log(`✅ Subtitle "${trackList[targetIndex]?.label || 'auto'}" activated automatically!`)
        }
      }
    }

    // Coba aktivasi setelah 300ms, 600ms, 1000ms, dan 2000ms
    setTimeout(activateSubtitle, 300)
    setTimeout(activateSubtitle, 600)
    setTimeout(activateSubtitle, 1000)
    setTimeout(activateSubtitle, 2000)

    // Cleanup
    return () => {
      setSubtitleActivated(false)
    }
  }, [subtitles, hasIndonesianSubtitle])

  // Ganti subtitle
  const changeSubtitle = (index) => {
    if (!videoRef.current) return
    const tracks = videoRef.current.textTracks
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? 'showing' : 'hidden'
    }
    setCurrentSubtitle(subtitlesList[index])
  }

  if (!hlsUrl) return null

  const hasSubtitle = subtitlesList.length > 0 || hasIndonesianSubtitle
  const subtitleStatus = hasSubtitle ? '✅ Subtitle Indonesia' : '❌ Tidak Ada Subtitle'

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleIcon}>▶</div>
          <div>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.pills}>
              {year && <span className={styles.pill}>{year}</span>}
              {rating && <span className={`${styles.pill} ${styles.gold}`}>★ {rating}</span>}
              <span className={`${styles.pill} ${hasSubtitle ? styles.badge : styles.noBadge}`}>
                {subtitleStatus}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {subtitlesList.length > 1 && (
            <select 
              className={styles.subtitleSelect}
              onChange={(e) => changeSubtitle(parseInt(e.target.value))}
              value={subtitlesList.indexOf(currentSubtitle)}
            >
              {subtitlesList.map((sub, index) => (
                <option key={index} value={index}>
                  {sub.label || `Subtitle ${index + 1}`}
                </option>
              ))}
            </select>
          )}
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      <div className={styles.playerWrap}>
        <div className={styles.playerBox}>
          {!isLoaded && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Loading video...</p>
              <p className={styles.loadingSub}>Mengambil video & subtitle</p>
            </div>
          )}
          
          <video
            ref={videoRef}
            controls
            className={styles.video}
            playsInline
            controlsList="nodownload"
          />
        </div>
      </div>

      {overview && (
        <div className={styles.overviewWrap}>
          <p className={styles.overview}>{overview}</p>
        </div>
      )}
    </div>
  )
}