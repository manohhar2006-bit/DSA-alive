import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ExecutionStep, ExecutionTrace } from '../types/trace';
import type { MCQQuestion } from '../models/lessons';
import { LESSONS } from '../models/lessons';
import { useAuth } from './AuthContext';
import { executionStore } from '../stores/executionStore';
import { executionEngine } from '../execution/executionEngine';

interface TraceContextType {
  trace: ExecutionTrace | null;
  currentStepIndex: number;
  currentStep: ExecutionStep | null;
  isPlaying: boolean;
  playbackSpeed: number;
  loading: boolean;
  selectedLessonId: string | null;
  activeMCQ: MCQQuestion | null;
  mcqSubmitted: boolean;
  mcqSelectedOption: number | null;
  mcqIsCorrect: boolean | null;
  breakpoints: Set<number>;
  hoveredVariable: { name: string; address: string; type: string; value: string } | null;
  isCompleted: boolean;

  loadLesson: (lessonId: string) => Promise<void>;
  loadCustomCode: (code: string) => Promise<void>;
  toggleBreakpoint: (line: number) => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (index: number) => void;
  setSpeed: (speed: number) => void;
  submitMCQ: (optionIndex: number) => void;
  dismissMCQ: () => void;
  setHoveredVariable: (v: any) => void;
  restart: () => void;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export const TraceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { completeLesson, addXpAndCoins } = useAuth();
  
  // Local bridged state synced with global executionStore
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  
  const [activeMCQ, setActiveMCQ] = useState<MCQQuestion | null>(null);
  const [mcqSubmitted, setMcqSubmitted] = useState<boolean>(false);
  const [mcqSelectedOption, setMcqSelectedOption] = useState<number | null>(null);
  const [mcqIsCorrect, setMcqIsCorrect] = useState<boolean | null>(null);
  
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [hoveredVariable, setHoveredVariable] = useState<any | null>(null);

  const prevStepIndexRef = useRef<number>(-1);

  const currentStep = trace ? trace.steps[currentStepIndex] || null : null;
  const isCompleted = trace ? currentStepIndex === trace.steps.length - 1 : false;

  // Reactively subscribe and bridge global executionStore state to local state
  useEffect(() => {
    return executionStore.subscribe((state) => {
      setTrace(state.executionTrace);
      setCurrentStepIndex(state.currentStep);
      setIsPlaying(state.playing);
      setPlaybackSpeed(state.speed);
      setLoading(state.executionStatus === 'loading');
    });
  }, []);

  const loadLesson = async (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveMCQ(null);
    setMcqSubmitted(false);
    setMcqSelectedOption(null);
    setMcqIsCorrect(null);
    
    const lesson = LESSONS.find(l => l.id === lessonId);
    if (!lesson) return;

    try {
      await executionEngine.loadCode(lesson.codeTemplate, lessonId);
      prevStepIndexRef.current = -1;
    } catch (err) {
      console.error('Failed to load trace in context:', err);
    }
  };

  const loadCustomCode = async (code: string) => {
    setSelectedLessonId(null);
    setActiveMCQ(null);
    setMcqSubmitted(false);
    setMcqSelectedOption(null);
    setMcqIsCorrect(null);

    try {
      await executionEngine.loadCode(code);
      prevStepIndexRef.current = -1;
    } catch (err) {
      console.error('Failed to compile custom code in context:', err);
    }
  };

  const toggleBreakpoint = (line: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  };

  const play = () => {
    if (activeMCQ && !mcqSubmitted) return;
    executionEngine.play();
  };

  const pause = () => {
    executionEngine.pause();
  };

  const stepForward = () => {
    if (activeMCQ && !mcqSubmitted) return;
    
    if (trace && currentStepIndex < trace.steps.length - 1) {
      executionEngine.stepForward();
    } else if (trace && currentStepIndex === trace.steps.length - 1) {
      executionEngine.pause();
      if (selectedLessonId) {
        const lesson = LESSONS.find(l => l.id === selectedLessonId);
        if (lesson) {
          completeLesson(lesson.id, lesson.title, lesson.category, lesson.xpReward);
        }
      }
    }
  };

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      executionEngine.stepBackward();
      setActiveMCQ(null);
      setMcqSubmitted(false);
      setMcqSelectedOption(null);
      setMcqIsCorrect(null);
    }
  };

  const jumpToStep = (index: number) => {
    executionEngine.jumpTo(index);
    setActiveMCQ(null);
    setMcqSubmitted(false);
    setMcqSelectedOption(null);
    setMcqIsCorrect(null);
  };

  const setSpeed = (speed: number) => {
    executionEngine.setSpeed(speed);
  };

  const submitMCQ = (optionIndex: number) => {
    if (!activeMCQ) return;
    setMcqSelectedOption(optionIndex);
    const correct = optionIndex === activeMCQ.correctIndex;
    setMcqIsCorrect(correct);
    setMcqSubmitted(true);

    if (correct) {
      addXpAndCoins(20, 10);
    }
  };

  const dismissMCQ = () => {
    setActiveMCQ(null);
    setMcqSubmitted(false);
    setMcqSelectedOption(null);
    setMcqIsCorrect(null);
    // If it was playing, resume playing
    if (isPlaying) {
      executionEngine.play();
    }
  };

  const restart = () => {
    executionEngine.restart();
    setActiveMCQ(null);
    setMcqSubmitted(false);
    setMcqSelectedOption(null);
    setMcqIsCorrect(null);
  };

  // Traversal Checkpoint Breakpoint & MCQ Interrupts
  useEffect(() => {
    if (!trace || currentStepIndex === prevStepIndexRef.current) return;
    
    const currStep = trace.steps[currentStepIndex];
    prevStepIndexRef.current = currentStepIndex;

    // Breakpoint Hit -> Pause playback
    if (isPlaying && currentStepIndex > 0 && breakpoints.has(currStep.line)) {
      executionEngine.pause();
      return;
    }

    // MCQ Hit -> Pause playback and show quiz
    if (selectedLessonId) {
      const lesson = LESSONS.find(l => l.id === selectedLessonId);
      if (lesson) {
        const mcq = lesson.mcqs.find(q => q.stepIndex === currentStepIndex);
        if (mcq) {
          executionEngine.pause();
          setActiveMCQ(mcq);
          setMcqSubmitted(false);
          setMcqSelectedOption(null);
          setMcqIsCorrect(null);
        }
      }
    }
  }, [currentStepIndex, trace, selectedLessonId, isPlaying, breakpoints]);

  return (
    <TraceContext.Provider
      value={{
        trace,
        currentStepIndex,
        currentStep,
        isPlaying,
        playbackSpeed,
        loading,
        selectedLessonId,
        activeMCQ,
        mcqSubmitted,
        mcqSelectedOption,
        mcqIsCorrect,
        breakpoints,
        hoveredVariable,
        isCompleted,
        loadLesson,
        loadCustomCode,
        toggleBreakpoint,
        play,
        pause,
        stepForward,
        stepBackward,
        jumpToStep,
        setSpeed,
        submitMCQ,
        dismissMCQ,
        setHoveredVariable,
        restart
      }}
    >
      {children}
    </TraceContext.Provider>
  );
};

export const useTrace = () => {
  const context = useContext(TraceContext);
  if (context === undefined) {
    throw new Error('useTrace must be used within a TraceProvider');
  }
  return context;
};
