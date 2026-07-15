import { useEffect } from 'react';
import { useTrace } from '../context/TraceContext';

export const useKeyboardShortcuts = (onToggleFullscreen?: () => void) => {
  const { play, pause, isPlaying, stepForward, stepBackward, restart } = useTrace();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts when typing in input/textarea/editor elements
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.classList.contains('input') ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBackward();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            restart();
          }
          break;
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey && onToggleFullscreen) {
            e.preventDefault();
            onToggleFullscreen();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, play, pause, stepForward, stepBackward, restart, onToggleFullscreen]);
};
