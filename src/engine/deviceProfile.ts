export type EcoModePreference = 'AUTO' | 'ECO' | 'FULL';

const ECO_PREF_STORAGE_KEY = 'flappy-neuro-eco-mode-v1';

/**
 * Detects whether the current device is likely a smartphone / compact touch device
 * that benefits from gentle compositor & CPU/thermal headroom pacing.
 */
export function isSmartphoneDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth || 1024;
  const coarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const mobileUa =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
  return (coarsePointer && width <= 920) || (mobileUa && width <= 920) || width < 640;
}

export function loadEcoPreference(): EcoModePreference {
  if (typeof window === 'undefined') return 'AUTO';
  try {
    const raw = window.localStorage.getItem(ECO_PREF_STORAGE_KEY);
    if (raw === 'ECO' || raw === 'FULL' || raw === 'AUTO') {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return 'AUTO';
}

export function persistEcoPreference(pref: EcoModePreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ECO_PREF_STORAGE_KEY, pref);
  } catch {
    // ignore storage quota errors
  }
}

export function resolveEcoActive(
  pref: EcoModePreference,
  smartphoneDetected: boolean
): boolean {
  if (pref === 'ECO') return true;
  if (pref === 'FULL') return false;
  return smartphoneDetected;
}
