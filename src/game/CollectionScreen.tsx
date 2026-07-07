// Collection Screen - View unlocked collectibles
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Collectible, CollectibleType } from './types';
import { ALL_COLLECTIBLES, getRarityColor } from './collectibles';
import { getTheme } from './theme';

interface CollectionScreenProps {
  unlockedIds: string[];
  equippedTheme: string | null;
  onBack: () => void;
  onEquipTheme: (themeId: string) => void;
  hapticsEnabled?: boolean;
  darkMode?: boolean;
}

// Floating shape component
const FloatingShape = ({
  style,
  color,
  size,
  shape
}: {
  style: any;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'rounded';
}) => {
  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? size * 0.15 : size * 0.2;
  return (
    <View
      style={[
        style,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius,
          opacity: 0.6,
        }
      ]}
    />
  );
};

const CollectionScreen: React.FC<CollectionScreenProps> = ({
  unlockedIds,
  equippedTheme,
  onBack,
  onEquipTheme,
  hapticsEnabled = true,
  darkMode = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<CollectibleType>('theme');
  const theme = getTheme(darkMode);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const doHaptic = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const filteredItems = ALL_COLLECTIBLES.filter(c => c.type === selectedTab);
  const unlockedCount = filteredItems.filter(c => unlockedIds.includes(c.id)).length;

  // Tab config with icons and colors
  const tabConfig = [
    { type: 'theme' as CollectibleType, label: 'Themes', icon: 'color-palette', colors: darkMode ? ['#A855F7', '#7C3AED'] : ['#C084FC', '#A855F7'] },
    { type: 'badge' as CollectibleType, label: 'Badges', icon: 'trophy', colors: darkMode ? ['#F59E0B', '#D97706'] : ['#FBBF24', '#F59E0B'] },
    { type: 'pattern' as CollectibleType, label: 'Patterns', icon: 'grid', colors: darkMode ? ['#14B8A6', '#0D9488'] : ['#2DD4BF', '#14B8A6'] },
  ];

  const renderItem = (item: Collectible, index: number) => {
    const isUnlocked = unlockedIds.includes(item.id);
    const isEquipped = item.type === 'theme' && equippedTheme === item.id;
    const rarityColor = getRarityColor(item.rarity);

    return (
      <Animated.View
        key={item.id}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(1 + index * 0.1)) }]
        }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.itemCard,
            { backgroundColor: theme.cardBg },
            !isUnlocked && styles.itemLocked,
            isEquipped && { borderWidth: 2, borderColor: theme.accentPurple },
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => {
            if (isUnlocked && item.type === 'theme') {
              doHaptic();
              onEquipTheme(item.id);
            }
          }}
        >
          <LinearGradient
            colors={isEquipped
              ? (darkMode ? ['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)'] : ['rgba(168, 85, 247, 0.1)', 'rgba(168, 85, 247, 0.02)'])
              : isUnlocked
                ? ['transparent', 'transparent']
                : (darkMode ? ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)'])
            }
            style={styles.itemCardGradient}
          >
            <View style={[styles.itemIconContainer, { backgroundColor: isUnlocked ? `${rarityColor}20` : (darkMode ? '#2A2A3A' : '#E8E8E8') }]}>
              {isUnlocked ? (
                <Ionicons name={item.icon as any} size={28} color={rarityColor} />
              ) : (
                <Ionicons name="lock-closed" size={24} color={theme.textMuted} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: theme.textPrimary }, !isUnlocked && { color: theme.textMuted }]}>
                  {isUnlocked ? item.name : '???'}
                </Text>
                <View style={[styles.rarityBadge, { backgroundColor: isUnlocked ? rarityColor : theme.textMuted }]}>
                  <Text style={styles.rarityText}>{item.rarity}</Text>
                </View>
              </View>
              <Text style={[styles.itemDescription, { color: theme.textMuted }]} numberOfLines={2}>
                {isUnlocked ? item.description : getUnlockHint(item)}
              </Text>
              {isEquipped && (
                <View style={[styles.equippedBadge, { backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={12} color={darkMode ? '#22C55E' : '#4CAF50'} />
                  <Text style={[styles.equippedText, { color: darkMode ? '#22C55E' : '#4CAF50' }]}>Equipped</Text>
                </View>
              )}
            </View>
            {item.colors && isUnlocked && (
              <View style={styles.colorPreview}>
                {item.colors.slice(0, 4).map((color, i) => (
                  <View key={i} style={[styles.colorDot, { backgroundColor: color }]} />
                ))}
              </View>
            )}
            {!isUnlocked && (
              <View style={styles.lockIndicator}>
                <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const getUnlockHint = (item: Collectible): string => {
    switch (item.unlockCondition.type) {
      case 'level':
        return `Complete level ${item.unlockCondition.value}`;
      case 'coins':
        return `Purchase in shop`;
      case 'xp':
        return `Earn ${item.unlockCondition.value} XP`;
      default:
        return 'Keep playing to unlock';
    }
  };

  const currentTabConfig = tabConfig.find(t => t.type === selectedTab)!;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />

      {/* Background gradient */}
      <LinearGradient
        colors={theme.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating shapes */}
      <FloatingShape style={styles.shape1} color={darkMode ? '#FF6B35' : '#FFB347'} size={40} shape="rounded" />
      <FloatingShape style={styles.shape2} color={darkMode ? '#4ADE80' : '#7ED957'} size={30} shape="square" />
      <FloatingShape style={styles.shape3} color={darkMode ? '#60A5FA' : '#87CEEB'} size={45} shape="circle" />
      <FloatingShape style={styles.shape4} color={darkMode ? '#F472B6' : '#FFB6C1'} size={35} shape="rounded" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.cardBg },
            pressed && { transform: [{ scale: 0.95 }] }
          ]}
          onPress={() => { doHaptic(); onBack(); }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Collection</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Tabs */}
      <Animated.View style={[styles.tabs, { opacity: fadeAnim }]}>
        {tabConfig.map(tab => (
          <Pressable
            key={tab.type}
            style={({ pressed }) => [
              styles.tab,
              pressed && { transform: [{ scale: 0.95 }] }
            ]}
            onPress={() => { doHaptic(); setSelectedTab(tab.type); }}
          >
            <LinearGradient
              colors={selectedTab === tab.type ? (tab.colors as [string, string]) : (darkMode ? ['#2A2A3A', '#252535'] : ['#F5F5F5', '#EEEEEE'])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={selectedTab === tab.type ? '#FFF' : theme.textMuted}
              />
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.type ? '#FFF' : theme.textSecondary },
              ]}>
                {tab.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </Animated.View>

      {/* Progress Card */}
      <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={currentTabConfig.colors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.progressCardGradient}
        >
          <View style={styles.progressInfo}>
            <View style={styles.progressIconContainer}>
              <Ionicons name={currentTabConfig.icon as any} size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.progressTitle}>{currentTabConfig.label}</Text>
              <Text style={styles.progressSubtitle}>
                {unlockedCount} of {filteredItems.length} collected
              </Text>
            </View>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercent}>
              {Math.round((unlockedCount / filteredItems.length) * 100)}%
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressTrack, { backgroundColor: darkMode ? '#2A2A3A' : '#E8E8E8' }]}>
          <LinearGradient
            colors={currentTabConfig.colors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(unlockedCount / filteredItems.length) * 100}%` }]}
          />
        </View>
      </View>

      {/* Items Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item, index) => renderItem(item, index))}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Floating shapes
  shape1: { position: 'absolute', top: 140, right: 25, transform: [{ rotate: '15deg' }] },
  shape2: { position: 'absolute', top: 220, left: 15, transform: [{ rotate: '-10deg' }] },
  shape3: { position: 'absolute', top: 400, right: 20 },
  shape4: { position: 'absolute', top: 550, left: 30, transform: [{ rotate: '20deg' }] },

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  placeholder: {
    width: 44,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Progress card
  progressCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  progressSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemLocked: {
    opacity: 0.7,
  },
  itemIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  equippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  equippedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    width: 40,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  lockIndicator: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default CollectionScreen;
