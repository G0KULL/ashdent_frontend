import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  const [treatmentData, setTreatmentData] = useState([
    { name: 'Loading', value: 0, color: '#e2e8f0' },
  ]);

  useEffect(() => {
    const fetchStats = () => {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      fetch('http://127.0.0.1:8000/api/appointments/stats/', {
        headers: { 'X-User-Id': user.id || '', 'X-Username': user.username || '' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.weekly_trend) setPatientData(data.weekly_trend);
          if (data.treatments_by_type) setTreatmentData(data.treatments_by_type);
        })
        .catch(console.error);
    };

    fetchStats();
    const iv = setInterval(fetchStats, 60000); // refresh every 1 min
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
      
      {/* ── Line Chart: Appointments Trend ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Patient & Appointment Trend</h3>
        <div style={{ height: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={patientData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bar/Pie Chart: Treatment Stats ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Treatments by Type</h3>
        <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={treatmentData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} width={90} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {treatmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
