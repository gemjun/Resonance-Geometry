export type LaneIndex = 0 | 1 | 2 | 3;

export interface Note {
  id: string;
  lane: LaneIndex;
  timestamp: number;
  hit: boolean;
  missed: boolean;
}

export interface BuildingBlock {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  shape: 'box' | 'cylinder' | 'dodecahedron';
  timestamp: number;
}

export interface LevelTheme {
  name: string;
  description: string;
  bpm: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  buildingShape: 'tower' | 'bridge' | 'spiral';
  blockShape: 'box' | 'cylinder' | 'dodecahedron';
  difficulty: number; // 1-10
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  health: number;
  isPlaying: boolean;
  gameStatus: 'menu' | 'playing' | 'gameover' | 'gallery';
}

export type NoteHitJudgment = 'perfect' | 'great' | 'good' | 'miss';
