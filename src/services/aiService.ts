export interface AIExplanation {
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityReasoning: string;
  optimizationSuggestions: string[];
  interviewTips: string[];
  followUpQuestions: string[];
  debugWarnings: string[];
}

export const aiService = {
  async generateAnalysis(_code: string, category: string): Promise<AIExplanation> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (category === 'Array') {
      return {
        explanation: 'This code performs an element insertion in a static array. To insert an element at a specific index, all elements to the right of that index must be shifted one position to the right. This opens up a slot for the new value while preserving array integrity.',
        timeComplexity: 'O(N) - Linear Time',
        spaceComplexity: 'O(1) - Auxiliary Space',
        complexityReasoning: 'In the worst case (inserting at index 0), we must traverse and shift all N elements. Since shifting is done in-place, the auxiliary memory used is constant and independent of array size.',
        optimizationSuggestions: [
          'Use a dynamic array (like std::vector in C++) to auto-resize, though insertion still requires O(N) shifts.',
          'If ordering does not matter, swap the element at the target index with the new element, yielding O(1) insertion.'
        ],
        interviewTips: [
          'Be prepared to explain why inserting at the end of an array is O(1) amortized, but inserting at the beginning is O(N).',
          'Highlight bounds checking: always ensure index < capacity before performing shifts to avoid Buffer Overflow vulnerabilities (classic security exploit).'
        ],
        followUpQuestions: [
          'How would you adapt this algorithm if the array was sorted and we wanted to insert the element in its correct position?',
          'What happens if we allocate arrays on the stack versus the heap in C? How is memory managed?'
        ],
        debugWarnings: [
          'Ensure the array size does not exceed the capacity limit (5). Attempting to shift beyond 5 will write into out-of-bound memory, leading to Segmentation Faults or stack corruption.'
        ]
      };
    }

    if (category === 'Stack') {
      return {
        explanation: 'This implementation models a Stack using a static array. A stack operates on the Last-In-First-Out (LIFO) principle. Elements are pushed onto the top of the stack and popped from the top. The "top" integer tracks the active index.',
        timeComplexity: 'O(1) - Constant Time',
        spaceComplexity: 'O(N) - Linear space for storage',
        complexityReasoning: 'Both push and pop operations only increment or decrement the index pointer and execute a direct array index assignment, which completes in a fixed number of CPU cycles.',
        optimizationSuggestions: [
          'Implement the stack using a Singly Linked List to bypass the maximum array size limit (MAX), allowing the stack to grow dynamically with memory.',
          'Provide a resize function that doubles the capacity of the backing array when full, similar to dynamic vectors.'
        ],
        interviewTips: [
          'Stacks are core to depth-first searches (DFS), undo/redo histories, and syntax compilers parsing parentheses.',
          'Understand stack frames: explain how the C compiler uses the call stack to manage local variables and return addresses during function executions.'
        ],
        followUpQuestions: [
          'How would you implement a stack where you can retrieve the minimum element in O(1) time?',
          'Can you implement a Queue using two Stacks? What would be the time complexities of enqueue and dequeue?'
        ],
        debugWarnings: [
          'Stack Overflow occurs if push is called when top >= MAX - 1. Stack Underflow occurs when popping from an empty stack (top < 0). Always include validation checks!'
        ]
      };
    }

    if (category === 'Linked List') {
      return {
        explanation: 'This code appends a node to a Singly Linked List. In a linked list, elements (nodes) are allocated dynamically on the Heap. Each node stores a data value and a pointer (address) to the next node, creating a sequential chain.',
        timeComplexity: 'O(N) - Linear Time',
        spaceComplexity: 'O(1) - Auxiliary Space',
        complexityReasoning: 'Without a reference to the tail, we must start at the head node and traverse through the chain (following `next` pointers) to locate the final node before linking. Heap node creation is O(1).',
        optimizationSuggestions: [
          'Maintain a `tail` pointer alongside the `head` pointer to allow O(1) appends directly without traversal.',
          'Consider a Doubly Linked List if reverse traversal or node deletion is required, although each node will require an extra pointer (8 bytes in 64-bit systems).'
        ],
        interviewTips: [
          'Be comfortable writing list traversal, cycle detection (Floyd\'s Tortoise and Hare), and list reversal in a whiteboard interview.',
          'Emphasize that linked list elements are not stored contiguously in memory, which means they do not benefit from CPU cache locality, making traversal slower than array iteration.'
        ],
        followUpQuestions: [
          'How do you reverse a singly linked list in-place in O(N) time and O(1) space?',
          'How would you check if a linked list contains a loop or cycle without using extra memory?'
        ],
        debugWarnings: [
          'Memory Leak: Nodes allocated on the heap using `malloc` will remain in memory until explicitly freed. Ensure you write a function to free all nodes when the list is destroyed.',
          'Dangling Pointer: If you free a node but keep its address in a pointer variable, dereferencing it will trigger undefined behavior.'
        ]
      };
    }

    if (category === 'Queue') {
      return {
        explanation: 'This code implements a Queue using a static array. A Queue operates on a First-In-First-Out (FIFO) pipeline. Enqueue adds elements at the "rear" index, and dequeue removes elements from the "front" index.',
        timeComplexity: 'O(1) - Constant Time',
        spaceComplexity: 'O(N) - Space for storing queue elements',
        complexityReasoning: 'Adding at the rear and pulling from the front only require pointer updates and array assignments, completing in O(1) constant time.',
        optimizationSuggestions: [
          'Implement a Circular Queue to recycle empty array cells created at the front when elements are dequeued.',
          'Use a Doubly Linked List to build a dynamic queue that never overflows.'
        ],
        interviewTips: [
          'Queues are critical for breadth-first searches (BFS), task scheduling, print queues, and web server request buffering.',
          'Be prepared to describe the difference between simple queues, circular queues, double-ended queues (Deques), and priority queues.'
        ],
        followUpQuestions: [
          'How does a Circular Queue determine if it is completely full versus completely empty when front == rear?',
          'How does a priority queue manage ordering, and what is its standard underlying data structure?'
        ],
        debugWarnings: [
          'Static Queue Limitation: Once rear reaches the end of the array, you cannot enqueue further elements, even if you have dequeued items and have free space at the front.'
        ]
      };
    }

    return {
      explanation: 'Executing C programming statements. Local variables update within stack frames, changing compiler states step-by-step.',
      timeComplexity: 'O(N) - Estimated',
      spaceComplexity: 'O(1) - Constant auxiliary space',
      complexityReasoning: 'Standard sequential operations execution. No auxiliary memory allocated.',
      optimizationSuggestions: [
        'Review loop nesting to avoid quadratic time complexities.',
        'Ensure proper pointer validation checks before dereferencing.'
      ],
      interviewTips: [
        'Double check boundary parameters.',
        'Review heap vs stack allocations.'
      ],
      followUpQuestions: [
        'How would you refactor this to use recursion?',
        'Can this be solved in-place?'
      ],
      debugWarnings: [
        'Verify pointers are not NULL before performing pointer dereferences.'
      ]
    };
  }
};
