import React from 'react';

interface ChipsProps {
  amount: number;
}

const Chips: React.FC<ChipsProps> = ({ amount }) => {
  if (amount === 0) return null;

  return (
    <div className="flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
        <div className="w-4 h-4 rounded-full border-2 border-dashed border-yellow-300 bg-yellow-600 shadow-inner"></div>
        <span className="text-yellow-400 font-mono text-xs font-bold">${amount}</span>
    </div>
  );
};

export default Chips;