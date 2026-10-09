import React, { useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ConsultationProvider } from '../context/ConsultationContext';
import styles from './OdontogramPage.module.css';

const FDI_ADULT = {
  UR: [18, 17, 16, 15, 14, 13, 12, 11],
  UL: [21, 22, 23, 24, 25, 26, 27, 28],
  LR: [48, 47, 46, 45, 44, 43, 42, 41],
  LL: [31, 32, 33, 34, 35, 36, 37, 38]
};

const FDI_PRIMARY = {
  UR: [55, 54, 53, 52, 51],
  UL: [61, 62, 63, 64, 65],
  LR: [85, 84, 83, 82, 81],
  LL: [71, 72, 73, 74, 75]
};

const FDI_MIXED = {
  UR: [18, 17, 16, 55, 54, 53, 52, 51, 11],
  UL: [21, 61, 62, 63, 64, 65, 26, 27, 28],
  LR: [48, 47, 46, 85, 84, 83, 82, 81, 41],
  LL: [31, 71, 72, 73, 74, 75, 36, 37, 38]
};

const EXAM_OPTIONS = [
  "Pain on palpation positive",
  "TOP Negative",
  "Sensitivity on palpation positive",
  "Sensitivity on air blow Negative",
  "TOP positive",
  "Mobility Grade 1",
  "Mobility Grade 2",
  "Deep Pocket"
];

const DIAGNOSIS_OPTIONS = [
  "Gingivitis",
  "Reversible Pulpitis",
  "Irreversible Pulpitis",
  "Dental Caries",
  "Periodontitis",
  "Fractured Tooth",
  "Periapical Abscess"
];

const TREATMENT_OPTIONS = [
  "Scaling and Root Planing",
  "Root Canal Treatment",
  "Extraction",
  "Composite Filling",
  "Amalgam Filling",
  "Dental Crown",
  "Implant",
  "EXTRACTION OF THIRD MOLAR",
  "COMPOSITE RESTORATION"
];

const DropdownSelect = ({ label, value, onChange, options, placeholder = "Search & Select", extraContent = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.formGroup} style={{ position: 'relative' }}>
      <label className={styles.formLabel}>{label}</label>
      <div 
        className={styles.searchInput}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ opacity: value ? 1 : 0.6 }}>{value || placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.dropdownSearch}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
          <div className={styles.dropdownList}>
            {filteredOptions.map(opt => (
              <div 
                key={opt} 
                className={`${styles.dropdownItem} ${value === opt ? styles.selectedItem : ''}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {opt}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className={styles.dropdownItem} style={{ color: '#94a3b8', fontStyle: 'italic', cursor: 'default' }}>
                 No matches found.
              </div>
            )}
          </div>
        </div>
      )}
      {extraContent}
    </div>
  );
};

const getToothImage = (num) => {
    let type = 'molar';
    let isUpper = [1, 2, 5, 6].includes(Math.floor(num / 10));
    let lastDigit = num % 10;
    
    if (lastDigit >= 1 && lastDigit <= 3) type = 'incisor';
    else if (lastDigit >= 4 && lastDigit <= 5) type = 'premolar';
    
    return `/${type}.png`; 
};

const Tooth = React.memo(({ num, isSelected, onClick, condition }) => {
  const isLower = [3, 4, 7, 8].includes(Math.floor(num / 10));
  
  let indicatorColor = 'transparent';
  if (condition === 'Treatment Taken Before') indicatorColor = '#a855f7'; 
  else if (condition === 'Teeth Removed') indicatorColor = '#94a3b8'; 
  else if (condition === 'Recommended To Take Treatment') indicatorColor = '#eab308'; 

  return (
    <div className={styles.toothItem} onClick={(e) => onClick(num, e)}>
      <div className={styles.toothImageWrapper}>
        <img 
          src={getToothImage(num)} 
          alt={`Tooth ${num}`} 
          className={styles.toothImg}
          style={{ 
              transform: isLower ? 'scaleY(-1)' : 'none',
              opacity: condition === 'Teeth Removed' ? 0.3 : 1
          }} 
        />
      </div>
      <div className={`${styles.toothNumber} ${isSelected ? styles.selectedNumber : ''}`}>
        {num}
      </div>
      {indicatorColor !== 'transparent' && (
          <div className={styles.conditionDot} style={{ backgroundColor: indicatorColor }}></div>
      )}
    </div>
  );
});

function OdontogramContent({ isWorkflowStep }) {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [dentition, setDentition] = useState('Adult');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [existingConditions, setExistingConditions] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [viewRegion, setViewRegion] = useState('Full Mouth');
  
  // Explicit tracking as requested
  const [selectedType, setSelectedType] = useState(''); // 'tooth' | 'custom'
  const [selectedValue, setSelectedValue] = useState('');

  // Form State
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [selectedSurfaces, setSelectedSurfaces] = useState([]);
  const [plannedTreatments, setPlannedTreatments] = useState([]);

  // Treatment History Integration
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  
  React.useEffect(() => {
    if (patientId) {
      const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      
      fetch(`http://127.0.0.1:8000/api/patient/${patientId}/treatment-history/`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTreatmentHistory(data);
            
            // Map past treatments to Odontogram conditions
            const newConditions = {};
            data.forEach(item => {
              if (item.tooth_number && item.status?.toLowerCase() === 'completed') {
                const toothStr = item.tooth_number.toString();
                if (toothStr.includes(',')) {
                  toothStr.split(',').map(t => t.trim()).forEach(t => {
                    newConditions[parseInt(t)] = 'Treatment Taken Before';
                  });
                } else {
                  newConditions[parseInt(toothStr)] = 'Treatment Taken Before';
                }
              }
            });
            setExistingConditions(prev => ({...prev, ...newConditions}));
          }
        })
        .catch(err => console.error("Failed to fetch treatment history", err));
    }
  }, [patientId]);

  const toggleSurface = (surface) => {
    setSelectedSurfaces(prev => 
        prev.includes(surface) ? prev.filter(s => s !== surface) : [...prev, surface]
    );
  };

  const currentFDI = dentition === 'Adult' ? FDI_ADULT : dentition === 'Pedo' ? FDI_PRIMARY : FDI_MIXED;

  const handleToothClick = useCallback((num, e) => {
    const isModifierPressed = e && (e.ctrlKey || e.metaKey || e.shiftKey);
    const multi = isMultiSelect || isModifierPressed;

    setSelectedTeeth(prev => {
      if (multi) {
        if (prev.includes(num)) {
          return prev.filter(t => t !== num);
        }
        return [...prev, num];
      } else {
        if (prev.includes(num)) {
          return [];
        }
        return [num];
      }
    });

    if (!multi) {
      setIsPanelOpen(true);
    }
  }, [isMultiSelect]);

  React.useEffect(() => {
    if (selectedTeeth.length === 0) {
        setIsPanelOpen(false);
        setSelectedType('');
        setSelectedValue('');
    } else if (selectedTeeth.length === 1) {
        setSelectedType('tooth');
        setSelectedValue(selectedTeeth[0]);
    } else {
        setSelectedType('custom');
    }
  }, [selectedTeeth]);


  const handleRegionSelect = (region) => {
    setViewRegion(region);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedTeeth([]);
    setSelectedType('');
    setSelectedValue('');
    setSelectedSurfaces([]);
  };

  const handleAddTreatment = () => {
    // Save to local state mapping
    const newConditions = { ...existingConditions };
    const newTreatments = [];
    
    selectedTeeth.forEach(t => {
      newConditions[t] = 'Recommended To Take Treatment';
      
      newTreatments.push({
         id: Date.now() + Math.random(),
         tooth: t.toString(),
         category: diagnosis,
         treatment: treatment,
         surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
         examination: examination
      });
    });
    
    setExistingConditions(newConditions);
    setPlannedTreatments(prev => [...prev, ...newTreatments]);
    
    setExamination('');
    setDiagnosis('');
    setTreatment('');
    setSelectedSurfaces([]);
    handleClosePanel();
  };

  const handleSaveAndContinue = () => {
    let finalTreatments = [...plannedTreatments];
    
    if (selectedTeeth.length > 0) {
        selectedTeeth.forEach(t => {
            finalTreatments.push({
               id: Date.now() + Math.random(),
               tooth: t.toString(),
               category: diagnosis || 'Diagnosis Required',
               treatment: treatment || 'Treatment Required',
               surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
               examination: examination || ''
            });
        });
    }

    if (finalTreatments.length === 0) {
        alert("Please select at least one tooth before saving.");
        return;
    }

    // Navigate directly to Treatment Plans page, bypassing Diagnosis Page
    navigate(`/doctor/treatment-plans/${patientId || 'new'}`, { 
        state: { diagnoses: finalTreatments } 
    });
  };

  const getPanelTitle = () => {
    if (selectedType === 'tooth') return `Treatment Plan — Tooth ${selectedValue}`;
    return 'Treatment Plan for Selected Teeth';
  };

  const showUR = ['Full Mouth', 'Upper', 'Upper Right'].includes(viewRegion);
  const showUL = ['Full Mouth', 'Upper', 'Upper Left'].includes(viewRegion);
  const showLR = ['Full Mouth', 'Lower', 'Lower Right'].includes(viewRegion);
  const showLL = ['Full Mouth', 'Lower', 'Lower Left'].includes(viewRegion);

  const showUpperRow = showUR || showUL;
  const showLowerRow = showLR || showLL;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dental Chart & Treatment Plans</h1>
        <div className={styles.controlsRow}>
          <div className={styles.dentitionToggles}>
            <button className={`${styles.toggleBtn} ${dentition === 'Adult' ? styles.active : ''}`} onClick={() => setDentition('Adult')}>Adult</button>
            <button className={`${styles.toggleBtn} ${dentition === 'Pedo' ? styles.active : ''}`} onClick={() => setDentition('Pedo')}>Pedo</button>
            <button className={`${styles.toggleBtn} ${dentition === 'Mixed' ? styles.active : ''}`} onClick={() => setDentition('Mixed')}>Mixed</button>
          </div>
          
          <button 
              className={`${styles.toggleBtn} ${isMultiSelect ? styles.active : ''}`}
              onClick={() => setIsMultiSelect(!isMultiSelect)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #cbd5e1' }}
          >
              {isMultiSelect ? '✓ Multi-Select Teeth' : 'Multi-Select Teeth'}
          </button>
        </div>
      </div>

      <div className={`${styles.chartArea} ${isPanelOpen ? styles.chartAreaShifted : ''}`}>
        
        <div className={styles.regionSelectors}>
            {['Full Mouth', 'Upper', 'Lower', 'Upper Right', 'Upper Left', 'Lower Right', 'Lower Left'].map(region => (
                <button 
                    key={region}
                    className={`${styles.regionBtn} ${viewRegion === region ? styles.activeRegionBtn : ''}`} 
                    onClick={() => handleRegionSelect(region)}
                >
                    {region}
                </button>
            ))}
        </div>

        <div className={styles.archContainer}>
          {showUpperRow && (
            <div className={styles.archRow}>
              {showUR && currentFDI.UR.map(num => (
                <Tooth key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={handleToothClick} condition={existingConditions[num]} />
              ))}
              {showUR && showUL && <div style={{ width: '40px' }} />} {/* Midline gap */}
              {showUL && currentFDI.UL.map(num => (
                <Tooth key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={handleToothClick} condition={existingConditions[num]} />
              ))}
            </div>
          )}
          
          {showUpperRow && showLowerRow && <div style={{ height: '40px' }}></div>}
          
          {showLowerRow && (
            <div className={styles.archRow}>
              {showLR && currentFDI.LR.map(num => (
                <Tooth key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={handleToothClick} condition={existingConditions[num]} />
              ))}
              {showLR && showLL && <div style={{ width: '40px' }} />} {/* Midline gap */}
              {showLL && currentFDI.LL.map(num => (
                <Tooth key={num} num={num} isSelected={selectedTeeth.includes(num)} onClick={handleToothClick} condition={existingConditions[num]} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.legendBar}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#a855f7' }}></span>
            Treatment Taken Before
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#94a3b8' }}></span>
            Teeth Removed
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: '#eab308' }}></span>
            Recommended To Take Treatment
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        {selectedTeeth.length > 0 && (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Selected Teeth: {selectedTeeth.length} </span>
                    <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>|</span> 
                    {selectedTeeth.map(t => (
                        <span key={t} style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {t}
                            <button onClick={() => handleToothClick(t)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                        </span>
                    ))}
                </div>
                
                <button 
                    onClick={() => {
                        setIsPanelOpen(true);
                    }}
                    style={{ background: 'white', border: '1px solid #14b8a6', color: '#14b8a6', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                    Treatment Plan for Selected Teeth
                </button>
                
                <button 
                    onClick={() => {
                        setSelectedTeeth([]);
                    }}
                    style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                    Clear Selection
                </button>
            </div>
        )}
        <button className={styles.btnPrimary} style={{ marginLeft: selectedTeeth.length === 0 ? 'auto' : '0' }} onClick={handleSaveAndContinue}>Save & Continue</button>
      </div>

      {/* Side Panel Overlay & Panel */}
      <div className={`${styles.panelOverlay} ${isPanelOpen ? styles.open : ''}`} onClick={handleClosePanel}></div>
      <div className={`${styles.sidePanel} ${isPanelOpen ? styles.open : ''}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>{getPanelTitle()}</div>
          <button className={styles.closeBtn} onClick={handleClosePanel}>&times;</button>
        </div>
        
        <div className={styles.panelContent}>
          {plannedTreatments.filter(pt => selectedTeeth.includes(parseInt(pt.tooth))).length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Added Treatments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plannedTreatments.filter(pt => selectedTeeth.includes(parseInt(pt.tooth))).map(pt => (
                  <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#0f172a' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#0ea5e9' }}>{pt.treatment}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pt.category} {pt.examination ? ` • ${pt.examination}` : ''}</span>
                    </div>
                    <button 
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                      onClick={() => setPlannedTreatments(prev => prev.filter(p => p.id !== pt.id))}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(selectedType === 'tooth' || selectedType === 'custom') && (
            <div className={styles.toothVisuals}>
              {selectedType === 'tooth' && selectedTeeth.length === 1 && (
                <div className={styles.selectedToothDisplay}>
                  <img 
                    src={getToothImage(selectedValue)} 
                    alt={`Tooth ${selectedValue}`} 
                    className={styles.panelToothImg} 
                    style={{ transform: [3, 4, 7, 8].includes(Math.floor(selectedValue / 10)) ? 'scaleY(-1)' : 'none' }}
                  />
                  <div className={styles.panelToothNumber}>{selectedValue}</div>
                </div>
              )}
              {selectedType === 'custom' && selectedTeeth.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <img 
                    src={getToothImage(selectedTeeth[0])} 
                    alt="Tooth" 
                    style={{ width: '48px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))', transform: [3, 4, 7, 8].includes(Math.floor(selectedTeeth[0] / 10)) ? 'scaleY(-1)' : 'none' }}
                  />
                  <div style={{ background: '#f8fafc', padding: '0.5rem 1.25rem', borderRadius: '9999px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0', fontSize: '1.1rem', letterSpacing: '1px' }}>
                    {selectedTeeth.join(', ')}
                  </div>
                </div>
              )}
              
              <div className={styles.surfaceSelector} title="Select surfaces">
                <svg viewBox="0 0 100 100" stroke="currentColor" strokeWidth="2" style={{ width: '100%', height: '100%' }}>
                  {/* Top (Buccal/Facial) */}
                  <path className={styles.surfacePath} d="M 22 22 L 78 22 L 65 35 L 35 35 Z" fill={selectedSurfaces.includes('B') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('B')} />
                  {/* Right (Mesial/Distal) */}
                  <path className={styles.surfacePath} d="M 78 22 L 78 78 L 65 65 L 65 35 Z" fill={selectedSurfaces.includes('R') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('R')} />
                  {/* Bottom (Lingual/Palatal) */}
                  <path className={styles.surfacePath} d="M 22 78 L 78 78 L 65 65 L 35 65 Z" fill={selectedSurfaces.includes('L') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('L')} />
                  {/* Left (Distal/Mesial) */}
                  <path className={styles.surfacePath} d="M 22 22 L 22 78 L 35 65 L 35 35 Z" fill={selectedSurfaces.includes('M') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('M')} />
                  {/* Center (Occlusal/Incisal) */}
                  <rect className={styles.surfacePath} x="35" y="35" width="30" height="30" fill={selectedSurfaces.includes('O') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('O')} />
                </svg>
              </div>
            </div>
          )}

          {selectedType === 'tooth' && selectedTeeth.length === 1 && (() => {
            const historyForTooth = treatmentHistory.filter(h => 
              h.tooth_number && h.tooth_number.toString().includes(selectedValue.toString())
            );
            
            if (historyForTooth.length > 0) {
              return (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Tooth History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {historyForTooth.map((h, idx) => (
                      <div key={idx} style={{ fontSize: '0.875rem', color: '#334155', paddingBottom: idx < historyForTooth.length - 1 ? '0.75rem' : '0', borderBottom: idx < historyForTooth.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <strong>{new Date(h.date).toLocaleDateString()}</strong>
                          <span style={{ fontSize: '0.75rem', color: h.status?.toLowerCase() === 'completed' ? '#10b981' : '#f59e0b', fontWeight: '600' }}>{h.status || 'Unknown'}</span>
                        </div>
                        <div><strong>Tx:</strong> {h.treatment || 'N/A'}</div>
                        {h.diagnosis?.length > 0 && <div><strong>Dx:</strong> {h.diagnosis.join(', ')}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <DropdownSelect 
            label="On Examination" 
            value={examination} 
            onChange={setExamination} 
            options={EXAM_OPTIONS} 
          />

          <DropdownSelect 
            label={<>Diagnosis <small>Select from suggestions</small></>} 
            value={diagnosis} 
            onChange={setDiagnosis} 
            options={DIAGNOSIS_OPTIONS}
            extraContent={
              <>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>Suggestions</div>
                <div className={styles.suggestions}>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Gingivitis')}>Gingivitis</div>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Reversible Pulpitis')}>Reversible Pulpitis</div>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Dental Caries')}>Dental Caries</div>
                </div>
              </>
            }
          />

          <DropdownSelect 
            label="Treatment Suggested *" 
            value={treatment} 
            onChange={setTreatment} 
            options={TREATMENT_OPTIONS}
            placeholder="Select a plan"
            extraContent={
              <div className={styles.suggestions} style={{ marginTop: '0.75rem' }}>
                <div className={styles.suggestionChip} onClick={() => setTreatment('EXTRACTION OF THIRD MOLAR')}>EXTRACTION OF THIRD MOLAR</div>
                <div className={styles.suggestionChip} onClick={() => setTreatment('COMPOSITE RESTORATION')}>COMPOSITE RESTORATION</div>
              </div>
            }
          />
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.btnAdd} onClick={handleAddTreatment}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default function OdontogramPage({ isWorkflowStep }) {
  return (
    <ConsultationProvider>
      <OdontogramContent isWorkflowStep={isWorkflowStep} />
    </ConsultationProvider>
  );
}
