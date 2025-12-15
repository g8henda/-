import React, { useState, useEffect, useRef } from 'react';
import { GameConfig, GameState, Phase, Player, Rank, Suit } from './types';
import { createDeck, getBestHand, getBotAction } from './utils/pokerLogic';
import Card from './components/Card';
import Chips from './components/Chips';
import Controls from './components/Controls';
import PlayerAvatar from './components/PlayerAvatar';

const INITIAL_CONFIG: GameConfig = {
  playerCount: 4,
  startingChips: 2000,
  smallBlind: 10,
  bigBlind: 20,
};

const SetupScreen = ({ onStart }: { onStart: (cfg: GameConfig) => void }) => {
  const [config, setConfig] = useState(INITIAL_CONFIG);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700">
        <h1 className="text-5xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 font-serif tracking-tight">
          Texas Hold'em
        </h1>
        
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300 font-semibold">
                <span>Players</span>
                <span className="text-green-400">{config.playerCount}</span>
            </div>
            <input 
              type="range" min="2" max="9" 
              value={config.playerCount}
              onChange={(e) => setConfig({...config, playerCount: parseInt(e.target.value)})}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            />
          </div>

          <div className="space-y-2">
             <label className="block text-sm font-semibold text-slate-300">Starting Chips</label>
             <input
               type="number"
               value={config.startingChips}
               onChange={(e) => setConfig({...config, startingChips: parseInt(e.target.value)})}
               className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
             />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Small Blind</label>
                <input
                    type="number" value={config.smallBlind}
                    onChange={(e) => setConfig({...config, smallBlind: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                />
             </div>
             <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Big Blind</label>
                <input
                    type="number" value={config.bigBlind}
                    onChange={(e) => setConfig({...config, bigBlind: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                />
             </div>
          </div>

          <button 
            onClick={() => onStart(config)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-[0.98] hover:shadow-green-500/20 text-lg tracking-wide uppercase"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const turnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = (config: GameConfig) => {
    const players: Player[] = Array.from({ length: config.playerCount }).map((_, i) => ({
      id: i,
      name: i === 0 ? 'You' : `AI Player ${i}`,
      isHuman: i === 0,
      chips: config.startingChips,
      hand: [],
      currentBet: 0,
      totalHandBet: 0,
      hasFolded: false,
      isAllIn: false,
      role: '',
    }));

    setGameState({
      config,
      players,
      deck: [],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      dealerIndex: 0,
      activePlayerIndex: -1,
      phase: Phase.SETUP,
      winnerIds: [],
      winnerDescription: '',
      minRaise: config.bigBlind
    });
    setGameStarted(true);
  };

  const startHand = () => {
    if (!gameState) return;

    const deck = createDeck();
    const dealerIdx = (gameState.dealerIndex + 1) % gameState.players.length;
    const sbIdx = (dealerIdx + 1) % gameState.players.length;
    const bbIdx = (dealerIdx + 2) % gameState.players.length;
    
    const newPlayers: Player[] = gameState.players.map(p => ({
        ...p,
        hand: [deck.pop()!, deck.pop()!],
        currentBet: 0,
        totalHandBet: 0,
        hasFolded: p.chips === 0,
        isAllIn: p.chips === 0,
        role: '',
        lastAction: '',
        handDescription: ''
    }));

    // Blinds logic
    const sbAmount = Math.min(gameState.config.smallBlind, newPlayers[sbIdx].chips);
    const bbAmount = Math.min(gameState.config.bigBlind, newPlayers[bbIdx].chips);

    newPlayers[dealerIdx].role = 'D';
    newPlayers[sbIdx].role = 'SB';
    newPlayers[bbIdx].role = 'BB';

    newPlayers[sbIdx].chips -= sbAmount;
    newPlayers[sbIdx].currentBet = sbAmount;
    newPlayers[sbIdx].totalHandBet = sbAmount;
    newPlayers[sbIdx].lastAction = `SB ${sbAmount}`;

    newPlayers[bbIdx].chips -= bbAmount;
    newPlayers[bbIdx].currentBet = bbAmount;
    newPlayers[bbIdx].totalHandBet = bbAmount;
    newPlayers[bbIdx].lastAction = `BB ${bbAmount}`;

    const startIdx = (bbIdx + 1) % newPlayers.length;

    setGameState({
      ...gameState,
      deck,
      players: newPlayers,
      communityCards: [],
      pot: sbAmount + bbAmount,
      currentBet: gameState.config.bigBlind,
      dealerIndex: dealerIdx,
      activePlayerIndex: startIdx,
      phase: Phase.PRE_FLOP,
      winnerIds: [],
      winnerDescription: '',
      minRaise: gameState.config.bigBlind
    });
  };

  useEffect(() => {
    if (gameState?.phase === Phase.SETUP) {
        startHand();
    }
  }, [gameStarted]);

  // Turn Timer & AI Logic
  useEffect(() => {
    // Cleanup previous timers
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (!gameState || gameState.phase === Phase.GAME_OVER || gameState.phase === Phase.SHOWDOWN || gameState.phase === Phase.SETUP || gameState.activePlayerIndex === -1) return;

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer || activePlayer.hasFolded || activePlayer.isAllIn) {
        nextTurn();
        return;
    }

    // Reset timer
    setTimeLeft(15);
    
    // Start countdown
    timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                handlePlayerAction('fold'); // Auto fold on timeout
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    // AI Logic
    if (!activePlayer.isHuman) {
      // Random delay between 2 and 10 seconds
      const delay = Math.floor(Math.random() * 8000) + 2000;
      
      turnTimeoutRef.current = setTimeout(() => {
        const decision = getBotAction(activePlayer, gameState);
        handlePlayerAction(decision.action, decision.amount);
      }, delay);
    }
    
    return () => {
        if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [gameState?.activePlayerIndex, gameState?.phase]);

  const nextPhase = () => {
    if (!gameState) return;
    
    const newPlayers = gameState.players.map(p => ({...p, currentBet: 0, lastAction: ''}));
    
    let nextPhase = gameState.phase;
    let cardsToAdd = 0;

    if (gameState.phase === Phase.PRE_FLOP) {
        nextPhase = Phase.FLOP;
        cardsToAdd = 3;
    } else if (gameState.phase === Phase.FLOP) {
        nextPhase = Phase.TURN;
        cardsToAdd = 1;
    } else if (gameState.phase === Phase.TURN) {
        nextPhase = Phase.RIVER;
        cardsToAdd = 1;
    } else if (gameState.phase === Phase.RIVER) {
        handleShowdown();
        return;
    }

    const newCommunity = [...gameState.communityCards];
    const newDeck = [...gameState.deck];
    
    newDeck.pop(); // burn
    for(let i=0; i<cardsToAdd; i++) {
        newCommunity.push(newDeck.pop()!);
    }

    let nextActive = (gameState.dealerIndex + 1) % gameState.players.length;
    let loops = 0;
    while((newPlayers[nextActive].hasFolded || newPlayers[nextActive].isAllIn) && loops < newPlayers.length) {
        nextActive = (nextActive + 1) % newPlayers.length;
        loops++;
    }

    setGameState(prev => {
        if(!prev) return null;
        return {
            ...prev,
            players: newPlayers,
            deck: newDeck,
            communityCards: newCommunity,
            currentBet: 0,
            activePlayerIndex: nextActive,
            phase: nextPhase,
            minRaise: prev.config.bigBlind
        }
    });
  };

  const handleShowdown = () => {
     if (!gameState) return;
     
     const activePlayers = gameState.players.filter(p => !p.hasFolded);
     
     let bestScore = -1;
     let winners: Player[] = [];
     let winningDesc = '';
     
     // Determine hand for ALL active players (for display)
     const playersWithHandDesc = gameState.players.map(p => {
         if (p.hasFolded) return p;
         const result = getBestHand(p.hand, gameState.communityCards);
         return { ...p, handDescription: result.name };
     });

     // Determine Winner(s)
     activePlayers.forEach(p => {
         const result = getBestHand(p.hand, gameState.communityCards);
         if (result.score > bestScore) {
             bestScore = result.score;
             winners = [p];
             winningDesc = result.name;
         } else if (result.score === bestScore) {
             winners.push(p);
         }
     });

     const winIds = winners.map(w => w.id);
     const share = Math.floor(gameState.pot / winners.length);

     const finalPlayers = playersWithHandDesc.map(p => {
         if (winIds.includes(p.id)) {
             return { ...p, chips: p.chips + share };
         }
         return p;
     });

     setGameState({
         ...gameState,
         players: finalPlayers,
         phase: Phase.GAME_OVER,
         winnerIds: winIds,
         winnerDescription: winningDesc,
         activePlayerIndex: -1
     });
  };

  const nextTurn = () => {
    if (!gameState) return;

    let nextIdx = (gameState.activePlayerIndex + 1) % gameState.players.length;
    let loopCount = 0;
    
    while ((gameState.players[nextIdx].hasFolded || gameState.players[nextIdx].isAllIn) && loopCount < gameState.players.length) {
        nextIdx = (nextIdx + 1) % gameState.players.length;
        loopCount++;
    }
    
    const activeNotFolded = gameState.players.filter(p => !p.hasFolded);
    const activeNotFoldedNotAllIn = activeNotFolded.filter(p => !p.isAllIn);

    if (activeNotFolded.length === 1) {
        // Only one player left, instant win
        const winner = activeNotFolded[0];
        setGameState(prev => prev ? ({
            ...prev,
            players: prev.players.map(p => p.id === winner.id ? {...p, chips: p.chips + prev.pot} : p),
            phase: Phase.GAME_OVER,
            winnerIds: [winner.id],
            winnerDescription: 'Opponents Folded',
            activePlayerIndex: -1
        }) : null);
        return;
    }

    const betsEqual = activeNotFolded.every(p => p.currentBet === gameState.currentBet || p.isAllIn);
    
    // Check if round is over
    if (betsEqual && (gameState.players[nextIdx].currentBet === gameState.currentBet || activeNotFoldedNotAllIn.length === 0)) {
        // Ensure everyone had a chance to act.
        // Simplified check: If the next player has already put in the max bet, and everyone is equal, proceed.
        nextPhase();
        return;
    }

    setGameState(prev => prev ? ({ ...prev, activePlayerIndex: nextIdx }) : null);
  };

  const handlePlayerAction = (action: string, amount: number = 0) => {
    if (!gameState) return;
    
    // Clear Timer immediately on action
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const pIndex = gameState.activePlayerIndex;
    const player = gameState.players[pIndex];
    let newPlayers = [...gameState.players];
    let newPot = gameState.pot;
    let newCurrentBet = gameState.currentBet;
    let newPhase = gameState.phase;

    if (action === 'fold') {
        newPlayers[pIndex] = { ...player, hasFolded: true, lastAction: 'Fold' };
    } else if (action === 'check') {
        newPlayers[pIndex] = { ...player, lastAction: 'Check' };
    } else if (action === 'call') {
        const toCall = newCurrentBet - player.currentBet;
        const actualCall = Math.min(toCall, player.chips);
        newPlayers[pIndex] = {
            ...player,
            chips: player.chips - actualCall,
            currentBet: player.currentBet + actualCall,
            totalHandBet: player.totalHandBet + actualCall,
            isAllIn: player.chips - actualCall === 0,
            lastAction: 'Call'
        };
        newPot += actualCall;
    } else if (action === 'raise') {
        const raiseTo = newCurrentBet + (amount || gameState.minRaise);
        const addedChips = raiseTo - player.currentBet;
        const actualAdded = Math.min(addedChips, player.chips);
        const finalBet = player.currentBet + actualAdded;

        newPlayers[pIndex] = {
            ...player,
            chips: player.chips - actualAdded,
            currentBet: finalBet,
            totalHandBet: player.totalHandBet + actualAdded,
            isAllIn: player.chips - actualAdded === 0,
            lastAction: `Raise $${finalBet}`
        };
        newPot += actualAdded;
        newCurrentBet = finalBet;
    }

    setGameState(prev => {
        if(!prev) return null;
        return {
            ...prev,
            players: newPlayers,
            pot: newPot,
            currentBet: newCurrentBet,
        };
    });

    // Check Win/Next Phase Logic (Duplicated for atomic safety in React state updates)
    const activeNotFolded = newPlayers.filter(p => !p.hasFolded);
    const activeNotFoldedNotAllIn = activeNotFolded.filter(p => !p.isAllIn);
    
    if (activeNotFolded.length === 1) {
         setGameState(prev => prev ? ({
            ...prev,
            players: newPlayers,
            pot: newPot,
            currentBet: newCurrentBet,
            phase: Phase.GAME_OVER,
            winnerIds: [activeNotFolded[0].id],
            winnerDescription: 'Opponents Folded',
            activePlayerIndex: -1
        }) : null);
        return;
    }

    let nextIdx = (pIndex + 1) % newPlayers.length;
    while((newPlayers[nextIdx].hasFolded || newPlayers[nextIdx].isAllIn) && nextIdx !== pIndex) {
        nextIdx = (nextIdx + 1) % newPlayers.length;
    }

    const allMatched = activeNotFolded.every(p => p.currentBet === newCurrentBet || p.isAllIn);
    const nextPlayer = newPlayers[nextIdx];
    
    // If action is NOT raise, and next player matches bet, and bets are equal -> End Round
    if (allMatched && action !== 'raise' && nextPlayer.currentBet === newCurrentBet && activeNotFoldedNotAllIn.length > 0) {
         const nextRoundPlayers = newPlayers.map(p => ({...p, currentBet: 0, lastAction: ''}));
         let nextGamePhase = newPhase;
         let cardsToAdd = 0;
         if (newPhase === Phase.PRE_FLOP) { nextGamePhase = Phase.FLOP; cardsToAdd = 3; }
         else if (newPhase === Phase.FLOP) { nextGamePhase = Phase.TURN; cardsToAdd = 1; }
         else if (newPhase === Phase.TURN) { nextGamePhase = Phase.RIVER; cardsToAdd = 1; }
         else if (newPhase === Phase.RIVER) { 
             // Go to Showdown Logic
             const active = activeNotFolded;
             let bestScore = -1;
             let winners: Player[] = [];
             let wDesc = '';
             
             // Calculate description for everyone
             const playersWithDesc = newPlayers.map(p => {
                 if (p.hasFolded) return p;
                 const res = getBestHand(p.hand, gameState?.communityCards || []);
                 return {...p, handDescription: res.name};
             });

             active.forEach(p => {
                 const res = getBestHand(p.hand, gameState?.communityCards || []);
                 if (res.score > bestScore) { bestScore = res.score; winners = [p]; wDesc = res.name; }
                 else if (res.score === bestScore) winners.push(p);
             });
             
             const winIds = winners.map(w => w.id);
             const share = Math.floor(newPot / winners.length);
             const finalPlayers = playersWithDesc.map(p => winIds.includes(p.id) ? {...p, chips: p.chips + share} : p);
             
             setGameState(prev => prev ? ({...prev, players: finalPlayers, pot: newPot, phase: Phase.GAME_OVER, winnerIds: winIds, winnerDescription: wDesc, activePlayerIndex: -1 }) : null);
             return;
         }

         const comm = [...(gameState?.communityCards || [])];
         const deck = [...(gameState?.deck || [])];
         deck.pop(); 
         for(let i=0; i<cardsToAdd; i++) comm.push(deck.pop()!);
         
         let nextActive = (gameState?.dealerIndex! + 1) % newPlayers.length;
         while(newPlayers[nextActive].hasFolded || newPlayers[nextActive].isAllIn) nextActive = (nextActive + 1) % newPlayers.length;

         setGameState(prev => prev ? ({
             ...prev,
             players: nextRoundPlayers,
             deck, communityCards: comm,
             currentBet: 0,
             pot: newPot,
             activePlayerIndex: nextActive,
             phase: nextGamePhase
         }) : null);

    } else {
        setGameState(prev => prev ? ({
            ...prev,
            players: newPlayers,
            pot: newPot,
            currentBet: newCurrentBet,
            activePlayerIndex: nextIdx
        }) : null);
    }
  };


  if (!gameStarted || !gameState) return <SetupScreen onStart={initGame} />;

  // ---- RENDER ----

  const getPlayerPosition = (index: number, total: number) => {
    const rotationOffset = 90; 
    const angleStep = 360 / total;
    const angleDeg = (index * angleStep) + rotationOffset;
    const angleRad = (angleDeg * Math.PI) / 180;
    const rx = 40; 
    const ry = 35; 
    const x = 50 + rx * Math.cos(angleRad);
    const y = 50 + ry * Math.sin(angleRad);
    return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' };
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-900 relative font-sans selection:bg-green-500 selection:text-white">
      
      {/* Table Felt */}
      <div className="absolute inset-4 lg:inset-12 rounded-[160px] border-[24px] border-[#3e2723] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden felt-texture flex items-center justify-center">
        
        {/* Table Branding/Logo */}
        <div className="absolute top-[25%] opacity-10 pointer-events-none">
            <span className="text-6xl font-serif text-black font-bold tracking-widest">GEMINI</span>
        </div>

        {/* Community Cards Area */}
        <div className="relative z-10 flex gap-3 h-36 items-center justify-center bg-green-900/20 backdrop-blur-sm px-8 py-4 rounded-full border border-white/5 shadow-inner">
           {gameState.communityCards.map((card, i) => (
               <Card key={i} card={card} className="shadow-2xl" />
           ))}
           {Array.from({length: 5 - gameState.communityCards.length}).map((_, i) => (
               <div key={`ph-${i}`} className="w-16 h-24 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-white/10 text-xl font-mono"></div>
           ))}
        </div>

        {/* Pot */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/10 mb-2 backdrop-blur">
                <span className="text-green-300 font-bold uppercase tracking-widest text-[10px]">Current Pot</span>
            </div>
            <Chips amount={gameState.pot} />
        </div>

        {/* Game Phase Indicator */}
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2">
             <div className="text-white/30 text-lg font-bold tracking-[0.3em] uppercase">{gameState.phase.replace('_', ' ')}</div>
        </div>
      </div>

      {/* Players */}
      {gameState.players.map((player, i) => {
          const isWinner = gameState.winnerIds.includes(player.id);
          const isActive = i === gameState.activePlayerIndex && gameState.phase !== Phase.GAME_OVER;
          
          return (
            <PlayerAvatar
                key={player.id}
                player={player}
                isActive={isActive}
                isWinner={isWinner}
                phase={gameState.phase}
                timeLeft={isActive ? timeLeft : 0}
                style={getPlayerPosition(i, gameState.players.length)}
            />
          );
      })}

      {/* Game Over / Winner Modal */}
      {gameState.phase === Phase.GAME_OVER && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-slate-900 p-10 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center max-w-2xl w-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none"></div>
                  
                  <h2 className="text-5xl font-extrabold text-white mb-2 drop-shadow-md">
                      {gameState.winnerDescription} Wins!
                  </h2>
                  <p className="text-2xl text-yellow-400 mb-8 font-mono">
                      Pot: ${gameState.pot}
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-8 mb-10">
                     {gameState.players.filter(p => gameState.winnerIds.includes(p.id)).map(p => (
                         <div key={p.id} className="flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/10">
                             <div className="text-5xl mb-2 filter drop-shadow-lg">{p.isHuman ? '😎' : '🤖'}</div>
                             <div className="font-bold text-white text-xl">{p.name}</div>
                             <div className="flex -space-x-2 mt-2">
                                 {p.hand.map((c, idx) => <Card key={idx} card={c} size="sm" />)}
                             </div>
                             <div className="mt-2 text-green-400 font-bold">+{Math.floor(gameState.pot / gameState.winnerIds.length)} chips</div>
                         </div>
                     ))}
                  </div>

                  <button 
                    onClick={startHand}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-xl transform transition-all hover:scale-105 active:scale-95 text-lg"
                  >
                      Deal Next Hand
                  </button>
              </div>
          </div>
      )}

      <Controls 
        gameState={gameState} 
        onAction={handlePlayerAction} 
        humanPlayerId={0} 
      />
    </div>
  );
}

export default App;