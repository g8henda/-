import React, { useState, useEffect } from 'react';
import { GameState, Phase } from '../types';
import { getPokerAdvice } from '../services/geminiService';

interface ControlsProps {
  gameState: GameState;
  onAction: (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => void;
  humanPlayerId: number;
}

const Controls: React.FC<ControlsProps> = ({ gameState, onAction, humanPlayerId }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  
  const player = gameState.players.find(p => p.id === humanPlayerId);
  const isMyTurn = gameState.players[gameState.activePlayerIndex]?.id === humanPlayerId;
  
  const minRaise = gameState.minRaise > 0 ? gameState.minRaise : gameState.config.bigBlind;
  // Calculate max raise: chips remaining AFTER calling the current bet
  const amountToCall = player ? (gameState.currentBet - player.currentBet) : 0;
  const availableToRaise = player ? (player.chips - amountToCall) : 0;
  
  // Slider constraints
  const sliderMin = Math.min(minRaise, availableToRaise);
  const sliderMax = availableToRaise;

  // Update local raise amount when turn starts
  useEffect(() => {
      if (isMyTurn && player) {
          // Default to min raise if possible, otherwise max (all-in)
          setRaiseAmount(sliderMin > 0 ? sliderMin : availableToRaise);
      }
  }, [isMyTurn, gameState.currentBet, minRaise, availableToRaise]);

  if (!player || gameState.phase === Phase.SHOWDOWN || gameState.phase === Phase.GAME_OVER) {
    return null;
  }

  const canCheck = amountToCall === 0;

  const handleAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice(null);
    const text = await getPokerAdvice(gameState);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setRaiseAmount(parseInt(e.target.value));
  };

  const setFixedRaise = (multiplier: number) => {
      // Pot Raise Calculation:
      // A full pot-sized raise is usually: (Current Pot + Amount to Call)
      // Example: Pot 100, Bet 20. Call 20. Pot becomes 140. Raise by 140. Total 160.
      // Simplified here to: Pot * multiplier.
      const potBase = gameState.pot + amountToCall;
      let amt = Math.floor(potBase * multiplier);
      
      // Clamp to valid range
      if (amt < sliderMin) amt = sliderMin;
      if (amt > sliderMax) amt = sliderMax;
      
      setRaiseAmount(amt);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end pointer-events-none z-50">
      
      {/* Advisor Bubble */}
      {(advice || loadingAdvice) && (
        <div className="mb-6 max-w-2xl w-full bg-indigo-900/90 backdrop-blur-md border border-indigo-500/50 p-5 rounded-2xl shadow-2xl text-indigo-100 animate-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-indigo-600 rounded-full shadow-lg">
                <span className="text-xl">🤖</span>
             </div>
             <div className="flex-1">
                 <h4 className="font-bold text-base text-indigo-300 mb-1">AI Coach</h4>
                 {loadingAdvice ? (
                     <div className="flex space-x-2 mt-3">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                 ) : (
                     <p className="text-sm leading-relaxed font-medium">{advice}</p>
                 )}
             </div>
             <button onClick={() => setAdvice(null)} className="text-indigo-400 hover:text-white transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="pointer-events-auto w-full max-w-4xl flex flex-col items-center gap-4">
        
        {isMyTurn && (
            <div className="w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
                {/* Raise Controls - Only show if we have chips to raise */}
                {availableToRaise > 0 && (
                    <div className="mb-4 pb-4 border-b border-white/10">
                        <div className="flex justify-between text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">
                            <span>Raise Amount (On top of call)</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-yellow-400 text-lg font-mono">${raiseAmount}</span>
                                <span className="text-slate-500 text-xs">(Total: ${amountToCall + raiseAmount})</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-slate-500">${sliderMin}</span>
                            <input 
                                type="range" 
                                min={sliderMin} 
                                max={sliderMax} 
                                step={1}
                                value={raiseAmount}
                                onChange={handleSliderChange}
                                className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
                            />
                            <span className="text-xs font-mono text-slate-500">${sliderMax}</span>
                        </div>
                        <div className="flex justify-between mt-3 gap-2">
                             <button onClick={() => setFixedRaise(0.5)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold text-white transition border border-white/5">1/2 Pot</button>
                             <button onClick={() => setFixedRaise(1.0)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold text-white transition border border-white/5">Pot</button>
                             <button onClick={() => setRaiseAmount(sliderMax)} className="flex-1 py-2 bg-red-900/50 hover:bg-red-800 rounded text-xs font-bold text-red-200 border border-red-500/30 transition">ALL IN</button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onAction('fold')}
                        className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all"
                    >
                        Fold
                    </button>

                    <button
                        onClick={() => onAction(canCheck ? 'check' : 'call')}
                        className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {canCheck ? 'Check' : `Call $${amountToCall}`}
                    </button>

                    <button
                        onClick={() => onAction('raise', raiseAmount)}
                        disabled={availableToRaise <= 0} 
                        className="flex-1 py-4 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg shadow-lg hover:shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {availableToRaise <= 0 ? 'Maxed Out' : `Raise $${raiseAmount}`}
                    </button>
                    
                    <button 
                        onClick={handleAdvice}
                        disabled={loadingAdvice}
                        className="px-4 py-4 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold shadow-lg transition-all"
                        title="Get AI Advice"
                    >
                        💡
                    </button>
                </div>
            </div>
        )}

        {!isMyTurn && gameState.phase !== Phase.SETUP && (
            <div className="px-8 py-3 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white/70 font-mono text-sm tracking-widest uppercase animate-pulse">
                Opponents are thinking...
            </div>
        )}
      </div>
    </div>
  );
};

export default Controls;