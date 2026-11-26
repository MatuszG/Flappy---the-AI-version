/**
 * Detects whether the current device is a smartphone / compact touch viewport
 * for initial Research Lab defaults.
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
