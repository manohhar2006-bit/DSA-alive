import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useExecutionStore } from '../../hooks/useExecution';
import { useTrace } from '../../context/TraceContext';
import { 
  Sparkles, 
  Brain, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  X, 
  Database,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

// ============================================================================
// DYNAMIC 2D VISUAL HINT COMPONENT
// ============================================================================
interface VisualHintProps {
  category: string;
  step: any;
}

const VisualHint: React.FC<VisualHintProps> = ({ category, step }) => {
  const parseArrayValue = (valStr: string): string[] => {
    if (!valStr) return [];
    const match = valStr.match(/\[(.*)\]/);
    if (match) {
      return match[1].split(',').map(s => s.trim());
    }
    return [];
  };

  if (!step) return null;

  if (category === 'Stack') {
    const stackVar = step.variables['stack'];
    const stackValues = stackVar ? parseArrayValue(stackVar.value) : [];
    const topVar = step.variables['top'];
    const topIdx = topVar ? parseInt(topVar.value) : -1;
    const slots = Array.from({ length: 5 }, (_, i) => 4 - i); // 4 down to 0
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl my-2">
        <span className="text-[10px] text-zinc-500 font-mono mb-3 uppercase tracking-wider">LIFO Stack Representation</span>
        <div className="flex items-center gap-6">
          <div className="flex flex-col border-2 border-b-4 border-zinc-700 w-24 rounded-b-lg overflow-hidden">
            {slots.map((idx) => {
              const val = stackValues[idx] || '0';
              const isTop = idx === topIdx;
              const isEmpty = idx > topIdx;
              return (
                <div 
                  key={idx}
                  className={`h-7 border-b border-zinc-850 flex items-center justify-center font-mono text-xs transition-all ${
                    isTop 
                      ? 'bg-amber-500/20 text-amber-400 font-bold border-l border-r border-amber-500' 
                      : isEmpty 
                        ? 'bg-zinc-950/10 text-zinc-700' 
                        : 'bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  {isEmpty ? '-' : val}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col justify-between h-[140px] font-mono text-[9px] text-zinc-400">
            {slots.map((idx) => {
              const isTop = idx === topIdx;
              return (
                <div key={idx} className="h-7 flex items-center">
                  {isTop ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      ⬅ top = {idx}
                    </span>
                  ) : (
                    <span className="text-zinc-600">idx {idx}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (category === 'Queue') {
    const queueVar = step.variables['queue'];
    const queueValues = queueVar ? parseArrayValue(queueVar.value) : [];
    const frontVar = step.variables['front'];
    const rearVar = step.variables['rear'];
    const frontIdx = frontVar ? parseInt(frontVar.value) : -1;
    const rearIdx = rearVar ? parseInt(rearVar.value) : -1;
    
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl my-2">
        <span className="text-[10px] text-zinc-500 font-mono mb-3 uppercase tracking-wider">FIFO Queue Representation</span>
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-[200px] justify-between px-2 h-6 font-mono text-[8px] relative">
            {Array.from({ length: 5 }).map((_, idx) => {
              const isFront = idx === frontIdx;
              const isRear = idx === rearIdx;
              return (
                <div key={idx} className="w-8 text-center flex flex-col items-center font-bold">
                  {isFront && <span className="text-green-400">front</span>}
                  {isRear && <span className="text-blue-400">rear</span>}
                </div>
              );
            })}
          </div>
          <div className="flex border-2 border-zinc-700 rounded-lg overflow-hidden w-[200px]">
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = queueValues[idx] || '0';
              const isInQueue = frontIdx !== -1 && rearIdx !== -1 && idx >= frontIdx && idx <= rearIdx;
              return (
                <div 
                  key={idx}
                  className={`w-10 h-10 border-r last:border-0 border-zinc-800 flex items-center justify-center font-mono text-xs transition-all ${
                    isInQueue 
                      ? 'bg-blue-500/10 text-white font-semibold' 
                      : 'bg-zinc-950/20 text-zinc-700'
                  }`}
                >
                  {val}
                </div>
              );
            })}
          </div>
          <div className="flex w-[200px] justify-between px-2 text-[8px] text-zinc-600 font-mono">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className="w-8 text-center">[{idx}]</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === 'Array') {
    const arrVar = step.variables['arr'];
    const arrValues = arrVar ? parseArrayValue(arrVar.value) : [];
    const sizeVar = step.variables['size'];
    const sizeVal = sizeVar ? parseInt(sizeVar.value) : 4;
    const indexVar = step.variables['index'];
    const indexVal = indexVar ? parseInt(indexVar.value) : -1;
    const iVar = step.variables['i'];
    const iVal = iVar ? parseInt(iVar.value) : -1;
    
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl my-2">
        <span className="text-[10px] text-zinc-500 font-mono mb-3 uppercase tracking-wider">Array Insertion (Max Size: 5)</span>
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-[200px] justify-between px-2 h-6 font-mono text-[8px]">
            {Array.from({ length: 5 }).map((_, idx) => {
              const isTargetIndex = idx === indexVal;
              const isLoopIndex = idx === iVal;
              return (
                <div key={idx} className="w-8 text-center flex flex-col items-center font-bold">
                  {isTargetIndex && <span className="text-amber-400">target</span>}
                  {isLoopIndex && <span className="text-cyan-400">i ({iVal})</span>}
                </div>
              );
            })}
          </div>
          <div className="flex border-2 border-zinc-700 rounded-lg overflow-hidden w-[200px]">
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = arrValues[idx] || '0';
              const isAllocated = idx < sizeVal;
              return (
                <div 
                  key={idx}
                  className={`w-10 h-10 border-r last:border-0 border-zinc-800 flex items-center justify-center font-mono text-xs transition-all ${
                    idx === indexVal 
                      ? 'bg-amber-500/20 text-amber-400 font-bold' 
                      : isAllocated 
                        ? 'bg-zinc-900/60 text-zinc-200' 
                        : 'bg-zinc-950/40 text-zinc-700'
                  }`}
                >
                  {isAllocated ? val : '-'}
                </div>
              );
            })}
          </div>
          <div className="flex w-[200px] justify-between px-2 text-[8px] text-zinc-600 font-mono">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className="w-8 text-center">[{idx}]</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === 'Linked List') {
    const headVar = step.variables['head'];
    const headAddr = headVar ? headVar.value : null;
    
    const nodesList: any[] = [];
    let currentAddr = headAddr;
    const visited = new Set<string>();
    while (currentAddr && currentAddr !== 'NULL' && currentAddr !== '0x0' && !visited.has(currentAddr)) {
      visited.add(currentAddr);
      const node = step.memory.heap[currentAddr];
      if (!node) break;
      nodesList.push(node);
      currentAddr = node.nextAddress || null;
    }

    const pointerTags: Record<string, string[]> = {};
    Object.entries(step.variables).forEach(([name, v]: [string, any]) => {
      if (v.isPointer && v.pointerTo && v.pointerTo !== 'NULL') {
        const addr = v.pointerTo;
        if (!pointerTags[addr]) pointerTags[addr] = [];
        pointerTags[addr].push(name);
      }
    });

    if (nodesList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl my-2">
          <span className="text-[10px] text-zinc-500 font-mono">Linked List empty (head ➜ NULL)</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl my-2 overflow-x-auto w-full">
        <span className="text-[10px] text-zinc-500 font-mono mb-4 uppercase tracking-wider">Heap Node Pointer Map</span>
        <div className="flex items-center gap-2 font-mono text-[9px] min-h-[60px] min-w-max px-2">
          {nodesList.map((node, idx) => {
            const tags = pointerTags[node.address] || [];
            const dataVal = node.label.replace('Data: ', '');
            return (
              <React.Fragment key={node.address}>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-4 flex flex-col items-center justify-end gap-0.5">
                    {tags.map((tag) => (
                      <span key={tag} className="text-[8px] bg-purple-950/60 border border-purple-800/40 text-purple-300 px-1 py-px rounded font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex border border-zinc-700 bg-zinc-950 rounded overflow-hidden shadow-lg">
                    <div className="px-2 py-1 bg-zinc-900/80 border-r border-zinc-800 text-white font-bold text-center">
                      {dataVal}
                    </div>
                    <div className="px-2 py-1 text-cyan-400 font-bold bg-zinc-950 text-center">
                      {node.nextAddress && node.nextAddress !== 'NULL' ? node.nextAddress.slice(-4) : '●'}
                    </div>
                  </div>
                  <span className="text-[7.5px] text-zinc-600 font-mono mt-0.5">{node.address.slice(-4)}</span>
                </div>
                {idx < nodesList.length - 1 && (
                  <span className="text-zinc-600 font-bold animate-pulse">➜</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================================
// VOCABULARY KNOWLEDGE DICTIONARY
// ============================================================================
const VOCABULARY_DB: Record<string, { term: string; definition: string }> = {
  malloc: { term: 'malloc()', definition: 'Memory Allocation: A standard C library function that dynamically allocates a requested block of memory on the Heap at runtime.' },
  free: { term: 'free()', definition: 'Release Memory: A C function that deallocates memory blocks previously allocated on the Heap, avoiding memory leaks.' },
  sizeof: { term: 'sizeof', definition: 'Size Operator: A C operator that returns the exact memory footprint (in bytes) of a specific data type or structure.' },
  pointer: { term: 'Pointer', definition: 'Address Variable: A special variable type in C that stores the raw RAM memory address of another variable rather than data.' },
  null: { term: 'NULL', definition: 'Null Constant: A built-in pointer value that points to nothing, typically used to initialize pointers or represent empty list endings.' },
  struct: { term: 'struct', definition: 'Structure: A composite user-defined data type grouping multiple related variable elements under a single unified name.' },
  top: { term: 'top', definition: 'Stack Pointer: A control index tracking the offset of the uppermost valid element inside the stack array.' },
  front: { term: 'front', definition: 'Queue Head: An index or pointer tracking the oldest element in the queue, representing the exit point for dequeue operations.' },
  rear: { term: 'rear', definition: 'Queue Tail: An index or pointer tracking the newest element in the queue, representing the entry point for enqueue operations.' },
  dereference: { term: 'Dereference (*)', definition: 'Value Lookup: The action of accessing the value stored at the memory address pointed to by a pointer variable.' }
};

// ============================================================================
// CONTEXTUAL MOCK Q&A CHATBOT DICTIONARY
// ============================================================================
const MOCK_CHAT_DB: Record<string, string> = {
  'why is top initialized to -1?': 'In C arrays, indexes start at 0. Since `top` tracks the index of the highest item inside the stack, initializing `top = -1` indicates that the stack is completely empty. If we initialized it to `0`, the engine would assume we have a valid element stored at index 0.',
  'what happens if stack is full?': 'When the stack reaches its capacity limit (`top >= MAX - 1`), any subsequent push operations are blocked and trigger a Stack Overflow. The code checks this constraint to protect RAM against buffer out-of-bounds corruption.',
  'explain pointers.': 'A Pointer is simply a variable that stores a memory address (e.g. `0x10a8`) where another value resides in RAM. Using pointers allows us to directly manipulate variables, allocate dynamic memory on the Heap, and construct linked structures without copying complete objects.',
  'why malloc?': '`malloc()` reserves memory on the Heap during runtime execution. Unlike stack-allocated variables which are deleted automatically when their function scope completes, Heap elements exist globally until you clean them up using `free()`. This makes malloc vital for custom data sizes.',
  'what is stack overflow?': 'Stack Overflow occurs when an application attempts to write data onto a stack structure that has already reached its memory boundaries, exceeding the index capacity limits and potentially corrupting the execution context.',
  'what is queue empty condition?': 'A static queue is empty when `front == -1` or when `front > rear` (meaning all enqueued items have been dequeued and the front index has overtaken the rear). Attempts to dequeue at this point cause a Queue Underflow.',
  'explain circular queue wraps.': 'In a simple static queue, once the rear index reaches the end of the array, enqueue fails even if front spaces have been popped. A Circular Queue resolves this by wrapping indices back to the start using modulus: `index = (index + 1) % MAX`.',
  'why shift elements?': 'To insert a value at index `K` of an array, we must preserve existing values. Shifting elements to the right starting from `size - 1` down to `K` creates a vacant spot, executing in O(N) linear time.',
  'array vs linked list?': 'Arrays are contiguous in memory with O(1) random lookup, but require expensive shifting shifts for insertions. Linked Lists are node collections linked by address pointers; list insertions are O(1) once at the address, but lookup is O(N) since you must traverse sequentially.',
  'show another example.': 'You can navigate to the Dashboard by clicking the button at the top-left of the workspace to select from our active modules: Array Shifting, Stack Operations, Linked List Appends, or Queue FIFO buffers!'
};

const RECOMMENDED_QUESTIONS: Record<string, string[]> = {
  'Stack': [
    'Why is top initialized to -1?',
    'What happens if stack is full?',
    'Explain pointers.'
  ],
  'Queue': [
    'What is queue empty condition?',
    'Explain circular queue wraps.',
    'Explain pointers.'
  ],
  'Linked List': [
    'Explain pointers.',
    'Why malloc?',
    'Array vs Linked List?'
  ],
  'Array': [
    'Why shift elements?',
    'Array vs Linked List?',
    'Explain pointers.'
  ]
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AITutorPanel: React.FC = () => {
  const trace = useExecutionStore((s) => s.executionTrace);
  const currentStepIndex = useExecutionStore((s) => s.currentStep);
  const currentStep = trace ? trace.steps[currentStepIndex] || null : null;

  const { 
    activeMCQ,
    mcqSubmitted,
    mcqSelectedOption,
    mcqIsCorrect,
    submitMCQ,
    dismissMCQ,
    isCompleted
  } = useTrace();

  // Accordion open/close state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    statement: true,
    whatHappened: true,
    memory: true,
    visualHint: true,
    complexity: false,
    pitfalls: false,
    vocabulary: false,
    askAi: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Chat chatbot state
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chatbot
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync category
  const category = useMemo(() => {
    if (!trace) return 'Array';
    if (trace.code.includes('arr[5] = {10, 20, 30, 40}')) return 'Array';
    if (trace.code.includes('stack[MAX]') || trace.code.includes('void push(')) return 'Stack';
    if (trace.code.includes('struct Node*')) return 'Linked List';
    if (trace.code.includes('queue[SIZE]')) return 'Queue';
    return 'Array';
  }, [trace]);

  // C code line parser
  const executingCodeLine = useMemo(() => {
    if (!trace || !currentStep) return '';
    const lines = trace.code.split('\n');
    const lineIdx = currentStep.line - 1;
    return lines[lineIdx] ? lines[lineIdx].trim() : '';
  }, [trace, currentStep]);

  // Dynamic changed variables
  const changedVariables = useMemo(() => {
    if (!currentStep || !trace) return [];
    const prevStep = currentStepIndex > 0 ? trace.steps[currentStepIndex - 1] : null;
    const list: { name: string; prev: string; next: string }[] = [];

    // Parse array elements changes if any
    Object.entries(currentStep.variables).forEach(([name, v]) => {
      const prevV = prevStep?.variables[name];
      if (v.type.includes('[') && v.value.startsWith('[')) {
        const match = v.value.match(/\[(.*)\]/);
        if (match) {
          const elements = match[1].split(',').map(s => s.trim());
          const prevElements = prevV?.value.match(/\[(.*)\]/)?.[1].split(',').map(s => s.trim()) || [];
          elements.forEach((elemVal, idx) => {
            const prevVal = prevElements[idx] || '0';
            if (prevVal !== elemVal) {
              list.push({ name: `${name}[${idx}]`, prev: prevVal, next: elemVal });
            }
          });
        }
      } else {
        if (!prevV || prevV.value !== v.value) {
          list.push({
            name: v.name,
            prev: prevV ? prevV.value : 'uninitialized',
            next: v.value
          });
        }
      }
    });

    return list;
  }, [currentStep, trace, currentStepIndex]);

  // Dynamic vocabulary keyword scanning
  const activeVocabulary = useMemo(() => {
    if (!currentStep) return [];
    const block = (executingCodeLine + ' ' + currentStep.operation).toLowerCase();
    const vocabFound: { term: string; definition: string }[] = [];
    Object.keys(VOCABULARY_DB).forEach(key => {
      if (block.includes(key)) {
        vocabFound.push(VOCABULARY_DB[key]);
      }
    });
    return vocabFound;
  }, [executingCodeLine, currentStep]);

  // Conceptual why fallbacks
  const conceptWhy = useMemo(() => {
    if (currentStep?.why) return currentStep.why;
    if (category === 'Stack') {
      return 'Stacks store data in a strict Last-In-First-Out sequence. Moving the stack index upwards allocates an active element frame.';
    }
    if (category === 'Queue') {
      return 'Queues structure elements sequentially in First-In-First-Out order. Enqueue appends to the rear, while dequeue unlinks from the front.';
    }
    if (category === 'Linked List') {
      return 'Linked lists allocate dynamic structures in scattered Heap locations, chain-linked together using unique pointer addresses.';
    }
    return 'Static arrays occupy contiguous slots in stack memory. Insertions require shifting adjacent indices to avoid data overwrite.';
  }, [currentStep, category]);

  // FAANG Interview tip fallbacks
  const currentInterviewTip = useMemo(() => {
    if (currentStep?.interviewTip) return currentStep.interviewTip;
    if (category === 'Stack') {
      return 'Verify top limit limits (top >= MAX - 1) before pushing, and boundary drops (top < 0) before popping to block underflows.';
    }
    if (category === 'Queue') {
      return 'Queues frequently utilize circular wrapping indices to optimize unoccupied slot spaces: index = (index + 1) % MAX.';
    }
    if (category === 'Linked List') {
      return 'Understand dynamic allocation leaks. Always trace node references to prevent dereferencing dangling NULL references.';
    }
    return 'Array insertions run in linear O(N) time in the worst-case (inserting at index 0). Contrast this with linked list bounds.';
  }, [currentStep, category]);

  // Common Mistakes fallbacks
  const currentCommonMistake = useMemo(() => {
    if (currentStep?.commonMistakes && currentStep.commonMistakes.length > 0) {
      return currentStep.commonMistakes[0];
    }
    if (category === 'Stack') {
      return 'Incrementing stack top after allocating the slot value rather than incrementing top first: top++; stack[top] = value.';
    }
    if (category === 'Queue') {
      return 'Leaving front uninitialized at -1 after the first enqueue. Always update front = 0 on inserting the initial queue item.';
    }
    if (category === 'Linked List') {
      return 'Losing reference to head nodes by dereferencing without tracking nodes sequentially using temporary pointers.';
    }
    return 'Shifting elements forwards from index to size instead of backwards from size down to index, which overwrites values.';
  }, [currentStep, category]);

  // Real-life analogy fallbacks
  const currentAnalogy = useMemo(() => {
    if (currentStep?.analogy) return currentStep.analogy;
    if (category === 'Stack') {
      return 'Imagine stacking dinner plates in a cabinet. You place new plates on top and retrieve them from the top first.';
    }
    if (category === 'Queue') {
      return 'Like a checkout queue at a grocery store. The shopper at the front is served first, and new shoppers join the rear.';
    }
    if (category === 'Linked List') {
      return 'Similar to a scavenger hunt. Each node is a clue indicating where to find the address of the next item.';
    }
    return 'Like an egg carton with fixed slots. To insert an egg in the middle, you must slide subsequent eggs to adjacent slots.';
  }, [currentStep, category]);

  // Dynamic Learning Progress Bar
  const learningProgress = useMemo(() => {
    if (!trace) return { percent: 0, confidence: 'Initiating' };
    const percent = Math.min(100, Math.round(((currentStepIndex + 1) / trace.steps.length) * 100));
    let confidence = 'Initiating';
    if (percent > 85) confidence = 'FAANG-Ready!';
    else if (percent > 60) confidence = 'Confident';
    else if (percent > 30) confidence = 'Progressing';
    return { percent, confidence };
  }, [trace, currentStepIndex]);

  // final AI Execution Summary Report
  const finalSummary = useMemo(() => {
    if (!trace) return null;
    let varChanges = 0;
    let heapAllocations = 0;
    trace.steps.forEach((s, idx) => {
      if (idx > 0) {
        const prevStep = trace.steps[idx - 1];
        Object.entries(s.variables).forEach(([name, v]) => {
          const prevV = prevStep.variables[name];
          if (!prevV || prevV.value !== v.value) varChanges++;
        });
      }
      if (s.eventType === 'MEMORY_ALLOCATED' || s.eventType === 'NODE_CREATED') {
        heapAllocations++;
      }
    });

    return {
      concept: category === 'Stack' ? 'Stack Push & Pop' : category === 'Queue' ? 'Queue FIFO Buffer' : category === 'Linked List' ? 'Linked List Heap Append' : 'Array Shift & Insert',
      operations: trace.steps.length,
      variablesCount: Object.keys(currentStep?.variables || {}).length,
      allocations: heapAllocations,
      time: currentStep?.complexity.time || 'O(1)',
      space: currentStep?.complexity.space || 'O(1)',
    };
  }, [trace, category, currentStep]);

  // Handle message send in chatbot
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    setMessages(prev => [...prev, { sender: 'user', text: cleanText }]);
    setInputValue('');
    setIsTyping(true);

    // Mock chatbot logic with delay
    setTimeout(() => {
      const matchKey = Object.keys(MOCK_CHAT_DB).find(k => cleanText.toLowerCase().includes(k) || k.includes(cleanText.toLowerCase()));
      const reply = matchKey ? MOCK_CHAT_DB[matchKey] : MOCK_CHAT_DB['show another example.'];
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
      setIsTyping(false);
    }, 500);
  };

  if (!currentStep) {
    return (
      <div className="h-full w-full flex items-center justify-center text-zinc-500 text-xs font-mono bg-zinc-950">
        No active debugger execution trace loaded.
      </div>
    );
  }

  const activeQuestions = RECOMMENDED_QUESTIONS[category] || RECOMMENDED_QUESTIONS['Array'];

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950 border-l border-zinc-900 relative select-none">
      {/* Header */}
      <div className="h-10 shrink-0 border-b border-zinc-900 bg-zinc-950/60 px-4 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-zinc-300">
            Interactive AI Tutor
          </span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-purple-400 bg-purple-950/40 border border-purple-800/40 px-1.5 py-0.5 rounded font-mono">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>TEACHING MODE ACTIVE</span>
        </div>
      </div>

      {/* Main tutor panel viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
        
        {/* Section 13: Learning Progress Indicator */}
        <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/30 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-zinc-400 font-bold uppercase tracking-wider">Concept: {category}s</span>
            <span className="text-zinc-500">Confidence: <span className="text-cyan-400 font-bold">{learningProgress.confidence}</span></span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 rounded-full" 
              style={{ width: `${learningProgress.percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
            <span>Progress: {currentStepIndex + 1}/{trace?.steps.length} Steps</span>
            <span className="text-purple-400 font-bold">{learningProgress.percent}% Understood</span>
          </div>
        </div>

        {/* Section 14: Predict the Next Step Indicator Card */}
        {activeMCQ && (
          <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2 animate-pulse">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[10px] font-mono">
              <HelpCircle className="h-4 w-4" />
              <span>PREDICT THE NEXT STEP ACTIVE</span>
            </div>
            <p className="text-[10px] text-zinc-300 leading-relaxed font-light font-mono">
              The debugger has paused execution at index [{currentStepIndex}]. Resolve the checkpoint MCQ to resume.
            </p>
          </div>
        )}

        {/* Section 15: AI Execution Summary (Only displayed when complete) */}
        {isCompleted && finalSummary && (
          <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/10 space-y-3 shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] bg-green-500/20 w-16 h-16 rounded-full blur-xl" />
            <div className="flex items-center gap-2 text-green-400 font-bold text-xs font-mono uppercase tracking-wider">
              <Award className="h-5 w-5" />
              <span>Execution Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-300 pt-1">
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 text-[8px] block uppercase">Concept Learned</span>
                <span className="font-bold text-white">{finalSummary.concept}</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 text-[8px] block uppercase">Interview Readiness</span>
                <span className="font-bold text-green-400">FAANG-Ready</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 text-[8px] block uppercase">Steps Executed</span>
                <span className="font-bold text-cyan-400">{finalSummary.operations}</span>
              </div>
              <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850">
                <span className="text-zinc-500 text-[8px] block uppercase">Dynamic Allocations</span>
                <span className="font-bold text-purple-400">{finalSummary.allocations}</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Current Statement Card */}
        <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold font-mono">
              Current Statement
            </span>
            <span className="text-[9px] font-bold font-mono text-zinc-500">
              Line {currentStep.line}
            </span>
          </div>
          <div className="text-xs font-mono text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex justify-between items-center shadow-inner">
            <span className="text-white font-bold">{executingCodeLine || currentStep.operation}</span>
            <span className="text-[8px] text-zinc-500 font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded">
              {currentStep.eventType}
            </span>
          </div>
        </div>

        {/* Card 2: Explanation Insights Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('whatHappened')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <span>What happened & Why?</span>
            </div>
            {expandedSections.whatHappened ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.whatHappened && (
            <div className="p-3.5 space-y-3 border-t border-zinc-900 bg-zinc-950/20 text-xs">
              {/* Section 2: What Just Happened? */}
              <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">What Just Happened?</span>
                <p className="text-zinc-400 font-light leading-relaxed">
                  {currentStep.aiExplanation || currentStep.explanation}
                </p>
              </div>

              {/* Section 3: Why? */}
              <div className="space-y-1 border-t border-zinc-900 pt-2.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Why did it happen?</span>
                <p className="text-zinc-400 font-light leading-relaxed">
                  {conceptWhy}
                </p>
              </div>

              {/* Section 10: Real Life Analogy */}
              <div className="space-y-1 border-t border-zinc-900 pt-2.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Real-Life Analogy</span>
                <p className="text-zinc-500 font-light italic leading-relaxed">
                  "{currentAnalogy}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Memory Changes & Visual Hint Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('memory')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span>Memory Inspector & Visual Hint</span>
            </div>
            {expandedSections.memory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.memory && (
            <div className="p-3.5 space-y-3.5 border-t border-zinc-900 bg-zinc-950/20 text-xs">
              
              {/* Section 4: Memory Changes Table */}
              <div className="space-y-2">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Memory Changes</span>
                {changedVariables.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 font-mono italic">No variable state changes on this step.</p>
                ) : (
                  <div className="space-y-1.5">
                    {changedVariables.map((v) => (
                      <div key={v.name} className="flex justify-between items-center text-[10px] font-mono bg-zinc-950 p-2 rounded-lg border border-zinc-900/60">
                        <span className="text-white font-bold">{v.name}</span>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <span className="text-amber-500/80">{v.prev}</span>
                          <span>➜</span>
                          <span className="text-green-400 font-bold">{v.next}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Memory block details */}
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono mt-1 pt-1.5 border-t border-zinc-900/60">
                  <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-850 text-center">
                    <span className="text-zinc-600 text-[8px] block uppercase">Address Mapped</span>
                    <span className="text-cyan-400 font-semibold">{changedVariables[0] ? '0x3000' : 'No Change'}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-850 text-center">
                    <span className="text-zinc-600 text-[8px] block uppercase">Allocated</span>
                    <span className="text-zinc-400 font-semibold">{currentStep.eventType.includes('ALLOCATED') || currentStep.eventType.includes('CREATED') ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-1.5 rounded border border-zinc-850 text-center col-span-1">
                    <span className="text-zinc-600 text-[8px] block uppercase">Heap Status</span>
                    <span className="text-purple-400 font-semibold truncate max-w-[80px]" title={Object.keys(currentStep.memory.heap).length > 0 ? 'Allocated' : 'No Change'}>
                      {Object.keys(currentStep.memory.heap).length > 0 ? 'Allocated' : 'No Change'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Visual Hint SVG diagram */}
              <div className="space-y-1 border-t border-zinc-900 pt-3">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Synchronized visual Hint</span>
                <VisualHint category={category} step={currentStep} />
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Complexity Metrics Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('complexity')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Complexity Metrics</span>
            </div>
            {expandedSections.complexity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.complexity && (
            <div className="p-3.5 space-y-3 border-t border-zinc-900 bg-zinc-950/20 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Section 8: Time Complexity */}
                <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-850">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Time Complexity</span>
                  <p className="text-sm font-extrabold text-blue-400 mt-1 font-mono">{currentStep.complexity.time || 'O(1)'}</p>
                </div>
                {/* Section 9: Space Complexity */}
                <div className="p-2.5 bg-zinc-900/40 rounded-lg border border-zinc-850">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Space Complexity</span>
                  <p className="text-sm font-extrabold text-purple-400 mt-1 font-mono">{currentStep.complexity.space || 'O(1)'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold font-mono">Complexity Justification</span>
                <p className="text-zinc-400 font-light leading-relaxed">
                  {currentStep.complexity.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 5: Interview Tip & Pitfalls Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('pitfalls')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>Interview Insights & Mistakes</span>
            </div>
            {expandedSections.pitfalls ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.pitfalls && (
            <div className="p-3.5 space-y-3.5 border-t border-zinc-900 bg-zinc-950/20 text-xs">
              
              {/* Section 6: Interview Tip */}
              <div className="space-y-1 bg-amber-950/10 border border-amber-500/20 p-3 rounded-lg">
                <span className="text-[8px] uppercase tracking-wider text-amber-400 font-bold font-mono flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Interview Takeaway</span>
                </span>
                <p className="text-amber-200 font-light mt-1 leading-relaxed">
                  {currentInterviewTip}
                </p>
              </div>

              {/* Section 7: Common Beginner Mistake */}
              <div className="space-y-1 bg-red-950/10 border border-red-500/20 p-3 rounded-lg">
                <span className="text-[8px] uppercase tracking-wider text-red-400 font-bold font-mono flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Common Beginner Pitfall</span>
                </span>
                <p className="text-red-200 font-light mt-1 leading-relaxed">
                  {currentCommonMistake}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card 6: Code Vocabulary Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('vocabulary')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <span>Vocabulary term Explainer ({activeVocabulary.length})</span>
            </div>
            {expandedSections.vocabulary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.vocabulary && (
            <div className="p-3.5 space-y-2 border-t border-zinc-900 bg-zinc-950/20 text-xs">
              {activeVocabulary.length === 0 ? (
                <p className="text-zinc-500 font-mono text-[10px] italic">No advanced keywords found in this statement.</p>
              ) : (
                <div className="space-y-2.5">
                  {activeVocabulary.map((v, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-850 space-y-1">
                      <span className="text-cyan-400 font-bold font-mono block">{v.term}</span>
                      <p className="text-zinc-400 leading-relaxed font-light text-[11px]">{v.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 7: Ask AI Chat Accordion */}
        <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/10">
          <button 
            onClick={() => toggleSection('askAi')}
            className="w-full p-3 flex items-center justify-between text-zinc-200 hover:text-white bg-zinc-900/40 text-xs font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-400" />
              <span>Ask AI Programming Tutor</span>
            </div>
            {expandedSections.askAi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.askAi && (
            <div className="p-3.5 border-t border-zinc-900 bg-zinc-950/20 space-y-3">
              {/* Recommended Questions list */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-900/60">
                {activeQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-[9px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 px-2 py-1 rounded-lg transition-colors hover:border-zinc-700"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat messages screen */}
              <div className="h-[140px] overflow-y-auto space-y-2 p-2 rounded-lg bg-zinc-950/40 border border-zinc-900 flex flex-col">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 gap-1 mt-6">
                    <MessageSquare className="h-6 w-6 text-zinc-700" />
                    <span className="text-[10px] font-mono">Ask details or click a recommended prompt above.</span>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-xl p-2.5 text-[10.5px] leading-relaxed font-light ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white self-end text-right'
                        : 'bg-zinc-900 border border-zinc-850 text-zinc-300 self-start text-left'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="bg-zinc-900 border border-zinc-850 text-zinc-500 rounded-xl p-2.5 text-[10px] font-mono self-start animate-pulse">
                    AI is writing answer...
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat typing block */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask e.g. Why initialize to -1?"
                  className="flex-1 bg-zinc-950 border border-zinc-900 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none focus:border-zinc-700 font-mono shadow-inner"
                />
                <button 
                  type="submit"
                  className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors font-mono"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* MCQ CHECKPOINT QUESTION MODAL OVERLAY */}
      {activeMCQ && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md z-50 p-6 flex flex-col justify-center text-left">
          <div className="glass-card p-6 rounded-2xl border-purple-500/30 relative max-w-sm mx-auto shadow-2xl">
            <span className="absolute top-[-10px] right-4 bg-purple-600 text-[8px] uppercase font-bold text-white px-2 py-0.5 rounded-full tracking-widest font-mono shadow-lg">
              Checkpoint
            </span>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
              <span>Predict the next step</span>
            </h3>
            <p className="text-xs text-zinc-300 font-semibold mt-3 leading-relaxed font-mono border-b border-zinc-900 pb-3">
              {activeMCQ.question}
            </p>

            <div className="mt-4 space-y-2">
              {activeMCQ.options.map((opt, idx) => {
                const isSelected = mcqSelectedOption === idx;
                const isCorrect = idx === activeMCQ.correctIndex;
                
                let btnStyle = 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800/80 hover:text-white';
                if (mcqSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'border-green-500/50 bg-green-950/20 text-green-400 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500/50 bg-red-950/20 text-red-400';
                  } else {
                    btnStyle = 'border-zinc-900 bg-zinc-955 text-zinc-600 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={mcqSubmitted}
                    onClick={() => submitMCQ(idx)}
                    className={`w-full text-left p-3 border rounded-xl text-[11px] font-mono transition-all flex items-center justify-between shadow-sm ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {mcqSubmitted && isCorrect && <Check className="h-4 w-4 text-green-400 shrink-0" />}
                    {mcqSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {mcqSubmitted && (
              <div className="mt-4 space-y-3">
                <p className="text-[10px] text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-zinc-850 leading-relaxed font-light font-mono">
                  <span className="font-bold text-white block mb-1">Explanation:</span>
                  {activeMCQ.explanation}
                </p>
                
                <button
                  onClick={dismissMCQ}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center font-mono shadow-lg"
                >
                  {mcqIsCorrect ? 'Correct! Resume (+20 XP)' : 'Resume Execution'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITutorPanel;
