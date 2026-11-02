import React, { useState } from 'react';

const CONDITIONS = [
  { name: 'Healthy', color: '#10b981' },
  { name: 'Caries', color: '#ef4444' },
  { name: 'Deep Caries', color: '#dc2626' },
  { name: 'Missing', color: '#1f2937' },
  { name: 'Impacted', color: '#6366f1' },
  { name: 'Fracture', color: '#f43f5e' },
  { name: 'Root Stump', color: '#b45309' },
  { name: 'Mobility', color: '#ec4899' },
  { name: 'RCT', color: '#a855f7' },
  { name: 'Crown', color: '#eab308' },
  { name: 'Bridge', color: '#06b6d4' },
  { name: 'Implant', color: '#3b82f6' },
  { name: 'Extraction Planned', color: '#7f1d1d' },
  { name: 'Calculus', color: '#14b8a6' },
  { name: 'Restoration', color: '#f97316' }
];

const SURFACE_PATHS = {
  Buccal: "M 4 4 L 32 4 L 24 12 L 12 12 Z",
  Occlusal: "M 12 12 L 24 12 L 24 24 L 12 24 Z",
  Lingual: "M 4 32 L 32 32 L 24 24 L 12 24 Z",
  Mesial: "M 4 4 L 12 12 L 12 24 L 4 32 Z",
  Distal: "M 32 4 L 24 12 L 24 24 L 32 32 Z"
};

export default function ToothChartUIKit({
  selectedTeeth = [],
  onSelectionChange,
  toothConditions = {},
  onToothConditionChange,
  tmjAssessment = {},
  onTmjChange
}) {
  const [activeTab, setActiveTab] = useState('adult'); // 'adult', 'pediatric', 'tmj'
  const [activeTooth, setActiveTooth] = useState(null); // currently active tooth in side panel
  const [undoHistory, setUndoHistory] = useState([]); // undo history queue

  // Temp state for editing fields in side panel
  const [editorConditions, setEditorConditions] = useState([]);
  const [editorSurfaces, setEditorSurfaces] = useState([]);
  const [editorProcedure, setEditorProcedure] = useState('');
  const [editorDiagnosis, setEditorDiagnosis] = useState('');
  const [editorMaterials, setEditorMaterials] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [editorImages, setEditorImages] = useState([]);

  const quadrants = {
    UR: [18, 17, 16, 15, 14, 13, 12, 11],
    UL: [21, 22, 23, 24, 25, 26, 27, 28],
    LL: [31, 32, 33, 34, 35, 36, 37, 38],
    LR: [48, 47, 46, 45, 44, 43, 42, 41]
  };

  const primaryQuadrants = {
    UR: [55, 54, 53, 52, 51],
    UL: [61, 62, 63, 64, 65],
    LL: [71, 72, 73, 74, 75],
    LR: [85, 84, 83, 82, 81]
  };

  const handleToothClick = (num, e) => {
    e.stopPropagation();
    
    // Toggle active selected tooth list
    const updated = selectedTeeth.includes(num)
      ? selectedTeeth.filter(t => t !== num)
      : [...selectedTeeth, num];
    onSelectionChange(updated);

    // Initialize side panel editor for this tooth
    const current = toothConditions[num] || { conditions: ['Healthy'], surfaces: [], procedure: '', diagnosis: '', materials: '', notes: '', images: [] };
    setActiveTooth(num);
    setEditorConditions(current.conditions || (current.condition ? [current.condition] : ['Healthy']));
    setEditorSurfaces(current.surfaces || []);
    setEditorProcedure(current.procedure || '');
    setEditorDiagnosis(current.diagnosis || '');
    setEditorMaterials(current.materials || '');
    setEditorNotes(current.notes || '');
    setEditorImages(current.images || []);
  };

  const saveToothDetails = () => {
    if (!activeTooth) return;

    // Save history for undoing
    setUndoHistory([...undoHistory, JSON.parse(JSON.stringify(toothConditions))]);

    onToothConditionChange(activeTooth, {
      conditions: editorConditions,
      surfaces: editorSurfaces,
      procedure: editorProcedure,
      diagnosis: editorDiagnosis,
      materials: editorMaterials,
      notes: editorNotes,
      images: editorImages,
      condition: editorConditions[0] || 'Healthy',
      color: CONDITIONS.find(c => c.name === editorConditions[0])?.color || '#10b981'
    });
  };

  const triggerUndo = () => {
    if (undoHistory.length > 0) {
      const prev = undoHistory[undoHistory.length - 1];
      onToothConditionChange('RESET_ALL', prev);
      setUndoHistory(undoHistory.slice(0, -1));
    }
  };

  const toggleEditorCondition = (name) => {
    if (name === 'Healthy') {
      setEditorConditions(['Healthy']);
      return;
    }
    const list = editorConditions.filter(c => c !== 'Healthy');
    if (list.includes(name)) {
      const next = list.filter(c => c !== name);
      setEditorConditions(next.length === 0 ? ['Healthy'] : next);
    } else {
      setEditorConditions([...list, name]);
    }
  };

  const toggleEditorSurface = (surf) => {
    if (editorSurfaces.includes(surf)) {
      setEditorSurfaces(editorSurfaces.filter(s => s !== surf));
    } else {
      setEditorSurfaces([...editorSurfaces, surf]);
    }
  };

  const handleEditorImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditorImages([...editorImages, ev.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getToothColor = (num) => {
    const data = toothConditions[num];
    if (!data) return '#f8fafc';
    
    const conds = data.conditions || [];
    if (conds.includes('Missing')) return '#cbd5e1';
    if (conds.includes('Deep Caries') || conds.includes('Caries')) return '#fee2e2';
    if (conds.includes('RCT')) return '#f3e8ff';
    if (conds.includes('Crown')) return '#fef9c3';
    
    return '#f8fafc';
  };

  const getSurfaceColor = (num, surface) => {
    const data = toothConditions[num];
    if (!data) return 'transparent';
    if (data.surfaces && data.surfaces.includes(surface)) {
      if (data.conditions && (data.conditions.includes('Caries') || data.conditions.includes('Deep Caries'))) {
        return '#ef4444';
      }
      return '#6C63FF';
    }
    return 'transparent';
  };

  const renderTooth = (num) => {
    const isSelected = selectedTeeth.includes(num);
    const isActive = activeTooth === num;
    const data = toothConditions[num] || { conditions: ['Healthy'] };
    const conds = data.conditions || (data.condition ? [data.condition] : ['Healthy']);
    const primaryCond = conds[0] || 'Healthy';
    const primaryColor = CONDITIONS.find(c => c.name === primaryCond)?.color || '#10b981';

    return (
      <div
        key={num}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6px',
          borderRadius: '10px',
          cursor: 'pointer',
          border: isActive ? '2px solid #6C63FF' : isSelected ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
          background: getToothColor(num),
          width: '52px',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxShadow: isActive ? '0 0 0 3px rgba(108, 99, 255, 0.15)' : 'none'
        }}
        onClick={(e) => handleToothClick(num, e)}
      >
        <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px' }}>{num}</span>
        
        <svg width="32" height="32" viewBox="0 0 36 36" style={{ overflow: 'visible', background: 'white', borderRadius: '4px' }}>
          <rect x="2" y="2" width="32" height="32" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          {Object.entries(SURFACE_PATHS).map(([surf, path]) => (
            <path
              key={surf}
              d={path}
              fill={getSurfaceColor(num, surf)}
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
          ))}
          {conds.includes('Missing') && (
            <path d="M 4 4 L 32 32 M 32 4 L 4 32" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
          )}
          {conds.includes('RCT') && (
            <path d="M 18 8 L 18 28" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
          )}
          {conds.includes('Crown') && (
            <rect x="6" y="6" width="24" height="24" rx="2" fill="none" stroke="#eab308" strokeWidth="2" />
          )}
        </svg>

        <span 
          style={{ 
            fontSize: '8px', 
            fontWeight: '700', 
            color: primaryColor, 
            marginTop: '4px', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            width: '100%', 
            textAlign: 'center' 
          }}
        >
          {conds[0]}
        </span>
      </div>
    );
  };

  const renderTMJJoint = (side) => {
    const data = tmjAssessment[side] || { tenderness: 'Normal', clicking: 'None', crepitus: false };
    return (
      <div 
        style={{
          flex: 1, background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{side} TMJ Joint</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>Tenderness / Pain Level</label>
          <select 
            style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', outline: 'none' }}
            value={data.tenderness}
            onChange={e => onTmjChange(side, { ...data, tenderness: e.target.value })}
          >
            <option value="Normal">Normal (No pain)</option>
            <option value="Mild Pain">Mild Tenderness</option>
            <option value="Moderate Pain">Moderate Pain</option>
            <option value="Severe Pain">Severe/Acute Pain</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: '700', color: '#475569' }}>Joint Clicking Sound</label>
          <select 
            style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', outline: 'none' }}
            value={data.clicking}
            onChange={e => onTmjChange(side, { ...data, clicking: e.target.value })}
          >
            <option value="None">None</option>
            <option value="Early Opening">Early Opening Click</option>
            <option value="Late Opening">Late Opening Click</option>
            <option value="Reciprocal">Reciprocal Clicking</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={data.crepitus} 
            onChange={e => onTmjChange(side, { ...data, crepitus: e.target.checked })} 
          />
          Crepitus Present
        </label>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      
      {/* LEFT / CENTER: TOOTH CHART SVG */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {[
              { id: 'adult', label: 'Adult Teeth' },
              { id: 'pediatric', label: 'Deciduous (Pediatric)' },
              { id: 'tmj', label: 'TMJ Assessment' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: 'none',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#6C63FF' : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {undoHistory.length > 0 && (
            <button 
              type="button" onClick={triggerUndo} 
              style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
              ↩️ Undo Chart
            </button>
          )}
        </div>

        {activeTab === 'adult' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {quadrants.UR.map(num => renderTooth(num))}
              <div style={{ width: '12px', borderLeft: '1.5px dashed #cbd5e1' }} />
              {quadrants.UL.map(num => renderTooth(num))}
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
              {quadrants.LR.map(num => renderTooth(num))}
              <div style={{ width: '12px', borderLeft: '1.5px dashed #cbd5e1' }} />
              {quadrants.LL.map(num => renderTooth(num))}
            </div>
          </div>
        )}

        {activeTab === 'pediatric' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {primaryQuadrants.UR.map(num => renderTooth(num))}
              <div style={{ width: '12px', borderLeft: '1.5px dashed #cbd5e1' }} />
              {primaryQuadrants.UL.map(num => renderTooth(num))}
            </div>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '12px' }}>
              {primaryQuadrants.LR.map(num => renderTooth(num))}
              <div style={{ width: '12px', borderLeft: '1.5px dashed #cbd5e1' }} />
              {primaryQuadrants.LL.map(num => renderTooth(num))}
            </div>
          </div>
        )}

        {activeTab === 'tmj' && (
          <div style={{ display: 'flex', gap: '20px' }}>
            {renderTMJJoint('Left')}
            {renderTMJJoint('Right')}
          </div>
        )}

        {activeTab !== 'tmj' && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            {CONDITIONS.slice(0, 10).map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDE PANEL TOOTH EDITOR */}
      <div 
        style={{
          width: '320px', borderLeft: '1.5px solid #cbd5e1', paddingLeft: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px'
        }}
      >
        {activeTooth ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Tooth #{activeTooth} Editor</span>
              <button type="button" onClick={() => setActiveTooth(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Conditions</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {CONDITIONS.map(c => (
                  <label key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" checked={editorConditions.includes(c.name)}
                      onChange={() => toggleEditorCondition(c.name)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Surfaces</span>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['Mesial', 'Distal', 'Occlusal', 'Buccal', 'Lingual', 'Palatal'].map(surf => (
                  <button
                    key={surf} type="button"
                    onClick={() => toggleEditorSurface(surf)}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                      border: editorSurfaces.includes(surf) ? '1.5px solid #6C63FF' : '1px solid #d1d5db',
                      background: editorSurfaces.includes(surf) ? '#f5f3ff' : 'white',
                      color: editorSurfaces.includes(surf) ? '#6C63FF' : '#475569'
                    }}
                  >
                    {surf}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Diagnosis</span>
              <input 
                className="input" style={{ padding: '6px 10px', fontSize: '12px' }}
                value={editorDiagnosis} onChange={e => setEditorDiagnosis(e.target.value)} placeholder="e.g. Dental Caries"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Procedure</span>
              <input 
                className="input" style={{ padding: '6px 10px', fontSize: '12px' }}
                value={editorProcedure} onChange={e => setEditorProcedure(e.target.value)} placeholder="e.g. RCT, Composite"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Materials</span>
              <input 
                className="input" style={{ padding: '6px 10px', fontSize: '12px' }}
                value={editorMaterials} onChange={e => setEditorMaterials(e.target.value)} placeholder="e.g. Zirconia Crown, GP Point"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Clinical Notes</span>
              <textarea 
                style={{ padding: '6px 10px', fontSize: '11px', minHeight: '44px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                value={editorNotes} onChange={e => setEditorNotes(e.target.value)} placeholder="Tooth specifics..."
              />
            </div>

            <button type="button" className="btnPrimary" onClick={saveToothDetails} style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '700', borderRadius: '6px', background: '#6C63FF', border: 'none', color: 'white', cursor: 'pointer' }}>
              Save Tooth Parameters
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>🦷</span>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>Select a tooth on the chart to edit conditions, procedures, and surfaces side-by-side.</span>
          </div>
        )}
      </div>

    </div>
  );
}
