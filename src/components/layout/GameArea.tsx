import { HistoryList } from '../../components/HistoryList';
import type { HistoryItem } from '../../components/HistoryList';
import { SheetMusicDisplay } from '../../components/SheetMusicDisplay';
import type { FlashCard } from '../../lib/fsrs';

interface GameAreaProps {
  activeCard: FlashCard | undefined;
  history: HistoryItem[];
  isTrainerMode: boolean;
  practiceTimer: number;
  wrongAttempts: number;
}

export function GameArea({ 
    activeCard, 
    history, 
    isTrainerMode, 
    practiceTimer, 
    wrongAttempts 
}: GameAreaProps) {
  return (
    <div className="col-span-7 flex flex-col">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/50 flex-1 flex flex-col overflow-hidden relative">
            {activeCard ? (
                <div className="flex flex-col h-full">
                    {/* History List: Takes all available top space */}
                    <HistoryList history={history.slice(-5)} />
                    
                    {/* Practice Timer Display */}
                    {isTrainerMode && (
                        <div className="flex justify-center p-4">
                            <div className={`text-4xl font-mono font-bold ${wrongAttempts > 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                {String(Math.floor(practiceTimer / 60)).padStart(2, '0')}:{String(practiceTimer % 60).padStart(2, '0')}
                                {wrongAttempts > 0 && <span className="text-sm ml-2 text-red-400">({wrongAttempts} wrong)</span>}
                            </div>
                        </div>
                    )}
                    
                    {/* Active Challenge: Pinned to bottom */}
                    <div className="shrink-0 bg-white border-t border-slate-100 p-6 relative flex items-center justify-center min-h-[180px] z-10 transition-all duration-300">
                        <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none"></div>
                        <div className="relative z-10 flex justify-center w-full">
                            <SheetMusicDisplay xml={activeCard.xmlContent} zoom={1.5} className="w-80 mx-auto" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p>Loading...</p>
                </div>
            )}
        </div>
    </div>
  );
}
