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
  
  const isPrimary = [5, 6, 7, 8].includes(q);
  let type = isPrimary ? 'Primary Molar' : 'Molar';
  if (digit >= 1 && digit <= 2) type = isPrimary ? 'Primary Incisor' : 'Incisor';
  else if (digit === 3) type = isPrimary ? 'Primary Canine' : 'Canine (Cuspid)';
  else if (digit >= 4 && digit <= 5) type = isPrimary ? 'Primary Molar' : 'Premolar (Bicuspid)';

  return {
    name: FDI_NAMES[num] || `Tooth ${num}`,
    arch,
    quadrant,
    type,
    isPrimary,
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
  required = false,
  compact = false,
  multiple = false
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
    compact={compact}
    multiple={multiple}
  />
);

const getToothImage = (num) => {
    let type = 'molar';
    let lastDigit = num % 10;
    const isPrimary = [5, 6, 7, 8].includes(Math.floor(num / 10));
    
    if (lastDigit >= 1 && lastDigit <= 3) type = 'incisor';
    else if (lastDigit >= 4 && lastDigit <= 5) {
      type = isPrimary ? 'molar' : 'premolar';
    }
    
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

const Tooth = React.memo(({ num, isSelected, onClick, onDoubleClick, condition }) => {
  const isLower = [3, 4, 7, 8].includes(Math.floor(num / 10));
  const meta = getToothMetadata(num);
  
  const condList = Array.isArray(condition) ? condition : (condition ? [condition] : []);
  const isTaken = condList.includes('Treatment Taken Before');
  const isRemoved = condList.includes('Teeth Removed');
  const isRecommended = condList.includes('Recommended To Take Treatment') || condList.some(c => c && c !== 'Healthy');

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
      onDoubleClick={(e) => onDoubleClick && onDoubleClick(num, e)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Tooth ${num} - ${meta.name}${condition ? `. Condition: ${condition}` : ''}`}
      title={`Tooth ${num} - ${meta.name}${condition ? ` (${condition})` : ''} • Click to select/deselect, double-click for anatomical detail`}
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

  const condList = Array.isArray(condition) ? condition : (condition ? [condition] : []);
  const isTaken = condList.includes('Treatment Taken Before');
  const isRemoved = condList.includes('Teeth Removed');
  const isRecommended = condList.includes('Recommended To Take Treatment');

  const diagList = Array.isArray(diagnosis) ? diagnosis : (diagnosis ? [diagnosis] : []);
  const txList = Array.isArray(treatment) ? treatment : (treatment ? [treatment] : []);
  const examList = Array.isArray(examination) ? examination : (examination ? [examination] : []);

  const toggleDiagnosis = (item) => {
    const next = diagList.includes(item) ? diagList.filter(d => d !== item) : [...diagList, item];
    setDiagnosis(next);
  };

  const toggleTreatment = (item) => {
    const next = txList.includes(item) ? txList.filter(t => t !== item) : [...txList, item];
    setTreatment(next);
  };

  let statusBadge = { label: 'Healthy / No Treatment', color: '#10b981', bg: '#dcfce7', icon: '○' };
  if (isTaken) {
    statusBadge = { label: 'Treatment Taken Before', color: '#a855f7', bg: '#f3e8ff', icon: '✓' };
  } else if (isRemoved) {
    statusBadge = { label: 'Tooth Removed', color: '#64748b', bg: '#f1f5f9', icon: '×' };
  } else if (isRecommended) {
    statusBadge = { label: 'Recommended Treatment', color: '#d97706', bg: '#fef3c7', icon: '!' };
  } else if (condList.length > 0) {
    statusBadge = { label: condList.join(', '), color: '#d97706', bg: '#fef3c7', icon: '!' };
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
            <div className={styles.modalTitleBadge}>#{toothNum}</div>
            <div className={styles.modalTitleTextGroup}>
              <div className={styles.modalTitleRow}>
                <h2 className={styles.modalTitle}>{meta.name}</h2>
                <span className={styles.jawBadge}>{meta.arch?.includes('Maxillary') ? 'Maxillary (Upper Jaw)' : 'Mandibular (Lower Jaw)'}</span>
                <span className={styles.quadBadge}>{meta.quadrant}</span>
              </div>
              <div className={styles.modalSubtitle}>
                {meta.isPrimary ? 'Primary (Deciduous)' : 'Permanent (Adult)'} Dentition • FDI Two-Digit Notation
              </div>
            </div>
          </div>

          <div className={styles.modalHeaderActions}>
            <span className={styles.statusPill} style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, borderColor: statusBadge.color + '55' }}>
              <span className={styles.statusPillIcon}>{statusBadge.icon}</span> {statusBadge.label}
            </span>
            <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Close modal" title="Close (Esc)">&times;</button>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Tooth Recorded as Removed / Extracted
                </div>
                <div>
                  This tooth is marked as removed. Routine restorations (fillings, root canals, extractions) cannot be performed. Only tooth replacement procedures (Dental Implant, Bridge, Denture) or status changes are permitted.
                </div>
              </div>
            )}

            {/* Tooth Condition Selector (Master Backed, Multiple Selectable) */}
            <div className={styles.fieldRow}>
              <DropdownSelect
                label="Tooth Condition"
                multiple={true}
                value={condition || []}
                compact={true}
                onChange={async (val) => {
                  setModalError('');
                  if (val && (Array.isArray(val) ? val.length > 0 : Boolean(val)) && resolveAndSyncMasters) {
                    const resolved = await resolveAndSyncMasters({ conditionVal: val });
                    onUpdateCondition(toothNum, resolved.condition || val);
                  } else {
                    onUpdateCondition(toothNum, val || []);
                  }
                }}
                options={conditionOptions}
                placeholder="Select or enter condition (e.g. Decayed, Missing)..."
                customTypeLabel="Tooth Condition"
              />
            </div>

            {/* Quick Condition Actions */}
            <div className={styles.quickConditionRow}>
              <button 
                type="button"
                className={`${styles.condBtn} ${isRemoved ? styles.condActiveRemove : ''}`}
                onClick={() => {
                  setModalError('');
                  const next = isRemoved ? condList.filter(c => c !== 'Teeth Removed') : [...condList, 'Teeth Removed'];
                  onUpdateCondition(toothNum, next);
                }}
              >
                {isRemoved ? '✓ Marked Removed' : 'Mark Tooth Removed'}
              </button>
              <button 
                type="button"
                className={`${styles.condBtn} ${isTaken ? styles.condActiveTaken : ''}`}
                onClick={() => {
                  setModalError('');
                  const next = isTaken ? condList.filter(c => c !== 'Treatment Taken Before') : [...condList, 'Treatment Taken Before'];
                  onUpdateCondition(toothNum, next);
                }}
              >
                {isTaken ? '✓ Past Tx Recorded' : 'Mark Past Tx Taken'}
              </button>
            </div>

            {/* Added Treatments List */}
            {toothPlanned.length > 0 && (
              <div className={styles.addedTreatmentsCard}>
                <div className={styles.cardHeaderTitle}>Planned Treatments</div>
                {toothPlanned.map(pt => (
                  <div key={pt.id} className={styles.addedTreatmentItem}>
                    <div className={styles.addedTreatmentInfo}>
                      <span className={styles.addedTreatmentTitle}>{pt.treatment}</span>
                      <span className={styles.addedTreatmentMeta}>{pt.category} • Surfaces: {pt.surfaces}</span>
                    </div>
                    <button 
                      type="button" 
                      className={styles.removePtBtn} 
                      onClick={() => onRemovePlannedTreatment(pt.id)}
                      title="Remove planned treatment"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Clinical Finding / On Examination (Multiple Selectable) */}
            <DropdownSelect
              label="On Examination"
              multiple={true}
              value={examination || []}
              compact={true}
              onChange={setExamination}
              options={examOptions}
              placeholder="Search or enter examination findings..."
              customTypeLabel="Clinical Finding"
            />

            {/* Diagnosis (Multiple Selectable) */}
            <DropdownSelect
              label="Diagnosis"
              multiple={true}
              value={diagnosis || []}
              compact={true}
              onChange={setDiagnosis}
              options={diagnosisOptions}
              placeholder="Search or enter diagnoses..."
              customTypeLabel="Diagnosis"
              extraContent={
                <div className={styles.suggestions}>
                  {['Gingivitis', 'Reversible Pulpitis', 'Dental Caries'].map(chip => (
                    <div
                      key={chip}
                      className={`${styles.suggestionChip} ${diagList.includes(chip) ? styles.suggestionChipActive : ''}`}
                      onClick={() => toggleDiagnosis(chip)}
                    >
                      {diagList.includes(chip) ? '✓ ' : ''}{chip}
                    </div>
                  ))}
                </div>
              }
            />

            {/* Treatment Suggested (Multiple Selectable) */}
            <DropdownSelect
              label="Treatment Suggested"
              multiple={true}
              value={treatment || []}
              compact={true}
              onChange={setTreatment}
              options={treatmentOptions}
              placeholder="Search or enter treatment procedures..."
              customTypeLabel="Treatment Procedure"
              extraContent={
                <div className={styles.suggestions}>
                  {['Root Canal Treatment', 'Composite Filling', 'Dental Crown'].map(chip => (
                    <div
                      key={chip}
                      className={`${styles.suggestionChip} ${txList.includes(chip) ? styles.suggestionChipActive : ''}`}
                      onClick={() => toggleTreatment(chip)}
                    >
                      {txList.includes(chip) ? '✓ ' : ''}{chip === 'Root Canal Treatment' ? 'Root Canal' : chip}
                    </div>
                  ))}
                </div>
              }
            />

            {/* Tooth Surfaces */}
            <div className={styles.surfacesBlock}>
              <div className={styles.fieldLabel}>Tooth Surfaces Affected</div>
              <div className={styles.surfaceButtonGroup}>
                {[
                  { code: 'B', label: 'Buccal (B)' },
                  { code: 'L', label: 'Lingual (L)' },
                  { code: 'O', label: 'Occlusal (O)' },
                  { code: 'M', label: 'Mesial (M)' },
                  { code: 'D', label: 'Distal (D)' }
                ].map(s => (
                  <button
                    key={s.code}
                    type="button"
                    className={`${styles.surfaceBtn} ${selectedSurfaces.includes(s.code) ? styles.surfaceBtnActive : ''}`}
                    onClick={() => toggleSurface(s.code)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', borderRadius: '6px', padding: '0.65rem 0.85rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}
          </div>

          {/* Right Panel: Large Tooth Display, Views, Anatomy & Measurements */}
          <div className={styles.modalRightPanel}>
            <h3 className={styles.sectionHeader}>2. Anatomy & View Inspection</h3>

            {/* View Switching Tabs */}
            <div className={styles.viewTabsRow}>
              {['Occlusal', 'Buccal', 'Lingual', 'Mesial', 'Distal'].map(view => (
                <button
                  key={view}
                  type="button"
                  className={`${styles.viewTabBtn} ${activeView === view ? styles.viewTabBtnActive : ''}`}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Realistic Tooth Illustration Viewport */}
            <div className={styles.illustrationViewport}>
              <img
                src={getToothImage(toothNum)}
                alt={`Tooth ${toothNum} - ${activeView} View`}
                className={styles.modalToothImg}
                style={{ transform: getViewTransform() }}
              />
              <span className={styles.activeViewBadge}>{activeView} Aspect</span>
            </div>

            {/* Clinical Measurements / Periodontal Charting */}
            <div className={styles.measurementsCard}>
              <div className={styles.cardHeaderTitle}>Periodontal & Mobility Parameters</div>
              <div className={styles.measurementsGrid}>
                <div className={styles.measurementItem}>
                  <span className={styles.measureLabel}>Mobility</span>
                  <span className={styles.measureVal}>Grade 0</span>
                </div>
                <div className={styles.measurementItem}>
                  <span className={styles.measureLabel}>Pocket Depth</span>
                  <span className={styles.measureVal}>2 - 3 mm</span>
                </div>
                <div className={styles.measurementItem}>
                  <span className={styles.measureLabel}>Furcation</span>
                  <span className={styles.measureVal}>None</span>
                </div>
                <div className={styles.measurementItem}>
                  <span className={styles.measureLabel}>Plaque Index</span>
                  <span className={styles.measureVal}>Normal</span>
                </div>
              </div>
            </div>

            {/* Tooth Anatomy Facts */}
            <div className={styles.anatomyCard}>
              <div className={styles.cardHeaderTitle}>Tooth Specifications & Anatomy</div>
              <div className={styles.anatomyRows}>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Tooth Number</span>
                  <span className={styles.infoVal}>#{toothNum} (FDI Two-Digit)</span>
                </div>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Tooth Type</span>
                  <span className={styles.infoVal}>{meta.type}</span>
                </div>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Dentition</span>
                  <span className={styles.infoVal}>{meta.isPrimary ? 'Primary (Deciduous)' : 'Permanent (Adult)'}</span>
                </div>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Dental Arch</span>
                  <span className={styles.infoVal}>{meta.arch}</span>
                </div>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Quadrant</span>
                  <span className={styles.infoVal}>{meta.quadrant}</span>
                </div>
                <div className={styles.anatomyRow}>
                  <span className={styles.infoKey}>Normal Root Count</span>
                  <span className={styles.infoVal}>{[16, 17, 18, 54, 55, 64, 65].includes(toothNum) ? '3 Roots (Trifurcated)' : [46, 47, 48, 74, 75, 84, 85].includes(toothNum) ? '2 Roots (Bifurcated)' : [14, 24].includes(toothNum) ? '1-2 Roots' : 'Single Root'}</span>
                </div>
              </div>
            </div>

            {/* Past Treatment History for this tooth */}
            {toothHistory.length > 0 && (
              <div className={styles.historyCardModal}>
                <div className={styles.cardHeaderTitle}>Recorded Patient History for #{toothNum}</div>
                <div className={styles.historyList}>
                  {toothHistory.map(h => (
                    <div key={h.id} className={styles.historyListItem}>
                      <div>
                        <strong>{h.treatment}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {h.date || 'Previous Visit'} • Doctor: {h.doctor || 'Doctor not assigned'}</div>
                      </div>
                      <span style={{ color: h.status?.toLowerCase() === 'completed' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {h.status || 'Recorded'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Close</button>
          <button 
            type="button" 
            className={styles.btnPrimary} 
            onClick={async () => {
              const hasData = txList.length > 0 || diagList.length > 0 || examList.length > 0;
              if (hasData) {
                if (isRemoved) {
                  const routineProcs = txList.filter(t => !isReplacementProcedure(t));
                  if (routineProcs.length > 0) {
                    setModalError(`Cannot apply "${routineProcs.join(', ')}" to a tooth marked as removed. Missing teeth only accept replacement procedures such as Implant, Bridge, or Denture.`);
                    return;
                  }
                }
                setModalError('');
                await onAddTreatment();
              } else {
                onClose();
              }
            }}
          >
            {(txList.length > 0 || diagList.length > 0) ? `Apply Treatment (${txList.length || 1}) & Save` : 'Done'}
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

  // Multi-tooth Selection State
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [existingConditions, setExistingConditions] = useState({});
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // Tracking
  const [selectedType, setSelectedType] = useState(''); // 'tooth' | 'custom'
  const [selectedValue, setSelectedValue] = useState('');

  // Form State (All Multiple Selectable)
  const [examination, setExamination] = useState([]);
  const [diagnosis, setDiagnosis] = useState([]);
  const [treatment, setTreatment] = useState([]);
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
      const txArr = Array.isArray(treatmentVal) ? treatmentVal : (treatmentVal ? [treatmentVal] : []);
      const dxArr = Array.isArray(diagnosisVal) ? diagnosisVal : (diagnosisVal ? [diagnosisVal] : []);
      const exArr = Array.isArray(examinationVal) ? examinationVal : (examinationVal ? [examinationVal] : []);
      const cdArr = Array.isArray(conditionVal) ? conditionVal : (conditionVal ? [conditionVal] : []);

      if (txArr.length > 0) payload.treatment = txArr;
      if (dxArr.length > 0) payload.diagnosis = dxArr;
      if (exArr.length > 0) payload.examination = exArr;
      if (cdArr.length > 0) payload.condition = cdArr;

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

  // Helper to persist selections and charted conditions to backend database
  const persistSelectionsToBackend = useCallback(async (teethToSave, overrideConditions) => {
    if (!patientId) return;
    try {
      const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
      const conditionsPayload = overrideConditions || existingConditions;

      // 1. Persist to ClinicalNotes (appointment-level snapshot)
      await fetch('http://127.0.0.1:8000/api/clinical-notes/save/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patient_id: patientId,
          appointment_id: location.state?.appointmentId || null,
          selected_teeth: teethToSave,
          chart_conditions: conditionsPayload
        })
      });

      // 2. Persist structured tooth-level condition records
      if (conditionsPayload && Object.keys(conditionsPayload).length > 0) {
        await fetch(`http://127.0.0.1:8000/api/patients/${patientId}/tooth-conditions/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            teeth_data: conditionsPayload,
            appointment_id: location.state?.appointmentId || null
          })
        });
      }
    } catch (err) {
      console.warn("Could not persist selected teeth and conditions to backend:", err);
    }
  }, [patientId, location.state, existingConditions]);

  // Load initial patient state from LocalStorage, ClinicalNotes and Treatment History
  useEffect(() => {
    if (!patientId) return;

    // 1. Restore cached conditions and selections from localStorage if available
    try {
      const cachedConditions = localStorage.getItem('ashdent_odontogram_' + patientId);
      if (cachedConditions) {
        const parsed = JSON.parse(cachedConditions);
        if (parsed && typeof parsed === 'object') {
          setExistingConditions(parsed);
        }
      }
      const cachedTeeth = localStorage.getItem('ashdent_selected_teeth_' + patientId);
      if (cachedTeeth) {
        const parsedTeeth = JSON.parse(cachedTeeth);
        if (Array.isArray(parsedTeeth) && parsedTeeth.length > 0) {
          setSelectedTeeth(Array.from(new Set(parsedTeeth.map(t => parseInt(t, 10)).filter(Boolean))));
        }
      }
    } catch (e) {
      console.error("Error reading cached odontogram data", e);
    }

    const user = JSON.parse(localStorage.getItem('ashdent_user') || localStorage.getItem('doctosmart_user') || '{}');
    const headers = { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };

    // 2. Fetch clinical notes (examination record) from backend
    fetch(`http://127.0.0.1:8000/api/clinical-notes/${patientId}/`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.selected_teeth) && data.selected_teeth.length > 0) {
          const dbTeeth = Array.from(new Set(data.selected_teeth.map(t => parseInt(t, 10)).filter(Boolean)));
          setSelectedTeeth(prev => Array.from(new Set([...prev, ...dbTeeth])));
        }
      })
      .catch(err => {
        console.warn("Could not load clinical notes for patient:", err);
      });

    // 2.1 Fetch persistent tooth conditions from database
    fetch(`http://127.0.0.1:8000/api/patients/${patientId}/tooth-conditions/`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.chart_conditions && Object.keys(data.chart_conditions).length > 0) {
          const dbConditions = {};
          Object.entries(data.chart_conditions).forEach(([tNum, info]) => {
            const c = info.condition || [];
            dbConditions[tNum] = Array.isArray(c) ? c : [c];
          });
          setExistingConditions(prev => ({ ...dbConditions, ...prev }));
        }
      })
      .catch(err => console.warn("Could not load backend tooth conditions:", err));

    // 3. Fetch treatment history from backend
    fetch(`http://127.0.0.1:8000/api/patient/${patientId}/treatment-history/`, { headers })
      .then(res => res.ok ? res.json() : [])
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
  }, [patientId]);

  const toggleSurface = (surface) => {
    setSelectedSurfaces(prev => 
        prev.includes(surface) ? prev.filter(s => s !== surface) : [...prev, surface]
    );
  };

  // Multiple Tooth Selection Handler: Toggles selected state without clearing other selections
  const handleToothClick = useCallback((num, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const toothNum = parseInt(num, 10);
    if (!toothNum) return;

    setValidationMessage('');
    setSelectedTeeth(prev => {
      const exists = prev.includes(toothNum);
      const next = exists 
        ? prev.filter(t => t !== toothNum)
        : Array.from(new Set([...prev, toothNum]));

      // Save to localStorage immediately as local cache
      if (patientId) {
        try {
          localStorage.setItem(`ashdent_selected_teeth_${patientId}`, JSON.stringify(next));
        } catch (err) {}
      }
      return next;
    });
  }, [patientId]);

  // Double click directly opens detailed modal for that tooth
  const handleToothDoubleClick = useCallback((num, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const toothNum = parseInt(num, 10);
    if (!toothNum) return;

    setSelectedTeeth(prev => Array.from(new Set([...prev, toothNum])));
    setSelectedType('tooth');
    setSelectedValue(toothNum);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (selectedTeeth.length === 0) {
      setSelectedType('');
      setSelectedValue('');
    } else if (selectedTeeth.length === 1) {
      setSelectedType('tooth');
      setSelectedValue(selectedTeeth[0]);
    } else {
      setSelectedType('custom');
      setSelectedValue(selectedTeeth[0]);
    }
  }, [selectedTeeth]);

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setIsModalOpen(false);
    // Selections are preserved while interacting with the chart
    setValidationMessage('');
  };

  const handleClearSelection = () => {
    setSelectedTeeth([]);
    setSelectedType('');
    setSelectedValue('');
    setSelectedSurfaces([]);
    setValidationMessage('');
    if (patientId) {
      try {
        localStorage.removeItem(`ashdent_selected_teeth_${patientId}`);
      } catch (e) {}
    }
    persistSelectionsToBackend([]);
  };

  const handleUpdateCondition = (num, cond) => {
    setExistingConditions(prev => {
      const next = { ...prev };
      if (!cond || (Array.isArray(cond) && cond.length === 0)) {
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
    if (selectedTeeth.length === 0) return;

    // Resolve / auto-create masters for entered procedures, diagnoses, examinations
    const resolved = await resolveAndSyncMasters({
      treatmentVal: treatment,
      diagnosisVal: diagnosis,
      examinationVal: examination,
      conditionVal: selectedValue ? existingConditions[selectedValue] : null
    });

    const activeTreatments = Array.isArray(resolved.treatment)
      ? resolved.treatment.map(item => typeof item === 'object' ? item.name : item)
      : (Array.isArray(treatment) ? treatment : (treatment ? [treatment] : []));

    const activeDiagnoses = Array.isArray(resolved.diagnosis)
      ? resolved.diagnosis.map(item => typeof item === 'object' ? item.name : item)
      : (Array.isArray(diagnosis) ? diagnosis : (diagnosis ? [diagnosis] : []));

    const activeExaminations = Array.isArray(resolved.examination)
      ? resolved.examination.map(item => typeof item === 'object' ? item.name : item)
      : (Array.isArray(examination) ? examination : (examination ? [examination] : []));

    const diagnosisText = activeDiagnoses.join(', ');
    const examinationText = activeExaminations.join(', ');
    const txItems = activeTreatments.length > 0 ? activeTreatments : ['Treatment Required'];

    const isToothRemoved = (t) => {
      const c = existingConditions[t];
      return Array.isArray(c) ? c.includes('Teeth Removed') : c === 'Teeth Removed';
    };

    const removedTeeth = selectedTeeth.filter(t => isToothRemoved(t));
    const hasRoutine = txItems.some(tx => tx !== 'Treatment Required' && !isReplacementProcedure(tx));

    // Validation: routine procedures cannot be performed on removed teeth
    if (removedTeeth.length > 0 && hasRoutine) {
      if (removedTeeth.length === selectedTeeth.length) {
        setValidationMessage(
          `Cannot apply routine procedures to teeth marked as removed (${removedTeeth.join(', ')}). Missing teeth only accept replacement procedures such as Implant, Bridge, or Denture.`
        );
        return;
      }

      // Partial selection: apply routine treatment to eligible teeth only
      const eligibleTeeth = selectedTeeth.filter(t => !isToothRemoved(t));
      const newConditions = { ...existingConditions };
      const newTreatments = [];

      eligibleTeeth.forEach(t => {
        const curCond = newConditions[t];
        const condArr = Array.isArray(curCond) ? [...curCond] : (curCond ? [curCond] : []);
        if (!condArr.includes('Recommended To Take Treatment') && !condArr.includes('Teeth Removed') && !condArr.includes('Treatment Taken Before')) {
          condArr.push('Recommended To Take Treatment');
        }
        newConditions[t] = condArr;

        txItems.forEach(tx => {
          newTreatments.push({
            id: Date.now() + Math.random(),
            tooth: t.toString(),
            category: diagnosisText || 'Diagnosis Required',
            treatment: tx,
            surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
            examination: examinationText || ''
          });
        });
      });

      setExistingConditions(newConditions);
      setPlannedTreatments(prev => [...prev, ...newTreatments]);
      if (patientId) {
        try {
          localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(newConditions));
          localStorage.setItem('ashdent_selected_teeth_' + patientId, JSON.stringify(selectedTeeth));
        } catch (e) {}
      }
      persistSelectionsToBackend(selectedTeeth);

      setExamination([]);
      setDiagnosis([]);
      setTreatment([]);
      setSelectedSurfaces([]);
      setValidationMessage(`Applied treatments to eligible teeth (${eligibleTeeth.join(', ')}). Removed tooth (${removedTeeth.join(', ')}) was safely excluded.`);
      handleClosePanel();
      return;
    }

    // Standard application or replacement procedure on all selected teeth
    const newConditions = { ...existingConditions };
    const newTreatments = [];
    
    selectedTeeth.forEach(t => {
      const curCond = newConditions[t];
      const condArr = Array.isArray(curCond) ? [...curCond] : (curCond ? [curCond] : []);
      if (!condArr.includes('Recommended To Take Treatment') && !condArr.includes('Teeth Removed') && !condArr.includes('Treatment Taken Before')) {
        condArr.push('Recommended To Take Treatment');
      }
      newConditions[t] = condArr;

      txItems.forEach(tx => {
        newTreatments.push({
          id: Date.now() + Math.random(),
          tooth: t.toString(),
          category: diagnosisText || 'Diagnosis Required',
          treatment: tx,
          surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
          examination: examinationText || ''
        });
      });
    });
    
    setExistingConditions(newConditions);
    setPlannedTreatments(prev => [...prev, ...newTreatments]);
    if (patientId) {
      try {
        localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(newConditions));
        localStorage.setItem('ashdent_selected_teeth_' + patientId, JSON.stringify(selectedTeeth));
      } catch (e) {}
    }
    persistSelectionsToBackend(selectedTeeth);
    
    setExamination([]);
    setDiagnosis([]);
    setTreatment([]);
    setSelectedSurfaces([]);
    setValidationMessage('');
    handleClosePanel();
  };

  const handleSaveAndContinue = async () => {
    let finalTreatments = [...plannedTreatments];
    const txArr = Array.isArray(treatment) ? treatment : (treatment ? [treatment] : []);
    const dxArr = Array.isArray(diagnosis) ? diagnosis : (diagnosis ? [diagnosis] : []);
    const exArr = Array.isArray(examination) ? examination : (examination ? [examination] : []);

    // Check if there are uncommitted selections in the form with treatment/diagnosis
    if (selectedTeeth.length > 0 && (txArr.length > 0 || dxArr.length > 0 || exArr.length > 0)) {
      const resolved = await resolveAndSyncMasters({
        treatmentVal: txArr,
        diagnosisVal: dxArr,
        examinationVal: exArr,
        conditionVal: selectedValue ? existingConditions[selectedValue] : null
      });

      const activeTreatments = Array.isArray(resolved.treatment)
        ? resolved.treatment.map(item => typeof item === 'object' ? item.name : item)
        : (txArr.length > 0 ? txArr : ['Treatment Required']);

      const activeDiagnoses = Array.isArray(resolved.diagnosis)
        ? resolved.diagnosis.map(item => typeof item === 'object' ? item.name : item)
        : dxArr;

      const activeExaminations = Array.isArray(resolved.examination)
        ? resolved.examination.map(item => typeof item === 'object' ? item.name : item)
        : exArr;

      const diagnosisText = activeDiagnoses.join(', ');
      const examinationText = activeExaminations.join(', ');

      const isToothRemoved = (t) => {
        const c = existingConditions[t];
        return Array.isArray(c) ? c.includes('Teeth Removed') : c === 'Teeth Removed';
      };

      const removedTeeth = selectedTeeth.filter(t => isToothRemoved(t));
      const hasRoutine = activeTreatments.some(tx => tx !== 'Treatment Required' && !isReplacementProcedure(tx));
      
      if (removedTeeth.length > 0 && hasRoutine) {
        if (removedTeeth.length === selectedTeeth.length) {
          alert(`Cannot apply routine procedures to removed teeth (${removedTeeth.join(', ')}). Missing teeth only accept replacement procedures such as Implant, Bridge, or Denture.`);
          return;
        }
        // Partial: include only eligible teeth
        const eligible = selectedTeeth.filter(t => !isToothRemoved(t));
        eligible.forEach(t => {
          activeTreatments.forEach(tx => {
            finalTreatments.push({
              id: Date.now() + Math.random(),
              tooth: t.toString(),
              category: diagnosisText || 'Diagnosis Required',
              treatment: tx,
              surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
              examination: examinationText || ''
            });
          });
        });
      } else {
        selectedTeeth.forEach(t => {
          activeTreatments.forEach(tx => {
            finalTreatments.push({
              id: Date.now() + Math.random(),
              tooth: t.toString(),
              category: diagnosisText || 'Diagnosis Required',
              treatment: tx,
              surfaces: selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All',
              examination: examinationText || ''
            });
          });
        });
      }
    }

    // Persist conditions and selections to localStorage
    if (patientId) {
      try {
        localStorage.setItem('ashdent_odontogram_' + patientId, JSON.stringify(existingConditions));
        localStorage.setItem('ashdent_selected_teeth_' + patientId, JSON.stringify(selectedTeeth));
      } catch (e) {}
    }

    // Persist selected teeth to backend database via clinical notes
    await persistSelectionsToBackend(selectedTeeth);

    // Check if anything was charted or planned or selected
    const hasChartedConditions = Object.keys(existingConditions).length > 0;
    if (finalTreatments.length === 0 && !hasChartedConditions && selectedTeeth.length === 0) {
      alert("Please chart a tooth condition or select a treatment before continuing to Treatment Plans.");
      return;
    }

    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/doctor';
    navigate(`${basePath}/treatment-plans/${patientId || 'new'}`, { 
      state: { 
        ...location.state,
        patientId: patientId,
        doctorId: location.state?.doctorId,
        doctorName: location.state?.doctorName,
        appointmentId: location.state?.appointmentId,
        diagnoses: finalTreatments,
        chartConditions: existingConditions,
        selectedTeeth: selectedTeeth
      } 
    });
  };

  const getPanelTitle = () => {
    if (selectedType === 'tooth') return `Treatment Plan — Tooth #${selectedValue}`;
    return `Treatment Plan for Selected Teeth (${selectedTeeth.length})`;
  };

  const removedSelectedTeeth = selectedTeeth.filter(t => existingConditions[t] === 'Teeth Removed');
  const eligibleSelectedTeeth = selectedTeeth.filter(t => existingConditions[t] !== 'Teeth Removed');

  return (
    <div className={styles.pageContainer}>
      {/* Clean Header - All filters and separate sections completely removed */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Dental Chart & Treatment Plans</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Unified Anatomical Teeth Chart • All Adult & Pediatric Teeth
          </p>
        </div>
      </div>

      <div className={`${styles.chartArea} ${isPanelOpen ? styles.chartAreaShifted : ''}`}>
        
        {/* Unified Teeth Chart: All adult and pediatric teeth together in correct anatomical arrangement */}
        <div className={styles.archContainer}>
          
          {/* UPPER JAW / MAXILLARY ARCH */}
          <div className={styles.jawSection}>
            <div className={styles.archLabelRow}>
              <span className={styles.archLabel}>Maxillary Arch (Upper Jaw)</span>
            </div>

            {/* Row 1: Adult Upper Teeth (UR 18..11, UL 21..28) */}
            <div className={styles.archRow}>
              <div className={styles.quadrantRight}>
                {FDI_ADULT.UR.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
              <div className={styles.midlineSeparator} title="Midline" />
              <div className={styles.quadrantLeft}>
                {FDI_ADULT.UL.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
            </div>

            {/* Row 2: Pediatric Upper Teeth (UR 55..51, UL 61..65) */}
            <div className={styles.archRow} style={{ marginTop: '14px' }}>
              <div className={styles.quadrantRight}>
                {FDI_PRIMARY.UR.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
              <div className={styles.midlineSeparator} title="Midline" />
              <div className={styles.quadrantLeft}>
                {FDI_PRIMARY.UL.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Inter-arch Occlusal Separation */}
          <div className={styles.occlusalPlaneDivider}>
            <div className={styles.occlusalLine} />
          </div>

          {/* LOWER JAW / MANDIBULAR ARCH */}
          <div className={styles.jawSection}>
            {/* Row 3: Pediatric Lower Teeth (LR 85..81, LL 71..75) */}
            <div className={styles.archRow}>
              <div className={styles.quadrantRight}>
                {FDI_PRIMARY.LR.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
              <div className={styles.midlineSeparator} title="Midline" />
              <div className={styles.quadrantLeft}>
                {FDI_PRIMARY.LL.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
            </div>

            {/* Row 4: Adult Lower Teeth (LR 48..41, LL 31..38) */}
            <div className={styles.archRow} style={{ marginTop: '14px' }}>
              <div className={styles.quadrantRight}>
                {FDI_ADULT.LR.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
              <div className={styles.midlineSeparator} title="Midline" />
              <div className={styles.quadrantLeft}>
                {FDI_ADULT.LL.map(num => (
                  <Tooth 
                    key={num} 
                    num={num} 
                    isSelected={selectedTeeth.includes(num)} 
                    onClick={handleToothClick} 
                    onDoubleClick={handleToothDoubleClick}
                    condition={existingConditions[num]} 
                  />
                ))}
              </div>
            </div>

            <div className={styles.archLabelRow} style={{ marginTop: '8px' }}>
              <span className={styles.archLabel}>Mandibular Arch (Lower Jaw)</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legendBar} style={{ marginTop: '28px' }}>
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

      {/* Bottom Bar: Selection details & Actions */}
      <div className={styles.bottomBar}>
        {selectedTeeth.length > 0 && (
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Selected Teeth: {selectedTeeth.length}</span>
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
                              #{t} {isRem ? '(Removed)' : ''}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToothClick(t, e);
                                }} 
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={`Deselect tooth #${t}`}
                              >
                                &times;
                              </button>
                          </span>
                        );
                    })}
                </div>

                {removedSelectedTeeth.length > 0 && (
                  <button 
                      onClick={() => {
                        setSelectedTeeth(prev => {
                          const next = prev.filter(t => existingConditions[t] !== 'Teeth Removed');
                          if (patientId) {
                            try {
                              localStorage.setItem(`ashdent_selected_teeth_${patientId}`, JSON.stringify(next));
                            } catch(e) {}
                          }
                          return next;
                        });
                      }}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer' }}
                      title="Exclude removed teeth from routine treatment selection"
                  >
                      Exclude Removed Teeth
                  </button>
                )}

                {selectedTeeth.length === 1 && (
                  <button 
                    onClick={() => {
                      setSelectedType('tooth');
                      setSelectedValue(selectedTeeth[0]);
                      setIsModalOpen(true);
                    }}
                    style={{ background: 'white', border: '1px solid #6366f1', color: '#6366f1', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Open detailed anatomical views and tooth inspection"
                  >
                    <span>🔍</span> Tooth #{selectedTeeth[0]} Details & Anatomy
                  </button>
                )}
                
                <button 
                    onClick={() => {
                      if (selectedTeeth.length === 1) {
                        setSelectedType('tooth');
                        setSelectedValue(selectedTeeth[0]);
                      } else {
                        setSelectedType('custom');
                      }
                      setIsPanelOpen(true);
                    }}
                    style={{ background: 'white', border: '1px solid #14b8a6', color: '#14b8a6', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                    Treatment Plan for Selected Teeth ({selectedTeeth.length})
                </button>
                
                <button 
                    onClick={handleClearSelection}
                    style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                >
                    Clear Selection
                </button>
            </div>
        )}
        <button 
          className={styles.btnPrimary} 
          style={{ marginLeft: selectedTeeth.length === 0 ? 'auto' : '0' }} 
          onClick={handleSaveAndContinue}
        >
          Save & Continue
        </button>
      </div>

      {/* Multi-Select / Treatment Planning Side Panel (Non-blocking: chart remains interactive) */}
      <div className={`${styles.sidePanel} ${isPanelOpen ? styles.open : ''}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>{getPanelTitle()}</div>
          <button className={styles.closeBtn} onClick={handleClosePanel} title="Close panel">&times;</button>
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

          {plannedTreatments.filter(pt => selectedTeeth.includes(parseInt(pt.tooth, 10))).length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Added Treatments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plannedTreatments.filter(pt => selectedTeeth.includes(parseInt(pt.tooth, 10))).map(pt => (
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
                  <div className={styles.panelToothNumber}>#{selectedValue}</div>
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
                    {selectedTeeth.map(t => `#${t}`).join(', ')}
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
            multiple={true}
            value={examination || []} 
            onChange={setExamination} 
            options={examOptions} 
            placeholder="Search or enter clinical findings..."
            customTypeLabel="Clinical Finding"
          />

          <DropdownSelect 
            label={<>Diagnosis <small>Select from suggestions</small></>} 
            multiple={true}
            value={diagnosis || []} 
            onChange={setDiagnosis} 
            options={diagnosisOptions}
            placeholder="Search or enter diagnoses..."
            customTypeLabel="Diagnosis"
            extraContent={
              <>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>Suggestions</div>
                <div className={styles.suggestions}>
                  {['Gingivitis', 'Reversible Pulpitis', 'Dental Caries'].map(chip => (
                    <div 
                      key={chip}
                      className={`${styles.suggestionChip} ${(Array.isArray(diagnosis) && diagnosis.includes(chip)) ? styles.suggestionChipActive : ''}`} 
                      onClick={() => setDiagnosis(prev => {
                        const cur = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                        return cur.includes(chip) ? cur.filter(d => d !== chip) : [...cur, chip];
                      })}
                    >
                      {(Array.isArray(diagnosis) && diagnosis.includes(chip)) ? '✓ ' : ''}{chip}
                    </div>
                  ))}
                </div>
              </>
            }
          />

          <DropdownSelect 
            label="Treatment Suggested" 
            multiple={true}
            value={treatment || []} 
            onChange={setTreatment} 
            options={treatmentOptions}
            placeholder="Select or enter procedure plans..."
            customTypeLabel="Treatment Procedure"
            extraContent={
              <div className={styles.suggestions} style={{ marginTop: '0.75rem' }}>
                {['EXTRACTION OF THIRD MOLAR', 'COMPOSITE RESTORATION', 'Root Canal Treatment'].map(chip => (
                  <div 
                    key={chip}
                    className={`${styles.suggestionChip} ${(Array.isArray(treatment) && treatment.includes(chip)) ? styles.suggestionChipActive : ''}`} 
                    onClick={() => setTreatment(prev => {
                      const cur = Array.isArray(prev) ? prev : (prev ? [prev] : []);
                      return cur.includes(chip) ? cur.filter(t => t !== chip) : [...cur, chip];
                    })}
                  >
                    {(Array.isArray(treatment) && treatment.includes(chip)) ? '✓ ' : ''}{chip}
                  </div>
                ))}
              </div>
            }
          />
        </div>

        <div className={styles.panelFooter}>
          <button className={styles.btnAdd} onClick={handleAddTreatment}>Add Treatment</button>
        </div>
      </div>

      {/* Centered Tooth Detail Modal (Preserves anatomical views & details) */}
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
