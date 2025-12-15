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

// Simplified Hand Evaluator
export const evaluateHand = (cards: Card[]): { score: number; name: string } => {
  if (cards.length === 0) return { score: 0, name: 'Folded' };

  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = values.every((val, i) => i === 0 || val === values[i - 1] - 1) || 
                     (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2); 

  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const countsArr = Object.entries(counts).map(([val, count]) => ({ val: Number(val), count }));
  countsArr.sort((a, b) => b.count - a.count || b.val - a.val);

  const isQuads = countsArr[0].count === 4;
  const isFullHouse = countsArr[0].count === 3 && countsArr[1].count >= 2;
  const isTrips = countsArr[0].count === 3;
  const isTwoPair = countsArr[0].count === 2 && countsArr[1].count === 2;
  const isPair = countsArr[0].count === 2;

  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) return { score: 9000, name: 'Royal Flush' };
  if (isFlush && isStraight) return { score: 8000 + values[0], name: 'Straight Flush' };
  if (isQuads) return { score: 7000 + countsArr[0].val, name: 'Four of a Kind' };
  if (isFullHouse) return { score: 6000 + countsArr[0].val, name: 'Full House' };
  if (isFlush) return { score: 5000 + values[0], name: 'Flush' };
  if (isStraight) return { score: 4000 + values[0], name: 'Straight' };
  if (isTrips) return { score: 3000 + countsArr[0].val, name: 'Three of a Kind' };
  if (isTwoPair) return { score: 2000 + countsArr[0].val * 10 + countsArr[1].val, name: 'Two Pair' };
  if (isPair) return { score: 1000 + countsArr[0].val, name: 'Pair' };

  return { score: values[0], name: 'High Card' };
};

export const getBestHand = (holeCards: Card[], communityCards: Card[]): { score: number; name: string } => {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) return evaluateHand(allCards);

  // Simplified combination check (optimization: just check simplified best 5 for speed in simulation)
  // For UI display we want accuracy, for Monte Carlo we want speed. 
  // We use the same function for now but rely on simplified evaluator.
  
  // Actually, to get a proper bot, we need slightly better eval.
  // Using the brute force combinations for 7 choose 5 (21 combos).
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

// --- MONTE CARLO SIMULATION LOGIC ---

// Create a deck excluding known cards
const createPartialDeck = (knownCards: Card[]): Card[] => {
  const fullDeck = createDeck();
  const knownStrings = new Set(knownCards.map(c => `${c.rank}${c.suit}`));
  return fullDeck.filter(c => !knownStrings.has(`${c.rank}${c.suit}`));
};

// Calculate Equity (Winning Probability)
// Runs N simulations dealing remaining community cards and random opponent hands
const calculateEquity = (holeCards: Card[], communityCards: Card[], iterations = 500): number => {
  let wins = 0;
  
  for (let i = 0; i < iterations; i++) {
    const deck = createPartialDeck([...holeCards, ...communityCards]);
    const simDeck = shuffle(deck);
    
    // Fill community cards to 5
    const simCommunity = [...communityCards];
    while (simCommunity.length < 5) {
      simCommunity.push(simDeck.pop()!);
    }
    
    // Give opponent 2 random cards
    const oppHand = [simDeck.pop()!, simDeck.pop()!];
    
    const myBest = getBestHand(holeCards, simCommunity);
    const oppBest = getBestHand(oppHand, simCommunity);
    
    if (myBest.score > oppBest.score) wins++;
    else if (myBest.score === oppBest.score) wins += 0.5; // Split
  }
  
  return wins / iterations;
};

// Pro-Level Bot Logic (GTO-inspired)
export const getBotAction = (
  bot: any, 
  gameState: any
): { action: 'fold' | 'check' | 'call' | 'raise'; amount?: number } => {
  
  const { currentBet, communityCards, pot } = gameState;
  const toCall = currentBet - bot.currentBet;
  const potOdds = toCall / (pot + toCall);
  
  // 1. Calculate Equity
  // Note: This is synchronous and might block UI slightly if iterations are too high. 500 is roughly 50-100ms.
  const equity = calculateEquity(bot.hand, communityCards, 400); 
  
  // 2. Adjust for "Implied Odds" and Bluffing based on Game Phase
  let adjustedEquity = equity;
  
  // Pre-flop hand strength heuristics to save sim time or adjust bias
  if (communityCards.length === 0) {
      const val1 = bot.hand[0].value;
      const val2 = bot.hand[1].value;
      const isPair = val1 === val2;
      const isSuited = bot.hand[0].suit === bot.hand[1].suit;
      
      // Boost equity for playable hands pre-flop so AI isn't too nitty
      if (isPair) adjustedEquity += 0.2;
      if (isSuited) adjustedEquity += 0.05;
      if (val1 + val2 > 20) adjustedEquity += 0.1;
  }

  // 3. Decision Matrix
  const randomness = Math.random();
  const aggressionFactor = Math.random(); // 0-1, specific to this turn

  // console.log(`Bot ${bot.id} Equity: ${equity.toFixed(2)}, PotOdds: ${potOdds.toFixed(2)}`);

  // Fold if equity is terrible relative to pot odds
  // We add a small margin (0.1) because we might bluff or hit implied odds
  if (equity < potOdds - 0.1 && toCall > 0) {
      // 10% chance to bluff call/raise anyway if cheap
      if (randomness > 0.9 && toCall < bot.chips * 0.1) {
           return { action: 'call' };
      }
      return { action: 'fold' };
  }

  // Check/Call
  if (equity < 0.6) {
      // If we have decent equity but not great, we check or call.
      // If toCall is huge (All In), be stricter
      if (toCall > bot.chips * 0.5 && equity < 0.4) return { action: 'fold' };
      
      if (toCall === 0) {
          // Mix in some small bluffs/stabs
          if (aggressionFactor > 0.8) return { action: 'raise', amount: gameState.config.bigBlind };
          return { action: 'check' };
      }
      return { action: 'call' };
  }

  // Strong Hand (Equity > 0.6) -> Value Bet / Raise
  if (equity >= 0.6) {
      // Slow play monster hands sometimes
      if (equity > 0.9 && randomness > 0.7 && toCall === 0) {
          return { action: 'check' };
      }

      // Raise Sizing
      // GTO often uses Geometric sizing, but we'll simplify:
      // Mix of 50% Pot, Pot, or All-In based on strength
      let raiseAmt = 0;
      if (equity > 0.85) {
          raiseAmt = pot * 1.5; // Big value
      } else {
          raiseAmt = pot * 0.75; // Standard value
      }
      
      // Ensure min raise
      raiseAmt = Math.max(raiseAmt, gameState.minRaise);
      
      // Cap at All In
      if (raiseAmt > bot.chips) raiseAmt = bot.chips;

      // If already facing a bet, ensure we raise ON TOP or just call if it's too expensive
      if (toCall > 0) {
          // If raise is small compared to stack, just call to trap?
          // No, raise for value.
          if (raiseAmt < toCall * 2) return { action: 'call' }; // Just call if our "wanted" raise is too small
          return { action: 'raise', amount: Math.floor(raiseAmt) };
      }

      return { action: 'raise', amount: Math.floor(raiseAmt) };
  }

  return { action: 'check' }; // Fallback
};