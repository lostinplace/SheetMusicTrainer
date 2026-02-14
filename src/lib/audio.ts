import Soundfont from 'soundfont-player';

// Singleton AudioContext state
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let instrument: Soundfont.Player | null = null;
let isLoading = false;

export function getAudioContext() {
    if (!audioCtx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
            masterGain = audioCtx.createGain();
            // Default volume: Use the scale directly (100% of scale)
            masterGain.gain.value = 1.5; // Explicitly high default 
            masterGain.connect(audioCtx.destination);
        }
    }
    return { audioCtx, masterGain };
}

// We don't need scaling for samples, usually.
// Increased to 1.5 to balance loudness and dynamics.
const MASTER_GAIN_SCALE = 1.5; 

export function setMasterVolume(volume: number) {
    const { masterGain, audioCtx } = getAudioContext();
    if (masterGain && audioCtx) {
        // Clamp between 0 and 1, then scale
        const v = Math.max(0, Math.min(1, volume)) * MASTER_GAIN_SCALE;
        
        // Immediate update
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(v, audioCtx.currentTime);
        
        // console.log(`Set Master Volume: ${v} (Raw: ${volume})`);
    }
}

export function getMasterVolume(): number {
    return masterGain ? (masterGain.gain.value / MASTER_GAIN_SCALE) : 0.5;
}

// Initialize the instrument
// This needs to be called after user interaction usually
export async function initInstrument() {
    if (instrument || isLoading) return;
    
    const { audioCtx, masterGain } = getAudioContext();
    if (!audioCtx || !masterGain) return;

    try {
        isLoading = true;
        console.log("Loading Piano Samples...");
        // 'acoustic_grand_piano' is the standard MIDI piano
        // options: destination node to route audio through our master gain
        instrument = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano', { 
            destination: masterGain 
        });
        console.log("Piano Samples Loaded!");
    } catch (e) {
        console.error("Failed to load soundfont", e);
    } finally {
        isLoading = false;
    }
}

export function playNote(note: string, gain: number = 1.0) {
  const { audioCtx } = getAudioContext();
  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }

  // If instrument isn't loaded, try loading it (async), but we might miss this note.
  // Ideally App should init this on first click.
  if (!instrument) {
      initInstrument();
      return; 
  }

  // Parse note
  const match = note.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return;

  // Soundfont player takes "C4", "Db5" etc directly.
  // We just need to ensure formatting matches what it expects.
  // It handles flats/sharps.
  
  // Play the note with a fixed duration to prevent muddy sustain
  // Signature: play(note, time, options)
  // Passing 0 for time ensures immediate playback and avoids any undefined/object confusion
  try {
      // Use the passed gain (simulating velocity)
      instrument.play(note, 0, { duration: 1.5, gain: gain });
  } catch (e) {
      console.warn("Error playing note", e);
  }
}
