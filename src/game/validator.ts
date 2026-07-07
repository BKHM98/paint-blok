// Shape validation for EXECUTION puzzle game
import { CellData, Shape, ShapeBankItem } from './types';

// Normalize a pattern by translating to origin (0,0)
const normalizePattern = (pattern: [number, number][]): string => {
  if (pattern.length === 0) return '';

  const minRow = Math.min(...pattern.map(([r]) => r));
  const minCol = Math.min(...pattern.map(([, c]) => c));

  const normalized = pattern
    .map(([r, c]): [number, number] => [r - minRow, c - minCol])
    .sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

  return JSON.stringify(normalized);
};

// Rotate pattern 90 degrees clockwise
const rotatePattern = (pattern: [number, number][]): [number, number][] => {
  return pattern.map(([r, c]) => [c, -r]);
};

// Reflect pattern horizontally
const reflectPattern = (pattern: [number, number][]): [number, number][] => {
  return pattern.map(([r, c]) => [r, -c]);
};

// Generate all 8 orientations of a shape (4 rotations + 4 rotations of reflection)
// This treats mirror images (L/J, S/Z) as the same shape for easier gameplay
const getAllOrientations = (pattern: [number, number][]): Set<string> => {
  const orientations = new Set<string>();
  let current = [...pattern];

  // 4 rotations
  for (let i = 0; i < 4; i++) {
    orientations.add(normalizePattern(current));
    current = rotatePattern(current);
  }

  // Reflect and do 4 more rotations
  current = reflectPattern(pattern);
  for (let i = 0; i < 4; i++) {
    orientations.add(normalizePattern(current));
    current = rotatePattern(current);
  }

  return orientations;
};

// Find all connected regions of painted cells using flood fill (same color only)
const findConnectedRegions = (grid: CellData[][]): [number, number][][] => {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const visited = new Set<string>();
  const regions: [number, number][][] = [];

  const floodFill = (startRow: number, startCol: number, targetColor: string): [number, number][] => {
    const region: [number, number][] = [];
    const stack: [number, number][] = [[startRow, startCol]];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;

      const cell = grid[r][c];
      if (!cell.active || cell.blocked || cell.color !== targetColor) continue;

      visited.add(key);
      region.push([r, c]);

      // Check 4 neighbors
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    return region;
  };

  // Find all regions
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const key = `${r},${c}`;

      if (cell.active && !cell.blocked && cell.color && !visited.has(key)) {
        const region = floodFill(r, c, cell.color);
        if (region.length > 0) {
          regions.push(region);
        }
      }
    }
  }

  return regions;
};

// Check if a region matches any orientation of a shape
const regionMatchesShape = (region: [number, number][], shape: Shape): boolean => {
  const regionNormalized = normalizePattern(region);
  const shapeOrientations = getAllOrientations(shape.pattern);
  return shapeOrientations.has(regionNormalized);
};

// Main validation function
export interface ValidationResult {
  isValid: boolean;
  allCellsPainted: boolean;
  shapeCounts: Map<string, number>; // shape id -> count found
  errors: string[];
}

export const validateGrid = (
  grid: CellData[][],
  requiredShapes: ShapeBankItem[]
): ValidationResult => {
  const result: ValidationResult = {
    isValid: false,
    allCellsPainted: true,
    shapeCounts: new Map(),
    errors: [],
  };

  // Check if all active cells are painted (ignoring blocked cells)
  for (const row of grid) {
    for (const cell of row) {
      if (cell.active && !cell.blocked && !cell.color) {
        result.allCellsPainted = false;
      }
    }
  }

  if (!result.allCellsPainted) {
    result.errors.push('Not all cells are painted');
    return result;
  }

  // Find all connected regions
  const regions = findConnectedRegions(grid);

  // Build a list of all required shapes with their orientations
  const shapeMatchers: { shape: Shape; orientations: Set<string> }[] = [];
  for (const item of requiredShapes) {
    shapeMatchers.push({
      shape: item.shape,
      orientations: getAllOrientations(item.shape.pattern),
    });
  }

  // Initialize shape counts
  for (const item of requiredShapes) {
    result.shapeCounts.set(item.shape.id, 0);
  }

  // Match each region to a shape
  const unmatchedRegions: [number, number][][] = [];

  for (const region of regions) {
    const regionNormalized = normalizePattern(region);
    let matched = false;

    for (const matcher of shapeMatchers) {
      if (matcher.orientations.has(regionNormalized)) {
        const count = result.shapeCounts.get(matcher.shape.id) || 0;
        result.shapeCounts.set(matcher.shape.id, count + 1);
        matched = true;
        break;
      }
    }

    if (!matched) {
      unmatchedRegions.push(region);
    }
  }

  // Check for unmatched regions
  if (unmatchedRegions.length > 0) {
    result.errors.push(`${unmatchedRegions.length} region(s) don't match any required shape`);
  }

  // Verify counts match requirements
  for (const item of requiredShapes) {
    const found = result.shapeCounts.get(item.shape.id) || 0;
    if (found !== item.required) {
      result.errors.push(
        `${item.shape.name}: found ${found}, need ${item.required}`
      );
    }
  }

  result.isValid = result.errors.length === 0;
  return result;
};

// Simple check for win condition
export const checkWinCondition = (
  grid: CellData[][],
  requiredShapes: ShapeBankItem[]
): boolean => {
  const result = validateGrid(grid, requiredShapes);
  return result.isValid;
};

// Debug version that returns detailed info
export const checkWinConditionDebug = (
  grid: CellData[][],
  requiredShapes: ShapeBankItem[]
): { isValid: boolean; debug: string } => {
  const result = validateGrid(grid, requiredShapes);

  const shapeCounts = Object.fromEntries(result.shapeCounts);
  const required = requiredShapes.map(s => `${s.shape.id}:${s.required}`).join(', ');
  const found = Object.entries(shapeCounts).map(([k, v]) => `${k}:${v}`).join(', ');

  const debug = result.isValid
    ? 'SUCCESS!'
    : `Errors: ${result.errors.join('; ')} | Required: ${required} | Found: ${found}`;

  return { isValid: result.isValid, debug };
};

// Get borders for cells that are part of valid shapes
export interface CellBorders {
  [key: string]: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    valid: boolean;
  };
}

export const getValidShapeBorders = (
  grid: CellData[][],
  requiredShapes: ShapeBankItem[]
): CellBorders => {
  const borders: CellBorders = {};

  // Find all connected regions
  const regions = findConnectedRegions(grid);

  // Build shape matchers
  const shapeMatchers: { shape: Shape; orientations: Set<string> }[] = [];
  for (const item of requiredShapes) {
    shapeMatchers.push({
      shape: item.shape,
      orientations: getAllOrientations(item.shape.pattern),
    });
  }

  // Check each region
  for (const region of regions) {
    const regionNormalized = normalizePattern(region);
    let isValidShape = false;

    for (const matcher of shapeMatchers) {
      if (matcher.orientations.has(regionNormalized)) {
        isValidShape = true;
        break;
      }
    }

    if (isValidShape) {
      // Create a set of cells in this region for quick lookup
      const regionSet = new Set(region.map(([r, c]) => `${r},${c}`));

      // For each cell in the region, determine which borders to show
      for (const [r, c] of region) {
        const key = `${r},${c}`;
        borders[key] = {
          top: !regionSet.has(`${r - 1},${c}`),
          bottom: !regionSet.has(`${r + 1},${c}`),
          left: !regionSet.has(`${r},${c - 1}`),
          right: !regionSet.has(`${r},${c + 1}`),
          valid: true,
        };
      }
    }
  }

  return borders;
};
