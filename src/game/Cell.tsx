// Cell component for FLAIR puzzle game - Performance optimized
import React, { memo, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Platform } from 'react-native';
import { CellData } from './types';

// Theme colors for light and dark modes
const LIGHT_THEME = {
  CELL_BORDER: 'rgba(255, 255, 255, 0.8)',
  UNPAINTED: '#F5F5F5',
  LOCKED_OVERLAY: 'rgba(156, 39, 176, 0.1)',
};

const DARK_THEME = {
  CELL_BORDER: 'rgba(255, 255, 255, 0.2)',
  UNPAINTED: '#2A2A3A',
  LOCKED_OVERLAY: 'rgba(168, 85, 247, 0.15)',
};

// Pre-computed color cache to avoid recalculating
const darkenedColorCache = new Map<string, string>();

// Darken a color for bold border effect (cached)
const darkenColor = (color: string, amount: number = 0.3): string => {
  const cacheKey = `${color}-${amount}`;
  if (darkenedColorCache.has(cacheKey)) {
    return darkenedColorCache.get(cacheKey)!;
  }
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - Math.floor(255 * amount));
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - Math.floor(255 * amount));
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - Math.floor(255 * amount));
  const result = `rgb(${r}, ${g}, ${b})`;
  darkenedColorCache.set(cacheKey, result);
  return result;
};

interface CellProps {
  cell: CellData;
  size: number;
  darkMode?: boolean;
  shapeBorder?: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
    valid?: boolean;
  };
}

const CellComponent: React.FC<CellProps> = ({ cell, size, darkMode = false, shapeBorder }) => {
  const THEME = darkMode ? DARK_THEME : LIGHT_THEME;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevColorRef = useRef<string | null>(null);

  // Animate when cell gets painted or color changes
  useEffect(() => {
    if (cell.color && cell.color !== prevColorRef.current) {
      // Pop animation when painted
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }).start();
    }
    prevColorRef.current = cell.color;
  }, [cell.color, scaleAnim]);

  // Memoize border calculations
  const borderStyle = useMemo(() => {
    const hasShapeBorder = shapeBorder?.valid && (shapeBorder.top || shapeBorder.bottom || shapeBorder.left || shapeBorder.right);
    if (!hasShapeBorder || !cell.color) {
      return null;
    }
    const borderWidth = 4;
    const borderColor = darkenColor(cell.color, 0.35);
    return {
      borderTopWidth: shapeBorder?.top ? borderWidth : 0,
      borderBottomWidth: shapeBorder?.bottom ? borderWidth : 0,
      borderLeftWidth: shapeBorder?.left ? borderWidth : 0,
      borderRightWidth: shapeBorder?.right ? borderWidth : 0,
      borderColor: borderColor,
    };
  }, [shapeBorder?.top, shapeBorder?.bottom, shapeBorder?.left, shapeBorder?.right, shapeBorder?.valid, cell.color]);

  if (!cell.active) {
    // Inactive cells are invisible - use simplest possible view
    return <View style={[styles.inactiveCell, { width: size, height: size }]} />;
  }

  // Blocked cells - obstacles that cannot be painted
  if (cell.blocked) {
    return (
      <View
        style={[
          styles.blockedCell,
          {
            width: size,
            height: size,
            backgroundColor: darkMode ? '#1A1A2A' : '#E0E0E0',
            borderColor: darkMode ? '#2A2A4A' : '#BDBDBD',
          },
        ]}
      >
        <View style={[styles.blockedPattern, { backgroundColor: darkMode ? '#252540' : '#D0D0D0' }]} />
        <View style={[styles.blockedPatternAlt, { backgroundColor: darkMode ? '#252540' : '#D0D0D0' }]} />
      </View>
    );
  }

  // Painted cell
  if (cell.color) {
    return (
      <Animated.View
        style={[
          styles.paintedCell,
          {
            width: size,
            height: size,
            backgroundColor: cell.color,
          },
          borderStyle,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {cell.locked && <View style={[styles.lockedOverlay, { backgroundColor: THEME.LOCKED_OVERLAY }]} />}
      </Animated.View>
    );
  }

  // Unpainted cell
  return (
    <View
      style={[
        styles.unpaintedCell,
        {
          width: size,
          height: size,
          backgroundColor: THEME.UNPAINTED,
        },
      ]}
    >
      {cell.locked && <View style={[styles.lockedOverlay, { backgroundColor: THEME.LOCKED_OVERLAY }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  inactiveCell: {
    backgroundColor: 'transparent',
    margin: 2,
  },
  blockedCell: {
    borderRadius: 10,
    margin: 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  paintedCell: {
    borderRadius: 10,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Only add shadow on iOS for performance
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 1,
    } : {}),
  },
  unpaintedCell: {
    borderRadius: 10,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  blockedPattern: {
    position: 'absolute',
    width: '140%',
    height: 3,
    transform: [{ rotate: '45deg' }],
    top: '45%',
  },
  blockedPatternAlt: {
    position: 'absolute',
    width: '140%',
    height: 3,
    transform: [{ rotate: '-45deg' }],
    top: '45%',
  },
});

// Memo with custom comparison for better performance
export default memo(CellComponent, (prevProps, nextProps) => {
  // Only re-render if relevant props changed
  if (prevProps.size !== nextProps.size) return false;
  if (prevProps.darkMode !== nextProps.darkMode) return false;

  // Cell data comparison
  const prevCell = prevProps.cell;
  const nextCell = nextProps.cell;
  if (prevCell.active !== nextCell.active) return false;
  if (prevCell.blocked !== nextCell.blocked) return false;
  if (prevCell.color !== nextCell.color) return false;
  if (prevCell.locked !== nextCell.locked) return false;

  // Shape border comparison
  const prevBorder = prevProps.shapeBorder;
  const nextBorder = nextProps.shapeBorder;
  if (prevBorder?.valid !== nextBorder?.valid) return false;
  if (prevBorder?.top !== nextBorder?.top) return false;
  if (prevBorder?.bottom !== nextBorder?.bottom) return false;
  if (prevBorder?.left !== nextBorder?.left) return false;
  if (prevBorder?.right !== nextBorder?.right) return false;

  return true; // Props are equal, skip re-render
});
