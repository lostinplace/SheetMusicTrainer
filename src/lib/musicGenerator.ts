// Basic natural notes
export const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// All 12 chromatic notes (using sharp notation for simplicity in piano mapping, but we can generate flats)
export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type ChordType = 'major' | 'minor' | 'diminished' | 'augmented';

export const normalizeNote = (note: string): number => {
    // Return semitone index (0-11) relative to C
    // If input includes octave (e.g. C4), it returns absolute semitone from C0
    // But the previous implementation in useTrainer was relative to C0 if octave present?
    // "oct * 12 + (semitones[name] || 0)" -> yes, absolute.
    
    // Check if it has octave
    const match = note.match(/^([A-G][#b]?)(-?\d+)$/);
    if (match) {
        const name = match[1];
        const oct = parseInt(match[2], 10);
        const semitones: Record<string, number> = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };
        return oct * 12 + (semitones[name] || 0);
    }
    return -1;
};

export function generateSingleNoteXml(note: string, octave: number, staffType: 'single' | 'grand' = 'grand'): string {
  const pitchXml = (forceAccidental = false) => {
      const step = note.charAt(0);
      const accidentalChar = note.length > 1 ? note.charAt(1) : '';
      let alter = 0;
      let accidentalTag = '';
    
      if (accidentalChar === '#') {
        alter = 1;
        accidentalTag = '<accidental>sharp</accidental>';
      } else if (accidentalChar === 'b') {
        alter = -1;
        accidentalTag = '<accidental>flat</accidental>';
      } else if (forceAccidental) {
          accidentalTag = '<accidental>natural</accidental>';
      }

      return {
          pitch: `
        <pitch>
          <step>${step}</step>
          <alter>${alter}</alter>
          <octave>${octave}</octave>
        </pitch>`,
          accidental: accidentalTag
      };
  };

  const { pitch, accidental } = pitchXml(false);

// Removed unused noteXml helper

  if (staffType === 'single') {
       // ... existing single staff logic ...
       const clef = octave < 4 ? 'bass' : 'treble';
       const clefSign = clef === 'bass' ? 'F' : 'G';
       const clefLine = clef === 'bass' ? '4' : '2';
       
        return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>${clefSign}</sign><line>${clefLine}</line></clef>
      </attributes>
      <note>
        ${pitch}
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
        ${accidental}
      </note>
    </measure>
  </part>
</score-partwise>`;
  }

  // Grand Staff Logic
  const preferredStaff = octave < 4 ? 2 : 1; 
  const otherStaff = preferredStaff === 1 ? 2 : 1;

  // Voice 1 for Staff 1, Voice 2 for Staff 2
  const noteVoice = preferredStaff === 1 ? 1 : 2;
  const restVoice = otherStaff === 1 ? 1 : 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
      <note>
        ${pitch}
        <duration>4</duration>
        <voice>${noteVoice}</voice>
        <type>whole</type>
        ${accidental}
        <staff>${preferredStaff}</staff>
      </note>
      <backup>
        <duration>4</duration>
      </backup>
      <note>
        <rest/>
        <duration>4</duration>
        <voice>${restVoice}</voice>
        <type>whole</type>
        <staff>${otherStaff}</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ... getRandomNote ...

export function generateChordXml(notes: Array<{note: string, octave: number}>): string {
  // Always use Grand Staff for consistent UI
  
  const pitchToXml = (n: {note: string, octave: number}, isChord: boolean, staff: number) => {
    const step = n.note.charAt(0);
    const accidentalChar = n.note.length > 1 ? n.note.charAt(1) : '';
    let alter = 0;
    let accidentalTag = '';
  
    if (accidentalChar === '#') {
      alter = 1;
      accidentalTag = '<accidental>sharp</accidental>';
    } else if (accidentalChar === 'b') {
      alter = -1;
      accidentalTag = '<accidental>flat</accidental>';
    }

    return `<note>
        ${isChord ? '<chord/>' : ''}<pitch>
          <step>${step}</step>
          <alter>${alter}</alter>
          <octave>${n.octave}</octave>
        </pitch>
        <duration>4</duration>
        <voice>${staff === 1 ? 1 : 2}</voice>
        <type>whole</type>
        ${accidentalTag}
        <staff>${staff}</staff>
      </note>`;
  };

  const root = notes[0]; 
  const preferredStaff = root.octave < 4 ? 2 : 1;
  const otherStaff = preferredStaff === 1 ? 2 : 1;
  
  // Voice assignment: Staff 1 -> Voice 1, Staff 2 -> Voice 2
  const restVoice = otherStaff === 1 ? 1 : 2;

  let notesXml = '';
  notes.forEach((n, index) => {
      // Pass staff to pitchToXml
      notesXml += pitchToXml(n, index > 0, preferredStaff);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
      ${notesXml}
      <backup>
        <duration>4</duration>
      </backup>
      <note>
        <rest/>
        <duration>4</duration>
        <voice>${restVoice}</voice>
        <type>whole</type>
        <staff>${otherStaff}</staff>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

interface RandomChordOptions {
    minOctave: number;
    maxOctave: number;
    allowedTypes?: ChordType[];
    includeSharps?: boolean;
    includeFlats?: boolean;
}

// Helper to identify chord name from notes
export function identifyChord(notes: Array<{note: string, octave: number}>): string {
    if (!notes || notes.length === 0) return '';
    if (notes.length === 1) return `${notes[0].note}${notes[0].octave}`;

    // 1. Find Root (lowest note)
    // Assuming block chords, usually the first one or sorted.
    // Let's sort by pitch to be sure.
    const sorted = [...notes].sort((a, b) => {
        const pitchA = a.octave * 12 + CHROMATIC_SCALE.indexOf(a.note);
        const pitchB = b.octave * 12 + CHROMATIC_SCALE.indexOf(b.note);
        return pitchA - pitchB;
    });

    const root = sorted[0];
    const rootIndex = CHROMATIC_SCALE.indexOf(root.note);
    const rootAbs = root.octave * 12 + rootIndex;

    // 2. Calculate intervals
    const intervals = sorted.map(n => {
        const idx = CHROMATIC_SCALE.indexOf(n.note);
        const abs = n.octave * 12 + idx;
        return abs - rootAbs;
    });

    // 3. Match patterns
    // intervals[0] is always 0
    const str = intervals.join(',');
    
    let quality = '';
    if (str === '0,4,7') quality = 'maj';
    else if (str === '0,3,7') quality = 'min';
    else if (str === '0,3,6') quality = 'dim';
    else if (str === '0,4,8') quality = 'aug';
    else quality = 'chord'; // Fallback

    return `${root.note}${quality}${root.octave}`;
}

export interface RandomNoteOptions {
    minOctave: number;
    maxOctave: number;
    includeSharps?: boolean;
    includeFlats?: boolean;
    hardLimit?: { note: string, octave: number };
}

export function getRandomNote(options: RandomNoteOptions): { note: string, octave: number } {
    const { minOctave, maxOctave, includeSharps, includeFlats, hardLimit } = options;
    const availableNotes = [];

    for (let octave = minOctave; octave <= maxOctave; octave++) {
        for (const note of CHROMATIC_SCALE) {
             const isSharp = note.includes('#');

             // Basic filtering
             // If it's a sharp note, we skip it if BOTH accidentals are disabled.
             // If only flats are enabled, we technically don't have flats in CHROMATIC_SCALE,
             // so we might skip this unless we implemented conversion.
             // For now, let's allow it if either accidental type is enabled, assuming UI handles display.
             if (isSharp && !includeSharps && !includeFlats) continue;
             
             // Hard limit check (MAX)
             if (hardLimit) {
                 if (octave > hardLimit.octave) continue;
                 if (octave === hardLimit.octave) {
                     // Get expected index of current note and limit note
                     const noteIndex = CHROMATIC_SCALE.indexOf(note);
                     const limitIndex = CHROMATIC_SCALE.indexOf(hardLimit.note);
                     if (noteIndex > limitIndex) continue;
                 }
             }
             
             availableNotes.push({ note, octave });
        }
    }
    
    if (availableNotes.length === 0) {
        // Fallback if constraints are too tight
        return { note: 'C', octave: Math.max(minOctave, 4) }; 
    }

    const selection = availableNotes[Math.floor(Math.random() * availableNotes.length)];
    return selection;
}

export function getRandomChord(options: RandomChordOptions = { minOctave: 4, maxOctave: 4, allowedTypes: ['major', 'minor'] }): Array<{ note: string, octave: number }> {
    for (let i = 0; i < 100; i++) {
        // 1. Pick Root
        // User reports F0 being generated. 
        // If minOctave is 0, F0 is possible.
        // But standard piano starts at A0.
        // We should enforce a hard lower bound of A0? 
        // Or leave it to the user to set minOctave=1?
        // Let's try to constrain the ROOT selection to avoid generating notes below A0 if octave is 0.
        
        const root = getRandomNote({ 
            minOctave: options.minOctave, 
            maxOctave: options.maxOctave,
            includeSharps: options.includeSharps,
            includeFlats: options.includeFlats,
            // Hard limit: A0 (0 * 12 + 9) = 9
            // C0 = 0.
            hardLimit: { note: 'G', octave: 9 } // Hack, getRandomNote uses 'hardLimit' as MAX. We need MIN.
            // getRandomNote doesn't have a minLimit...
        });
        
        // Manual check for A0 limit if octave is 0
        if (root.octave === 0) {
             const noteIdx = CHROMATIC_SCALE.indexOf(root.note);
             // A0 is index 9.
             if (noteIdx < 9) continue; // Skip C0-G#0
        }
        
        // 2. Pick Type
        const allowed = options.allowedTypes && options.allowedTypes.length > 0 ? options.allowedTypes : ['major', 'minor'];
        const type = allowed[Math.floor(Math.random() * allowed.length)];
        
        // 3. intervals
        let semitoneIntervals: number[] = [];
        if (type === 'major') semitoneIntervals = [0, 4, 7];
        else if (type === 'minor') semitoneIntervals = [0, 3, 7];
        else if (type === 'diminished') semitoneIntervals = [0, 3, 6];
        else if (type === 'augmented') semitoneIntervals = [0, 4, 8];
        
        // 4. Construct Notes
        const semitones: Record<string, number> = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        const reverseSemitones = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        const getNoteFromSemitone = (s: number, baseOctave: number) => {
            let normalized = s;
            let octaveShift = 0;
            while (normalized >= 12) {
                normalized -= 12;
                octaveShift++;
            }
            return { note: reverseSemitones[normalized], octave: baseOctave + octaveShift };
        }

        const rootVal = semitones[root.note.replace(/\d+/, '')]; 
        
        const notes = semitoneIntervals.map(interval => getNoteFromSemitone(rootVal + interval, root.octave));

        // 5. Validation
        // STRICT Range Check
        const minOctave = options.minOctave;
        const maxOctave = options.maxOctave;
        
        const isOutOfBounds = notes.some(n => n.octave > maxOctave || n.octave < minOctave);
        
        // Extra Safe Guard for Piano Range (A0 - C8)
        const isBelowA0 = notes.some(n => n.octave === 0 && semitones[n.note] < 9);
        const isAboveC8 = notes.some(n => n.octave > 8 || (n.octave === 8 && n.note !== 'C'));
        
        if (!isOutOfBounds && !isBelowA0 && !isAboveC8) {
             return notes;
        }
    }
    
    // Fallback: Safe C4 major
    const safeOctave = Math.max(1, options.minOctave); // Ensure at least 1
    return [
        { note: 'C', octave: safeOctave },
        { note: 'E', octave: safeOctave },
        { note: 'G', octave: safeOctave }
    ];
}
