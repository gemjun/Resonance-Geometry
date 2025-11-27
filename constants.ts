import { LevelTheme } from './types';

export const KEY_MAPPINGS = {
  LANE_0: ['KeyD', 'ArrowLeft'],
  LANE_1: ['KeyF', 'ArrowDown'],
  LANE_2: ['KeyJ', 'ArrowUp'],
  LANE_3: ['KeyK', 'ArrowRight'],
};

export const HIT_WINDOW = {
  PERFECT: 50, // ms
  GREAT: 100, // ms
  GOOD: 150, // ms
};

export const NOTE_SPEED = 20; // Units per second
export const SPAWN_DISTANCE = 60;
export const HIT_Y = 0; // The Y position where notes should be hit (or Z depending on orientation)

export const DEFAULT_THEME: LevelTheme = {
  name: "Neon Genesis",
  description: "A classic cyberpunk starter theme.",
  bpm: 120,
  colors: {
    primary: "#00ffcc", // Cyan
    secondary: "#ff00ff", // Magenta
    accent: "#ffff00", // Yellow
    background: "#050510",
  },
  buildingShape: 'spiral',
  blockShape: 'box',
  difficulty: 3,
};
