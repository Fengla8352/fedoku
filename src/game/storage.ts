import type { GameState } from './types';

const GAME_KEY = 'fedoku.game.v1';
const SETTINGS_KEY = 'fedoku.settings.v1';

export type Theme = 'system' | 'light' | 'dark';
export interface Settings {
  theme: Theme;
  highlightSame: boolean;
}
export const defaultSettings: Settings = { theme: 'system', highlightSame: true };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* privatni način ili pun disk — igra radi i bez spremanja */
  }
}

const isArr81 = (a: unknown) => Array.isArray(a) && a.length === 81;

/** Učitava spremljenu igru; vraća null ako je nema ili je oštećena. */
export function loadGame(): GameState | null {
  const g = read<GameState>(GAME_KEY);
  if (!g || !isArr81(g.values) || !isArr81(g.givens) || !isArr81(g.notes) || !isArr81(g.autoElim)) return null;
  return { ...g, history: Array.isArray(g.history) ? g.history : [], message: null, hint: null, rating: g.rating ?? null, source: g.source ?? 'manual' };
}

export function saveGame(g: GameState): void {
  // Povijest se skraćuje da spremanje ostane malo.
  write(GAME_KEY, { ...g, history: g.history.slice(-50), message: null, hint: null });
}

export const loadSettings = (): Settings => ({ ...defaultSettings, ...read<Partial<Settings>>(SETTINGS_KEY) });
export const saveSettings = (s: Settings): void => write(SETTINGS_KEY, s);
