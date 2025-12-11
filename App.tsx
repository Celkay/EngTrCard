import React, { useState, useEffect } from 'react';
import { Word, StudyMode, Deck, GameState, StudySession, MatchingCard, QuizQuestion } from './types';
import { STARTER_DECKS } from './constants';
import Flashcard from './components/Flashcard';
import DeckCard from './components/DeckCard';
import MemoryCard from './components/MemoryCard';

const App: React.FC = () => {
  // Global State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [availableDecks] = useState<Deck[]>(STARTER_DECKS);
  
  // Selection State
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  
  // --- FLASHCARD STATE ---
  const [flashcardMode, setFlashcardMode] = useState<StudyMode>(StudyMode.ENG_TO_TR);
  const [session, setSession] = useState<StudySession>({
    correct: 0,
    incorrect: 0,
    total: 0,
    currentIndex: 0,
    shuffledWords: []
  });
  const [cardFlipped, setCardFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'down' | null>(null);

  // --- MATCHING GAME STATE ---
  const [matchingCards, setMatchingCards] = useState<MatchingCard[]>([]);
  const [firstCard, setFirstCard] = useState<MatchingCard | null>(null);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [matchScore, setMatchScore] = useState({ moves: 0, matches: 0 });

  // --- QUIZ GAME STATE ---
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswerState, setQuizAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // ==========================================
  // LOGIC: FLASHCARD
  // ==========================================

  const startFlashcardGame = () => {
    if (!selectedDeck) return;
    
    // Fisher-Yates shuffle
    const shuffled = [...selectedDeck.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setSession({
      correct: 0,
      incorrect: 0,
      total: shuffled.length,
      currentIndex: 0,
      shuffledWords: shuffled
    });
    setCardFlipped(false);
    setGameState('PLAYING_FLASHCARD');
    setIsAnimating(false);
    setExitDirection(null);
  };

  const handleNextFlashcard = (result: 'correct' | 'incorrect') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setExitDirection('down');

    setTimeout(() => {
      setSession(prev => {
        const isLast = prev.currentIndex >= prev.total - 1;
        if (isLast) {
          setTimeout(() => setGameState('SUMMARY'), 100);
          return {
            ...prev,
            correct: result === 'correct' ? prev.correct + 1 : prev.correct,
            incorrect: result === 'incorrect' ? prev.incorrect + 1 : prev.incorrect,
          };
        }
        return {
          ...prev,
          correct: result === 'correct' ? prev.correct + 1 : prev.correct,
          incorrect: result === 'incorrect' ? prev.incorrect + 1 : prev.incorrect,
          currentIndex: prev.currentIndex + 1
        };
      });
      setCardFlipped(false);
      setIsAnimating(false);
      setExitDirection(null);
    }, 400);
  };

  // ==========================================
  // LOGIC: MATCHING GAME
  // ==========================================

  const startMatchingGame = () => {
    if (!selectedDeck) return;

    // Pick random 8 words (16 cards total)
    const shuffledWords = [...selectedDeck.words].sort(() => 0.5 - Math.random()).slice(0, 8);
    
    let cards: MatchingCard[] = [];
    shuffledWords.forEach(word => {
      cards.push({ id: word.id + '-en', wordId: word.id, text: word.en, type: 'EN', isMatched: false, isFlipped: false });
      cards.push({ id: word.id + '-tr', wordId: word.id, text: word.tr, type: 'TR', isMatched: false, isFlipped: false });
    });

    // Shuffle grid
    cards.sort(() => 0.5 - Math.random());

    setMatchingCards(cards);
    setMatchScore({ moves: 0, matches: 0 });
    setFirstCard(null);
    setIsProcessingMatch(false);
    setGameState('PLAYING_MATCHING');
  };

  const handleCardClick = (card: MatchingCard) => {
    if (isProcessingMatch || card.isFlipped || card.isMatched) return;

    // Flip the clicked card
    const newCards = matchingCards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setMatchingCards(newCards);

    if (!firstCard) {
      // This is the first card picked
      setFirstCard(card);
    } else {
      // This is the second card
      setMatchScore(prev => ({ ...prev, moves: prev.moves + 1 }));
      setIsProcessingMatch(true);

      if (firstCard.wordId === card.wordId) {
        // MATCH!
        setTimeout(() => {
          setMatchingCards(prev => prev.map(c => 
            c.wordId === card.wordId ? { ...c, isMatched: true, isFlipped: false } : c
          ));
          setMatchScore(prev => ({ ...prev, matches: prev.matches + 1 }));
          setFirstCard(null);
          setIsProcessingMatch(false);
          
          // Check Win Condition
          if (matchScore.matches + 1 === matchingCards.length / 2) {
             setTimeout(() => setGameState('SUMMARY'), 1000);
          }
        }, 600);
      } else {
        // NO MATCH
        setTimeout(() => {
          setMatchingCards(prev => prev.map(c => 
            c.id === card.id || c.id === firstCard.id ? { ...c, isFlipped: false } : c
          ));
          setFirstCard(null);
          setIsProcessingMatch(false);
        }, 1000);
      }
    }
  };

  // ==========================================
  // LOGIC: QUIZ GAME
  // ==========================================

  const startQuizGame = () => {
    if (!selectedDeck) return;

    const questions: QuizQuestion[] = [];
    // Shuffle words for questions
    const shuffledWords = [...selectedDeck.words].sort(() => 0.5 - Math.random()).slice(0, 20); // Limit to 20 questions

    shuffledWords.forEach(word => {
      // Pick 3 random wrong answers from the same deck
      const distractors = selectedDeck.words
        .filter(w => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(w => w.tr);

      const options = [...distractors, word.tr].sort(() => 0.5 - Math.random());
      
      questions.push({
        word,
        options,
        correctOptionIndex: options.indexOf(word.tr)
      });
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizAnswerState('idle');
    setGameState('PLAYING_QUIZ');
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    if (quizAnswerState !== 'idle') return;

    const currentQ = quizQuestions[currentQuizIndex];
    const isCorrect = selectedIndex === currentQ.correctOptionIndex;

    setQuizAnswerState(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setQuizScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
        setQuizAnswerState('idle');
      } else {
        setGameState('SUMMARY');
      }
    }, 1200);
  };


  // ==========================================
  // VIEWS
  // ==========================================

  const renderMenu = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
          LinguaFlash
        </h1>
        <p className="text-slate-600 text-lg">Kelime bilginizi oyunlarla geliştirin.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableDecks.map(deck => (
          <DeckCard 
            key={deck.id} 
            deck={deck} 
            onSelect={(d) => { setSelectedDeck(d); setGameState('DECK_DETAIL'); }} 
          />
        ))}
      </div>
    </div>
  );

  const renderDeckDetail = () => {
    if (!selectedDeck) return null;
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setGameState('MENU')} className="self-start mb-6 text-slate-500 hover:text-indigo-600 flex items-center gap-2">
          ← Paketlere Dön
        </button>
        
        <h2 className="text-4xl font-bold text-slate-800 mb-2">{selectedDeck.name}</h2>
        <p className="text-slate-500 mb-10">{selectedDeck.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Flashcard Mode */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-indigo-500 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <svg className="w-8 h-8 text-indigo-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Kelime Kartları</h3>
            <p className="text-sm text-slate-500 mb-6">Klasik öğrenme yöntemi.</p>
            
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-4 w-full">
              {(['ENG_TO_TR', 'TR_TO_ENG', 'MIXED'] as StudyMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setFlashcardMode(m)}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-all ${
                    flashcardMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {m === 'ENG_TO_TR' ? 'İng-Tr' : m === 'TR_TO_ENG' ? 'Tr-İng' : 'Karma'}
                </button>
              ))}
            </div>

            <button onClick={startFlashcardGame} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
              Başla
            </button>
          </div>

          {/* Matching Game */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-emerald-500 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
              <svg className="w-8 h-8 text-emerald-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Eşleştirme</h3>
            <p className="text-sm text-slate-500 mb-6">Kartları çevir, eşlerini bul.</p>
            <button onClick={startMatchingGame} className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 mt-auto">
              Oyna
            </button>
          </div>

          {/* Quiz Game */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-amber-500 transition-all group flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-600 transition-colors">
              <svg className="w-8 h-8 text-amber-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-2">Test Çöz</h3>
            <p className="text-sm text-slate-500 mb-6">4 şıklı hızlı kelime testi.</p>
            <button onClick={startQuizGame} className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 mt-auto">
              Test Et
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFlashcards = () => {
    const currentWord = session.shuffledWords[session.currentIndex];
    const nextWord = session.shuffledWords[session.currentIndex + 1];
    const hasNext = !!nextWord;
    const progress = ((session.currentIndex) / session.total) * 100;

    if (!currentWord) return <div>Loading...</div>;

    return (
      <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full p-6 flex flex-col gap-4 z-50">
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
             <button 
              onClick={() => setGameState('DECK_DETAIL')}
              className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Çıkış
            </button>
            <div className="flex items-center gap-6 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200">
               <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">DOĞRU</span>
                  <span className="text-emerald-600 font-bold">{session.correct}</span>
               </div>
               <div className="w-px h-8 bg-slate-100"></div>
               <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-400 font-bold tracking-wider">YANLIŞ</span>
                  <span className="text-red-500 font-bold">{session.incorrect}</span>
               </div>
            </div>
            <div className="w-24"></div> 
          </div>
          <div className="w-full max-w-2xl mx-auto h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-4xl relative">
          <div className="relative w-full max-w-md h-96">
            {hasNext && (
              <div className="absolute top-0 left-0 w-full h-full z-0">
                <Flashcard 
                  key={nextWord.id} 
                  word={nextWord}
                  mode={flashcardMode}
                  flipped={false}
                  disabled={true}
                  className="pointer-events-none"
                />
              </div>
            )}
            <div className={`absolute top-0 left-0 w-full h-full z-10 ${exitDirection === 'down' ? 'transition-all duration-400 ease-in translate-y-[120%] rotate-6 opacity-0' : 'transition-none translate-y-0 rotate-0 opacity-100'}`}>
              <Flashcard 
                key={currentWord.id}
                word={currentWord}
                mode={flashcardMode}
                flipped={cardFlipped}
                onFlip={() => !isAnimating && setCardFlipped(!cardFlipped)}
              />
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6 h-16 z-20">
            {!cardFlipped ? (
              <button 
                onClick={() => setCardFlipped(true)}
                disabled={isAnimating}
                className="px-12 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all text-lg disabled:opacity-50"
              >
                Cevabı Gör
              </button>
            ) : (
              <>
                <button 
                  onClick={() => handleNextFlashcard('incorrect')}
                  disabled={isAnimating}
                  className="flex flex-col items-center gap-1 group disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200 group-hover:border-red-500 group-hover:bg-red-500 transition-all">
                    <svg className="w-8 h-8 text-red-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <span className="text-xs font-semibold text-red-400 group-hover:text-red-600">Bilemedim</span>
                </button>
                <button 
                  onClick={() => handleNextFlashcard('correct')}
                  disabled={isAnimating}
                  className="flex flex-col items-center gap-1 group disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-200 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-all">
                    <svg className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-600">Bildim</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMatchingGame = () => (
    <div className="h-full flex flex-col p-4 bg-slate-100">
      <div className="flex justify-between items-center max-w-4xl mx-auto w-full mb-4">
        <button onClick={() => setGameState('DECK_DETAIL')} className="text-slate-500 hover:text-indigo-600 font-bold">
          ← Çıkış
        </button>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-bold text-slate-700">
            Hamle: <span className="text-indigo-600">{matchScore.moves}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-bold text-slate-700">
            Eşleşen: <span className="text-emerald-600">{matchScore.matches}</span> / {matchingCards.length / 2}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto aspect-square w-full">
          {matchingCards.map(card => (
            <MemoryCard 
              key={card.id}
              text={card.text}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuizGame = () => {
    const question = quizQuestions[currentQuizIndex];
    if (!question) return <div>Yükleniyor...</div>;

    const progress = ((currentQuizIndex) / quizQuestions.length) * 100;

    return (
      <div className="h-full flex flex-col justify-center items-center p-6 bg-slate-50">
        {/* Top Bar */}
        <div className="w-full max-w-2xl mb-8 flex justify-between items-center">
          <button onClick={() => setGameState('DECK_DETAIL')} className="text-slate-500 font-bold hover:text-amber-600">
            ← Çıkış
          </button>
          <div className="text-amber-600 font-bold text-xl">
            Skor: {quizScore}
          </div>
        </div>

        {/* Progress */}
        <div className="w-full max-w-2xl h-3 bg-slate-200 rounded-full mb-12">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question Card */}
        <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center mb-8">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 block">Kelimeyi Çevir</span>
          <h2 className="text-5xl font-extrabold text-slate-800 mb-2">{question.word.en}</h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {question.options.map((opt, idx) => {
            let btnClass = "bg-white border-2 border-slate-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50";
            
            if (quizAnswerState !== 'idle') {
               if (idx === question.correctOptionIndex) {
                 btnClass = "bg-emerald-500 border-emerald-500 text-white"; // Correct
               } else if (quizAnswerState === 'wrong' && idx !== question.correctOptionIndex) {
                 btnClass = "opacity-50 bg-slate-100 border-slate-200"; // Fade others
               }
            }

            return (
              <button
                key={idx}
                disabled={quizAnswerState !== 'idle'}
                onClick={() => handleQuizAnswer(idx)}
                className={`p-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-sm ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        
        {/* Feedback Text */}
        <div className="h-8 mt-6">
          {quizAnswerState === 'correct' && <p className="text-emerald-600 font-bold text-lg animate-bounce">Doğru! 🎉</p>}
          {quizAnswerState === 'wrong' && <p className="text-red-500 font-bold text-lg">Yanlış! 😔</p>}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    // Determine context based on previous game state (stored indirectly)
    // Simple logic: if session total > 0, it was flashcard. Else matching or quiz.
    // Ideally we store "lastMode" but let's simplify for this architecture.
    
    // Customize summary content? Let's keep it generic but encouraging.
    let title = "Oyun Bitti!";
    let scoreDisplay = null;
    let color = "indigo";

    if (session.total > 0) {
      // Flashcard Summary
      const percentage = Math.round((session.correct / session.total) * 100);
      color = percentage >= 50 ? "emerald" : "orange";
      scoreDisplay = (
        <div className="text-center">
          <p className="text-4xl font-bold mb-2">%{percentage} Başarı</p>
          <p className="text-slate-500">{session.correct} Doğru - {session.incorrect} Yanlış</p>
        </div>
      );
    } else if (quizQuestions.length > 0) {
      // Quiz Summary
      title = "Test Tamamlandı";
      color = "amber";
      scoreDisplay = (
        <div className="text-center">
           <p className="text-6xl font-bold text-amber-500 mb-2">{quizScore}</p>
           <p className="text-slate-500 text-lg">Toplam Doğru Cevap</p>
        </div>
      );
    } else {
      // Matching Summary
      title = "Mükemmel Hafıza!";
      color = "emerald";
      scoreDisplay = (
        <div className="text-center">
           <p className="text-4xl font-bold text-slate-800 mb-2">{matchScore.moves} Hamle</p>
           <p className="text-slate-500">Bütün eşleşmeleri buldun!</p>
        </div>
      );
    }

    return (
      <div className={`h-full flex flex-col items-center justify-center p-4 bg-${color}-50`}>
        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <h2 className={`text-3xl font-extrabold text-${color}-600 mb-8`}>{title}</h2>
          
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            {scoreDisplay}
          </div>

          <div className="flex flex-col gap-3">
             <button 
              onClick={() => {
                // Reset everything and go to Detail
                setSession({ correct: 0, incorrect: 0, total: 0, currentIndex: 0, shuffledWords: [] });
                setMatchingCards([]);
                setQuizQuestions([]);
                setGameState('DECK_DETAIL');
              }}
              className={`w-full py-4 bg-${color}-600 text-white rounded-xl font-bold hover:bg-${color}-700 transition-colors shadow-lg`}
            >
              Tekrar Oyna / Mod Seç
            </button>
            <button 
              onClick={() => setGameState('MENU')}
              className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Ana Menü
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto font-inter">
      {gameState === 'MENU' && renderMenu()}
      {gameState === 'DECK_DETAIL' && renderDeckDetail()}
      {gameState === 'PLAYING_FLASHCARD' && renderFlashcards()}
      {gameState === 'PLAYING_MATCHING' && renderMatchingGame()}
      {gameState === 'PLAYING_QUIZ' && renderQuizGame()}
      {gameState === 'SUMMARY' && renderSummary()}
    </div>
  );
};

export default App;
