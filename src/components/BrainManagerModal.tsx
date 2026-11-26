import { Download, Play, Save, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  formatTopologyLabel,
  normalizeHiddenLayers,
} from '../engine/neuralNetwork';
import type { SavedBrain, SerializedNeuralNetwork } from '../engine/types';
import { useLanguage } from '../i18n/LanguageContext';

interface BrainManagerModalProps {
  open: boolean;
  brains: SavedBrain[];
  canSaveCurrent: boolean;
  currentBestScore: number;
  currentGeneration: number;
  onClose: () => void;
  onSaveCurrent: (name: string) => void;
  onLoadIntoTraining: (brain: SavedBrain) => void;
  onRaceAgainstBrain: (brain: SavedBrain) => void;
  onDeleteBrain: (id: string) => void;
  onImportBrain: (name: string, network: SerializedNeuralNetwork) => void;
}

export function BrainManagerModal({
  open,
  brains,
  canSaveCurrent,
  currentBestScore,
  currentGeneration,
  onClose,
  onSaveCurrent,
  onLoadIntoTraining,
  onRaceAgainstBrain,
  onDeleteBrain,
  onImportBrain,
}: BrainManagerModalProps) {
  const { t } = useLanguage();
  const [brainName, setBrainName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed =
      brainName.trim() ||
      t('modals.championGen', { currentGeneration });
    onSaveCurrent(trimmed);
    setBrainName('');
  };

  const handleExport = (brain: SavedBrain) => {
    const blob = new Blob([JSON.stringify(brain, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brain.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const network = parsed.network ?? parsed;
        if (
          typeof network.inputNodes !== 'number' ||
          !Array.isArray(network.weightsIH) ||
          !Array.isArray(network.weightsHO)
        ) {
          throw new Error(
            t('modals.fileDoesNotContainValid')
          );
        }
        const importedName =
          typeof parsed.name === 'string'
            ? parsed.name
            : file.name.replace(/\.json$/i, '');
        onImportBrain(importedName, network);
      } catch (err) {
        setImportError(
          err instanceof Error
            ? err.message
            : t('modals.unableToParseJsonBrain')
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brain-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#111827] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2
              id="brain-modal-title"
              className="font-display text-base sm:text-lg font-semibold text-white truncate"
            >
              {t('modals.savedNeuralBrains')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('modals.saveChampionsImportJsonOr')}
            </p>
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

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Save current champion */}
          <form onSubmit={handleSave} className="grid grid-cols-2 sm:flex sm:items-center gap-2.5">
            <input
              type="text"
              value={brainName}
              onChange={(e) => setBrainName(e.target.value)}
              placeholder={t('modals.championNamePipes', { currentBestScore })}
              className="col-span-2 sm:flex-1 min-w-0 rounded-lg border border-slate-700 bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSaveCurrent}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {t('modals.saveBest')}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-slate-700"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {t('modals.importJson')}
            </button>
          </form>

          {importError && (
            <p className="text-xs text-red-400" role="alert">
              {importError}
            </p>
          )}

          {/* Brain Library List */}
          <div className="space-y-2.5">
            {brains.map((brain) => (
              <div
                key={brain.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800 bg-[#0B1120]/70 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {brain.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-400">
                    {brain.bestScore.toLocaleString()} {t('modals.pipes')} · Gen {brain.generation} ·{' '}
                    {formatTopologyLabel(
                      normalizeHiddenLayers(
                        brain.network.hiddenLayers !== undefined
                          ? brain.network.hiddenLayers
                          : brain.network.hiddenNodes
                      ),
                      brain.network.inputNodes || 5
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadIntoTraining(brain);
                      onClose();
                    }}
                    className="min-h-[36px] rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                  >
                    {t('modals.seedLab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRaceAgainstBrain(brain);
                      onClose();
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    {t('modals.race')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(brain)}
                    aria-label={t('modals.exportAsJson', { name: brain.name })}
                    title={t('modals.exportJson')}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {!brain.isPreset && (
                    <button
                      type="button"
                      onClick={() => onDeleteBrain(brain.id)}
                      aria-label={t('modals.delete', { name: brain.name })}
                      title={t('modals.delete2')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
