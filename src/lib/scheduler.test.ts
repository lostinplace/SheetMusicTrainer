import { describe, it, expect, vi } from 'vitest';
import { getNextChallenge } from './scheduler';
import type { FlashCard } from './fsrs';
import type { SessionSettings } from './scheduler';

// Mocks
vi.mock('./fsrs', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createNewCard: (id: string, xml: string, answer: any) => ({
        id,
        xmlContent: xml,
        answer,
        card: { due: new Date(), state: 0, last_review: undefined } // Mock FSRS card
    })
}));

vi.mock('./musicGenerator', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(actual as any),
        generateSingleNoteXml: () => '<xml>note</xml>',
        generateChordXml: () => '<xml>chord</xml>',
        getRandomNote: () => ({ note: 'C', octave: 4 }), // Fixed return for predictability
        getRandomChord: () => [{ note: 'C', octave: 4 }, { note: 'E', octave: 4 }, { note: 'G', octave: 4 }]
    };
});

describe('scheduler', () => {
    const defaultSettings: SessionSettings = {
        minOctave: 2,
        maxOctave: 6,
        includeSharps: true,
        includeFlats: true,
        enableSingleNotes: true,
        chordTypes: []
    };

    it('should return a new challenge when no cards exist', () => {
        const result = getNextChallenge([], defaultSettings);
        expect(result.type).toBe('new');
        expect(result.card).toBeDefined();
    });

    it('should return a review challenge if a card is due', () => {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        
        const dueCard: FlashCard = {
            id: 'note-C4',
            xmlContent: '<xml></xml>',
            answer: [{ note: 'C', octave: 4 }],
            card: {
                 due: past,
                 state: 2, // Review
                 last_review: new Date(),
                 stability: 1,
                 difficulty: 1,
                 reps: 1,
                 lapses: 0,
                 elapsed_days: 1,
                 scheduled_days: 1
            } as any // eslint-disable-line @typescript-eslint/no-explicit-any
        };
        
        const result = getNextChallenge([dueCard], defaultSettings);
        expect(result.type).toBe('review');
        expect(result.card.id).toBe('note-C4');
    });

    it('should generate a chord if chord types are enabled and single notes disabled', () => {
        const settings: SessionSettings = {
            ...defaultSettings,
            enableSingleNotes: false,
            chordTypes: ['major']
        };
        
        const result = getNextChallenge([], settings);
        // Based on our mock, getRandomChord returns C-E-G
        expect(result.answer.length).toBe(3);
    });
});
