import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ConsultationProvider } from '../context/ConsultationContext';
import ClinicalCombobox from '../components/ClinicalCombobox';
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

const FDI_NAMES = {
  // Permanent Maxillary Right (Quadrant 1)
  18: "Maxillary Right Third Molar (Wisdom Tooth)",
  17: "Maxillary Right Second Molar",
  16: "Maxillary Right First Molar",
  15: "Maxillary Right Second Premolar",
  14: "Maxillary Right First Premolar",
  13: "Maxillary Right Canine",
  12: "Maxillary Right Lateral Incisor",
  11: "Maxillary Right Central Incisor",
  
  // Permanent Maxillary Left (Quadrant 2)
  21: "Maxillary Left Central Incisor",
  22: "Maxillary Left Lateral Incisor",
  23: "Maxillary Left Canine",
  24: "Maxillary Left First Premolar",
  25: "Maxillary Left Second Premolar",
  26: "Maxillary Left First Molar",
  27: "Maxillary Left Second Molar",
  28: "Maxillary Left Third Molar (Wisdom Tooth)",

  // Permanent Mandibular Left (Quadrant 3)
  31: "Mandibular Left Central Incisor",
  32: "Mandibular Left Lateral Incisor",
  33: "Mandibular Left Canine",
  34: "Mandibular Left First Premolar",
  35: "Mandibular Left Second Premolar",
  36: "Mandibular Left First Molar",
  37: "Mandibular Left Second Molar",
  38: "Mandibular Left Third Molar (Wisdom Tooth)",

  // Permanent Mandibular Right (Quadrant 4)
  41: "Mandibular Right Central Incisor",
  42: "Mandibular Right Lateral Incisor",
  43: "Mandibular Right Canine",
  44: "Mandibular Right First Premolar",
  45: "Mandibular Right Second Premolar",
  46: "Mandibular Right First Molar",
  47: "Mandibular Right Second Molar",
  48: "Mandibular Right Third Molar (Wisdom Tooth)",

  // Primary Maxillary Right (Quadrant 5)
  55: "Primary Maxillary Right Second Molar",
  54: "Primary Maxillary Right First Molar",
  53: "Primary Maxillary Right Canine",
  52: "Primary Maxillary Right Lateral Incisor",
  51: "Primary Maxillary Right Central Incisor",

  // Primary Maxillary Left (Quadrant 6)
  61: "Primary Maxillary Left Central Incisor",
  62: "Primary Maxillary Left Lateral Incisor",
  63: "Primary Maxillary Left Canine",
  64: "Primary Maxillary Left First Molar",
  65: "Primary Maxillary Left Second Molar",

  // Primary Mandibular Left (Quadrant 7)
  71: "Primary Mandibular Left Central Incisor",
  72: "Primary Mandibular Left Lateral Incisor",
  73: "Primary Mandibular Left Canine",
  74: "Primary Mandibular Left First Molar",
  75: "Primary Mandibular Left Second Molar",

  // Primary Mandibular Right (Quadrant 8)
  81: "Primary Mandibular Right Central Incisor",
  82: "Primary Mandibular Right Lateral Incisor",
  83: "Primary Mandibular Right Canine",
  84: "Primary Mandibular Right First Molar",
  85: "Primary Mandibular Right Second Molar",
};

const getToothMetadata = (num) => {
  const q = Math.floor(num / 10);
  const digit = num % 10;
  
  let arch = [1, 2, 5, 6].includes(q) ? 'Maxillary Arch (Upper Jaw)' : 'Mandibular Arch (Lower Jaw)';
  let quadrant = '';
  if (q === 1 || q === 5) quadrant = 'Upper Right (UR)';
  else if (q === 2 || q === 6) quadrant = 'Upper Left (UL)';
  else if (q === 3 || q === 7) quadrant = 'Lower Left (LL)';
  else if (q === 4 || q === 8) quadrant = 'Lower Right (LR)';
  
  let type = 'Molar';
  if (digit >= 1 && digit <= 2) type = 'Incisor';
  else if (digit === 3) type = 'Canine (Cuspid)';
  else if (digit >= 4 && digit <= 5) type = 'Premolar (Bicuspid)';

  return {
    name: FDI_NAMES[num] || `Tooth ${num}`,
    arch,
    quadrant,
    type,
    isPrimary: [5, 6, 7, 8].includes(q),
  };
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

const DropdownSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = "Search & Select", 
  extraContent = null,
  allowCustom = true,
  customTypeLabel = "Option",
  required = false
}) => (
  <ClinicalCombobox
    label={label}
    value={value}
    onChange={onChange}
    options={options}
    placeholder={placeholder}
    allowCustom={allowCustom}
    customTypeLabel={customTypeLabel}
    extraContent={extraContent}
    required={required}
  />
);

const getToothImage = (num) => {
    let type = 'molar';
    let lastDigit = num % 10;
    
    if (lastDigit >= 1 && lastDigit <= 3) type = 'incisor';
    else if (lastDigit >= 4 && lastDigit <= 5) type = 'premolar';
    
    return `/${type}.png`; 
};

const REPLACEMENT_PROCEDURES = [
  'implant', 
  'dental implant', 
  'bridge', 
  'denture', 
  'prosthesis',
  'bone graft',
  'space maintainer'
];

const isReplacementProcedure = (proc) => {
  if (!proc) return false;
  const p = proc.toLowerCase();
  return REPLACEMENT_PROCEDURES.some(rp => p.includes(rp));
};

const extractToothNumbers = (val) => {
  if (!val) return [];
  if (typeof val === 'number') return [val];
  const str = val.toString();
  const matches = str.match(/\b(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])\b/g);
  if (matches && matches.length > 0) {
    return [...new Set(matches.map(n => parseInt(n, 10)))];
  }
  const digits = str.match(/\d+/g);
  if (digits) {
    return [...new Set(digits.map(n => parseInt(n, 10)))];
  }
  return [];
};

const Tooth = React.memo(({ num, isSelected, onClick, condition }) => {
  const isLower = [3, 4, 7, 8].includes(Math.floor(num / 10));
  const meta = getToothMetadata(num);
  
  const isTaken = condition === 'Treatment Taken Before';
  const isRemoved = condition === 'Teeth Removed';
  const isRecommended = condition === 'Recommended To Take Treatment';

  let wrapperStatusClass = '';
  if (isTaken) wrapperStatusClass = styles.wrapperTaken;
  else if (isRemoved) wrapperStatusClass = styles.wrapperRemoved;
  else if (isRecommended) wrapperStatusClass = styles.wrapperRecommended;

  let indicatorColor = 'transparent';
  if (isTaken) indicatorColor = '#a855f7'; 
  else if (isRemoved) indicatorColor = '#94a3b8'; 
  else if (isRecommended) indicatorColor = '#eab308'; 

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(num, e);
    }
  };

  return (
    <div 
      className={`${styles.toothItem} ${isSelected ? styles.toothItemActive : ''}`} 
      onClick={(e) => onClick(num, e)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Tooth ${num} - ${meta.name}${condition ? `. Condition: ${condition}` : ''}`}
      title={`Tooth ${num} - ${meta.name}${condition ? ` (${condition})` : ''}`}
    >
      <div className={`${styles.toothImageWrapper} ${wrapperStatusClass}`}>
        <img 
          src={getToothImage(num)} 
          alt={`Tooth ${num}`} 
          className={styles.toothImg}
          style={{ 
              transform: isLower ? 'scaleY(-1)' : 'none',
          }} 
        />
        {isRemoved && (
          <div className={styles.removedCross} title="Tooth Removed">✕</div>
        )}
      </div>
      <div 
        className={`${styles.toothNumber} ${isSelected ? styles.selectedNumber : ''}`}
        style={!isSelected && condition ? {
          borderColor: indicatorColor,
          color: isTaken ? '#7e22ce' : isRemoved ? '#475569' : '#b45309',
          backgroundColor: isTaken ? '#f3e8ff' : isRemoved ? '#f1f5f9' : '#fef3c7'
        } : {}}
      >
        {num}
      </div>
      {indicatorColor !== 'transparent' && (
          <div className={styles.conditionDot} style={{ backgroundColor: indicatorColor }} title={condition}></div>
      )}
    </div>
  );
});

/* Centered Tooth Detail Modal Dialog */
const ToothDetailModal = ({ 
  isOpen, 
  onClose, 
  toothNum, 
  condition, 
  treatmentHistory, 
  plannedTreatments, 
  onAddTreatment,
  onUpdateCondition,
  onRemovePlannedTreatment,
  examination, setExamination,
  diagnosis, setDiagnosis,
  treatment, setTreatment,
  selectedSurfaces, toggleSurface,
  treatmentOptions = TREATMENT_OPTIONS,
  diagnosisOptions = DIAGNOSIS_OPTIONS,
  examOptions = EXAM_OPTIONS,
  conditionOptions = [],
  resolveAndSyncMasters
}) => {
  const [activeView, setActiveView] = useState('Buccal'); // 'Occlusal', 'Buccal', 'Lingual', 'Mesial', 'Distal'
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    setModalError('');
  }, [toothNum, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !toothNum) return null;

  const meta = getToothMetadata(toothNum);
  const isLower = [3, 4, 7, 8].includes(Math.floor(toothNum / 10));

  let statusBadge = { label: 'Healthy / No Treatment', color: '#10b981', bg: '#dcfce7', icon: '○' };
  if (condition === 'Treatment Taken Before') {
    statusBadge = { label: 'Treatment Taken Before', color: '#a855f7', bg: '#f3e8ff', icon: '✓' };
  } else if (condition === 'Teeth Removed') {
    statusBadge = { label: 'Tooth Removed', color: '#64748b', bg: '#f1f5f9', icon: '×' };
  } else if (condition === 'Recommended To Take Treatment') {
    statusBadge = { label: 'Recommended Treatment', color: '#d97706', bg: '#fef3c7', icon: '!' };
  }

  const toothHistory = (treatmentHistory || []).filter(h => {
    if (!h.tooth_number) return false;
    const nums = extractToothNumbers(h.tooth_number);
    return nums.includes(toothNum);
  });
  
  const toothPlanned = (plannedTreatments || []).filter(pt => 
    pt.tooth && pt.tooth.toString() === toothNum.toString()
  );

  const getViewTransform = () => {
    const baseFlip = isLower ? 'scaleY(-1)' : '';
    switch (activeView) {
      case 'Occlusal': return `${baseFlip} rotate(90deg) scale(0.95)`;
      case 'Lingual': return `${baseFlip} scaleX(-1)`;
      case 'Mesial': return `${baseFlip} rotate(-45deg)`;
      case 'Distal': return `${baseFlip} rotate(45deg)`;
      case 'Buccal':
      default: return baseFlip || 'none';
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleBlock}>
            <div className={styles.modalTitleBadge}>Tooth #{toothNum}</div>
            <div>
              <h2 className={styles.modalTitle}>{meta.name}</h2>
              <div className={styles.modalSubtitle}>{meta.arch} • {meta.quadrant}</div>
            </div>
          </div>

          <div className={styles.modalHeaderActions}>
            <span className={styles.statusPill} style={{ color: statusBadge.color, backgroundColor: statusBadge.bg }}>
              <span className={styles.statusPillIcon}>{statusBadge.icon}</span> {statusBadge.label}
            </span>
            <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal">&times;</button>
          </div>
        </div>

        {/* Body Grid: Left = Treatments, Right = Visuals & Anatomy */}
        <div className={styles.modalBody}>
          {/* Left Panel: Treatment Selection & History */}
          <div className={styles.modalLeftPanel}>
            <h3 className={styles.sectionHeader}>1. Treatment Selection & Actions</h3>

            {/* Warning Banner if Tooth is Removed */}
            {condition === 'Teeth Removed' && (
              <div className={styles.removedWarningBanner}>
                <div className={styles.removedWarningTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Tooth Recorded as Removed / Extracted
                </div>
                <div>
                  This tooth is marked as removed. Routine restorations (fillings, root canals, extractions) cannot be performed. Only tooth replacement procedures (Dental Implant, Bridge, Denture) or status changes are permitted.
                </div>
              </div>
            )}

            {/* Tooth Condition Selector (Master Backed) */}
            <div style={{ marginBottom: '0.85rem' }}>
              <DropdownSelect
                label="Tooth Condition"
                value={condition || ''}
                onChange={async (val) => {
                  setModalError('');
                  if (val && resolveAndSyncMasters) {
                    const resolved = await resolveAndSyncMasters({ conditionVal: val });
                    onUpdateCondition(toothNum, resolved.condition || val);
                  } else {
                    onUpdateCondition(toothNum, val || null);
                  }
                }}
                options={conditionOptions}
                placeholder="Select or enter condition (e.g. Decayed, Missing, Filled)..."
                customTypeLabel="Tooth Condition"
              />
            </div>

            {/* Quick Condition Actions */}
            <div className={styles.quickConditionRow} style={{ marginBottom: '1.25rem' }}>
              <button 
                type="button"
                className={`${styles.condBtn} ${condition === 'Teeth Removed' ? styles.condActiveRemove : ''}`}
                onClick={() => {
                  setModalError('');
                  onUpdateCondition(toothNum, condition === 'Teeth Removed' ? null : 'Teeth Removed');
                }}
              >
                {condition === 'Teeth Removed' ? '✓ Marked Removed' : 'Mark Tooth Removed'}
              </button>
              <button 
                type="button"
                className={`${styles.condBtn} ${condition === 'Treatment Taken Before' ? styles.condActiveTaken : ''}`}
                onClick={() => {
                  setModalError('');
                  onUpdateCondition(toothNum, condition === 'Treatment Taken Before' ? null : 'Treatment Taken Before');
                }}
              >
                {condition === 'Treatment Taken Before' ? '✓ Past Tx Recorded' : 'Mark Past Tx Taken'}
              </button>
            </div>

            {/* Added Treatments List */}
            {toothPlanned.length > 0 && (
              <div className={styles.addedTreatmentsCard}>
                <div className={styles.cardHeaderTitle}>Planned Treatments</div>
                {toothPlanned.map(pt => (
                  <div key={pt.id} className={styles.addedTxRow}>
                    <div>
                      <div className={styles.txName}>{pt.treatment}</div>
                      <div className={styles.txCategory}>{pt.category} {pt.surfaces ? `• Surfaces: ${pt.surfaces}` : ''}</div>
                    </div>
                    <button className={styles.txRemoveBtn} onClick={() => onRemovePlannedTreatment(pt.id)} title="Remove">&times;</button>
                  </div>
                ))}
              </div>
            )}

            {/* In-Modal Clinical Validation Warning */}
            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                <strong>Clinical Validation: </strong> {modalError}
              </div>
            )}

            {/* Dropdowns */}
            <DropdownSelect 
              label="On Examination" 
              value={examination} 
              onChange={setExamination} 
              options={examOptions} 
              placeholder="Search or enter clinical finding..."
              customTypeLabel="Clinical Finding"
            />

            <DropdownSelect 
              label={<>Diagnosis <small>Suggestions below</small></>} 
              value={diagnosis} 
              onChange={setDiagnosis} 
              options={diagnosisOptions}
              placeholder="Search or enter diagnosis..."
              customTypeLabel="Diagnosis"
              extraContent={
                <div className={styles.suggestions} style={{ marginTop: '0.5rem' }}>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Gingivitis')}>Gingivitis</div>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Reversible Pulpitis')}>Reversible Pulpitis</div>
                  <div className={styles.suggestionChip} onClick={() => setDiagnosis('Dental Caries')}>Dental Caries</div>
                </div>
              }
            />

            <DropdownSelect 
              label="Treatment Suggested" 
              value={treatment} 
              onChange={setTreatment} 
              options={treatmentOptions}
              placeholder="Select or enter procedure plan..."
              customTypeLabel="Treatment Procedure"
              required={true}
              extraContent={
                <div className={styles.suggestions} style={{ marginTop: '0.5rem' }}>
                  <div className={styles.suggestionChip} onClick={() => setTreatment('EXTRACTION OF THIRD MOLAR')}>EXTRACTION OF THIRD MOLAR</div>
                  <div className={styles.suggestionChip} onClick={() => setTreatment('COMPOSITE RESTORATION')}>COMPOSITE RESTORATION</div>
                </div>
              }
            />

            {/* Surface Selector SVG */}
            <div className={styles.surfaceSection}>
              <label className={styles.formLabel}>Select Tooth Surfaces</label>
              <div className={styles.surfaceSelectorBox}>
                <div className={styles.surfaceSelector} title="Click surfaces to select">
                  <svg viewBox="0 0 100 100" stroke="currentColor" strokeWidth="2" style={{ width: '100%', height: '100%' }}>
                    <path className={styles.surfacePath} d="M 22 22 L 78 22 L 65 35 L 35 35 Z" fill={selectedSurfaces.includes('B') ? '#3b82f6' : 'transparent'} onClick={() => toggleSurface('B')} />
                    <path className={styles.surfacePath} d="M 78 22 L 78 78 L 65 65 L 65 35 Z" fill={selectedSurfaces.includes('R') ? '#3b82f6' : 'transparent'} onClick={() => toggleSurface('R')} />
                    <path className={styles.surfacePath} d="M 22 78 L 78 78 L 65 65 L 35 65 Z" fill={selectedSurfaces.includes('L') ? '#3b82f6' : 'transparent'} onClick={() => toggleSurface('L')} />
                    <path className={styles.surfacePath} d="M 22 22 L 22 78 L 35 65 L 35 35 Z" fill={selectedSurfaces.includes('M') ? '#3b82f6' : 'transparent'} onClick={() => toggleSurface('M')} />
                    <rect className={styles.surfacePath} x="35" y="35" width="30" height="30" fill={selectedSurfaces.includes('O') ? '#3b82f6' : 'transparent'} onClick={() => toggleSurface('O')} />
                  </svg>
                </div>
                <div className={styles.surfaceLabels}>
                  <span><strong>B:</strong> Buccal/Facial</span>
                  <span><strong>L:</strong> Lingual/Palatal</span>
                  <span><strong>M:</strong> Mesial</span>
                  <span><strong>D/R:</strong> Distal</span>
                  <span><strong>O:</strong> Occlusal/Incisal</span>
                </div>
              </div>
            </div>

            {/* Past History for this tooth */}
            {toothHistory.length > 0 && (
              <div className={styles.historyCard}>
                <div className={styles.cardHeaderTitle}>Tooth Clinical History</div>
                {toothHistory.map((h, idx) => (
                  <div key={idx} className={styles.historyRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{new Date(h.date).toLocaleDateString()}</strong>
                      <span style={{ color: h.status?.toLowerCase() === 'completed' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {h.status || 'Completed'}
                      </span>
                    </div>
                    <div><strong>Tx:</strong> {h.treatment || 'N/A'}</div>
                    {h.diagnosis?.length > 0 && <div><strong>Dx:</strong> {Array.isArray(h.diagnosis) ? h.diagnosis.join(', ') : h.diagnosis}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Large Tooth Display, Views, Anatomy & Measurements */}
          <div className={styles.modalRightPanel}>
            <h3 className={styles.sectionHeader}>2. Anatomical View & Measurements</h3>

            {/* Tooth View Tabs */}
            <div className={styles.viewTabs}>
              {['Buccal', 'Occlusal', 'Lingual', 'Mesial', 'Distal'].map(view => (
                <button
                  key={view}
                  type="button"
                  className={`${styles.viewTabBtn} ${activeView === view ? styles.viewTabActive : ''}`}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Large Tooth Display Container */}
            <div className={`${styles.largeToothDisplay} ${
              condition === 'Treatment Taken Before' ? styles.largeDisplayTaken :
              condition === 'Teeth Removed' ? styles.largeDisplayRemoved :
              condition === 'Recommended To Take Treatment' ? styles.largeDisplayRecommended : ''
            }`}>
              <div className={styles.viewBadge}>{activeView} Aspect</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={getToothImage(toothNum)} 
                  alt={`Tooth ${toothNum} - ${activeView} view`}
                  className={styles.largeToothImg}
                  style={{ 
                    transform: getViewTransform(),
                    opacity: condition === 'Teeth Removed' ? 0.35 : 1,
                    filter: condition === 'Teeth Removed' ? 'grayscale(100%)' :
                            condition === 'Treatment Taken Before' ? 'drop-shadow(0 4px 10px rgba(168, 85, 247, 0.75))' :
                            condition === 'Recommended To Take Treatment' ? 'drop-shadow(0 4px 10px rgba(234, 179, 8, 0.8))' : 'none'
                  }}
                />
                {condition === 'Teeth Removed' && (
                  <div className={styles.removedCross} style={{ fontSize: '72px' }} title="Tooth Removed">✕</div>
                )}
              </div>
              <div className={styles.largeToothNumLabel}>FDI #{toothNum}</div>
            </div>

            {/* Tooth Identification Info Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>Tooth Identification</div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>FDI Number:</span>
                  <span className={styles.infoVal}>#{toothNum}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Tooth Type:</span>
                  <span className={styles.infoVal}>{meta.type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Arch / Jaw:</span>
                  <span className={styles.infoVal}>{meta.arch}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Quadrant:</span>
                  <span className={styles.infoVal}>{meta.quadrant}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Dentition:</span>
                  <span className={styles.infoVal}>{meta.isPrimary ? 'Primary (Deciduous)' : 'Permanent (Adult)'}</span>
                </div>
              </div>
            </div>

            {/* Dimensions / Anatomical Reference Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}>Dimensions & Measurements</div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Mesiodistal Width:</span>
                  <span className={styles.infoValNotRec}>Not recorded</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Buccolingual Width:</span>
                  <span className={styles.infoValNotRec}>Not recorded</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Crown Height:</span>
                  <span className={styles.infoValNotRec}>Not recorded</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Root Length:</span>
                  <span className={styles.infoValNotRec}>Not recorded</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoKey}>Overall Length:</span>
                  <span className={styles.infoValNotRec}>Not recorded</span>
                </div>
              </div>
              <div className={styles.notRecNote}>
                * Patient-specific millimeter measurements not recorded in current chart.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Close</button>
          <button 
            type="button" 
            className={styles.btnPrimary}
            onClick={async () => {
              if (treatment || diagnosis) {
                if (condition === 'Teeth Removed' && !isReplacementProcedure(treatment)) {
                  setModalError(`Tooth #${toothNum} is marked as Removed. Routine restorations or extractions cannot be performed on a missing tooth. Please select a replacement procedure (e.g. Implant, Bridge, Denture) or unmark the removed status.`);
                  return;
                }
                setModalError('');
                await onAddTreatment();
              } else {
                onClose();
              }
            }}
          >
            {treatment || diagnosis ? 'Apply Treatment & Save' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

function OdontogramContent({ isWorkflowStep }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  const [dentition, setDentition] = useState('Adult');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [existingConditions, setExistingConditions] = useState({});
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewRegion, setViewRegion] = useState('Full Mouth');
  const [validationMessage, setValidationMessage] = useState('');
  
  // Tracking
  const [selectedType, setSelectedType] = useState(''); // 'tooth' | 'custom'
  const [selectedValue, setSelectedValue] = useState('');

  // Form State
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [selectedSurfaces, setSelectedSurfaces] = useState([]);
  const [plannedTreatments, setPlannedTreatments] = useState([]);

  // Dynamic Master Catalogues (Backed by Master Module APIs)
  const [examOptions, setExamOptions] = useState(EXAM_OPTIONS);
  const [diagnosisOptions, setDiagnosisOptions] = useState(DIAGNOSIS_OPTIONS);
  const [treatmentOptions, setTreatmentOptions] = useState(TREATMENT_OPTIONS);
  const [conditionOptions, setConditionOptions] = useState([
    "Treatment Taken Before",
    "Teeth Removed",
    "Recommended To Take Treatment",
    "Decayed",
    "Filled",
    "Missing",
    "Healthy"
  ]);

  const fetchClinicalMasters = useCallback(async () => {
    try {
      const [txRes, dxRes, exRes, tcRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/masters/treatments/?active_only=true').then(r => r.ok ? r.json() : []),
        fetch('http://127.0.0.1:8000/api/masters/diagnoses/?active_only=true').then(r => r.ok ? r.json() : []),
        fetch('http://127.0.0.1:8000/api/masters/examinations/?active_only=true').then(r => r.ok ? r.json() : []),
        fetch('http://127.0.0.1:8000/api/masters/tooth-conditions/?active_only=true').then(r => r.ok ? r.json() : [])
      ]);
      
      if (Array.isArray(txRes) && txRes.length > 0) {
        setTreatmentOptions(txRes.map(item => item.name));
      }
      if (Array.isArray(dxRes) && dxRes.length > 0) {
        setDiagnosisOptions(dxRes.map(item => item.name));
      }
      if (Array.isArray(exRes) && exRes.length > 0) {
        setExamOptions(exRes.map(item => item.name));
      }
      if (Array.isArray(tcRes) && tcRes.length > 0) {
        setConditionOptions(tcRes.map(item => item.name));
      }
    } catch (e) {
      console.warn("Could not load dynamic clinical masters from backend, utilizing fallback options:", e);
    }
  }, []);

  useEffect(() => {
    fetchClinicalMasters();
  }, [fetchClinicalMasters]);

  const resolveAndSyncMasters = async ({ treatmentVal, diagnosisVal, examinationVal, conditionVal }) => {
    try {
      const payload = {};
      if (treatmentVal && treatmentVal.trim()) payload.treatment = treatmentVal.trim();
      if (diagnosisVal && diagnosisVal.trim()) payload.diagnosis = diagnosisVal.trim();
      if (examinationVal && examinationVal.trim()) payload.examination = examinationVal.trim();
      if (conditionVal && conditionVal.trim()) payload.condition = conditionVal.trim();

      if (Object.keys(payload).length === 0) {
        return { treatment: treatmentVal, diagnosis: diagnosisVal, examination: examinationVal, condition: conditionVal };
      }

      const res = await fetch('http://127.0.0.1:8000/api/masters/resolve-treatment-masters/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      if (data.catalogues) {
        if (data.catalogues.treatments?.length) setTreatmentOptions(data.catalogues.treatments);
        if (data.catalogues.diagnoses?.length) setDiagnosisOptions(data.catalogues.diagnoses);
        if (data.catalogues.examinations?.length) setExamOptions(data.catalogues.examinations);
        if (data.catalogues.conditions?.length) setConditionOptions(data.catalogues.conditions);
      }

      return {
        treatment: data.resolved?.treatment?.name || treatmentVal,
        diagnosis: data.resolved?.diagnosis?.name || diagnosisVal,
        examination: data.resolved?.examination?.name || examinationVal,
        condition: data.resolved?.condition?.name || conditionVal
      };
    } catch (err) {
      console.warn("Auto-create master error, proceeding with input value:", err);
      return { treatment: treatmentVal, diagnosis: diagnosisVal, examination: examinationVal, condition: conditionVal };
    }
  };

  // Treatment History Integration
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  
  useEffect(() => {
    // 1. Restore cached conditions from localStorage if available
    if (patientId) {
      try {
        const cached = localStorage.getItem('ashdent_odontogram_' + patientId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setExistingConditions(parsed);
          }
        }
      } catch (e) {
        console.error("Error reading cached odontogram", e);
      }
    }

    // 2. Fetch treatment history from backend
    if (patientId) {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      
      fetch(`http://127.0.0.1:8000/api/patient/${patientId}/treatment-history/`, { headers })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setTreatmentHistory(data);
            
            const historyConditions = {};
            data.forEach(item => {
              const toothNums = extractToothNumbers(item.tooth_number);
              if (toothNums.length === 0) return;

              const txName = (item.treatment || '').toLowerCase();
              const itemStatus = (item.status || '').toLowerCase();
              const isExtraction = txName.includes('extraction') || txName.includes('removed') || txName.includes('exodontia');

              toothNums.forEach(t => {
                if (isExtraction) {
                  historyConditions[t] = 'Teeth Removed';
                } else if (itemStatus === 'completed') {
                  historyConditions[t] = 'Treatment Taken Before';
                } else if (itemStatus === 'planned' || itemStatus === 'recommended') {
                  historyConditions[t] = 'Recommended To Take Treatment';
                }
              });
            });

            setExistingConditions(prev => {
              const merged = { ...historyConditions, ...prev };
              try {
                localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        })
        .catch(err => {
          console.warn("Could not load backend treatment history, utilizing local chart state:", err);
        });
    }
  }, [patientId]);

  const toggleSurface = (surface) => {
    setSelectedSurfaces(prev => 
        prev.includes(surface) ? prev.filter(s => s !== surface) : [...prev, surface]
    );
  };

  const currentFDI = dentition === 'Adult' ? FDI_ADULT : dentition === 'Pedo' ? FDI_PRIMARY : FDI_MIXED;

  const handleDentitionChange = (newDentition) => {
    setDentition(newDentition);
    const newFDI = newDentition === 'Adult' ? FDI_ADULT : newDentition === 'Pedo' ? FDI_PRIMARY : FDI_MIXED;
    const allTeethInDentition = [
      ...newFDI.UR,
      ...newFDI.UL,
      ...newFDI.LR,
      ...newFDI.LL
    ];
    // Filter out teeth that are not present in the new dentition
    setSelectedTeeth(prev => prev.filter(t => allTeethInDentition.includes(t)));
  };

  const handleToothClick = useCallback((num, e) => {
    const isModifierPressed = e && (e.ctrlKey || e.metaKey || e.shiftKey);
    const multi = isMultiSelect || isModifierPressed;

    setValidationMessage('');
    setSelectedTeeth(prev => {
      if (multi) {
        if (prev.includes(num)) {
          return prev.filter(t => t !== num);
        }
        return [...prev, num];
      } else {
        return [num];
      }
    });

    if (!multi) {
      setIsModalOpen(true);
      setIsPanelOpen(false);
    } else {
      setIsPanelOpen(true);
    }
  }, [isMultiSelect]);

  useEffect(() => {
    if (selectedTeeth.length === 0) {
        setIsPanelOpen(false);
        setIsModalOpen(false);
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
    const showUR = ['Full Mouth', 'Upper', 'Upper Right'].includes(region);
    const showUL = ['Full Mouth', 'Upper', 'Upper Left'].includes(region);
    const showLR = ['Full Mouth', 'Lower', 'Lower Right'].includes(region);
    const showLL = ['Full Mouth', 'Lower', 'Lower Left'].includes(region);

    const visibleTeeth = [];
    if (showUR) visibleTeeth.push(...currentFDI.UR);
    if (showUL) visibleTeeth.push(...currentFDI.UL);
    if (showLR) visibleTeeth.push(...currentFDI.LR);
    if (showLL) visibleTeeth.push(...currentFDI.LL);

    // Keep only selected teeth that remain visible in the new jaw region
    setSelectedTeeth(prev => prev.filter(t => visibleTeeth.includes(t)));
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setIsModalOpen(false);
    setSelectedTeeth([]);
    setSelectedType('');
    setSelectedValue('');
    setSelectedSurfaces([]);
    setValidationMessage('');
  };

  const handleUpdateCondition = (num, cond) => {
    setExistingConditions(prev => {
      const next = { ...prev };
      if (!cond) {
        delete next[num];
      } else {
        next[num] = cond;
      }
      if (patientId) {
        try {
          localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const handleRemovePlannedTreatment = (id) => {
    setPlannedTreatments(prev => prev.filter(p => p.id !== id));
  };

  const handleAddTreatment = async () => {
    // Resolve / auto-create masters for entered procedure, diagnosis, examination
    const resolved = await resolveAndSyncMasters({
      treatmentVal: treatment,
      diagnosisVal: diagnosis,
      examinationVal: examination,
      conditionVal: selectedValue ? existingConditions[selectedValue] : null
    });

    const activeTreatment = resolved.treatment || treatment;
    const activeDiagnosis = resolved.diagnosis || diagnosis;
    const activeExamination = resolved.examination || examination;

    const isReplacement = isReplacementProcedure(activeTreatment);
    const removedTeeth = selectedTeeth.filter(t => existingConditions[t] === 'Teeth Removed');

    // Validation: routine procedures cannot be performed on removed teeth
    if (removedTeeth.length > 0 && !isReplacement) {
      if (removedTeeth.length === selectedTeeth.length) {
        setValidationMessage(
          `Cannot apply "${activeTreatment || 'routine treatment'}" because all selected teeth (${removedTeeth.join(', ')}) are marked as removed. Missing teeth only accept replacement procedures such as Implant, Bridge, or Denture.`
        );
        return;
      }

      // Partial selection: apply routine treatment to eligible teeth only
      const eligibleTeeth = selectedTeeth.filter(t => existingConditions[t] !== 'Teeth Removed');
      const newConditions = { ...existingConditions };
      const newTreatments = [];

      eligibleTeeth.forEach(t => {
        newConditions[t] = 'Recommended To Take Treatment';
        newTreatments.push({
          id: Date.now() + Math.random(),
          tooth: t.toString(),
          category: activeDiagnosis || 'Diagnosis Required',
          treatment: activeTreatment || 'Treatment Required',
          surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
          examination: activeExamination || ''
        });
      });

      setExistingConditions(newConditions);
      setPlannedTreatments(prev => [...prev, ...newTreatments]);
      if (patientId) {
        try {
          localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(newConditions));
        } catch (e) {}
      }

      setExamination('');
      setDiagnosis('');
      setTreatment('');
      setSelectedSurfaces([]);
      setValidationMessage(`Applied treatment to eligible teeth (${eligibleTeeth.join(', ')}). Removed tooth (${removedTeeth.join(', ')}) was safely excluded.`);
      handleClosePanel();
      return;
    }

    // Standard application or replacement procedure on all selected teeth
    const newConditions = { ...existingConditions };
    const newTreatments = [];
    
    selectedTeeth.forEach(t => {
      newConditions[t] = 'Recommended To Take Treatment';
      newTreatments.push({
        id: Date.now() + Math.random(),
        tooth: t.toString(),
        category: activeDiagnosis || 'Diagnosis Required',
        treatment: activeTreatment || 'Treatment Required',
        surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
        examination: activeExamination || ''
      });
    });
    
    setExistingConditions(newConditions);
    setPlannedTreatments(prev => [...prev, ...newTreatments]);
    if (patientId) {
      try {
        localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(newConditions));
      } catch (e) {}
    }
    
    setExamination('');
    setDiagnosis('');
    setTreatment('');
    setSelectedSurfaces([]);
    setValidationMessage('');
    handleClosePanel();
  };

  const handleSaveAndContinue = async () => {
    let finalTreatments = [...plannedTreatments];
    
    // Check if there are uncommitted selections in the form with treatment/diagnosis
    if (selectedTeeth.length > 0 && (treatment || diagnosis)) {
      const resolved = await resolveAndSyncMasters({
        treatmentVal: treatment,
        diagnosisVal: diagnosis,
        examinationVal: examination,
        conditionVal: selectedValue ? existingConditions[selectedValue] : null
      });

      const activeTreatment = resolved.treatment || treatment;
      const activeDiagnosis = resolved.diagnosis || diagnosis;
      const activeExamination = resolved.examination || examination;

      const removedTeeth = selectedTeeth.filter(t => existingConditions[t] === 'Teeth Removed');
      const isReplacement = isReplacementProcedure(activeTreatment);
      
      if (removedTeeth.length > 0 && !isReplacement) {
        if (removedTeeth.length === selectedTeeth.length) {
          alert(`Cannot apply "${activeTreatment || 'routine treatment'}" to removed teeth (${removedTeeth.join(', ')}). Missing teeth only accept replacement procedures such as Implant, Bridge, or Denture.`);
          return;
        }
        // Partial: include only eligible teeth
        const eligible = selectedTeeth.filter(t => existingConditions[t] !== 'Teeth Removed');
        eligible.forEach(t => {
          finalTreatments.push({
            id: Date.now() + Math.random(),
            tooth: t.toString(),
            category: activeDiagnosis || 'Diagnosis Required',
            treatment: activeTreatment || 'Treatment Required',
            surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
            examination: activeExamination || ''
          });
        });
      } else {
        selectedTeeth.forEach(t => {
          finalTreatments.push({
            id: Date.now() + Math.random(),
            tooth: t.toString(),
            category: activeDiagnosis || 'Diagnosis Required',
            treatment: activeTreatment || 'Treatment Required',
            surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
            examination: activeExamination || ''
          });
        });
      }
    }

    // Persist conditions to localStorage
    if (patientId) {
      try {
        localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(existingConditions));
      } catch (e) {}
    }

    // Check if anything was charted or planned
    const hasChartedConditions = Object.keys(existingConditions).length > 0;
    if (finalTreatments.length === 0 && !hasChartedConditions && selectedTeeth.length === 0) {
      alert("Please chart a tooth condition or select a treatment before continuing to Treatment Plans.");
      return;
    }

    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/doctor';
    navigate(`${basePath}/treatment-plans/${patientId || 'new'}`, { 
      state: { 
        diagnoses: finalTreatments,
        chartConditions: existingConditions
      } 
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

  const removedSelectedTeeth = selectedTeeth.filter(t => existingConditions[t] === 'Teeth Removed');
  const eligibleSelectedTeeth = selectedTeeth.filter(t => existingConditions[t] !== 'Teeth Removed');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dental Chart & Treatment Plans</h1>
        <div className={styles.controlsRow}>
          <div className={styles.dentitionToggles}>
            <button className={`${styles.toggleBtn} ${dentition === 'Adult' ? styles.active : ''}`} onClick={() => handleDentitionChange('Adult')}>Adult</button>
            <button className={`${styles.toggleBtn} ${dentition === 'Pedo' ? styles.active : ''}`} onClick={() => handleDentitionChange('Pedo')}>Pedo</button>
            <button className={`${styles.toggleBtn} ${dentition === 'Mixed' ? styles.active : ''}`} onClick={() => handleDentitionChange('Mixed')}>Mixed</button>
          </div>
          
          <button 
              className={`${styles.toggleBtn} ${isMultiSelect ? styles.active : ''}`}
              onClick={() => {
                const nextMulti = !isMultiSelect;
                setIsMultiSelect(nextMulti);
                if (!nextMulti && selectedTeeth.length > 1) {
                  setSelectedTeeth([selectedTeeth[selectedTeeth.length - 1]]);
                }
              }}
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
            <span className={`${styles.legendBox} ${styles.legendBoxTaken}`}>✓</span>
            <span><strong>Treatment Taken Before</strong> (Purple)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.legendBoxRemoved}`}>✕</span>
            <span><strong>Teeth Removed</strong> (Grey)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.legendBoxRecommended}`}>!</span>
            <span><strong>Recommended To Take Treatment</strong> (Yellow)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.legendBoxNeutral}`}>○</span>
            <span><strong>No recorded condition</strong> (Neutral)</span>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        {selectedTeeth.length > 0 && (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Selected Teeth: {selectedTeeth.length} </span>
                    <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>|</span> 
                    {selectedTeeth.map(t => {
                        const isRem = existingConditions[t] === 'Teeth Removed';
                        return (
                          <span 
                            key={t} 
                            style={{ 
                              background: isRem ? '#64748b' : '#1e293b', 
                              color: 'white', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '4px', 
                              fontSize: '0.875rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem' 
                            }}
                          >
                              {t} {isRem ? '(Removed)' : ''}
                              <button onClick={() => handleToothClick(t)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                          </span>
                        );
                    })}
                </div>

                {removedSelectedTeeth.length > 0 && (
                  <button 
                      onClick={() => setSelectedTeeth(prev => prev.filter(t => existingConditions[t] !== 'Teeth Removed'))}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer' }}
                      title="Exclude removed teeth from routine treatment selection"
                  >
                      Exclude Removed Teeth
                  </button>
                )}
                
                <button 
                    onClick={() => {
                      if (selectedTeeth.length === 1) {
                        setIsModalOpen(true);
                      } else {
                        setIsPanelOpen(true);
                      }
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

      {/* Multi-Select Side Panel */}
      <div className={`${styles.panelOverlay} ${isPanelOpen ? styles.open : ''}`} onClick={handleClosePanel}></div>
      <div className={`${styles.sidePanel} ${isPanelOpen ? styles.open : ''}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>{getPanelTitle()}</div>
          <button className={styles.closeBtn} onClick={handleClosePanel}>&times;</button>
        </div>
        
        <div className={styles.panelContent}>
          {/* Removed Teeth Warning in Multi-Select Panel */}
          {removedSelectedTeeth.length > 0 && (
            <div style={{ background: '#f8fafc', border: '1.5px dashed #94a3b8', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#475569', lineHeight: '1.45' }}>
              <strong style={{ display: 'block', color: '#334155', marginBottom: '0.25rem' }}>Notice: Removed Teeth Selected</strong>
              Teeth <strong>{removedSelectedTeeth.join(', ')}</strong> are recorded as removed. Routine procedures (e.g. fillings, extractions) will only be applied to eligible remaining teeth ({eligibleSelectedTeeth.join(', ') || 'None'}).
            </div>
          )}

          {/* Validation Message in Side Panel */}
          {validationMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
              <strong>Clinical Notice: </strong> {validationMessage}
            </div>
          )}

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
                      onClick={() => handleRemovePlannedTreatment(pt.id)}
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
                  <path className={styles.surfacePath} d="M 22 22 L 78 22 L 65 35 L 35 35 Z" fill={selectedSurfaces.includes('B') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('B')} />
                  <path className={styles.surfacePath} d="M 78 22 L 78 78 L 65 65 L 65 35 Z" fill={selectedSurfaces.includes('R') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('R')} />
                  <path className={styles.surfacePath} d="M 22 78 L 78 78 L 65 65 L 35 65 Z" fill={selectedSurfaces.includes('L') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('L')} />
                  <path className={styles.surfacePath} d="M 22 22 L 22 78 L 35 65 L 35 35 Z" fill={selectedSurfaces.includes('M') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('M')} />
                  <rect className={styles.surfacePath} x="35" y="35" width="30" height="30" fill={selectedSurfaces.includes('O') ? '#e0f2fe' : 'transparent'} onClick={() => toggleSurface('O')} />
                </svg>
              </div>
            </div>
          )}

          <DropdownSelect 
            label="On Examination" 
            value={examination} 
            onChange={setExamination} 
            options={examOptions} 
            placeholder="Search or enter clinical finding..."
            customTypeLabel="Clinical Finding"
          />

          <DropdownSelect 
            label={<>Diagnosis <small>Select from suggestions</small></>} 
            value={diagnosis} 
            onChange={setDiagnosis} 
            options={diagnosisOptions}
            placeholder="Search or enter diagnosis..."
            customTypeLabel="Diagnosis"
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
            label="Treatment Suggested" 
            value={treatment} 
            onChange={setTreatment} 
            options={treatmentOptions}
            placeholder="Select or enter procedure plan..."
            customTypeLabel="Treatment Procedure"
            required={true}
            extraContent={
              <div className={styles.suggestions} style={{ marginTop: '0.75rem' }}>
                <div className={styles.suggestionChip} onClick={() => setTreatment('EXTRACTION OF THIRD MOLAR')}>EXTRACTION OF THIRD MOLAR</div>
                <div className={styles.suggestionChip} onClick={() => setTreatment('COMPOSITE RESTORATION')}>COMPOSITE RESTORATION</div>
              </div>
            }
          />
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.btnAdd} onClick={handleAddTreatment}>Add Treatment</button>
        </div>
      </div>

      {/* Centered Tooth Detail Modal */}
      <ToothDetailModal
        isOpen={isModalOpen}
        onClose={handleClosePanel}
        toothNum={selectedValue}
        condition={existingConditions[selectedValue]}
        treatmentHistory={treatmentHistory}
        plannedTreatments={plannedTreatments}
        onAddTreatment={handleAddTreatment}
        onUpdateCondition={handleUpdateCondition}
        onRemovePlannedTreatment={handleRemovePlannedTreatment}
        examination={examination} setExamination={setExamination}
        diagnosis={diagnosis} setDiagnosis={setDiagnosis}
        treatment={treatment} setTreatment={setTreatment}
        selectedSurfaces={selectedSurfaces} toggleSurface={toggleSurface}
        treatmentOptions={treatmentOptions}
        diagnosisOptions={diagnosisOptions}
        examOptions={examOptions}
        conditionOptions={conditionOptions}
        resolveAndSyncMasters={resolveAndSyncMasters}
      />
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
