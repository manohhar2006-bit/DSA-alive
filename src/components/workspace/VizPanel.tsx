import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useExecutionStore } from '../../hooks/useExecution';
import { useTrace } from '../../context/TraceContext';
import { LESSONS } from '../../models/lessons';
import { ArrayAdapter } from '../../adapters/ArrayAdapter';
import { StackAdapter } from '../../adapters/StackAdapter';
import { QueueAdapter } from '../../adapters/QueueAdapter';
import { LinkedListAdapter } from '../../adapters/LinkedListAdapter';
import { TreeAdapter } from '../../adapters/TreeAdapter';
import { GraphAdapter } from '../../adapters/GraphAdapter';
import { UnifiedVisualizer } from './engine/UnifiedVisualizer';
import { HelpCircle, RefreshCw, Terminal } from 'lucide-react';

// ==========================================
// MAIN 3D VISUALIZATION VIEWPORT PANEL
// ==========================================
const VizPanel: React.FC = () => {
  const trace = useExecutionStore((s) => s.executionTrace);
  const currentStepIndex = useExecutionStore((s) => s.currentStep);
  const currentStep = trace ? trace.steps[currentStepIndex] || null : null;

  const { selectedLessonId } = useTrace();
  
  // Camera controls state
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  const category = useMemo(() => {
    if (!selectedLessonId) return 'Array';
    const lesson = LESSONS.find((l) => l.id === selectedLessonId);
    return lesson ? lesson.category : 'Array';
  }, [selectedLessonId]);

  // Adapter selection
  const activeAdapter = useMemo(() => {
    switch (category) {
      case 'Stack': return StackAdapter;
      case 'Queue': return QueueAdapter;
      case 'Linked List': return LinkedListAdapter;
      case 'Tree': return TreeAdapter;
      case 'Graph': return GraphAdapter;
      case 'Array':
      default: return ArrayAdapter;
    }
  }, [category]);

  // Run lifecycle hooks on the active adapter
  useEffect(() => {
    activeAdapter.initialize();
    return () => activeAdapter.dispose();
  }, [activeAdapter]);

  const { nodes, connections } = useMemo(() => {
    if (!currentStep) return { nodes: [], connections: [] };
    return activeAdapter.playStep(currentStep);
  }, [currentStep, activeAdapter]);

  // ==========================================
  // DEBUG CONSOLE / EVENT FEED LOGIC
  // ==========================================
  const consoleLogEndRef = useRef<HTMLDivElement>(null);

  const consoleLogs = useMemo(() => {
    if (!trace) return [];
    const logs: string[][] = [];

    // Reconstruct the trace history up to the current executing index
    for (let idx = 0; idx <= currentStepIndex; idx++) {
      const step = trace.steps[idx];
      const prevStep = idx > 0 ? trace.steps[idx - 1] : null;

      const stepLines: string[] = [];
      stepLines.push(`Step ${step.step}`);
      
      // Formatting Event Title
      const eventTitle = step.eventType
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ');
      stepLines.push(eventTitle);

      // Extract specific details
      if (step.eventType === 'VARIABLE_CHANGED' && prevStep) {
        let changed = false;
        Object.entries(step.variables).forEach(([name, v]) => {
          const prevV = prevStep.variables[name];
          if (!prevV || prevV.value !== v.value) {
            stepLines.push(`${name} changed`);
            stepLines.push(`${prevV ? prevV.value : 'uninitialized'} ➜ ${v.value}`);
            changed = true;
          }
        });
        if (!changed) {
          stepLines.push(step.operation);
        }
      } else if (step.eventType === 'POINTER_UPDATED' && prevStep) {
        let changed = false;
        Object.entries(step.variables).forEach(([name, v]) => {
          if (v.isPointer) {
            const prevV = prevStep.variables[name];
            if (!prevV || prevV.value !== v.value) {
              stepLines.push(`${name} pointer updated`);
              stepLines.push(`${prevV ? prevV.value : 'NULL'} ➜ ${v.value}`);
              changed = true;
            }
          }
        });
        if (!changed) {
          stepLines.push(step.operation);
        }
      } else if (step.eventType === 'STACK_PUSH') {
        stepLines.push(`Inserted value ${step.variables['stack']?.value.match(/\[(.*)\]/)?.[1].split(',')[step.variables['top'] ? parseInt(step.variables['top'].value) : 0]?.trim() || ''}`);
      } else if (step.eventType === 'STACK_POP' && prevStep) {
        const prevTop = prevStep.variables['top'] ? parseInt(prevStep.variables['top'].value) : 0;
        const prevStackVals = prevStep.variables['stack']?.value.match(/\[(.*)\]/)?.[1].split(',') || [];
        stepLines.push(`Popped value ${prevStackVals[prevTop]?.trim() || ''}`);
      } else {
        stepLines.push(step.operation);
      }

      logs.push(stepLines);
    }
    return logs;
  }, [trace, currentStepIndex]);

  // Auto-scroll console output container
  useEffect(() => {
    if (consoleLogEndRef.current) {
      consoleLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      {/* Viewport Header */}
      <div className="h-10 shrink-0 border-b border-zinc-900 bg-zinc-950/60 px-4 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-zinc-500">
            3D WebGL Canvas
          </span>
          <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.2 rounded font-mono">
            {category} VIEW
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setCameraResetKey((prev) => prev + 1)}
            className="p-1 border border-zinc-900 hover:bg-zinc-900/60 rounded text-zinc-400 hover:text-zinc-100 transition-colors" 
            title="Reset Viewangle"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Content Workspace */}
      <div className="flex-1 min-h-0 relative">
        <UnifiedVisualizer 
          category={category}
          step={currentStep}
          nodes={nodes}
          connections={connections}
          cameraResetKey={cameraResetKey}
        />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2 pointer-events-none select-none z-10 bg-zinc-950/20">
            <HelpCircle className="h-8 w-8 text-zinc-600 animate-pulse" />
            <p className="text-xs font-semibold">No active structural data allocated in RAM memory.</p>
            <p className="text-[10px] text-zinc-500">Run code step inputs to trigger malloc allocations.</p>
          </div>
        )}
      </div>

      {/* Debug Console / Event Feed */}
      <div className="h-[28%] shrink-0 border-t border-zinc-900 bg-zinc-950 flex flex-col">
        <div className="h-8 shrink-0 bg-zinc-900/40 border-b border-zinc-900 px-4 flex items-center gap-2 text-zinc-400">
          <Terminal className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[9px] uppercase font-bold tracking-widest font-mono text-zinc-500">
            Debugger Console
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] text-zinc-400 space-y-3 bg-zinc-950/80">
          {consoleLogs.map((logLines, idx) => (
            <div key={idx} className="text-left border-l border-blue-500/20 pl-2.5 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">{logLines[0]}</span>
                <span className="text-purple-400 text-[9px] font-semibold bg-purple-950/20 border border-purple-800/10 px-1 py-px rounded">
                  {logLines[1]}
                </span>
              </div>
              {logLines.slice(2).map((l, lIdx) => (
                <div key={lIdx} className="text-zinc-300 whitespace-pre-wrap pl-1 font-mono">
                  {l}
                </div>
              ))}
              {idx < consoleLogs.length - 1 && (
                <div className="border-t border-zinc-900/60 my-1 w-full" />
              )}
            </div>
          ))}
          <div ref={consoleLogEndRef} />
        </div>
      </div>
    </div>
  );
};

export default VizPanel;
