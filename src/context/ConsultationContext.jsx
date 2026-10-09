import React, { createContext, useContext, useState } from 'react';

const ConsultationContext = createContext();

export const useConsultation = () => useContext(ConsultationContext);

export const ConsultationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [patient, setPatient] = useState({
    name: 'Sarah Jenkins',
    uhid: 'UHID-2023-8942',
    age: 34,
    gender: 'Female',
    phone: '+1 555-0198',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Latex'],
    outstanding: 150.00,
    photo: 'https://i.pravatar.cc/150?img=47'
  });

  const [currentCase, setCurrentCase] = useState({
    id: 'CASE-00921',
    name: 'Root Canal Treatment',
    tooth: '36',
    status: 'In Progress',
    startedOn: '2023-10-12',
    estimatedCompletion: '2023-11-20',
    progress: 60
  });

  const [plannedProcedures, setPlannedProcedures] = useState([
    { tooth: '', procedure: 'EXTRACTION - ADULT', cost: '400.00', finalAmount: '400.00', status: 'Completed' }
  ]);
  const [prescriptions, setPrescriptions] = useState([
    { name: 'T.MOXIKIND CV 625MG', content: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)', batch: '11111', expiry: '14/10/2027', qty: 6, price: '7.00' }
  ]);

  const value = {
    activeTab,
    setActiveTab,
    patient,
    setPatient,
    currentCase,
    setCurrentCase,
    plannedProcedures,
    setPlannedProcedures,
    prescriptions,
    setPrescriptions
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
};
