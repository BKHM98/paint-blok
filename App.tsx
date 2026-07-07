import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import type { Level, CellData, Screen, GameSettings, Collectible, GameMode } from './src/game';
import { GAME_MODES } from './src/game/types';
import {
  Grid,
  ShapeBank,
  HomeScreen,
  ProgressBar,
  SettingsScreen,
  CollectionScreen,
  ShopScreen,
  LeaderboardScreen,
  TutorialScreen,
  checkWinCondition,
  getValidShapeBorders,
  ALL_LEVELS,
  progressManager,
  getPlayerLevel,
  soundManager,
  COSTS,
  MAX_LIVES,
  TIME_LIMITS,
  TIME_BOOST_SECONDS,
  getTheme,
  darkPaintColors,
  lightPaintColors,
} from './src/game';
import type { PlayerProgress } from './src/game';


// Pastel modern theme matching the design
const THEME = {
  BACKGROUND: '#F5F0E8',
  CARD_BG: '#FFFFFF',
  CARD_BG_GRADIENT: ['#FFFEF5', '#FFF9E8'],
  TEXT_PRIMARY: '#4A4A4A',
  TEXT_SECONDARY: '#7A7A7A',
  TEXT_MUTED: '#B0B0B0',
  ACCENT_PURPLE: '#9B7ED9',
  ACCENT_PINK: '#E8A4C4',
  ACCENT_BLUE: '#7EC8E3',
  ACCENT_TEAL: '#5BBFBA',
  DANGER: '#E57373',
  SUCCESS: '#81C784',
  TIMER_GRADIENT: ['#F8BBD9', '#E1BEE7', '#D1C4E9'],
};

// Soft pastel paint colors - 16 unique colors so shapes never repeat
const PAINT_COLORS = [
  '#5BBFBA', // Teal
  '#E8A4C4', // Coral Pink
  '#7EC8E3', // Sky Blue
  '#FFD180', // Peach
  '#A8E6CF', // Mint Green
  '#C5B3E3', // Lavender
  '#F8B195', // Salmon
  '#F6E58D', // Pale Yellow
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#E74C3C', // Red
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#1ABC9C', // Turquoise
  '#E91E63', // Pink
  '#00BCD4', // Cyan
];

// Initialize grid from level definition
const initializeGrid = (level: Level): CellData[][] => {
  const grid: CellData[][] = [];

  for (let r = 0; r < level.gridRows; r++) {
    grid[r] = [];
    for (let c = 0; c < level.gridCols; c++) {
      const isActive = level.activeCells.some(
        ([row, col]) => row === r && col === c
      );

      const lockedCell = level.lockedCells.find(
        (cell) => cell.row === r && cell.col === c
      );

      const isBlocked = level.blockedCells?.some(
        ([row, col]) => row === r && col === c
      ) ?? false;

      grid[r][c] = {
        row: r,
        col: c,
        active: isActive,
        color: lockedCell ? lockedCell.color : null,
        locked: !!lockedCell,
        blocked: isBlocked,
      };
    }
  }

  return grid;
};

// Deep clone grid for undo history
const cloneGrid = (grid: CellData[][]): CellData[][] => {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
};

// Check if all active cells are painted (ignoring blocked cells)
const isGridFilled = (grid: CellData[][]): boolean => {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.active && !cell.blocked && !cell.color) {
        return false;
      }
    }
  }
  return true;
};

// Format time in mm:ss
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Animated button component
const AnimatedButton: React.FC<{
  onPress: () => void;
  style: any;
  disabled?: boolean;
  children: React.ReactNode;
  gradient?: [string, string];
  hapticsEnabled?: boolean;
  soundEnabled?: boolean;
}> = ({ onPress, style, disabled, children, gradient, hapticsEnabled = true, soundEnabled = true }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (soundEnabled) {
        soundManager.playClick();
      }
      onPress();
    }
  };

  const content = gradient ? (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[style, { opacity: disabled ? 0.5 : 1 }]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[style, { opacity: disabled ? 0.5 : 1 }]}>
      {children}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {content}
      </Animated.View>
    </Pressable>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [history, setHistory] = useState<CellData[][][]>([]);
  const [showWellDone, setShowWellDone] = useState(false);
  const [isLastLevel, setIsLastLevel] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>({
    currentLevelIndex: 0,
    xp: 0,
    coins: 0,
    totalLevelsCompleted: 0,
    hintsUsed: 0,
    levelsSkipped: 0,
    unlockedCollectibles: ['theme_default', 'badge_first_steps'],
    equippedTheme: 'theme_default',
    lives: MAX_LIVES,
    lastLifeLostTime: null,
    bestTimes: {},
    hintBoosts: 3,
    timeBoosts: 2,
    skipBoosts: 1,
    survivalHighScore: 0,
    timeAttackHighScore: 0,
    hasSeenTutorial: false,
  });
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    hapticsEnabled: true,
    showTimer: false,
    darkMode: false,
    soundEnabled: true,
    musicEnabled: false,
  });
  const [rewardInfo, setRewardInfo] = useState<{ xp: number; coins: number; newRecord?: boolean } | null>(null);
  const [showHintHighlight, setShowHintHighlight] = useState(false);
  const [levelStartTime, setLevelStartTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(120);
  const [timeUntilNextLife, setTimeUntilNextLife] = useState<number | null>(null);
  // Game mode state
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [survivalLevel, setSurvivalLevel] = useState(0);
  const [timeAttackLevels, setTimeAttackLevels] = useState(0);
  const [modeSessionActive, setModeSessionActive] = useState(false);
  const historyRef = useRef<CellData[][][]>([]);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const colorIndex = useRef(0);
  const currentPaintColor = useRef(PAINT_COLORS[0]);
  const wellDoneOpacity = useRef(new Animated.Value(0)).current;
  const wellDoneScale = useRef(new Animated.Value(0.5)).current;
  const hintShakeAnim = useRef(new Animated.Value(0)).current;
  const gridFadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate shape borders for highlighting completed shapes (must be at top level)
  const shapeBorders = useMemo(() => {
    if (!currentLevel) return {};
    return getValidShapeBorders(grid, currentLevel.requiredShapes);
  }, [grid, currentLevel]);

  // Load saved progress and settings on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await progressManager.load();
        setPlayerProgress(progress);
        setCurrentLevelIndex(progress.currentLevelIndex);
        const settings = progressManager.getSettings();
        setGameSettings(settings);

        // Initialize sound manager (preloads tap sounds for rapid playback)
        await soundManager.init();
        soundManager.setSoundEnabled(settings.soundEnabled);
        await soundManager.setMusicEnabled(settings.musicEnabled);
      } catch (error) {
        console.log('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  // Life regeneration timer - update every second when on home screen
  useEffect(() => {
    if (currentScreen !== 'home') {
      return;
    }

    const updateLifeTimer = () => {
      const timeLeft = progressManager.getTimeUntilNextLife();
      setTimeUntilNextLife(timeLeft);

      // Also refresh progress to get regenerated lives
      const updatedProgress = progressManager.getProgress();
      if (updatedProgress.lives !== playerProgress.lives) {
        setPlayerProgress(updatedProgress);
      }
    };

    // Initial update
    updateLifeTimer();

    // Update every second
    const interval = setInterval(updateLifeTimer, 1000);

    return () => clearInterval(interval);
  }, [currentScreen, playerProgress.lives]);

  // Timer effect - countdown every second while playing
  useEffect(() => {
    // Zen mode has no timer
    if (gameMode === 'zen' && modeSessionActive) {
      return;
    }

    if (currentScreen !== 'game' || !levelStartTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - levelStartTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      setRemainingTime(remaining);

      // Time ran out
      if (remaining === 0) {
        clearInterval(interval);
        if (gameSettings.hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        // Handle special modes
        if (modeSessionActive) {
          if (gameMode === 'survival') {
            const score = survivalLevel;
            progressManager.updateSurvivalHighScore(score);
            Alert.alert(
              'Game Over!',
              `You reached level ${score}!\n${score > progressManager.getSurvivalHighScore() ? 'New High Score!' : `Best: ${progressManager.getSurvivalHighScore()}`}`,
              [{ text: 'OK', onPress: () => {
                setModeSessionActive(false);
                setCurrentScreen('home');
              }}]
            );
          } else if (gameMode === 'timeAttack') {
            const score = timeAttackLevels;
            progressManager.updateTimeAttackHighScore(score);
            Alert.alert(
              'Time\'s Up!',
              `You completed ${score} levels!\n${score > progressManager.getTimeAttackHighScore() ? 'New High Score!' : `Best: ${progressManager.getTimeAttackHighScore()}`}`,
              [{ text: 'OK', onPress: () => {
                setModeSessionActive(false);
                setCurrentScreen('home');
              }}]
            );
          }
          return;
        }

        // Classic mode - lose a life
        progressManager.loseLife().then(() => {
          const updatedProgress = progressManager.getProgress();
          setPlayerProgress(updatedProgress);
        });

        Alert.alert(
          'Time\'s Up!',
          'You ran out of time. You lost a life.',
          [{ text: 'OK', onPress: () => setCurrentScreen('home') }]
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScreen, levelStartTime, timeLimit, gameSettings.hapticsEnabled, gameMode, modeSessionActive, survivalLevel, timeAttackLevels]);

  // Haptic helper
  const doHaptic = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (gameSettings.hapticsEnabled) {
      Haptics.impactAsync(style);
    }
  }, [gameSettings.hapticsEnabled]);

  const doNotification = useCallback((type: Haptics.NotificationFeedbackType) => {
    if (gameSettings.hapticsEnabled) {
      Haptics.notificationAsync(type);
    }
  }, [gameSettings.hapticsEnabled]);

  // Combined haptic + click sound for buttons
  const doClick = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    soundManager.playClick();
  }, [doHaptic]);

  // Start game at current level
  const handleStartGame = useCallback((levelIndex: number) => {
    // Check if player has lives
    if (!progressManager.hasLives()) {
      doNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Out of Lives', 'You need lives to play. Visit the shop or wait for them to regenerate.');
      return;
    }

    const level = ALL_LEVELS[levelIndex];
    if (!level) return;

    const newGrid = initializeGrid(level);
    setCurrentLevelIndex(levelIndex);
    setCurrentLevel(level);
    setGrid(newGrid);
    setHistory([]);
    historyRef.current = [];
    colorIndex.current = 0;
    currentPaintColor.current = PAINT_COLORS[0];
    setHintMessage(null);
    setShowHintHighlight(false);
    // Set time limit based on difficulty
    const difficulty = level.difficulty as 1 | 2 | 3;
    const timeLimitSeconds = TIME_LIMITS[difficulty] || 120;
    setTimeLimit(timeLimitSeconds);
    setRemainingTime(timeLimitSeconds);
    setLevelStartTime(null); // Timer starts on first paint
    setCurrentScreen('game');

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);

    gridFadeAnim.setValue(0);
    Animated.timing(gridFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [gridFadeAnim, doHaptic, doNotification]);

  // Play button handler - starts from current progress
  const handlePlay = useCallback(() => {
    setGameMode('classic');
    setModeSessionActive(false);
    handleStartGame(currentLevelIndex);
  }, [currentLevelIndex, handleStartGame]);

  // Start special game mode
  const startSpecialMode = useCallback((mode: GameMode) => {
    // Check if player has lives (except Zen mode)
    if (mode !== 'zen' && !progressManager.hasLives()) {
      Alert.alert('Out of Lives', 'You need lives to play. Visit the shop or wait for them to regenerate.');
      return;
    }

    setGameMode(mode);
    setModeSessionActive(true);

    // Get a random level for special modes
    const randomIndex = Math.floor(Math.random() * Math.min(50, ALL_LEVELS.length));
    const level = ALL_LEVELS[randomIndex];
    if (!level) return;

    const newGrid = initializeGrid(level);
    setCurrentLevel(level);
    setGrid(newGrid);
    setHistory([]);
    historyRef.current = [];
    colorIndex.current = 0;
    currentPaintColor.current = PAINT_COLORS[0];
    setHintMessage(null);
    setShowHintHighlight(false);

    if (mode === 'survival') {
      setSurvivalLevel(1);
      setTimeLimit(60); // 60 seconds per level in survival
      setRemainingTime(60);
    } else if (mode === 'timeAttack') {
      setTimeAttackLevels(0);
      setTimeLimit(300); // 5 minutes total
      setRemainingTime(300);
    } else if (mode === 'zen') {
      setTimeLimit(0); // No timer
      setRemainingTime(0);
    }

    setLevelStartTime(Date.now());
    setCurrentScreen('game');

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    gridFadeAnim.setValue(0);
    Animated.timing(gridFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [gridFadeAnim, doHaptic]);

  // Settings handlers
  const handleOpenSettings = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('settings');
  }, [doHaptic]);

  // Navigation handlers for new screens
  const handleOpenCollection = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('collection');
  }, [doHaptic]);

  const handleOpenShop = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('shop');
  }, [doHaptic]);

  const handleOpenLeaderboard = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScreen('leaderboard');
  }, [doHaptic]);

  // Tutorial handler
  const handleTutorialComplete = useCallback(async () => {
    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    soundManager.playSuccess();
    await progressManager.setTutorialSeen();
    const updatedProgress = progressManager.getProgress();
    setPlayerProgress(updatedProgress);
    setCurrentScreen('home');
  }, [doHaptic]);

  // Collection/Shop handlers
  const handlePurchaseCollectible = useCallback(async (item: Collectible) => {
    const success = await progressManager.purchaseCollectible(item);
    if (success) {
      doNotification(Haptics.NotificationFeedbackType.Success);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doNotification]);

  const handleEquipTheme = useCallback(async (themeId: string) => {
    const success = await progressManager.equipTheme(themeId);
    if (success) {
      doHaptic(Haptics.ImpactFeedbackStyle.Medium);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doHaptic]);

  const handleBuyLife = useCallback(async () => {
    const success = await progressManager.buyLife();
    if (success) {
      doNotification(Haptics.NotificationFeedbackType.Success);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doNotification]);

  const handleBuyHints = useCallback(async () => {
    const success = await progressManager.buyHintBoosts(1);
    if (success) {
      doNotification(Haptics.NotificationFeedbackType.Success);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doNotification]);

  const handleBuyTimeBoosts = useCallback(async () => {
    const success = await progressManager.buyTimeBoosts(1);
    if (success) {
      doNotification(Haptics.NotificationFeedbackType.Success);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doNotification]);

  const handleBuySkips = useCallback(async () => {
    const success = await progressManager.buySkipBoosts(1);
    if (success) {
      doNotification(Haptics.NotificationFeedbackType.Success);
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);
    }
  }, [doNotification]);

  const handleUpdateSettings = useCallback(async (newSettings: Partial<GameSettings>) => {
    await progressManager.updateSettings(newSettings);
    const settings = progressManager.getSettings();
    setGameSettings(settings);

    // Update sound manager
    if (newSettings.soundEnabled !== undefined) {
      soundManager.setSoundEnabled(newSettings.soundEnabled);
    }
    if (newSettings.musicEnabled !== undefined) {
      await soundManager.setMusicEnabled(newSettings.musicEnabled);
    }
  }, []);

  const handleToggleDarkMode = useCallback(async (value: boolean) => {
    await progressManager.updateSettings({ darkMode: value });
    setGameSettings(progressManager.getSettings());
  }, []);

  const handleResetProgress = useCallback(async () => {
    await progressManager.resetProgress();
    const progress = progressManager.getProgress();
    setPlayerProgress(progress);
    setCurrentLevelIndex(0);
    setCurrentScreen('home');
  }, []);

  // Shake animation for hint
  const shakeHint = useCallback(() => {
    hintShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(hintShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(hintShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(hintShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(hintShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(hintShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [hintShakeAnim]);

  // Show full celebration overlay with rewards
  const showWellDoneOverlay = useCallback(async (nextLevelIndex: number | null, difficulty: number) => {
    const isLast = nextLevelIndex === null || nextLevelIndex >= ALL_LEVELS.length;

    // Handle special modes
    if (modeSessionActive && gameMode !== 'classic') {
      // Quick celebration for special modes
      doNotification(Haptics.NotificationFeedbackType.Success);
      soundManager.playSuccess();

      if (gameMode === 'survival') {
        const newLevel = survivalLevel + 1;
        setSurvivalLevel(newLevel);
        // Reset timer for survival
        setRemainingTime(60);
        setLevelStartTime(Date.now());
        // Get next random level
        const randomIndex = Math.floor(Math.random() * Math.min(50, ALL_LEVELS.length));
        const level = ALL_LEVELS[randomIndex];
        if (level) {
          setCurrentLevel(level);
          setGrid(initializeGrid(level));
          setHistory([]);
          historyRef.current = [];
          colorIndex.current = 0;
          currentPaintColor.current = PAINT_COLORS[0];
        }
      } else if (gameMode === 'timeAttack') {
        const newCount = timeAttackLevels + 1;
        setTimeAttackLevels(newCount);
        // Keep timer running, get next random level
        const randomIndex = Math.floor(Math.random() * Math.min(50, ALL_LEVELS.length));
        const level = ALL_LEVELS[randomIndex];
        if (level) {
          setCurrentLevel(level);
          setGrid(initializeGrid(level));
          setHistory([]);
          historyRef.current = [];
          colorIndex.current = 0;
          currentPaintColor.current = PAINT_COLORS[0];
        }
      } else if (gameMode === 'zen') {
        // Just go to next random level
        const randomIndex = Math.floor(Math.random() * Math.min(50, ALL_LEVELS.length));
        const level = ALL_LEVELS[randomIndex];
        if (level) {
          setCurrentLevel(level);
          setGrid(initializeGrid(level));
          setHistory([]);
          historyRef.current = [];
          colorIndex.current = 0;
          currentPaintColor.current = PAINT_COLORS[0];
        }
      }
      return;
    }

    // Classic mode - full celebration
    setIsLastLevel(isLast);
    setShowWellDone(true);

    // Calculate completion time
    const completionTime = levelStartTime ? Date.now() - levelStartTime : undefined;

    // Award XP and coins
    const rewards = await progressManager.completeLevel(difficulty, completionTime);
    setRewardInfo({ xp: rewards.xpGained, coins: rewards.coinsGained, newRecord: rewards.newRecord });

    // Save progress to next level
    if (!isLast && nextLevelIndex !== null) {
      await progressManager.setCurrentLevel(nextLevelIndex);
      setCurrentLevelIndex(nextLevelIndex);
    }

    // Update local progress state
    const updatedProgress = progressManager.getProgress();
    setPlayerProgress(updatedProgress);

    doNotification(Haptics.NotificationFeedbackType.Success);

    // Celebration animation
    Animated.parallel([
      Animated.timing(wellDoneOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(wellDoneScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after showing rewards
    setTimeout(() => {
      Animated.timing(wellDoneOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowWellDone(false);
        setRewardInfo(null);
        wellDoneScale.setValue(0.5);

        if (!isLast && nextLevelIndex !== null) {
          handleStartGame(nextLevelIndex);
        } else {
          setCurrentScreen('home');
        }
      });
    }, 1800);
  }, [wellDoneOpacity, wellDoneScale, handleStartGame, doNotification, levelStartTime, gameMode, modeSessionActive, survivalLevel, timeAttackLevels]);

  // Handle cell paint
  const handleCellPaint = useCallback(
    (row: number, col: number) => {
      const cell = grid[row]?.[col];
      if (!cell || !cell.active || cell.locked || cell.blocked) {
        return;
      }

      if (!isDragging.current) {
        isDragging.current = true;
        colorIndex.current = (colorIndex.current + 1) % PAINT_COLORS.length;
        currentPaintColor.current = PAINT_COLORS[colorIndex.current];
        historyRef.current = [...historyRef.current, cloneGrid(grid)];
        setHistory(historyRef.current);
        setShowHintHighlight(false);

        // Start timer on first paint action
        if (!levelStartTime) {
          setLevelStartTime(Date.now());
        }
      }

      if (cell.color === currentPaintColor.current) {
        return;
      }

      doHaptic(Haptics.ImpactFeedbackStyle.Light);
      soundManager.playTap();

      setGrid((prevGrid) => {
        const newGrid = cloneGrid(prevGrid);
        newGrid[row][col].color = currentPaintColor.current;

        if (currentLevel) {
          const isValid = checkWinCondition(newGrid, currentLevel.requiredShapes);

          if (isValid) {
            isDragging.current = false;
            setHintMessage(null);
            soundManager.playLevelComplete();

            const nextLevelIndex = currentLevelIndex + 1;
            const difficulty = currentLevel.difficulty;

            setTimeout(() => {
              showWellDoneOverlay(
                nextLevelIndex < ALL_LEVELS.length ? nextLevelIndex : null,
                difficulty
              );
            }, 200);
          } else if (isGridFilled(newGrid)) {
            doNotification(Haptics.NotificationFeedbackType.Warning);
            soundManager.playError();

            if (hintTimeoutRef.current) {
              clearTimeout(hintTimeoutRef.current);
            }
            setHintMessage("Not quite right!");
            shakeHint();
            hintTimeoutRef.current = setTimeout(() => {
              setHintMessage(null);
            }, 3000);
          }
        }

        return newGrid;
      });
    },
    [grid, currentLevel, currentLevelIndex, showWellDoneOverlay, shakeHint, doHaptic, doNotification, levelStartTime]
  );

  const resetDragState = useCallback(() => {
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const previousGrid = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setHistory(historyRef.current);
    setGrid(previousGrid);
    setHintMessage(null);
    setShowHintHighlight(false);
  }, [doHaptic]);

  const handleClear = useCallback(() => {
    if (!currentLevel) return;

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    historyRef.current = [...historyRef.current, cloneGrid(grid)];
    setHistory(historyRef.current);
    setGrid(initializeGrid(currentLevel));
    colorIndex.current = 0;
    currentPaintColor.current = PAINT_COLORS[0];
    setHintMessage(null);
    setShowHintHighlight(false);
  }, [currentLevel, grid, doHaptic]);

  // Smart hint generator based on current grid state
  const generateHint = useCallback((): string => {
    if (!currentLevel || !grid) return "Start painting from a corner!";

    // Count painted cells
    let paintedCells = 0;
    let unpaintedCells = 0;
    let hasBlockedCells = false;

    for (const row of grid) {
      for (const cell of row) {
        if (!cell.active) continue;
        if (cell.blocked) {
          hasBlockedCells = true;
          continue;
        }
        if (cell.color) {
          paintedCells++;
        } else {
          unpaintedCells++;
        }
      }
    }

    // Get required shapes info
    const totalShapeCells = currentLevel.requiredShapes.reduce(
      (sum, item) => sum + item.shape.pattern.length * item.required,
      0
    );

    // Generate contextual hints
    if (paintedCells === 0) {
      if (hasBlockedCells) {
        return "Start from a corner away from the X blocks!";
      }
      return "Start from a corner - shapes fit better that way!";
    }

    if (paintedCells < totalShapeCells / 3) {
      const mainShape = currentLevel.requiredShapes[0];
      return `Focus on creating ${mainShape.shape.name} shapes first!`;
    }

    if (paintedCells > totalShapeCells / 2) {
      return "Almost there! Check if remaining space fits the shapes.";
    }

    // Check for common mistakes
    const hints = [
      "Shapes can be rotated or flipped to fit!",
      "Try to leave room for the other required shapes.",
      "Paint connected cells to form complete shapes.",
      "Look at unpainted areas - can shapes fit there?",
      "Work from the edges toward the center.",
    ];

    return hints[Math.floor(Math.random() * hints.length)];
  }, [currentLevel, grid]);

  // Hint handler - use hint boost
  const handleHint = useCallback(async () => {
    if ((playerProgress.hintBoosts ?? 0) <= 0) {
      doNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Hints', 'Buy hints from the shop!');
      return;
    }

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const success = await progressManager.useHintBoost();
    if (success) {
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);

      // Generate smart hint
      const hint = generateHint();
      setShowHintHighlight(true);
      setHintMessage(hint);

      setTimeout(() => {
        setShowHintHighlight(false);
        setHintMessage(null);
      }, 4000);
    }
  }, [doHaptic, doNotification, playerProgress.hintBoosts, generateHint]);

  // Time boost handler - add 30 seconds
  const handleTimeBoost = useCallback(async () => {
    if ((playerProgress.timeBoosts ?? 0) <= 0) {
      doNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Time Boosts', 'Buy time boosts from the shop!');
      return;
    }

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const success = await progressManager.useTimeBoost();
    if (success) {
      const updatedProgress = progressManager.getProgress();
      setPlayerProgress(updatedProgress);

      // Add 30 seconds to time limit
      setTimeLimit(prev => prev + TIME_BOOST_SECONDS);
      setHintMessage("+30 seconds added!");

      setTimeout(() => {
        setHintMessage(null);
      }, 2000);
    }
  }, [doHaptic, doNotification, playerProgress.timeBoosts]);

  // Skip level handler - use skip boost
  const handleSkipLevel = useCallback(async () => {
    if ((playerProgress.skipBoosts ?? 0) <= 0) {
      doNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('No Skip Boosts', 'Buy skip boosts from the shop!');
      return;
    }

    doHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const success = await progressManager.useSkipBoost();
    if (success) {
      const nextLevelIndex = currentLevelIndex + 1;
      if (nextLevelIndex < ALL_LEVELS.length) {
        await progressManager.setCurrentLevel(nextLevelIndex);
        const updatedProgress = progressManager.getProgress();
        setPlayerProgress(updatedProgress);
        handleStartGame(nextLevelIndex);
      } else {
        setCurrentScreen('home');
      }
    }
  }, [currentLevelIndex, handleStartGame, doHaptic, doNotification, playerProgress.skipBoosts]);

  const handleBack = useCallback(() => {
    doHaptic(Haptics.ImpactFeedbackStyle.Light);

    const resetGameState = () => {
      setCurrentScreen('home');
      setCurrentLevel(null);
      setGrid([]);
      setHistory([]);
      historyRef.current = [];
      setShowHintHighlight(false);
      setLevelStartTime(null);
    };

    // Zen mode doesn't lose lives
    if (gameMode === 'zen') {
      resetGameState();
      return;
    }

    // If game has started (player has painted), confirm and lose life
    if (levelStartTime || historyRef.current.length > 0) {
      Alert.alert(
        'Quit Level?',
        'You will lose a life if you quit now.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Quit',
            style: 'destructive',
            onPress: () => {
              progressManager.loseLife().then(() => {
                const updatedProgress = progressManager.getProgress();
                setPlayerProgress(updatedProgress);
              });
              resetGameState();
            }
          }
        ]
      );
    } else {
      // Level not started yet, no life lost
      resetGameState();
    }
  }, [doHaptic, gameMode, levelStartTime]);

  // Tutorial screen (shows for first-time users)
  if (currentScreen === 'tutorial' || (!isLoading && !playerProgress.hasSeenTutorial && currentScreen === 'home')) {
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#1A1A2E' : '#F8F9FA'} />
        <TutorialScreen
          onComplete={handleTutorialComplete}
          darkMode={gameSettings.darkMode}
        />
      </>
    );
  }

  // Home screen
  if (currentScreen === 'home') {
    const levelInfo = getPlayerLevel(playerProgress.xp);
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#0D0D1A' : THEME.BACKGROUND} />
        <HomeScreen
          onPlay={handlePlay}
          onSettings={handleOpenSettings}
          onCollection={handleOpenCollection}
          onShop={handleOpenShop}
          currentLevel={currentLevelIndex + 1}
          totalLevels={ALL_LEVELS.length}
          isLoading={isLoading}
          playerLevel={levelInfo.level}
          currentXP={levelInfo.currentXP}
          requiredXP={levelInfo.requiredXP}
          coins={playerProgress.coins}
          lives={playerProgress.lives}
          maxLives={MAX_LIVES}
          timeUntilNextLife={timeUntilNextLife}
          hapticsEnabled={gameSettings.hapticsEnabled}
          darkMode={gameSettings.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
      </>
    );
  }

  // Settings screen
  if (currentScreen === 'settings') {
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#0D0D1A' : THEME.BACKGROUND} />
        <SettingsScreen
          settings={gameSettings}
          progress={playerProgress}
          onBack={() => {
            doHaptic(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('home');
          }}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
          darkMode={gameSettings.darkMode}
        />
      </>
    );
  }

  // Collection screen
  if (currentScreen === 'collection') {
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#0D0D1A' : THEME.BACKGROUND} />
        <CollectionScreen
          unlockedIds={playerProgress.unlockedCollectibles}
          equippedTheme={playerProgress.equippedTheme}
          onBack={() => {
            doHaptic(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('home');
          }}
          onEquipTheme={handleEquipTheme}
          hapticsEnabled={gameSettings.hapticsEnabled}
          darkMode={gameSettings.darkMode}
        />
      </>
    );
  }

  // Shop screen
  if (currentScreen === 'shop') {
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#0D0D1A' : THEME.BACKGROUND} />
        <ShopScreen
          coins={playerProgress.coins}
          lives={playerProgress.lives}
          unlockedIds={playerProgress.unlockedCollectibles}
          hintBoosts={playerProgress.hintBoosts ?? 0}
          timeBoosts={playerProgress.timeBoosts ?? 0}
          skipBoosts={playerProgress.skipBoosts ?? 0}
          onBack={() => {
            doHaptic(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('home');
          }}
          onPurchase={handlePurchaseCollectible}
          onBuyLife={handleBuyLife}
          onBuyHints={handleBuyHints}
          onBuyTime={handleBuyTimeBoosts}
          onBuySkips={handleBuySkips}
          hapticsEnabled={gameSettings.hapticsEnabled}
          darkMode={gameSettings.darkMode}
        />
      </>
    );
  }

  // Leaderboard screen
  if (currentScreen === 'leaderboard') {
    return (
      <>
        <StatusBar barStyle={gameSettings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={gameSettings.darkMode ? '#0D0D1A' : THEME.BACKGROUND} />
        <LeaderboardScreen
          progress={playerProgress}
          onBack={() => {
            doHaptic(Haptics.ImpactFeedbackStyle.Light);
            setCurrentScreen('home');
          }}
          hapticsEnabled={gameSettings.hapticsEnabled}
          darkMode={gameSettings.darkMode}
        />
      </>
    );
  }

  // Game screen
  const gameTheme = getTheme(gameSettings.darkMode);
  const isDark = gameSettings.darkMode;

  return (
    <View style={[styles.container, { backgroundColor: gameTheme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Animated Gradient Background */}
      <LinearGradient
        colors={gameTheme.backgroundGradient as [string, string, ...string[]]}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.gradientBackground}
      />

      {/* Floating decorative shapes */}
      <View style={[styles.floatingShape, styles.shape1, { backgroundColor: isDark ? '#FF6B35' : '#FFB347' }]} />
      <View style={[styles.floatingShape, styles.shape2, { backgroundColor: isDark ? '#4ADE80' : '#7ED957' }]} />
      <View style={[styles.floatingShape, styles.shape3, { backgroundColor: isDark ? '#38BDF8' : '#5DADE2' }]} />
      <View style={[styles.floatingShape, styles.shape4, { backgroundColor: isDark ? '#F472B6' : '#E8A4C4' }]} />
      <View style={[styles.floatingShape, styles.shape5, { backgroundColor: isDark ? '#FBBF24' : '#FFD93D' }]} />
      <View style={[styles.floatingShape, styles.shape6, { backgroundColor: isDark ? '#2DD4BF' : '#5BBFBA' }]} />

      <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton
          style={[styles.backButton, { backgroundColor: gameTheme.cardBg }]}
          onPress={handleBack}
          hapticsEnabled={gameSettings.hapticsEnabled}
          soundEnabled={gameSettings.soundEnabled}
        >
          <Ionicons name="arrow-back" size={22} color={gameTheme.textPrimary} />
        </AnimatedButton>
        <View style={styles.headerCenter}>
          {gameMode === 'zen' && modeSessionActive ? (
            <LinearGradient
              colors={isDark ? ['#059669', '#10B981'] : ['#A7F3D0', '#6EE7B7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.timerPill}
            >
              <Text style={[styles.timerText, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                🧘 Relax
              </Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={remainingTime <= 10
                ? (isDark ? ['#7F1D1D', '#991B1B'] : ['#FFCDD2', '#EF9A9A'])
                : (isDark ? ['#581C87', '#6B21A8'] : ['#F8BBD9', '#E1BEE7', '#D1C4E9'])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.timerPill}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={remainingTime <= 10 ? (isDark ? '#FCA5A5' : '#C62828') : (isDark ? '#E9D5FF' : '#7B1FA2')}
              />
              <Text style={[styles.timerText, { color: isDark ? '#E9D5FF' : '#7B1FA2' }, remainingTime <= 10 && { color: isDark ? '#FCA5A5' : '#C62828' }]}>
                {formatTime(remainingTime * 1000)}
              </Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.headerRight}>
          <LinearGradient
            colors={
              gameMode === 'survival' ? ['#EF4444', '#DC2626'] :
              gameMode === 'timeAttack' ? ['#F59E0B', '#D97706'] :
              gameMode === 'zen' ? ['#10B981', '#059669'] :
              isDark ? ['#A855F7', '#7C3AED'] : ['#9575CD', '#7E57C2']
            }
            style={styles.levelBadge}
          >
            <Text style={styles.levelBadgeText}>
              {gameMode === 'survival' ? `⚡ ${survivalLevel}` :
               gameMode === 'timeAttack' ? `⏱️ ${timeAttackLevels}` :
               gameMode === 'zen' ? '🧘 Zen' :
               `Lv ${currentLevel?.id}`}
            </Text>
          </LinearGradient>
          <View style={[styles.coinsDisplay, { backgroundColor: gameTheme.cardBg }]}>
            <FontAwesome5 name="coins" size={14} color="#FFB300" />
            <Text style={[styles.coinCountText, { color: isDark ? '#FFD700' : '#D4A017' }]}>
              {playerProgress.coins.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Game Grid with ShapeBank overlay */}
      <Animated.View
        style={[styles.gridWrapper, { opacity: gridFadeAnim }]}
        onTouchEnd={resetDragState}
      >
        <Grid grid={grid} onCellPaint={handleCellPaint} darkMode={isDark} shapeBorders={shapeBorders} />
        {showHintHighlight && (
          <View style={styles.hintOverlay}>
            <View style={styles.hintArrow}>
              <Text style={styles.hintArrowText}>↖</Text>
            </View>
          </View>
        )}
        {/* Shape Bank - glass overlay on grid */}
        {currentLevel && <ShapeBank shapes={currentLevel.requiredShapes} darkMode={isDark} overlay />}
      </Animated.View>

      {/* Hint Message or Instructions */}
      {hintMessage ? (
        <Animated.View
          style={[
            styles.hintContainer,
            { backgroundColor: isDark ? '#DC2626' : THEME.DANGER },
            showHintHighlight && { backgroundColor: isDark ? '#22C55E' : THEME.SUCCESS },
            { transform: [{ translateX: hintShakeAnim }] }
          ]}
        >
          <Text style={styles.hintText}>{hintMessage}</Text>
        </Animated.View>
      ) : (
        <LinearGradient
          colors={isDark
            ? ['#F97316', '#EC4899', '#A855F7', '#3B82F6', '#14B8A6']
            : ['#FFB74D', '#FF8A65', '#F06292', '#BA68C8', '#7986CB', '#4DD0E1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.instructionPill}
        >
          <Text style={styles.instructions}>Drag to paint</Text>
        </LinearGradient>
      )}

      {/* Action Row - Undo and Clear */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.undoButton, history.length === 0 && styles.buttonDisabled]}
          onPress={handleUndo}
          disabled={history.length === 0}
        >
          <LinearGradient
            colors={isDark ? ['#3B82F6', '#2563EB'] : ['#90CAF9', '#64B5F6']}
            style={styles.undoButtonGradient}
          >
            <Ionicons name="arrow-undo" size={20} color="#FFF" />
            <Text style={styles.undoButtonText}>Undo</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={styles.clearButtonContainer}
          onPress={handleClear}
        >
          <LinearGradient
            colors={isDark ? ['#EF4444', '#DC2626'] : ['#EF5350', '#E53935']}
            style={styles.clearButtonGradient}
          >
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Boost Buttons */}
      <View style={styles.boostRow}>
        <Pressable
          style={[styles.boostPill, { backgroundColor: gameTheme.cardBg }, (playerProgress.hintBoosts ?? 0) === 0 && styles.boostDisabled]}
          onPress={handleHint}
          disabled={(playerProgress.hintBoosts ?? 0) === 0}
        >
          <Ionicons name="bulb" size={22} color={isDark ? '#14B8A6' : '#5BBFBA'} />
          <Text style={[styles.boostCountText, { color: isDark ? '#14B8A6' : '#5BBFBA' }]}>{playerProgress.hintBoosts ?? 0}</Text>
        </Pressable>

        <Pressable
          style={[styles.boostPill, { backgroundColor: gameTheme.cardBg }, (playerProgress.timeBoosts ?? 0) === 0 && styles.boostDisabled]}
          onPress={handleTimeBoost}
          disabled={(playerProgress.timeBoosts ?? 0) === 0}
        >
          <Ionicons name="time" size={22} color={isDark ? '#EC4899' : '#E8A4C4'} />
          <Text style={[styles.boostCountText, { color: isDark ? '#EC4899' : '#E8A4C4' }]}>{playerProgress.timeBoosts ?? 0}</Text>
        </Pressable>

        <Pressable
          style={[styles.boostPill, { backgroundColor: gameTheme.cardBg }, (playerProgress.skipBoosts ?? 0) === 0 && styles.boostDisabled]}
          onPress={handleSkipLevel}
          disabled={(playerProgress.skipBoosts ?? 0) === 0}
        >
          <Ionicons name="play-skip-forward" size={22} color={isDark ? '#A855F7' : '#9B7ED9'} />
          <Text style={[styles.boostCountText, { color: isDark ? '#A855F7' : '#9B7ED9' }]}>{playerProgress.skipBoosts ?? 0}</Text>
        </Pressable>
      </View>

      </SafeAreaView>

      {/* Well Done Overlay */}
      {showWellDone && (
        <Animated.View style={[styles.wellDoneOverlay, { opacity: wellDoneOpacity }]}>
          <Animated.View style={[styles.wellDoneBox, { transform: [{ scale: wellDoneScale }] }]}>
            <LinearGradient
              colors={isDark ? ['#14B8A6', '#3B82F6', '#A855F7'] : ['#81ECEC', '#74B9FF', '#A29BFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wellDoneGradient}
            >
              <Text style={styles.wellDoneText}>
                {isLastLevel ? 'Amazing!' : 'Nice!'}
              </Text>
              {rewardInfo && (
                <View style={styles.rewardsContainer}>
                  <View style={styles.rewardItem}>
                    <Ionicons name="star" size={18} color="#FFF" />
                    <Text style={styles.rewardText}>+{rewardInfo.xp} XP</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <FontAwesome5 name="coins" size={16} color="#FFF" />
                    <Text style={styles.rewardText}>+{rewardInfo.coins}</Text>
                  </View>
                  {rewardInfo.newRecord && (
                    <View style={[styles.rewardItem, styles.newRecordBadge]}>
                      <Ionicons name="trophy" size={18} color="#FFF" />
                      <Text style={styles.rewardText}>New Record!</Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.wellDoneSubtext}>
                {isLastLevel ? 'All levels complete!' : 'Next level...'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingShape: {
    position: 'absolute',
    borderRadius: 12,
    opacity: 0.6,
  },
  shape1: {
    width: 80,
    height: 80,
    top: '5%',
    left: -25,
  },
  shape2: {
    width: 60,
    height: 60,
    top: '8%',
    right: -15,
  },
  shape3: {
    width: 70,
    height: 70,
    bottom: '35%',
    right: 10,
  },
  shape4: {
    width: 50,
    height: 50,
    bottom: '25%',
    left: -15,
  },
  shape5: {
    width: 45,
    height: 45,
    top: '45%',
    left: 15,
  },
  shape6: {
    width: 55,
    height: 55,
    bottom: '15%',
    right: -20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: THEME.CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.TEXT_PRIMARY,
  },
  levelSubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
    fontWeight: '500',
  },
  levelSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#E1BEE7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  timerText: {
    fontSize: 26,
    color: '#7B1FA2',
    fontWeight: '800',
  },
  timerTextDanger: {
    color: '#C62828',
  },
  levelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  livesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  livesIcon: {
    fontSize: 14,
  },
  livesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.CARD_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  coinCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  xpBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  gridWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hintOverlay: {
    position: 'absolute',
    top: '10%',
    left: '10%',
  },
  hintArrow: {
    backgroundColor: THEME.SUCCESS,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintArrowText: {
    fontSize: 24,
    color: '#FFF',
  },
  instructionPill: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 6,
  },
  instructions: {
    textAlign: 'center',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hintContainer: {
    backgroundColor: THEME.DANGER,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 30,
    marginBottom: 6,
    shadowColor: THEME.DANGER,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  hintContainerSuccess: {
    backgroundColor: THEME.SUCCESS,
    shadowColor: THEME.SUCCESS,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  undoButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  undoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 6,
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  clearButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 6,
  },
  hintButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A017',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F0E6FF',
    alignItems: 'center',
    shadowColor: THEME.ACCENT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.ACCENT_PURPLE,
  },
  clearButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  wellDoneOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wellDoneBox: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  wellDoneGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  wellDoneText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  wellDoneSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  rewardIcon: {
    fontSize: 12,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  newRecordBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  boostRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 16,
    gap: 12,
  },
  boostPill: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    gap: 2,
  },
  boostDisabled: {
    opacity: 0.4,
  },
  boostCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Mode selection styles
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modeBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modeIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  modeHighScore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  modeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
