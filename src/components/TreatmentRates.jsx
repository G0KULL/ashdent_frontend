import { useState, useEffect } from 'react'
import styles from './TreatmentRates.module.css'

export default function TreatmentRates() {
  const [treatments, setTreatments] = useState([])
  const [newTreatment, setNewTreatment] = useState({ name: '', price: '', fee_type: 'Treatment' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTreatments()
  }, [])

  async function fetchTreatments() {
    const res = await fetch('http://127.0.0.1:8000/api/treatment-master/list/')
    const data = await res.json()
    setTreatments(data)
  }

  async function handleUpdatePrice(id, newPrice) {
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/treatment-master/update/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      })
      if (res.ok) {
        alert("Price updated!")
        fetchTreatments()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTreatment() {
    if (!newTreatment.name || !newTreatment.price) return
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/treatment-master/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTreatment)
      })
      if (res.ok) {
        setNewTreatment({ name: '', price: '', fee_type: 'Treatment' })
        fetchTreatments()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Treatment Rate Master</h2>
        <p className={styles.subtitle}>Manage clinical service prices</p>
      </header>

      <div className={styles.addCard}>
        <h3>Add New Service</h3>
        <div className={styles.row}>
          <input 
            placeholder="Service Name (e.g. Scaling)" 
            value={newTreatment.name}
            onChange={e => setNewTreatment({...newTreatment, name: e.target.value})}
          />
          <input 
            type="number" 
            placeholder="Standard Price" 
            value={newTreatment.price}
            onChange={e => setNewTreatment({...newTreatment, price: e.target.value})}
          />
          <button onClick={handleAddTreatment} disabled={loading}>Add Service</button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Current Rate (₹)</th>
              <th>Update To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {treatments.map(t => (
              <EditableRow key={t.id} treatment={t} onUpdate={handleUpdatePrice} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EditableRow({ treatment, onUpdate }) {
  const [val, setVal] = useState(treatment.price)
  return (
    <tr>
      <td className={styles.nameCell}>{treatment.name}</td>
      <td><span className={styles.categoryChip}>{treatment.fee_type}</span></td>
      <td className={styles.priceCell}>₹{treatment.price}</td>
      <td>
        <input 
          type="number" 
          className={styles.miniInput}
          value={val}
          onChange={e => setVal(e.target.value)}
        />
      </td>
      <td>
        <button 
          className={styles.updateBtn}
          onClick={() => onUpdate(treatment.id, val)}
          disabled={parseFloat(val) === parseFloat(treatment.price)}
        >
          Update
        </button>
      </td>
    </tr>
  )
}
