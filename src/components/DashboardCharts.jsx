import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { API_BASE, getHeaders } from '../utils/api';
import styles from './DashboardCharts.module.css';

export default function DashboardCharts() {
  const [patientData, setPatientData] = useState([
    { name: 'Mon', patients: 0, appointments: 0 },
    { name: 'Tue', patients: 0, appointments: 0 },
    { name: 'Wed', patients: 0, appointments: 0 },
    { name: 'Thu', patients: 0, appointments: 0 },
    { name: 'Fri', patients: 0, appointments: 0 },
    { name: 'Sat', patients: 0, appointments: 0 },
    { name: 'Sun', patients: 0, appointments: 0 },
  ]);

  const [treatmentData, setTreatmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [treatmentView, setTreatmentView] = useState('donut'); // 'donut' or 'bar'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API_BASE}/appointments/stats/`, { headers: getHeaders() })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data.weekly_trend)) {
            setPatientData(data.weekly_trend);
          }
          if (Array.isArray(data.treatments_by_type)) {
            setTreatmentData(data.treatments_by_type);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load dashboard stats:', err);
          setLoading(false);
        });
    };

    fetchStats();
    const iv = setInterval(fetchStats, 60000); // refresh every 1 min
    return () => clearInterval(iv);
  }, []);

  // Compute summary totals for header badges
  const totalAppointments = useMemo(() => {
    return patientData.reduce((acc, curr) => acc + (Number(curr.appointments) || 0), 0);
  }, [patientData]);

  const totalPatients = useMemo(() => {
    return patientData.reduce((acc, curr) => acc + (Number(curr.patients) || 0), 0);
  }, [patientData]);

  const totalTreatments = useMemo(() => {
    return treatmentData.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }, [treatmentData]);

  return (
    <div className={styles.chartsGrid}>

      {/* ── Section 1: Appointment Graphical Representation (Patient & Appointment Trend) ── */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.chartTitle}>
              <span>📈</span>
              <span>Patient & Appointment Trend</span>
            </h3>
            <p className={styles.chartSubtitle}>Weekly appointment booking & patient flow analysis</p>
          </div>

          <div className={styles.headerPills}>
            <div className={styles.statPill} title="Total appointments in 7-day trend">
              <span className={styles.statPillDot} style={{ backgroundColor: '#3b82f6' }} />
              <span>Appts:</span>
              <span className={styles.statPillVal}>{totalAppointments}</span>
            </div>
            <div className={styles.statPill} title="Total patient visits in 7-day trend">
              <span className={styles.statPillDot} style={{ backgroundColor: '#10b981' }} />
              <span>Patients:</span>
              <span className={styles.statPillVal}>{totalPatients}</span>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          {mounted && (
            <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={200}>
              <LineChart
                data={patientData}
                margin={{ top: 12, right: 16, left: -10, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  dy={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    padding: '10px 14px'
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ color: '#0f172a', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                />
                <Line
                  name="Appointments"
                  type="monotone"
                  dataKey="appointments"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#3b82f6' }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
                <Line
                  name="Patients"
                  type="monotone"
                  dataKey="patients"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Section 2: Treatment by Type ── */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div className={styles.titleArea}>
            <h3 className={styles.chartTitle}>
              <span>🦷</span>
              <span>Treatments by Type</span>
            </h3>
            <p className={styles.chartSubtitle}>
              {totalTreatments > 0
                ? `${totalTreatments} clinical procedure${totalTreatments === 1 ? '' : 's'} recorded`
                : 'Clinical procedure distribution'}
            </p>
          </div>

          <div className={styles.headerPills}>
            <div className={styles.viewToggleGroup} role="group" aria-label="Chart view mode">
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${treatmentView === 'donut' ? styles.viewToggleActive : ''}`}
                onClick={() => setTreatmentView('donut')}
                title="Switch to Donut Chart"
              >
                🍩 Donut
              </button>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${treatmentView === 'bar' ? styles.viewToggleActive : ''}`}
                onClick={() => setTreatmentView('bar')}
                title="Switch to Horizontal Bar Chart"
              >
                📊 Bar
              </button>
            </div>
          </div>
        </div>

        {treatmentData.length === 0 ? (
          <div className={styles.chartContainer}>
            <div className={styles.emptyTreatments}>
              <span>🩺</span>
              <p style={{ marginTop: '8px' }}>
                {loading ? 'Loading treatment records…' : 'No treatment records recorded yet.'}
              </p>
            </div>
          </div>
        ) : treatmentView === 'donut' ? (
          /* ── Donut Chart + Responsive Legend Layout ── */
          <div className={styles.treatmentLayout}>
            <div className={styles.treatmentChartHalf}>
              {mounted && (
                <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={160}>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="80%"
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={600}
                    >
                      {treatmentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                      formatter={(value, name) => [`${value} procedures`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Scrollable & Wrap Legend List */}
            <div className={styles.treatmentLegendHalf}>
              {treatmentData.map((item, idx) => {
                const pct = totalTreatments > 0
                  ? Math.round((Number(item.value) / totalTreatments) * 100)
                  : 0;
                return (
                  <div key={idx} className={styles.treatmentLegendItem} title={`${item.name}: ${item.value} (${pct}%)`}>
                    <div className={styles.treatmentLegendLeft}>
                      <span
                        className={styles.treatmentColorDot}
                        style={{ backgroundColor: item.color || '#3b82f6' }}
                      />
                      <span className={styles.treatmentName}>{item.name}</span>
                    </div>
                    <div className={styles.treatmentLegendRight}>
                      <span className={styles.treatmentCount}>{item.value}</span>
                      <span className={styles.treatmentPercent}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Horizontal Bar Chart with Categories Layout ── */
          <div className={styles.chartContainer}>
            {mounted && (
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={200}>
                <BarChart
                  data={treatmentData}
                  layout="vertical"
                  margin={{ top: 10, right: 24, left: 10, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                    width={110}
                    tickFormatter={(val) => (typeof val === 'string' && val.length > 15 ? `${val.slice(0, 14)}…` : val)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      padding: '8px 12px'
                    }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    formatter={(value, name) => [`${value} procedures`, 'Count']}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                    animationDuration={600}
                  >
                    {treatmentData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
