// Level Solver - Verifies that each level has at least one valid solution
// Uses backtracking to try all shape placements

const fs = require('fs');

// Shape definitions (same as in shapes.ts)
const SHAPES = {
  TETROMINO_I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  TETROMINO_O: [[0, 0], [0, 1], [1, 0], [1, 1]],
  TETROMINO_T: [[0, 0], [0, 1], [0, 2], [1, 1]],
  TETROMINO_S: [[0, 1], [0, 2], [1, 0], [1, 1]],
  TETROMINO_Z: [[0, 0], [0, 1], [1, 1], [1, 2]],
  TETROMINO_L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  TETROMINO_J: [[0, 1], [1, 1], [2, 0], [2, 1]],
  TRIOMINO_I: [[0, 0], [0, 1], [0, 2]],
  TRIOMINO_L: [[0, 0], [1, 0], [1, 1]],
  DOMINO: [[0, 0], [0, 1]],
  MONOMINO: [[0, 0]],
  PENTOMINO_P: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  PENTOMINO_F: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  PENTOMINO_U: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  PENTOMINO_X: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
};

// Get all rotations of a shape (0, 90, 180, 270 degrees)
function getRotations(pattern) {
  const rotations = [pattern];
  let current = pattern;

  for (let i = 0; i < 3; i++) {
    // Rotate 90 degrees: (r, c) -> (c, -r)
    current = current.map(([r, c]) => [c, -r]);
    // Normalize to start at (0, 0)
    const minR = Math.min(...current.map(([r]) => r));
    const minC = Math.min(...current.map(([, c]) => c));
    current = current.map(([r, c]) => [r - minR, c - minC]);

    // Check if this rotation is unique
    const key = JSON.stringify(current.sort((a, b) => a[0] - b[0] || a[1] - b[1]));
    const isDuplicate = rotations.some(rot => {
      const rotKey = JSON.stringify(rot.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]));
      return rotKey === key;
    });

    if (!isDuplicate) {
      rotations.push(current);
    }
  }

  return rotations;
}

// Get all rotations and reflections
function getAllOrientations(pattern) {
  const orientations = [];
  const seen = new Set();

  // Get rotations of original
  const rotations = getRotations(pattern);

  // Get rotations of reflected (flip horizontally)
  const reflected = pattern.map(([r, c]) => [r, -c]);
  const minC = Math.min(...reflected.map(([, c]) => c));
  const normalizedReflected = reflected.map(([r, c]) => [r, c - minC]);
  const reflectedRotations = getRotations(normalizedReflected);

  [...rotations, ...reflectedRotations].forEach(orient => {
    const key = JSON.stringify(orient.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]));
    if (!seen.has(key)) {
      seen.add(key);
      orientations.push(orient);
    }
  });

  return orientations;
}

// Check if a shape can be placed at position (startR, startC) on the grid
function canPlace(grid, pattern, startR, startC) {
  for (const [dr, dc] of pattern) {
    const r = startR + dr;
    const c = startC + dc;
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) {
      return false;
    }
    if (grid[r][c] !== 0) {
      return false; // Cell already filled or inactive
    }
  }
  return true;
}

// Place a shape on the grid
function placeShape(grid, pattern, startR, startC, colorId) {
  const newGrid = grid.map(row => [...row]);
  for (const [dr, dc] of pattern) {
    newGrid[startR + dr][startC + dc] = colorId;
  }
  return newGrid;
}

// Solve the level using backtracking
function solve(grid, shapesToPlace, colorId = 1) {
  // Check if all shapes placed
  if (shapesToPlace.length === 0) {
    // Check if grid is fully filled (all active cells colored)
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === 0) return false; // Unfilled active cell
      }
    }
    return true;
  }

  // Get next shape to place
  const [shapeName, ...remainingShapes] = shapesToPlace;
  const pattern = SHAPES[shapeName];
  if (!pattern) {
    console.log(`Unknown shape: ${shapeName}`);
    return false;
  }

  const orientations = getAllOrientations(pattern);

  // Try all positions and orientations
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      for (const orient of orientations) {
        if (canPlace(grid, orient, r, c)) {
          const newGrid = placeShape(grid, orient, r, c, colorId);
          if (solve(newGrid, remainingShapes, colorId + 1)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// Parse levels from the source file
function parseLevels() {
  const content = fs.readFileSync('src/game/levels.ts', 'utf8');
  const levels = [];

  for (let i = 1; i <= 60; i++) {
    const startMarker = `const LEVEL_${i}: Level = {`;
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) continue;

    let endIdx = content.indexOf(`const LEVEL_${i + 1}:`, startIdx);
    if (endIdx === -1) endIdx = content.indexOf('// Generate remaining', startIdx);
    if (endIdx === -1) endIdx = content.length;

    const levelBlock = content.substring(startIdx, endIdx);

    // Parse grid dimensions
    const rowsMatch = levelBlock.match(/gridRows:\s*(\d+)/);
    const colsMatch = levelBlock.match(/gridCols:\s*(\d+)/);
    const rows = rowsMatch ? parseInt(rowsMatch[1]) : 0;
    const cols = colsMatch ? parseInt(colsMatch[1]) : 0;

    // Parse active cells
    let activeCells = [];
    const lines = levelBlock.split('\n');
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (line.includes('activeCells:')) {
        if (line.includes('rect(')) {
          const rectMatch = line.match(/rect\((\d+),\s*(\d+)/);
          if (rectMatch) {
            const rRows = parseInt(rectMatch[1]);
            const rCols = parseInt(rectMatch[2]);
            for (let r = 0; r < rRows; r++) {
              for (let c = 0; c < rCols; c++) {
                activeCells.push([r, c]);
              }
            }
          }
        } else {
          let cellLine = line;
          if (!line.includes('],')) {
            for (let j = li + 1; j < lines.length; j++) {
              cellLine += lines[j];
              if (lines[j].includes('],') || lines[j].includes('lockedCells')) break;
            }
          }
          const pairs = cellLine.match(/\[(\d+),\s*(\d+)\]/g);
          if (pairs) {
            pairs.forEach(p => {
              const m = p.match(/\[(\d+),\s*(\d+)\]/);
              if (m) activeCells.push([parseInt(m[1]), parseInt(m[2])]);
            });
          }
        }
        break;
      }
    }

    // Parse required shapes
    const shapes = [];
    const shapesStart = levelBlock.indexOf('requiredShapes:');
    if (shapesStart !== -1) {
      const shapesEnd = levelBlock.indexOf('],', shapesStart);
      const shapesStr = levelBlock.substring(shapesStart, shapesEnd);
      const shapeRegex = /shape:\s*(\w+)[^}]*required:\s*(\d+)/g;
      let shapeMatch;
      while ((shapeMatch = shapeRegex.exec(shapesStr)) !== null) {
        const shapeName = shapeMatch[1];
        const required = parseInt(shapeMatch[2]);
        for (let n = 0; n < required; n++) {
          shapes.push(shapeName);
        }
      }
    }

    levels.push({ id: i, rows, cols, activeCells, shapes });
  }

  return levels;
}

// Create grid from level data
function createGrid(rows, cols, activeCells) {
  // -1 = inactive, 0 = active but empty
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(-1));
  for (const [r, c] of activeCells) {
    if (r < rows && c < cols) {
      grid[r][c] = 0;
    }
  }
  return grid;
}

// Main
console.log('Level Solver - Checking if each level is solvable\n');
console.log('='.repeat(60));

const levels = parseLevels();
let passCount = 0;
let failCount = 0;
const failures = [];

for (const level of levels) {
  const grid = createGrid(level.rows, level.cols, level.activeCells);
  const startTime = Date.now();
  const solvable = solve(grid, level.shapes);
  const elapsed = Date.now() - startTime;

  if (solvable) {
    console.log(`✓ Level ${level.id}: SOLVABLE (${elapsed}ms)`);
    passCount++;
  } else {
    console.log(`✗ Level ${level.id}: NOT SOLVABLE - ${level.rows}x${level.cols}, shapes: ${level.shapes.join(', ')}`);
    failCount++;
    failures.push(level);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\nResults: ${passCount} passed, ${failCount} failed`);

if (failures.length > 0) {
  console.log('\n❌ UNSOLVABLE LEVELS:');
  failures.forEach(l => {
    console.log(`  Level ${l.id}: ${l.rows}x${l.cols} grid, shapes: ${l.shapes.join(', ')}`);
  });
}
