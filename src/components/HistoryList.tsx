import { useRef, useEffect } from 'react';
import { SheetMusicDisplay } from './SheetMusicDisplay';

export interface HistoryItem {
  id: string;
  note: string;
  xml: string;
  userGuess: string;
  isCorrect: boolean;
  timestamp: number;
  difficulty?: string;
}

interface HistoryListProps {
  history: HistoryItem[];
}

export function HistoryList({ history }: HistoryListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Render history in a scrollable list that fills available space
  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar min-h-0 px-2 flex flex-col">
      <div className="flex flex-col gap-2 pb-2 mt-auto">
        {history.length === 0 && (
            <div className="text-center text-slate-400 italic text-xs py-10 mt-10">
                History will appear here...
            </div>
        )}
        {history.map((item) => (
          <div 
            key={item.id}
            className={`flex justify-between items-center p-3 rounded-xl text-sm border shadow-sm animate-in slide-in-from-bottom-2 duration-300 ${
              item.isCorrect 
                ? 'bg-green-50/80 border-green-200 text-green-900' 
                : 'bg-red-50/80 border-red-200 text-red-900'
            }`}
          >
           <div className="flex items-center gap-4">
                <div className="bg-white/50 p-1 rounded-lg border border-black/5 w-16 h-12 flex items-center justify-center overflow-hidden">
                     {/* 
                         Zoom 0.6 to fit small box. 
                         We disable interaction or cursor if possible via pointer-events-none 
                     */}
                    <div className="pointer-events-none origin-center transform scale-75">
                         <SheetMusicDisplay xml={item.xml} zoom={0.8} />
                    </div>
                </div>
                <div>
                     <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Target</div>
                     <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700">{item.note}</span>
                        {item.difficulty && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                item.difficulty === 'Good' ? 'bg-blue-100 text-blue-700' :
                                item.difficulty === 'Hard' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {item.difficulty}
                            </span>
                        )}
                     </div>
                </div>
            </div>
            
            <div className="flex gap-4 items-center">
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">You Guessed</div>
                    <div className="font-bold text-lg">{item.userGuess}</div>
                </div>
                <span className="text-2xl font-bold w-8 text-center">{item.isCorrect ? '✓' : '✗'}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
