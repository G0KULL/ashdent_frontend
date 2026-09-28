import React, { useState } from 'react';
import ModernTooth from './ModernTooth';

export type ToothState = 'healthy' | 'completed' | 'needs_treatment' | 'extraction';

export interface ToothMetadata {
  id: number;
  name: string;
  arch: 'Upper' | 'Lower';
  selected?: boolean;
  status?: ToothState;
  notes?: string;
  surface?: string;
  diagnosis?: string;
}

const adultTeeth: ToothMetadata[] = [
  { id: 18, name: "Third Molar", arch: "Upper" }, { id: 17, name: "Second Molar", arch: "Upper" },
  { id: 16, name: "First Molar", arch: "Upper" }, { id: 15, name: "Second Premolar", arch: "Upper" },
  { id: 14, name: "First Premolar", arch: "Upper" }, { id: 13, name: "Canine", arch: "Upper" },
  { id: 12, name: "Lateral Incisor", arch: "Upper" }, { id: 11, name: "Central Incisor", arch: "Upper" },
  
  { id: 21, name: "Central Incisor", arch: "Upper" }, { id: 22, name: "Lateral Incisor", arch: "Upper" },
  { id: 23, name: "Canine", arch: "Upper" }, { id: 24, name: "First Premolar", arch: "Upper" },
  { id: 25, name: "Second Premolar", arch: "Upper" }, { id: 26, name: "First Molar", arch: "Upper" },
  { id: 27, name: "Second Molar", arch: "Upper" }, { id: 28, name: "Third Molar", arch: "Upper" },

  { id: 48, name: "Third Molar", arch: "Lower" }, { id: 47, name: "Second Molar", arch: "Lower" },
  { id: 46, name: "First Molar", arch: "Lower" }, { id: 45, name: "Second Premolar", arch: "Lower" },
  { id: 44, name: "First Premolar", arch: "Lower" }, { id: 43, name: "Canine", arch: "Lower" },
  { id: 42, name: "Lateral Incisor", arch: "Lower" }, { id: 41, name: "Central Incisor", arch: "Lower" },

  { id: 31, name: "Central Incisor", arch: "Lower" }, { id: 32, name: "Lateral Incisor", arch: "Lower" },
  { id: 33, name: "Canine", arch: "Lower" }, { id: 34, name: "First Premolar", arch: "Lower" },
  { id: 35, name: "Second Premolar", arch: "Lower" }, { id: 36, name: "First Molar", arch: "Lower" },
  { id: 37, name: "Second Molar", arch: "Lower" }, { id: 38, name: "Third Molar", arch: "Lower" }
];

const ModernTreatmentChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Adult' | 'Pedo' | 'Mixed'>('Adult');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  
  const [toothData, setToothData] = useState<Record<number, ToothMetadata>>(
    adultTeeth.reduce((acc, tooth) => ({ ...acc, [tooth.id]: { ...tooth, status: 'healthy' } }), {})
  );

  const handleToothClick = (number: number) => {
    if (multiSelect) {
      setSelectedTeeth(prev => 
        prev.includes(number) ? prev.filter(t => t !== number) : [...prev, number]
      );
    } else {
      setSelectedTeeth(prev => (prev[0] === number ? [] : [number]));
    }
  };

  const renderGrid = (arch: 'Upper' | 'Lower') => {
    const archTeeth = adultTeeth.filter(t => t.arch === arch);
    const mid = archTeeth.length / 2;
    const rightQuad = archTeeth.slice(0, mid);
    const leftQuad = archTeeth.slice(mid);

    return (
      <div className="flex justify-center items-end gap-1 mb-8">
        {rightQuad.map(tooth => (
          <ModernTooth 
            key={tooth.id} 
            number={tooth.id} 
            isUpper={arch === 'Upper'}
            isSelected={selectedTeeth.includes(tooth.id)}
            status={toothData[tooth.id]?.status || 'healthy'}
            onClick={() => handleToothClick(tooth.id)}
          />
        ))}
        <div className="w-12"></div>
        {leftQuad.map(tooth => (
          <ModernTooth 
            key={tooth.id} 
            number={tooth.id} 
            isUpper={arch === 'Upper'}
            isSelected={selectedTeeth.includes(tooth.id)}
            status={toothData[tooth.id]?.status || 'healthy'}
            onClick={() => handleToothClick(tooth.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#F7F9FC] rounded-[18px] shadow-sm font-sans flex flex-col relative overflow-hidden border border-gray-100 min-h-[850px] p-[24px]">
      
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100 rounded-t-[18px]">
        <div>
          <h2 className="text-[24px] font-[600] text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>Dental Chart & Treatment Plans</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Multi Select</span>
          <button 
            onClick={() => { setMultiSelect(!multiSelect); setSelectedTeeth([]); }}
            className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${multiSelect ? 'bg-[#14B8A6]' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${multiSelect ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mt-6">
        <div className="bg-white p-1 rounded-full shadow-sm flex gap-2">
          {['Adult', 'Pedo', 'Mixed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-[#14B8A6] text-white' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-12">
        {renderGrid('Upper')}

        <div className="h-12 w-full"></div> {/* Generous whitespace between arches */}

        {renderGrid('Lower')}
      </div>

      {/* Footer / Legend / Sticky Actions */}
      <div className="mt-auto bg-white border-t border-gray-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-b-[18px] flex justify-between items-center sticky bottom-0 z-10">
        
        <div className="flex gap-6">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#9333EA]"></div><span className="text-sm font-medium text-gray-600">Treatment Taken Before</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#6B7280]"></div><span className="text-sm font-medium text-gray-600">Teeth Removed</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EAB308]"></div><span className="text-sm font-medium text-gray-600">Recommended To Take Treatment</span></div>
        </div>

        <div className="flex gap-3">
          <button className="px-6 py-2.5 rounded-[8px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Previous</button>
          <button className="px-6 py-2.5 rounded-[8px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Save</button>
          <button className="px-8 py-2.5 rounded-[8px] font-semibold text-white bg-[#14B8A6] hover:bg-[#0F9F94] transition-colors shadow-md">Treatment Plan</button>
        </div>
      </div>

    </div>
  );
};

export default ModernTreatmentChart;
