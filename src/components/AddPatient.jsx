import { useState, useRef, useEffect } from "react";
import { usePatients } from "../context/PatientContext";
import styles from "./AddPatient.module.css";
import Swal from "sweetalert2";

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
const FEE_OPTIONS = ["Standard", "Premium", "Budget", "Insurance", "Waived"];
const TYPE_OPTIONS = ["New", "Review", "Emergency", "Follow-up"];
// Doctor options are loaded dynamically from database API

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
  const { groups, addGroup, addPatient, fetchPatients, nextId } = usePatients();
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    firstName: "",
    lastName: "",
    mobile: initialData.mobile || "",
    state: "",
    locality: "",
    address: "",
    pincode: "",
    dob: "",
    age: "",
    gender: "",
    country: "India",
    remarks: "",
    group: "",
    fee: "",
    consultationFee: "",
    type: "",
    patient_type: "",
    medication: "",
    pregnant: "",
    doctor: "",
    surgery: "",
    dentalHistory: "",
    selectedTreatments: [],
    prescriptionNotes: "",
    paidAmount: 0,
    paymentMethod: "Cash",
    cashReceived: "",
    cashReceivedTouched: false,
    transactionId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    tax: "",
    time: "",
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false); // synchronous guard — prevents double-submit
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
  const [taxesList, setTaxesList] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/treatment-master/list/")
      .then((r) => r.json())
      .then((data) => setTreatmentsList(data))
      .catch((e) => console.error("Error fetching treatments:", e));

    fetch("http://127.0.0.1:8000/api/doctors/")
      .then((r) => r.json())
      .then((data) => {
        setDoctorsList(data);
        if (currentUser?.role === "Doctor" && currentUser?.doctor_profile_id) {
          const myDoc = data.find(
            (d) => String(d.id) === String(currentUser.doctor_profile_id),
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
              consultationFee: fee,
            }));
          }
        }
      })
      .catch((e) => console.error("Error fetching doctors:", e));

    fetch("http://127.0.0.1:8000/api/patient-groups/")
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.length === 0) {
          setPatientGroups([
            { id: "ortho", name: "Ortho" },
            { id: "implant", name: "Implant" },
          ]);
        } else {
          // ensure Ortho and Implant exist if not present
          const hasOrtho = data.some((g) => g.name.toLowerCase() === "ortho");
          const hasImplant = data.some(
            (g) => g.name.toLowerCase() === "implant",
          );
          const defaults = [];
          if (!hasOrtho) defaults.push({ id: "mock-ortho", name: "Ortho" });
          if (!hasImplant)
            defaults.push({ id: "mock-implant", name: "Implant" });
          setPatientGroups([...data, ...defaults]);
        }
      })
      .catch((e) => {
        console.error("Error fetching patient groups:", e);
        setPatientGroups([
          { id: "ortho", name: "Ortho" },
          { id: "implant", name: "Implant" },
        ]);
      });

    fetch("http://127.0.0.1:8000/api/dropdowns/payment_method/")
      .then((r) => r.json())
      .then((data) => setPaymentMethods(data.map((d) => d.name)))
      .catch((e) => console.error("Error fetching payment methods:", e));

    fetch("http://127.0.0.1:8000/api/settings/taxes/")
      .then((r) => r.json())
      .then((data) => setTaxesList(data.filter((t) => t.is_active)))
      .catch((e) => console.error("Error fetching taxes:", e));

    fetch("http://127.0.0.1:8000/api/masters/patient-types/?active_only=true")
      .then((r) => r.json())
      .then((data) => setPatientTypesList(data))
      .catch((e) =>
        console.error("Error fetching patient types from Master:", e),
      );
  }, []);

  // Close popup on outside click
  useEffect(() => {
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target))
        setGroupPopup(false);
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

  function toggleTreatment(id) {
    setForm((f) => {
      const current = f.selectedTreatments;
      if (current.includes(id))
        return { ...f, selectedTreatments: current.filter((x) => x !== id) };
      return { ...f, selectedTreatments: [...current, id] };
    });
  }

  const getPayableAmount = () => {
    const baseAmount =
      form.selectedTreatments.reduce((sum, t) => {
        const tObj =
          typeof t === "object"
            ? t
            : treatmentsList.find((x) => String(x.id) === String(t));
        const cost =
          tObj && tObj.cost !== undefined
            ? tObj.cost
            : tObj && tObj.price !== undefined
              ? tObj.price
              : 0;
        return sum + (parseFloat(cost) || 0);
      }, 0) + (parseFloat(form.consultationFee) || 0);
    const taxRate = parseFloat(form.tax) || 0;
    return baseAmount + (baseAmount * taxRate) / 100;
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
      date: "Registration Date",
      firstName: "First name",
      lastName: "Last name",
      mobile: "Mobile number",
      gender: "Gender",
      dob: "Date of birth",
      doctor: "Doctor",
    };
    const e = {};
    for (const [k, label] of Object.entries(req)) {
      if (!form[k]?.trim()) e[k] = `${label} is required`;
    }
    if (form.mobile && !/^\d{10}$/.test(form.mobile))
      e.mobile = "Enter a valid 10-digit mobile number";
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

    // --- PAYMENT VALIDATION ---
    const payable = getPayableAmount();
    if (payable > 0) {
      if (!form.paymentMethod || !form.paymentMethod.trim()) {
        e.paymentMethod =
          "Payment Method is required when payable amount is greater than ₹0";
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
          // Digital payment method (UPI, Card, Cheque, Online, Bank Transfer)
          const paidNum = parseFloat(form.paidAmount);
          if (isNaN(paidNum) || paidNum <= 0) {
            e.paidAmount = `Amount Paid must be greater than 0 for ${form.paymentMethod}`;
          } else if (paidNum > payable) {
            e.paidAmount = `Amount Paid (₹${paidNum.toFixed(2)}) cannot exceed total payable amount (₹${payable.toFixed(2)})`;
          }
          if (!form.transactionId || !form.transactionId.trim()) {
            e.transactionId = "Transaction ID is required for digital payments";
          }
          if (!form.transactionDate || !form.transactionDate.trim()) {
            e.transactionDate =
              "Transaction Date is required for digital payments";
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
    if (savingRef.current) return; // ← synchronous guard — blocks any re-entry instantly
    if (!validate()) return;

    savingRef.current = true; // ← lock synchronously before any await
    setIsSaving(true); // ← update UI state (button shows spinner)

    const payable = getPayableAmount();
    const isCash =
      form.paymentMethod && form.paymentMethod.toLowerCase() === "cash";
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
      phone: form.mobile,
      dob: form.dob || null,
      age:
        form.age !== "" && form.age !== null && form.age !== undefined
          ? parseInt(form.age, 10)
          : null,
      gender: form.gender,
      address: form.address || null,
      pincode: form.pincode || null,
      doctor: form.doctor,
      group_ids: form.group ? [parseInt(form.group)] : [],
      notes: form.remarks || form.dentalHistory,
      treatments: form.selectedTreatments,
      prescription_notes: form.prescriptionNotes,
      paid_amount: payable > 0 ? effectivePaid : 0,
      cash_received: payable > 0 && isCash ? cashNum : 0,
      balance_returned: payable > 0 && isCash ? balanceReturned : 0,
      payment_method: payable > 0 ? form.paymentMethod : "Cash",
      transaction_id: payable > 0 && !isCash ? form.transactionId : "",
      transaction_date: payable > 0 && !isCash ? form.transactionDate : "",
      tax: form.tax,
      consultation_fee: form.consultationFee,
      fee_type: form.fee,
      visit_type: form.type,
      patient_type: form.patient_type,
      time: form.time,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/patient/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakeData),
      });

      if (res.ok) {
        // Show success alert immediately — don't wait for fetchPatients
        Swal.fire({
          title: "✅ Patient Saved!",
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

        fetchPatients(""); // refresh in background — no await
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
        savingRef.current = false; // re-enable on error so user can fix and retry
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Backend error:", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to connect to backend",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
      savingRef.current = false; // re-enable on network error
      setIsSaving(false);
    }
  }

  async function handleAddGroup() {
    const trimmed = newGroup.trim();
    if (!trimmed) {
      setGroupError("Enter a group name");
      return;
    }
    if (
      patientGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setGroupError("Group already exists");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/patient-groups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const newGrp = await res.json();
        setPatientGroups((prev) => [...prev, newGrp]);
        setForm((f) => ({ ...f, group: String(newGrp.id) }));
        setNewGroup("");
        setGroupError("");
        setGroupPopup(false);
      }
    } catch (err) {
      setGroupError("Failed to create group");
    }
  }

  const payable = getPayableAmount();
  const isCash =
    form.paymentMethod && form.paymentMethod.toLowerCase() === "cash";
  const displayCashVal =
    form.cashReceived !== ""
      ? form.cashReceived
      : !form.cashReceivedTouched && payable > 0
        ? payable.toFixed(2)
        : "";
  const cashNum = parseFloat(displayCashVal);
  const isCashNumValid = !isNaN(cashNum) && cashNum >= 0;
  const cashDiff = isCashNumValid ? cashNum - payable : 0;
  const effectivePaid = isCash
    ? isCashNumValid
      ? Math.min(cashNum, payable)
      : 0
    : parseFloat(form.paidAmount) || payable;
  const balanceDue = Math.max(0, payable - effectivePaid);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Add Patient"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="4" fill="white" />
                <path
                  d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M17 7v6M14 10h6"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h2 className={styles.headerTitle}>Add New Patient</h2>
              <p className={styles.headerSub}>
                Fill in the patient details below
              </p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
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
          {/* Auto IDs row */}
          <div className={styles.autoRow}>
            <div className={styles.autoField}>
              <label>Registration ID</label>
              <span className={styles.autoValue}>{regId}</span>
            </div>
            <div className={styles.autoField}>
              <label>Rec No</label>
              <span className={styles.autoValue}>
                {regId.replace("REG", "REC")}
              </span>
            </div>
            <div className={styles.autoField}>
              <label>Created At</label>
              <span className={styles.autoValue}>
                {new Date().toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {/* ── Section 1: Basic Info ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span
                className={styles.sectionDot}
                style={{ background: "#1E88E5" }}
              />
              Basic Information
            </div>
            <div className={styles.grid2}>
              <Field label="Registration Date *" error={errors.date}>
                <input
                  type="date"
                  className={err(errors.date)}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="First Name *" error={errors.firstName}>
                <input
                  className={err(errors.firstName)}
                  placeholder="e.g. Rahul"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last Name *" error={errors.lastName}>
                <input
                  className={err(errors.lastName)}
                  placeholder="e.g. Menon"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
              <Field label="Mobile No *" error={errors.mobile}>
                <input
                  className={err(errors.mobile)}
                  placeholder="10-digit number"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) =>
                    set("mobile", e.target.value.replace(/\D/, ""))
                  }
                />
              </Field>
              <Field label="Date of Birth *" error={errors.dob}>
                <input
                  type="date"
                  className={err(errors.dob)}
                  value={form.dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                />
              </Field>
              <Field label="Age" error={errors.age}>
                <input
                  placeholder="Auto-calculated / manual"
                  value={form.age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={err(errors.age)}
                />
              </Field>
              <Field label="Gender *" error={errors.gender}>
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
              <Field label="Patient Type">
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
              <Field label="Appointment Time">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                />
              </Field>
              <Field label="State">
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Locality">
                <input
                  placeholder="City / Town"
                  value={form.locality}
                  onChange={(e) => set("locality", e.target.value)}
                />
              </Field>
              <Field label="Address" span2>
                <textarea
                  rows={2}
                  placeholder="Full address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
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
            </div>
          </div>

          {/* ── Section 2: Medical History ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span
                className={styles.sectionDot}
                style={{ background: "#4CAF50" }}
              />
              Medical History
            </div>
            <div className={styles.grid2}>
              <Field label="Patient Remarks" span2>
                <textarea
                  rows={2}
                  placeholder="Notes or remarks…"
                  value={form.remarks}
                  onChange={(e) => set("remarks", e.target.value)}
                />
              </Field>

              {/* Patient Group with + button */}
              <Field label="Patient Group">
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
                    title="Add new group"
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
                        placeholder="e.g. Pediatric"
                        value={newGroup}
                        onChange={(e) => {
                          setNewGroup(e.target.value);
                          setGroupError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                        autoFocus
                      />
                      {groupError && (
                        <p className={styles.groupErr}>{groupError}</p>
                      )}
                      <div className={styles.groupPopupBtns}>
                        <button
                          className={styles.groupCancelBtn}
                          onClick={() => setGroupPopup(false)}
                        >
                          Cancel
                        </button>
                        <button
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

              <Field label="Assign Doctor *" error={errors.doctor}>
                <select
                  className={err(errors.doctor)}
                  value={form.doctor}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                >
                  <option value="">Select doctor</option>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{" "}
                      {d.consultation_fee !== undefined &&
                      d.consultation_fee !== null
                        ? `(₹${d.consultation_fee})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section 4: Consultation & Fees ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span
                className={styles.sectionDot}
                style={{ background: "#FF5722" }}
              />
              Consultation & Fees
            </div>
            <div className={styles.grid2}>
              <Field label="Prescription Notes" span2>
                <textarea
                  rows={2}
                  placeholder="Medicine / Instructions..."
                  value={form.prescriptionNotes}
                  onChange={(e) => set("prescriptionNotes", e.target.value)}
                />
              </Field>
              <Field label="Type of Fee">
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  <option value="">Select type</option>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
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
              {/* ── Conditional Payment Section ── */}
              {payable > 0 ? (
                <>
                  <Field label="Payment Method *" error={errors.paymentMethod}>
                    <select
                      className={err(errors.paymentMethod)}
                      value={form.paymentMethod}
                      onChange={(e) =>
                        handlePaymentMethodChange(e.target.value)
                      }
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
                          <option>Insurance</option>
                          <option>Online</option>
                        </>
                      )}
                    </select>
                  </Field>

                  {isCash ? (
                    <>
                      <Field label="Amount to Pay (₹)">
                        <input
                          type="text"
                          readOnly
                          value={`₹${payable.toFixed(2)}`}
                          style={{
                            background: "#f8fafc",
                            cursor: "default",
                            fontWeight: 700,
                            color: "#1e293b",
                          }}
                        />
                      </Field>

                      <Field
                        label="Cash Received (₹) *"
                        error={errors.cashReceived}
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          // value={displayCashVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((f) => ({
                              ...f,
                              cashReceived: val,
                              cashReceivedTouched: true,
                            }));
                            if (errors.cashReceived)
                              setErrors((prev) => ({
                                ...prev,
                                cashReceived: "",
                              }));
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
                                ? "1px solid #fca5a5"
                                : cashDiff > 0
                                  ? "1px solid #86efac"
                                  : "1px solid #cbd5e1",
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
                            fontSize: "14px",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                          }}
                        >
                          {cashDiff < 0 ? (
                            <>
                              <span>
                                ⚠️ Amount short by ₹
                                {Math.abs(cashDiff).toFixed(2)}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                }}
                              >
                                Partial
                              </span>
                            </>
                          ) : cashDiff > 0 ? (
                            <>
                              <span>₹{cashDiff.toFixed(2)}</span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#16a34a",
                                }}
                              >
                                Return to patient
                              </span>
                            </>
                          ) : (
                            <>
                              <span>₹0.00</span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  color: "#64748b",
                                }}
                              >
                                Exact amount
                              </span>
                            </>
                          )}
                        </div>
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Amount to Pay (₹)">
                        <input
                          type="text"
                          readOnly
                          value={`₹${payable.toFixed(2)}`}
                          style={{
                            background: "#f8fafc",
                            cursor: "default",
                            fontWeight: 700,
                            color: "#1e293b",
                          }}
                        />
                      </Field>

                      <Field
                        label="Transaction ID *"
                        error={errors.transactionId}
                      >
                        <input
                          type="text"
                          placeholder="e.g. UPI-987654321 / TXN-00123"
                          value={form.transactionId}
                          onChange={(e) => {
                            set("transactionId", e.target.value);
                            if (errors.transactionId)
                              setErrors((prev) => ({
                                ...prev,
                                transactionId: "",
                              }));
                          }}
                          className={err(errors.transactionId)}
                        />
                      </Field>

                      <Field
                        label="Transaction Date *"
                        error={errors.transactionDate}
                      >
                        <input
                          type="date"
                          value={form.transactionDate}
                          onChange={(e) => {
                            set("transactionDate", e.target.value);
                            if (errors.transactionDate)
                              setErrors((prev) => ({
                                ...prev,
                                transactionDate: "",
                              }));
                          }}
                          className={err(errors.transactionDate)}
                        />
                      </Field>
                    </>
                  )}
                </>
              ) : (
                <div
                  style={{
                    gridColumn: "span 2",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>ℹ️</span>
                  <span>
                    Payable Amount is ₹0.00. Payment details are not required.
                  </span>
                </div>
              )}

              {/* ── Bill Summary ── */}
              <div
                style={{
                  gridColumn: "span 2",
                  background: "transparent",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "10px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Bill Amount
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--slate-900)",
                    }}
                  >
                    ₹{payable.toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    Balance Due
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 900,
                      color: balanceDue > 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    ₹{balanceDue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <label className={styles.printCheck}>
            <input
              type="checkbox"
              checked={saveAndPrint}
              onChange={(e) => setSaveAndPrint(e.target.checked)}
            />
            <span className={styles.checkCustom} />
            Save &amp; Print
          </label>
          <div className={styles.footerBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
              style={isSaving ? { opacity: 0.7, cursor: "not-allowed" } : {}}
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
function Field({ label, children, error, span2 }) {
  return (
    <div className={`${styles.field} ${span2 ? styles.span2 : ""}`}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
