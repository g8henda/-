export enum Suit {
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣',
  SPADES = '♠',
}

export enum Rank {
  TWO = '2', THREE = '3', FOUR = '4', FIVE = '5', SIX = '6',
  SEVEN = '7', EIGHT = '8', NINE = '9', TEN = '10',
  JACK = 'J', QUEEN = 'Q', KING = 'K', ACE = 'A',
}

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2-14 for comparison
}

export enum Phase {
  SETUP = 'SETUP',
  PRE_FLOP = 'PRE_FLOP',
  FLOP = 'FLOP',
  TURN = 'TURN',
  RIVER = 'RIVER',
  SHOWDOWN = 'SHOWDOWN',
  GAME_OVER = 'GAME_OVER',
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  chips: number;
  hand: Card[];
  currentBet: number; // Bet in the current round
  totalHandBet: number; // Total bet in this hand (for pot splits logic simplified)
  hasFolded: boolean;
  isAllIn: boolean;
  hasActed: boolean; // Track if player has acted in the current betting round
  role?: 'D' | 'SB' | 'BB' | ''; // Dealer, Small Blind, Big Blind
  lastAction?: string; // "Check", "Call 100", "Fold"
  handDescription?: string; // e.g. "Two Pair", "High Card"
}

export interface GameConfig {
  playerCount: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

export interface GameState {
  config: GameConfig;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number; // The highest bet in the current round
  dealerIndex: number;
  activePlayerIndex: number; // Whose turn is it
  phase: Phase;
  winnerIds: number[];
  winnerDescription: string;
  minRaise: number;
}