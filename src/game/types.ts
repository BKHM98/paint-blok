// Game type definitions for EXECUTION puzzle game

export interface CellData {
  row: number;
  col: number;
  active: boolean;  // Whether this cell is part of the playable grid
  color: string | null;  // Current paint color, null if unpainted
  locked: boolean;  // Whether cell is pre-filled and cannot be changed
  blocked: boolean;  // Whether cell is an obstacle (cannot be painted)
}

export interface Shape {
  id: string;
  name: string;
  // Pattern represented as array of [row, col] offsets from origin
  pattern: [number, number][];
  color: string;
}

export interface ShapeBankItem {
  shape: Shape;
  required: number;  // How many of this shape must be placed
  placed: number;    // How many have been correctly placed
}

export interface Level {
  id: number;
  name: string;
  gridRows: number;
  gridCols: number;
  // Which cells are active (playable) - array of [row, col]
  activeCells: [number, number][];
  // Pre-filled locked cells with their colors
  lockedCells: { row: number; col: number; color: string }[];
  // Blocked cells (obstacles that cannot be painted) - array of [row, col]
  blockedCells?: [number, number][];
  // Shapes required to complete the level
  requiredShapes: ShapeBankItem[];
  // Difficulty rating 1-5
  difficulty: number;
}

export interface GameState {
  level: Level;
  grid: CellData[][];
  selectedColor: string | null;
  history: CellData[][][];  // Undo stack
  isComplete: boolean;
}

export type Screen = 'home' | 'game' | 'settings' | 'collection' | 'shop' | 'leaderboard' | 'modeSelect' | 'tutorial';

// Game modes
export type GameMode = 'classic' | 'survival' | 'timeAttack' | 'zen';

export interface GameModeInfo {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
}

export const GAME_MODES: GameModeInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Progress through levels at your own pace', icon: '🎯' },
  { id: 'survival', name: 'Survival', description: 'Timer resets each level - how far can you go?', icon: '⚡' },
  { id: 'timeAttack', name: 'Time Attack', description: '5 minutes to complete as many levels as possible', icon: '⏱️' },
  { id: 'zen', name: 'Zen', description: 'No timer, just relax and solve puzzles', icon: '🧘' },
];

// Collectible item types
export type CollectibleType = 'theme' | 'badge' | 'pattern';

export interface Collectible {
  id: string;
  name: string;
  description: string;
  type: CollectibleType;
  icon: string;  // Emoji or icon identifier
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: {
    type: 'level' | 'coins' | 'xp' | 'achievement';
    value: number;  // Level number, coin cost, XP threshold, etc.
  };
  colors?: string[];  // For themes - the color palette
}

// Player progression
export interface PlayerProgress {
  currentLevelIndex: number;
  xp: number;
  coins: number;
  totalLevelsCompleted: number;
  hintsUsed: number;
  levelsSkipped: number;
  unlockedCollectibles: string[];  // Array of collectible IDs
  equippedTheme: string | null;  // Currently equipped theme ID
  lives: number;  // Current lives (max 5)
  lastLifeLostTime: number | null;  // Timestamp when last life was lost
  bestTimes: { [levelId: number]: number };  // Best completion times per level (ms)
  // Boost inventory
  hintBoosts: number;  // Number of hint boosts owned
  timeBoosts: number;  // Number of time boosts owned
  skipBoosts: number;  // Number of skip boosts owned
  // High scores for game modes
  survivalHighScore: number;  // Highest level reached in survival
  timeAttackHighScore: number;  // Most levels in time attack
  // Tutorial
  hasSeenTutorial: boolean;  // Whether player has completed tutorial
}

// Lives system
export const MAX_LIVES = 5;
export const LIFE_REGEN_TIME_MS = 60 * 60 * 1000;  // 1 hour in milliseconds
export const LIFE_COST_COINS = 20;  // Cost to buy one life

// Game settings
export interface GameSettings {
  hapticsEnabled: boolean;
  showTimer: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

// XP required per level (increases as you level up)
export const XP_PER_LEVEL = 100;
export const XP_LEVEL_MULTIPLIER = 1.2; // Each player level requires 20% more XP

// Rewards per puzzle difficulty
export const REWARDS = {
  XP_BASE: 20,        // Base XP per level
  XP_PER_DIFFICULTY: 10, // Extra XP per difficulty star
  COINS_BASE: 5,      // Base coins per level
  COINS_PER_DIFFICULTY: 3, // Extra coins per difficulty star
};

// Costs for hints and skips
export const COSTS = {
  HINT: 10,           // Coins to show a hint
  SKIP_LEVEL: 25,     // Coins to skip a level
  TIME_BOOST: 15,     // Coins to add extra time
};

// Time limits by difficulty (in seconds)
export const TIME_LIMITS = {
  1: 180,  // 3 minutes for easy
  2: 180,  // 3 minutes for medium
  3: 180,  // 3 minutes for hard
};

// Time boost adds 30 seconds
export const TIME_BOOST_SECONDS = 30;
