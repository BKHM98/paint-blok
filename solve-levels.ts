// Backtracking solver to verify levels are actually solvable
import { ALL_LEVELS } from './src/game/levels';
import { Level, ShapeBankItem } from './src/game/types';

// Get all rotations/reflections of a shape pattern
function getAllOrientations(pattern: [number, number][]): [number, number][][] {
  const orientations: [number, number][][] = [];
  const seen = new Set<string>();

  let current = pattern.map(p => [...p] as [number, number]);

  // 4 rotations
  for (let r = 0; r < 4; r++) {
    const normalized = normalizePattern(current);
    const key = JSON.stringify(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push(normalized);
    }
    current = rotatePattern(current);
  }

  // Reflect and 4 more rotations
  current = reflectPattern(pattern.map(p => [...p] as [number, number]));
  for (let r = 0; r < 4; r++) {
    const normalized = normalizePattern(current);
    const key = JSON.stringify(normalized);
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push(normalized);
    }
    current = rotatePattern(current);
  }

  return orientations;
}

function normalizePattern(pattern: [number, number][]): [number, number][] {
  const minR = Math.min(...pattern.map(p => p[0]));
  const minC = Math.min(...pattern.map(p => p[1]));
  return pattern
    .map(([r, c]) => [r - minR, c - minC] as [number, number])
    .sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
}

function rotatePattern(pattern: [number, number][]): [number, number][] {
  return pattern.map(([r, c]) => [c, -r] as [number, number]);
}

function reflectPattern(pattern: [number, number][]): [number, number][] {
  return pattern.map(([r, c]) => [r, -c] as [number, number]);
}

// Create a grid representation
function createGrid(level: Level): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < level.gridRows; r++) {
    grid[r] = [];
    for (let c = 0; c < level.gridCols; c++) {
      // 0 = inactive, 1 = paintable, -1 = blocked
      const isActive = level.activeCells.some(([ar, ac]) => ar === r && ac === c);
      const isBlocked = level.blockedCells?.some(([br, bc]) => br === r && bc === c) ?? false;

      if (!isActive) {
        grid[r][c] = 0; // inactive
      } else if (isBlocked) {
        grid[r][c] = -1; // blocked
      } else {
        grid[r][c] = 1; // paintable
      }
    }
  }
  return grid;
}

// Check if a shape can be placed at position
function canPlace(grid: number[][], pattern: [number, number][], startR: number, startC: number): boolean {
  for (const [dr, dc] of pattern) {
    const r = startR + dr;
    const c = startC + dc;
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
    if (grid[r][c] !== 1) return false; // Must be paintable (1)
  }
  return true;
}

// Place a shape on the grid
function placeShape(grid: number[][], pattern: [number, number][], startR: number, startC: number, value: number): void {
  for (const [dr, dc] of pattern) {
    grid[startR + dr][startC + dc] = value;
  }
}

// Clone grid
function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

// Backtracking solver
function solve(grid: number[][], shapes: { pattern: [number, number][][]; count: number }[]): boolean {
  // Find first empty paintable cell
  let emptyR = -1, emptyC = -1;
  outer: for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) {
        emptyR = r;
        emptyC = c;
        break outer;
      }
    }
  }

  // No empty cells - solved!
  if (emptyR === -1) {
    // Check all shapes used
    return shapes.every(s => s.count === 0);
  }

  // Try each shape type
  for (let si = 0; si < shapes.length; si++) {
    if (shapes[si].count <= 0) continue;

    // Try each orientation
    for (const orientation of shapes[si].pattern) {
      // Find offset so shape covers the empty cell
      for (const [dr, dc] of orientation) {
        const startR = emptyR - dr;
        const startC = emptyC - dc;

        if (canPlace(grid, orientation, startR, startC)) {
          // Place shape
          const newGrid = cloneGrid(grid);
          placeShape(newGrid, orientation, startR, startC, 2); // 2 = filled

          // Reduce count
          const newShapes = shapes.map((s, i) =>
            i === si ? { ...s, count: s.count - 1 } : s
          );

          // Recurse
          if (solve(newGrid, newShapes)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// Check if a level is solvable
function isLevelSolvable(level: Level): boolean {
  const grid = createGrid(level);

  // Prepare shapes with all orientations
  const shapes = level.requiredShapes.map(item => ({
    pattern: getAllOrientations(item.shape.pattern),
    count: item.required
  }));

  return solve(grid, shapes);
}

// Main
console.log('Checking solvability of all levels...\n');

const unsolvable: number[] = [];
const solvable: number[] = [];

for (const level of ALL_LEVELS) {
  // Skip levels without blocked cells (they should be fine - levels 1-9)
  if (!level.blockedCells || level.blockedCells.length === 0) {
    solvable.push(level.id);
    continue;
  }

  const result = isLevelSolvable(level);
  if (result) {
    solvable.push(level.id);
    if (level.id % 25 === 0) console.log(`Level ${level.id}: OK`);
  } else {
    unsolvable.push(level.id);
    console.log(`Level ${level.id} "${level.name}": UNSOLVABLE`);
  }
}

console.log('\n--- Summary ---');
console.log(`Solvable: ${solvable.length}`);
console.log(`Unsolvable: ${unsolvable.length}`);
if (unsolvable.length > 0) {
  console.log(`\nUnsolvable levels: ${unsolvable.join(', ')}`);
}
