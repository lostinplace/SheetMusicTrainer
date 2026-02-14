import { VirtualPiano } from '../VirtualPiano';
import { playNote } from '../../lib/audio';

interface PianoControlProps {
    onNoteClick: (fullNote: string) => void;
    activeNotes: string[];
    selectedNotes: string[];
    onSubmit: () => void;
}

export function PianoControl({
    onNoteClick,
    activeNotes,
    selectedNotes,
    onSubmit
}: PianoControlProps) {
  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-center animate-in slide-in-from-bottom-6 duration-500">
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <VirtualPiano 
                onNoteClick={onNoteClick} 
                minRange={{ note: 'A', octave: 0 }}
                maxRange={{ note: 'C', octave: 8 }}
                whiteKeyWidth={24}
                activeNotes={activeNotes}
            />
        </div>
        
        <div className="mt-4 flex gap-4">
            <button 
                onClick={onSubmit}
                disabled={selectedNotes.length === 0}
                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold shadow-lg transition-all transform active:scale-95"
            >
                Submit Guess (Space)
            </button>
            <button 
                onClick={() => {
                    // "Play the sound again" - user might mean replay Selection
                    selectedNotes.forEach(n => playNote(n));
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-semibold transition-colors"
            >
                👂 Replay Selection
            </button>
        </div>
    </div>
  );
}
