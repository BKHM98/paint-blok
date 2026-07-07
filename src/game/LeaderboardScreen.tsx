// Leaderboard Screen - Shows player stats and rankings
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { PlayerProgress } from './types';
import { getPlayerLevel } from './ProgressManager';
import { getTheme } from './theme';

const THEME_COLORS = {
  GOLD: '#FFD700',
  SILVER: '#C0C0C0',
  BRONZE: '#CD7F32',
};

// Mock leaderboard data (in a real app, this would come from a server)
const MOCK_LEADERBOARD = [
  { id: '1', name: 'PuzzleMaster', xp: 15420, level: 12, avatar: '1' },
  { id: '2', name: 'ColorQueen', xp: 12350, level: 10, avatar: '2' },
  { id: '3', name: 'ShapeShifter', xp: 10890, level: 9, avatar: '3' },
  { id: '4', name: 'BlockBuster', xp: 8920, level: 8, avatar: '4' },
  { id: '5', name: 'TileKing', xp: 7650, level: 7, avatar: '5' },
  { id: '6', name: 'PatternPro', xp: 6200, level: 6, avatar: '6' },
  { id: '7', name: 'GridGenius', xp: 5100, level: 5, avatar: '7' },
  { id: '8', name: 'FlairFan', xp: 4200, level: 4, avatar: '8' },
  { id: '9', name: 'PaintPal', xp: 3500, level: 4, avatar: '9' },
  { id: '10', name: 'NewPlayer', xp: 2800, level: 3, avatar: '10' },
];

interface LeaderboardScreenProps {
  progress: PlayerProgress;
  onBack: () => void;
  hapticsEnabled?: boolean;
  darkMode?: boolean;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  progress,
  onBack,
  hapticsEnabled = true,
  darkMode = false,
}) => {
  const theme = getTheme(darkMode);

  const doHaptic = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const playerLevelInfo = getPlayerLevel(progress.xp);

  // Find player's rank (in a real app, this would be from server)
  const playerRank = MOCK_LEADERBOARD.findIndex(p => progress.xp >= p.xp) + 1 || MOCK_LEADERBOARD.length + 1;

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return THEME_COLORS.GOLD;
    if (rank === 2) return THEME_COLORS.SILVER;
    if (rank === 3) return THEME_COLORS.BRONZE;
    return theme.textMuted;
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />

      {/* Background gradient for dark mode */}
      {darkMode && (
        <LinearGradient
          colors={theme.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={[styles.backButton, { backgroundColor: theme.cardBg }]} onPress={() => { doHaptic(); onBack(); }}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Your Stats Card */}
        <LinearGradient
          colors={darkMode ? ['#A855F7', '#7C3AED'] : ['#6C5CE7', '#A29BFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{playerLevelInfo.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.xp.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{playerRank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.totalLevelsCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          <View style={styles.xpProgress}>
            <View style={styles.xpProgressTrack}>
              <View
                style={[
                  styles.xpProgressFill,
                  { width: `${(playerLevelInfo.currentXP / playerLevelInfo.requiredXP) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.xpProgressText}>
              {playerLevelInfo.currentXP} / {playerLevelInfo.requiredXP} XP to next level
            </Text>
          </View>
        </LinearGradient>

        {/* Best Times */}
        {Object.keys(progress.bestTimes || {}).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Best Times</Text>
            <View style={[styles.bestTimesCard, { backgroundColor: theme.cardBg }]}>
              {Object.entries(progress.bestTimes || {})
                .sort(([a], [b]) => Number(a) - Number(b))
                .slice(0, 5)
                .map(([levelId, time]) => (
                  <View key={levelId} style={styles.bestTimeRow}>
                    <Text style={[styles.bestTimeLevel, { color: theme.textPrimary }]}>Level {levelId}</Text>
                    <Text style={[styles.bestTimeValue, { color: theme.accentPurple }]}>{formatTime(time)}</Text>
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Global Leaderboard */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Global Rankings</Text>
        <View style={[styles.leaderboardCard, { backgroundColor: theme.cardBg }]}>
          {MOCK_LEADERBOARD.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.leaderboardRow,
                index < MOCK_LEADERBOARD.length - 1 && [styles.leaderboardRowBorder, { borderBottomColor: darkMode ? '#2A2A3A' : '#F0F0F0' }],
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, { color: getRankColor(index + 1) }]}>
                  {getRankIcon(index + 1)}
                </Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: darkMode ? '#2A2A3A' : '#F0F0F0' }]}>
                <Ionicons name="person" size={18} color={theme.textMuted} />
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { color: theme.textPrimary }]}>{player.name}</Text>
                <Text style={[styles.playerLevel, { color: theme.textMuted }]}>Level {player.level}</Text>
              </View>
              <Text style={[styles.playerXp, { color: theme.accentPurple }]}>{player.xp.toLocaleString()} XP</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  xpProgress: {
    marginTop: 8,
  },
  xpProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  xpProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  bestTimesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  bestTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  bestTimeLevel: {
    fontSize: 15,
  },
  bestTimeValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  leaderboardCard: {
    borderRadius: 16,
    padding: 8,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leaderboardRowBorder: {
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  playerLevel: {
    fontSize: 12,
  },
  playerXp: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 30,
  },
});

export default LeaderboardScreen;
