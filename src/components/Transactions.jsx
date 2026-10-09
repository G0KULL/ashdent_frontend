import React, { useState, useEffect } from 'react';
import styles from './Transactions.module.css';

const API = 'http://127.0.0.1:8000/api';

function getHeaders() {
  const user = JSON.parse(localStorage.getItem('doctosmart_user') || '{}');
  return { 'Content-Type': 'application/json', 'X-User-Id': user.id || '', 'X-Username': user.username || '' };
}

function formatINR(amount) {
  return '₹' + parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('payments'); // payments, expense
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [summary, setSummary] = useState({
    patients: 0,
    payments: { cash: 0, upi: 0, card: 0, other: 0, total: 0 },
    expenses: { total: 0 },
    total_revenue: 0,
    net_income: 0
  });

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [categories, setCategories] = useState([]);

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: '', vendor: '', amount: '', payment_method: 'Cash', transaction_id: '', notes: '', date: new Date().toISOString().split('T')[0], title: ''
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qs = `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
      const [resPay, resExp, resSum] = await Promise.all([
        fetch(`${API}/payments/search/${qs}`, { headers: getHeaders() }),
        fetch(`${API}/finance/expenses/${qs}`, { headers: getHeaders() }),
        fetch(`${API}/finance/transaction-summary/${qs}`, { headers: getHeaders() })
      ]);
      if (resPay.ok) {
        const data = await resPay.json();
        // flatten payments if it returns structured data
        let pList = [];
        if (Array.isArray(data)) { pList = data; } 
        else if (data.results) { pList = data.results; }
        else if (data.bills) {
            pList = data.bills.map(b => ({
                id: b.id, date: b.date, amount: b.total_amount, type: 'Bill', patient: b.patient_name, payment_method: b.payment_method
            }));
        }
        // Normalize the keys for the table
        pList = pList.map(p => ({
           id: p.id,
           date: p.date || (p.created_at ? p.created_at.split('T')[0] : ''),
           patient: p.patient || p.patient_name || 'Unknown',
           amount: p.amount !== undefined ? p.amount : (p.paid_amount || p.total_amount || 0),
           type: p.type || 'Billing',
           payment_method: p.payment_method || 'Cash'
        }));
        setPayments(pList);
      }
      if (resExp.ok) {
        setExpenses(await resExp.json());
      }
      if (resSum.ok) {
        setSummary(await resSum.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/finance/categories/`, { headers: getHeaders() });
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error('Categories fetch error:', err); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      // Default title if empty
      const payload = { ...expenseForm };
      if (!payload.title) {
         const catObj = categories.find(c => c.key === payload.category);
         payload.title = catObj ? catObj.name : 'Expense';
      }
      
      const method = editingExpenseId ? 'PUT' : 'POST';
      const url = editingExpenseId ? `${API}/finance/expenses/${editingExpenseId}/` : `${API}/finance/expenses/`;
      
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setEditingExpenseId(null);
        fetchData(); // reload
      } else {
        alert('Failed to save expense');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      category: exp.category,
      vendor: exp.vendor || '',
      amount: exp.amount,
      payment_method: exp.payment_method,
      transaction_id: exp.transaction_id || '',
      notes: exp.notes || '',
      date: exp.date,
      title: exp.title || ''
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const res = await fetch(`${API}/finance/expenses/${id}/`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (res.ok) {
          fetchData();
        } else {
          alert("Failed to delete expense.");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <h2 className={styles.title}>Transactions</h2>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'payments' ? styles.activeTab : ''}`} onClick={() => setActiveTab('payments')}>Payments</button>
            <button className={`${styles.tab} ${activeTab === 'expense' ? styles.activeTab : ''}`} onClick={() => setActiveTab('expense')}>Expense</button>
          </div>
        </div>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <input type="date" className={styles.dateInput} value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} />
          <span>to</span>
          <input type="date" className={styles.dateInput} value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} />
          {activeTab === 'expense' && (
             <button className={styles.primaryBtn} onClick={() => {
                 setEditingExpenseId(null);
                 setExpenseForm({ category: '', vendor: '', amount: '', payment_method: 'Cash', transaction_id: '', notes: '', date: new Date().toISOString().split('T')[0], title: '' });
                 setShowExpenseModal(true);
             }}>+ Add New Expense</button>
          )}
          <button className={styles.secondaryBtn} onClick={() => setShowSummaryModal(true)}>
             <span role="img" aria-label="report">📄</span> Summary Report
          </button>
          <button className={styles.secondaryBtn}>Export Excel ▾</button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: '#e0f2fe', color: '#0284c7'}}>💸</div>
          <div>
            <div className={styles.cardLabel}>Total Collections</div>
            <div className={styles.cardValue}>{formatINR(summary.payments.total)}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: '#dcfce7', color: '#16a34a'}}>📈</div>
          <div>
            <div className={styles.cardLabel}>Total Revenue</div>
            <div className={styles.cardValue}>{formatINR(summary.total_revenue)}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: '#fef3c7', color: '#d97706'}}>💵</div>
          <div>
            <div className={styles.cardLabel}>Cash</div>
            <div className={styles.cardValue}>{formatINR(summary.payments.cash)}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{background: '#f3e8ff', color: '#9333ea'}}>🏦</div>
          <div>
            <div className={styles.cardLabel}>Bank</div>
            <div className={styles.cardValue}>{formatINR(summary.payments.upi + summary.payments.card)}</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h3 className={styles.tableTitle}>{activeTab === 'payments' ? 'Payment Details' : 'Expense Details'}</h3>
        <table className={styles.table}>
          <thead>
            {activeTab === 'payments' ? (
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Amount (₹)</th>
                <th>Type</th>
                <th>Payment Method</th>
                <th>Action</th>
              </tr>
            ) : (
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Amount (₹)</th>
                <th>Payment Method</th>
                <th>Txn ID</th>
                <th>Action</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7" style={{textAlign:'center', padding: '20px'}}>Loading...</td></tr>}
            {!loading && activeTab === 'payments' && payments.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p.date}</td>
                <td style={{fontWeight: 600, color: '#0f172a'}}>{p.patient || 'Unknown'}</td>
                <td style={{fontWeight: 700}}>{p.amount}</td>
                <td>{p.type || 'Bill'}</td>
                <td>{p.payment_method || 'Cash'}</td>
                <td>
                  <button className={styles.actionBtn}>Print</button>
                </td>
              </tr>
            ))}
            {!loading && activeTab === 'expense' && expenses.map((e, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{e.date}</td>
                <td>{categories.find(c => c.key === e.category)?.name || e.category}</td>
                <td>{e.vendor || '—'}</td>
                <td style={{fontWeight: 700, color: '#ef4444'}}>{e.amount}</td>
                <td>{e.payment_method}</td>
                <td>{e.transaction_id || '—'}</td>
                <td style={{display: 'flex', gap: '8px'}}>
                   <button className={styles.actionBtn} onClick={() => handleEditExpense(e)}>Edit</button>
                   <button className={styles.actionBtn} style={{color: '#ef4444', borderColor: '#ef4444'}} onClick={() => handleDeleteExpense(e.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!loading && ((activeTab === 'payments' && payments.length === 0) || (activeTab === 'expense' && expenses.length === 0)) && (
               <tr><td colSpan="7" style={{textAlign:'center', padding: '20px'}}>No records found for today.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Expense Modal */}
      {showExpenseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '500px'}}>
            <div className={styles.modalHeader}>
              <h3>{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button onClick={() => { setShowExpenseModal(false); setEditingExpenseId(null); }} className={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Category *</label>
                <select required value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Vendor</label>
                <input type="text" placeholder="Enter vendor or paid to..." value={expenseForm.vendor} onChange={e => setExpenseForm({...expenseForm, vendor: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Amount *</label>
                  <input type="number" required placeholder="Enter amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Payment Type *</label>
                  <select required value={expenseForm.payment_method} onChange={e => setExpenseForm({...expenseForm, payment_method: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Transaction ID</label>
                <input type="text" placeholder="Enter transaction id" value={expenseForm.transaction_id} onChange={e => setExpenseForm({...expenseForm, transaction_id: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea placeholder="Enter notes" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} rows={3} />
              </div>
              <div className={styles.formGroup}>
                <label>Expense Date *</label>
                <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" className={styles.primaryBtn} style={{width: '100%'}}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Report Modal */}
      {showSummaryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '600px'}}>
            <div className={styles.modalHeader}>
              <h3>Business Summary Report</h3>
              <button onClick={() => setShowSummaryModal(false)} className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.summaryGrid}>
                <div className={styles.sumCard}>
                  <div className={styles.sumIcon} style={{background: '#f1f5f9'}}>👥</div>
                  <div>
                    <div className={styles.sumLabel}>Patients</div>
                    <div className={styles.sumVal}>{summary.patients} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#64748b'}}>Total</span></div>
                  </div>
                </div>
                
                <div className={styles.sumCard}>
                  <div className={styles.sumIcon} style={{background: '#dcfce7', color: '#16a34a'}}>₹</div>
                  <div style={{flex: 1}}>
                    <div className={styles.sumLabel}>Payments</div>
                    <div className={styles.sumVal}>{formatINR(summary.payments.total)} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#64748b'}}>Total</span></div>
                    <div className={styles.sumBreakdown}>
                       <div>Cash: {formatINR(summary.payments.cash)}</div>
                       <div>UPI: {formatINR(summary.payments.upi)}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.sumCard}>
                  <div className={styles.sumIcon} style={{background: '#fee2e2', color: '#ef4444'}}>💸</div>
                  <div>
                    <div className={styles.sumLabel}>Expenses</div>
                    <div className={styles.sumVal} style={{color: '#ef4444'}}>{formatINR(summary.expenses.total)} <span style={{fontSize: '12px', fontWeight: 'normal', color: '#64748b'}}>Total</span></div>
                  </div>
                </div>
              </div>

              <div className={styles.netIncomeBox}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{color: '#64748b', fontWeight: 600}}>Total Revenue</span>
                  <span style={{fontWeight: 700}}>{formatINR(summary.total_revenue)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '12px'}}>
                  <span style={{color: '#64748b', fontWeight: 600}}>Total Expenses</span>
                  <span style={{fontWeight: 700, color: '#ef4444'}}>- {formatINR(summary.expenses.total)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{fontSize: '18px', fontWeight: 800}}>Net Income</span>
                  <span style={{fontSize: '24px', fontWeight: 800, color: summary.net_income >= 0 ? '#16a34a' : '#ef4444'}}>
                     {formatINR(summary.net_income)}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
               <button className={styles.secondaryBtn} onClick={() => setShowSummaryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
