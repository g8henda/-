import React from 'react';
import { Card as CardType, Suit } from '../types';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getCardImage = (rank: string, suit: string) => {
  const suitMap: Record<string, string> = {
    '♥': 'H', '♦': 'D', '♣': 'C', '♠': 'S'
  };
  const rankMap: Record<string, string> = {
    '10': '0'
  };
  
  const s = suitMap[suit];
  const r = rankMap[rank] || rank;
  
  return `https://deckofcardsapi.com/static/img/${r}${s}.png`;
}

const Card: React.FC<CardProps> = ({ card, hidden, className = '', size = 'md' }) => {
  // Back of card image
  const backImage = "https://upload.wikimedia.org/wikipedia/commons/d/d4/Card_back_01.svg";

  const sizeClasses = {
    sm: 'w-10 h-14',
    md: 'w-16 h-24',
    lg: 'w-24 h-36'
  };

  if (hidden || !card) {
    return (
      <div 
        className={`relative rounded-lg shadow-md transform transition-all duration-300 hover:-translate-y-1 select-none
        ${sizeClasses[size]} 
        ${className}`}
      >
        <img 
            src={backImage} 
            alt="Card Back" 
            className="w-full h-full object-cover rounded-lg border-2 border-white/20"
        />
      </div>
    );
  }

  const imageUrl = getCardImage(card.rank, card.suit);

  return (
    <div 
      className={`relative rounded-lg shadow-xl select-none transform transition-transform duration-300 hover:-translate-y-2 
      ${sizeClasses[size]} ${className}`}
    >
        <img 
            src={imageUrl} 
            alt={`${card.rank} of ${card.suit}`}
            className="w-full h-full object-contain rounded-lg"
        />
    </div>
  );
};

export default Card;