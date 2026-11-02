import React from 'react';
import { useConsultation } from '../../../context/ConsultationContext';
import InvestigationsSection from '../../investigations/InvestigationsSection';

const InvestigationsTab = () => {
  const { patient } = useConsultation();

  return (
    <div style={{ marginTop: '1rem' }}>
      <InvestigationsSection patient={patient} />
    </div>
  );
};

export default InvestigationsTab;
