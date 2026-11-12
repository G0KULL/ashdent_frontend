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

  const [plannedProcedures, setPlannedProcedures] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

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
