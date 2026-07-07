// LevelSelect screen - choose which level to play
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Level } from './types';
import { ALL_LEVELS } from './levels';

// Clean modern theme
const THEME = {
  BACKGROUND: '#F8F9FA',
  CARD_BG: '#FFFFFF',
  TEXT_PRIMARY: '#2D3436',
  TEXT_SECONDARY: '#636E72',
  TEXT_MUTED: '#B2BEC3',
  BORDER: '#E9ECEF',
  ACCENT_PURPLE: '#6C5CE7',
  ACCENT_BLUE: '#74B9FF',
};

// Difficulty colors - soft pastels
const DIFFICULTY_COLORS: [string, string][] = [
  ['#81ECEC', '#00CEC9'], // 1 - Easy (teal)
  ['#74B9FF', '#0984E3'], // 2 - Medium (blue)
  ['#FFEAA7', '#FDCB6E'], // 3 - Hard (yellow)
  ['#FAB1A0', '#E17055'], // 4 - Very Hard (coral)
  ['#D4A5FF', '#A855F7'], // 5 - Expert (purple)
];

interface LevelSelectProps {
  onSelectLevel: (level: Level) => void;
}

// Animated level card component
const LevelCard: React.FC<{
  level: Level;
  onPress: () => void;
}> = ({ level, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const difficultyGradient = DIFFICULTY_COLORS[Math.min(level.difficulty - 1, 4)];

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.levelCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelNumber}>Level {level.id}</Text>
          <LinearGradient
            colors={difficultyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.difficultyBadge}
          >
            <Text style={styles.difficultyText}>
              {'★'.repeat(level.difficulty)}
            </Text>
          </LinearGradient>
        </View>

        <Text style={styles.levelName}>{level.name}</Text>

        <View style={styles.levelInfo}>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>{level.gridRows}×{level.gridCols}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>{level.requiredShapes.length} shape{level.requiredShapes.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Mini grid preview */}
        <View style={styles.miniGridContainer}>
          {Array.from({ length: Math.min(level.gridRows, 4) }).map((_, rowIdx) => (
            <View key={`row-${rowIdx}`} style={styles.miniGridRow}>
              {Array.from({ length: Math.min(level.gridCols, 6) }).map((_, colIdx) => {
                const isActive = level.activeCells.some(
                  ([r, c]) => r === rowIdx && c === colIdx
                );
                const lockedCell = level.lockedCells.find(
                  (cell) => cell.row === rowIdx && cell.col === colIdx
                );
                return (
                  <View
                    key={`cell-${rowIdx}-${colIdx}`}
                    style={[
                      styles.miniGridCell,
                      !isActive && styles.miniGridCellInactive,
                      lockedCell && { backgroundColor: lockedCell.color },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const LevelSelect: React.FC<LevelSelectProps> = ({ onSelectLevel }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient accent */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#FAD0C4', '#FFD1FF', '#C1C8E4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
        <View style={styles.header}>
          <Text style={styles.title}>FLAIR</Text>
          <Text style={styles.subtitle}>Paint your way through</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ALL_LEVELS.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            onPress={() => onSelectLevel(level)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND,
  },
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 25,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: THEME.ACCENT_PURPLE,
    letterSpacing: 6,
    textShadowColor: 'rgba(108, 92, 231, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_SECONDARY,
    marginTop: 8,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  levelCard: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  difficultyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  levelName: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.TEXT_PRIMARY,
    marginBottom: 12,
  },
  levelInfo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoChip: {
    backgroundColor: THEME.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  infoChipText: {
    fontSize: 12,
    color: THEME.TEXT_SECONDARY,
    fontWeight: '600',
  },
  miniGridContainer: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  miniGridRow: {
    flexDirection: 'row',
  },
  miniGridCell: {
    width: 16,
    height: 16,
    backgroundColor: '#F1F3F4',
    borderRadius: 4,
    margin: 1.5,
  },
  miniGridCellInactive: {
    backgroundColor: 'transparent',
  },
});

export default LevelSelect;
