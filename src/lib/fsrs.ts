import { FSRS, Rating, createEmptyCard } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

const fsrs = new FSRS({});
export interface FlashCard {
  id: string;
  xmlContent: string;
  answer: Array<{note: string, octave: number}>;
  card: Card;
}

export function createNewCard(id: string, xmlContent: string, answer: Array<{note: string, octave: number}>): FlashCard {
  return {
    id,
    xmlContent,
    answer,
    card: createEmptyCard(),
  };
}

export type Grade = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

export function scheduleReview(currentCard: FlashCard, rating: Grade) {
  const now = new Date();
  const schedulingCards = fsrs.repeat(currentCard.card, now);
  
  // Cast to any to bypass strict key checks
  const recordLog = (schedulingCards as any)[rating]; // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    updatedCard: {
      ...currentCard,
      card: recordLog.card,
    },
    reviewLog: recordLog.log,
  };
}

export { Rating };
