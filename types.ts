export enum IngredientType {
  BREAD = 'BREAD',
  TOMATO = 'TOMATO',
  LETTUCE = 'LETTUCE',
  CHEESE = 'CHEESE',
  HAM = 'HAM',
  BACON = 'BACON',
  EGG = 'EGG',
  CUCUMBER = 'CUCUMBER',
  ONION = 'ONION',
  PICKLE = 'PICKLE',
  AVOCADO = 'AVOCADO',
  POISON = 'POISON',
  BOMB = 'BOMB',
  SLEEPING_PILL = 'SLEEPING_PILL'
}

export interface IngredientDef {
  type: IngredientType;
  emoji: string;
  name: string;
  color: string;
}

export enum GameMode {
  MENU = 'MENU',
  LOBBY = 'LOBBY',
  MEMORIZE = 'MEMORIZE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameSettings {
  duration: number; // in seconds
  playerCount: 1 | 2;
}

export interface FallingItem {
  id: number;
  type: IngredientType;
  lane: number; // 0 to 4
  y: number; // 0 to 100 (percentage)
  ownerId: number; // 0 for P1, 1 for P2
}

export interface PlayerState {
  id: number;
  hp: number;
  score: number;
  consecutiveMistakes: number;
  lane: number; // 0 to 4
  y: number; // vertical position percentage (top)
  isDead: boolean;
  frozenUntil: number; // Timestamp until when the player is frozen
}