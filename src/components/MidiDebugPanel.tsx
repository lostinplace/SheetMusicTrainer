import { useEffect, useState, useRef } from 'react';
import { midiHandler } from '../lib/midi';
import { setMasterVolume, getMasterVolume } from '../lib/audio';

interface LogItem {
    id: number;
    timestamp: string;
    raw: string;
    noteNum: number;
    velocity: number;
    interpreted: string;
}

export function MidiDebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [offset, setOffset] = useState(() => midiHandler.getOctaveOffset());
    const [volume, setVolume] = useState(() => getMasterVolume());
    const [logs, setLogs] = useState<LogItem[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Listen to raw events
        const cleanup = midiHandler.addRawListener((data) => {
            const [status, noteNum, velocity] = data;
            // Only care about Note On/Off for clarity, but showing all is fine for debug
            const command = status & 0xf0;
            if (command !== 144 && command !== 128) return; // Ignore clock/control/etc for now to reduce noise

            const now = new Date().toLocaleTimeString().split(' ')[0];
            const rawStr = `[${data.join(', ')}]`;
            
            const octave = (Math.floor(noteNum / 12) - 1) + midiHandler.getOctaveOffset();
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const name = `${noteNames[noteNum % 12]}${octave}`;

            const newItem: LogItem = {
                id: Date.now() + Math.random(),
                timestamp: now,
                raw: rawStr,
                noteNum,
                velocity,
                interpreted: name
            };

            setLogs(prev => [...prev.slice(-19), newItem]); // Keep last 20
        });

        return cleanup;
    }, [offset]);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleOffsetChange = (delta: number) => {
        const newOffset = offset + delta;
        setOffset(newOffset);
        midiHandler.setOctaveOffset(newOffset);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        setMasterVolume(newVol);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && logsEndRef.current && !logsEndRef.current.closest('.midi-debug-panel')?.contains(event.target as Node)) {
               // checking if click was inside panel or button is tricky without more refs or separate components.
               // simpler: just use a ref for the whole container 
            }
        };
        if (isOpen) {
            window.addEventListener('mousedown', handleClickOutside);
        }
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative midi-debug-panel z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium border ${
                    isOpen 
                    ? 'bg-slate-800 text-indigo-400 border-indigo-500/50' 
                    : 'bg-white/50 hover:bg-white text-slate-600 border-transparent hover:border-slate-200'
                }`}
                title="MIDI Debugger"
            >
                <span>🐞</span>
                <span className="hidden sm:inline">Debug</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur text-slate-200 rounded-xl shadow-2xl border border-slate-700 overflow-hidden text-xs flex flex-col font-mono origin-top-right">
                   <div className="flex justify-between items-center bg-slate-800 p-2 border-b border-slate-700">
                       <span className="font-bold flex items-center gap-2">
                           🐞 MIDI Inspector
                       </span>
                       <div className="flex gap-2">
                           <button 
                                onClick={() => {
                                    console.clear();
                                    midiHandler.initialize();
                                }}
                                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded transition-colors"
                           >
                               Reconnect
                           </button>
                           <button onClick={() => setIsOpen(false)} className="hover:text-white px-2">✕</button>
                       </div>
                   </div>
                   
                   {/* Controls Row */}
                   <div className="p-3 bg-slate-800/50 flex flex-col gap-2 border-b border-slate-700">
                       <div className="flex justify-between items-center">
                           <span className="text-slate-400">Octave Offset</span>
                           <div className="flex items-center gap-2 bg-slate-900 rounded p-1">
                               <button 
                                    onClick={() => handleOffsetChange(-1)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded bg-slate-800 text-indigo-400 font-bold"
                                >
                                    -
                                </button>
                               <span className="w-8 text-center font-bold text-white">
                                    {offset > 0 ? `+${offset}` : offset}
                               </span>
                               <button 
                                    onClick={() => handleOffsetChange(1)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 rounded bg-slate-800 text-indigo-400 font-bold"
                                >
                                    +
                                </button>
                           </div>
                       </div>
                       
                       <div className="flex justify-between items-center">
                           <span className="text-slate-400">Master Volume</span>
                           <div className="flex items-center gap-2 w-32">
                               <input 
                                   type="range" 
                                   min="0" 
                                   max="1" 
                                   step="0.05" 
                                   value={volume} 
                                   onChange={handleVolumeChange}
                                   className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                               />
                               <span className="w-8 text-right font-mono text-xs">{Math.round(volume * 100)}%</span>
                           </div>
                       </div>
                   </div>

                   <div className="h-48 overflow-y-auto p-2 space-y-1">
                       {logs.length === 0 && (
                           <div className="text-center text-slate-600 italic py-10">
                               Waiting for MIDI events...
                           </div>
                       )}
                       {logs.map(log => (
                           <div key={log.id} className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-1">
                               <span className="text-slate-500">{log.timestamp}</span>
                               <span className="text-slate-400">{log.noteNum} <span className="text-slate-600 text-[10px]">(vel:{log.velocity})</span></span>
                               <span className="col-span-2 text-right font-bold text-emerald-400">
                                   {log.interpreted}
                               </span>
                           </div>
                       ))}
                       <div ref={logsEndRef} />
                   </div>
                </div>
            )}
        </div>
    );
}
