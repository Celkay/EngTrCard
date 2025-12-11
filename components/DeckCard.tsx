import React from 'react';
import { Deck } from '../types';

interface DeckCardProps {
  deck: Deck;
  onSelect: (deck: Deck) => void;
  className?: string;
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, onSelect, className = '' }) => {
  return (
    <div 
      onClick={() => onSelect(deck)}
      className={`bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between h-full group ${className}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
            {deck.name}
          </h3>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
            {deck.words.length} words
          </span>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2">
          {deck.description}
        </p>
      </div>
      <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
        Start Learning
        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default DeckCard;