import React, { useState, useRef, useEffect } from 'react';
import styles from './ClinicalCombobox.module.css';

export default function ClinicalCombobox({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Search & Select...",
  allowCustom = true,
  customTypeLabel = "Option",
  extraContent = null,
  required = false,
  compact = false,
  multiple = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options to string array
  const stringOptions = (options || []).map(opt => (typeof opt === 'string' ? opt : opt?.name || '')).filter(Boolean);

  // Normalize multiple selected items
  const selectedList = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : [];

  const hasValue = multiple ? selectedList.length > 0 : Boolean(value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const trimmedSearch = search.trim();
  const filteredOptions = stringOptions.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const isExactMatch = stringOptions.some(
    opt => opt.toLowerCase() === trimmedSearch.toLowerCase()
  );

  const canAddNew = allowCustom && trimmedSearch.length >= 2 && !isExactMatch && (!multiple || !selectedList.includes(trimmedSearch));

  const handleSelect = (val) => {
    if (!val) return;
    if (multiple) {
      const isSelected = selectedList.includes(val);
      const updated = isSelected
        ? selectedList.filter(item => item !== val)
        : [...selectedList, val];
      onChange(updated);
      setSearch('');
    } else {
      onChange(val);
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleRemoveTag = (itemToRemove, e) => {
    if (e) e.stopPropagation();
    if (multiple) {
      const updated = selectedList.filter(item => item !== itemToRemove);
      onChange(updated);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
    setSearch('');
  };

  return (
    <div className={`${styles.comboboxWrapper} ${compact ? styles.compact : ''}`} ref={wrapperRef}>
      {label && (
        <label className={styles.comboboxLabel}>
          <span>{label} {required && <strong style={{ color: '#ef4444' }}>*</strong>}</span>
        </label>
      )}

      <div
        className={`${styles.triggerBox} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className={styles.valueContainer}>
          {multiple ? (
            selectedList.length > 0 ? (
              <div className={styles.tagList}>
                {selectedList.map((item, idx) => (
                  <span key={idx} className={styles.tagItem}>
                    <span className={styles.tagText}>{item}</span>
                    <span className={styles.tagMasterBadge}>Master</span>
                    <button
                      type="button"
                      className={styles.tagRemoveBtn}
                      onClick={(e) => handleRemoveTag(item, e)}
                      title={`Remove ${item}`}
                      aria-label={`Remove ${item}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className={styles.placeholderText}>{placeholder}</span>
            )
          ) : (
            value ? (
              <>
                <span className={styles.valueText}>{value}</span>
                <span className={styles.masterBadge}>Master</span>
              </>
            ) : (
              <span className={styles.placeholderText}>{placeholder}</span>
            )
          )}
        </div>

        <div className={styles.actionsContainer}>
          {hasValue && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              title="Clear selection"
              aria-label="Clear selection"
            >
              ✕
            </button>
          )}
          <svg
            className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdownPanel}>
          <div className={styles.searchHeader}>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={`Search or type new ${customTypeLabel.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (canAddNew) {
                    handleSelect(trimmedSearch);
                  } else if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  }
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className={styles.optionsList}>
            {canAddNew && (
              <div
                className={styles.addNewOption}
                onClick={() => handleSelect(trimmedSearch)}
                title={`Press to auto-create "${trimmedSearch}" in ${customTypeLabel} Master`}
              >
                <span>➕</span>
                <span>
                  Use <strong>"{trimmedSearch}"</strong>{' '}
                  <small style={{ fontWeight: 400, color: '#166534' }}>
                    (Auto-creates new {customTypeLabel})
                  </small>
                </span>
              </div>
            )}

            {filteredOptions.map((opt) => {
              const isSelected = multiple ? selectedList.includes(opt) : value === opt;
              return (
                <div
                  key={opt}
                  className={`${styles.optionItem} ${isSelected ? styles.selectedOption : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })}

            {filteredOptions.length === 0 && !canAddNew && (
              <div className={styles.emptyState}>
                {trimmedSearch ? `Type at least 2 characters to create new ${customTypeLabel.toLowerCase()}` : 'No matching master options'}
              </div>
            )}
          </div>
        </div>
      )}

      {extraContent}
    </div>
  );
}
