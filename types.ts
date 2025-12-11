export interface Word {
  id: string;
  en: string;
  tr: string;
  exampleEn?: string;
  exampleTr?: string;
}

export enum StudyMode {
  ENG_TO_TR = 'ENG_TO_TR',
  TR_TO_ENG = 'TR_TO_ENG',
  MIXED = 'MIXED'
}

export interface Deck {
  id: string;
  name: string;
  words: Word[];
  description: string;
}

// GameState güncellendi: Ara ekran (DECK_DETAIL) ve yeni oyunlar eklendi
export type GameState = 'MENU' | 'DECK_DETAIL' | 'PLAYING_FLASHCARD' | 'PLAYING_MATCHING' | 'PLAYING_QUIZ' | 'SUMMARY';

export interface StudySession {
  correct: number;
  incorrect: number;
  total: number;
  currentIndex: number;
  shuffledWords: Word[];
}

// Eşleştirme oyunu için kart yapısı
export interface MatchingCard {
  id: string; // Unique ID for the card instance
  wordId: string; // ID of the word pair (to check match)
  text: string;
  type: 'EN' | 'TR';
  isMatched: boolean;
  isFlipped: boolean;
}

// Quiz oyunu için soru yapısı
export interface QuizQuestion {
  word: Word;
  options: string[]; // 4 şık (Sadece metinler)
  correctOptionIndex: number;
}
