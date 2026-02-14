import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VirtualPiano } from './VirtualPiano';

describe('VirtualPiano', () => {
    // Mock getContext for canvas
    beforeEach(() => {
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillText: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            measureText: () => ({ width: 10 }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any;
    });

    it('should render canvas', () => {
        const { container } = render(<VirtualPiano onNoteClick={() => {}} activeNotes={[]} />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should call onNoteClick with correct note when clicked', () => {
        const handleClick = vi.fn();
        const { container } = render(
            <VirtualPiano 
                onNoteClick={handleClick} 
                minRange={{ note: 'C', octave: 4 }} 
                maxRange={{ note: 'C', octave: 5 }} 
                whiteKeyWidth={20}
            />
        );
        
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
        if (!canvas) return;

        // Mock getBoundingClientRect
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 200,
            height: 100,
            x: 0,
            y: 0,
            bottom: 100,
            right: 200,
            toJSON: () => {}
        });

        // Click first key (C4)
        // x = 10 (middle of first 20px key)
        fireEvent.click(canvas, { clientX: 10, clientY: 50 });
        expect(handleClick).toHaveBeenCalledWith('C4');

        // Click second key (D4)
        // x = 30
        fireEvent.click(canvas, { clientX: 30, clientY: 50 });
        expect(handleClick).toHaveBeenCalledWith('D4');
    });
});
