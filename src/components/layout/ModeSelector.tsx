import type { AppMode } from '../../hooks/useTrainer';

interface ModeSelectorProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    onReset: () => void;
}

export function ModeSelector({ mode, setMode, onReset }: ModeSelectorProps) {
  return (
    <div className="col-span-2 flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-4">Modes</h3>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => setMode('c2-c6')}
                    className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-2 ${
                    mode === 'c2-c6' 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                    }`}
                >
                    <span>🎼</span> C2-C6
                </button>
                <button 
                    onClick={() => setMode('chords')}
                    className={`px-4 py-3 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-2 ${
                    mode === 'chords' 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                    }`}
                >
                    <span>🎹</span> Chords (C4-C5)
                </button>
            </div>
        </div>

        {/* Debug Tools */}
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 p-4 mt-auto">
            <button 
                onClick={onReset}
                className="w-full text-xs text-slate-500 hover:text-red-500 transition-colors font-medium"
            >
                Reset Progress
            </button>
        </div>
    </div>
  );
}
