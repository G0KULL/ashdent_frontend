import React, { useState } from 'react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dates = []
  for (let i = 0; i < firstDay; i++) dates.push(null)
  for (let i = 1; i <= daysInMonth; i++) dates.push(i)

  const isToday = (d) => {
    const today = new Date()
    return d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
      flex: 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1e293b' }}>{monthName} {year}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handlePrev} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>‹</button>
          <button onClick={handleNext} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', width: 28, height: 28, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {DAYS.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            {day}
          </div>
        ))}
        {dates.map((d, i) => (
          <div key={i} 
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: isToday(d) ? 800 : 600,
              borderRadius: isToday(d) ? '10px' : '8px',
              aspectRatio: '1/1',
              color: d ? (isToday(d) ? '#ffffff' : '#334155') : 'transparent',
              background: isToday(d) ? '#3b82f6' : (d ? 'transparent' : 'transparent'),
              boxShadow: isToday(d) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              cursor: d ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
               if (d && !isToday(d)) {
                 e.target.style.background = '#e0f2fe';
                 e.target.style.color = '#0284c7';
               }
            }}
            onMouseLeave={(e) => {
               if (d && !isToday(d)) {
                 e.target.style.background = 'transparent';
                 e.target.style.color = '#334155';
               }
            }}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  )
}