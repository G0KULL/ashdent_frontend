import { useState } from 'react'
import styles from './LoginPage.module.css'

const API = 'http://127.0.0.1:8000/api'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (res.ok) {
        onLogin(data)
      } else {
        setError(data.error || data.detail || 'Invalid username or password')
      }
    } catch (err) {
      setError('Connection error. Please check your backend.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z" fill="rgba(79, 70, 229, 0.2)" />
              <path d="M14 6c-1.105 0-2 .895-2 2v3H9c-1.105 0-2 .895-2 2s.895 2 2 2h3v3c0 1.105.895 2 2 2s2-.895 2-2v-3h3c1.105 0 2-.895 2-2s-.895-2-2-2h-3V8c0-1.105-.895-2-2-2z" fill="#4f46e5" />
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Login to your DoctoSmart HMS account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div style={{ marginTop: '0.5rem', textAlign: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.65rem 0.9rem', borderRadius: '12px', fontSize: '0.825rem', color: '#065f46' }}>
            <span>Super Admin Demo: <strong>admin</strong> / <strong>password123</strong></span>
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('password123'); }}
              style={{ display: 'block', margin: '0.3rem auto 0 auto', color: '#059669', fontWeight: 700, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Fill Super Admin Credentials
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <span>Secure Multi-Company Login | DoctoSmart v2.4.1</span>
        </div>
      </div>
    </div>
  )
}
