import React, { useState, useEffect } from "react";
import styles from "./SearchPatient.module.css";

const API_BASE = "http://127.0.0.1:8000/api";

function getHeaders() {
  const user = JSON.parse(localStorage.getItem("doctosmart_user") || "{}");
  return {
    "Content-Type": "application/json",
    "X-User-Id": user.id || "",
  };
}

const printPdf = async (url) => {
  try {
    const response = await fetch(url, { headers: getHeaders() });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    let iframe = document.getElementById("print-pdf-iframe");
    if (iframe) {
      if (iframe.dataset.blobUrl) {
        URL.revokeObjectURL(iframe.dataset.blobUrl);
      }
    } else {
      iframe = document.createElement("iframe");
      iframe.id = "print-pdf-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    iframe.dataset.blobUrl = blobUrl;
    iframe.src = blobUrl;

    let isPrinted = false;
    const doPrint = () => {
      if (isPrinted) return;
      isPrinted = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
    iframe.onload = doPrint;
    setTimeout(doPrint, 1500);
  } catch (e) {
    console.error("Failed to print PDF:", e);
    alert("Could not print PDF: " + e.message);
  }
};

export default function PatientProfileInvoice({ viewPatient, profile, refreshProfile }) {
  const [showAdd, setShowAdd] = useState(false);
  
  // Master lists
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // Filters state
  const [selectedFilter, setSelectedFilter] = useState("Treatment"); // Laboratory | Prescription | Treatment

  // Invoice Items Builder State
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  
  // Bottom Billing details
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch doctors & set initial assigned doctor on load
  useEffect(() => {
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDoctors(data);
          if (profile?.patient?.doctor) {
            setSelectedDoctorId(profile.patient.doctor);
          } else if (data.length > 0) {
            setSelectedDoctorId(data[0].id);
          }
        }
      })
      .catch(console.error);
  }, [profile]);

  // Extract patient's latest history items based on selected filter
  const getLatestHistoryItems = () => {
    const items = [];
    if (selectedFilter === "Treatment") {
      profile?.payments?.forEach((p) => {
        p.items?.forEach((it) => {
          if (p.bill_type === "Clinical" || it.fee_type === "Treatment" || !it.fee_type) {
            items.push({
              name: it.treatment_name || it.name,
              price: it.price || 0,
              date: new Date(p.created_at).toLocaleDateString(),
              treatment: it.treatment || null,
            });
          }
        });
      });
    } else if (selectedFilter === "Prescription") {
      profile?.prescriptions?.forEach((pr) => {
        pr.items?.forEach((it) => {
          items.push({
            name: it.medicine_name || it.name,
            price: it.unit_price || 0,
            date: new Date(pr.created_at).toLocaleDateString(),
            treatment: null,
          });
        });
      });
    } else if (selectedFilter === "Laboratory") {
      profile?.payments?.forEach((p) => {
        p.items?.forEach((it) => {
          if (p.bill_type === "Lab" || it.fee_type === "Lab") {
            items.push({
              name: it.treatment_name || it.name,
              price: it.price || 0,
              date: new Date(p.created_at).toLocaleDateString(),
              treatment: it.treatment || null,
            });
          }
        });
      });
    }

    // Deduplicate by name
    const deduped = [];
    const seenNames = new Set();
    items.forEach((item) => {
      if (item.name && !seenNames.has(item.name.toLowerCase())) {
        seenNames.add(item.name.toLowerCase());
        deduped.push(item);
      }
    });

    return deduped;
  };

  const latestHistoryItems = getLatestHistoryItems();

  // Handle adding an item from the history list
  const handleAddLatestItem = (item) => {
    const existingIndex = invoiceItems.findIndex(
      (it) => it.name.toLowerCase() === item.name.toLowerCase()
    );
    if (existingIndex > -1) {
      setInvoiceItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setInvoiceItems((prev) => [
        ...prev,
        {
          name: item.name,
          quantity: 1,
          unit_price: parseFloat(item.price) || 0,
          treatment: item.treatment || null,
        },
      ]);
    }
  };

  // Add item from the manual ADD CUSTOM ITEM section
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customName.trim()) return alert("Please enter an item name.");
    
    const priceVal = parseFloat(customPrice) || 0;

    // Determine if name exists in history to link ID
    const matched = latestHistoryItems.find(
      (t) => t.name.toLowerCase() === customName.trim().toLowerCase()
    );
    const treatmentId = matched ? matched.treatment : null;

    setInvoiceItems((prev) => [
      ...prev,
      {
        name: customName.trim(),
        quantity: 1,
        unit_price: priceVal,
        treatment: treatmentId,
      },
    ]);

    // Reset fields
    setCustomName("");
    setCustomPrice("");
  };

  // Remove item
  const handleRemoveItem = (index) => {
    setInvoiceItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate Subtotal & Grand Total
  const subtotal = invoiceItems.reduce(
    (acc, it) => acc + (it.quantity * it.unit_price),
    0
  );
  const grandTotal = subtotal;

  // Auto-fill paidAmount with grandTotal when grandTotal changes, unless manually modified
  useEffect(() => {
    if (showAdd && paidAmount === "") {
      setPaidAmount(grandTotal.toFixed(0));
    }
  }, [grandTotal, showAdd]);

  const paidAmountVal = parseFloat(paidAmount) || 0;
  const balance = grandTotal - paidAmountVal;

  const handleSaveInvoice = async () => {
    if (invoiceItems.length === 0) {
      return alert("Please add at least one item to the invoice.");
    }
    setSaving(true);
    try {
      const resV = await fetch(`${API_BASE}/visit/get-or-create/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ patient_id: viewPatient.id }),
      });
      const vData = await resV.json();
      const visitId = vData.visit_id || vData.id;

      const payload = {
        patient: viewPatient.id,
        visit: visitId,
        total_amount: grandTotal,
        paid_amount: paidAmountVal,
        payment_method: paymentMethod,
        doctor_id: selectedDoctorId || null,
        is_draft: false,
        items: invoiceItems.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          treatment: it.treatment || null,
        })),
      };

      const res = await fetch(`${API_BASE}/bill/create-advanced/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        alert("Invoice saved successfully!");
        setShowAdd(false);
        setInvoiceItems([]);
        setPaidAmount("");
        setPaymentMethod("Cash");
        await refreshProfile();

        if (data.billing_id) {
          printPdf(`${API_BASE}/billing/${data.billing_id}/pdf/`);
        }
      } else {
        alert("Failed to save invoice.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving invoice.");
    }
    setSaving(false);
  };

  return (
    <div className={styles.treatmentsTabBody} style={{ padding: "24px 32px 32px 32px" }}>
      {!showAdd ? (
        <>
          <div className={styles.treatmentActionsRow}>
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--slate-900)" }}>
              Invoices
            </h3>
            <button
              onClick={() => {
                setShowAdd(true);
                setInvoiceItems([]);
                setPaidAmount("");
              }}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Add New Invoice
            </button>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 8,
              border: "1px solid var(--border-light)",
              padding: 16,
            }}
          >
            <table className={styles.treatmentListTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice ID</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!profile?.bills || profile.bills.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  profile.bills
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 3)
                    .map((b) => (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td>INV-{String(b.id).toUpperCase().slice(0, 8)}</td>
                      <td>
                        {b.items?.map((it, idx) => (
                          <div key={it.id || idx} style={{ fontSize: 13, marginBottom: 4 }}>
                            <strong>{it.treatment_name || it.name}</strong> x {it.qty || it.quantity}
                          </div>
                        ))}
                      </td>
                      <td>₹{parseFloat(b.total_amount || 0).toFixed(2)}</td>
                      <td>₹{parseFloat(b.paid_amount || 0).toFixed(2)}</td>
                      <td style={{ color: parseFloat(b.balance_amount || 0) > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                        ₹{parseFloat(b.balance_amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: b.status === "Paid" ? "#dcfce7" : b.status === "Partial" ? "#fef9c3" : "#fee2e2",
                            color: b.status === "Paid" ? "#15803d" : b.status === "Partial" ? "#a16207" : "#b91c1c",
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => printPdf(`${API_BASE}/billing/${b.id}/pdf/`)}
                          style={{
                            border: "none",
                            background: "#eef2ff",
                            color: "#4f46e5",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            padding: "4px 10px",
                            fontSize: 11,
                          }}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header row of invoice builder */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Add New Invoice
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {/* Doctor Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                  👤 Assigned Doctor
                </span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    color: "#334155",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  fontWeight: "bold",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ display: "flex", minHeight: 480 }}>
            {/* Left Column (Pane) */}
            <div
              style={{
                width: 280,
                borderRight: "1px solid #e2e8f0",
                padding: "20px",
                background: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Radio buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Laboratory", "Prescription", "Treatment"].map((f) => (
                  <label
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: selectedFilter === f ? "#4f46e5" : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="filterCategory"
                      checked={selectedFilter === f}
                      onChange={() => setSelectedFilter(f)}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: "#4f46e5",
                        cursor: "pointer",
                      }}
                    />
                    {f}
                  </label>
                ))}
              </div>

              {/* Add Custom Item */}
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  + ADD CUSTOM ITEM
                </span>
                <form
                  onSubmit={handleAddCustomItem}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <input
                    type="text"
                    placeholder="Item / Treatment name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      padding: "10px",
                      borderRadius: 6,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
                  >
                    Add to Invoice
                  </button>
                </form>
              </div>

              {/* History list */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 180 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {selectedFilter}s (Latest)
                </span>
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    background: "#ffffff",
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: 220,
                  }}
                >
                  {latestHistoryItems.length === 0 ? (
                    <div style={{ padding: 12, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                      No latest {selectedFilter.toLowerCase()}s found.
                    </div>
                  ) : (
                    latestHistoryItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAddLatestItem(item)}
                        style={{
                          padding: "10px 12px",
                          fontSize: 12,
                          borderBottom: idx === latestHistoryItems.length - 1 ? "none" : "1px solid #f1f5f9",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#334155" }}>{item.name}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{item.date}</div>
                        </div>
                        <span style={{ fontWeight: 700, color: "#10b981", fontSize: 11 }}>
                          ₹{parseFloat(item.price).toFixed(0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Pane) */}
            <div
              style={{
                flex: 1,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
              }}
            >
              {/* Draft Items Table */}
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 20 }}>
                <table className={styles.treatmentListTable} style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Item Name</th>
                      <th style={{ textAlign: "center", width: 80 }}>Qty</th>
                      <th style={{ textAlign: "right", width: 120 }}>Price</th>
                      <th style={{ textAlign: "right", width: 120 }}>Amount</th>
                      <th style={{ textAlign: "center", width: 60 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                          Choose items from the left history list or add a custom item to begin building the invoice.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: "#334155" }}>{it.name}</td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                setInvoiceItems((p) =>
                                  p.map((x, i) =>
                                    i === idx ? { ...x, quantity: parseInt(e.target.value) || 1 } : x
                                  )
                                )
                              }
                              style={{
                                width: 50,
                                padding: 6,
                                border: "1px solid #cbd5e1",
                                borderRadius: 6,
                                textAlign: "center",
                                outline: "none",
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.unit_price}
                              onChange={(e) =>
                                setInvoiceItems((p) =>
                                  p.map((x, i) =>
                                    i === idx ? { ...x, unit_price: parseFloat(e.target.value) || 0 } : x
                                  )
                                )
                              }
                              style={{
                                width: 90,
                                padding: 6,
                                border: "1px solid #cbd5e1",
                                borderRadius: 6,
                                textAlign: "right",
                                outline: "none",
                              }}
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                            ₹{(it.quantity * it.unit_price).toFixed(2)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              style={{
                                border: "none",
                                background: "#fee2e2",
                                color: "#ef4444",
                                borderRadius: 6,
                                cursor: "pointer",
                                padding: "4px 8px",
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Billing Summary Box */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    width: 320,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                      Current Bill Subtotal
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>
                      Grand Total
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Payment row */}
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
                          letterSpacing: "0.05em",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        PAYMENT
                      </span>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
                          letterSpacing: "0.05em",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        METHOD
                      </span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          color: "#334155",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        <option>Cash</option>
                        <option>Card</option>
                        <option>UPI</option>
                        <option>Online</option>
                        <option>Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px dashed #cbd5e1",
                      paddingTop: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                      New Balance
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: balance > 0 ? "#ef4444" : "#10b981",
                      }}
                    >
                      ₹{balance.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleSaveInvoice}
                    disabled={saving}
                    style={{
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      padding: "12px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
                  >
                    {saving ? "Saving..." : "Save & Print Invoice"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
