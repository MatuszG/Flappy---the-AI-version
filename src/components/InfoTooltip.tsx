import { HelpCircle } from 'lucide-react';
import { useId, useState } from 'react';

interface InfoTooltipProps {
  text: string;
  align?: 'left' | 'center' | 'right';
  label?: string;
}

/**
 * Lightweight, zero-dependency, accessible hover/focus tooltip for complex lab settings.
 */
export function InfoTooltip({
  text,
  align = 'center',
  label = 'More information',
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-400 cursor-help"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute bottom-full z-50 mb-2 w-60 rounded-lg border border-slate-700 bg-slate-950/95 px-2.5 py-2 text-left font-sans text-[11px] font-normal leading-relaxed text-slate-200 shadow-xl backdrop-blur-sm ${alignClass}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
