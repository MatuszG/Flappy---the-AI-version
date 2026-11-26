import { Cpu, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  const { bi } = useLanguage();
  const [imgError, setImgError] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-700 bg-[#0B1120] shrink-0 flex items-center justify-center">
              {!imgError ? (
                <img
                  src="/src/assets/images/research_emblem_1795032939270.jpg"
                  alt="Geometric neural songbird emblem"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Cpu className="h-5 w-5 text-cyan-400" aria-hidden="true" />
              )}
            </div>
            <h2
              id="how-modal-title"
              className="font-display text-lg font-semibold text-white"
            >
              {bi('Jak Neuroewolucja Uczy Się Latać', 'How Neuroevolution Learns to Fly')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6 text-sm leading-relaxed text-slate-300">
          <div>
            <h3 className="font-display text-sm font-semibold text-cyan-300">
              {bi(
                '01. Percepcja Środowiska (Sensory Geometryczne lub 16-Ray Ommatidia)',
                '01. Sense the Environment (Geometric or 16-Ray Ommatidia)'
              )}
            </h3>
            <p className="mt-1 text-slate-400">
              {bi(
                'W każdej klatce każdy ptak odczytuje znormalizowane sygnały przestrzenne: własną wysokość, prędkość pionową, dystans i szczeliny dwóch nadchodzących rur (lub 16-promieniowy wachlarz siatkówki oka złożonego z detektorami ruchu T4/T5).',
                'Every frame, each bird reads normalized spatial signals: its own altitude, vertical velocity, horizontal distance, and gap offsets to upcoming pipes (or a 16-ray compound-eye retinal fan with T4/T5 optical flow).'
              )}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="font-display text-sm font-semibold text-emerald-300">
              {bi(
                '02. Przepływ Sygnału w 12 Architekturach Neuronowych',
                '02. Neural Forward Pass Across 12 Architectures'
              )}
            </h3>
            <p className="mt-1 text-slate-400">
              {bi(
                'Sygnały przechodzą przez wybraną architekturę (MLP, Konektom Drosophila, Fly-Cortex z pamięcią asocjacyjną FlyHash APL, Hybrid MoE, LTC ODE, MinGRU lub Ponder ACT). Gdy wyjście przekroczy próg decyzyjny, ptak wykonuje skok.',
                'Signals pass through the chosen neural architecture (MLP, Drosophila Connectome, Decoupled Fly-Cortex with FlyHash APL associative memory, Hybrid MoE, LTC ODE, MinGRU, or Ponder ACT). When the output exceeds threshold, the bird flaps.'
              )}
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="font-display text-sm font-semibold text-amber-300">
              {bi(
                '03. Arena 12 Gatunków, Ewolucja WebGPU i Audyt F64',
                '03. 12-Species Arena, WebGPU Evolution & F64 Verification'
              )}
            </h3>
            <p className="mt-1 text-slate-400">
              {bi(
                'Ścigaj do 12 architektur jednocześnie na tym samym torze w Arenie Na Żywo lub uruchom Badania (Sweep) z akceleracją WebGPU WGSL i deterministycznym audytem weryfikacyjnym IEEE-754 F64.',
                'Race up to 12 architectures simultaneously on the same course in Live Arena, or run Research Sweeps with WebGPU WGSL compute acceleration and deterministic IEEE-754 F64 verification audits.'
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 cursor-pointer"
          >
            {bi('Rozumiem', 'Got It')}
          </button>
        </div>
      </div>
    </div>
  );
}
