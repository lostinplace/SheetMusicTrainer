
import { generateSingleNoteXml } from './src/lib/musicGenerator';
import * as fs from 'fs';

const note = 'C';
const octave = 4;
console.log("Generating XML for Middle C (Grand Staff)...");
const xml = generateSingleNoteXml(note, octave, 'grand');
fs.writeFileSync('debug_single_note.xml', xml);
console.log("Wrote debug_single_note.xml");
