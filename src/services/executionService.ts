import type { 
  ExecutionStep, 
  ExecutionTrace
} from '../types/trace';
import { preprocess, tokenize, Parser, CInterpreter } from '../execution/cInterpreter';

export const executionService = {
  /**
   * Generates or fetches a step-by-step trace for the provided C code.
   */
  async generateTrace(code: string, _lessonId?: string): Promise<ExecutionTrace> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate remote compilation/trace execution

    try {
      const preprocessed = preprocess(code);
      const tokens = tokenize(preprocessed);
      const parser = new Parser(tokens);
      const program = parser.parseProgram();

      const interpreter = new CInterpreter(program);
      const rawSteps = interpreter.interpret();

      const mappedSteps = rawSteps.map((s, idx) => {
        const stepNum = idx + 1;
        const mappedStep: ExecutionStep = {
          ...s,
          step: stepNum,
          stepIndex: idx,
          // Fallbacks for older components
          explanation: s.aiExplanation || 'Executing statement.',
          output: s.stdout || ''
        };
        return mappedStep;
      });

      return {
        code,
        language: 'c',
        steps: mappedSteps
      };
    } catch (err: any) {
      console.error('Error interpreting C code in executionService:', err);
      const errorStep: ExecutionStep = {
        step: 1,
        stepIndex: 0,
        line: 1,
        operation: `Compilation/Runtime Error: ${err.message}`,
        aiExplanation: `An error occurred during parsing or execution: ${err.message}`,
        eventType: 'LINE_EXECUTED',
        stack: [],
        heap: {},
        variables: {},
        stdout: `Error: ${err.message}\n`,
        memory: {
          global: [],
          stack: [],
          heap: {},
          pointers: [],
          objectIds: [],
          blocks: []
        },
        timestamp: Date.now(),
        complexity: {
          time: 'N/A',
          space: 'N/A',
          reasoning: 'Error state',
          optimizations: []
        },
        animationType: 'error',
        commonMistakes: [err.message],
        explanation: `An error occurred: ${err.message}`,
        output: `Error: ${err.message}\n`
      };

      return {
        code,
        language: 'c',
        steps: [errorStep]
      };
    }
  }
};
