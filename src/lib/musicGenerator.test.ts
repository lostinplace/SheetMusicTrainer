import { describe, it, expect } from 'vitest';
import { getRandomNote, generateSingleNoteXml, normalizeNote } from './musicGenerator';

describe('musicGenerator', () => {
    describe('getRandomNote', () => {
        it('should return a note within the specified octave range', () => {
            const result = getRandomNote({ minOctave: 4, maxOctave: 4, includeSharps: false, includeFlats: false });
            expect(result.octave).toBe(4);
        });

        it('should return a natural note when accidentals are disabled', () => {
            const result = getRandomNote({ minOctave: 4, maxOctave: 4, includeSharps: false, includeFlats: false });
            expect(result.note).not.toContain('#');
            expect(result.note).not.toContain('b');
        });
    });

    describe('generateSingleNoteXml', () => {
        it('should generate valid XML content containing the note', () => {
            const xml = generateSingleNoteXml('C', 4, 'grand');
            expect(xml).toContain('<step>C</step>');
            expect(xml).toContain('<octave>4</octave>');
        });
    });
    
    describe('normalizeNote', () => {
       it('should normalize C4 correctly', () => {
           // C4 is midi 60. But our normalize function returns 0-based index?
           // Let's check implementation behavior
           // C = 0, C#=1...
           // 4 * 12 + 0 = 48
           expect(normalizeNote('C4')).toBe(48);
       });
       
       it('should handle accidentals', () => {
           expect(normalizeNote('C#4')).toBe(49);
           expect(normalizeNote('Db4')).toBe(49);
       });
    });
});
