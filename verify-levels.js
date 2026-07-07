// Level verification script
// Run with: node verify-levels.js

const shapes = {
  I: { pattern: [[0, 0], [0, 1], [0, 2], [0, 3]], cells: 4 },
  O: { pattern: [[0, 0], [0, 1], [1, 0], [1, 1]], cells: 4 },
  T: { pattern: [[0, 0], [0, 1], [0, 2], [1, 1]], cells: 4 },
  S: { pattern: [[0, 1], [0, 2], [1, 0], [1, 1]], cells: 4 },
  Z: { pattern: [[0, 0], [0, 1], [1, 1], [1, 2]], cells: 4 },
  L: { pattern: [[0, 0], [1, 0], [2, 0], [2, 1]], cells: 4 },
  J: { pattern: [[0, 1], [1, 1], [2, 0], [2, 1]], cells: 4 },
  P: { pattern: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]], cells: 5 },
  F: { pattern: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]], cells: 5 },
  I3: { pattern: [[0, 0], [0, 1], [0, 2]], cells: 3 },
  L3: { pattern: [[0, 0], [1, 0], [1, 1]], cells: 3 },
  D: { pattern: [[0, 0], [0, 1]], cells: 2 },
  M: { pattern: [[0, 0]], cells: 1 },
};

// Read and parse levels from the file
const fs = require('fs');
const path = require('path');

const levelsFile = fs.readFileSync(path.join(__dirname, 'src/game/levels.ts'), 'utf8');

// Extract level definitions
const levelRegex = /const LEVEL_(\d+):\s*Level\s*=\s*\{([^}]+requiredShapes:[^}]+\}[^\}]*)\}/gs;

let match;
let errors = [];
let warnings = [];

// Also extract generateLevel patterns
const patternsMatch = levelsFile.match(/const patterns = \[([\s\S]*?)\];/);

console.log('=== LEVEL VERIFICATION ===\n');

// Check manually defined levels
const levelMatches = levelsFile.matchAll(/id:\s*(\d+),[\s\S]*?gridRows:\s*(\d+),[\s\S]*?gridCols:\s*(\d+),[\s\S]*?activeCells:\s*(rect\(\d+,\s*\d+\)|\[\[[\d,\s\[\]]+\]\]),[\s\S]*?requiredShapes:\s*\[([\s\S]*?)\],/g);

for (const m of levelMatches) {
  const levelId = parseInt(m[1]);
  const gridRows = parseInt(m[2]);
  const gridCols = parseInt(m[3]);
  const activeCellsStr = m[4];
  const shapesStr = m[5];

  // Calculate active cells
  let activeCells;
  if (activeCellsStr.startsWith('rect')) {
    const rectMatch = activeCellsStr.match(/rect\((\d+),\s*(\d+)\)/);
    activeCells = parseInt(rectMatch[1]) * parseInt(rectMatch[2]);
  } else {
    // Count the cells in the array
    const cellMatches = activeCellsStr.match(/\[\d+,\s*\d+\]/g);
    activeCells = cellMatches ? cellMatches.length : 0;
  }

  // Parse required shapes
  const shapeMatches = shapesStr.matchAll(/shape:\s*(TETROMINO_[A-Z]|TRIOMINO_[A-Z]|DOMINO|MONOMINO|PENTOMINO_[A-Z]),\s*required:\s*(\d+)/g);

  let totalShapeCells = 0;
  const shapeList = [];

  for (const sm of shapeMatches) {
    const shapeName = sm[1];
    const required = parseInt(sm[2]);

    // Map shape name to ID
    let shapeId;
    if (shapeName === 'DOMINO') shapeId = 'D';
    else if (shapeName === 'MONOMINO') shapeId = 'M';
    else if (shapeName.startsWith('TETROMINO_')) shapeId = shapeName.replace('TETROMINO_', '');
    else if (shapeName.startsWith('TRIOMINO_')) shapeId = shapeName.replace('TRIOMINO_', '') + '3';
    else if (shapeName.startsWith('PENTOMINO_')) shapeId = shapeName.replace('PENTOMINO_', '');

    if (shapes[shapeId]) {
      totalShapeCells += shapes[shapeId].cells * required;
      shapeList.push(`${required}×${shapeId}`);
    } else {
      errors.push(`Level ${levelId}: Unknown shape ${shapeName}`);
    }
  }

  if (activeCells !== totalShapeCells) {
    errors.push(`Level ${levelId}: Cell count mismatch! Grid has ${activeCells} cells, shapes need ${totalShapeCells} cells (${shapeList.join(', ')})`);
  } else {
    console.log(`Level ${levelId}: ✓ ${activeCells} cells = ${shapeList.join(' + ')}`);
  }
}

console.log('\n=== RESULTS ===\n');

if (errors.length === 0) {
  console.log('✓ All levels have correct cell counts!\n');
} else {
  console.log(`✗ Found ${errors.length} errors:\n`);
  errors.forEach(e => console.log('  ' + e));
}

if (warnings.length > 0) {
  console.log(`\nWarnings:\n`);
  warnings.forEach(w => console.log('  ' + w));
}
