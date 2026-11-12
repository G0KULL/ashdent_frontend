import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, getHeaders } from '../utils/api'
import styles from './DoctorPerformance.module.css'

export default function DoctorPerformance({ userRole }) {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('total') // 'total', 'completed', 'rate', 'name'
  const [isLimited, setIsLimited] = useState(true) // Limited view (like Recent Patients)
  const limitCount = 3

  const fetchPerformance = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `${API_BASE}/dashboard/doctor-performance/?period=${period}`
      if (period === 'custom') {
        if (startDate && endDate) {
          url += `&start_date=${startDate}&end_date=${endDate}`
        } else {
          setLoading(false)
          return
        }
      }

      const res = await fetch(url, { headers: getHeaders() })

      if (!res.ok) {
        throw new Error(`Failed to load data (${res.status})`)
      }

      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching doctor performance:', err)
      setError(err.message || 'Failed to fetch doctor performance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchPerformance()
    }
  }, [period, startDate, endDate])

  const handleDoctorClick = (doctorId) => {
    const basePath = userRole ? `/${userRole.toLowerCase()}` : '/admin'
    navigate(`${basePath}/appointments?doctor_id=${doctorId}`)
  }

  // Filter and Sort Doctors
  const filteredDoctors = (data?.doctors || [])
    .filter(doc => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        doc.doctor_name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'total') return b.total - a.total || b.completed - a.completed
      if (sortBy === 'completed') return b.completed - a.completed || b.total - a.total
      if (sortBy === 'rate') return b.completion_rate - a.completion_rate || b.total - a.total
      if (sortBy === 'name') return a.doctor_name.localeCompare(b.doctor_name)
      return 0
    })

  const isSearchActive = Boolean(searchQuery.trim())
  const displayedDoctors = (isLimited && !isSearchActive)
    ? filteredDoctors.slice(0, limitCount)
    : filteredDoctors

  const maxTotal = Math.max(...(data?.doctors || []).map(d => d.total), 1)

  return (
    <div className={styles.container}>
      {/* Header & Controls */}
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <div className={styles.iconBadge}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 className={styles.title}>Doctor-wise Appointment Performance</h3>
              {filteredDoctors.length > 0 && (
                <span className={styles.viewBadge}>
                  {isLimited && !isSearchActive
                    ? `Top ${Math.min(limitCount, filteredDoctors.length)} of ${filteredDoctors.length}`
                    : `All ${filteredDoctors.length}`}
                </span>
              )}
            </div>
            <p className={styles.subtitle}>Doctor appointment workload distribution & completion analytics</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={styles.filterControls}>
          {filteredDoctors.length > limitCount && !isSearchActive && (
            <button
              type="button"
              className={styles.viewAllToggle}
              onClick={() => setIsLimited(prev => !prev)}
              title={isLimited ? `View all ${filteredDoctors.length} doctors` : 'Show top 3 doctors only'}
            >
              {isLimited
                ? `View All (${filteredDoctors.length}) →`
                : 'Show Top 3 Only ↑'}
            </button>
          )}

          <div className={styles.periodTabs}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${period === tab.id ? styles.activeTab : ''}`}
                onClick={() => setPeriod(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className={styles.customDateInputs}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.dateInput}
              />
              <span className={styles.dateSep}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      {data?.summary && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Doctors</span>
            <span className={styles.kpiVal}>{data.summary.total_doctors}</span>
            <span className={styles.kpiSub}>Registered active staff</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Appointments</span>
            <span className={styles.kpiVal}>{data.summary.total_appointments}</span>
            <span className={styles.kpiSub}>Workload in selected period</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Completed</span>
            <span className={`${styles.kpiVal} ${styles.valGreen}`}>{data.summary.completed}</span>
            <span className={styles.kpiSub}>Consultations finished</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Upcoming / Waiting</span>
            <span className={`${styles.kpiVal} ${styles.valAmber}`}>{data.summary.upcoming}</span>
            <span className={styles.kpiSub}>Scheduled & in-progress</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Completion Rate</span>
            <span className={`${styles.kpiVal} ${styles.valIndigo}`}>{data.summary.overall_completion_rate}%</span>
            <span className={styles.kpiSub}>Overall team completion</span>
          </div>
        </div>
      )}

      {/* Toolbar: Search & Sort */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search doctor or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.sortSection}>
          <span className={styles.sortLabel}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="total">Workload (Total DESC)</option>
            <option value="completed">Completed DESC</option>
            <option value="rate">Completion Rate DESC</option>
            <option value="name">Doctor Name (A-Z)</option>
          </select>
        </div>

        {/* View Option: Limited (Top 3) vs All */}
        {filteredDoctors.length > limitCount && !isSearchActive && (
          <div className={styles.viewToggleGroup}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${isLimited ? styles.viewToggleActive : ''}`}
              onClick={() => setIsLimited(true)}
              title="Show top 3 doctors only"
            >
              Top {limitCount} (Limited)
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${!isLimited ? styles.viewToggleActive : ''}`}
              onClick={() => setIsLimited(false)}
              title="Show all doctors"
            >
              All ({filteredDoctors.length})
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading doctor performance stats...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
          <button onClick={fetchPerformance} className={styles.retryBtn}>Retry</button>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No doctor performance data found for the selected period.</p>
        </div>
      ) : (
        <>
          <div className={styles.mobileScrollNotice}>
            <span>👉 Swipe horizontally to view full workload & completion metrics</span>
          </div>
          <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Workload Ratio</th>
                <th className={styles.textCenter}>Total</th>
                <th className={styles.textCenter}>Completed</th>
                <th className={styles.textCenter}>Upcoming</th>
                <th className={styles.textCenter}>Cancelled</th>
                <th className={styles.textRight}>Completion Rate</th>
                <th className={styles.textCenter}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedDoctors.map(doc => {
                const barWidthPct = (doc.total / maxTotal) * 100
                const docColor = doc.color && doc.color !== '#000000' ? doc.color : '#3b82f6'

                return (
                  <tr key={doc.doctor_id} className={styles.row}>
                    {/* Doctor Info */}
                    <td>
                      <div className={styles.doctorInfo}>
                        <div className={styles.avatar} style={{ backgroundColor: docColor }}>
                          {doc.doctor_name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.doctorName}>{doc.doctor_name}</div>
                          <div className={styles.doctorSpec}>{doc.specialization}</div>
                        </div>
                      </div>
                    </td>

                    {/* Relative Workload Visual Bar */}
                    <td className={styles.barCol}>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${Math.max(barWidthPct, 4)}%`,
                            backgroundColor: docColor
                          }}
                        />
                      </div>
                    </td>

                    {/* Total */}
                    <td className={styles.textCenter}>
                      <span className={styles.badgeTotal}>{doc.total}</span>
                    </td>

                    {/* Completed */}
                    <td className={styles.textCenter}>
                      <span className={`${styles.badgeStatus} ${styles.badgeGreen}`}>
                        {doc.completed}
                      </span>
                    </td>

                    {/* Upcoming */}
                    <td className={styles.textCenter}>
                      <span className={`${styles.badgeStatus} ${styles.badgeAmber}`}>
                        {doc.upcoming}
                      </span>
                    </td>

                    {/* Cancelled */}
                    <td className={styles.textCenter}>
                      <span className={`${styles.badgeStatus} ${styles.badgeSlate}`}>
                        {doc.cancelled}
                      </span>
                    </td>

                    {/* Completion Rate */}
                    <td className={styles.textRight}>
                      <div className={styles.rateCell}>
                        <span className={`${styles.rateText} ${
                          doc.completion_rate >= 70 ? styles.rateHigh :
                          doc.completion_rate >= 40 ? styles.rateMid : styles.rateLow
                        }`}>
                          {doc.completion_rate}%
                        </span>
                        <div className={styles.miniRateTrack}>
                          <div
                            className={styles.miniRateFill}
                            style={{
                              width: `${doc.completion_rate}%`,
                              backgroundColor: doc.completion_rate >= 70 ? '#10b981' : doc.completion_rate >= 40 ? '#3b82f6' : '#94a3b8'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className={styles.textCenter}>
                      <button
                        onClick={() => handleDoctorClick(doc.doctor_id)}
                        className={styles.viewBtn}
                        title="Filter appointments for this doctor"
                      >
                        View Appointments
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Limited View Footer / Expand Action Banner */}
          {filteredDoctors.length > limitCount && !isSearchActive && (
            <div className={styles.tableFooter}>
              <div className={styles.footerInfo}>
                <span className={styles.footerDot} />
                <span>
                  {isLimited
                    ? `Showing top ${Math.min(limitCount, filteredDoctors.length)} of ${filteredDoctors.length} doctors. ${filteredDoctors.length - Math.min(limitCount, filteredDoctors.length)} more doctors hidden in limited view.`
                    : `Showing all ${filteredDoctors.length} doctors.`}
                </span>
              </div>
              <button
                type="button"
                className={styles.footerActionBtn}
                onClick={() => setIsLimited(prev => !prev)}
              >
                {isLimited
                  ? `View All (${filteredDoctors.length}) Doctors →`
                  : 'Show Top 3 Only ↑'}
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}
