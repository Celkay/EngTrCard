import React from 'react';

interface MemoryCardProps {
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ text, isFlipped, isMatched, onClick }) => {
  return (
    <div 
      onClick={!isMatched && !isFlipped ? onClick : undefined}
      className={`aspect-square relative cursor-pointer perspective-1000 group ${isMatched ? 'opacity-0 pointer-events-none transition-opacity duration-500' : ''}`}
    >
      <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Kapalı Kart (Arka Yüz) */}
        <div className="absolute w-full h-full backface-hidden bg-indigo-600 rounded-xl shadow-md flex items-center justify-center border-2 border-indigo-400 group-hover:scale-105 transition-transform">
          <span className="text-4xl">?</span>
        </div>

        {/* Açık Kart (Ön Yüz) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-xl shadow-xl border-2 border-indigo-200 flex items-center justify-center p-2 text-center group-hover:border-indigo-500">
          <span className="text-slate-800 font-bold text-sm sm:text-base select-none leading-tight">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
