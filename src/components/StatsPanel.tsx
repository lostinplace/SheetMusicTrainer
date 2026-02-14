import type { HistoryItem } from './HistoryList';
import type { SessionSettings } from '../lib/scheduler';

interface StatsPanelProps {
  stats: {
    total: number;
    correct: number;
    accuracy: number;
  };
  isSessionActive?: boolean;
  onStartSession?: () => void;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  history?: HistoryItem[];
  settings?: SessionSettings;
  onSettingsChange?: (s: SessionSettings) => void;
}

export function StatsPanel({ 
    stats, 
    isSessionActive = false, 
    onStartSession, 
    isPaused = false,
    onPause,
    onResume,
    onStop,
    history = [],
    settings,
    onSettingsChange
}: StatsPanelProps) {
  
  // Aggregate History for Detailed Stats
  const detailedStats = history.reduce((acc, item) => {
      if (!acc[item.note]) {
          acc[item.note] = { note: item.note, easy: 0, good: 0, hard: 0, again: 0, total: 0 };
      }
      const entry = acc[item.note];
      entry.total++;
      if (item.difficulty === 'Easy') entry.easy++;
      else if (item.difficulty === 'Good') entry.good++;
      else if (item.difficulty === 'Hard') entry.hard++;
      else entry.again++; // "Again" or undefined/incorrect
      
      return acc;
  }, {} as Record<string, { note: string, easy: number, good: number, hard: number, again: number, total: number }>);

  const sortedItems = Object.values(detailedStats).sort((a, b) => b.total - a.total);

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-md flex flex-col rounded-2xl shadow-xl border border-white/20 text-slate-700 overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
        
        {/* Header Row */}
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {isSessionActive ? "Current Session" : (history.length > 0 ? "Session Report" : "Ready to Practice")}
                </h3>
                 <div className="flex items-center gap-2 mt-1">
                    {history.length > 0 && (
                        <>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</span>
                            <span className={`text-xl font-bold ${stats.accuracy >= 80 ? 'text-green-600' : 'text-indigo-600'}`}>
                                {stats.accuracy.toFixed(0)}%
                            </span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex gap-2">
                {isSessionActive ? (
                    <>
                        {isPaused ? (
                            <button 
                                onClick={onResume}
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                title="Resume Session"
                            >
                                ▶️ Resume
                            </button>
                        ) : (
                            <button 
                                onClick={onPause}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Pause Session"
                            >
                                ⏸️ Pause
                            </button>
                        )}
                        <button 
                            onClick={onStop}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Stop Session"
                        >
                            ⏹️ Stop
                        </button>
                    </>
                ) : (
                     <button 
                        onClick={onStartSession}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span>🚀</span> {history.length > 0 ? "New Session" : "Start Session"}
                    </button>
                )}
            </div>
        </div>

        {/* Session Settings (Only if Inactive) */}
        {!isSessionActive && settings && onSettingsChange && (
              <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Session Settings</h4>
                  
                  <div className="flex flex-col gap-3">
                      {/* Octave Range */}
                      <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Octave Range ({settings.minOctave} - {settings.maxOctave})</label>
                          <div className="flex gap-2 items-center">
                              <input 
                                  type="range" 
                                  min="1" max="8" 
                                  value={settings.minOctave}
                                  onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (val <= settings.maxOctave) onSettingsChange({ ...settings, minOctave: val });
                                  }}
                                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                              <input 
                                  type="range" 
                                  min="1" max="8" 
                                  value={settings.maxOctave}
                                  onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      if (val >= settings.minOctave) onSettingsChange({ ...settings, maxOctave: val });
                                  }}
                                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                          </div>
                      </div>

                      {/* Accidentals */}
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={settings.includeSharps}
                                  onChange={(e) => onSettingsChange({ ...settings, includeSharps: e.target.checked })}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                              />
                              <span className="text-xs font-bold text-slate-600">Sharps (♯)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={settings.includeFlats}
                                  onChange={(e) => onSettingsChange({ ...settings, includeFlats: e.target.checked })}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                              />
                              <span className="text-xs font-bold text-slate-600">Flats (♭)</span>
                          </label>
                      </div>

                      <hr className="border-slate-200" />

                      {/* Content Toggle */}
                      <div>
                           <label className="block text-xs font-semibold text-slate-400 mb-2">Practice Content</label>
                           
                           <label className="flex items-center gap-2 cursor-pointer mb-2">
                               <input 
                                   type="checkbox" 
                                   checked={settings.enableSingleNotes}
                                   onChange={(e) => onSettingsChange({ ...settings, enableSingleNotes: e.target.checked })}
                                   className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                               />
                               <span className="text-sm font-bold text-slate-700">Single Notes</span>
                           </label>
                           
                           <div className="block text-xs font-semibold text-slate-400 mb-1 mt-2">Chord Types</div>
                           <div className="grid grid-cols-2 gap-2">
                               {(['major', 'minor', 'diminished', 'augmented'] as const).map(type => (
                                   <label key={type} className="flex items-center gap-2 cursor-pointer">
                                       <input 
                                          type="checkbox" 
                                          checked={settings.chordTypes.includes(type)}
                                          onChange={(e) => {
                                              const current = settings.chordTypes;
                                              const newTypes = e.target.checked 
                                                  ? [...current, type]
                                                  : current.filter(t => t !== type);
                                              onSettingsChange({ ...settings, chordTypes: newTypes });
                                          }}
                                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                       />
                                       <span className="text-xs font-medium text-slate-600 capitalize">{type}</span>
                                   </label>
                               ))}
                           </div>
                      </div>

                  </div>
              </div>
        )}
        
        {/* Mini Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
             <div>
                <div className="font-bold text-slate-800 text-lg">{stats.total}</div>
                <div>Total</div>
             </div>
             <div>
                <div className="font-bold text-green-600 text-lg">{stats.correct}</div>
                <div>Correct</div>
             </div>
             <div>
                 <div className="font-bold text-slate-800 text-lg">{history.length}</div>
                 <div>Items</div>
             </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto max-h-[35em] custom-scrollbar px-6 pb-6">
           <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                   <tr>
                       <th className="py-2 px-2 rounded-l-lg">Note</th>
                       <th className="py-2 px-2 text-center text-green-600">Easy</th>
                       <th className="py-2 px-2 text-center text-blue-600">Good</th>
                       <th className="py-2 px-2 text-center text-yellow-600">Hard</th>
                       <th className="py-2 px-2 text-center text-red-600">Again</th>
                       <th className="py-2 px-2 text-center rounded-r-lg">Total</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {sortedItems.length === 0 ? (
                       <tr>
                           <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                               No data yet. Start playing!
                           </td>
                       </tr>
                   ) : (
                       sortedItems.map((item) => (
                           <tr key={item.note} className="hover:bg-slate-50 transition-colors">
                               <td className="py-3 px-2 font-mono font-bold text-slate-700">{item.note}</td>
                               <td className="py-3 px-2 text-center font-bold text-green-600/80">{item.easy || '-'}</td>
                               <td className="py-3 px-2 text-center font-bold text-blue-600/80">{item.good || '-'}</td>
                               <td className="py-3 px-2 text-center font-bold text-yellow-600/80">{item.hard || '-'}</td>
                               <td className="py-3 px-2 text-center font-bold text-red-600/80">{item.again || '-'}</td>
                               <td className="py-3 px-2 text-center font-bold text-slate-800">{item.total}</td>
                           </tr>
                       ))
                   )}
               </tbody>
           </table>
      </div>
    </div>
  );
}
