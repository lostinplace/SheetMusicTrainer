import { useState, useRef, useEffect, useCallback } from 'react';
import { createNewCard, scheduleReview } from '../lib/fsrs';
import { generateSingleNoteXml, identifyChord, normalizeNote } from '../lib/musicGenerator';
import type { FlashCard, Grade } from '../lib/fsrs';
import type { HistoryItem } from '../components/HistoryList';
import { getNextChallenge } from '../lib/scheduler';
import type { SessionSettings } from '../lib/scheduler';

export type AppMode = 'c2-c6' | 'chords';

export interface SessionStats {
  total: number;
  correct: number;
  accuracy: number;
}

export interface NoteStat {
    correct: number;
    total: number;
}

export function useTrainer() {
  const [mode, setModeState] = useState<AppMode>('c2-c6');
  
  // Session Settings State
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
      minOctave: 2,
      maxOctave: 6,
      includeSharps: true,
      includeFlats: true,
      enableSingleNotes: true,
      chordTypes: []
  });
  
  // Wrapper for setMode to act as Preset Applicator
  const setMode = useCallback((newMode: AppMode) => {
      setModeState(newMode);
      if (newMode === 'c2-c6') {
          setSessionSettings(prev => ({
              ...prev,
              minOctave: 2,
              maxOctave: 6,
              enableSingleNotes: true,
              chordTypes: []
          }));
      } else {
          // Chords Mode Defaults
          setSessionSettings(prev => ({
              ...prev,
              minOctave: 4,
              maxOctave: 5,
              enableSingleNotes: false,
              chordTypes: ['major', 'minor']
          }));
      }
  }, []);
  
  // Cards State with Lazy Initialization
  const [cards, setCards] = useState<FlashCard[]>(() => {
    try {
        const savedCards = localStorage.getItem('sr-sm-cards');
        if (savedCards) {
            const parsed = JSON.parse(savedCards);
            if (parsed && parsed.length > 0) {
                return parsed.map((c: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                    ...c,
                    card: {
                        ...c.card,
                        due: new Date(c.card.due),
                        last_review: c.card.last_review ? new Date(c.card.last_review) : undefined
                    }
                })).filter((c: FlashCard) => {
                    // Start basic validity check (legacy cleanup)
                    if (c.id.startsWith('note-')) {
                        const match = c.id.match(/^note-([A-G][#b]?)(-?\d+)$/);
                        if (match) {
                            const octave = parseInt(match[2], 10);
                            if (octave > 8) return false; // Sanity check
                            if (octave < 0) return false;
                        }
                    }
                    return true;
                });
            }
        }
    } catch (e) {
        console.error("Failed to load cards", e);
    }
    // Default fallback
    const { note, octave } = { note: 'C', octave: 4 };
    const xml = generateSingleNoteXml(note, octave, 'grand');
    return [createNewCard('card-1', xml, [{ note, octave }])];
  });

  // Question State
  const [questionState, setQuestionState] = useState<{ card: FlashCard, answer: Array<{note: string, octave: number}> } | null>(null);
  
  const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, accuracy: 0 });
  const [noteStats, setNoteStats] = useState<Record<string, NoteStat>>(() => {
      try {
          const saved = localStorage.getItem('sr-sm-note-stats');
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          console.error("Failed to load note stats", e);
          return {};
      }
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Practice Timer
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  const isTrainerMode = true; // Always true now

  // Persist Note Stats
  useEffect(() => {
     if (Object.keys(noteStats).length > 0) {
        localStorage.setItem('sr-sm-note-stats', JSON.stringify(noteStats));
     }
  }, [noteStats]);

    const nextQuestion = useCallback((cardsOverride?: FlashCard[]) => {
    // Smart Selection via Scheduler
    const currentCards = cardsOverride || cards;
    const challenge = getNextChallenge(currentCards, sessionSettings);
    
    setQuestionState({ 
        card: challenge.card, 
        answer: challenge.answer 
    });
    
    // Check if we need to add the new card to our 'cards' state immediately?
    if (challenge.type === 'new') {
        const newCard = challenge.card;
        // If we used an override, we need to make sure we aren't adding a duplicate that exists in the override but not in state...
        // Actually, if we are here, 'challenge' comes from 'currentCards'.
        // If 'currentCards' was passed in, it's the most up to date.
        // But setCards is based on 'prev' to be safe?
        // Or we just update state if it's new.
        
        setCards(prev => {
            if (prev.some(c => c.id === newCard.id)) return prev;
            const newCards = [...prev, newCard];
            localStorage.setItem('sr-sm-cards', JSON.stringify(newCards));
            return newCards;
        });
    }

    setPracticeTimer(0);
    setWrongAttempts(0);
  }, [cards, sessionSettings]);

  // Initial Question & Reset on Mode Change
  const prevModeRef = useRef(mode);
  useEffect(() => {
     if (mode !== prevModeRef.current) {
         prevModeRef.current = mode;
         setTimeout(() => nextQuestion(), 0);
     } else if (!questionState && cards.length > 0) {
         // Initial load if no question (and cards are ready)
         setTimeout(() => nextQuestion(), 0);
     }
  }, [mode, cards.length, nextQuestion, questionState]);

  const handleStartSession = useCallback(() => {
      setIsSessionActive(true);
      setIsPaused(false);
      setStats({ total: 0, correct: 0, accuracy: 0 });
      setHistory([]); // Clear history for the new session
      setNoteStats({});
      setPracticeTimer(0);
      setWrongAttempts(0);
      // Force new question to start fresh
      nextQuestion();
  }, [nextQuestion]);

  const handlePause = useCallback(() => setIsPaused(true), []);
  const handleResume = useCallback(() => setIsPaused(false), []);
  const handleStop = useCallback(() => {
      setIsSessionActive(false);
      setIsPaused(false);
  }, []);

  // Practice Timer Effect
  useEffect(() => {
    // Trainer Mode (c2-c6 or chords) AND Session Active AND NOT Paused
    if (isTrainerMode && isSessionActive && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setPracticeTimer(prev => prev + 1);
      }, 1000);
    } else {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
  }, [isTrainerMode, isSessionActive, isPaused, questionState]); // Added questionState dependency to force re-eval if needed


    const handleGrade = useCallback((rating: Grade): FlashCard[] => {
    const targetCard = questionState?.card;
    if (!targetCard) return cards;

    const { updatedCard } = scheduleReview(targetCard, rating);

    // Update state - Upsert
    // Check if card exists in 'cards'
    const exists = cards.some(c => c.id === targetCard.id);
    
    let updatedCards;
    if (exists) {
        updatedCards = cards.map(c => c.id === targetCard.id ? updatedCard : c);
    } else {
        updatedCards = [...cards, updatedCard];
    }
    
    setCards(updatedCards);
    
    // Persist
    localStorage.setItem('sr-sm-cards', JSON.stringify(updatedCards));
    
    return updatedCards;
  }, [questionState, cards]);
  
  
  
  // Processing Lock
   const isProcessingRef = useRef(false);

   const checkAnswer = useCallback((guessedNotes: string[]) => {
       if (isProcessingRef.current) return;
       if (!questionState) return;

       isProcessingRef.current = true;
       
       // Unlock after a short delay
       setTimeout(() => {
           isProcessingRef.current = false;
        }, 500); 
        
       const realActiveCard = questionState.card;
       if (!realActiveCard || !realActiveCard.answer) return;

       const targets = realActiveCard.answer;
       const targetVals = new Set(targets.map(t => normalizeNote(`${t.note}${t.octave}`)));
       
       const validGuesses = guessedNotes.filter(n => n);
       const guessVals = new Set(validGuesses.map(n => normalizeNote(n)));

       // Logic: Exact match of sets
       let isCorrect = false;
       if (targetVals.size === guessVals.size) {
           isCorrect = true;
           for (const val of targetVals) {
               if (!guessVals.has(val)) {
                   isCorrect = false;
                   break;
               }
           }
       }

       // Update History
       const guessLabel = validGuesses.join(', ');
       const targetLabel = targets.length > 1 
          ? identifyChord(targets)
          : targets.map(t => `${t.note}${t.octave}`).join(', ');
       
       // Calculate difficulty for history
       let difficultyLabel: string | undefined;
       if (isCorrect) {
            const score = practiceTimer + (wrongAttempts * 5.0);
            if (score <= 2.5) difficultyLabel = 'Easy';
            else if (score <= 5.5) difficultyLabel = 'Good';
            else if (score <= 10.5) difficultyLabel = 'Hard';
            else difficultyLabel = 'Again';
       } else {
           difficultyLabel = 'Again';
       }

       const newHistoryItem: HistoryItem = {
           id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
           note: targetLabel, // Display target
           xml: realActiveCard.xmlContent,
           userGuess: guessLabel,
           isCorrect,
           timestamp: Date.now(),
            difficulty: difficultyLabel
       };
       setHistory(prev => [...prev, newHistoryItem]);

        // Update Stats
       setStats(prev => {
         const newTotal = prev.total + 1;
         const newCorrect = prev.correct + (isCorrect ? 1 : 0);
         return {
           total: newTotal,
           correct: newCorrect,
           accuracy: (newCorrect / newTotal) * 100
         };
       });

       // Update Note Stats
       setNoteStats(prev => {
           const newStats = { ...prev };
           targets.forEach(t => {
               const noteKey = `${t.note}${t.octave}`;
               const current = newStats[noteKey] || { correct: 0, total: 0 };
               newStats[noteKey] = {
                   total: current.total + 1,
                   correct: current.correct + (isCorrect ? 1 : 0)
               };
           });
           return newStats;
       });

       console.log(`Guessed: ${guessLabel}. Expected: ${targetLabel}. Correct: ${isCorrect}`);
       
         if (isCorrect) {
             // Score = Time (seconds) + (Wrong Attempts * 5)
             const score = practiceTimer + (wrongAttempts * 5);
             
             // Map Score to Rating
             let rating: Grade = 3; // Default Good
             
             if (score < 2) rating = 4; // Easy
             else if (score < 5) rating = 3; // Good
             else if (score < 10) rating = 2; // Hard
             else rating = 1; // Again

             console.log(`Practice Score: ${score} (Time: ${practiceTimer}, Wrong: ${wrongAttempts}) -> Rating: ${rating}`);
             handleGrade(rating);
             
             // Next Question
             nextQuestion();

       } else {
            // Incorrect
            setWrongAttempts(prev => prev + 1);
       }
   }, [practiceTimer, wrongAttempts, questionState, nextQuestion, handleGrade]);

  const handleReset = useCallback(() => {
      setStats({ total: 0, correct: 0, accuracy: 0 });
      setNoteStats({});
      setHistory([]);
      localStorage.removeItem('sr-sm-note-stats');
      nextQuestion();
  }, [nextQuestion]);

  return {
    mode, 
    setMode,
    isTrainerMode,
    isSessionActive,
    handleStartSession,
    isPaused,
    handlePause,
    handleResume,
    handleStop,
    stats,
    history,
    questionState,
    practiceTimer,
    wrongAttempts,
    checkAnswer,
    sessionSettings,
    setSessionSettings,
    handleReset,
    isProcessingRef // Expose ref for other hooks if needed (e.g. useMidiInput)
  };
}
