import { useState, useRef, useEffect, useCallback } from 'react';
import { midiHandler } from '../lib/midi';
import { playNote } from '../lib/audio';

interface UseMidiInputProps {
  onGuess: (notes: string[]) => void;
  isProcessing: React.MutableRefObject<boolean>;
}

export function useMidiInput({ onGuess, isProcessing }: UseMidiInputProps) {
  const [activeMidiNotes, setActiveMidiNotes] = useState<string[]>([]);
  
  // Refs for MIDI chord phrase detection
  const heldNotesRef = useRef(new Set<string>());
  const phraseNotesRef = useRef(new Set<string>());
  const releaseTimerRef = useRef<number | null>(null);

  // Initialize MIDI
  useEffect(() => {
    // Only listener attachment here. Initialization happens in useAudio.
    const cleanup = midiHandler.addListener((note, velocity, isNoteOn) => {
      // Visual Feedback & Sound (Immediate)
      if (isNoteOn && velocity > 0) {
         // eslint-disable-next-line no-console
         console.log('MidiInput ON:', note, 'Held:', heldNotesRef.current.size, 'Processing:', isProcessing.current);
         // Check if we are interrupting a pending release (strumming/arpeggio)
         const wasTimerActive = !!releaseTimerRef.current;
         
         // Clear any pending release check
         if (releaseTimerRef.current) {
             clearTimeout(releaseTimerRef.current);
             releaseTimerRef.current = null;
         }

         // If this is the FIRST note of a new phrase (held was empty AND no timer was running), clear phrase history
         if (heldNotesRef.current.size === 0 && !wasTimerActive) {
             phraseNotesRef.current.clear();
         }

         heldNotesRef.current.add(note);
         phraseNotesRef.current.add(note);

         // Normalize MIDI velocity (0-127) to gain (0-2.0 roughly)
         playNote(note, (velocity / 127) * 2.0);
         
         // Update visual state (trigger render)
         setActiveMidiNotes(Array.from(heldNotesRef.current)); 
         
      } else {
         // Note Off
         heldNotesRef.current.delete(note);
         setActiveMidiNotes(Array.from(heldNotesRef.current));
         
         if (!isNoteOn) { // Redundant check but safe
             // If all notes are released, trigger a check after a short debounce
             if (heldNotesRef.current.size === 0) {
                 if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
                 
                 // Debounce to allow for sloppy release
                 releaseTimerRef.current = window.setTimeout(() => {
                     // Check if still empty (user didn't press again)
                     if (heldNotesRef.current.size === 0 && phraseNotesRef.current.size > 0) {
                         // Only guess if not currently processing another guess
                         if (!isProcessing.current) {
                            const guess = Array.from(phraseNotesRef.current);
                            onGuess(guess);
                            phraseNotesRef.current.clear(); // Ready for next
                         }
                     }
                     releaseTimerRef.current = null;
                 }, 30); // Reduced to 30ms to allow fast repetition
             }
         }
      }
    });

    return () => {
        cleanup();
        if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, [onGuess, isProcessing]);

  // Expose refs if needed to clear them externally
  const clearMidiState = useCallback(() => {
    heldNotesRef.current.clear();
    phraseNotesRef.current.clear();
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    setActiveMidiNotes([]);
  }, []);

  return { activeMidiNotes, clearMidiState };
}
