import { HelpCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface InfoTooltipProps {
  text: string;
  align?: 'left' | 'center' | 'right';
  label?: string;
}

/**
 * Accessible hover/focus/tap tooltip that safely docks at bottom on mobile (<sm)
 * so it never overflows narrow smartphone viewports.
 */
export function InfoTooltip({
  text,
  align = 'center',
  label = 'More information',
}: InfoTooltipProps) {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const open = hoverOpen || pinnedOpen;
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setHoverOpen(false);
        setPinnedOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHoverOpen(false);
        setPinnedOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const alignClass =
    align === 'left'
      ? 'sm:left-0'
      : align === 'right'
        ? 'sm:right-0'
        : 'sm:left-1/2 sm:-translate-x-1/2';

  return (
    <span
      ref={rootRef}
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setHoverOpen(true)}
        onBlur={() => setHoverOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPinnedOpen((prev) => {
            const next = !prev;
            if (!next) setHoverOpen(false);
            return next;
          });
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-400 cursor-help"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          onClick={(e) => {
            e.stopPropagation();
            setHoverOpen(false);
            setPinnedOpen(false);
          }}
          className={`fixed inset-x-3 bottom-4 z-50 rounded-xl border border-slate-700 bg-slate-950/95 px-3.5 py-2.5 text-left font-sans text-xs font-normal leading-relaxed text-slate-200 shadow-2xl backdrop-blur-sm sm:absolute sm:pointer-events-none sm:inset-auto sm:bottom-full sm:mb-2 sm:w-64 sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-[11px] ${alignClass}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
