import { Card, Rank, Suit } from '../types';

export const RANK_VALUES: Record<Rank, number> = {
  [Rank.TWO]: 2, [Rank.THREE]: 3, [Rank.FOUR]: 4, [Rank.FIVE]: 5,
  [Rank.SIX]: 6, [Rank.SEVEN]: 7, [Rank.EIGHT]: 8, [Rank.NINE]: 9,
  [Rank.TEN]: 10, [Rank.JACK]: 11, [Rank.QUEEN]: 12, [Rank.KING]: 13,
  [Rank.ACE]: 14,
};

export const createDeck = (): Card[] => {
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = Object.values(Rank);
  const deck: Card[] = [];
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    });
  });
  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Simplified Hand Evaluator for Standard Poker Hands
// Returns a score: High number = better hand.
// > 9000: Royal Flush, > 8000: Straight Flush, > 7000: Quads, etc.
export const evaluateHand = (cards: Card[]): { score: number; name: string } => {
  if (cards.length === 0) return { score: 0, name: 'Folded' };

  // Sort by value descending
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = values.every((val, i) => i === 0 || val === values[i - 1] - 1) || 
                     (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2); // A-5 wheel

  // Frequency map
  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countsArr = Object.entries(counts).map(([val, count]) => ({ val: Number(val), count }));
  countsArr.sort((a, b) => b.count - a.count || b.val - a.val); // Sort by count desc, then value desc

  const isQuads = countsArr[0].count === 4;
  const isFullHouse = countsArr[0].count === 3 && countsArr[1].count >= 2;
  const isTrips = countsArr[0].count === 3;
  const isTwoPair = countsArr[0].count === 2 && countsArr[1].count === 2;
  const isPair = countsArr[0].count === 2;

  // Royal Flush
  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) return { score: 9000, name: 'Royal Flush' };
  // Straight Flush
  if (isFlush && isStraight) return { score: 8000 + values[0], name: 'Straight Flush' };
  // Four of a Kind
  if (isQuads) return { score: 7000 + countsArr[0].val, name: 'Four of a Kind' };
  // Full House
  if (isFullHouse) return { score: 6000 + countsArr[0].val, name: 'Full House' };
  // Flush
  if (isFlush) return { score: 5000 + values[0], name: 'Flush' };
  // Straight
  if (isStraight) return { score: 4000 + values[0], name: 'Straight' };
  // Three of a Kind
  if (isTrips) return { score: 3000 + countsArr[0].val, name: 'Three of a Kind' };
  // Two Pair
  if (isTwoPair) return { score: 2000 + countsArr[0].val * 10 + countsArr[1].val, name: 'Two Pair' };
  // Pair
  if (isPair) return { score: 1000 + countsArr[0].val, name: 'Pair' };

  // High Card
  return { score: values[0], name: 'High Card' };
};

// Best 5 card hand from 7 cards (2 hole + 5 community)
export const getBestHand = (holeCards: Card[], communityCards: Card[]): { score: number; name: string } => {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) return evaluateHand(allCards); // Should not happen at showdown

  // Brute force all combinations of 5 from 7 (21 combinations)
  // Simplified: For this demo, we will take a greedy approach for some hand types or just use the evaluator on the set.
  // Actually, to be accurate, we must check combinations.
  let best = { score: -1, name: '' };
  
  const getCombinations = (arr: Card[], k: number): Card[][] => {
    if (k === 0) return [[]];
    return arr.flatMap((v, i) =>
      getCombinations(arr.slice(i + 1), k - 1).map(c => [v, ...c])
    );
  };

  const combinations = getCombinations(allCards, 5);
  for (const combo of combinations) {
    const res = evaluateHand(combo);
    if (res.score > best.score) {
      best = res;
    }
  }
  return best;
};

// Basic heuristic AI
export const getBotAction = (
  bot: any, 
  gameState: any
): { action: 'fold' | 'check' | 'call' | 'raise'; amount?: number } => {
  
  const { currentBet, communityCards } = gameState;
  const toCall = currentBet - bot.currentBet;
  
  // 1. Analyze Strength
  let strength = 0; // 0-10 scale simplified
  
  if (communityCards.length === 0) {
    // Pre-flop
    const val1 = bot.hand[0].value;
    const val2 = bot.hand[1].value;
    const isPair = val1 === val2;
    const isSuited = bot.hand[0].suit === bot.hand[1].suit;
    
    if (isPair) strength = val1 > 10 ? 9 : 6;
    else if (val1 + val2 > 24) strength = 8; // AK, AQ, KQ
    else if (isSuited && val1 + val2 > 20) strength = 6;
    else strength = 2;
  } else {
    // Post-flop
    const bestHand = getBestHand(bot.hand, communityCards);
    if (bestHand.score >= 3000) strength = 9; // Trips or better
    else if (bestHand.score >= 2000) strength = 7; // Two pair
    else if (bestHand.score >= 1000) strength = 5; // Top pair (approx)
    else strength = 1;
  }

  // 2. Decide Action
  const randomness = Math.random();
  
  if (strength >= 8) {
    // Strong hand: Raise
    const raiseAmt = Math.min(bot.chips, gameState.config.bigBlind * 3);
    if (raiseAmt > toCall) return { action: 'raise', amount: raiseAmt };
    return { action: 'call' };
  } else if (strength >= 5) {
    // Decent hand: Call
    if (toCall > bot.chips) return { action: 'fold' };
    return { action: 'call' };
  } else {
    // Weak hand
    if (toCall === 0) return { action: 'check' };
    if (randomness > 0.8) return { action: 'call' }; // Bluff catch / float
    return { action: 'fold' };
  }
};