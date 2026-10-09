import React from 'react';
import styles from './ConsultationWorkspace.module.css';
import { ConsultationProvider, useConsultation } from '../context/ConsultationContext';
import Sidebar from '../components/consultation/Sidebar';
import TopHeader from '../components/consultation/TopHeader';
import CaseHeader from '../components/consultation/CaseHeader';
import RightStickyPanel from '../components/consultation/RightStickyPanel';
import BottomActionBar from '../components/consultation/BottomActionBar';

// Tabs
import OverviewTab from '../components/consultation/tabs/OverviewTab';
import MedicalHistoryTab from '../components/consultation/tabs/MedicalHistoryTab';
import DentalChartTab from '../components/consultation/tabs/DentalChartTab';
import TreatmentPlanTab from '../components/consultation/tabs/TreatmentPlanTab';
import TodaysVisitTab from '../components/consultation/tabs/TodaysVisitTab';
import PrescriptionTab from '../components/consultation/tabs/PrescriptionTab';
import InvestigationsTab from '../components/consultation/tabs/InvestigationsTab';
import ClinicalNotesTab from '../components/consultation/tabs/ClinicalNotesTab';
import FilesTab from '../components/consultation/tabs/FilesTab';
import BillingTab from '../components/consultation/tabs/BillingTab';
import FollowUpTab from '../components/consultation/tabs/FollowUpTab';

const TABS = [
  'Overview', 'Medical History', 'Dental Chart', 'Treatment Plan',
  'Today\'s Visit', 'Prescription', 'Investigations', 'Clinical Notes',
  'Files', 'Billing', 'Follow-up'
];

const TabContent = () => {
  const { activeTab } = useConsultation();
  
  switch (activeTab) {
    case 'Overview': return <OverviewTab />;
    case 'Medical History': return <MedicalHistoryTab />;
    case 'Dental Chart': return <DentalChartTab />;
    case 'Treatment Plan': return <TreatmentPlanTab />;
    case 'Today\'s Visit': return <TodaysVisitTab />;
    case 'Prescription': return <PrescriptionTab />;
    case 'Investigations': return <InvestigationsTab />;
    case 'Clinical Notes': return <ClinicalNotesTab />;
    case 'Files': return <FilesTab />;
    case 'Billing': return <BillingTab />;
    case 'Follow-up': return <FollowUpTab />;
    default: return <OverviewTab />;
  }
};

const WorkspaceContent = () => {
  const { activeTab, setActiveTab } = useConsultation();

  return (
    <div className={styles.workspaceContainer}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <TopHeader />
        
        <div className={styles.tabsContainer}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={styles.scrollableArea}>
          <div className={styles.centerColumn}>
            <CaseHeader />
            <TabContent />
          </div>
          
          <RightStickyPanel />
        </div>
        
        <BottomActionBar />
      </div>
    </div>
  );
};

const ConsultationWorkspace = () => {
  return (
    <ConsultationProvider>
      <WorkspaceContent />
    </ConsultationProvider>
  );
};

export default ConsultationWorkspace;
