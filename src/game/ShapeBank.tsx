// ShapeBank component - shows required shapes for the level (Performance optimized)
import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShapeBankItem, Shape } from './types';

// Light theme
const LIGHT_THEME = {
  GRADIENT_COLORS: ['#FFFEF5', '#FFF9E8'] as [string, string],
  TEXT_PRIMARY: '#4A4A4A',
  TEXT_SECONDARY: '#7A7A7A',
  BORDER: '#E0E0E0',
};

// Dark theme
const DARK_THEME = {
  GRADIENT_COLORS: ['#1E1E2E', '#252538'] as [string, string],
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A0A0B0',
  BORDER: '#3A3A4A',
};

// Color cache to avoid recalculating
const colorCache = new Map<string, string>();

// Lighten a color (cached)
const lightenColor = (color: string, amount: number = 0.7): string => {
  const cacheKey = `lighten-${color}-${amount}`;
  if (colorCache.has(cacheKey)) return colorCache.get(cacheKey)!;

  const hex = color.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(hex.substring(0, 2), 16) + (255 - parseInt(hex.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.floor(parseInt(hex.substring(2, 4), 16) + (255 - parseInt(hex.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.floor(parseInt(hex.substring(4, 6), 16) + (255 - parseInt(hex.substring(4, 6), 16)) * amount));
  const result = `rgb(${r}, ${g}, ${b})`;
  colorCache.set(cacheKey, result);
  return result;
};

// Darken a color for dark mode backgrounds (cached)
const darkenColor = (color: string, amount: number = 0.7): string => {
  const cacheKey = `darken-${color}-${amount}`;
  if (colorCache.has(cacheKey)) return colorCache.get(cacheKey)!;

  const hex = color.replace('#', '');
  const r = Math.floor(parseInt(hex.substring(0, 2), 16) * (1 - amount));
  const g = Math.floor(parseInt(hex.substring(2, 4), 16) * (1 - amount));
  const b = Math.floor(parseInt(hex.substring(4, 6), 16) * (1 - amount));
  const result = `rgb(${r}, ${g}, ${b})`;
  colorCache.set(cacheKey, result);
  return result;
};

interface ShapeBankProps {
  shapes: ShapeBankItem[];
  darkMode?: boolean;
  vertical?: boolean;
  overlay?: boolean;
}

// Render a mini preview of a shape - memoized
const ShapePreview: React.FC<{ shape: Shape; darkMode?: boolean }> = memo(({ shape, darkMode = false }) => {
  const THEME = darkMode ? DARK_THEME : LIGHT_THEME;

  // Memoize grid calculation
  const grid = useMemo(() => {
    const rows = Math.max(...shape.pattern.map(([r]) => r)) + 1;
    const cols = Math.max(...shape.pattern.map(([, c]) => c)) + 1;
    const result: boolean[][] = [];

    for (let r = 0; r < rows; r++) {
      result[r] = [];
      for (let c = 0; c < cols; c++) {
        result[r][c] = false;
      }
    }

    shape.pattern.forEach(([r, c]) => {
      result[r][c] = true;
    });

    return result;
  }, [shape.pattern]);

  const cellSize = 12;

  return (
    <View style={styles.shapePreview}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.shapeRow}>
          {row.map((isActive, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.shapeCell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: isActive ? shape.color : 'transparent',
                  borderColor: isActive ? THEME.BORDER : 'transparent',
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}, (prev, next) => prev.shape.id === next.shape.id && prev.darkMode === next.darkMode);

const ShapeBank: React.FC<ShapeBankProps> = ({ shapes, darkMode = false, vertical = false, overlay = false }) => {
  const THEME = darkMode ? DARK_THEME : LIGHT_THEME;

  // Memoize background color getter
  const getShapeItemBg = useMemo(() => {
    return (color: string) => darkMode ? darkenColor(color, 0.6) : lightenColor(color, 0.75);
  }, [darkMode]);

  // Glass overlay mode - floats on top of grid
  if (overlay) {
    const glassBg = darkMode ? 'rgba(30, 30, 46, 0.5)' : 'rgba(255, 255, 255, 0.55)';
    const glassBorder = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

    return (
      <View style={[styles.overlayContainer, { backgroundColor: glassBg, borderColor: glassBorder }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.overlayScrollContent}
          removeClippedSubviews={true}
        >
          {shapes.map((item, index) => (
            <View key={index} style={styles.overlayShapeItem}>
              <ShapePreview shape={item.shape} darkMode={darkMode} />
              <Text style={[styles.overlayShapeCount, { color: item.shape.color }]}>
                x{item.required}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (vertical) {
    return (
      <LinearGradient colors={THEME.GRADIENT_COLORS} style={styles.verticalContainer}>
        <Text style={[styles.verticalTitle, { color: THEME.TEXT_PRIMARY }]}>SHAPES</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.verticalScrollContent}
          removeClippedSubviews={true}
        >
          {shapes.map((item, index) => (
            <View
              key={index}
              style={[styles.verticalShapeItem, { backgroundColor: getShapeItemBg(item.shape.color) }]}
            >
              <ShapePreview shape={item.shape} darkMode={darkMode} />
              <Text style={[styles.shapeCount, { color: item.shape.color }]}>
                x{item.required}
              </Text>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={THEME.GRADIENT_COLORS} style={styles.container}>
      <Text style={[styles.title, { color: THEME.TEXT_PRIMARY }]}>REQUIRED SHAPES</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
      >
        {shapes.map((item, index) => (
          <View
            key={index}
            style={[styles.shapeItem, { backgroundColor: getShapeItemBg(item.shape.color) }]}
          >
            <ShapePreview shape={item.shape} darkMode={darkMode} />
            <Text style={[styles.shapeCount, { color: item.shape.color }]}>
              x{item.required}
            </Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginVertical: 4,
  },
  verticalContainer: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginLeft: 8,
    maxHeight: '100%',
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  verticalTitle: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  verticalScrollContent: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  shapeItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 10,
    minWidth: 60,
  },
  verticalShapeItem: {
    alignItems: 'center',
    marginVertical: 4,
    padding: 6,
    borderRadius: 8,
    minWidth: 50,
  },
  shapePreview: {
    marginBottom: 4,
  },
  shapeRow: {
    flexDirection: 'row',
  },
  shapeCell: {
    borderWidth: 0,
    borderRadius: 2,
    margin: 1,
  },
  shapeCount: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  // Overlay (glass) styles
  overlayContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    maxHeight: '80%',
  },
  overlayScrollContent: {
    alignItems: 'center',
  },
  overlayShapeItem: {
    alignItems: 'center',
    marginVertical: 2,
    padding: 4,
  },
  overlayShapeCount: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
});

export default memo(ShapeBank);
