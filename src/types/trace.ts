export type EventType =
  | 'LINE_EXECUTED'
  | 'VARIABLE_CHANGED'
  | 'FUNCTION_CALL'
  | 'FUNCTION_RETURN'
  | 'MEMORY_ALLOCATED'
  | 'MEMORY_FREED'
  | 'NODE_CREATED'
  | 'NODE_DELETED'
  | 'POINTER_UPDATED'
  | 'ARRAY_ACCESS'
  | 'STACK_PUSH'
  | 'STACK_POP'
  | 'QUEUE_ENQUEUE'
  | 'QUEUE_DEQUEUE'
  | 'TREE_INSERT'
  | 'GRAPH_VISIT'
  | 'OUTPUT'
  | 'INPUT';

export interface Variable {
  name: string;
  type: string;
  value: string;
  address: string; // e.g. "0x7ffd8f2b3a1c"
  isPointer?: boolean;
  pointerTo?: string; // Target address it points to
  scope?: 'global' | 'local' | 'parameter';
  description?: string;
}

export interface MemoryNode {
  id: string; // e.g., "node_0x10a8"
  label: string; // e.g. "Data: 42"
  type: 'node' | 'pointer' | 'array_element';
  address: string;
  nextAddress?: string; // pointer link for linked list nodes
  prevAddress?: string; // pointer link for doubly linked lists
  value?: any;
  highlighted?: boolean;
}

export interface StackFrame {
  functionName: string;
  variables: Record<string, Variable>;
  line: number;
}

export interface ComplexityInfo {
  time: string;
  space: string;
  reasoning: string;
  optimizations: string[];
}

export interface MemoryBlock {
  address: string;
  size: number; // in bytes
  allocated: boolean;
  label: string;
  type: 'stack' | 'heap' | 'global';
}

export interface PointerReference {
  fromAddress: string;
  toAddress: string;
  name: string;
}

export interface MemoryState {
  global: Variable[];
  stack: StackFrame[];
  heap: Record<string, MemoryNode>;
  pointers: PointerReference[];
  objectIds: string[];
  blocks: MemoryBlock[];
}

export interface ExecutionStep {
  step: number; // 1-indexed execution step count
  stepIndex: number; // 0-indexed count for backwards compatibility
  line: number; // 1-indexed line number in the current source code
  operation: string; // Description of the exact operations: e.g. "Allocated node on heap"
  aiExplanation: string; // Beginner-friendly explanation of the execution logic
  eventType: EventType;
  stack: StackFrame[];
  heap: Record<string, MemoryNode>; // Memory address -> Node details
  variables: Record<string, Variable>; // Active local/global variables
  stdout: string; // Program stdout buffer accumulated up to this step
  memory: MemoryState; // Structured representation of the memory space
  timestamp: number; // Timestamp of step execution in ms
  complexity: ComplexityInfo;
  animationType: string;
  inputRequired?: boolean; // Wait flag for interactive execution input
  // Rich AI tutor fields
  why?: string;
  analogy?: string;
  commonMistakes?: string[];
  interviewTip?: string;
  // Backwards compatibility fallbacks
  explanation?: string;
  output?: string;
}

export interface ExecutionTrace {
  code: string;
  language: string;
  steps: ExecutionStep[];
}
