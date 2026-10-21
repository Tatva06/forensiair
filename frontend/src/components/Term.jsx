import React, { useState } from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { getTerm } from '../i18n/glossary';
import { Info } from 'lucide-react';

export function Term({ id, children, showTooltip = true, className = '' }) {
  const { mode } = useViewMode();
  const [isHovered, setIsHovered] = useState(false);
  const term = getTerm(id);

  if (!term) {
    return <span className={className}>{children || id}</span>;
  }

  const text = mode === 'technical' ? term.technical : term.simple;
  const helpText = term.simpleHelp;

  if (mode === 'simple' && showTooltip && helpText) {
    return (
      <span
        className={`relative inline-flex items-center gap-1 group cursor-help ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        tabIndex={0}
      >
        <span className="border-b border-dotted border-[#00355f] text-inherit">
          {text}
        </span>
        <Info size={11} className="text-[#00355f] opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />

        {isHovered && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-[#1e293b] text-white text-[11px] leading-relaxed rounded-lg shadow-xl z-50 pointer-events-none text-left">
            <span className="font-bold text-sky-300 block mb-0.5">{term.name || text}</span>
            <span>{helpText}</span>
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1e293b]" />
          </span>
        )}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
