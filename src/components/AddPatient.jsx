import { useState, useRef, useEffect } from "react";
import { usePatients } from "../context/PatientContext";
import styles from "./AddPatient.module.css";
import Swal from "sweetalert2";
import { API_BASE, getHeaders } from "../utils/api";

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const TYPE_OPTIONS = ["New", "Review", "Emergency", "Follow-up"];

export function calcAgeFromDob(dobStr, targetDate = new Date()) {
  if (!dobStr) return "";
  const birthDate = new Date(dobStr);
  if (isNaN(birthDate.getTime())) return "";

  const today = targetDate;
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  if (age < 0) return "";
  return String(age);
}

export function calcDobFromAge(
  ageVal,
  existingDob = null,
  targetDate = new Date(),
) {
  if (ageVal === "" || ageVal === null || ageVal === undefined) return "";
  const ageNum = parseInt(ageVal, 10);
  if (isNaN(ageNum) || ageNum < 0) return "";

  const today = targetDate;
  const targetYear = today.getFullYear() - ageNum;

  let month = today.getMonth();
  let day = today.getDate();

  if (existingDob) {
    const existingDate = new Date(existingDob);
    if (!isNaN(existingDate.getTime())) {
      month = existingDate.getMonth();
      day = existingDate.getDate();
    }
  }

  const calculatedDate = new Date(targetYear, month, day);
  if (calculatedDate.getMonth() !== month) {
    calculatedDate.setDate(0);
  }

  const yyyy = calculatedDate.getFullYear();
  const mm = String(calculatedDate.getMonth() + 1).padStart(2, "0");
  const dd = String(calculatedDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddPatient({
  onClose,
  onSaved,
  initialData = {},
  currentUser,
}) {
  const { fetchPatients, nextId } = usePatients();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    firstName: "",
    lastName: "",
    mobile: initialData.mobile || "",
    gender: "",
    dob: "",
    age: "",
    address: "",
    email: "",
    occupation: "",
    pincode: "",
    locality: "",
    state: "",
    country: "India",
    doctor: "",
    patient_type: "",
    time: "",
    group: "",
    visitType: "New",
    consultationFee: "",
    notes: "",
    paymentMethod: "Cash",
    cashReceived: "",
    cashReceivedTouched: false,
    transactionId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paidAmount: 0,
    tax: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveAndPrint, setSaveAndPrint] = useState(false);
  const [groupPopup, setGroupPopup] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [groupError, setGroupError] = useState("");
  const popupRef = useRef(null);
  const regId = `REG-${String(nextId).padStart(4, "0")}`;

  const [doctorsList, setDoctorsList] = useState([]);
  const [patientGroups, setPatientGroups] = useState([]);
  const [patientTypesList, setPatientTypesList] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    // 1. Fetch doctors dynamically
    fetch(`${API_BASE}/doctors/`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDoctorsList(data);
          if (currentUser?.role === "Doctor" && currentUser?.doctor_profile_id) {
            const myDoc = data.find(
              (d) => String(d.id) === String(currentUser.doctor_profile_id)
            );
            if (myDoc) {
              const fee =
                myDoc.consultation_fee !== undefined &&
                myDoc.consultation_fee !== null
                  ? String(myDoc.consultation_fee)
                  : "";
              setForm((f) => ({
                ...f,
                doctor: String(myDoc.id),
                consultationFee: fee || f.consultationFee,
              }));
            }
          }
        }
      })
      .catch((e) => console.error("Error fetching doctors:", e));

    // 2. Fetch patient groups
    fetch(`${API_BASE}/patient-groups/`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPatientGroups(data);
        }
      })
      .catch((e) => console.error("Error fetching patient groups:", e));

    // 3. Fetch payment methods
    fetch(`${API_BASE}/dropdowns/payment_method/`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPaymentMethods(data.map((d) => d.name));
        }
      })
      .catch((e) => console.error("Error fetching payment methods:", e));

    // 4. Fetch patient types from master
    fetch(`${API_BASE}/masters/patient-types/?active_only=true`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPatientTypesList(data);
        }
      })
      .catch((e) => console.error("Error fetching patient types:", e));
  }, [currentUser]);

  // Close popup on outside click
  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setGroupPopup(false);
      }
    }
    if (groupPopup) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [groupPopup]);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleDoctorChange(docId) {
    const selectedDoc = doctorsList.find((d) => String(d.id) === String(docId));
    const fee =
      selectedDoc &&
      selectedDoc.consultation_fee !== undefined &&
      selectedDoc.consultation_fee !== null
        ? String(selectedDoc.consultation_fee)
        : "";
    setForm((f) => ({
      ...f,
      doctor: docId,
      consultationFee: fee !== "" ? fee : f.consultationFee,
    }));
    if (errors.doctor) setErrors((e) => ({ ...e, doctor: "" }));
  }

  function handleDobChange(val) {
    const todayStr = new Date().toISOString().split("T")[0];
    let errDob = "";
    if (val && val > todayStr) {
      errDob = "Date of birth cannot be in the future";
    }
    const age = calcAgeFromDob(val);
    setForm((f) => ({ ...f, dob: val, age }));
    setErrors((e) => ({ ...e, dob: errDob, age: "" }));
  }

  function handleAgeChange(val) {
    const cleanVal = val.replace(/\D/g, "");
    if (cleanVal === "") {
      setForm((f) => ({ ...f, age: "" }));
      setErrors((e) => ({ ...e, age: "" }));
      return;
    }
    const ageNum = parseInt(cleanVal, 10);
    let errAge = "";
    if (ageNum > 150) {
      errAge = "Please enter a valid age (0 - 150)";
    }
    const dob = calcDobFromAge(cleanVal, form.dob);
    setForm((f) => ({ ...f, age: cleanVal, dob }));
    setErrors((e) => ({ ...e, age: errAge, dob: errAge ? "Invalid age" : "" }));
  }

  function handlePincodeChange(val) {
    const cleanVal = val.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: cleanVal }));
    if (errors.pincode) setErrors((e) => ({ ...e, pincode: "" }));
  }

  const getPayableAmount = () => {
    const fee = parseFloat(form.consultationFee) || 0;
    const taxRate = parseFloat(form.tax) || 0;
    return fee + (fee * taxRate) / 100;
  };

  function handlePaymentMethodChange(val) {
    const payable = getPayableAmount();
    const isNewCash = val.toLowerCase() === "cash";
    setForm((f) => ({
      ...f,
      paymentMethod: val,
      cashReceived: isNewCash
        ? f.cashReceived !== ""
          ? f.cashReceived
          : payable > 0
            ? payable.toFixed(2)
            : ""
        : "",
      cashReceivedTouched: isNewCash ? f.cashReceivedTouched : false,
      transactionId: isNewCash ? "" : f.transactionId,
      transactionDate: isNewCash
        ? ""
        : f.transactionDate || new Date().toISOString().split("T")[0],
      paidAmount: isNewCash
        ? payable > 0
          ? payable
          : 0
        : f.paidAmount > 0
          ? f.paidAmount
          : payable > 0
            ? payable
            : 0,
    }));
    setErrors((e) => ({
      ...e,
      paymentMethod: "",
      paidAmount: "",
      cashReceived: "",
      transactionId: "",
      transactionDate: "",
    }));
  }

  function validate() {
    const req = {
      firstName: "First name",
      lastName: "Last name",
      mobile: "Mobile number",
      gender: "Gender",
      dob: "Date of birth",
      doctor: "Assigned Doctor",
    };
    const e = {};
    for (const [k, label] of Object.entries(req)) {
      if (!String(form[k] || "").trim()) e[k] = `${label} is required`;
    }
    if (form.mobile && !/^\d{10}$/.test(form.mobile.trim())) {
      e.mobile = "Enter a valid 10-digit mobile number";
    }
    if (form.dob) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (form.dob > todayStr) e.dob = "Date of birth cannot be in the future";
    }
    if (form.age !== "" && form.age !== null && form.age !== undefined) {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 0) e.age = "Age cannot be negative";
      else if (ageNum > 150) e.age = "Please enter a valid age (0 - 150)";
    }
    if (form.pincode && form.pincode.trim()) {
      if (!/^\d{6}$/.test(form.pincode.trim())) {
        e.pincode = "Pincode must be a 6-digit numeric value";
      }
    }
    if (form.email && form.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        e.email = "Please enter a valid email address";
      }
    }

    // Payment validation if consultation fee > 0
    const payable = getPayableAmount();
    if (payable > 0) {
      if (!form.paymentMethod || !form.paymentMethod.trim()) {
        e.paymentMethod = "Payment Method is required when consultation fee is entered";
      } else {
        const pmLower = form.paymentMethod.toLowerCase();
        if (pmLower === "cash") {
          const rawCash =
            form.cashReceived !== ""
              ? form.cashReceived
              : !form.cashReceivedTouched && payable > 0
                ? payable.toFixed(2)
                : "";
          const cashNum = parseFloat(rawCash);
          if (rawCash === "" || isNaN(cashNum) || cashNum <= 0) {
            e.cashReceived = "Cash Received must be greater than 0";
          }
        } else {
          const paidNum = parseFloat(form.paidAmount);
          if (isNaN(paidNum) || paidNum <= 0) {
            e.paidAmount = `Amount Paid must be greater than 0 for ${form.paymentMethod}`;
          } else if (paidNum > payable) {
            e.paidAmount = `Amount Paid (₹${paidNum.toFixed(2)}) cannot exceed total payable (₹${payable.toFixed(2)})`;
          }
          if (!form.transactionId || !form.transactionId.trim()) {
            e.transactionId = "Transaction ID is required for digital payments";
          }
          if (!form.transactionDate || !form.transactionDate.trim()) {
            e.transactionDate = "Transaction Date is required for digital payments";
          }
        }
      }
    }

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const missing = Object.values(e).join("<br/>• ");
      Swal.fire({
        title: "Please check required fields",
        html: `<div style="text-align:left">• ${missing}</div>`,
        icon: "warning",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "OK, got it",
      });
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (savingRef.current) return;
    if (!validate()) return;

    savingRef.current = true;
    setIsSaving(true);

    const payable = getPayableAmount();
    const isCash = form.paymentMethod && form.paymentMethod.toLowerCase() === "cash";
    const rawCash = isCash
      ? form.cashReceived !== ""
        ? form.cashReceived
        : !form.cashReceivedTouched && payable > 0
          ? payable.toFixed(2)
          : "0"
      : "0";
    const cashNum = parseFloat(rawCash) || 0;
    const effectivePaid = isCash
      ? cashNum > 0
        ? Math.min(cashNum, payable)
        : 0
      : parseFloat(form.paidAmount) || payable;
    const balanceReturned = isCash ? Math.max(0, cashNum - payable) : 0;

    const intakeData = {
      date: form.date,
      name: `${form.firstName} ${form.lastName}`.trim(),
      phone: form.mobile.trim(),
      email: form.email ? form.email.trim() : null,
      occupation: form.occupation ? form.occupation.trim() : null,
      dob: form.dob || null,
      age:
        form.age !== "" && form.age !== null && form.age !== undefined
          ? parseInt(form.age, 10)
          : null,
      gender: form.gender,
      address: [form.address, form.locality, form.city].filter(Boolean).join(', ') || null,
      pincode: form.pincode || null,
      doctor: form.doctor,
      group_ids: form.group ? [parseInt(form.group)] : [],
      notes: form.notes || null,
      consultation_fee: form.consultationFee || 0,
      patient_type: form.patient_type || null,
      time: form.time || null,
      visit_type: form.visitType || "New",
      paid_amount: payable > 0 ? effectivePaid : 0,
      cash_received: payable > 0 && isCash ? cashNum : 0,
      balance_returned: payable > 0 && isCash ? balanceReturned : 0,
      payment_method: payable > 0 ? form.paymentMethod : "Cash",
      transaction_id: payable > 0 && !isCash ? form.transactionId : "",
      transaction_date: payable > 0 && !isCash ? form.transactionDate : "",
      tax: form.tax,
    };

    try {
      const res = await fetch(`${API_BASE}/patient/create/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(intakeData),
      });

      if (res.ok) {
        Swal.fire({
          title: "✓ Patient Saved!",
          text: "Patient has been registered successfully.",
          icon: "success",
          confirmButtonColor: "#10b981",
          confirmButtonText: "Great!",
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          if (saveAndPrint) window.print();
          onSaved();
        });
        fetchPatients("");
      } else {
        const errData = await res.json();
        console.error("Save Error:", errData);
        let errorText = "Cannot Save Patient";
        if (errData.phone) {
          errorText = "Phone number already exists or is invalid.";
        } else if (errData.pincode) {
          errorText = Array.isArray(errData.pincode)
            ? errData.pincode.join(" ")
            : String(errData.pincode);
        } else if (errData.dob) {
          errorText = Array.isArray(errData.dob)
            ? errData.dob.join(" ")
            : String(errData.dob);
        } else if (errData.age) {
          errorText = Array.isArray(errData.age)
            ? errData.age.join(" ")
            : String(errData.age);
        } else if (errData.detail) {
          errorText = errData.detail;
        } else {
          errorText = JSON.stringify(errData);
        }
        Swal.fire({
          title: "Error!",
          text: errorText,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Network Error:", err);
      Swal.fire({
        title: "Network Error",
        text: "Could not connect to server.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  }

  async function handleAddGroup() {
    const trimmed = newGroup.trim();
    if (!trimmed) {
      setGroupError("Group name required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/patient-groups/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const saved = await res.json();
        setPatientGroups((prev) => [...prev, saved]);
        setForm((f) => ({ ...f, group: String(saved.id) }));
        setNewGroup("");
        setGroupPopup(false);
        setGroupError("");
      } else {
        setGroupError("Failed to save group");
      }
    } catch {
      setGroupError("Network error");
    }
  }

  const payable = getPayableAmount();
  const isCash = form.paymentMethod && form.paymentMethod.toLowerCase() === "cash";
  const rawCash = isCash
    ? form.cashReceived !== ""
      ? form.cashReceived
      : !form.cashReceivedTouched && payable > 0
        ? payable.toFixed(2)
        : "0"
    : "0";
  const cashNum = parseFloat(rawCash) || 0;
  const cashDiff = cashNum - payable;
  const effectivePaid = isCash
    ? cashNum > 0
      ? Math.min(cashNum, payable)
      : 0
    : parseFloat(form.paidAmount) || 0;
  const balanceDue = Math.max(0, payable - effectivePaid);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>New Patient Registration</h2>
              <p className={styles.headerSubtitle}>Complete patient intake profile for dental records</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.body}>

          {/* ════════ SECTION A: Basic Patient Information ════════ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: "#0284c7" }} />
              Section A – Basic Patient Information
            </div>
            <div className={styles.grid2}>
              {/* Row 1: Patient Name (First Name | Last Name) */}
              <Field label="First Name" required error={errors.firstName}>
                <input
                  className={err(errors.firstName)}
                  placeholder="e.g. Rahul"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input
                  className={err(errors.lastName)}
                  placeholder="e.g. Menon"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>

              {/* Row 2: Patient ID (read-only) | Registration Date (read-only) */}
              <Field label="Patient ID (Auto-Generated)">
                <input
                  type="text"
                  readOnly
                  value={regId}
                  className={styles.readOnly}
                  title="System-generated patient identification code"
                />
              </Field>
              <Field label="Registration Date">
                <input
                  type="text"
                  readOnly
                  value={new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  className={styles.readOnly}
                />
              </Field>

              {/* Row 3: Date of Birth | Age */}
              <Field label="Date of Birth" required error={errors.dob}>
                <input
                  type="date"
                  className={err(errors.dob)}
                  value={form.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </Field>
              <Field label="Age (Years)" error={errors.age}>
                <input
                  placeholder="Auto-calculated from DOB or manual"
                  value={form.age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={err(errors.age)}
                />
              </Field>

              {/* Row 4: Gender | Patient Type */}
              <Field label="Gender" required error={errors.gender}>
                <select
                  className={err(errors.gender)}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Patient Type (Optional)">
                <select
                  value={form.patient_type}
                  onChange={(e) => set("patient_type", e.target.value)}
                >
                  <option value="">Select Patient Type</option>
                  {patientTypesList.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.code})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ════════ SECTION B: Contact Information ════════ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: "#10b981" }} />
              Section B – Contact Information
            </div>
            <div className={styles.grid2}>
              {/* Row 1: Phone / Mobile | Email */}
              <Field label="Mobile Number" required error={errors.mobile}>
                <input
                  className={err(errors.mobile)}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="Email Address (Optional)" error={errors.email}>
                <input
                  type="email"
                  className={err(errors.email)}
                  placeholder="e.g. patient@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>

              {/* Row 2: Locality / City | Pincode */}
              <Field label="Locality / City">
                <input
                  placeholder="City / Town"
                  value={form.locality}
                  onChange={(e) => set("locality", e.target.value)}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className={err(errors.pincode)}
                />
              </Field>

              {/* Row 3: State | Country */}
              <Field label="State">
                <select value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Country">
                <input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </Field>

              {/* Row 4: Full Address (Full-width span 2) */}
              <Field label="Full Address" span2>
                <textarea
                  rows={2}
                  placeholder="Street address, building, apartment, flat no..."
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* ════════ SECTION C: Additional Information ════════ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: "#f59e0b" }} />
              Section C – Additional Information
            </div>
            <div className={styles.grid2}>
              {/* Row 1: Occupation | Patient Group */}
              <Field label="Occupation (Optional)">
                <input
                  placeholder="e.g. Teacher, Engineer, Student"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                />
              </Field>
              <Field label="Patient Group (Optional)">
                <div className={styles.groupRow} ref={popupRef}>
                  <select
                    value={form.group}
                    onChange={(e) => set("group", e.target.value)}
                    className={styles.groupSelect}
                  >
                    <option value="">Select group</option>
                    {patientGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.addGroupBtn}
                    onClick={() => setGroupPopup((o) => !o)}
                    title="Add new patient group"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 3v10M3 8h10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {groupPopup && (
                    <div className={styles.groupPopup}>
                      <p className={styles.groupPopupTitle}>Add New Group</p>
                      <input
                        className={styles.groupInput}
                        placeholder="e.g. VIP, Ortho, Senior"
                        value={newGroup}
                        onChange={(e) => {
                          setNewGroup(e.target.value);
                          setGroupError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                        autoFocus
                      />
                      {groupError && <p className={styles.groupErr}>{groupError}</p>}
                      <div className={styles.groupPopupBtns}>
                        <button
                          type="button"
                          className={styles.groupCancelBtn}
                          onClick={() => setGroupPopup(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.groupSaveBtn}
                          onClick={handleAddGroup}
                        >
                          Add Group
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              {/* Row 2: Visit Type | Appointment Time */}
              <Field label="Visit Type">
                <select
                  value={form.visitType}
                  onChange={(e) => set("visitType", e.target.value)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Appointment Time (Optional)">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>

              {/* Row 3: Clinical Notes (Full-width span 2) */}
              <Field label="Clinical / Reception Notes (Optional)" span2>
                <textarea
                  rows={2}
                  placeholder="Chief complaint or initial registration notes..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* ════════ SECTION D: Clinical Assignment & Consultation Fee ════════ */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionDot} style={{ background: "#8b5cf6" }} />
              Section D – Clinical Assignment &amp; Consultation Fee
            </div>
            <div className={styles.grid2}>
              {/* Row 1: Doctor Selection | Consultation Fee */}
              <Field label="Assigned Doctor" required error={errors.doctor}>
                <select
                  className={err(errors.doctor)}
                  value={form.doctor}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                >
                  <option value="">Select doctor</option>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{" "}
                      {d.consultation_fee !== undefined && d.consultation_fee !== null
                        ? `(₹${d.consultation_fee})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Consultation Fee (₹) (Optional)">
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.consultationFee}
                  onChange={(e) => set("consultationFee", e.target.value)}
                />
              </Field>

              {/* Conditional Consultation Fee Payment collection if fee > 0 */}
              {payable > 0 && (
                <>
                  <Field label="Payment Method" required error={errors.paymentMethod}>
                    <select
                      className={err(errors.paymentMethod)}
                      value={form.paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.length > 0 ? (
                        paymentMethods.map((m) => <option key={m}>{m}</option>)
                      ) : (
                        <>
                          <option>Cash</option>
                          <option>Card</option>
                          <option>UPI</option>
                          <option>Cheque</option>
                          <option>Online</option>
                        </>
                      )}
                    </select>
                  </Field>

                  <Field label="Amount to Pay (₹)">
                    <input
                      type="text"
                      readOnly
                      value={`₹${payable.toFixed(2)}`}
                      className={styles.readOnly}
                    />
                  </Field>

                  {isCash ? (
                    <>
                      <Field label="Cash Received (₹)" required error={errors.cashReceived}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={form.cashReceived}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((f) => ({
                              ...f,
                              cashReceived: val,
                              cashReceivedTouched: true,
                            }));
                            if (errors.cashReceived)
                              setErrors((prev) => ({ ...prev, cashReceived: "" }));
                          }}
                          className={err(errors.cashReceived)}
                        />
                      </Field>

                      <Field label="Balance to Return (₹)">
                        <div
                          style={{
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            borderRadius: "8px",
                            border:
                              cashDiff < 0
                                ? "1.5px solid #fca5a5"
                                : cashDiff > 0
                                  ? "1.5px solid #86efac"
                                  : "1.5px solid #cbd5e1",
                            background:
                              cashDiff < 0
                                ? "#fef2f2"
                                : cashDiff > 0
                                  ? "#f0fdf4"
                                  : "#f8fafc",
                            color:
                              cashDiff < 0
                                ? "#b91c1c"
                                : cashDiff > 0
                                  ? "#15803d"
                                  : "#334155",
                            fontWeight: 700,
                            fontSize: "13.5px",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                            width: "100%",
                          }}
                        >
                          {cashDiff < 0 ? (
                            <>
                              <span>Short by ₹{Math.abs(cashDiff).toFixed(2)}</span>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626" }}>
                                Partial
                              </span>
                            </>
                          ) : cashDiff > 0 ? (
                            <>
                              <span>₹{cashDiff.toFixed(2)}</span>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a" }}>
                                Return to patient
                              </span>
                            </>
                          ) : (
                            <>
                              <span>₹0.00</span>
                              <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>
                                Exact amount
                              </span>
                            </>
                          )}
                        </div>
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Amount Paid (₹)" required error={errors.paidAmount}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.paidAmount}
                          onChange={(e) => set("paidAmount", e.target.value)}
                          className={err(errors.paidAmount)}
                        />
                      </Field>

                      <Field label="Transaction Date" required error={errors.transactionDate}>
                        <input
                          type="date"
                          value={form.transactionDate}
                          onChange={(e) => set("transactionDate", e.target.value)}
                          className={err(errors.transactionDate)}
                        />
                      </Field>

                      <Field label="Transaction ID" required error={errors.transactionId} span2>
                        <input
                          placeholder="Bank reference, UPI ref, or check no..."
                          value={form.transactionId}
                          onChange={(e) => set("transactionId", e.target.value)}
                          className={err(errors.transactionId)}
                        />
                      </Field>
                    </>
                  )}

                  {/* Summary Banner */}
                  <div className={styles.paymentSummaryBox}>
                    <div>
                      <p className={styles.summaryLabel}>Total Consultation Fee</p>
                      <p className={styles.summaryVal}>₹{payable.toFixed(2)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className={styles.summaryLabel}>Balance Due</p>
                      <p
                        className={styles.summaryDue}
                        style={{ color: balanceDue > 0 ? "#ef4444" : "#10b981" }}
                      >
                        ₹{balanceDue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <label className={styles.printCheck}>
            <input
              type="checkbox"
              checked={saveAndPrint}
              onChange={(e) => setSaveAndPrint(e.target.checked)}
            />
            <span>Save &amp; Print Case Sheet</span>
          </label>
          <div className={styles.footerBtns}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="40 20"
                  />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10l4 4 8-8"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isSaving ? "Saving..." : "Save Patient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function err(e) {
  return e ? styles.inputError : "";
}

function Field({ label, children, error, span2, required }) {
  const isReq = required || (typeof label === "string" && label.includes("*"));
  const cleanLabel =
    typeof label === "string" ? label.replace("*", "").trim() : label;

  return (
    <div className={`${styles.field} ${span2 ? styles.span2 : ""}`}>
      <label className={styles.label}>
        <span>{cleanLabel}</span>
        {isReq && <span className={styles.req}>*</span>}
      </label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
