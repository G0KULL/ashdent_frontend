import React, { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [dismissedInstall, setDismissedInstall] = useState(false)

  // Service Worker update registration hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      // Periodically check for service worker updates (every 60 minutes)
      if (r) {
        setInterval(() => {
          r.update().catch(() => {})
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.warn('PWA service worker registration error:', error)
    }
  })

  useEffect(() => {
    // Detect standalone display mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(standalone)

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(isIosDevice)

    // Check if dismissed previously in session
    const dismissed = sessionStorage.getItem('ashdent_pwa_install_dismissed')
    if (dismissed) {
      setDismissedInstall(true)
    }

    // Capture Chrome / Edge / Android install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Detect when successfully installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsStandalone(true)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIos && !isStandalone) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismissInstall = () => {
    setDismissedInstall(true)
    sessionStorage.setItem('ashdent_pwa_install_dismissed', '1')
  }

  return (
    <>
      {/* 1. APP UPDATE NOTIFICATION BANNER */}
      {needRefresh && (
        <aside aria-label="Application update available" className="fixed bottom-4 right-4 z-[9999] max-w-sm w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 animate-bounceIn">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-100">AshDent Update Available</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                A new version has been deployed. Refresh to apply updates without losing data.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. APP INSTALL PILL (Desktop & Android & iOS) */}
      {!isStandalone && !dismissedInstall && (isInstallable || (isIos && !window.navigator.standalone)) && (
        <aside aria-label="Install AshDent application" className="fixed bottom-4 left-4 z-[9990] hidden sm:flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-2xl">
          <img src="/logo.png" alt="AshDent" className="w-8 h-8 rounded-lg object-contain" />
          <div className="text-left pr-1">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">Install AshDent</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Fast desktop & tablet app</div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            Install
          </button>
          <button
            onClick={handleDismissInstall}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            title="Dismiss"
          >
            ✕
          </button>
        </aside>
      )}

      {/* 3. iOS INSTALLATION GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-slideUp">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <img src="/apple-touch-icon.png" alt="AshDent" className="w-10 h-10 rounded-xl" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Install AshDent on iOS</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              To install AshDent as an app on your iPhone or iPad:
            </p>
            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-600">1.</span>
                <span>Tap the <strong className="font-semibold">Share</strong> button at the bottom of Safari (<span className="text-sm">⎋</span> or square with arrow).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-600">2.</span>
                <span>Scroll down and tap <strong className="font-semibold">Add to Home Screen</strong> (<span className="text-sm">➕</span>).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-600">3.</span>
                <span>Tap <strong className="font-semibold">Add</strong> in the top right corner.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}

