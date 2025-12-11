import React, { useState, useEffect } from 'react';
import { Word, StudyMode } from '../types';

interface FlashcardProps {
  word: Word;
  mode: StudyMode;
  flipped: boolean;
  onFlip?: () => void;
  className?: string; // Added for positioning
  disabled?: boolean; // To prevent clicking background cards
}

const Flashcard: React.FC<FlashcardProps> = ({ word, mode, flipped, onFlip, className = '', disabled = false }) => {
  const [isFrontEnglish, setIsFrontEnglish] = useState<boolean>(true);

  useEffect(() => {
    // Determine card orientation based on mode
    if (mode === StudyMode.ENG_TO_TR) {
      setIsFrontEnglish(true);
    } else if (mode === StudyMode.TR_TO_ENG) {
      setIsFrontEnglish(false);
    } else {
      // Mixed mode: Deterministic logic based on Word ID
      // Using a hash of the ID ensures that the same word always renders with the same face,
      // preventing the card from "switching" faces when moving from the 'next' stack to 'active'.
      const sum = word.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setIsFrontEnglish(sum % 2 === 0);
    }
  }, [word.id, mode]);

  const FrontContent = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white rounded-2xl shadow-xl border border-slate-200">
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">
        {isFrontEnglish ? 'English' : 'Türkçe'}
      </span>
      
      <h2 className="text-4xl font-extrabold text-slate-800 break-words w-full mb-6">
        {isFrontEnglish ? word.en : word.tr}
      </h2>

      {/* Example Sentence on Front */}
      {isFrontEnglish && word.exampleEn && (
        <p className="text-slate-500 font-medium italic text-lg leading-snug max-w-xs">
          "{word.exampleEn}"
        </p>
      )}
      {!isFrontEnglish && word.exampleTr && (
        <p className="text-slate-500 font-medium italic text-lg leading-snug max-w-xs">
          "{word.exampleTr}"
        </p>
      )}
    </div>
  );

  const BackContent = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-indigo-50 rounded-2xl shadow-xl border border-indigo-100">
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
        {isFrontEnglish ? 'Türkçe' : 'English'} Meaning
      </span>
      
      <h2 className="text-3xl font-extrabold text-indigo-900 mb-6 break-words w-full">
        {isFrontEnglish ? word.tr : word.en}
      </h2>
      
      {/* Full Examples Context on Back */}
      {(word.exampleEn && word.exampleTr) && (
        <div className="w-full bg-white/70 p-4 rounded-xl border border-indigo-100/50 backdrop-blur-sm">
          <div className="mb-2">
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Example</span>
            <p className="text-slate-800 font-medium text-sm">"{isFrontEnglish ? word.exampleEn : word.exampleTr}"</p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-1">Translation</span>
            <p className="text-indigo-600 italic text-sm">"{isFrontEnglish ? word.exampleTr : word.exampleEn}"</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`relative w-full max-w-md h-96 perspective-1000 ${disabled ? '' : 'cursor-pointer group'} ${className}`}
      onClick={!disabled ? onFlip : undefined}
    >
      <div 
        className={`w-full h-full relative transition-all duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden">
          <FrontContent />
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <BackContent />
        </div>
      </div>
    </div>
  );
};

export default Flashcard;