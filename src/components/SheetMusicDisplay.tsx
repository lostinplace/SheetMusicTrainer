import { useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface SheetMusicDisplayProps {
  xml: string;
  zoom?: number;
  className?: string;
}

export function SheetMusicDisplay({ xml, zoom = 1.5, className = '' }: SheetMusicDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current) return;

    // Clear previous content strictly
    containerRef.current.innerHTML = '';

    // Create a fresh instance every time to avoid state retention issues (like Clef not updating)
    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
        drawingParameters: 'compacttight',
        drawPartNames: false, // Hide "Music" label
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
    });
    
    osmdRef.current = osmd;

    // Load and render
    osmd.load(xml).then(() => {
      if (isMounted) {
        osmd.Zoom = zoom;
        osmd.render();
      }
    });

    const containerEl = containerRef.current;

    return () => {
      isMounted = false;
      // Cleanup if necessary
      if (containerEl) {
          containerEl.innerHTML = '';
      }
    };
  }, [xml, zoom]); // Re-run if xml or zoom changes

  // We use a specific width for the inner container if provided, otherwise default to something reasonable.
  // Using 'inline-block' or 'width: fit-content' might be tricky with OSMD resizing.
  // Resetting to a narrower max-width helps centering single measures.
  
  return (
    <div className={`flex justify-center ${className}`}>
        <div ref={containerRef} className="w-full" style={{ paddingBottom: '5px' }} /> 
    </div>
  );
}
