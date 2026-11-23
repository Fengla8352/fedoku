import type { Digit, Mask } from './types';

/** Maska sa svim znamenkama 1–9. */
export const ALL_DIGITS: Mask = 0b11_1111_1110;

export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const bit = (d: number): Mask => 1 << d;

export const has = (m: Mask, d: number): boolean => (m & (1 << d)) !== 0;

export function popcount(m: Mask): number {
  let n = 0;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
}

/** Znamenke iz maske, uzlazno. */
export function digitsOf(m: Mask): Digit[] {
  const out: Digit[] = [];
  for (let d = 1; d <= 9; d++) if (m & (1 << d)) out.push(d as Digit);
  return out;
}

export function maskOf(digits: readonly number[]): Mask {
  let m = 0;
  for (const d of digits) m |= 1 << d;
  return m;
}

/** Jedina znamenka u maski s točno jednim bitom. */
export function singleDigit(m: Mask): Digit {
  return (31 - Math.clz32(m)) as Digit;
}
