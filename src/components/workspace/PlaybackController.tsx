import React from 'react';
import { useExecutionStore } from '../../hooks/useExecution';
import { executionEngine } from '../../execution/executionEngine';
import { Play, Pause, ChevronRight, ChevronLeft, RotateCcw, Cpu, Timer, Database } from 'lucide-react';

const PlaybackController: React.FC = () => {
  const trace = useExecutionStore((s) => s.executionTrace);
  const currentStepIndex = useExecutionStore((s) => s.currentStep);
  const isPlaying = useExecutionStore((s) => s.playing);
  const playbackSpeed = useExecutionStore((s) => s.speed);
  const timeline = useExecutionStore((s) => s.timeline);
  const executionStatus = useExecutionStore((s) => s.executionStatus);

  if (!trace) return null;

  const currentStep = trace.steps[currentStepIndex] || null;
  const totalSteps = trace.steps.length;
  const isCompleted = currentStepIndex === totalSteps - 1;

  // Jump helper
  const jumpToStep = (index: number) => {
    executionEngine.jumpTo(index);
  };

  // Performance metrics calculation based on actual step.memory and step.stack
  const execTime = currentStep
    ? `${(currentStep.timestamp - trace.steps[0].timestamp).toFixed(0)} ms`
    : '0 ms';
  
  const memoryUsage = currentStep
    ? `${currentStep.memory.blocks.reduce((sum, b) => sum + b.size, 0)} Bytes`
    : '0 Bytes';
  
  const stackDepth = currentStep?.stack.length || 0;
  const heapNodes = currentStep ? Object.keys(currentStep.heap).length : 0;
  const varsCount = currentStep ? Object.keys(currentStep.variables).length : 0;

  return (
    <div className="w-full max-w-6xl flex flex-col gap-3 py-1">
      {/* 1. Debugger Timeline Dot-Indicator Row */}
      <div className="w-full flex items-center justify-between bg-zinc-900/30 border border-zinc-800/40 p-2 rounded-xl relative z-40">
        <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-mono pl-2 shrink-0">
          Timeline
        </span>
        <div className="flex-1 flex items-center justify-start overflow-x-auto px-6 py-2 no-scrollbar scroll-smooth">
          {timeline.map((item, idx) => {
            const isActive = idx === currentStepIndex;
            const isPast = idx < currentStepIndex;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div 
                    className={`h-[2px] w-5 md:w-8 shrink-0 transition-colors duration-200 ${
                      isPast ? 'bg-blue-500' : 'bg-zinc-800'
                    }`} 
                  />
                )}
                <div 
                  className="relative group cursor-pointer shrink-0" 
                  onClick={() => jumpToStep(idx)}
                >
                  <div 
                    className={`h-3 w-3 rounded-full transition-all duration-200 flex items-center justify-center ${
                      isActive 
                        ? 'bg-blue-500 scale-125 ring-4 ring-blue-500/30' 
                        : isPast 
                          ? 'bg-blue-600/70 hover:bg-blue-500' 
                          : 'bg-zinc-800 hover:bg-zinc-700'
                    }`} 
                  />
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg text-[10px] text-zinc-300 font-mono shadow-2xl pointer-events-none whitespace-nowrap transition-all">
                    <span className="font-bold text-white">Step {item.step} of {totalSteps}</span>
                    <span className="text-zinc-400">Line: {item.line} | Event: {item.eventType}</span>
                    <span className="text-amber-400/90 text-[9px] mt-0.5">Changes: {item.variablesChanged}</span>
                    <span className="text-zinc-500 mt-1 max-w-[200px] truncate border-t border-zinc-800 pt-1">
                      {item.operation}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <span className="text-[10px] text-zinc-500 font-mono font-medium pr-2 shrink-0">
          {currentStepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* 2. Controls and Performance Metrics Row */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Current Instruction Display */}
        <div className="flex flex-col text-left max-w-xs xl:max-w-md w-full lg:w-auto">
          <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
            Debugger Event
          </span>
          <span className="text-xs font-semibold text-zinc-300 truncate mt-0.5" title={currentStep?.operation}>
            {currentStep?.operation || 'Start of debugger'}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => executionEngine.restart()}
            className="p-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Restart Execution [R]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => executionEngine.stepBackward()}
            disabled={currentStepIndex === 0}
            className="p-2 border border-zinc-800 hover:bg-zinc-900 disabled:opacity-30 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Step Backward [Left]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {isPlaying && executionStatus === 'running' ? (
            <button
              onClick={() => executionEngine.pause()}
              className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-full transition-all shadow-lg shadow-white/5"
              title="Pause Execution [Space]"
            >
              <Pause className="h-5 w-5 fill-current text-zinc-950" />
            </button>
          ) : (
            <button
              onClick={() => executionEngine.play()}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-lg shadow-blue-500/15"
              title="Play execution [Space]"
            >
              <Play className="h-5 w-5 fill-current text-white" />
            </button>
          )}

          <button
            onClick={() => executionEngine.stepForward()}
            disabled={isCompleted}
            className="p-2 border border-zinc-800 hover:bg-zinc-900 disabled:opacity-30 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Step Forward [Right]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Controls and Metrics */}
        <div className="flex items-center gap-6 w-full lg:w-auto justify-end">
          {/* Speed Presets */}
          <div className="flex border border-zinc-850 rounded-lg overflow-hidden bg-zinc-900/40 p-0.5 shrink-0">
            {([0.5, 1, 2, 4] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => executionEngine.setSpeed(speed)}
                className={`px-2.5 py-1 text-[9px] font-bold rounded font-mono transition-colors ${
                  playbackSpeed === speed 
                    ? 'bg-blue-600 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Live Performance Metrics Widget */}
          <div className="flex items-center gap-5 border-l border-zinc-800 pl-5 text-[10px] text-zinc-500 font-mono font-medium shrink-0">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3 w-3 text-zinc-600" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">Exec Time</span>
                <span className="text-zinc-300 font-semibold mt-px">{execTime}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-zinc-600" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">RAM Allocation</span>
                <span className="text-zinc-300 font-semibold mt-px">{memoryUsage}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-zinc-600" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">Stack Depth</span>
                <span className="text-zinc-300 font-semibold mt-px">{stackDepth} frames</span>
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">Heap Nodes</span>
              <span className="text-zinc-300 font-semibold mt-px">{heapNodes} objs</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] uppercase tracking-wider text-zinc-500">Vars</span>
              <span className="text-zinc-300 font-semibold mt-px">{varsCount} active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackController;
