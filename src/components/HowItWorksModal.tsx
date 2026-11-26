import { Cpu, X } from 'lucide-react';
import { useState } from 'react';
import researchEmblemImg from '../assets/images/research_emblem_1795032939270.jpg';
import { useLanguage } from '../i18n/LanguageContext';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#111827] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-lg border border-slate-700 bg-[#0B1120] shrink-0 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={researchEmblemImg}
                  alt={t('modals.geometricNeuralSongbirdEmblem')}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Cpu className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              )}
            </div>
            <h2
              id="how-modal-title"
              className="font-display text-base sm:text-lg font-semibold text-white truncate"
            >
              {t('modals.howNeurolabWorks')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modals.closeModal')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 text-sm leading-relaxed text-slate-300">
          <div>
            <h3 className="font-display text-sm font-semibold text-cyan-300">
              {t('modals.k01PerceptionSensorsOr16')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {t('modals.eachBirdReadsAltitudeVelocity')}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-3.5">
            <h3 className="font-display text-sm font-semibold text-emerald-300">
              {t('modals.k0212NeuralArchitectures')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {t('modals.compareMlpDrosophilaConnectomeFly')}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-3.5">
            <h3 className="font-display text-sm font-semibold text-amber-300">
              {t('modals.k03ArcadePlayArenaGpu')}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {t('modals.flySoloOrRaceAn')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-800 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-lg bg-slate-800 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-100 hover:bg-slate-700 cursor-pointer"
          >
            {t('modals.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
