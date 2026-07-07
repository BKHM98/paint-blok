// Grid component with improved drag-to-paint support - Performance optimized
import React, { useRef, useCallback, useState, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
  LayoutChangeEvent,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CellData } from './types';
import { CellBorders } from './validator';
import CellComponent from './Cell';

// Light theme
const LIGHT_THEME = {
  GRADIENT_COLORS: ['#FFFFFF', '#FFF9F0'] as [string, string],
  INNER_BORDER: 'rgba(255, 255, 255, 0.9)',
  GRID_BG: '#FAFBFC',
  SHADOW_COLOR: '#000',
};

// Dark theme
const DARK_THEME = {
  GRADIENT_COLORS: ['#1E1E2E', '#252538'] as [string, string],
  INNER_BORDER: 'rgba(255, 255, 255, 0.1)',
  GRID_BG: '#1A1A2A',
  SHADOW_COLOR: '#000',
};

interface GridProps {
  grid: CellData[][];
  onCellPaint: (row: number, col: number) => void;
  darkMode?: boolean;
  shapeBorders?: CellBorders;
}

const Grid: React.FC<GridProps> = ({ grid, onCellPaint, darkMode = false, shapeBorders }) => {
  const THEME = darkMode ? DARK_THEME : LIGHT_THEME;
  const gridContainerRef = useRef<View>(null);
  const gridPosition = useRef({ x: 0, y: 0, measured: false });
  const lastCell = useRef<string | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Memoize all dimension calculations
  const dimensions = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const containerPadding = 22;
    const innerPadding = 12;
    const cellGap = 4;
    const fixedContainerWidth = screenWidth - 40;
    const availableWidth = fixedContainerWidth - (containerPadding * 2) - (innerPadding * 2);
    const finalCellSize = Math.floor((availableWidth - ((cols - 1) * cellGap)) / cols);
    const cellWithMargin = finalCellSize + cellGap;
    const gridContentHeight = (finalCellSize * rows) + ((rows - 1) * cellGap);
    const containerHeight = gridContentHeight + (containerPadding * 2) + (innerPadding * 2);

    return {
      containerPadding,
      cellGap,
      fixedContainerWidth,
      finalCellSize,
      cellWithMargin,
      containerWidth: fixedContainerWidth,
      containerHeight,
    };
  }, [rows, cols]);

  const { finalCellSize, cellWithMargin, containerWidth, containerHeight, cellGap } = dimensions;

  // Measure grid position on layout
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    gridContainerRef.current?.measureInWindow((x, y, width, height) => {
      if (x !== undefined && y !== undefined) {
        gridPosition.current = { x, y, measured: true };
        setLayoutReady(true);
      }
    });
  }, []);

  const getCellFromTouch = useCallback((pageX: number, pageY: number) => {
    if (!gridPosition.current.measured) {
      // Fallback measurement if not ready
      gridContainerRef.current?.measureInWindow((x, y) => {
        if (x !== undefined && y !== undefined) {
          gridPosition.current = { x, y, measured: true };
        }
      });
      return null;
    }

    const relX = pageX - gridPosition.current.x;
    const relY = pageY - gridPosition.current.y;

    // Add tolerance for edge touches - expand hit area slightly
    const tolerance = cellGap / 2;

    const col = Math.floor((relX + tolerance) / cellWithMargin);
    const row = Math.floor((relY + tolerance) / cellWithMargin);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  }, [rows, cols, cellWithMargin, cellGap]);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    // Re-measure position to handle any scroll/layout changes
    gridContainerRef.current?.measureInWindow((x, y) => {
      if (x !== undefined && y !== undefined) {
        gridPosition.current = { x, y, measured: true };
      }
    });

    lastCell.current = null;
    const { pageX, pageY } = e.nativeEvent;

    // Process touch immediately if we have position
    if (gridPosition.current.measured) {
      const cell = getCellFromTouch(pageX, pageY);
      if (cell) {
        const key = `${cell.row}-${cell.col}`;
        lastCell.current = key;
        onCellPaint(cell.row, cell.col);
      }
    } else {
      // Fallback: try after a tiny delay if measurement wasn't ready
      requestAnimationFrame(() => {
        const cell = getCellFromTouch(pageX, pageY);
        if (cell) {
          const key = `${cell.row}-${cell.col}`;
          if (lastCell.current !== key) {
            lastCell.current = key;
            onCellPaint(cell.row, cell.col);
          }
        }
      });
    }
  }, [getCellFromTouch, onCellPaint]);

  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const cell = getCellFromTouch(pageX, pageY);

    if (cell) {
      const key = `${cell.row}-${cell.col}`;
      if (lastCell.current !== key) {
        lastCell.current = key;
        onCellPaint(cell.row, cell.col);
      }
    }
  }, [getCellFromTouch, onCellPaint]);

  const handleTouchEnd = useCallback(() => {
    lastCell.current = null;
  }, []);

  return (
    <View style={styles.gridWrapper}>
      <LinearGradient
        colors={THEME.GRADIENT_COLORS}
        style={[
          styles.parchmentFrame,
          {
            shadowColor: THEME.SHADOW_COLOR,
            width: containerWidth,
            height: containerHeight,
          }
        ]}
      >
        <View style={[styles.innerBorder, { borderColor: THEME.INNER_BORDER }]}>
          <View
            ref={gridContainerRef}
            style={[styles.gridContainer, { backgroundColor: THEME.GRID_BG }]}
            onLayout={handleLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onStartShouldSetResponderCapture={() => true}
            onMoveShouldSetResponderCapture={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
            onResponderTerminate={handleTouchEnd}
          >
            {grid.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((cell, colIndex) => {
                  const borderKey = `${rowIndex},${colIndex}`;
                  return (
                    <CellComponent
                      key={`cell-${rowIndex}-${colIndex}`}
                      cell={cell}
                      size={finalCellSize}
                      darkMode={darkMode}
                      shapeBorder={shapeBorders?.[borderKey]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gridWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  parchmentFrame: {
    borderRadius: 20,
    padding: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  innerBorder: {
    borderRadius: 14,
    borderWidth: 3,
    overflow: 'hidden',
    flex: 1,
  },
  gridContainer: {
    borderRadius: 10,
    padding: 6,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});

export default memo(Grid);
