export interface MCQQuestion {
  id: string;
  stepIndex: number; // Execution pauses and prompts the user at this trace step index
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'Array' | 'Stack' | 'Queue' | 'Linked List' | 'Tree' | 'Graph';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  codeTemplate: string;
  mcqs: MCQQuestion[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'array-insertion',
    title: 'Array Insertion',
    description: 'Learn how elements are shifted and inserted into a static array in C.',
    category: 'Array',
    difficulty: 'Beginner',
    xpReward: 50,
    codeTemplate: `#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40};
    int size = 4;
    int element = 25;
    int index = 2;

    printf("Inserting %d at index %d\\n", element, index);

    // Shift elements to make room
    for (int i = size; i > index; i--) {
        arr[i] = arr[i - 1];
    }
    
    // Insert element
    arr[index] = element;
    size++;

    // Print array
    for(int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    mcqs: [
      {
        id: 'arr-q1',
        stepIndex: 5,
        question: 'Why do we loop backwards from size down to the target index?',
        options: [
          'To avoid overwriting values that we still need to shift.',
          'C arrays can only be shifted backwards.',
          'To make the insertion run in O(1) time.',
          'It is just a stylistic choice.'
        ],
        correctIndex: 0,
        explanation: 'Looping backwards (from size down to index) ensures that we shift elements to the right without overwriting the adjacent values before they can be copied.'
      },
      {
        id: 'arr-q2',
        stepIndex: 9,
        question: 'What is the time complexity of inserting an element at a random index in an array of size N?',
        options: [
          'O(1)',
          'O(log N)',
          'O(N)',
          'O(N log N)'
        ],
        correctIndex: 2,
        explanation: 'In the worst case (inserting at index 0), we must shift all N elements, leading to O(N) linear time complexity.'
      }
    ]
  },
  {
    id: 'stack-push-pop',
    title: 'Stack Operations',
    description: 'Visualize push and pop operations on a LIFO (Last-In-First-Out) stack structure.',
    category: 'Stack',
    difficulty: 'Beginner',
    xpReward: 75,
    codeTemplate: `#include <stdio.h>
#define MAX 5

int stack[MAX];
int top = -1;

void push(int value) {
    if (top >= MAX - 1) {
        printf("Stack Overflow\\n");
        return;
    }
    top++;
    stack[top] = value;
    printf("Pushed %d\\n", value);
}

int pop() {
    if (top < 0) {
        printf("Stack Underflow\\n");
        return -1;
    }
    int val = stack[top];
    top--;
    return val;
}

int main() {
    push(10);
    push(20);
    push(30);
    int popped = pop();
    return 0;
}`,
    mcqs: [
      {
        id: 'stack-q1',
        stepIndex: 4,
        question: 'What does top = -1 signify in this implementation?',
        options: [
          'The stack is completely full.',
          'The stack is empty.',
          'A memory leak occurred.',
          'The stack pointer points to garbage memory.'
        ],
        correctIndex: 1,
        explanation: 'A stack top index of -1 indicates there are no elements stored in the array yet, i.e., the stack is empty.'
      },
      {
        id: 'stack-q2',
        stepIndex: 12,
        question: 'After calling push(10) and push(20), what is the value of top?',
        options: [
          '0',
          '1',
          '2',
          '-1'
        ],
        correctIndex: 1,
        explanation: 'Each push increments the top index. Starting at -1, push(10) moves top to 0, and push(20) moves top to 1.'
      }
    ]
  },
  {
    id: 'linked-list-append',
    title: 'Linked List Append',
    description: 'Trace memory addresses and pointer updates when appending nodes on the Heap.',
    category: 'Linked List',
    difficulty: 'Intermediate',
    xpReward: 100,
    codeTemplate: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

struct Node* createNode(int val) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    newNode->data = val;
    newNode->next = NULL;
    return newNode;
}

void append(struct Node** head, int val) {
    struct Node* newNode = createNode(val);
    if (*head == NULL) {
        *head = newNode;
        return;
    }
    struct Node* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = newNode;
}

int main() {
    struct Node* head = NULL;
    append(&head, 5);
    append(&head, 15);
    return 0;
}`,
    mcqs: [
      {
        id: 'list-q1',
        stepIndex: 6,
        question: 'Where is the memory for the structural node allocated in C?',
        options: [
          'On the Stack frame.',
          'On the Heap using malloc.',
          'In global static memory.',
          'In code register cache.'
        ],
        correctIndex: 1,
        explanation: 'The function `malloc` allocates the requested amount of bytes on the Heap, returning a pointer to the memory location which persists until freed.'
      },
      {
        id: 'list-q2',
        stepIndex: 14,
        question: 'What is the time complexity of appending an element to a Linked List of size N without a tail pointer?',
        options: [
          'O(1)',
          'O(log N)',
          'O(N)',
          'O(N^2)'
        ],
        correctIndex: 2,
        explanation: 'Without a tail pointer, we must traverse from the head node through all intermediate elements until temp->next is NULL, resulting in O(N) operations.'
      }
    ]
  },
  {
    id: 'queue-operations',
    title: 'Queue FIFO Trace',
    description: 'See elements enter from the rear and exit from the front in a 3D visualization.',
    category: 'Queue',
    difficulty: 'Beginner',
    xpReward: 80,
    codeTemplate: `#include <stdio.h>
#define SIZE 5

int queue[SIZE];
int front = -1, rear = -1;

void enqueue(int value) {
    if (rear == SIZE - 1) {
        printf("Queue Full\\n");
        return;
    }
    if (front == -1) front = 0;
    rear++;
    queue[rear] = value;
    printf("Enqueued %d\\n", value);
}

int dequeue() {
    if (front == -1 || front > rear) {
        printf("Queue Empty\\n");
        return -1;
    }
    int value = queue[front];
    front++;
    return value;
}

int main() {
    enqueue(10);
    enqueue(20);
    int val = dequeue();
    return 0;
}`,
    mcqs: [
      {
        id: 'queue-q1',
        stepIndex: 7,
        question: 'If rear = SIZE - 1, can we always enqueue a new item in a simple static queue?',
        options: [
          'Yes, queues expand dynamically automatically.',
          'No, even if front has moved, rear reaches the boundary causing overflow in a simple queue.',
          'Yes, front automatically shifts backwards.',
          'No, unless the compiler is optimization-enabled.'
        ],
        correctIndex: 1,
        explanation: 'In a simple static queue array, if rear reaches the last index, enqueue is blocked. To solve this, a Circular Queue is typically used.'
      }
    ]
  }
];
