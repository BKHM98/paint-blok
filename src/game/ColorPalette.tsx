// ColorPalette component - color selection for painting cells
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';

// Paint colors
const PAINT_COLORS = [
  { name: 'Red', value: '#E74C3C' },
  { name: 'Blue', value: '#3498DB' },
  { name: 'Green', value: '#2ECC71' },
  { name: 'Orange', value: '#F39C12' },
  { name: 'Purple', value: '#9B59B6' },
];

// Theme colors
const THEME = {
  PARCHMENT_DARK: '#E8D4A8',
  TEXT_DARK: '#5D4E37',
  CELL_BORDER: '#8B7355',
  SELECTED_RING: '#2C3E50',
};

interface ColorPaletteProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paint Color</Text>
      <View style={styles.colorsRow}>
        {PAINT_COLORS.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorButton,
              { backgroundColor: color.value },
              selectedColor === color.value && styles.selectedColor,
            ]}
            onPress={() => onSelectColor(color.value)}
            activeOpacity={0.7}
          >
            {selectedColor === color.value && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.PARCHMENT_DARK,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: THEME.CELL_BORDER,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.TEXT_DARK,
    marginBottom: 10,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: THEME.CELL_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedColor: {
    borderWidth: 4,
    borderColor: THEME.SELECTED_RING,
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.SELECTED_RING,
  },
});

export default ColorPalette;
