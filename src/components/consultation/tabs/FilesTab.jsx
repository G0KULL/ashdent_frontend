import React from 'react';
import { useConsultation } from '../../../context/ConsultationContext';
import InvestigationsSection from '../../investigations/InvestigationsSection';

const FilesTab = () => {
  const { patient, appointment } = useConsultation();

  return (
    <div style={{ marginTop: '1rem' }}>
      <InvestigationsSection 
        patient={patient} 
        appointment={appointment} 
        showHistoryByDefault={true} 
      />
    </div>
  );
};

export default FilesTab;
