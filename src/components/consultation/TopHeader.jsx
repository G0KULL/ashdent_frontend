import React from 'react';
import { Search, Bell, Plus, User } from 'lucide-react';
import { useConsultation } from '../../context/ConsultationContext';

const TopHeader = ({ hidePatientHeader = false }) => {
  const { patient } = useConsultation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div style={{ 
        height: '64px', 
        backgroundColor: '#ffffff', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search patients, cases..." 
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.25rem',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Bell size={20} /></button>
          <button style={{ 
            backgroundColor: '#14b8a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '9999px', 
            width: '32px', 
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}><Plus size={20} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#64748b" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>Dr. Smith</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chief Dentist</div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Header Card */}
      {!hidePatientHeader && (
      <div style={{ 
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img src={patient.photo} alt={patient.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{patient.name}</h2>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', color: '#475569' }}>{patient.uhid}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              <span>{patient.age} yrs • {patient.gender}</span>
              <span>{patient.phone}</span>
              <span style={{ color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🩸 {patient.bloodGroup}
              </span>
              {patient.allergies.length > 0 && (
                <span style={{ color: '#b91c1c', backgroundColor: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                  Allergies: {patient.allergies.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Outstanding Amount</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>${patient.outstanding.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ 
              backgroundColor: 'white', 
              color: '#334155', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '0.5rem 1rem', 
              fontWeight: '500', 
              cursor: 'pointer' 
            }}>Patient Profile</button>
            <button style={{ 
              backgroundColor: '#f8fafc', 
              color: '#14b8a6', 
              border: '1px solid #ccfbf1', 
              borderRadius: '8px', 
              padding: '0.5rem 1rem', 
              fontWeight: '500', 
              cursor: 'pointer' 
            }}>Change Case</button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TopHeader;
