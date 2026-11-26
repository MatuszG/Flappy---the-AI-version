import type { SavedBrain } from './types';

const STORAGE_KEY = 'flappy_neurolab_saved_brains_v1';

export const PRETRAINED_ACE_BRAIN: SavedBrain = {
  id: 'preset-ace-gen2',
  name: 'Verified Ace (155+ Pipes)',
  bestScore: 155,
  generation: 2,
  createdAt: '2026-11-18T11:48:00.000Z',
  isPreset: true,
  network: {
    inputNodes: 5,
    hiddenNodes: 6,
    outputNodes: 1,
    weightsIH: [
      -0.09665462468621241, -0.6281508062145137, -0.0951318031848181,
      0.4639732768685969, -0.5237676387307816, 0.22479209238201353,
      0.6836885904497751, -0.6027472270429992, 0.035673615425429475,
      -0.1570894216023367, -0.0866744450936396, 0.4751109479712211,
      0.3081746652986623, 0.5678978735903695, -0.16427182601534893,
      0.036128997074623255, -0.18866434635711662, -0.002110406548288263,
      0.4119075141505876, 0.1172918402000578, -0.12596675635303892,
      -0.6505041173493488, -0.1486664112781024, 0.6797038735745683,
      -0.08967070964748634, -0.2648263728370293, -0.4770925217980249,
      0.2276542378477734, -0.31573177071481917, -0.34257486775039203,
    ],
    biasH: [
      -0.22181950654235671, -0.21489566410473065, -0.03828100272853573,
      -0.3565377551045475, 0.04428700388450209, 0.15318713891104757,
    ],
    weightsHO: [
      0.4469929995526463, 0.4900670731338294, 0.21961633139864226,
      -0.035966706512897656, 0.02630619430590792, 0.20350174107906147,
    ],
    biasO: [0.06070004977666861],
  },
};

export function loadSavedBrains(): SavedBrain[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [PRETRAINED_ACE_BRAIN];
    const parsed = JSON.parse(raw) as SavedBrain[];
    if (!Array.isArray(parsed)) return [PRETRAINED_ACE_BRAIN];
    const valid = parsed.filter(
      (b) =>
        b &&
        typeof b === 'object' &&
        typeof b.id === 'string' &&
        typeof b.name === 'string' &&
        b.network &&
        Array.isArray(b.network.weightsIH) &&
        Array.isArray(b.network.weightsHO)
    );
    const hasPreset = valid.some((b) => b.id === PRETRAINED_ACE_BRAIN.id);
    return hasPreset ? valid : [PRETRAINED_ACE_BRAIN, ...valid];
  } catch {
    return [PRETRAINED_ACE_BRAIN];
  }
}

export function persistSavedBrains(brains: SavedBrain[]): void {
  try {
    const userBrains = brains.filter((b) => !b.isPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userBrains));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
