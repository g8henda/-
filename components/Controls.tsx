import React, { useState } from 'react';
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
  
  const player = gameState.players.find(p => p.id === humanPlayerId);
  const isMyTurn = gameState.players[gameState.activePlayerIndex]?.id === humanPlayerId;
  
  if (!player || gameState.phase === Phase.SHOWDOWN || gameState.phase === Phase.GAME_OVER) {
    return null;
  }

  const amountToCall = gameState.currentBet - player.currentBet;
  const canCheck = amountToCall === 0;
  const minRaise = gameState.minRaise > 0 ? gameState.minRaise : gameState.config.bigBlind;

  const handleAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice(null);
    const text = await getPokerAdvice(gameState);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent flex flex-col items-center justify-end pointer-events-none">
      
      {/* Advisor Bubble */}
      {(advice || loadingAdvice) && (
        <div className="mb-4 max-w-lg w-full bg-slate-800/90 backdrop-blur-md border border-purple-500/50 p-4 rounded-xl shadow-2xl text-purple-100 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex items-start gap-3">
             <div className="p-2 bg-purple-600 rounded-full">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
             </div>
             <div className="flex-1">
                 <h4 className="font-bold text-sm text-purple-300 mb-1">Gemini Strategist</h4>
                 {loadingAdvice ? (
                     <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                 ) : (
                     <p className="text-sm leading-relaxed">{advice}</p>
                 )}
             </div>
             <button onClick={() => setAdvice(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {isMyTurn && (
            <>
                <button
                onClick={() => onAction('fold')}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transform active:scale-95 transition-all"
                >
                Fold
                </button>

                <button
                onClick={() => onAction(canCheck ? 'check' : 'call')}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transform active:scale-95 transition-all"
                >
                {canCheck ? 'Check' : `Call $${amountToCall}`}
                </button>

                <button
                onClick={() => onAction('raise', minRaise * 2)} // Simplified raise double
                className="px-6 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold shadow-lg transform active:scale-95 transition-all"
                >
                Raise ${minRaise * 2}
                </button>
                
                <button 
                  onClick={handleAdvice}
                  disabled={loadingAdvice}
                  className="ml-4 px-4 py-3 rounded-lg bg-purple-700/80 border border-purple-500 hover:bg-purple-600 text-purple-100 font-semibold backdrop-blur-sm flex items-center gap-2 transition-all"
                >
                    <span>✨ Ask AI</span>
                </button>
            </>
        )}

        {!isMyTurn && gameState.phase !== Phase.SETUP && (
            <div className="px-6 py-3 rounded-lg bg-gray-800/80 backdrop-blur text-gray-400 font-medium">
                Waiting for opponents...
            </div>
        )}
      </div>
    </div>
  );
};

export default Controls;