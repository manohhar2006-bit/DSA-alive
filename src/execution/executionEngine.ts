import { executionStore } from '../stores/executionStore';
import { executionService } from '../services/executionService';

let timerId: any = null;

function clearTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

// Single central subscriber that handles the execution step timing
executionStore.subscribe((state) => {
  clearTimer();

  // If the engine is playing, schedule the next step execution
  if (state.playing && state.executionStatus === 'running') {
    const delay = 1500 / state.speed;
    timerId = setTimeout(() => {
      executionStore.stepForward();
    }, delay);
  }
});

export const executionEngine = {
  /**
   * Loads user C code or lesson code template, executes it to build a full trace,
   * and populates the global store.
   */
  async loadCode(code: string, lessonId?: string): Promise<void> {
    executionStore.setState({ executionStatus: 'loading' });
    try {
      const trace = await executionService.generateTrace(code, lessonId);
      executionStore.setTrace(trace);
    } catch (err) {
      console.error('Failed to compile/execute trace in Execution Engine:', err);
      executionStore.setState({ executionStatus: 'error' });
      throw err;
    }
  },

  play() {
    executionStore.play();
  },

  pause() {
    executionStore.pause();
  },

  stepForward() {
    executionStore.stepForward();
  },

  stepBackward() {
    executionStore.stepBackward();
  },

  restart() {
    executionStore.restart();
  },

  jumpTo(index: number) {
    executionStore.setStep(index);
  },

  setSpeed(speed: number) {
    executionStore.setSpeed(speed);
  },
};
