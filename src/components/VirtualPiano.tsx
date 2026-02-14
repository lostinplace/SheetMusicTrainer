import { useEffect, useRef, useCallback } from 'react';
// import { playNote } from '../lib/audio';

interface VirtualPianoProps {
  onNoteClick: (note: string) => void;
  minRange?: { note: string, octave: number }; // Defaults to A0
  maxRange?: { note: string, octave: number }; // Defaults to C8
  whiteKeyWidth?: number;
  activeNotes?: string[];
}

const whiteKeyOffsets: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
const baseWhiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const blackKeyMap: Record<string, boolean> = {
    'C': true, 'D': true, 'E': false, 'F': true, 'G': true, 'A': true, 'B': false
};

export function VirtualPiano({ 
    onNoteClick, 
    minRange = { note: 'A', octave: 0 }, 
    maxRange = { note: 'C', octave: 8 }, 
    whiteKeyWidth = 24, // Narrower default for 88 keys 
    activeNotes = [] 
}: VirtualPianoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const height = 160; 

  // Helper: Get absolute white key index (C0 = 0)
  const getWhiteKeyIndex = (note: string, octave: number) => {
      return octave * 7 + whiteKeyOffsets[note];
  };

  const startIndex = getWhiteKeyIndex(minRange.note, minRange.octave);
  const endIndex = getWhiteKeyIndex(maxRange.note, maxRange.octave);
  const totalWhiteKeys = endIndex - startIndex + 1;
  const width = totalWhiteKeys * whiteKeyWidth;

  const blackKeyWidth = whiteKeyWidth * 0.65;
  const blackKeyHeight = height * 0.65;

  const activeNotesRef = useRef(activeNotes);
  useEffect(() => {
      activeNotesRef.current = activeNotes;
  }, [activeNotes]);

  const drawPiano = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Draw ALL White Keys first
    for (let i = 0; i < totalWhiteKeys; i++) {
        const absIndex = startIndex + i;
        const currentOctave = Math.floor(absIndex / 7);
        const noteName = baseWhiteKeys[absIndex % 7];
        // const fullNote = `${noteName}${currentOctave}`;
        
        const x = i * whiteKeyWidth;
        
        // Check exact match for white key visual (requires passed props to be precise or use helper)
        // For drawing, we'll just check if the list includes it.
        // We need to know if it's active.
        // But wait, isNoteActive uses activeNotes from closure?
        // Yes, so we need it in dependency.
        const isActive = activeNotesRef.current.includes(`${noteName}${currentOctave}`);

        ctx.fillStyle = isActive ? '#bfdbfe' : 'white'; 
        ctx.fillRect(x, 0, whiteKeyWidth, height);
        
        ctx.strokeStyle = '#94a3b8'; // Slate-400
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 0, whiteKeyWidth, height);

        // Labels for Cs
        if (noteName === 'C') {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`C${currentOctave}`, x + whiteKeyWidth / 2, height - 8);
        }
    }

    // 2. Draw Black Keys on top
    for (let i = 0; i < totalWhiteKeys - 1; i++) { // Stop before last key to avoid checking out of bounds
        const absIndex = startIndex + i;
        const currentOctave = Math.floor(absIndex / 7);
        const noteName = baseWhiteKeys[absIndex % 7];
        
        if (blackKeyMap[noteName]) {
             const fullNote = `${noteName}#${currentOctave}`; 
             
             const x = (i + 1) * whiteKeyWidth - (blackKeyWidth / 2);
             
             // Simple check
             // For flats we might need a converter if the input uses flats
             // But let's assume normalized for now or just check strictly
             const isActive = activeNotesRef.current.includes(fullNote);

             ctx.fillStyle = isActive ? '#3b82f6' : '#1e293b'; // Slate-800
             ctx.fillRect(x, 0, blackKeyWidth, blackKeyHeight);
             
             // Highlight border for active black keys
             if (!isActive) {
                 ctx.strokeStyle = '#0f172a';
                 ctx.strokeRect(x, 0, blackKeyWidth, blackKeyHeight);
             }
        }
    }
  }, [width, height, totalWhiteKeys, startIndex, whiteKeyWidth, blackKeyWidth, blackKeyHeight]); // Removed isNoteActive (using ref) and added baseWhiteKeys/blackKeyMap (needs useMemo or move out)

  useEffect(() => {
    drawPiano();
  }, [drawPiano, activeNotes]); // Re-draw when activeNotes changes (via effect dependency)

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Check Black Keys (Hit detection prioritization)
    for (let i = 0; i < totalWhiteKeys - 1; i++) {
        const absIndex = startIndex + i;
        const currentOctave = Math.floor(absIndex / 7);
        const noteName = baseWhiteKeys[absIndex % 7];

        if (blackKeyMap[noteName]) {
             const keyX = (i + 1) * whiteKeyWidth - (blackKeyWidth / 2);
             if (
                 x >= keyX && 
                 x <= keyX + blackKeyWidth && 
                 y >= 0 && 
                 y <= blackKeyHeight
             ) {
                 onNoteClick(`${noteName}#${currentOctave}`);
                 return;
             }
        }
    }

    // 2. Check White Keys
    // Simple division since we know it wasn't a black key hit
    const keyIndex = Math.floor(x / whiteKeyWidth);
    if (keyIndex >= 0 && keyIndex < totalWhiteKeys) {
        const absIndex = startIndex + keyIndex;
        const currentOctave = Math.floor(absIndex / 7);
        const noteName = baseWhiteKeys[absIndex % 7];
        onNoteClick(`${noteName}${currentOctave}`);
    }
  };

  return (
    <div className="flex justify-center">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        onClick={handleClick}
        className="cursor-pointer shadow-lg rounded-b-lg"
      />
    </div>
  );
}
