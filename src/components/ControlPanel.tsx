import { Rating } from '../lib/fsrs';
import type { Grade } from '../lib/fsrs';

interface ControlPanelProps {
  onGrade: (rating: Grade) => void;
}

export function ControlPanel({ onGrade }: ControlPanelProps) {
  return (
    <div className="flex justify-center gap-4 mt-8">
      <button
        onClick={() => onGrade(Rating.Again)}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-colors font-semibold"
      >
        Again
      </button>
      <button
        onClick={() => onGrade(Rating.Hard)}
        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition-colors font-semibold"
      >
        Hard
      </button>
      <button
        onClick={() => onGrade(Rating.Good)}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-colors font-semibold"
      >
        Good
      </button>
      <button
        onClick={() => onGrade(Rating.Easy)}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-colors font-semibold"
      >
        Easy
      </button>
    </div>
  );
}
