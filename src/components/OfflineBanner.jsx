import React, { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkConnection = async () => {
    try {
      // Fast ping to verify actual network connectivity
      const res = await fetch('/favicon.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      if (res.ok) {
        setIsOffline(false)
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      } else {
        setIsOffline(true)
      }
    } catch {
      setIsOffline(true)
    }
  }

  if (showReconnected && !isOffline) {
    return (
      <aside aria-label="Network status notification" className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs sm:text-sm font-medium animate-fadeIn">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>Internet connection restored. Live clinic sync is active.</span>
      </aside>
    )
  }

  if (!isOffline) return null

  return (
    <aside aria-label="Offline status warning" className="fixed top-0 inset-x-0 z-[9999] bg-gradient-to-r from-amber-600 to-rose-600 text-white px-3 py-2 sm:py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-amber-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="truncate">
          <strong className="font-semibold">Offline Mode:</strong> Live clinic records cannot be loaded or saved. Please reconnect to sync.
        </span>
      </div>
      <button
        onClick={checkConnection}
        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
        title="Check internet connection"
      >
        Retry
      </button>
    </aside>
  )
}

