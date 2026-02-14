// Web MIDI API Type Definitions (minimal)
interface MIDIOptions {
    sysex?: boolean;
    software?: boolean;
}

interface MIDIInputMap {
    forEach(callback: (input: MIDIInput, key: string) => void): void;
}

interface MIDIAccess extends EventTarget {
    inputs: MIDIInputMap;
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

interface MIDIPort extends EventTarget {
    id: string;
    manufacturer?: string;
    name?: string;
    type: 'input' | 'output';
    version?: string;
    state: 'disconnected' | 'connected';
    connection: 'open' | 'closed' | 'pending';
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

type MIDIInput = MIDIPort;

interface MIDIMessageEvent extends Event {
    data: Uint8Array;
}

interface MIDIConnectionEvent extends Event {
    port: MIDIPort;
}

interface Navigator {
    requestMIDIAccess?: (options?: MIDIOptions) => Promise<MIDIAccess>;
}

export type MidiNoteCallback = (note: string, velocity: number, isNoteOn: boolean) => void;

export const NOTE_ON = 144;
export const NOTE_OFF = 128;

export function noteFromMidi(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${notes[noteIndex]}${octave}`;
}

export class MidiHandler {
  private access: MIDIAccess | null = null;
  private callbacks: MidiNoteCallback[] = [];
  private connectionCallbacks: ((devices: string[]) => void)[] = [];
  private octaveOffset = 0;
  private rawCallbacks: ((data: Uint8Array) => void)[] = [];

  constructor() {
    this.handleMidiMessage = this.handleMidiMessage.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  async initialize(): Promise<void> {
    const nav = navigator as unknown as Navigator;
    if (!nav.requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser.');
      return;
    }

    try {
      // Try without sysex first as it's more widely supported/less restricted
      this.access = await nav.requestMIDIAccess({ sysex: false });
      console.log('MIDI Access Granted', this.access);
      
      // Attach to all current inputs
      this.access.inputs.forEach((input: MIDIInput) => {
        console.log('Found MIDI Input:', input.name, 'State:', input.state, 'Connection:', input.connection);
        input.onmidimessage = this.handleMidiMessage;
        
        // Explicitly open
        if (input.connection !== 'open') {
             (input as any).open() // eslint-disable-line @typescript-eslint/no-explicit-any
                .then(() => console.log('✅ Successfully opened MIDI port:', input.name))
                .catch((err: unknown) => console.error('❌ Failed to open port:', input.name, err));
        }
      });
      
      this.emitConnectionChange();

      // Listen for new connections
      this.access.onstatechange = this.handleStateChange;

    } catch (err) {
      console.error('Could not access MIDI devices.', err);
    }
  }
  
  private handleStateChange(e: MIDIConnectionEvent) {
      console.log('MIDI State Change:', e.port.name, e.port.state, e.port.connection);
      if (e.port.type === 'input') {
          if (e.port.state === 'connected' && e.port.connection === 'open') {
             e.port.onmidimessage = this.handleMidiMessage;
          }
      }
      this.emitConnectionChange();
  }

  private emitConnectionChange() {
      if (!this.access) return;
      const devices: string[] = [];
      this.access.inputs.forEach((input) => {
          if (input.state === 'connected' && input.connection === 'open') {
             devices.push(input.name || 'Unknown Device');
          }
      });
      // If we have inputs but they aren't "open" yet, we might still want to list them if they are connected
      if (devices.length === 0) {
          this.access.inputs.forEach((input) => {
            if (input.state === 'connected') {
                devices.push(input.name || 'Unknown Device');
            }
          });
      }
      
      this.connectionCallbacks.forEach(cb => cb(devices));
  }

  public addConnectionListener(callback: (devices: string[]) => void) {
      this.connectionCallbacks.push(callback);
      // Emit immediately if we already have info
      if (this.access) {
          this.emitConnectionChange();
      }
      return () => {
          this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
      };
  }

  public setOctaveOffset(offset: number) {
      this.octaveOffset = offset;
  }

  public getOctaveOffset() {
      return this.octaveOffset;
  }

  public addRawListener(callback: (data: Uint8Array) => void) {
      this.rawCallbacks.push(callback);
      return () => {
          this.rawCallbacks = this.rawCallbacks.filter(cb => cb !== callback);
      };
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    const data = event.data;
    if (!data || data.length < 3) return;

    // Emit raw
    this.rawCallbacks.forEach(cb => cb(data));

    const [status, noteNum, velocity] = data;
    const command = status & 0xf0; // Mask channel
    
    // eslint-disable-next-line no-console
    console.log(`MIDI Raw: [${status}, ${noteNum}, ${velocity}] Cmd: ${command} Note: ${this.midiToNoteName(noteNum)}`);

    const noteName = this.midiToNoteName(noteNum);

    // Note Off can be command 128 or command 144 with velocity 0
    if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
        this.emit(noteName, 0, false);
    } else if (command === NOTE_ON) {
        this.emit(noteName, velocity, true);
    }
  }

  private midiToNoteName(midi: number): string {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      // MIDI 60 is C4. 60/12 = 5. 5-1=4.
      // Apply offset to the calculated octave
      const octave = (Math.floor(midi / 12) - 1) + this.octaveOffset;
      const noteIndex = midi % 12;
      return `${noteNames[noteIndex]}${octave}`;
  }

  private emit(noteName: string, velocity: number, isNoteOn: boolean) {
    this.callbacks.forEach(cb => cb(noteName, velocity, isNoteOn));
  }

  public addListener(callback: MidiNoteCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

export const midiHandler = new MidiHandler();
