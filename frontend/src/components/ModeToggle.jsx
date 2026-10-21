import React from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { Landmark, Cpu } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useViewMode();

  return (
    <div
      className="inline-flex items-center p-1 bg-[#edeef0] rounded-lg border border-[#E5E7EB] text-xs font-semibold select-none shadow-2xs"
      role="group"
      aria-label="View Mode Toggle"
    >
      <button
        type="button"
        onClick={() => setMode('simple')}
        title="Plain-Language Mode: Formatted for Government Officers and Magistrates (No engineering jargon)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          mode === 'simple'
            ? 'bg-white text-[#00355f] font-bold shadow-xs border border-[#c2c7d1]/50'
            : 'text-[#5f6368] hover:text-[#191c1e]'
        }`}
      >
        <Landmark size={13} className={mode === 'simple' ? 'text-[#00355f]' : 'text-[#727780]'} />
        <span>Plain (Officer)</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('technical')}
        title="Technical Mode: Formatted for Engineers and Data Scientists (Full ML and sensor details)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          mode === 'technical'
            ? 'bg-[#00355f] text-white font-bold shadow-xs'
            : 'text-[#5f6368] hover:text-[#191c1e]'
        }`}
      >
        <Cpu size={13} className={mode === 'technical' ? 'text-white' : 'text-[#727780]'} />
        <span>Technical (ML)</span>
      </button>
    </div>
  );
}
