// Polyomino shapes for EXECUTION puzzle game
import { Shape } from './types';

// Paint colors
export const COLORS = {
  RED: '#E74C3C',
  BLUE: '#3498DB',
  GREEN: '#2ECC71',
  ORANGE: '#F39C12',
  PURPLE: '#9B59B6',
};

// Tetrominoes (4 cells each)
export const TETROMINO_I: Shape = {
  id: 'I',
  name: 'I-Block',
  pattern: [[0, 0], [0, 1], [0, 2], [0, 3]],
  color: COLORS.BLUE,
};

export const TETROMINO_O: Shape = {
  id: 'O',
  name: 'O-Block',
  pattern: [[0, 0], [0, 1], [1, 0], [1, 1]],
  color: COLORS.ORANGE,
};

export const TETROMINO_T: Shape = {
  id: 'T',
  name: 'T-Block',
  pattern: [[0, 0], [0, 1], [0, 2], [1, 1]],
  color: COLORS.PURPLE,
};

export const TETROMINO_S: Shape = {
  id: 'S',
  name: 'S-Block',
  pattern: [[0, 1], [0, 2], [1, 0], [1, 1]],
  color: COLORS.GREEN,
};

export const TETROMINO_Z: Shape = {
  id: 'Z',
  name: 'Z-Block',
  pattern: [[0, 0], [0, 1], [1, 1], [1, 2]],
  color: COLORS.RED,
};

export const TETROMINO_L: Shape = {
  id: 'L',
  name: 'L-Block',
  pattern: [[0, 0], [1, 0], [2, 0], [2, 1]],
  color: COLORS.ORANGE,
};

export const TETROMINO_J: Shape = {
  id: 'J',
  name: 'J-Block',
  pattern: [[0, 1], [1, 1], [2, 0], [2, 1]],
  color: COLORS.BLUE,
};

// Pentominoes (5 cells each)
export const PENTOMINO_F: Shape = {
  id: 'F',
  name: 'F-Pentomino',
  pattern: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  color: COLORS.RED,
};

export const PENTOMINO_P: Shape = {
  id: 'P',
  name: 'P-Pentomino',
  pattern: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  color: COLORS.GREEN,
};

export const PENTOMINO_U: Shape = {
  id: 'U',
  name: 'U-Pentomino',
  pattern: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  color: COLORS.PURPLE,
};

export const PENTOMINO_X: Shape = {
  id: 'X',
  name: 'X-Pentomino',
  pattern: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  color: COLORS.BLUE,
};

// Triominoes (3 cells each)
export const TRIOMINO_I: Shape = {
  id: 'I3',
  name: 'I-Triomino',
  pattern: [[0, 0], [0, 1], [0, 2]],
  color: COLORS.GREEN,
};

export const TRIOMINO_L: Shape = {
  id: 'L3',
  name: 'L-Triomino',
  pattern: [[0, 0], [1, 0], [1, 1]],
  color: COLORS.RED,
};

// Domino (2 cells)
export const DOMINO: Shape = {
  id: 'D',
  name: 'Domino',
  pattern: [[0, 0], [0, 1]],
  color: COLORS.ORANGE,
};

// Single cell (monomino)
export const MONOMINO: Shape = {
  id: 'M',
  name: 'Single',
  pattern: [[0, 0]],
  color: COLORS.PURPLE,
};

// All shapes for easy access
export const ALL_SHAPES: Shape[] = [
  TETROMINO_I,
  TETROMINO_O,
  TETROMINO_T,
  TETROMINO_S,
  TETROMINO_Z,
  TETROMINO_L,
  TETROMINO_J,
  PENTOMINO_F,
  PENTOMINO_P,
  PENTOMINO_U,
  PENTOMINO_X,
  TRIOMINO_I,
  TRIOMINO_L,
  DOMINO,
  MONOMINO,
];

// Helper to get shape by ID
export const getShapeById = (id: string): Shape | undefined => {
  return ALL_SHAPES.find(shape => shape.id === id);
};
