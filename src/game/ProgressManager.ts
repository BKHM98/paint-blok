// ProgressManager - handles player progression, XP, coins, lives, and settings
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlayerProgress,
  GameSettings,
  XP_PER_LEVEL,
  XP_LEVEL_MULTIPLIER,
  REWARDS,
  COSTS,
  MAX_LIVES,
  LIFE_REGEN_TIME_MS,
  LIFE_COST_COINS,
  Collectible,
} from './types';
import { ALL_COLLECTIBLES } from './collectibles';

const STORAGE_KEY = 'flair_player_progress';
const SETTINGS_KEY = 'flair_game_settings';

const DEFAULT_PROGRESS: PlayerProgress = {
  currentLevelIndex: 0,
  xp: 0,
  coins: 50, // Start with some coins
  totalLevelsCompleted: 0,
  hintsUsed: 0,
  levelsSkipped: 0,
  unlockedCollectibles: ['theme_default', 'badge_first_steps'],
  equippedTheme: 'theme_default',
  lives: MAX_LIVES,
  lastLifeLostTime: null,
  bestTimes: {},
  // Start with a few boosts
  hintBoosts: 3,
  timeBoosts: 2,
  skipBoosts: 1,
  // High scores
  survivalHighScore: 0,
  timeAttackHighScore: 0,
  // Tutorial
  hasSeenTutorial: false,
};

const DEFAULT_SETTINGS: GameSettings = {
  hapticsEnabled: true,
  showTimer: true,
  darkMode: false,
  soundEnabled: true,
  musicEnabled: false,
};

// Calculate XP needed for a specific player level
export const getXPForLevel = (level: number): number => {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_LEVEL_MULTIPLIER, level - 1));
};

// Calculate player level from total XP
export const getPlayerLevel = (totalXP: number): { level: number; currentXP: number; requiredXP: number } => {
  let level = 1;
  let xpRemaining = totalXP;

  while (true) {
    const xpNeeded = getXPForLevel(level);
    if (xpRemaining < xpNeeded) {
      return {
        level,
        currentXP: xpRemaining,
        requiredXP: xpNeeded,
      };
    }
    xpRemaining -= xpNeeded;
    level++;
  }
};

// Calculate rewards for completing a puzzle
export const calculateRewards = (difficulty: number): { xp: number; coins: number } => {
  return {
    xp: REWARDS.XP_BASE + (REWARDS.XP_PER_DIFFICULTY * difficulty),
    coins: REWARDS.COINS_BASE + (REWARDS.COINS_PER_DIFFICULTY * difficulty),
  };
};

class ProgressManager {
  private progress: PlayerProgress = { ...DEFAULT_PROGRESS };
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private isLoaded: boolean = false;

  async load(): Promise<PlayerProgress> {
    try {
      const [savedProgress, savedSettings] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      if (savedProgress) {
        this.progress = { ...DEFAULT_PROGRESS, ...JSON.parse(savedProgress) };
      }
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      // Regenerate lives based on time passed
      this.regenerateLives();

      // Check for newly unlocked collectibles
      this.checkUnlocks();

      this.isLoaded = true;
      await this.save();
      return this.progress;
    } catch (error) {
      console.log('Error loading progress:', error);
      this.isLoaded = true;
      return this.progress;
    }
  }

  async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.log('Error saving progress:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }

  getProgress(): PlayerProgress {
    // Always check for regenerated lives
    this.regenerateLives();
    return { ...this.progress };
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  // Lives system
  private regenerateLives(): void {
    if (this.progress.lives >= MAX_LIVES) {
      this.progress.lastLifeLostTime = null;
      return;
    }

    if (!this.progress.lastLifeLostTime) {
      return;
    }

    const now = Date.now();
    const timePassed = now - this.progress.lastLifeLostTime;
    const livesToRegen = Math.floor(timePassed / LIFE_REGEN_TIME_MS);

    if (livesToRegen > 0) {
      this.progress.lives = Math.min(MAX_LIVES, this.progress.lives + livesToRegen);
      if (this.progress.lives >= MAX_LIVES) {
        this.progress.lastLifeLostTime = null;
      } else {
        // Update the time to account for partial regeneration
        this.progress.lastLifeLostTime = now - (timePassed % LIFE_REGEN_TIME_MS);
      }
    }
  }

  getTimeUntilNextLife(): number | null {
    if (this.progress.lives >= MAX_LIVES || !this.progress.lastLifeLostTime) {
      return null;
    }
    const timePassed = Date.now() - this.progress.lastLifeLostTime;
    return Math.max(0, LIFE_REGEN_TIME_MS - (timePassed % LIFE_REGEN_TIME_MS));
  }

  async loseLife(): Promise<boolean> {
    this.regenerateLives();
    if (this.progress.lives <= 0) {
      return false;
    }
    this.progress.lives -= 1;
    if (!this.progress.lastLifeLostTime) {
      this.progress.lastLifeLostTime = Date.now();
    }
    await this.save();
    return true;
  }

  async buyLife(): Promise<boolean> {
    if (this.progress.coins < LIFE_COST_COINS || this.progress.lives >= MAX_LIVES) {
      return false;
    }
    this.progress.coins -= LIFE_COST_COINS;
    this.progress.lives += 1;
    await this.save();
    return true;
  }

  hasLives(): boolean {
    this.regenerateLives();
    return this.progress.lives > 0;
  }

  async resetLives(): Promise<void> {
    this.progress.lives = MAX_LIVES;
    this.progress.lastLifeLostTime = null;
    await this.save();
  }

  // Collectibles system
  private checkUnlocks(): void {
    const newUnlocks: string[] = [];

    for (const item of ALL_COLLECTIBLES) {
      if (this.progress.unlockedCollectibles.includes(item.id)) continue;

      let shouldUnlock = false;

      switch (item.unlockCondition.type) {
        case 'level':
          shouldUnlock = this.progress.totalLevelsCompleted >= item.unlockCondition.value;
          break;
        case 'xp':
          shouldUnlock = this.progress.xp >= item.unlockCondition.value;
          break;
        // 'coins' type items are purchased, not auto-unlocked
      }

      if (shouldUnlock) {
        newUnlocks.push(item.id);
      }
    }

    if (newUnlocks.length > 0) {
      this.progress.unlockedCollectibles = [...this.progress.unlockedCollectibles, ...newUnlocks];
    }
  }

  async purchaseCollectible(item: Collectible): Promise<boolean> {
    if (item.unlockCondition.type !== 'coins') return false;
    if (this.progress.unlockedCollectibles.includes(item.id)) return false;
    if (this.progress.coins < item.unlockCondition.value) return false;

    this.progress.coins -= item.unlockCondition.value;
    this.progress.unlockedCollectibles.push(item.id);
    await this.save();
    return true;
  }

  async equipTheme(themeId: string): Promise<boolean> {
    if (!this.progress.unlockedCollectibles.includes(themeId)) return false;
    this.progress.equippedTheme = themeId;
    await this.save();
    return true;
  }

  getUnlockedCollectibles(): string[] {
    return [...this.progress.unlockedCollectibles];
  }

  // Best times
  async recordBestTime(levelId: number, timeMs: number): Promise<boolean> {
    const currentBest = this.progress.bestTimes[levelId];
    if (currentBest === undefined || timeMs < currentBest) {
      this.progress.bestTimes[levelId] = timeMs;
      await this.save();
      return true; // New record!
    }
    return false;
  }

  getBestTime(levelId: number): number | null {
    return this.progress.bestTimes[levelId] ?? null;
  }

  // Level progression
  async setCurrentLevel(levelIndex: number): Promise<void> {
    this.progress.currentLevelIndex = levelIndex;
    await this.save();
  }

  async completeLevel(difficulty: number, timeMs?: number): Promise<{ xpGained: number; coinsGained: number; leveledUp: boolean; newPlayerLevel: number; newRecord: boolean }> {
    const prevLevelInfo = getPlayerLevel(this.progress.xp);
    const rewards = calculateRewards(difficulty);

    this.progress.xp += rewards.xp;
    this.progress.coins += rewards.coins;
    this.progress.totalLevelsCompleted += 1;

    // Check for new unlocks
    this.checkUnlocks();

    const newLevelInfo = getPlayerLevel(this.progress.xp);
    const leveledUp = newLevelInfo.level > prevLevelInfo.level;

    // Record best time if provided
    let newRecord = false;
    if (timeMs !== undefined) {
      const levelId = this.progress.currentLevelIndex + 1;
      const currentBest = this.progress.bestTimes[levelId];
      if (currentBest === undefined || timeMs < currentBest) {
        this.progress.bestTimes[levelId] = timeMs;
        newRecord = true;
      }
    }

    await this.save();

    return {
      xpGained: rewards.xp,
      coinsGained: rewards.coins,
      leveledUp,
      newPlayerLevel: newLevelInfo.level,
      newRecord,
    };
  }

  async spendCoins(amount: number): Promise<boolean> {
    if (this.progress.coins >= amount) {
      this.progress.coins -= amount;
      await this.save();
      return true;
    }
    return false;
  }

  async addCoins(amount: number): Promise<void> {
    this.progress.coins += amount;
    await this.save();
  }

  async useHint(): Promise<boolean> {
    if (this.progress.coins >= COSTS.HINT) {
      this.progress.coins -= COSTS.HINT;
      this.progress.hintsUsed += 1;
      await this.save();
      return true;
    }
    return false;
  }

  async skipLevel(): Promise<boolean> {
    if (this.progress.coins >= COSTS.SKIP_LEVEL) {
      this.progress.coins -= COSTS.SKIP_LEVEL;
      this.progress.levelsSkipped += 1;
      await this.save();
      return true;
    }
    return false;
  }

  canAffordHint(): boolean {
    return this.progress.coins >= COSTS.HINT;
  }

  canAffordSkip(): boolean {
    return this.progress.coins >= COSTS.SKIP_LEVEL;
  }

  // Boost system - use owned boosts
  async useHintBoost(): Promise<boolean> {
    if ((this.progress.hintBoosts ?? 0) <= 0) return false;
    this.progress.hintBoosts = (this.progress.hintBoosts ?? 0) - 1;
    this.progress.hintsUsed += 1;
    await this.save();
    return true;
  }

  async useTimeBoost(): Promise<boolean> {
    if ((this.progress.timeBoosts ?? 0) <= 0) return false;
    this.progress.timeBoosts = (this.progress.timeBoosts ?? 0) - 1;
    await this.save();
    return true;
  }

  async useSkipBoost(): Promise<boolean> {
    if ((this.progress.skipBoosts ?? 0) <= 0) return false;
    this.progress.skipBoosts = (this.progress.skipBoosts ?? 0) - 1;
    this.progress.levelsSkipped += 1;
    await this.save();
    return true;
  }

  // Buy boosts with coins
  async buyHintBoosts(count: number = 1): Promise<boolean> {
    const cost = COSTS.HINT * count;
    if (this.progress.coins < cost) return false;
    this.progress.coins -= cost;
    this.progress.hintBoosts = (this.progress.hintBoosts ?? 0) + count;
    await this.save();
    return true;
  }

  async buyTimeBoosts(count: number = 1): Promise<boolean> {
    const cost = COSTS.TIME_BOOST * count;
    if (this.progress.coins < cost) return false;
    this.progress.coins -= cost;
    this.progress.timeBoosts = (this.progress.timeBoosts ?? 0) + count;
    await this.save();
    return true;
  }

  async buySkipBoosts(count: number = 1): Promise<boolean> {
    const cost = COSTS.SKIP_LEVEL * count;
    if (this.progress.coins < cost) return false;
    this.progress.coins -= cost;
    this.progress.skipBoosts = (this.progress.skipBoosts ?? 0) + count;
    await this.save();
    return true;
  }

  getBoostCounts(): { hints: number; time: number; skips: number } {
    return {
      hints: this.progress.hintBoosts ?? 0,
      time: this.progress.timeBoosts ?? 0,
      skips: this.progress.skipBoosts ?? 0,
    };
  }

  async updateSettings(newSettings: Partial<GameSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  // High score methods
  async updateSurvivalHighScore(score: number): Promise<boolean> {
    if (score > (this.progress.survivalHighScore ?? 0)) {
      this.progress.survivalHighScore = score;
      await this.save();
      return true;
    }
    return false;
  }

  async updateTimeAttackHighScore(score: number): Promise<boolean> {
    if (score > (this.progress.timeAttackHighScore ?? 0)) {
      this.progress.timeAttackHighScore = score;
      await this.save();
      return true;
    }
    return false;
  }

  getSurvivalHighScore(): number {
    return this.progress.survivalHighScore ?? 0;
  }

  getTimeAttackHighScore(): number {
    return this.progress.timeAttackHighScore ?? 0;
  }

  // Tutorial
  hasSeenTutorial(): boolean {
    return this.progress.hasSeenTutorial ?? false;
  }

  async setTutorialSeen(): Promise<void> {
    this.progress.hasSeenTutorial = true;
    await this.save();
  }

  async resetProgress(): Promise<void> {
    this.progress = { ...DEFAULT_PROGRESS };
    await this.save();
  }
}

// Export singleton instance
export const progressManager = new ProgressManager();
