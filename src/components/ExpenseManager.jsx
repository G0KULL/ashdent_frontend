import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './ExpenseManager.module.css';

const API = 'http://127.0.0.1:8000/api';

const MONTHS = [
  { value: '01', label: 'January' },  { value: '02', label: 'February' },
  { value: '03', label: 'March' },    { value: '04', label: 'April' },
  { value: '05', label: 'May' },      { value: '06', label: 'June' },
  { value: '07', label: 'July' },     { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

// Categories treated as salaries in the Expense table
const SALARY_CATS = ['doctor_salary', 'salary_incentives', 'staff_salary'];
// Categories treated as pharmacy purchases in the Expense table  
const PHARMACY_CATS = ['pharmacy_purchase'];

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '' };
}

function safeNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatINR(amount) {
  return '₹' + safeNum(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00'); // prevent timezone shift
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function ExpenseManager() {
  const today = new Date();

  // ── FILTER STATE ──
  const [filterMode, setFilterMode] = useState('month');
  const [selMonth, setSelMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [selYear, setSelYear] = useState(String(today.getFullYear()));
  const [selDate, setSelDate] = useState(today.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('general');

  // ── DATA STATE ──
  // Single source of truth: ALL expenses come from the Expense table
  const [loading, setLoading] = useState(true);
  const [allExpenses, setAllExpenses] = useState([]); // ALL expense records for current filter
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // ── MODAL STATES ──
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '', category: '', amount: '', date: selDate,
    paid_to: '', payment_method: 'Cash', status: 'Paid', notes: ''
  });

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    staff_name: '', staff_type: 'doctor', staff_id: '',
    month: selMonth, year: selYear,
    base_salary: '', incentive: '0', bonus: '0', deductions: '0',
    final_salary: '',
    status: 'Paid', payment_method: 'Bank Transfer'
  });

  const [doctorList, setDoctorList] = useState([]);

  // ── Compute date range from current filter ──
  const getDateRange = useCallback(() => {
    if (filterMode === 'month') {
      const y = parseInt(selYear);
      const m = parseInt(selMonth);
      const start = `${selYear}-${selMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${selYear}-${selMonth}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    } else {
      return { start: selDate, end: selDate };
    }
  }, [filterMode, selMonth, selYear, selDate]);

  // ── FETCHERS ──
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/finance/categories/`, { headers: getHeaders() });
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error('Categories fetch error:', err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API}/patients/staff/`, { headers: getHeaders() });
      if (res.ok) setStaffList(await res.json());
    } catch (err) { console.error('Staff fetch error:', err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API}/doctors/`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDoctorList(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) { console.error('Doctors fetch error:', err); }
  };

  // ── MAIN DATA FETCH: Single call to expense API with date range ──
  const fetchAllExpenses = async (start, end) => {
    try {
      const res = await fetch(
        `${API}/finance/expenses/?start_date=${start}&end_date=${end}`,
        { headers: getHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setAllExpenses(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error('Expenses fetch error:', err); }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    await fetchAllExpenses(start, end);
    setLoading(false);
  }, [getDateRange]);

  useEffect(() => {
    fetchCategories();
    fetchStaff();
    fetchDoctors();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── SPLIT EXPENSES BY CATEGORY (single source of truth) ──
  const filteredGeneralExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      const cat = (e.category || '').toLowerCase();
      return !SALARY_CATS.includes(cat) && !PHARMACY_CATS.includes(cat);
    });
  }, [allExpenses]);

  const filteredSalaries = useMemo(() => {
    return allExpenses.filter(e => {
      const cat = (e.category || '').toLowerCase();
      return SALARY_CATS.includes(cat);
    });
  }, [allExpenses]);

  const filteredPharmacy = useMemo(() => {
    return allExpenses.filter(e => {
      const cat = (e.category || '').toLowerCase();
      return PHARMACY_CATS.includes(cat);
    });
  }, [allExpenses]);

  // ── TOTALS (all from single source, no double counting possible) ──
  const totals = useMemo(() => {
    const general = filteredGeneralExpenses.reduce((sum, e) => sum + safeNum(e.amount), 0);
    const salaries = filteredSalaries.reduce((sum, e) => sum + safeNum(e.amount), 0);
    const pharmacy = filteredPharmacy.reduce((sum, e) => sum + safeNum(e.amount), 0);
    return {
      general, salaries, pharmacy,
      total: general + salaries + pharmacy,
      generalCount: filteredGeneralExpenses.length,
      salariesCount: filteredSalaries.length,
      pharmacyCount: filteredPharmacy.length,
    };
  }, [filteredGeneralExpenses, filteredSalaries, filteredPharmacy]);

  // ── GENERAL EXPENSE HANDLERS ──
  const handleOpenExpenseAdd = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '', category: '', amount: '',
      date: filterMode === 'date' ? selDate : new Date().toISOString().split('T')[0],
      paid_to: '', payment_method: 'Cash', status: 'Paid', notes: ''
    });
    setShowExpenseModal(true);
  };

  const handleOpenExpenseEdit = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      title: exp.title, category: exp.category, amount: exp.amount,
      date: exp.date, paid_to: exp.paid_to || '', payment_method: exp.payment_method || 'Cash',
      status: exp.status || 'Paid', notes: exp.notes || ''
    });
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const method = editingExpense ? 'PUT' : 'POST';
    const url = editingExpense ? `${API}/finance/expenses/${editingExpense.id}/` : `${API}/finance/expenses/`;
    try {
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(expenseForm) });
      if (res.ok) { setShowExpenseModal(false); loadAllData(); } else { alert('Failed to save expense'); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API}/finance/expenses/${id}/`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) loadAllData();
    } catch (err) { console.error(err); }
  };

  // ── SALARY HANDLERS ──
  const handleOpenSalaryAdd = () => {
    setSalaryForm({
      staff_name: '',
      staff_type: 'staff',
      staff_id: staffList.length > 0 ? staffList[0].id : '',
      month: selMonth, year: selYear,
      base_salary: '', incentive: '0', bonus: '0', deductions: '0',
      final_salary: '',
      status: 'Paid', payment_method: 'Bank Transfer'
    });
    setShowSalaryModal(true);
  };

  const computeFinal = (form) => {
    const base = safeNum(form.base_salary);
    const inc = safeNum(form.incentive);
    const bon = safeNum(form.bonus);
    const ded = safeNum(form.deductions);
    return Math.max(0, base + inc + bon - ded);
  };

  // Save salary directly into the Expense table (simplest, most consistent)
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    const final = computeFinal(salaryForm);
    const monthName = MONTHS.find(m => m.value === String(salaryForm.month).padStart(2, '0'))?.label || salaryForm.month;

    let name = salaryForm.staff_name;
    if (!name) {
      if (salaryForm.staff_type === 'staff') {
        const s = staffList.find(x => String(x.id) === String(salaryForm.staff_id));
        name = s ? s.name : 'Staff';
      } else {
        const d = doctorList.find(x => String(x.id) === String(salaryForm.staff_id));
        name = d ? `Dr. ${d.name}` : 'Doctor';
      }
    }

    const cat = salaryForm.staff_type === 'doctor' ? 'doctor_salary' : 'salary_incentives';
    const expensePayload = {
      title: `${salaryForm.staff_type === 'doctor' ? 'Doctor' : 'Staff'} Salary - ${name}`,
      category: cat,
      amount: final,
      date: `${salaryForm.year}-${String(salaryForm.month).padStart(2, '0')}-01`,
      paid_to: name,
      payment_method: salaryForm.payment_method,
      status: salaryForm.status,
      notes: `${monthName} ${salaryForm.year} | Base: ${salaryForm.base_salary} + Incentive: ${salaryForm.incentive} + Bonus: ${salaryForm.bonus} - Deductions: ${salaryForm.deductions}`,
    };

    try {
      const res = await fetch(`${API}/finance/expenses/`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(expensePayload)
      });
      if (res.ok) { setShowSalaryModal(false); loadAllData(); }
      else { const err = await res.json(); alert('Failed to save salary: ' + JSON.stringify(err)); }
    } catch (err) { console.error(err); }
  };

  const filterLabel = filterMode === 'month'
    ? `${MONTHS.find(m => m.value === selMonth)?.label || ''} ${selYear}`
    : formatDate(selDate);

  const getCat = (key) => categories.find(c => c.key === key);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.pageTitle}>Expense Manager</h2>
          <p className={styles.pageSub}>Track all clinic outflows — {filterLabel}</p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.filterBar}>
            <div className={styles.filterToggle}>
              <button
                className={`${styles.filterToggleBtn} ${filterMode === 'month' ? styles.filterToggleBtnActive : ''}`}
                onClick={() => setFilterMode('month')}
              >Month</button>
              <button
                className={`${styles.filterToggleBtn} ${filterMode === 'date' ? styles.filterToggleBtnActive : ''}`}
                onClick={() => setFilterMode('date')}
              >Date</button>
            </div>
            <div className={styles.filterDivider} />
            {filterMode === 'month' ? (
              <>
                <select className={styles.filterSelect} value={selMonth} onChange={e => setSelMonth(e.target.value)}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select className={styles.filterSelect} value={selYear} onChange={e => setSelYear(e.target.value)}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            ) : (
              <input type="date" className={styles.filterDateInput} value={selDate} max={new Date().toISOString().split('T')[0]} onChange={e => setSelDate(e.target.value)} />
            )}
            <button className={styles.applyBtn} onClick={loadAllData}>Apply</button>
          </div>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={`${styles.summaryCard} ${styles.summaryCardGeneral}`}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconGeneral}`}>🧾</div>
          <div className={styles.summaryLabel}>General Expenses</div>
          <div className={styles.summaryAmount}>{formatINR(totals.general)}</div>
          <div className={styles.summaryCount}>{totals.generalCount} records</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardSalary}`}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconSalary}`}>👨‍⚕️</div>
          <div className={styles.summaryLabel}>Staff Salaries</div>
          <div className={styles.summaryAmount}>{formatINR(totals.salaries)}</div>
          <div className={styles.summaryCount}>{totals.salariesCount} records</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPharmacy}`}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconPharmacy}`}>💊</div>
          <div className={styles.summaryLabel}>Pharmacy Purchases</div>
          <div className={styles.summaryAmount}>{formatINR(totals.pharmacy)}</div>
          <div className={styles.summaryCount}>{totals.pharmacyCount} records</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardTotal}`}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconTotal}`}>📊</div>
          <div className={styles.summaryLabel}>Total Expenses</div>
          <div className={`${styles.summaryAmount} ${styles.summaryAmountTotal}`}>{formatINR(totals.total)}</div>
          <div className={styles.summaryCount}>All categories combined</div>
        </div>
      </div>

      <div className={styles.tabsBar}>
        <button className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('general')}>
          🧾 General <span className={`${styles.tabBadge} ${styles.tabBadgeGeneral}`}>{totals.generalCount}</span>
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'salaries' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('salaries')}>
          👨‍⚕️ Salaries <span className={`${styles.tabBadge} ${styles.tabBadgeSalary}`}>{totals.salariesCount}</span>
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'pharmacy' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('pharmacy')}>
          💊 Pharmacy <span className={`${styles.tabBadge} ${styles.tabBadgePharmacy}`}>{totals.pharmacyCount}</span>
        </button>
      </div>

      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.tableWrap}><div className={styles.loadingState}><div className={styles.spinner} /><div className={styles.loadingText}>Loading expense data...</div></div></div>
        ) : (
          <>
            {/* ── GENERAL EXPENSES TAB ── */}
            {activeTab === 'general' && (
              <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderTitle}>General Expenses — {filterLabel}</div>
                  <button className={styles.addBtn} onClick={handleOpenExpenseAdd}>+ Log Expense</button>
                </div>
                <table className={styles.table}>
                  <thead><tr><th>Date</th><th>Title / Description</th><th>Category</th><th>Paid To</th><th>Amount</th><th>Method/Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredGeneralExpenses.length === 0 ? (
                      <tr><td colSpan={7}><div className={styles.emptyState}><div className={styles.emptyIcon}>🧾</div><p className={styles.emptyTitle}>No general expenses found</p></div></td></tr>
                    ) : filteredGeneralExpenses.map(exp => {
                      const cat = getCat(exp.category);
                      return (
                        <tr key={exp.id} className={styles.row}>
                          <td style={{ fontWeight: 600 }}>{formatDate(exp.date)}</td>
                          <td><div style={{ color: '#0f172a', fontWeight: 700 }}>{exp.title}</div>{exp.notes && <div style={{ fontSize: 12, color: '#64748b' }}>{exp.notes}</div>}</td>
                          <td><span className={styles.categoryBadge} style={{ background: cat ? cat.color + '18' : '#f1f5f9', color: cat ? cat.color : '#475569' }}>{cat ? cat.name : exp.category}</span></td>
                          <td>{exp.paid_to || '—'}</td>
                          <td style={{ color: '#ef4444', fontWeight: 800 }}>{formatINR(exp.amount)}</td>
                          <td><div style={{ fontSize: 12, fontWeight: 600 }}>{exp.payment_method}</div><span className={exp.status === 'Paid' ? styles.statusPaid : styles.statusPending}>{exp.status}</span></td>
                          <td className={styles.actionCell}>
                            <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenExpenseEdit(exp)}>✎</button>
                            <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteExpense(exp.id)}>🗑</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── SALARIES TAB ── */}
            {activeTab === 'salaries' && (
              <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderTitle}>Staff Salaries — {filterLabel}</div>
                  <button className={styles.addBtn} onClick={handleOpenSalaryAdd}>+ Record Salary</button>
                </div>
                <table className={styles.table}>
                  <thead><tr><th>Date</th><th>Staff Name</th><th>Category</th><th>Paid To</th><th>Amount</th><th>Method/Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredSalaries.length === 0 ? (
                      <tr><td colSpan={7}><div className={styles.emptyState}><div className={styles.emptyIcon}>👨‍⚕️</div><p className={styles.emptyTitle}>No salaries found</p></div></td></tr>
                    ) : filteredSalaries.map(exp => {
                      const cat = getCat(exp.category);
                      const catLabel = exp.category === 'doctor_salary' ? 'Doctor Salary' : 'Staff Salary';
                      return (
                        <tr key={exp.id} className={styles.row}>
                          <td style={{ fontWeight: 600 }}>{formatDate(exp.date)}</td>
                          <td><div style={{ color: '#0f172a', fontWeight: 700 }}>{exp.title}</div>{exp.notes && <div style={{ fontSize: 12, color: '#64748b' }}>{exp.notes}</div>}</td>
                          <td><span className={styles.categoryBadge} style={{ background: '#8b5cf618', color: '#8b5cf6' }}>{catLabel}</span></td>
                          <td>{exp.paid_to || '—'}</td>
                          <td style={{ color: '#ef4444', fontWeight: 800 }}>{formatINR(exp.amount)}</td>
                          <td><div style={{ fontSize: 12, fontWeight: 600 }}>{exp.payment_method}</div><span className={exp.status === 'Paid' ? styles.statusPaid : styles.statusPending}>{exp.status}</span></td>
                          <td className={styles.actionCell}>
                            <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteExpense(exp.id)}>🗑</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PHARMACY PURCHASES TAB ── */}
            {activeTab === 'pharmacy' && (
              <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableHeaderTitle}>Pharmacy Purchases — {filterLabel}</div>
                </div>
                <table className={styles.table}>
                  <thead><tr><th>Date</th><th>Invoice / Description</th><th>Supplier</th><th>Amount (Grand Total)</th><th>Status</th></tr></thead>
                  <tbody>
                    {filteredPharmacy.length === 0 ? (
                      <tr><td colSpan={5}><div className={styles.emptyState}><div className={styles.emptyIcon}>💊</div><p className={styles.emptyTitle}>No pharmacy purchases found</p></div></td></tr>
                    ) : filteredPharmacy.map(exp => (
                      <tr key={exp.id} className={styles.row}>
                        <td style={{ fontWeight: 600 }}>{formatDate(exp.date)}</td>
                        <td>
                          <div style={{ color: '#0f172a', fontWeight: 700 }}>{exp.title}</div>
                          {exp.notes && <div style={{ fontSize: 12, color: '#64748b' }}>{exp.notes}</div>}
                        </td>
                        <td>{exp.paid_to || '—'}</td>
                        <td style={{ color: '#ef4444', fontWeight: 800 }}>{formatINR(exp.amount)}</td>
                        <td><span className={exp.status === 'Paid' ? styles.statusPaid : styles.statusPending}>{exp.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Pharmacy purchases sync automatically from the Pharmacy module. To add a purchase, go to <strong>Pharmacy → Purchases</strong>.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════ GENERAL EXPENSE MODAL ════ */}
      {showExpenseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExpenseModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingExpense ? 'Edit General Expense' : 'Add General Expense'}</h3>
              <button className={styles.modalClose} onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}><label>Title</label><input type="text" required value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} /></div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Amount (₹)</label><input type="number" required min="1" step="any" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} /></div>
                <div className={styles.formGroup}><label>Date</label><input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} /></div>
              </div>
              <div className={styles.formGroup}><label>Category</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.filter(c => !SALARY_CATS.includes(c.key) && !PHARMACY_CATS.includes(c.key)).map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Payment Method</label>
                  <select value={expenseForm.payment_method} onChange={e => setExpenseForm({...expenseForm, payment_method: e.target.value})}>
                    <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                  </select>
                </div>
                <div className={styles.formGroup}><label>Status</label>
                  <select value={expenseForm.status} onChange={e => setExpenseForm({...expenseForm, status: e.target.value})}>
                    <option>Paid</option><option>Pending</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}><label>Paid To</label><input type="text" value={expenseForm.paid_to} onChange={e => setExpenseForm({...expenseForm, paid_to: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Notes</label><input type="text" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} /></div>
              <button type="submit" className={styles.submitBtn}>{editingExpense ? '✓ Update' : '+ Save'} Expense</button>
            </form>
          </div>
        </div>
      )}

      {/* ════ SALARY MODAL ════ */}
      {showSalaryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSalaryModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Salary Payment</h3>
              <button className={styles.modalClose} onClick={() => setShowSalaryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSalarySubmit} className={styles.modalBody}>
              <div className={styles.formGroup}><label>Staff Type</label>
                <select value={salaryForm.staff_type} onChange={e => setSalaryForm({...salaryForm, staff_type: e.target.value, staff_id: ''})}>
                  <option value="staff">Staff Member</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              <div className={styles.formGroup}><label>Person</label>
                <select required value={salaryForm.staff_id} onChange={e => setSalaryForm({...salaryForm, staff_id: e.target.value})}>
                  <option value="">Select...</option>
                  {salaryForm.staff_type === 'staff'
                    ? staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role || 'Staff'})</option>)
                    : doctorList.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)
                  }
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Month</label>
                  <select value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})}>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}><label>Year</label>
                  <select value={salaryForm.year} onChange={e => setSalaryForm({...salaryForm, year: e.target.value})}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Base Salary (₹)</label>
                  <input type="number" required min="0" step="any" value={salaryForm.base_salary}
                    onChange={e => setSalaryForm({...salaryForm, base_salary: e.target.value})} />
                </div>
                <div className={styles.formGroup}><label>Incentive / Bonus (₹)</label>
                  <input type="number" min="0" step="any" value={salaryForm.incentive}
                    onChange={e => setSalaryForm({...salaryForm, incentive: e.target.value})} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Deductions (₹)</label>
                  <input type="number" min="0" step="any" value={salaryForm.deductions}
                    onChange={e => setSalaryForm({...salaryForm, deductions: e.target.value})} />
                </div>
                <div className={styles.formGroup}><label>Final Amount (₹)</label>
                  <input type="number" readOnly value={computeFinal(salaryForm)} style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a' }} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>Payment Method</label>
                  <select value={salaryForm.payment_method} onChange={e => setSalaryForm({...salaryForm, payment_method: e.target.value})}>
                    <option>Bank Transfer</option><option>Cash</option><option>UPI</option>
                  </select>
                </div>
                <div className={styles.formGroup}><label>Status</label>
                  <select value={salaryForm.status} onChange={e => setSalaryForm({...salaryForm, status: e.target.value})}>
                    <option>Paid</option><option>Pending</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={styles.submitBtn}>+ Submit Salary</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
