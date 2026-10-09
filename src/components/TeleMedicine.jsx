import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './TeleMedicine.module.css'

const API_BASE = 'http://127.0.0.1:8000/api'

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}')
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' }
}

export default function TeleMedicine({ onNavigate, userRole }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCall, setActiveCall] = useState(null) // Appointment object
  
  // Call Session states
  const [useLiveJitsi, setUseLiveJitsi] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [callDuration, setCallDuration] = useState(0)
  
  // EHR / clinical states
  const [activeEhrTab, setActiveEhrTab] = useState('notes') // notes | prescription | billing | history
  const [complaints, setComplaints] = useState('')
  const [observations, setObservations] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTooth, setSelectedTooth] = useState('All')
  
  // Master Lists loaded from API

  return (
    <div className={styles.telemedicineContainer}>
      <h2>TeleMedicine</h2>
      <div className={styles.mainLayout}>
        <div className={styles.videoArea}>
          <div className={styles.placeholderVideo}>
            {activeCall ? (
              <div className={styles.activeCallBox}>
                <p>Call in progress...</p>
              </div>
            ) : (
              <p>No active call</p>
            )}
          </div>
          <div className={styles.controlBar}>
            <button className={`${styles.controlBtn} ${micMuted ? styles.controlBtnActive : ''}`} onClick={() => setMicMuted(!micMuted)} title={micMuted ? "Unmute Mic" : "Mute Mic"}>
              {micMuted ? '🎙️' : '🎤'}
            </button>
            <button className={`${styles.controlBtn} ${videoOff ? styles.controlBtnActive : ''}`} onClick={() => setVideoOff(!videoOff)} title={videoOff ? "Enable Video" : "Disable Video"}>
              {videoOff ? '❌' : '📷'}
            </button>
            <button className={`${styles.controlBtn} ${screenSharing ? styles.controlBtnActive : ''}`} onClick={() => setScreenSharing(!screenSharing)} title="Share Screen">
              🖥️
            </button>
            <button className={`${styles.controlBtn} ${showChat ? styles.controlBtnActive : ''}`} onClick={() => setShowChat(!showChat)} title="Session Chat">
              💬
            </button>
            <div style={{ flex: 1 }} />
            <button className={styles.jitsiSwitchBtn} onClick={() => setUseLiveJitsi(!useLiveJitsi)}>
              {useLiveJitsi ? 'Switch to Standard' : 'Switch to Jitsi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}