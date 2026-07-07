// ProgressBar - displays player level, XP bar, and coins
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Clean modern theme
const THEME = {
  CARD_BG: '#FFFFFF',
  TEXT_PRIMARY: '#2D3436',
  TEXT_SECONDARY: '#636E72',
  TEXT_MUTED: '#B2BEC3',
  ACCENT_PURPLE: '#6C5CE7',
  ACCENT_GOLD: '#FFEAA7',
  XP_BAR_BG: '#E9ECEF',
};

interface ProgressBarProps {
  level: number;
  currentXP: number;
  requiredXP: number;
  coins: number;
  compact?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  level,
  currentXP,
  requiredXP,
  coins,
  compact = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = requiredXP > 0 ? currentXP / requiredXP : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Level badge */}
        <View style={styles.compactLevelBadge}>
          <Text style={styles.compactLevelText}>{level}</Text>
        </View>

        {/* XP bar */}
        <View style={styles.compactBarContainer}>
          <View style={styles.compactBarBg}>
            <Animated.View style={[styles.compactBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#6C5CE7', '#A29BFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.compactBarGradient}
              />
            </Animated.View>
          </View>
        </View>

        {/* Coins */}
        <View style={styles.compactCoins}>
          <View style={styles.coinIconCircle}>
            <Text style={styles.coinIconText}>$</Text>
          </View>
          <Text style={styles.compactCoinText}>{coins}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Level and Coins row */}
      <View style={styles.topRow}>
        <View style={styles.levelContainer}>
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.levelBadge}
          >
            <Text style={styles.levelNumber}>{level}</Text>
          </LinearGradient>
          <Text style={styles.levelLabel}>LEVEL</Text>
        </View>

        <View style={styles.coinsContainer}>
          <View style={styles.coinIconCircle}>
            <Text style={styles.coinIconText}>$</Text>
          </View>
          <Text style={styles.coinAmount}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* XP Bar */}
      <View style={styles.xpContainer}>
        <View style={styles.xpBarBg}>
          <Animated.View style={[styles.xpBarFill, { width: progressWidth }]}>
            <LinearGradient
              colors={['#6C5CE7', '#A29BFE', '#81ECEC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.xpBarGradient}
            />
          </Animated.View>
        </View>
        <Text style={styles.xpText}>
          {currentXP} / {requiredXP} XP
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: THEME.ACCENT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.TEXT_MUTED,
    letterSpacing: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  coinIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B8860B',
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4A017',
  },
  xpContainer: {
    gap: 6,
  },
  xpBarBg: {
    height: 12,
    backgroundColor: THEME.XP_BAR_BG,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarGradient: {
    flex: 1,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.TEXT_MUTED,
    textAlign: 'center',
  },
  // Compact styles for in-game header
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactLevelBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME.ACCENT_PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLevelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compactBarContainer: {
    flex: 1,
  },
  compactBarBg: {
    height: 8,
    backgroundColor: THEME.XP_BAR_BG,
    borderRadius: 4,
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  compactBarGradient: {
    flex: 1,
  },
  compactCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactCoinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4A017',
  },
});

export default ProgressBar;
