import { describe, it, expect } from 'vitest';
import { createNewCard } from './fsrs';

describe('fsrs', () => {
    it('should create a new card with correct properties', () => {
        const card = createNewCard('test-id', '<xml>', [{ note: 'C', octave: 4 }]);
        
        expect(card.id).toBe('test-id');
        expect(card.xmlContent).toBe('<xml>');
        
        // FSRS specific defaults
        expect(card.card.state).toBe(0); // New
        expect(card.card.due).toBeDefined();
    });
});
