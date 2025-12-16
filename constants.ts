import { IngredientDef, IngredientType } from './types';

export const INGREDIENTS: Record<IngredientType, IngredientDef> = {
  [IngredientType.BREAD]: { type: IngredientType.BREAD, emoji: '🍞', name: 'Bread', color: 'bg-orange-200 border-orange-300' },
  [IngredientType.TOMATO]: { type: IngredientType.TOMATO, emoji: '🍅', name: 'Tomato', color: 'bg-red-500' },
  [IngredientType.LETTUCE]: { type: IngredientType.LETTUCE, emoji: '🥬', name: 'Lettuce', color: 'bg-green-500' },
  [IngredientType.CHEESE]: { type: IngredientType.CHEESE, emoji: '🧀', name: 'Cheese', color: 'bg-yellow-400' },
  [IngredientType.HAM]: { type: IngredientType.HAM, emoji: '🍖', name: 'Ham', color: 'bg-pink-300' },
  [IngredientType.BACON]: { type: IngredientType.BACON, emoji: '🥓', name: 'Bacon', color: 'bg-red-700' },
  [IngredientType.EGG]: { type: IngredientType.EGG, emoji: '🍳', name: 'Egg', color: 'bg-white border-yellow-200' },
  [IngredientType.CUCUMBER]: { type: IngredientType.CUCUMBER, emoji: '🥒', name: 'Cucumber', color: 'bg-green-700' },
  [IngredientType.ONION]: { type: IngredientType.ONION, emoji: '🧅', name: 'Onion', color: 'bg-purple-200' },
  [IngredientType.PICKLE]: { type: IngredientType.PICKLE, emoji: '🥒', name: 'Pickle', color: 'bg-green-800' },
  [IngredientType.AVOCADO]: { type: IngredientType.AVOCADO, emoji: '🥑', name: 'Avocado', color: 'bg-green-300' },
  [IngredientType.POISON]: { type: IngredientType.POISON, emoji: '☠️', name: 'Poison', color: 'bg-purple-900 border-purple-500 text-white animate-pulse' },
  [IngredientType.BOMB]: { type: IngredientType.BOMB, emoji: '💣', name: 'Bomb', color: 'bg-black border-red-500 text-red-500' },
  [IngredientType.SLEEPING_PILL]: { type: IngredientType.SLEEPING_PILL, emoji: '💊', name: 'Sleep Pill', color: 'bg-indigo-500 border-indigo-300 text-white' },
};

export const LANE_COUNT = 5;
export const MAX_HP = 5; 
export const MEMORY_TIME_SEC = 5;
export const SPAWN_RATE_MS = 1100; // Increased speed (lower ms)
export const INITIAL_FALL_SPEED = 0.65; // Increased initial speed
export const GAME_TICK_MS = 16;