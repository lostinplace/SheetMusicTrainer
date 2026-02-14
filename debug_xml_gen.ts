
import { generateChordXml, generateSingleNoteXml } from './src/lib/musicGenerator';
import * as fs from 'fs';

const chord = [{note: 'C', octave: 4}, {note: 'E', octave: 4}, {note: 'G', octave: 4}];
const chordXml = generateChordXml(chord);

const note = 'C';
const octave = 4;
const noteXml = generateSingleNoteXml(note, octave, 'grand');

fs.writeFileSync('debug_chord.xml', chordXml);
fs.writeFileSync('debug_note.xml', noteXml);
console.log("Wrote debug_chord.xml and debug_note.xml");
