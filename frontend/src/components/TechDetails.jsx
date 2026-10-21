import React, { useState } from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { ChevronDown, ChevronUp, Cpu, Info } from 'lucide-react';

export function TechDetails({
  title = 'See technical details',
  children,
  defaultOpen = false,
  badgeText = 'Engineering / ML Data',
  className = ''
}) {
  const { isTechnical } = useViewMode();
  // In technical mode, keep it open by default unless overridden
  const [isOpen, setIsOpen] = useState(defaultOpen || isTechnical);

  return (
    <div className={`border border-[#E5E7EB] rounded-lg overflow-hidden bg-white mt-3 transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#f8f9fb] hover:bg-[#f2f4f6] text-xs font-semibold text-[#00355f] transition-colors cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-[#00355f]" />
          <span>{title}</span>
          {badgeText && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00355f]/10 text-[#00355f] border border-[#00355f]/20">
              {badgeText}
            </span>
          )}
        </div>
        <div className="text-[#727780]">
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-[#E5E7EB] bg-white text-xs text-[#42474f] space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
