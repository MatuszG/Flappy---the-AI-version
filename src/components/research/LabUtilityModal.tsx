import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface LabUtilityModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  maxWidthClass?: string;
  onClose: () => void;
  children: ReactNode;
}

export function LabUtilityModal({
  open,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-4xl',
  onClose,
  children,
}: LabUtilityModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[90dvh] flex flex-col rounded-xl border border-slate-700/80 bg-[#0F172A] shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-[#0B1120] px-4 py-3 sm:px-5 sm:py-3.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <span className="shrink-0">{icon}</span>}
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-semibold text-white truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[11px] text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 cursor-pointer transition-colors hover:border-slate-600 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
