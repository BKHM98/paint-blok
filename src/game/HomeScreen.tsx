// HomeScreen - Main landing page for FLAIR
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Pressable,
  Dimensions,
  Switch,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTheme, Theme } from './theme';
import { t } from '../i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HomeScreenProps {
  onPlay: () => void;
  onSettings: () => void;
  onCollection: () => void;
  onShop: () => void;
  currentLevel: number;
  totalLevels: number;
  isLoading?: boolean;
  playerLevel: number;
  currentXP: number;
  requiredXP: number;
  coins: number;
  lives: number;
  maxLives: number;
  timeUntilNextLife: number | null;
  hapticsEnabled?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: (value: boolean) => void;
}

// Format time in mm:ss
const formatLifeTimer = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};


// Floating shape component
const FloatingShape: React.FC<{
  color: string;
  size: number;
  style: any;
  delay: number;
  darkMode?: boolean;
  shape?: 'blob' | 'circle' | 'rounded';
}> = ({ color, size, style, delay, darkMode, shape = 'blob' }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: darkMode ? 0.6 : 0.7,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
  }, [delay, scaleAnim, opacityAnim, floatAnim, darkMode]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? size * 0.15 : size * 0.2;

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
          position: 'absolute',
        },
        style,
      ]}
    />
  );
};

// Sparkle star component
const Sparkle: React.FC<{ style: any; size?: number; delay?: number }> = ({ style, size = 12, delay = 0 }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, [opacityAnim, delay]);

  return (
    <Animated.View style={[{ position: 'absolute', opacity: opacityAnim }, style]}>
      <Text style={{ fontSize: size, color: '#FFFFFF' }}>✦</Text>
    </Animated.View>
  );
};

// Animated heart component
const AnimatedHeart: React.FC<{
  filled: boolean;
  index: number;
  totalLives: number;
}> = ({ filled, index, totalLives }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation - staggered pop in
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Heartbeat pulse for filled hearts
    if (filled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1500 + index * 200), // Stagger the heartbeats
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [filled, index, scaleAnim, pulseAnim]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: Animated.multiply(scaleAnim, filled ? pulseAnim : scaleAnim) }
        ],
      }}
    >
      <Text style={[styles.heartIcon, !filled && styles.heartEmpty]}>
        {filled ? '❤️' : '🩶'}
      </Text>
    </Animated.View>
  );
};


// Quick menu button component
const QuickMenuButton: React.FC<{
  icon: string;
  label: string;
  colors: [string, string];
  onPress: () => void;
  disabled?: boolean;
  hapticsEnabled?: boolean;
  iconComponent?: 'ionicons' | 'fontawesome' | 'material';
}> = ({ icon, label, colors, onPress, disabled, hapticsEnabled = true, iconComponent = 'ionicons' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const renderIcon = () => {
    const iconProps = { size: 32, color: '#FFFFFF' };
    switch (iconComponent) {
      case 'fontawesome':
        return <FontAwesome5 name={icon} {...iconProps} />;
      case 'material':
        return <MaterialCommunityIcons name={icon as any} {...iconProps} />;
      default:
        return <Ionicons name={icon as any} {...iconProps} />;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.quickMenuButton}
        >
          {renderIcon()}
          <Text style={styles.quickMenuLabel}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({
  onPlay,
  onSettings,
  onCollection,
  onShop,
  currentLevel,
  totalLevels,
  isLoading,
  playerLevel,
  currentXP,
  requiredXP,
  coins,
  lives,
  maxLives,
  timeUntilNextLife,
  hapticsEnabled = true,
  darkMode = false,
  onToggleDarkMode,
}) => {
  const menuAnim = useRef(new Animated.Value(0)).current;
  const playButtonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(playButtonAnim, { toValue: 1.02, duration: 1200, useNativeDriver: true }),
        Animated.timing(playButtonAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [menuAnim, playButtonAnim]);

  const xpProgress = requiredXP > 0 ? (currentXP / requiredXP) * 100 : 0;

  const handlePlay = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPlay();
  };

  // Background colors based on mode - soft pastel style
  const bgColors = darkMode
    ? ['#0D0D1A', '#1A1A2E', '#16213E', '#0D0D1A'] as [string, string, string, string]
    : ['#F5F0E8', '#F8F4EC', '#FFF9F0', '#F5F0E8'] as [string, string, string, string];

  const floatingShapeColors = darkMode
    ? ['#FF6B35', '#4ADE80', '#38BDF8', '#F472B6', '#FBBF24', '#2DD4BF']
    : ['#FFB347', '#7ED957', '#5DADE2', '#E8A4C4', '#FFD93D', '#5BBFBA'];

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={bgColors}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating decorative shapes */}
      <FloatingShape color={floatingShapeColors[0]} size={100} style={{ top: '5%', left: -30 }} delay={100} darkMode={darkMode} shape="rounded" />
      <FloatingShape color={floatingShapeColors[1]} size={70} style={{ top: '12%', right: -20 }} delay={200} darkMode={darkMode} shape="rounded" />
      <FloatingShape color={floatingShapeColors[2]} size={85} style={{ top: '35%', right: 20 }} delay={150} darkMode={darkMode} shape="blob" />
      <FloatingShape color={floatingShapeColors[3]} size={60} style={{ bottom: '38%', left: -20 }} delay={300} darkMode={darkMode} shape="rounded" />
      <FloatingShape color={floatingShapeColors[4]} size={55} style={{ bottom: '25%', right: -15 }} delay={250} darkMode={darkMode} shape="blob" />
      <FloatingShape color={floatingShapeColors[5]} size={45} style={{ top: '55%', left: 30 }} delay={350} darkMode={darkMode} shape="circle" />

      {/* Sparkle stars */}
      <Sparkle style={{ top: '8%', left: '20%' }} size={14} delay={500} />
      <Sparkle style={{ top: '15%', right: '25%' }} size={10} delay={700} />
      <Sparkle style={{ top: '25%', left: '10%' }} size={8} delay={300} />
      <Sparkle style={{ top: '45%', right: '15%' }} size={12} delay={900} />
      <Sparkle style={{ bottom: '35%', left: '25%' }} size={10} delay={600} />
      <Sparkle style={{ bottom: '20%', right: '30%' }} size={8} delay={400} />

      {/* Floating coins */}
      <Animated.View style={[styles.floatingCoin, { top: '18%', right: '12%' }]}>
        <View style={styles.coinIcon}>
          <Text style={{ fontSize: 18 }}>🪙</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.floatingCoin, { bottom: '40%', left: '8%' }]}>
        <View style={styles.coinIcon}>
          <Text style={{ fontSize: 16 }}>🪙</Text>
        </View>
      </Animated.View>

      {/* Paintbrush decoration */}
      <Animated.View style={styles.paintbrush}>
        <Text style={{ fontSize: 50, transform: [{ rotate: '-30deg' }] }}>🖌️</Text>
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        {/* Dark mode toggle */}
        <Animated.View style={[styles.darkModeToggle, { opacity: menuAnim }]}>
          <Ionicons
            name={darkMode ? 'moon' : 'sunny'}
            size={18}
            color={darkMode ? '#FFFFFF' : '#FFB300'}
            style={{ marginRight: 6 }}
          />
          <View style={[styles.toggleTrack, { backgroundColor: darkMode ? '#A855F7' : 'rgba(155,126,217,0.3)' }]}>
            <Pressable onPress={() => onToggleDarkMode?.(!darkMode)}>
              <Animated.View style={[styles.toggleThumb, darkMode && styles.toggleThumbActive]} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Paint Blok Logo */}
          <Animated.View style={[styles.logoImageContainer, { opacity: menuAnim }]}>
            <Image
              source={require('../../assets/paintblok-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Hearts / Lives */}
          <Animated.View style={[styles.livesContainer, { opacity: menuAnim }]}>
            <View style={styles.livesRow}>
              {[...Array(maxLives)].map((_, i) => (
                <AnimatedHeart
                  key={i}
                  filled={i < lives}
                  index={i}
                  totalLives={maxLives}
                />
              ))}
            </View>
            {timeUntilNextLife !== null && lives < maxLives && (
              <View style={[styles.lifeTimerContainer, { backgroundColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(155,126,217,0.15)' }]}>
                <Ionicons name="time-outline" size={12} color={darkMode ? 'rgba(255,255,255,0.8)' : '#9B7ED9'} />
                <Text style={[styles.lifeTimerText, { color: darkMode ? 'rgba(255,255,255,0.9)' : '#9B7ED9' }]}>{formatLifeTimer(timeUntilNextLife)}</Text>
              </View>
            )}
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            style={[
              styles.profileCard,
              { opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] },
            ]}
          >
            <LinearGradient
              colors={darkMode ? ['#9333EA', '#7C3AED', '#6D28D9'] : ['#C084FC', '#A855F7', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              {/* Decorative bubbles */}
              <View style={[styles.bubble, { top: 10, right: 20, width: 30, height: 30 }]} />
              <View style={[styles.bubble, { bottom: 15, left: 30, width: 20, height: 20 }]} />
              <View style={[styles.bubble, { top: 40, left: 10, width: 15, height: 15 }]} />

              <View style={styles.profileHeader}>
                <View style={styles.profileLevel}>
                  <Text style={styles.profileLevelNumber}>{playerLevel}</Text>
                  <Text style={styles.profileLevelLabel}>Level</Text>
                </View>
                <View style={styles.profileStats}>
                  <View style={styles.profileStatRow}>
                    <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.profileStatValue}>{currentLevel - 1}/{totalLevels}</Text>
                    <Text style={styles.profileStatLabel}>completed</Text>
                  </View>
                  <View style={styles.profileStatRow}>
                    <FontAwesome5 name="coins" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.profileStatValue}>{coins}</Text>
                    <Text style={styles.profileStatLabel}>coins</Text>
                  </View>
                </View>
              </View>
              <View style={styles.xpBarContainer}>
                <View style={styles.xpBarTrack}>
                  <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
                </View>
                <Text style={styles.xpText}>{currentXP} / {requiredXP} XP</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Continue/Play Button */}
          <Animated.View style={{ transform: [{ scale: playButtonAnim }], opacity: menuAnim }}>
            <Pressable onPress={handlePlay} disabled={isLoading || lives === 0}>
              <LinearGradient
                colors={darkMode ? ['#A855F7', '#F97316', '#FBBF24'] : ['#A855F7', '#F59E0B', '#FCD34D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.playButton, (isLoading || lives === 0) && styles.buttonDisabled]}
              >
                {/* Bubble decorations */}
                <View style={[styles.buttonBubble, { top: 8, left: 30, width: 20, height: 20 }]} />
                <View style={[styles.buttonBubble, { bottom: 10, right: 50, width: 15, height: 15 }]} />
                <Text style={styles.playButtonText}>{t('home.play')}</Text>
                <Text style={styles.playButtonSublabel}>Level {currentLevel}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>


          {/* Quick Menu */}
          <Animated.View
            style={[
              styles.quickMenuRow,
              { opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
            ]}
          >
            <QuickMenuButton
              icon="cart"
              label={t('home.shop')}
              colors={darkMode ? ['#06B6D4', '#0891B2'] : ['#22D3EE', '#06B6D4']}
              onPress={onShop}
              disabled={isLoading}
              hapticsEnabled={hapticsEnabled}
            />
            <QuickMenuButton
              icon="grid"
              label={t('home.collection')}
              colors={darkMode ? ['#A855F7', '#9333EA'] : ['#C084FC', '#A855F7']}
              onPress={onCollection}
              disabled={isLoading}
              hapticsEnabled={hapticsEnabled}
            />
            <QuickMenuButton
              icon="settings"
              label={t('home.settings')}
              colors={darkMode ? ['#3B82F6', '#2563EB'] : ['#60A5FA', '#3B82F6']}
              onPress={onSettings}
              disabled={isLoading}
              hapticsEnabled={hapticsEnabled}
            />
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {lives === 0 && (
            <Text style={[styles.footerText, { color: darkMode ? 'rgba(255,255,255,0.7)' : '#7A7A7A' }]}>
              {t('home.outOfLives')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  darkModeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackActive: {
    backgroundColor: '#A855F7',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 220,
    height: 180,
  },
  livesContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heartIcon: {
    fontSize: 26,
  },
  heartEmpty: {
    opacity: 0.6,
  },
  lifeTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 4,
  },
  lifeTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  profileCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  profileGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileLevel: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileLevelNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileLevelLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: -2,
  },
  profileStats: {
    flex: 1,
    gap: 8,
  },
  profileStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  xpBarContainer: {
    marginTop: 4,
  },
  xpBarTrack: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  playButton: {
    width: SCREEN_WIDTH - 48,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonBubble: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playButtonSublabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  modesButtonIcon: {
    fontSize: 18,
  },
  modesButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  quickMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  quickMenuButton: {
    width: (SCREEN_WIDTH - 78) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quickMenuLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  footerSettingsButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  floatingCoin: {
    position: 'absolute',
  },
  coinIcon: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  paintbrush: {
    position: 'absolute',
    top: '22%',
    right: -10,
    zIndex: 5,
  },
});

export default HomeScreen;
