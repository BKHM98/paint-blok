// Collectibles data for FLAIR puzzle game
import { Collectible } from './types';

// All available collectibles in the game
export const ALL_COLLECTIBLES: Collectible[] = [
  // === THEMES (Color palettes) ===
  {
    id: 'theme_default',
    name: 'Classic',
    description: 'The original FLAIR colors',
    type: 'theme',
    icon: 'color-palette',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 1 },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  },
  {
    id: 'theme_ocean',
    name: 'Ocean Breeze',
    description: 'Cool blues and teals',
    type: 'theme',
    icon: 'water',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 10 },
    colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#48CAE4', '#023E8A'],
  },
  {
    id: 'theme_sunset',
    name: 'Sunset Glow',
    description: 'Warm oranges and pinks',
    type: 'theme',
    icon: 'sunny',
    rarity: 'rare',
    unlockCondition: { type: 'level', value: 25 },
    colors: ['#FF6B6B', '#FF8E53', '#FFA07A', '#FFB347', '#FF6F61', '#E63946'],
  },
  {
    id: 'theme_forest',
    name: 'Forest Walk',
    description: 'Natural greens and browns',
    type: 'theme',
    icon: 'leaf',
    rarity: 'rare',
    unlockCondition: { type: 'level', value: 40 },
    colors: ['#2D5016', '#588157', '#A3B18A', '#DAD7CD', '#344E41', '#3A5A40'],
  },
  {
    id: 'theme_neon',
    name: 'Neon Nights',
    description: 'Vibrant neon colors',
    type: 'theme',
    icon: 'flash',
    rarity: 'epic',
    unlockCondition: { type: 'coins', value: 100 },
    colors: ['#FF00FF', '#00FFFF', '#FF0080', '#80FF00', '#8000FF', '#FFFF00'],
  },
  {
    id: 'theme_pastel',
    name: 'Pastel Dreams',
    description: 'Soft pastel shades',
    type: 'theme',
    icon: 'heart',
    rarity: 'epic',
    unlockCondition: { type: 'coins', value: 150 },
    colors: ['#FFB5E8', '#B5DEFF', '#DCD3FF', '#BFFCC6', '#FFF5BA', '#FFABAB'],
  },
  {
    id: 'theme_galaxy',
    name: 'Galaxy',
    description: 'Deep space colors',
    type: 'theme',
    icon: 'planet',
    rarity: 'legendary',
    unlockCondition: { type: 'coins', value: 300 },
    colors: ['#7400B8', '#6930C3', '#5E60CE', '#5390D9', '#4EA8DE', '#48BFE3'],
  },
  {
    id: 'theme_gold',
    name: 'Golden Hour',
    description: 'Luxurious gold tones',
    type: 'theme',
    icon: 'sparkles',
    rarity: 'legendary',
    unlockCondition: { type: 'xp', value: 5000 },
    colors: ['#FFD700', '#FFC300', '#FFB000', '#FF9500', '#DAA520', '#B8860B'],
  },

  // === BADGES (Achievements) ===
  {
    id: 'badge_first_steps',
    name: 'First Steps',
    description: 'Complete your first level',
    type: 'badge',
    icon: 'flag',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 1 },
  },
  {
    id: 'badge_getting_started',
    name: 'Getting Started',
    description: 'Complete 10 levels',
    type: 'badge',
    icon: 'star',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 10 },
  },
  {
    id: 'badge_quarter_way',
    name: 'Quarter Way',
    description: 'Complete 25 levels',
    type: 'badge',
    icon: 'medal',
    rarity: 'rare',
    unlockCondition: { type: 'level', value: 25 },
  },
  {
    id: 'badge_halfway',
    name: 'Halfway There',
    description: 'Complete 50 levels',
    type: 'badge',
    icon: 'trophy',
    rarity: 'rare',
    unlockCondition: { type: 'level', value: 50 },
  },
  {
    id: 'badge_century',
    name: 'Century Club',
    description: 'Complete 100 levels',
    type: 'badge',
    icon: 'ribbon',
    rarity: 'epic',
    unlockCondition: { type: 'level', value: 100 },
  },
  {
    id: 'badge_master',
    name: 'Puzzle Master',
    description: 'Complete all 200 levels',
    type: 'badge',
    icon: 'diamond',
    rarity: 'legendary',
    unlockCondition: { type: 'level', value: 200 },
  },
  {
    id: 'badge_collector',
    name: 'Coin Collector',
    description: 'Earn 500 coins total',
    type: 'badge',
    icon: 'wallet',
    rarity: 'rare',
    unlockCondition: { type: 'coins', value: 500 },
  },
  {
    id: 'badge_xp_hunter',
    name: 'XP Hunter',
    description: 'Earn 1000 XP',
    type: 'badge',
    icon: 'flash',
    rarity: 'rare',
    unlockCondition: { type: 'xp', value: 1000 },
  },
  {
    id: 'badge_xp_master',
    name: 'XP Master',
    description: 'Earn 10000 XP',
    type: 'badge',
    icon: 'flame',
    rarity: 'legendary',
    unlockCondition: { type: 'xp', value: 10000 },
  },

  // === PATTERNS (Special cell styles) ===
  {
    id: 'pattern_dots',
    name: 'Polka Dots',
    description: 'Dotted cell pattern',
    type: 'pattern',
    icon: 'ellipse',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 5 },
  },
  {
    id: 'pattern_stripes',
    name: 'Stripes',
    description: 'Striped cell pattern',
    type: 'pattern',
    icon: 'reorder-three',
    rarity: 'common',
    unlockCondition: { type: 'level', value: 15 },
  },
  {
    id: 'pattern_gradient',
    name: 'Gradient',
    description: 'Gradient fill cells',
    type: 'pattern',
    icon: 'color-fill',
    rarity: 'rare',
    unlockCondition: { type: 'coins', value: 75 },
  },
  {
    id: 'pattern_sparkle',
    name: 'Sparkle',
    description: 'Sparkling cell effect',
    type: 'pattern',
    icon: 'sparkles',
    rarity: 'epic',
    unlockCondition: { type: 'coins', value: 200 },
  },
];

// Shop items (purchasable with coins)
export const SHOP_ITEMS = ALL_COLLECTIBLES.filter(
  c => c.unlockCondition.type === 'coins'
);

// Get rarity color
export const getRarityColor = (rarity: Collectible['rarity']): string => {
  switch (rarity) {
    case 'common': return '#9CA3AF';
    case 'rare': return '#3B82F6';
    case 'epic': return '#8B5CF6';
    case 'legendary': return '#F59E0B';
    default: return '#9CA3AF';
  }
};

// Get collectible by ID
export const getCollectibleById = (id: string): Collectible | undefined => {
  return ALL_COLLECTIBLES.find(c => c.id === id);
};
