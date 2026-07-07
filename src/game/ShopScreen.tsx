// Shop Screen - Purchase items with coins
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Collectible, LIFE_COST_COINS, MAX_LIVES, COSTS } from './types';
import { SHOP_ITEMS, getRarityColor } from './collectibles';
import { getTheme } from './theme';
import { t } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShopScreenProps {
  coins: number;
  lives: number;
  unlockedIds: string[];
  hintBoosts: number;
  timeBoosts: number;
  skipBoosts: number;
  onBack: () => void;
  onPurchase: (item: Collectible) => void;
  onBuyLife: () => void;
  onBuyHints: () => void;
  onBuyTime: () => void;
  onBuySkips: () => void;
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

const ShopScreen: React.FC<ShopScreenProps> = ({
  coins,
  lives,
  unlockedIds,
  hintBoosts,
  timeBoosts,
  skipBoosts,
  onBack,
  onPurchase,
  onBuyLife,
  onBuyHints,
  onBuyTime,
  onBuySkips,
  hapticsEnabled = true,
  darkMode = false,
}) => {
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

  const handlePurchase = (item: Collectible) => {
    doHaptic();
    if (unlockedIds.includes(item.id)) {
      Alert.alert('Already Owned', 'You already have this item!');
      return;
    }
    if (coins < item.unlockCondition.value) {
      Alert.alert('Not Enough Coins', `You need ${item.unlockCondition.value} coins to buy this.`);
      return;
    }
    Alert.alert(
      'Purchase Item',
      `Buy ${item.name} for ${item.unlockCondition.value} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: () => onPurchase(item) },
      ]
    );
  };

  const handleBuyLife = () => {
    doHaptic();
    if (lives >= MAX_LIVES) {
      Alert.alert('Lives Full', 'You already have maximum lives!');
      return;
    }
    if (coins < LIFE_COST_COINS) {
      Alert.alert('Not Enough Coins', `You need ${LIFE_COST_COINS} coins to buy a life.`);
      return;
    }
    Alert.alert(
      'Buy Life',
      `Buy 1 life for ${LIFE_COST_COINS} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: onBuyLife },
      ]
    );
  };

  const handleBuyBoost = (type: 'hints' | 'time' | 'skips', cost: number, handler: () => void) => {
    doHaptic();
    if (coins < cost) {
      Alert.alert('Not Enough Coins', `You need ${cost} coins.`);
      return;
    }
    const names = { hints: 'Hint', time: 'Time Boost', skips: 'Skip' };
    Alert.alert(
      `Buy ${names[type]}`,
      `Buy 1 ${names[type]} for ${cost} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy', onPress: handler },
      ]
    );
  };

  const renderShopItem = (item: Collectible) => {
    const isOwned = unlockedIds.includes(item.id);
    const canAfford = coins >= item.unlockCondition.value;
    const rarityColor = getRarityColor(item.rarity);

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.itemCard,
          { backgroundColor: theme.cardBg },
          isOwned && styles.itemOwned,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
        onPress={() => handlePurchase(item)}
        disabled={isOwned}
      >
        <LinearGradient
          colors={isOwned
            ? (darkMode ? ['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)'] : ['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.02)'])
            : ['transparent', 'transparent']
          }
          style={styles.itemCardGradient}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: `${rarityColor}20` }]}>
            <Ionicons name={item.icon as any} size={28} color={rarityColor} />
          </View>
          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, { color: theme.textPrimary }]}>{item.name}</Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
            </View>
            <Text style={[styles.itemDescription, { color: theme.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
            {item.colors && (
              <View style={styles.colorPreview}>
                {item.colors.slice(0, 6).map((color, i) => (
                  <View key={i} style={[styles.colorDot, { backgroundColor: color }]} />
                ))}
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            {isOwned ? (
              <View style={[styles.ownedBadge, { backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={16} color={darkMode ? '#22C55E' : '#4CAF50'} />
                <Text style={[styles.ownedText, { color: darkMode ? '#22C55E' : '#4CAF50' }]}>{t('shop.owned')}</Text>
              </View>
            ) : (
              <View style={[styles.priceBadge, !canAfford && { opacity: 0.5 }]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.priceBadgeGradient}
                >
                  <FontAwesome5 name="coins" size={12} color="#FFF" />
                  <Text style={styles.priceText}>{item.unlockCondition.value}</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  // Boost card colors
  const boostConfigs = [
    {
      type: 'hints' as const,
      name: t('shop.hints'),
      icon: 'bulb' as const,
      count: hintBoosts,
      cost: COSTS.HINT,
      handler: onBuyHints,
      colors: darkMode ? ['#A855F7', '#7C3AED'] : ['#C084FC', '#A855F7'],
      description: t('game.hint')
    },
    {
      type: 'time' as const,
      name: t('shop.timeBoost'),
      icon: 'time' as const,
      count: timeBoosts,
      cost: COSTS.TIME_BOOST,
      handler: onBuyTime,
      colors: darkMode ? ['#3B82F6', '#2563EB'] : ['#60A5FA', '#3B82F6'],
      description: t('shop.timeBoost')
    },
    {
      type: 'skips' as const,
      name: t('shop.skip'),
      icon: 'play-skip-forward' as const,
      count: skipBoosts,
      cost: COSTS.SKIP_LEVEL,
      handler: onBuySkips,
      colors: darkMode ? ['#14B8A6', '#0D9488'] : ['#2DD4BF', '#14B8A6'],
      description: t('shop.skip')
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />

      {/* Background gradient */}
      <LinearGradient
        colors={theme.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating shapes */}
      <FloatingShape style={styles.shape1} color={darkMode ? '#FF6B35' : '#FFB347'} size={45} shape="rounded" />
      <FloatingShape style={styles.shape2} color={darkMode ? '#4ADE80' : '#7ED957'} size={35} shape="square" />
      <FloatingShape style={styles.shape3} color={darkMode ? '#60A5FA' : '#87CEEB'} size={50} shape="circle" />
      <FloatingShape style={styles.shape4} color={darkMode ? '#F472B6' : '#FFB6C1'} size={40} shape="rounded" />
      <FloatingShape style={styles.shape5} color={darkMode ? '#A78BFA' : '#DDA0DD'} size={30} shape="square" />

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

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('shop.title')}</Text>
        </View>

        <View style={styles.coinsDisplay}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coinsGradient}
          >
            <FontAwesome5 name="coins" size={14} color="#FFF" />
            <Text style={styles.coinText}>{coins}</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Lives Section - Featured */}
        <Pressable
          style={({ pressed }) => [styles.lifeCard, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={handleBuyLife}
        >
          <LinearGradient
            colors={darkMode ? ['#EF4444', '#DC2626'] : ['#FF6B6B', '#EE5A5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.lifeCardGradient}
          >
            {/* Decorative hearts */}
            <View style={styles.heartDecor1}>
              <Ionicons name="heart" size={20} color="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.heartDecor2}>
              <Ionicons name="heart" size={14} color="rgba(255,255,255,0.15)" />
            </View>

            <View style={styles.lifeInfo}>
              <View style={styles.lifeIconContainer}>
                <Ionicons name="heart" size={32} color="#FFF" />
              </View>
              <View>
                <Text style={styles.lifeTitle}>{t('shop.lives')}</Text>
                <View style={styles.lifeStatusContainer}>
                  {[...Array(MAX_LIVES)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < lives ? "heart" : "heart-outline"}
                      size={14}
                      color={i < lives ? "#FFF" : "rgba(255,255,255,0.4)"}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.lifePriceBadge}>
              <FontAwesome5 name="coins" size={14} color="#FFF" />
              <Text style={styles.lifePriceText}>{LIFE_COST_COINS}</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Boosts Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('shop.powerUps')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Boost your gameplay</Text>
        </View>

        <View style={styles.boostsGrid}>
          {boostConfigs.map((boost) => (
            <Pressable
              key={boost.type}
              style={({ pressed }) => [
                styles.boostCard,
                pressed && { transform: [{ scale: 0.95 }] }
              ]}
              onPress={() => handleBuyBoost(boost.type, boost.cost, boost.handler)}
            >
              <LinearGradient
                colors={boost.colors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.boostCardGradient}
              >
                <View style={styles.boostIconContainer}>
                  <Ionicons name={boost.icon} size={28} color="#FFF" />
                </View>
                <Text style={styles.boostCardName}>{boost.name}</Text>
                <Text style={styles.boostCardDesc}>{boost.description}</Text>

                <View style={styles.boostOwned}>
                  <Text style={styles.boostOwnedText}>Owned: {boost.count}</Text>
                </View>

                <View style={styles.boostPriceBadge}>
                  <FontAwesome5 name="coins" size={10} color="#FFD700" />
                  <Text style={styles.boostPriceText}>{boost.cost}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Themes Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('shop.themes')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Customize your look</Text>
        </View>
        {SHOP_ITEMS.filter(i => i.type === 'theme').map(renderShopItem)}

        {/* Patterns Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('shop.patterns')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Unique designs</Text>
        </View>
        {SHOP_ITEMS.filter(i => i.type === 'pattern').map(renderShopItem)}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Floating shapes
  shape1: { position: 'absolute', top: 120, right: 30, transform: [{ rotate: '15deg' }] },
  shape2: { position: 'absolute', top: 200, left: 20, transform: [{ rotate: '-10deg' }] },
  shape3: { position: 'absolute', top: 350, right: 15 },
  shape4: { position: 'absolute', top: 500, left: 25, transform: [{ rotate: '20deg' }] },
  shape5: { position: 'absolute', top: 650, right: 40, transform: [{ rotate: '-15deg' }] },

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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  coinsDisplay: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  coinsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  coinText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Life card
  lifeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lifeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heartDecor1: {
    position: 'absolute',
    top: 8,
    right: 80,
    transform: [{ rotate: '15deg' }],
  },
  heartDecor2: {
    position: 'absolute',
    bottom: 12,
    right: 120,
    transform: [{ rotate: '-20deg' }],
  },
  lifeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lifeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  lifeStatusContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  lifePriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  lifePriceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  // Boosts grid
  boostsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  boostCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  boostCardGradient: {
    padding: 14,
    alignItems: 'center',
    minHeight: 150,
  },
  boostIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  boostCardDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  boostOwned: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  boostOwnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  boostPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    marginTop: 8,
  },
  boostPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  // Item cards
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
  itemOwned: {
    opacity: 0.85,
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
    marginBottom: 6,
    lineHeight: 18,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 5,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  priceContainer: {
    marginLeft: 10,
  },
  priceBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 5,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  ownedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default ShopScreen;
