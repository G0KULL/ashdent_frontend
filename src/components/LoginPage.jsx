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
        if (data.access) {
          localStorage.setItem("ashdent_access_token", data.access);
          localStorage.setItem("token", data.access);
        }
        if (data.refresh) localStorage.setItem("ashdent_refresh_token", data.refresh);
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
            <img src="/logo.png" alt="AshDent Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1>Welcome Back</h1>
          <p>Login to your AshDent HMS account</p>
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
        </form>

        <div className={styles.footer}>
          <span>Secure Login | AshDent v2.4.1</span>
        </div>
      </div>
    </div>
  )
}
