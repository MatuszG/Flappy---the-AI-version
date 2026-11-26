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
  const { bi } = useLanguage();
  const [brainName, setBrainName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = brainName.trim() || `Champion Gen ${currentGeneration}`;
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
          throw new Error('File does not contain valid neural network weights.');
        }
        const importedName =
          typeof parsed.name === 'string'
            ? parsed.name
            : file.name.replace(/\.json$/i, '');
        onImportBrain(importedName, network);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : 'Unable to parse JSON brain file.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brain-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2
              id="brain-modal-title"
              className="font-display text-lg font-semibold text-white"
            >
              {bi('Zapisane Sieci Neuronowe', 'Saved Neural Brains')}
            </h2>
            <p className="text-xs text-slate-400">
              {bi(
                'Zapisuj wyewoluowanych mistrzów, importuj wagi JSON lub zmierz się z gotowym asem.',
                'Save evolved champions, import JSON weights, or race a pre-trained ace.'
              )}
            </p>
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

        <div className="space-y-5 p-6">
          {/* Save current champion */}
          <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={brainName}
              onChange={(e) => setBrainName(e.target.value)}
              placeholder={bi(
                `Nazwa mistrza (Rekord: ${currentBestScore} rur)`,
                `Name champion (Best: ${currentBestScore} pipes)`
              )}
              className="min-w-52 flex-1 rounded-lg border border-slate-700 bg-[#0B1120] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSaveCurrent}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {bi('Zapisz Lidera', 'Save Current Best')}
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
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:bg-slate-700"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {bi('Importuj JSON', 'Import JSON')}
            </button>
          </form>

          {importError && (
            <p className="text-xs text-red-400" role="alert">
              {importError}
            </p>
          )}

          {/* Brain Library List */}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {brains.map((brain) => (
              <div
                key={brain.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-800 bg-[#0B1120]/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {brain.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-400">
                    {bi('Rekord', 'Record')} {brain.bestScore.toLocaleString()} {bi('rur', 'pipes')} · Gen {brain.generation} ·{' '}
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadIntoTraining(brain);
                      onClose();
                    }}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer transition-colors hover:border-cyan-500/50 hover:text-cyan-200"
                  >
                    {bi('Wczytaj do Treningu', 'Seed Lab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRaceAgainstBrain(brain);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 whitespace-nowrap cursor-pointer transition-colors hover:bg-amber-400"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    {bi('Wyścig vs AI', 'Race AI')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(brain)}
                    aria-label={`Export ${brain.name} as JSON`}
                    title="Export JSON"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {!brain.isPreset && (
                    <button
                      type="button"
                      onClick={() => onDeleteBrain(brain.id)}
                      aria-label={`Delete ${brain.name}`}
                      title="Delete"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
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
