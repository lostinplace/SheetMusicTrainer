import { createNewCard } from './fsrs';
import type { FlashCard } from './fsrs';
import { generateSingleNoteXml, generateChordXml, getRandomChord, getRandomNote } from './musicGenerator';
import type { ChordType } from './musicGenerator';

export type ChallengeType = 'new' | 'review' | 'learn';

export interface NextChallenge {
  card: FlashCard;
  type: ChallengeType;
  answer: Array<{note: string, octave: number}>;
}

export interface SessionSettings {
  minOctave: number;
  maxOctave: number;
  includeSharps: boolean;
  includeFlats: boolean;
  enableSingleNotes: boolean;
  chordTypes: ChordType[];
}

export function getNextChallenge(
  cards: FlashCard[], 
  settings: SessionSettings
): NextChallenge {
  
  const minOctave = settings.minOctave;
  const maxOctave = settings.maxOctave;
  const includeSharps = settings.includeSharps;
  const includeFlats = settings.includeFlats;
  const enableSingleNotes = settings.enableSingleNotes;
  const chordTypes = settings.chordTypes;

  // Helper to check if a single note is valid under current settings
  // (Used for validating existing cards)
  const isNoteValid = (note: string, octave: number) => {
      // Range check
      if (octave < minOctave || octave > maxOctave) return false;
      
      // Accidental check
      const hasSharp = note.includes('#');
      const hasFlat = note.includes('b');
      
      if (!hasSharp && !hasFlat) return true; // Natural is always valid
      
      if (hasSharp && !includeSharps) return false; 
      if (hasFlat && !includeFlats) return false;
      
      return true;
  };

  const isCardValid = (c: FlashCard) => {
      // Check ID type against enabled settings
      const isNote = c.id.startsWith('note-');
      const isChord = c.id.startsWith('chord-');

      if (isNote && (!enableSingleNotes || c.answer.length !== 1)) return false;
      if (isChord && chordTypes.length === 0) return false;

      // Check contents validity (range, accidentals)
      // For chords, we might want to be strict or lenient.
      // Strict: All notes must be valid.
      return c.answer.every(n => isNoteValid(n.note, n.octave));
  };
  
  const refreshCardXml = (card: FlashCard) => {
      // Regenerate XML based on ID/Answer to ensure WYSIWYG
      let newXml = card.xmlContent;
      if (card.id.startsWith('note-') && card.answer.length === 1) {
          const n = card.answer[0];
          newXml = generateSingleNoteXml(n.note, n.octave, 'grand');
      } else if (card.id.startsWith('chord-')) {
          newXml = generateChordXml(card.answer);
      }
      return { ...card, xmlContent: newXml };
  };

  // 1. Filter cards relevant to current settings
  const activeCards = cards.filter(isCardValid);

  // 2. Check for Due Cards (Review)
  const now = new Date();
  const dueCards = activeCards.filter(c => c.card.due <= now && c.card.state !== 0); // State 0 is New
  
  if (dueCards.length > 0) {
      dueCards.sort((a, b) => a.card.due.getTime() - b.card.due.getTime());
      const selected = dueCards[0];
      return {
          card: refreshCardXml(selected),
          type: 'review',
          answer: selected.answer
      };
  }

  // 3. New Queue (already created but not graduated)
  const newCardsInQueue = activeCards.filter(c => c.card.state === 0);
  if (newCardsInQueue.length > 0) {
       const selected = newCardsInQueue[0];
       return {
           card: refreshCardXml(selected),
           type: 'learn',
           answer: selected.answer
       };
  }

  // 4. Generate New Card
  // Decide type: Single Note or Chord?
  let generateType: 'note' | 'chord' = 'note';
  
  if (enableSingleNotes && chordTypes.length > 0) {
      // Mix. 50/50?
      generateType = Math.random() > 0.5 ? 'chord' : 'note';
  } else if (chordTypes.length > 0) {
      generateType = 'chord';
  } else {
      generateType = 'note'; // Default if nothing selected (though UI should prevent)
  }

  if (generateType === 'chord') {
      const newChord = getRandomChord({ 
          minOctave, 
          maxOctave, 
          allowedTypes: chordTypes,
          includeSharps,
          includeFlats
      });
      const idSuffix = newChord.map(n => `${n.note}${n.octave}`).join('-');
      const id = `chord-${idSuffix}`;
      
      // Check existence
      const existing = cards.find(c => c.id === id); // Check ALL cards, not just active, to avoid dupes logic error
      if (existing) {
          return { // Review ahead or Re-learning
              card: refreshCardXml(existing), 
              type: 'review',
              answer: existing.answer
          };
      } else {
          // Brand New
          const xml = generateChordXml(newChord);
          const newCard = createNewCard(id, xml, newChord);
          return {
              card: newCard,
              type: 'new',
              answer: newChord
          };
      }
  } else {
      // Generate Note
      // Use similar logic to before: iterate possibilities or pick random.
      // Random generation is easier to maintain with strict constraints.
      
      // Try to pick a new note we don't have.
      // Simple approach: Generate random valid notes until we find one not in cards, or give up and review existing.
      const knownIds = new Set(cards.map(c => c.id));
      
      for (let i=0; i<20; i++) {
          const candidate = getRandomNote({ minOctave, maxOctave, includeSharps, includeFlats });
          const id = `note-${candidate.note}${candidate.octave}`;
          
          if (!knownIds.has(id)) {
               const xml = generateSingleNoteXml(candidate.note, candidate.octave, 'grand');
               const newCard = createNewCard(id, xml, [candidate]);
               return {
                   card: newCard,
                   type: 'new',
                   answer: [candidate]
               };
          }
      }
      
      // Fallback: Pick random existing note card if available (Review Ahead)
      // Filter existing cards to just notes
      const existingNotes = activeCards.filter(c => c.id.startsWith('note-'));
      if (existingNotes.length > 0) {
           const randomExisting = existingNotes[Math.floor(Math.random() * existingNotes.length)];
           return {
               card: refreshCardXml(randomExisting),
               type: 'review',
               answer: randomExisting.answer
           };
      }
      
      // Absolute fallback if no existing notes and can't find new one (e.g. deck complete)
      // Just regenerate a random one even if duplicate (user will practice it)
      const fallback = getRandomNote({ minOctave, maxOctave, includeSharps, includeFlats });
      const xml = generateSingleNoteXml(fallback.note, fallback.octave, 'grand');
       // We must ensure unique ID if we want to store it, but if we really want to practice, we can just return a virtual card
       // But better to just find *any* card.
       
       // Creating a new card with same ID will overwrite or be handled by hook.
       const id = `note-${fallback.note}${fallback.octave}`;
       const newCard = createNewCard(id, xml, [fallback]);
       return {
           card: newCard,
           type: 'new', // It's technically 'new' to the session if we forced it
           answer: [fallback]
       };
  }
}
