import React from 'react';
import { Player, Phase } from '../types';
import Card from './Card';

interface PlayerAvatarProps {
  player: Player;
  isActive: boolean;
  isWinner: boolean;
  phase: Phase;
  timeLeft: number;
  style: React.CSSProperties;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  player, isActive, isWinner, phase, timeLeft, style 
}) => {
  const isFolded = player.hasFolded;
  
  // Calculate progress for the timer circle (15 seconds max)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (timeLeft / 15) * circumference;

  return (
    <div 
        className={`absolute transition-all duration-500 w-32 flex flex-col items-center
            ${isFolded ? 'opacity-40 grayscale' : ''}
            ${isActive ? 'z-30 scale-110' : 'z-10'}
        `}
        style={style}
    >
        {/* Last Action Bubble */}
        {player.lastAction && !isFolded && phase !== Phase.GAME_OVER && (
            <div className="mb-2 bg-yellow-100 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce border border-yellow-300 z-40 whitespace-nowrap">
                {player.lastAction}
            </div>
        )}

        {/* Avatar Circle with Timer */}
        <div className="relative">
            {isActive && !isFolded && (
                 <svg className="absolute -top-1 -left-1 w-[72px] h-[72px] rotate-[-90deg] z-0">
                    <circle
                        cx="36" cy="36" r="32"
                        stroke="currentColor" strokeWidth="4" fill="transparent"
                        className="text-gray-700"
                    />
                    <circle
                        cx="36" cy="36" r="32"
                        stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 linear ${timeLeft <= 5 ? 'text-red-500' : 'text-green-500'}`}
                    />
                 </svg>
            )}

            <div className={`relative w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center bg-slate-800 z-10 overflow-hidden
                ${isActive ? 'border-transparent' : 'border-slate-600'}
                ${isWinner ? 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''}
            `}>
                 <span className="text-3xl">{player.isHuman ? '😎' : '🤖'}</span>
            </div>

            {/* Role Badge */}
            {player.role && (
                 <div className="absolute -right-2 -bottom-1 w-7 h-7 bg-white rounded-full flex items-center justify-center font-bold text-xs text-black border-2 border-slate-300 shadow-md z-20">
                     {player.role}
                 </div>
            )}
            
            {/* Timer Text */}
            {isActive && !isFolded && (
                <div className="absolute -top-4 right-[-10px] w-6 h-6 bg-slate-900 text-white text-[10px] rounded-full flex items-center justify-center border border-white/20 z-30">
                    {timeLeft}
                </div>
            )}
        </div>

        {/* Name & Chips */}
        <div className={`mt-2 backdrop-blur-md px-3 py-1.5 rounded-lg text-center border w-40 shadow-lg transition-colors
            ${isActive ? 'bg-slate-800/90 border-green-500/50' : 'bg-black/60 border-white/10'}
        `}>
            <div className="text-white font-bold text-sm truncate">{player.name}</div>
            <div className="text-yellow-400 text-xs font-mono font-bold tracking-wide flex items-center justify-center gap-1">
                <span>$</span>{player.chips}
            </div>
        </div>

        {/* Cards */}
        <div className={`flex -space-x-6 -mt-24 pointer-events-none transition-all duration-500 ${isWinner ? '-translate-y-4 scale-110' : ''}`}>
            {player.hand.map((card, cIdx) => (
                <Card 
                    key={cIdx} 
                    card={card} 
                    // Show cards if: Human, Game Over (and not folded), or Showdown phase
                    hidden={!player.isHuman && phase !== Phase.GAME_OVER && phase !== Phase.SHOWDOWN} 
                    size="sm"
                    className={`transform origin-bottom shadow-2xl ${cIdx === 0 ? '-rotate-6' : 'rotate-6'} ${isWinner ? 'ring-2 ring-yellow-400' : ''}`}
                />
            ))}
        </div>
        
        {/* Hand Description at Showdown */}
        {(phase === Phase.GAME_OVER || phase === Phase.SHOWDOWN) && !isFolded && player.handDescription && (
            <div className="absolute top-16 z-50 bg-indigo-900/90 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400 shadow-lg whitespace-nowrap">
                {player.handDescription}
            </div>
        )}

        {/* Winner Text */}
        {isWinner && (
            <div className="absolute -top-16 flex flex-col items-center animate-bounce">
                <span className="text-4xl drop-shadow-lg">👑</span>
            </div>
        )}
    </div>
  );
};

export default PlayerAvatar;