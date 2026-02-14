import { useEffect } from 'react';
import { midiHandler } from '../lib/midi';
import { initInstrument } from '../lib/audio';

export function useAudio() {
  useEffect(() => {
    // 1. Initialize MIDI
    const setupMidi = async () => {
       await midiHandler.initialize();
    };
    setupMidi();
    
    // 2. Preload Piano Samples (requires user interaction)
    const tryInitAudio = () => {
        initInstrument().catch((e: unknown) => console.log("Waiting for user interaction to init audio...", e));
    };
    
    window.addEventListener('click', tryInitAudio, { once: true });
    window.addEventListener('keydown', tryInitAudio, { once: true });

    return () => {
        window.removeEventListener('click', tryInitAudio);
        window.removeEventListener('keydown', tryInitAudio);
    };
  }, []);
}
