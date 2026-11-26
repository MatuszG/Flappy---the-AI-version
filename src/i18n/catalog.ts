import type {
  DifficultyPreset,
  LearningAlgorithm,
  NetworkArchitecture,
  SensorFeatureId,
  WeightPrecision,
} from '../engine/types';
import type { MorphogenesisProfileId } from '../engine/morphogenesis';
import type { PresetId } from '../engine/experimentPresets';
import type { PowerModeId } from '../engine/powerProfile';
import { DICTIONARIES, type AppLanguage } from './dictionaries';

export function getArchText(lang: AppLanguage, id: NetworkArchitecture) {
  return DICTIONARIES[lang].catalog.architectures[id];
}

export function getOptimizerText(lang: AppLanguage, id: LearningAlgorithm) {
  return DICTIONARIES[lang].catalog.optimizers[id];
}

export function getPrecisionText(lang: AppLanguage, id: WeightPrecision) {
  return DICTIONARIES[lang].catalog.precisions[id];
}

export function getSensorText(lang: AppLanguage, id: SensorFeatureId) {
  return DICTIONARIES[lang].catalog.sensors[id];
}

export function getDifficultyText(lang: AppLanguage, id: DifficultyPreset) {
  return DICTIONARIES[lang].catalog.difficulties[id];
}

export function getPowerProfileText(lang: AppLanguage, id: PowerModeId) {
  return DICTIONARIES[lang].catalog.powerProfiles[id];
}

export function getMorphogenesisText(
  lang: AppLanguage,
  id: MorphogenesisProfileId
) {
  return DICTIONARIES[lang].catalog.morphogenesis[id];
}

export function getPresetText(lang: AppLanguage, id: PresetId) {
  return DICTIONARIES[lang].catalog.presets[id];
}
