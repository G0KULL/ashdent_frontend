import React from 'react';

const DentalChart: React.FC = () => {
  return (
    <div 
      className="flex items-center justify-center bg-[#F7F9FC] border-2 border-dashed border-gray-300 rounded-lg mx-auto"
      style={{ width: '1200px', height: '500px' }}
    >
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Dental SVG Chart will be rendered here.</h3>
        <p className="text-gray-400 text-sm">Container ready for custom SVG injection</p>
      </div>
      
      {/* Empty container for future custom SVG chart */}
      <div id="dental-chart-container" className="hidden"></div>
    </div>
  );
};

export default DentalChart;
