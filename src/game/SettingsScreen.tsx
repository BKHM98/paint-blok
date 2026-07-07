// Settings Screen for FLAIR puzzle game
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { GameSettings, PlayerProgress } from './types';
import { getTheme, Theme } from './theme';
import { t } from '../i18n';

interface SettingsScreenProps {
  settings: GameSettings;
  progress: PlayerProgress;
  onBack: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onResetProgress: () => void;
  darkMode?: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  progress,
  onBack,
  onUpdateSettings,
  onResetProgress,
  darkMode = false,
}) => {
  const theme = getTheme(darkMode);

  const handleHapticsToggle = (value: boolean) => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onUpdateSettings({ hapticsEnabled: value });
  };

  const handleResetProgress = () => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      t('settings.resetProgress'),
      t('settings.resetConfirm'),
      [
        { text: t('settings.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: () => {
            if (settings.hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            onResetProgress();
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack();
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
        <Pressable style={[styles.backButton, { backgroundColor: theme.cardBg }]} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Settings List */}
      <View style={styles.content}>
        {/* Game Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Game</Text>

          <View style={[styles.settingRow, { backgroundColor: theme.cardBg }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t('settings.haptics')}</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>Vibration when tapping</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: darkMode ? '#3A3A4A' : '#DFE6E9', true: darkMode ? '#7C3AED' : '#A29BFE' }}
              thumbColor={settings.hapticsEnabled ? (darkMode ? '#A855F7' : '#6C5CE7') : (darkMode ? '#6A6A7A' : '#B2BEC3')}
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.cardBg, marginTop: 10 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t('settings.sound')}</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>Game sounds and effects</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => onUpdateSettings({ soundEnabled: value })}
              trackColor={{ false: darkMode ? '#3A3A4A' : '#DFE6E9', true: darkMode ? '#7C3AED' : '#A29BFE' }}
              thumbColor={settings.soundEnabled ? (darkMode ? '#A855F7' : '#6C5CE7') : (darkMode ? '#6A6A7A' : '#B2BEC3')}
            />
          </View>

          <View style={[styles.settingRow, { backgroundColor: theme.cardBg, marginTop: 10 }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{t('settings.music')}</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>Play music during game</Text>
            </View>
            <Switch
              value={settings.musicEnabled}
              onValueChange={(value) => onUpdateSettings({ musicEnabled: value })}
              trackColor={{ false: darkMode ? '#3A3A4A' : '#DFE6E9', true: darkMode ? '#7C3AED' : '#A29BFE' }}
              thumbColor={settings.musicEnabled ? (darkMode ? '#A855F7' : '#6C5CE7') : (darkMode ? '#6A6A7A' : '#B2BEC3')}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statValue, { color: theme.accentPurple }]}>{progress.totalLevelsCompleted}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Levels Completed</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statValue, { color: theme.accentPurple }]}>{progress.hintsUsed}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Hints Used</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statValue, { color: theme.accentPurple }]}>{progress.levelsSkipped}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Levels Skipped</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.statValue, { color: theme.accentPurple }]}>{progress.xp}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total XP</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Data</Text>

          <Pressable style={styles.dangerButton} onPress={handleResetProgress}>
            <LinearGradient
              colors={darkMode ? ['#EF4444', '#DC2626'] : ['#FF6B6B', '#EE5A5A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dangerButtonGradient}
            >
              <Text style={styles.dangerButtonText}>{t('settings.resetProgress')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.accentPurple }]}>FLAIR</Text>
          <Text style={[styles.appVersion, { color: theme.textMuted }]}>Version 1.0.0</Text>
        </View>
      </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  dangerButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 30,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appVersion: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default SettingsScreen;
