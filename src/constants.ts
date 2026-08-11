// Canvas Constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Canvas Center
export const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
export const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;

// Element Constraints
export const MIN_ELEMENT_SIZE = 10;
export const MAX_ELEMENT_WIDTH = CANVAS_WIDTH;
export const MAX_ELEMENT_HEIGHT = CANVAS_HEIGHT;

// History Management
export const MAX_UNDO_HISTORY = 50;

// Solana Program
export const PROGRAM_ID = "5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2";
export const EPHEMERAL_ROLLUP_RPC = "https://devnet.magicblock.app";

// Local Storage Keys
export const getStorageKey = (roomId: string, type: 'elements' | 'timeline') => 
  `magic_studio_${type}_${roomId}`;

export const THEME_STORAGE_KEY = "magic_studio_theme";
