import React from 'react';
import { ToothState } from './ModernTreatmentChart';

interface ModernToothProps {
  number: number;
  isUpper: boolean;
  isSelected: boolean;
  status: ToothState;
  onClick: () => void;
}

const ModernTooth: React.FC<ModernToothProps> = ({ number, isUpper, isSelected, status, onClick }) => {
  
  const generateAnatomy = () => {
    const lastDigit = number % 10;
    const isPedo = number >= 50;
    
    let w = 28;
    if (lastDigit === 1 || lastDigit === 2) w = 24;
    if (lastDigit === 3) w = 26;
    if (lastDigit === 4 || lastDigit === 5) w = 28;
    if (lastDigit >= 6) w = 36;
    if (isPedo) w -= 4;

    const h = 75;
    const cx = w / 2;
    let crown = "";
    let root = "";
    let highlight = "";

    // Math for distinct tooth types
    if (lastDigit === 1 || lastDigit === 2) {
      crown = `M 4,${h/2} C 4,${h/2 - 15} ${cx - 6},${h/2 - 25} ${cx},${h/2 - 25} C ${cx + 6},${h/2 - 25} ${w-4},${h/2 - 15} ${w-4},${h/2} C ${w-4},${h/2 + 10} ${cx},${h/2 + 12} ${cx},${h/2 + 12} C ${cx},${h/2 + 12} 4,${h/2 + 10} 4,${h/2} Z`;
      root = `M 6,${h/2} C 8,${h/2 + 20} ${cx - 2},${h-2} ${cx},${h} C ${cx + 2},${h-2} ${w-8},${h/2 + 20} ${w-6},${h/2}`;
      highlight = `M 8,${h/2 - 5} C 8,${h/2 - 15} ${cx - 3},${h/2 - 20} ${cx},${h/2 - 20} C ${cx + 3},${h/2 - 20} ${w-8},${h/2 - 15} ${w-8},${h/2 - 5}`;
    } else if (lastDigit === 3) {
      crown = `M 3,${h/2} C 3,${h/2 - 15} ${cx - 5},${h/2 - 22} ${cx},${h/2 - 28} C ${cx + 5},${h/2 - 22} ${w-3},${h/2 - 15} ${w-3},${h/2} C ${w-3},${h/2 + 10} ${cx},${h/2 + 15} ${cx},${h/2 + 15} C ${cx},${h/2 + 15} 3,${h/2 + 10} 3,${h/2} Z`;
      root = `M 5,${h/2} C 7,${h/2 + 25} ${cx - 3},${h-4} ${cx},${h} C ${cx + 3},${h-4} ${w-7},${h/2 + 25} ${w-5},${h/2}`;
      highlight = `M 7,${h/2 - 5} C 7,${h/2 - 15} ${cx - 2},${h/2 - 20} ${cx},${h/2 - 23} C ${cx + 2},${h/2 - 20} ${w-7},${h/2 - 15} ${w-7},${h/2 - 5}`;
    } else if (lastDigit === 4 || lastDigit === 5) {
      crown = `M 2,${h/2} C 2,${h/2 - 10} ${cx - 8},${h/2 - 20} ${cx},${h/2 - 20} C ${cx + 8},${h/2 - 20} ${w-2},${h/2 - 10} ${w-2},${h/2} C ${w-2},${h/2 + 8} ${cx},${h/2 + 12} ${cx},${h/2 + 12} C ${cx},${h/2 + 12} 2,${h/2 + 8} 2,${h/2} Z`;
      if (isUpper && lastDigit === 4) {
        root = `M 5,${h/2} C 5,${h/2 + 15} ${cx - 6},${h-10} ${cx - 4},${h-2} C ${cx - 2},${h-10} ${cx},${h/2 + 10} ${cx},${h/2} M ${cx},${h/2} C ${cx},${h/2 + 10} ${cx + 2},${h-10} ${cx + 4},${h-2} C ${cx + 6},${h-10} ${w-5},${h/2 + 15} ${w-5},${h/2}`;
      } else {
        root = `M 5,${h/2} C 7,${h/2 + 20} ${cx - 4},${h-5} ${cx},${h-2} C ${cx + 4},${h-5} ${w-7},${h/2 + 20} ${w-5},${h/2}`;
      }
      highlight = `M 6,${h/2 - 5} C 6,${h/2 - 12} ${cx - 4},${h/2 - 16} ${cx},${h/2 - 16} C ${cx + 4},${h/2 - 16} ${w-6},${h/2 - 12} ${w-6},${h/2 - 5}`;
    } else {
      crown = `M 2,${h/2} C 2,${h/2 - 15} ${cx - 10},${h/2 - 22} ${cx},${h/2 - 22} C ${cx + 10},${h/2 - 22} ${w-2},${h/2 - 15} ${w-2},${h/2} C ${w-2},${h/2 + 10} ${cx},${h/2 + 12} ${cx},${h/2 + 12} C ${cx},${h/2 + 12} 2,${h/2 + 10} 2,${h/2} Z`;
      if (isUpper) {
        root = `M 4,${h/2} C 4,${h/2 + 15} 8,${h-10} 10,${h-2} C 12,${h-15} 14,${h/2 + 5} 14,${h/2} M 14,${h/2} C 14,${h/2 + 20} ${cx},${h-5} ${cx},${h} C ${cx},${h-5} ${w-14},${h/2 + 20} ${w-14},${h/2} M ${w-14},${h/2} C ${w-14},${h/2 + 5} ${w-12},${h-15} ${w-10},${h-2} C ${w-8},${h-10} ${w-4},${h/2 + 15} ${w-4},${h/2}`;
      } else {
        root = `M 6,${h/2} C 4,${h/2 + 20} 10,${h-5} 12,${h-2} C 16,${h-10} 15,${h/2 + 10} 15,${h/2} M ${w-15},${h/2} C ${w-15},${h/2 + 10} ${w-16},${h-10} ${w-12},${h-2} C ${w-10},${h-5} ${w-4},${h/2 + 20} ${w-6},${h/2}`;
      }
      highlight = `M 6,${h/2 - 5} C 6,${h/2 - 15} ${cx - 6},${h/2 - 18} ${cx},${h/2 - 18} C ${cx + 6},${h/2 - 18} ${w-6},${h/2 - 15} ${w-6},${h/2 - 5}`;
    }

    return { path: `${crown} ${root}`, highlight, width: w, height: h };
  };

  const { path, highlight, width, height } = generateAnatomy();

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return '#9333EA'; // Purple
      case 'needs_treatment': return '#EAB308'; // Yellow
      case 'extraction': return '#6B7280'; // Gray
      default: return 'transparent';
    }
  };

  return (
    <div 
      className="flex flex-col items-center gap-1.5 cursor-pointer group w-12"
      onClick={onClick}
    >
      {/* Upper Indicator */}
      {isUpper && (
        <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200 ${isSelected ? 'bg-[#14B8A6] text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>
          {number}
        </div>
      )}

      {/* Photorealistic 3D SVG Container */}
      <div className="relative">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          className={`transition-transform duration-300 transform group-hover:scale-[1.08] ${!isUpper ? 'rotate-180' : ''} ${isSelected ? 'drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'drop-shadow-[2px_3px_5px_rgba(0,0,0,0.06)]'}`}
        >
          <defs>
            {/* 3D Volume Gradient */}
            <linearGradient id={`volumeGrad-${number}`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FDFBF7" />
              <stop offset="100%" stopColor="#EAE4D9" />
            </linearGradient>

            {/* Inner Shadow Simulation */}
            <filter id={`innerShadow-${number}`}>
              <feOffset dx="0" dy="0"/>
              <feGaussianBlur stdDeviation="1.5" result="offset-blur"/>
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
              <feFlood floodColor="#BDB7AB" floodOpacity="0.4" result="color"/>
              <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
              <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
            </filter>
          </defs>
          
          {/* Main 3D Tooth Body */}
          <path 
            d={path} 
            fill={`url(#volumeGrad-${number})`} 
            stroke="#D1CFC8" 
            strokeWidth="0.5"
            filter={`url(#innerShadow-${number})`}
            className="transition-colors group-hover:stroke-[#14B8A6]" 
          />

          {/* Specular Highlight for Photorealism */}
          <path 
            d={highlight} 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinecap="round"
            className="opacity-70"
            filter="blur(1px)"
          />
        </svg>

        {/* Status Dot (Precisely aligned) */}
        {status !== 'healthy' && (
          <div 
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full shadow-sm z-10 border border-white"
            style={{ backgroundColor: getStatusColor() }}
          />
        )}
      </div>

      {/* Lower Indicator */}
      {!isUpper && (
        <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200 ${isSelected ? 'bg-[#14B8A6] text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>
          {number}
        </div>
      )}
    </div>
  );
};

export default ModernTooth;
