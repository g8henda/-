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
  const isGameOver = phase === Phase.GAME_OVER;
  
  // Calculate progress for the timer circle (15 seconds max)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (timeLeft / 15) * circumference;

  // Visual configs based on human/bot
  const cardSize = (player.isHuman || isGameOver) ? 'lg' : 'md';
  const containerWidth = player.isHuman ? 'w-48' : 'w-28';
  
  return (
    <div 
        className={`absolute transition-all duration-500 flex flex-col items-center pointer-events-none
            ${isFolded ? 'opacity-40 grayscale' : ''}
            ${isActive ? 'z-40 scale-105' : 'z-20'}
            ${containerWidth}
        `}
        style={style}
    >
        {/* Last Action Bubble */}
        {player.lastAction && !isFolded && !isGameOver && (
            <div className="absolute -top-12 bg-yellow-100 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce border border-yellow-300 z-50 whitespace-nowrap">
                {player.lastAction}
            </div>
        )}

        {/* Avatar Circle with Timer */}
        <div className="relative mb-2 pointer-events-auto">
             {/* Timer SVG */}
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
                 <div className="absolute -right-2 -bottom-1 w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-xs text-black border-2 border-slate-300 shadow-md z-20">
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
        <div className={`backdrop-blur-md px-2 py-1 rounded-lg text-center border shadow-lg transition-colors z-20 mb-1 w-full
            ${isActive ? 'bg-slate-800/90 border-green-500/50' : 'bg-black/60 border-white/10'}
        `}>
            <div className="text-white font-bold text-xs truncate">{player.name}</div>
            <div className="text-yellow-400 text-xs font-mono font-bold tracking-wide flex items-center justify-center gap-1">
                <span>$</span>{player.chips}
            </div>
        </div>

        {/* Cards - Positioned BELOW Name */}
        <div className={`flex justify-center transition-all duration-500 z-30 pointer-events-auto
            ${(player.isHuman || isGameOver) ? '-space-x-12' : '-space-x-8'}
            ${isGameOver ? 'translate-y-2 scale-125' : ''}
            ${isWinner ? '-translate-y-4 scale-150 z-50' : ''}
        `}>
            {player.hand.map((card, cIdx) => (
                <Card 
                    key={cIdx} 
                    card={card} 
                    // Show cards if Human, Game Over, or Showdown
                    hidden={!player.isHuman && phase !== Phase.GAME_OVER && phase !== Phase.SHOWDOWN} 
                    size={cardSize}
                    className={`transform origin-bottom shadow-2xl transition-transform hover:-translate-y-4 duration-300
                        ${cIdx === 0 ? '-rotate-3' : 'rotate-3'} 
                        ${isWinner ? 'ring-2 ring-yellow-400' : 'ring-1 ring-black/50'}
                    `}
                />
            ))}
        </div>
        
        {/* Hand Description at Showdown */}
        {(phase === Phase.GAME_OVER || phase === Phase.SHOWDOWN) && !isFolded && player.handDescription && (
            <div className={`absolute top-36 z-50 px-3 py-1 rounded-full border shadow-xl whitespace-nowrap animate-in zoom-in
                ${isWinner ? 'bg-yellow-500 text-black font-bold border-yellow-300 text-sm' : 'bg-indigo-900/90 text-indigo-100 text-[10px] border-indigo-400'}
            `}>
                {player.handDescription}
            </div>
        )}

        {/* Winner Icon */}
        {isWinner && (
            <div className="absolute -top-16 flex flex-col items-center animate-bounce z-50">
                <span className="text-5xl drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">👑</span>
            </div>
        )}
    </div>
  );
};

export default PlayerAvatar;