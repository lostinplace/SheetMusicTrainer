import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import type { SessionSettings } from '../lib/scheduler';

describe('StatsPanel', () => {
    const mockSettings: SessionSettings = {
        minOctave: 2,
        maxOctave: 6,
        includeSharps: true,
        includeFlats: true,
        enableSingleNotes: true,
        chordTypes: []
    };

    const defaultProps = {
        stats: { total: 10, correct: 8, accuracy: 80 },
        isSessionActive: false,
        onStartSession: vi.fn(),
        isPaused: false,
        onPause: vi.fn(),
        onResume: vi.fn(),
        onStop: vi.fn(),
        history: [{ id: '1', note: 'C4', userGuess: 'C4', isCorrect: true, timestamp: 0, difficulty: 'Good', xml: '' }],
        settings: mockSettings,
        onSettingsChange: vi.fn()
    };

    it('should display stats correctly', () => {
        render(<StatsPanel {...defaultProps} />);
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument(); // Total
    });

    it('should show "Start Session" button when session is inactive', () => {
        render(<StatsPanel {...defaultProps} isSessionActive={false} history={[]} />);
        const btn = screen.getByRole('button', { name: /start session/i });
        expect(btn).toBeInTheDocument();
        
        fireEvent.click(btn);
        expect(defaultProps.onStartSession).toHaveBeenCalled();
    });

    it('should show Pause/Stop buttons when session is active', () => {
        render(<StatsPanel {...defaultProps} isSessionActive={true} />);
        
        const stopBtn = screen.getByRole('button', { name: /stop/i });
        expect(stopBtn).toBeInTheDocument();
        
        const pauseBtn = screen.getByRole('button', { name: /pause/i });
        expect(pauseBtn).toBeInTheDocument();
    });
});
