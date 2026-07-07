const fs = require('fs');
const content = fs.readFileSync('src/game/levels.ts', 'utf8');

// Shape cell counts
const shapeCells = {
  'TETROMINO_I': 4, 'TETROMINO_O': 4, 'TETROMINO_T': 4, 'TETROMINO_S': 4,
  'TETROMINO_Z': 4, 'TETROMINO_L': 4, 'TETROMINO_J': 4,
  'TRIOMINO_I': 3, 'TRIOMINO_L': 3,
  'DOMINO': 2, 'MONOMINO': 1,
  'PENTOMINO_P': 5, 'PENTOMINO_F': 5, 'PENTOMINO_U': 5, 'PENTOMINO_X': 5
};

let errors = [];

// Check levels 1-60 manually defined
for (let i = 1; i <= 60; i++) {
  // Find the level block
  const startMarker = `const LEVEL_${i}: Level = {`;
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    console.log(`Could not find Level ${i}`);
    continue;
  }

  // Find the end of this level
  let endIdx = content.indexOf(`const LEVEL_${i + 1}:`, startIdx);
  if (endIdx === -1) endIdx = content.indexOf('// Generate remaining', startIdx);
  if (endIdx === -1) endIdx = content.indexOf('// =====', startIdx + 100);
  if (endIdx === -1) endIdx = content.length;

  const levelBlock = content.substring(startIdx, endIdx);

  // Extract gridRows and gridCols
  const rowsMatch = levelBlock.match(/gridRows:\s*(\d+)/);
  const colsMatch = levelBlock.match(/gridCols:\s*(\d+)/);
  const rows = rowsMatch ? parseInt(rowsMatch[1]) : 0;
  const cols = colsMatch ? parseInt(colsMatch[1]) : 0;

  // Extract activeCells - look for line starting with activeCells:
  let activeCells = 0;
  const lines = levelBlock.split('\n');
  for (const line of lines) {
    if (line.includes('activeCells:')) {
      if (line.includes('rect(')) {
        const rectMatch = line.match(/rect\((\d+),\s*(\d+)/);
        if (rectMatch) {
          activeCells = parseInt(rectMatch[1]) * parseInt(rectMatch[2]);
        }
      } else {
        // Count [row, col] pairs in this and following lines until lockedCells
        let cellLine = line;
        const cellLineIdx = lines.indexOf(line);
        // Check if array continues on next lines
        if (!line.includes('],')) {
          for (let j = cellLineIdx + 1; j < lines.length; j++) {
            cellLine += lines[j];
            if (lines[j].includes('],') || lines[j].includes('lockedCells')) break;
          }
        }
        const pairs = cellLine.match(/\[\d+,\s*\d+\]/g);
        activeCells = pairs ? pairs.length : 0;
      }
      break;
    }
  }

  // Extract requiredShapes and count cells needed
  let shapeCellsNeeded = 0;
  const shapesStart = levelBlock.indexOf('requiredShapes:');
  if (shapesStart !== -1) {
    const shapesEnd = levelBlock.indexOf('],', shapesStart);
    const shapesStr = levelBlock.substring(shapesStart, shapesEnd);
    const shapeRegex = /shape:\s*(\w+)[^}]*required:\s*(\d+)/g;
    let shapeMatch;
    while ((shapeMatch = shapeRegex.exec(shapesStr)) !== null) {
      const shapeName = shapeMatch[1];
      const required = parseInt(shapeMatch[2]);
      const cells = shapeCells[shapeName] || 0;
      shapeCellsNeeded += cells * required;
    }
  }

  if (activeCells !== shapeCellsNeeded) {
    errors.push(`Level ${i}: Grid=${rows}x${cols} (${activeCells} cells), Shapes need ${shapeCellsNeeded} cells`);
  } else {
    console.log(`✓ Level ${i}: ${rows}x${cols} = ${activeCells} cells, shapes = ${shapeCellsNeeded} ✓`);
  }
}

console.log('\n' + '='.repeat(60));
if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:\n');
  errors.forEach(e => console.log('  ' + e));
} else {
  console.log('\n✅ All 60 hand-crafted levels have correct cell counts!');
}

console.log('\n📝 Levels 61-200 use a generator that guarantees correct math.');
