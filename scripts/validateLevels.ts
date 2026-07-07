// Validation script to check all levels have correct cell counts
import { ALL_LEVELS } from '../src/game/levels';

console.log('Validating all levels...\n');

let errors = 0;
let warnings = 0;

ALL_LEVELS.forEach((level) => {
  const activeCellCount = level.activeCells.length;
  const lockedCellCount = level.lockedCells.length;
  const paintableCells = activeCellCount; // locked cells are part of active cells

  // Calculate total cells needed by shapes
  let shapeCellsTotal = 0;
  level.requiredShapes.forEach((item) => {
    const shapeCells = item.shape.pattern.length;
    shapeCellsTotal += shapeCells * item.required;
  });

  // Check if cells match
  if (shapeCellsTotal !== paintableCells) {
    console.log(`❌ Level ${level.id} (${level.name}):`);
    console.log(`   Grid: ${level.gridRows}x${level.gridCols} = ${activeCellCount} active cells`);
    console.log(`   Shapes need: ${shapeCellsTotal} cells`);
    console.log(`   Difference: ${shapeCellsTotal - paintableCells}`);
    level.requiredShapes.forEach((item) => {
      console.log(`   - ${item.required}x ${item.shape.name} (${item.shape.pattern.length} cells each) = ${item.required * item.shape.pattern.length}`);
    });
    console.log('');
    errors++;
  } else {
    // Check if shapes can physically fit
    const maxShapeWidth = Math.max(...level.requiredShapes.map(item => {
      const cols = item.shape.pattern.map(([, c]) => c);
      return Math.max(...cols) - Math.min(...cols) + 1;
    }));
    const maxShapeHeight = Math.max(...level.requiredShapes.map(item => {
      const rows = item.shape.pattern.map(([r]) => r);
      return Math.max(...rows) - Math.min(...rows) + 1;
    }));

    if (maxShapeWidth > level.gridCols && maxShapeHeight > level.gridRows) {
      console.log(`⚠️  Level ${level.id}: Shape may not fit (needs ${maxShapeWidth}x${maxShapeHeight}, grid is ${level.gridCols}x${level.gridRows})`);
      warnings++;
    }
  }
});

console.log('='.repeat(50));
console.log(`\nValidation complete!`);
console.log(`Total levels: ${ALL_LEVELS.length}`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log(`Valid: ${ALL_LEVELS.length - errors}`);

if (errors === 0) {
  console.log('\n✅ All levels have correct cell counts!');
} else {
  console.log('\n❌ Some levels need fixing!');
}
