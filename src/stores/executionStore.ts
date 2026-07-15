import type { ExecutionTrace } from '../types/trace';

export interface TimelineStepSummary {
  step: number;
  line: number;
  eventType: string;
  operation: string;
  variablesChanged: string;
}

export interface ExecutionState {
  executionTrace: ExecutionTrace | null;
  currentStep: number; // 0-indexed index inside steps array
  playing: boolean;
  speed: number;
  selectedLine: number;
  selectedOperation: string;
  timeline: TimelineStepSummary[];
  executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'loading' | 'error';
}

const initialStoreState: ExecutionState = {
  executionTrace: null,
  currentStep: 0,
  playing: false,
  speed: 1,
  selectedLine: 0,
  selectedOperation: 'Debugger idle',
  timeline: [],
  executionStatus: 'idle',
};

type Listener = (state: ExecutionState) => void;

let state: ExecutionState = { ...initialStoreState };
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(state));
}

export const executionStore = {
  getState(): ExecutionState {
    return state;
  },

  setState(newState: Partial<ExecutionState>) {
    state = { ...state, ...newState };
    notify();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setTrace(trace: ExecutionTrace | null) {
    if (!trace) {
      state = { ...initialStoreState };
      notify();
      return;
    }
    const timeline = trace.steps.map((s, idx) => {
      let variablesChanged = 'None';
      if (idx > 0) {
        const prevStep = trace.steps[idx - 1];
        const changes: string[] = [];
        Object.entries(s.variables).forEach(([name, v]) => {
          const prevV = prevStep.variables[name];
          if (!prevV || prevV.value !== v.value) {
            changes.push(`${name}: ${prevV ? prevV.value : 'uninitialized'} ➜ ${v.value}`);
          }
        });
        if (changes.length > 0) {
          variablesChanged = changes.join(', ');
        }
      }
      return {
        step: s.step,
        line: s.line,
        eventType: s.eventType,
        operation: s.operation,
        variablesChanged,
      };
    });
    const currentStep = 0;
    const stepObj = trace.steps[currentStep];
    state = {
      ...state,
      executionTrace: trace,
      currentStep,
      timeline,
      selectedLine: stepObj ? stepObj.line : 0,
      selectedOperation: stepObj ? stepObj.operation : '',
      executionStatus: 'paused',
      playing: false,
    };
    notify();
  },

  setStep(index: number) {
    const trace = state.executionTrace;
    if (!trace) return;
    const safeIndex = Math.max(0, Math.min(trace.steps.length - 1, index));
    const stepObj = trace.steps[safeIndex];
    const isCompleted = safeIndex === trace.steps.length - 1;
    state = {
      ...state,
      currentStep: safeIndex,
      selectedLine: stepObj ? stepObj.line : 0,
      selectedOperation: stepObj ? stepObj.operation : '',
      executionStatus: isCompleted ? 'completed' : 'paused',
    };
    notify();
  },

  play() {
    const trace = state.executionTrace;
    if (!trace) return;
    const isCompleted = state.currentStep === trace.steps.length - 1;
    const nextStep = isCompleted ? 0 : state.currentStep;
    state = {
      ...state,
      playing: true,
      currentStep: nextStep,
      executionStatus: 'running',
    };
    notify();
  },

  pause() {
    state = {
      ...state,
      playing: false,
      executionStatus: 'paused',
    };
    notify();
  },

  stepForward() {
    const trace = state.executionTrace;
    if (!trace) return;
    if (state.currentStep < trace.steps.length - 1) {
      this.setStep(state.currentStep + 1);
    } else {
      state = {
        ...state,
        playing: false,
        executionStatus: 'completed',
      };
      notify();
    }
  },

  stepBackward() {
    if (state.currentStep > 0) {
      this.setStep(state.currentStep - 1);
    }
  },

  restart() {
    this.setStep(0);
    state = {
      ...state,
      playing: false,
      executionStatus: 'paused',
    };
    notify();
  },

  setSpeed(speed: number) {
    state = {
      ...state,
      speed,
    };
    notify();
  },

  setExecutionStatus(status: ExecutionState['executionStatus']) {
    state = {
      ...state,
      executionStatus: status,
    };
    notify();
  },
};
