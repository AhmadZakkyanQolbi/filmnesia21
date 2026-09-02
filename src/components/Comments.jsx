import React, { useState, useEffect } from 'react'
import styles from './Comments.module.css'

// ==========================================
// ✅ SANITASI TEKS - CEGAH XSS
// ==========================================
function sanitizeText(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default function Comments() {
  const [comments, setComments] = useState([])
  const [username, setUsername] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // ✅ RATE LIMITING - CEGAH SPAM
  const [lastCommentTime, setLastCommentTime] = useState(0)

  // Load komentar dari localStorage
  useEffect(() => {
    const savedComments = localStorage.getItem('cinema21_comments')
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments))
      } catch {
        setComments([])
      }
    } else {
      // Data dummy jika belum ada komentar
      const dummyComments = [
        {
          id: 1,
          username: 'Budi Santoso',
          comment: 'Mantap banget websitenya! Filmnya lengkap dan subtitle Indonesia nya jelas. 👍',
          date: new Date(Date.now() - 3600000 * 2).toISOString(),
          likes: 5
        },
        {
          id: 2,
          username: 'Siti Rahayu',
          comment: 'Saya suka koleksi drakor nya. Update terus ya! 🥰',
          date: new Date(Date.now() - 3600000 * 5).toISOString(),
          likes: 3
        },
        {
          id: 3,
          username: 'Andi Wijaya',
          comment: 'Nonton film gratis tanpa iklan, keren banget! Terima kasih Cinema 21 🙏',
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          likes: 7
        }
      ]
      setComments(dummyComments)
      localStorage.setItem('cinema21_comments', JSON.stringify(dummyComments))
    }
  }, [])

  // Simpan komentar ke localStorage
  const saveComments = (newComments) => {
    setComments(newComments)
    localStorage.setItem('cinema21_comments', JSON.stringify(newComments))
  }

  // Handle submit komentar
  const handleSubmit = (e) => {
    e.preventDefault()
    
    const trimmedUsername = username.trim()
    const trimmedComment = comment.trim()
    
    if (!trimmedUsername || !trimmedComment) {
      alert('Silakan isi nama dan komentar!')
      return
    }

    // ✅ CEK RATE LIMIT (10 detik)
    const now = Date.now()
    if (now - lastCommentTime < 10000) {
      alert('Tunggu 10 detik sebelum kirim komentar lagi!')
      return
    }
    setLastCommentTime(now)

    setIsSubmitting(true)

    const newComment = {
      id: Date.now(),
      // ✅ SANITASI SEBELUM DISIMPAN
      username: sanitizeText(trimmedUsername),
      comment: sanitizeText(trimmedComment),
      date: new Date().toISOString(),
      likes: 0
    }

    const updatedComments = [newComment, ...comments]
    saveComments(updatedComments)
    setUsername('')
    setComment('')
    setIsSubmitting(false)
  }

  // Handle like komentar
  const handleLike = (id) => {
    const updatedComments = comments.map(c => 
      c.id === id ? { ...c, likes: c.likes + 1 } : c
    )
    saveComments(updatedComments)
  }

  // Handle delete komentar
  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus komentar ini?')) {
      const updatedComments = comments.filter(c => c.id !== id)
      saveComments(updatedComments)
    }
  }

  // Format waktu
  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // detik

    if (diff < 60) return `${diff} detik lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.icon}>💬</span>
        <h3 className={styles.title}>Komentar & Saran</h3>
        <span className={styles.count}>{comments.length} komentar</span>
      </div>

      {/* Form komentar */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="Nama Anda..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
            required
          />
        </div>
        <div className={styles.formRow}>
          <textarea
            className={styles.textarea}
            placeholder="Tulis komentar atau request film..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            required
          />
        </div>
        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Mengirim...' : '✉️ Kirim Komentar'}
        </button>
      </form>

      {/* Daftar komentar */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.empty}>Belum ada komentar. Jadilah yang pertama! 😊</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                {/* ✅ SANITASI SAAT RENDER */}
                <span className={styles.commentUsername}>👤 {sanitizeText(c.username)}</span>
                <span className={styles.commentDate}>{formatTime(c.date)}</span>
              </div>
              {/* ✅ SANITASI SAAT RENDER */}
              <p className={styles.commentText}>{sanitizeText(c.comment)}</p>
              <div className={styles.commentActions}>
                <button 
                  className={styles.likeBtn}
                  onClick={() => handleLike(c.id)}
                >
                  👍 {c.likes}
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(c.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}