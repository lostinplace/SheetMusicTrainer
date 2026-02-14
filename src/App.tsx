import { useState, useCallback, useEffect } from 'react';
import { StatsPanel } from './components/StatsPanel';
import { useAudio } from './hooks/useAudio';
import { useMidiInput } from './hooks/useMidiInput';
import { useTrainer } from './hooks/useTrainer';
import { Header } from './components/layout/Header';
import { GameArea } from './components/layout/GameArea';
import { PianoControl } from './components/layout/PianoControl';
import { playNote } from './lib/audio';

function App() {
  // 1. Audio Init
  useAudio();

  // 2. Core Trainer Logic
  const {
    isTrainerMode,
    isSessionActive, handleStartSession,
    isPaused, handlePause, handleResume, handleStop,
    stats, history,
    questionState,
    practiceTimer,
    wrongAttempts,
    checkAnswer,
    sessionSettings, setSessionSettings,
    isProcessingRef
  } = useTrainer();

  // 3. Input Handling
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  const handleGuess = useCallback((notes: string[]) => {
      checkAnswer(notes);
      setSelectedNotes([]); // Clear selection after MIDI guess too? Maybe not needed for MIDI, but consistency.
  }, [checkAnswer]);

  const { activeMidiNotes } = useMidiInput({ 
      onGuess: handleGuess, 
      isProcessing: isProcessingRef 
  });

  // Mouse Input
  const handleMouseNoteClick = (fullNote: string) => {
      if (!isTrainerMode) return;
      
      playNote(fullNote, 4.0);

      setSelectedNotes(prev => {
          if (prev.includes(fullNote)) {
              return prev.filter(n => n !== fullNote);
          } else {
              return [...prev, fullNote]; 
          }
      });
  };

  const handleSubmit = useCallback(() => {
        if (selectedNotes.length > 0) {
            selectedNotes.forEach(n => playNote(n));
            checkAnswer(selectedNotes);
            setSelectedNotes([]);
        }
  }, [selectedNotes, checkAnswer]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleSubmit();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]); // Dependencies

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 font-sans text-slate-800 p-6 flex flex-col">
       <Header />

       <div className="flex-1 grid grid-cols-12 gap-6 mb-6">
           {/* Center Panel (Now Main Game Area) */}
           <GameArea 
                activeCard={questionState?.card}
                history={history}
                isTrainerMode={isTrainerMode}
                practiceTimer={practiceTimer}
                wrongAttempts={wrongAttempts}
           />
           
            {/* Right Panel: Stats & Config */}
            <div className="col-span-4 flex flex-col gap-4">
                 {isTrainerMode ? (
                     <StatsPanel 
                         stats={stats} 
                         isSessionActive={isSessionActive}
                         onStartSession={handleStartSession}
                         isPaused={isPaused}
                         onPause={handlePause}
                         onResume={handleResume}
                         onStop={handleStop}
                         history={history}
                         settings={sessionSettings}
                         onSettingsChange={setSessionSettings}
                     />
                 ) : (
                     <div className="bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 text-slate-500 text-center text-sm">
                         Select a mode to start.
                     </div>
                 )}
             </div>

             {/* Piano Control: Align with game area and stats (col-11) */}
             {isTrainerMode && (
                 <div className="col-span-11 mt-4">
                    <PianoControl 
                        onNoteClick={handleMouseNoteClick}
                        activeNotes={[...activeMidiNotes, ...selectedNotes]}
                        selectedNotes={selectedNotes}
                        onSubmit={handleSubmit}
                    />
                 </div>
             )}
        </div>
    </div>
  );
}

export default App;
