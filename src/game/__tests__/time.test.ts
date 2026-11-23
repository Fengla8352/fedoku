import { expect, it } from 'vitest';
import { formatTime } from '../time';

it('formatTime', () => {
  expect(formatTime(0)).toBe('0:00');
  expect(formatTime(4_999)).toBe('0:04');
  expect(formatTime(247_000)).toBe('4:07');
  expect(formatTime(3_725_000)).toBe('1:02:05');
});
