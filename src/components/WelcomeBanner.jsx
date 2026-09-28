import { useEffect, useRef } from 'react'
import styles from './WelcomeBanner.module.css'
import bannerImg from '../assets/doctor_banner.png'

export default function WelcomeBanner() {
  const today = new Date(2026, 2, 26) // March 26 2026
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const dateStr = today.toLocaleDateString('en-US', options)

  return (
    <section className={styles.banner} aria-label="Welcome Banner">
      <div className={styles.overlay} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.25)" />
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Clinic Active
        </p>
        <h2 className={styles.title}>
          Welcome back, <span>Smile Stories Dental Care!</span>
        </h2>
        <p className={styles.date}>Today is {dateStr}</p>
        <p className={styles.desc}>
          Everything looks great today. You have <strong>5 appointments</strong> scheduled with <strong>3 patients</strong> already in queue. Stay focused and keep delivering exceptional care.
        </p>
        <div className={styles.btnGroup}>
          <button className={styles.btnPrimary}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            View Schedule
          </button>
          <button className={styles.btnGhost}>Add Patient +</button>
        </div>
      </div>
      <div className={styles.visual} aria-hidden="true">
        <img src={bannerImg} alt="Doctor" className={styles.img} />
      </div>
    </section>
  )
}
