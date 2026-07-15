import type { 
  ExecutionStep, 
  Variable, 
  MemoryNode, 
  StackFrame,
  EventType,
  ComplexityInfo,
  MemoryState,
  PointerReference,
  MemoryBlock
} from '../types/trace';

// ============================================================================
// 1. PREPROCESSOR & LEXER
// ============================================================================

export interface Token {
  type: 'keyword' | 'identifier' | 'number' | 'string' | 'operator' | 'punctuation' | 'eof';
  value: string;
  line: number;
}

export function preprocess(code: string): string {
  // Remove block comments /* ... */ preserving newlines
  let cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\r\n]/g, '');
  });
  // Remove line comments // ...
  cleanCode = cleanCode.replace(/\/\/.*/g, '');

  // Extract #defines
  const macros: Record<string, string> = {};
  const lines = cleanCode.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#include')) {
      return '';
    }
    if (trimmed.startsWith('#define')) {
      const match = trimmed.match(/#define\s+(\w+)\s+(.+)/);
      if (match) {
        macros[match[1]] = match[2].trim();
      }
      return '';
    }
    return line;
  });

  let result = processedLines.join('\n');
  for (const [name, val] of Object.entries(macros)) {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    result = result.replace(regex, val);
  }
  return result;
}

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;

  const keywords = new Set([
    'int', 'void', 'struct', 'malloc', 'free', 'if', 'else', 'while', 'for', 'return', 'sizeof', 'NULL'
  ]);

  while (index < code.length) {
    const char = code[index];

    if (char === '\n') {
      line++;
      index++;
      continue;
    }
    if (/\s/.test(char)) {
      index++;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let value = '';
      while (index < code.length && /[0-9]/.test(code[index])) {
        value += code[index];
        index++;
      }
      tokens.push({ type: 'number', value, line });
      continue;
    }

    // Strings
    if (char === '"') {
      let value = '';
      index++; // Skip opening quote
      while (index < code.length && code[index] !== '"') {
        if (code[index] === '\\' && code[index + 1] === 'n') {
          value += '\n';
          index += 2;
        } else {
          value += code[index];
          index++;
        }
      }
      if (index < code.length) index++; // Skip closing quote
      tokens.push({ type: 'string', value, line });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (index < code.length && /[a-zA-Z0-9_]/.test(code[index])) {
        value += code[index];
        index++;
      }
      if (keywords.has(value)) {
        tokens.push({ type: 'keyword', value, line });
      } else {
        tokens.push({ type: 'identifier', value, line });
      }
      continue;
    }

    // Double-character operators
    if (index + 1 < code.length) {
      const twoChars = code.substr(index, 2);
      if (['&&', '||', '==', '!=', '<=', '>=', '->', '++', '--'].includes(twoChars)) {
        tokens.push({ type: 'operator', value: twoChars, line });
        index += 2;
        continue;
      }
    }

    // Single-character operators
    if (['+', '-', '*', '/', '=', '&', '<', '>', '!'].includes(char)) {
      tokens.push({ type: 'operator', value: char, line });
      index++;
      continue;
    }

    // Punctuation
    if ([';', ',', '{', '}', '(', ')', '[', ']'].includes(char)) {
      tokens.push({ type: 'punctuation', value: char, line });
      index++;
      continue;
    }

    // Unknown characters
    index++;
  }

  tokens.push({ type: 'eof', value: '', line });
  return tokens;
}

// ============================================================================
// 2. PARSER (ABSTRACT SYNTAX TREE DEFINITION & PARSING)
// ============================================================================

export type ASTExpr =
  | { type: 'Literal'; valType: 'int' | 'string' | 'pointer'; value: any; line: number }
  | { type: 'Identifier'; name: string; line: number }
  | { type: 'BinaryExpr'; operator: string; left: ASTExpr; right: ASTExpr; line: number }
  | { type: 'UnaryExpr'; operator: string; argument: ASTExpr; line: number }
  | { type: 'PostfixExpr'; operator: string; argument: ASTExpr; line: number }
  | { type: 'ArrayAccess'; array: ASTExpr; index: ASTExpr; line: number }
  | { type: 'MemberAccess'; object: ASTExpr; member: string; isArrow: boolean; line: number }
  | { type: 'FuncCall'; callee: string; args: ASTExpr[]; line: number }
  | { type: 'MallocExpr'; sizeType: string; line: number }
  | { type: 'Assignment'; left: ASTExpr; right: ASTExpr; line: number };

export type ASTStmt =
  | { type: 'VarDecl'; varType: string; name: string; isArray: boolean; arraySize?: number; initValue?: ASTExpr; arrayInit?: ASTExpr[]; line: number }
  | { type: 'ExprStmt'; expr: ASTExpr; line: number }
  | { type: 'Block'; statements: ASTStmt[]; line: number }
  | { type: 'IfStmt'; test: ASTExpr; consequent: ASTStmt; alternate?: ASTStmt; line: number }
  | { type: 'WhileStmt'; test: ASTExpr; body: ASTStmt; line: number }
  | { type: 'ForStmt'; init?: ASTStmt | ASTExpr; test?: ASTExpr; update?: ASTExpr; body: ASTStmt; line: number }
  | { type: 'ReturnStmt'; argument?: ASTExpr; line: number };

export interface ASTStruct {
  name: string;
  members: { name: string; type: string }[];
}

export interface ASTFuncDecl {
  returnType: string;
  name: string;
  params: { name: string; type: string }[];
  body: ASTStmt;
  line: number;
}

export interface ASTProgram {
  structs: Record<string, ASTStruct>;
  globals: any[];
  functions: Record<string, ASTFuncDecl>;
}

export class Parser {
  tokens: Token[];
  pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  peek(): Token {
    return this.tokens[this.pos] || { type: 'eof', value: '', line: 0 };
  }

  peekAt(offset: number): Token {
    return this.tokens[this.pos + offset] || { type: 'eof', value: '', line: 0 };
  }

  next(): Token {
    return this.tokens[this.pos++];
  }

  match(type: string, value?: string): boolean {
    const t = this.peek();
    if (t.type === type && (!value || t.value === value)) {
      this.next();
      return true;
    }
    return false;
  }

  expect(type: string, value?: string): Token {
    const t = this.peek();
    if (t.type === type && (!value || t.value === value)) {
      return this.next();
    }
    throw new Error(`Line ${t.line}: Expected '${value || type}' but got '${t.value}'`);
  }

  parseProgram(): ASTProgram {
    const program: ASTProgram = {
      structs: {},
      globals: [],
      functions: {}
    };

    while (this.peek().type !== 'eof') {
      const line = this.peek().line;
      if (this.peek().value === 'struct' && this.peekAt(1).type === 'identifier' && this.peekAt(2).value === '{') {
        this.expect('keyword', 'struct');
        const structName = this.expect('identifier').value;
        this.expect('punctuation', '{');
        const members: { name: string; type: string }[] = [];
        while (!this.match('punctuation', '}')) {
          const type = this.parseTypeName();
          const name = this.expect('identifier').value;
          this.expect('punctuation', ';');
          members.push({ name, type });
        }
        this.expect('punctuation', ';');
        program.structs[structName] = { name: structName, members };
      } else {
        // Check if function or variable
        const startPos = this.pos;
        try {
          const type = this.parseTypeName();
          const name = this.expect('identifier').value;
          
          if (this.match('punctuation', '(')) {
            // Function Declaration
            const params: { name: string; type: string }[] = [];
            if (!this.match('punctuation', ')')) {
              do {
                const pType = this.parseTypeName();
                const pName = this.expect('identifier').value;
                params.push({ name: pName, type: pType });
              } while (this.match('punctuation', ','));
              this.expect('punctuation', ')');
            }
            const body = this.parseStatement();
            program.functions[name] = { returnType: type, name, params, body, line };
          } else {
            // Global Variable
            this.pos = startPos; // Backtrack and parse as statement
            const varDecl = this.parseStatement();
            if (varDecl.type === 'VarDecl') {
              program.globals.push(varDecl);
            }
          }
        } catch (e: any) {
          console.error(`Parse error at token '${this.peek().value}' (line ${this.peek().line}):`, e.message);
          // If we fail to parse, consume one token to prevent infinite loop
          this.next();
        }
      }
    }

    return program;
  }

  parseTypeName(): string {
    let type = '';
    if (this.match('keyword', 'struct')) {
      type += 'struct ' + this.expect('identifier').value;
    } else {
      type += this.expect('keyword').value; // int, void
    }
    while (this.match('operator', '*')) {
      type += '*';
    }
    return type;
  }

  parseStatement(): ASTStmt {
    const t = this.peek();
    const line = t.line;

    if (this.match('punctuation', '{')) {
      const statements: ASTStmt[] = [];
      while (!this.match('punctuation', '}')) {
        statements.push(this.parseStatement());
      }
      return { type: 'Block', statements, line };
    }

    if (this.match('keyword', 'if')) {
      this.expect('punctuation', '(');
      const test = this.parseExpression();
      this.expect('punctuation', ')');
      const consequent = this.parseStatement();
      let alternate: ASTStmt | undefined;
      if (this.match('keyword', 'else')) {
        alternate = this.parseStatement();
      }
      return { type: 'IfStmt', test, consequent, alternate, line };
    }

    if (this.match('keyword', 'while')) {
      this.expect('punctuation', '(');
      const test = this.parseExpression();
      this.expect('punctuation', ')');
      const body = this.parseStatement();
      return { type: 'WhileStmt', test, body, line };
    }

    if (this.match('keyword', 'for')) {
      this.expect('punctuation', '(');
      let init: ASTStmt | ASTExpr | undefined;
      if (!this.match('punctuation', ';')) {
        const isDecl = this.peek().type === 'keyword' || (this.peek().value === 'struct' && this.peekAt(1).type === 'identifier');
        if (isDecl) {
          init = this.parseVarDecl();
        } else {
          init = this.parseExpression();
          this.expect('punctuation', ';');
        }
      }
      let test: ASTExpr | undefined;
      if (!this.match('punctuation', ';')) {
        test = this.parseExpression();
        this.expect('punctuation', ';');
      }
      let update: ASTExpr | undefined;
      if (!this.match('punctuation', ')')) {
        update = this.parseExpression();
        this.expect('punctuation', ')');
      } else {
        this.next();
      }
      const body = this.parseStatement();
      return { type: 'ForStmt', init, test, update, body, line };
    }

    if (this.match('keyword', 'return')) {
      let argument: ASTExpr | undefined;
      if (!this.match('punctuation', ';')) {
        argument = this.parseExpression();
        this.expect('punctuation', ';');
      }
      return { type: 'ReturnStmt', argument, line };
    }

    // Check variable declaration
    const isDecl = this.peek().type === 'keyword' || (this.peek().value === 'struct' && this.peekAt(1).type === 'identifier');
    if (isDecl) {
      return this.parseVarDecl();
    }

    // Otherwise, expression statement
    const expr = this.parseExpression();
    this.expect('punctuation', ';');
    return { type: 'ExprStmt', expr, line };
  }

  parseVarDecl(): ASTStmt {
    const line = this.peek().line;
    const type = this.parseTypeName();
    const name = this.expect('identifier').value;

    let isArray = false;
    let arraySize: number | undefined;
    if (this.match('punctuation', '[')) {
      isArray = true;
      if (this.peek().type === 'number') {
        arraySize = parseInt(this.expect('number').value);
      }
      this.expect('punctuation', ']');
    }

    let initValue: ASTExpr | undefined;
    let arrayInit: ASTExpr[] | undefined;

    if (this.match('operator', '=')) {
      if (this.match('punctuation', '{')) {
        arrayInit = [];
        if (!this.match('punctuation', '}')) {
          do {
            arrayInit.push(this.parseExpression());
          } while (this.match('punctuation', ','));
          this.expect('punctuation', '}');
        }
      } else {
        initValue = this.parseExpression();
      }
    }
    this.expect('punctuation', ';');
    return { type: 'VarDecl', varType: type, name, isArray, arraySize, initValue, arrayInit, line };
  }

  parseExpression(): ASTExpr {
    return this.parseAssignment();
  }

  parseAssignment(): ASTExpr {
    let expr = this.parseLogicalOr();
    if (this.match('operator', '=')) {
      const right = this.parseAssignment();
      return { type: 'Assignment', left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseLogicalOr(): ASTExpr {
    let expr = this.parseLogicalAnd();
    while (this.match('operator', '||')) {
      const right = this.parseLogicalAnd();
      expr = { type: 'BinaryExpr', operator: '||', left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseLogicalAnd(): ASTExpr {
    let expr = this.parseEquality();
    while (this.match('operator', '&&')) {
      const right = this.parseEquality();
      expr = { type: 'BinaryExpr', operator: '&&', left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseEquality(): ASTExpr {
    let expr = this.parseRelational();
    while (this.peek().type === 'operator' && ['==', '!='].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseRelational();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseRelational(): ASTExpr {
    let expr = this.parseAdditive();
    while (this.peek().type === 'operator' && ['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseAdditive();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseAdditive(): ASTExpr {
    let expr = this.parseMultiplicative();
    while (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseMultiplicative(): ASTExpr {
    let expr = this.parseUnary();
    while (this.peek().type === 'operator' && ['*', '/'].includes(this.peek().value)) {
      const op = this.next().value;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  parseUnary(): ASTExpr {
    const t = this.peek();
    if (t.type === 'operator' && ['&', '*', '-', '!', '++', '--'].includes(t.value)) {
      const op = this.next().value;
      const arg = this.parseUnary();
      return { type: 'UnaryExpr', operator: op, argument: arg, line: t.line };
    }

    // Cast pointer check: (struct Node*)malloc(...)
    if (this.match('punctuation', '(')) {
      const startPos = this.pos;
      try {
        this.parseTypeName();
        this.expect('punctuation', ')');
        const expr = this.parseUnary();
        return expr;
      } catch (e: any) {
        console.log("Cast parser failed internally with error:", e.message);
        // Backtrack
        this.pos = startPos - 1;
      }
    }

    return this.parsePostfix();
  }

  parsePostfix(): ASTExpr {
    let expr = this.parsePrimary();

    while (true) {
      const t = this.peek();
      if (this.match('operator', '->')) {
        const member = this.expect('identifier').value;
        expr = { type: 'MemberAccess', object: expr, member, isArrow: true, line: t.line };
      } else if (this.match('punctuation', '.')) {
        const member = this.expect('identifier').value;
        expr = { type: 'MemberAccess', object: expr, member, isArrow: false, line: t.line };
      } else if (this.match('punctuation', '[')) {
        const index = this.parseExpression();
        this.expect('punctuation', ']');
        expr = { type: 'ArrayAccess', array: expr, index, line: t.line };
      } else if (this.match('operator', '++')) {
        expr = { type: 'PostfixExpr', operator: '++', argument: expr, line: t.line };
      } else if (this.match('operator', '--')) {
        expr = { type: 'PostfixExpr', operator: '--', argument: expr, line: t.line };
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary(): ASTExpr {
    const t = this.peek();

    if (this.match('keyword', 'NULL')) {
      return { type: 'Literal', valType: 'pointer', value: 'NULL', line: t.line };
    }

    if (t.type === 'number') {
      this.next();
      return { type: 'Literal', valType: 'int', value: parseInt(t.value), line: t.line };
    }

    if (t.type === 'string') {
      this.next();
      return { type: 'Literal', valType: 'string', value: t.value, line: t.line };
    }

    if (t.type === 'identifier' || (t.type === 'keyword' && (t.value === 'malloc' || t.value === 'free'))) {
      this.next();
      // Look for function call
      if (this.match('punctuation', '(')) {
        if (t.value === 'malloc') {
          let sizeType = 'int';
          if (this.match('keyword', 'sizeof')) {
            this.expect('punctuation', '(');
            sizeType = this.parseTypeName();
            this.expect('punctuation', ')');
          } else {
            this.parseExpression();
          }
          this.expect('punctuation', ')');
          return { type: 'MallocExpr', sizeType, line: t.line };
        }

        const args: ASTExpr[] = [];
        if (!this.match('punctuation', ')')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('punctuation', ','));
          this.expect('punctuation', ')');
        }
        return { type: 'FuncCall', callee: t.value, args, line: t.line };
      }
      return { type: 'Identifier', name: t.value, line: t.line };
    }

    if (this.match('punctuation', '(')) {
      const expr = this.parseExpression();
      this.expect('punctuation', ')');
      return expr;
    }

    throw new Error(`Line ${t.line}: Unexpected primary expression token '${t.value}'`);
  }
}

// ============================================================================
// 3. VIRTUAL MACHINE / INTERPRETER
// ============================================================================

export interface VMVar {
  name: string;
  type: string;
  value: any;
  address: string;
  isPointer?: boolean;
  pointerTo?: string;
  scope?: 'global' | 'local' | 'parameter';
}

export interface VMHeapNode {
  id: string;
  address: string;
  type: string;
  fields: Record<string, any>;
  highlighted?: boolean;
}

export class CInterpreter {
  program: ASTProgram;
  globals: Record<string, VMVar> = {};
  stackFrames: StackFrame[] = [];
  heap: Record<string, VMHeapNode> = {};
  stdout: string = '';
  steps: ExecutionStep[] = [];

  nextStackAddr = 0x7ffd8f00;
  nextHeapAddr = 0x10a0;
  nextGlobalAddr = 0x3000;
  objectIdCounter = 0;

  maxSteps = 400;
  stepCounter = 0;
  commonMistakes: string[] = [];
  lastLineNumber: number = 1;

  constructor(program: ASTProgram) {
    this.program = program;
  }

  allocStackAddr(): string {
    const addr = '0x' + this.nextStackAddr.toString(16);
    this.nextStackAddr -= 8;
    return addr;
  }

  allocHeapAddr(): string {
    const addr = '0x' + this.nextHeapAddr.toString(16);
    this.nextHeapAddr += 16;
    return addr;
  }

  allocGlobalAddr(): string {
    const addr = '0x' + this.nextGlobalAddr.toString(16);
    this.nextGlobalAddr += 8;
    return addr;
  }

  makeObjectId(): string {
    return 'node_' + (++this.objectIdCounter);
  }

  getVariablesInScope(): Record<string, Variable> {
    const vars: Record<string, Variable> = {};
    Object.entries(this.globals).forEach(([name, v]) => {
      vars[name] = this.mapVMVarToVariable(v, 'global');
    });
    if (this.stackFrames.length > 0) {
      const frame = this.stackFrames[this.stackFrames.length - 1];
      Object.entries(frame.variables).forEach(([name, v]) => {
        vars[name] = v;
      });
    }
    return vars;
  }

  mapVMVarToVariable(v: VMVar, scopeOverride?: 'global' | 'local' | 'parameter'): Variable {
    let displayVal = String(v.value);
    if (Array.isArray(v.value)) {
      displayVal = `[${v.value.join(', ')}]`;
    }
    return {
      name: v.name,
      type: v.type,
      value: displayVal,
      address: v.address,
      isPointer: v.isPointer,
      pointerTo: v.pointerTo,
      scope: scopeOverride || v.scope || 'local',
      description: ''
    };
  }

  recordStep(line: number, eventType: EventType, operation: string, animationHint = '') {
    this.stepCounter++;
    this.lastLineNumber = line;

    if (eventType === 'FUNCTION_RETURN' && this.stackFrames.length === 0) {
      const heapObjects = Object.keys(this.heap);
      if (heapObjects.length > 0) {
        this.addMistake('Memory leak: heap objects were not freed before program terminated.');
      }
    }

    const mappedHeap: Record<string, MemoryNode> = {};
    Object.entries(this.heap).forEach(([addr, node]) => {
      const val = node.fields['data'] !== undefined ? node.fields['data'] : node.fields['value'];
      mappedHeap[addr] = {
        id: node.id,
        label: val !== undefined ? `Data: ${val}` : 'Node',
        type: 'node',
        address: addr,
        nextAddress: node.fields['next'] || 'NULL',
        prevAddress: node.fields['prev'] || 'NULL',
        value: val,
        highlighted: node.highlighted
      };
    });

    const vars = this.getVariablesInScope();

    const traceStack: StackFrame[] = this.stackFrames.map(frame => ({
      functionName: frame.functionName,
      line: frame.line,
      variables: { ...frame.variables }
    }));

    const activePointers: PointerReference[] = [];
    Object.values(vars).forEach((v) => {
      if (v.isPointer && v.pointerTo && v.pointerTo !== 'NULL') {
        activePointers.push({
          fromAddress: v.address,
          toAddress: v.pointerTo,
          name: v.name
        });
      }
    });
    Object.values(mappedHeap).forEach((node) => {
      if (node.nextAddress && node.nextAddress !== 'NULL') {
        activePointers.push({
          fromAddress: node.address,
          toAddress: node.nextAddress,
          name: 'next'
        });
      }
    });

    const blocks: MemoryBlock[] = [];
    this.stackFrames.forEach((frame) => {
      Object.values(frame.variables).forEach((v) => {
        blocks.push({
          address: v.address,
          size: 4,
          allocated: true,
          label: `${frame.functionName}::${v.name}`,
          type: 'stack'
        });
      });
    });
    Object.values(mappedHeap).forEach((node) => {
      blocks.push({
        address: node.address,
        size: 16,
        allocated: true,
        label: `Node (${node.value})`,
        type: 'heap'
      });
    });

    const memoryState: MemoryState = {
      global: Object.values(this.globals).map(v => this.mapVMVarToVariable(v, 'global')),
      stack: traceStack,
      heap: mappedHeap,
      pointers: activePointers,
      objectIds: Object.values(mappedHeap).map(n => n.id),
      blocks
    };

    let finalAnim = animationHint;
    if (!finalAnim) {
      if (eventType === 'STACK_PUSH') finalAnim = 'push';
      else if (eventType === 'STACK_POP') finalAnim = 'pop';
      else if (eventType === 'VARIABLE_CHANGED') finalAnim = 'update_variable';
      else if (eventType === 'MEMORY_ALLOCATED') finalAnim = 'malloc';
      else if (eventType === 'MEMORY_FREED') finalAnim = 'free';
      else if (eventType === 'POINTER_UPDATED') finalAnim = 'pointer_move';
      else if (eventType === 'FUNCTION_CALL') finalAnim = 'stack_push_frame';
      else if (eventType === 'FUNCTION_RETURN') finalAnim = 'stack_pop_frame';
      else finalAnim = 'next_line';
    }

    let aiExplanation = `Executing code statement at line ${line}.`;
    let whyText = 'Understanding standard operations in C.';
    let analogyText = '';
    
    if (eventType === 'MEMORY_ALLOCATED') {
      aiExplanation = `malloc() dynamically allocated a node on the Heap at address ${operation.match(/0x[0-9a-f]+/)?.[0] || 'memory'}.`;
      whyText = 'Heap allocation persists dynamically outside of call stack scopes until it is explicitly freed.';
      analogyText = 'Reserving a shelf space in a public locker. It is yours until you check out.';
    } else if (eventType === 'MEMORY_FREED') {
      aiExplanation = 'free() released the heap memory back to the operating system.';
      whyText = 'Frees up heap memory blocks to prevent accumulation leaks.';
      analogyText = 'Checking out of a hotel room, allowing new guests to reserve it.';
    } else if (eventType === 'POINTER_UPDATED') {
      aiExplanation = `Pointer assignment: updated link/address.`;
      whyText = 'Pointer operations change target references to traverse structural nodes.';
      analogyText = 'Pointing a flashlight at a different object in a dark room.';
    } else if (eventType === 'STACK_PUSH') {
      aiExplanation = `Pushed value onto stack array. top index updated to ${vars['top']?.value || '0'}.`;
      whyText = 'Stacks store items in LIFO order by incrementing the top index and writing to the slot.';
      analogyText = 'Placing a plate onto a stack of dinner plates.';
    } else if (eventType === 'STACK_POP') {
      aiExplanation = `Popped value from stack array. top index decremented.`;
      whyText = 'Popping retrieves the most recently pushed item and updates the top index limit.';
      analogyText = 'Removing the top plate from a stack of dinner plates.';
    } else if (eventType === 'VARIABLE_CHANGED') {
      aiExplanation = `Updated variable value: ${operation}.`;
    }

    let cat = 'Array';
    if (codeMatches(this.program, 'stack')) cat = 'Stack';
    else if (codeMatches(this.program, 'Node') || codeMatches(this.program, 'append')) cat = 'Linked List';

    const complexityMap: Record<string, ComplexityInfo> = {
      'Array': {
        time: 'O(N) - Linear Time',
        space: 'O(1) - Auxiliary Space',
        reasoning: 'Inserting elements requires shifting existing entries to the right, taking up to N operations in-place.',
        optimizations: ['Use swaps if ordering is unimportant.', 'Pre-allocate capacity.']
      },
      'Stack': {
        time: 'O(1) - Constant Time',
        space: 'O(N) - Linear Space',
        reasoning: 'Push/Pop operations only adjust the top pointer index and execute a direct array index assignment.',
        optimizations: ['Use a Linked List stack implementation to avoid fixed MAX constraints.']
      },
      'Linked List': {
        time: 'O(N) - Linear Time',
        space: 'O(1) - Auxiliary Space',
        reasoning: 'Traversing the chain pointer-by-pointer from head to find the tail node is linear with list size.',
        optimizations: ['Maintain a tail pointer references alongside head to perform O(1) appends.']
      }
    };

    this.steps.push({
      step: this.stepCounter,
      stepIndex: this.stepCounter - 1,
      line,
      operation,
      aiExplanation,
      eventType,
      stack: traceStack,
      heap: mappedHeap,
      variables: vars,
      stdout: this.stdout,
      memory: memoryState,
      timestamp: Date.now(),
      complexity: complexityMap[cat] || complexityMap['Array'],
      animationType: finalAnim,
      why: whyText,
      analogy: analogyText,
      commonMistakes: [...this.commonMistakes]
    });
  }

  addMistake(msg: string) {
    if (!this.commonMistakes.includes(msg)) {
      this.commonMistakes.push(msg);
    }
  }

  interpret(): ExecutionStep[] {
    try {
      this.program.globals.forEach((decl) => {
        this.declareVar(decl, true);
      });

      const mainFunc = this.program.functions['main'];
      if (!mainFunc) {
        throw new Error('main() function is required but could not be found.');
      }

      this.executeFunction('main', [], 1);
    } catch (err: any) {
      this.recordStep(
        this.lastLineNumber,
        'LINE_EXECUTED',
        `Runtime Error: ${err.message}`,
        'error'
      );
    }
    return this.steps;
  }

  declareVar(decl: any, isGlobal: boolean) {
    const address = isGlobal ? this.allocGlobalAddr() : this.allocStackAddr();
    const type = decl.varType;
    const isPointer = type.includes('*');

    let initialValue: any = 0;
    if (isPointer) {
      initialValue = 'NULL';
    }

    if (decl.isArray) {
      const size = decl.arraySize || (decl.arrayInit ? decl.arrayInit.length : 5);
      const arr = new Array(size).fill(0);
      if (decl.arrayInit) {
        decl.arrayInit.forEach((expr: ASTExpr, idx: number) => {
          arr[idx] = this.evaluateExpr(expr);
        });
      }
      const v: VMVar = {
        name: decl.name,
        type: `${type}[${size}]`,
        value: arr,
        address,
        isPointer: false,
        scope: isGlobal ? 'global' : 'local'
      };
      if (isGlobal) {
        this.globals[decl.name] = v;
      } else {
        const frame = this.stackFrames[this.stackFrames.length - 1];
        frame.variables[decl.name] = this.mapVMVarToVariable(v, 'local');
      }
      this.recordStep(decl.line, 'VARIABLE_CHANGED', `Declare array ${decl.name}`);
    } else {
      if (decl.initValue) {
        initialValue = this.evaluateExpr(decl.initValue);
      }
      const v: VMVar = {
        name: decl.name,
        type,
        value: initialValue,
        address,
        isPointer,
        pointerTo: isPointer ? String(initialValue) : undefined,
        scope: isGlobal ? 'global' : 'local'
      };
      if (isGlobal) {
        this.globals[decl.name] = v;
      } else {
        const frame = this.stackFrames[this.stackFrames.length - 1];
        frame.variables[decl.name] = this.mapVMVarToVariable(v, 'local');
      }
      this.recordStep(decl.line, 'VARIABLE_CHANGED', `Declare variable ${decl.name} = ${initialValue}`);
    }
  }

  executeFunction(name: string, args: any[], callLine: number): any {
    const func = this.program.functions[name];
    if (!func) {
      if (name === 'free') {
        const addr = args[0];
        if (addr === 'NULL') {
          this.addMistake('NULL pointer dereference / warning: attempting to free NULL pointer.');
          return;
        }
        if (!this.heap[addr]) {
          this.addMistake('Double Free or Invalid Free: attempting to free unallocated memory address.');
          return;
        }
        delete this.heap[addr];
        this.recordStep(callLine, 'MEMORY_FREED', `free() memory at address ${addr}`);
        return;
      }
      if (name === 'printf') {
        const fmt = args[0];
        let formatted = fmt;
        for (let i = 1; i < args.length; i++) {
          formatted = formatted.replace('%d', args[i]);
          formatted = formatted.replace('%s', args[i]);
        }
        this.stdout += formatted;
        this.recordStep(callLine, 'OUTPUT', `printf() prints to stdout`);
        return;
      }
      throw new Error(`Function ${name} is undefined.`);
    }

    if (this.stackFrames.length > 20) {
      this.addMistake('Stack Overflow: nested function call depth exceeded limit.');
      throw new Error('Call stack depth limit exceeded (Stack Overflow).');
    }

    const frameVariables: Record<string, Variable> = {};
    const newFrame: StackFrame = {
      functionName: name,
      line: func.line,
      variables: frameVariables
    };

    this.stackFrames.push(newFrame);

    func.params.forEach((param, idx) => {
      const val = args[idx];
      const address = this.allocStackAddr();
      const isPointer = param.type.includes('*');
      const v: VMVar = {
        name: param.name,
        type: param.type,
        value: val,
        address,
        isPointer,
        pointerTo: isPointer ? String(val) : undefined,
        scope: 'parameter'
      };
      frameVariables[param.name] = this.mapVMVarToVariable(v, 'parameter');
    });

    this.recordStep(callLine, 'FUNCTION_CALL', `Enter function ${name}()`);

    let returnVal: any;
    try {
      returnVal = this.executeStatement(func.body);
    } catch (e: any) {
      this.stackFrames.pop();
      throw e;
    }

    this.stackFrames.pop();
    this.recordStep(callLine, 'FUNCTION_RETURN', `Return from function ${name}()`);
    return returnVal;
  }

  executeStatement(stmt: ASTStmt): any {
    if (this.stepCounter > this.maxSteps) {
      this.addMistake('Infinite Loop: execution step limit exceeded (infinite loop safety cutoff).');
      throw new Error('Maximum execution steps exceeded. Potential infinite loop.');
    }

    this.lastLineNumber = stmt.line;

    switch (stmt.type) {
      case 'Block':
        for (const s of stmt.statements) {
          const ret = this.executeStatement(s);
          if (ret !== undefined) return ret;
        }
        break;

      case 'VarDecl':
        this.declareVar(stmt, false);
        break;

      case 'ExprStmt':
        this.evaluateExpr(stmt.expr);
        this.recordStep(stmt.line, 'LINE_EXECUTED', `Execute expression statement`);
        break;

      case 'ReturnStmt':
        const val = stmt.argument ? this.evaluateExpr(stmt.argument) : undefined;
        return val !== undefined ? val : null;

      case 'IfStmt':
        this.recordStep(stmt.line, 'LINE_EXECUTED', `Evaluate if condition`);
        if (this.evaluateExpr(stmt.test)) {
          return this.executeStatement(stmt.consequent);
        } else if (stmt.alternate) {
          return this.executeStatement(stmt.alternate);
        }
        break;

      case 'WhileStmt':
        while (true) {
          this.recordStep(stmt.line, 'LINE_EXECUTED', `Evaluate while loop condition`);
          if (!this.evaluateExpr(stmt.test)) break;
          const ret = this.executeStatement(stmt.body);
          if (ret !== undefined) return ret;
        }
        break;

      case 'ForStmt':
        if (stmt.init) {
          if ('type' in stmt.init && stmt.init.type === 'VarDecl') {
            this.declareVar(stmt.init, false);
          } else if ('type' in stmt.init && stmt.init.type === 'ExprStmt') {
            this.evaluateExpr(stmt.init.expr);
          } else {
            this.evaluateExpr(stmt.init as ASTExpr);
          }
        }
        while (true) {
          this.recordStep(stmt.line, 'LINE_EXECUTED', `Evaluate for loop condition`);
          if (stmt.test && !this.evaluateExpr(stmt.test)) break;
          const ret = this.executeStatement(stmt.body);
          if (ret !== undefined) return ret;
          if (stmt.update) {
            this.evaluateExpr(stmt.update);
          }
        }
        break;
    }
  }

  evaluateExpr(expr: ASTExpr): any {
    switch (expr.type) {
      case 'Literal':
        return expr.value;

      case 'Identifier':
        return this.getVariableValue(expr.name);

      case 'BinaryExpr':
        const leftVal = this.evaluateExpr(expr.left);
        const rightVal = this.evaluateExpr(expr.right);
        switch (expr.operator) {
          case '+': return leftVal + rightVal;
          case '-': return leftVal - rightVal;
          case '*': return leftVal * rightVal;
          case '/': return Math.floor(leftVal / rightVal);
          case '==': return leftVal == rightVal;
          case '!=': return leftVal != rightVal;
          case '<': return leftVal < rightVal;
          case '>': return leftVal > rightVal;
          case '<=': return leftVal <= rightVal;
          case '>=': return leftVal >= rightVal;
          case '&&': return leftVal && rightVal;
          case '||': return leftVal || rightVal;
        }
        break;

      case 'UnaryExpr':
        if (expr.operator === '&') {
          if (expr.argument.type === 'Identifier') {
            const v = this.findVMVar(expr.argument.name);
            return v.address;
          }
          throw new Error('Address-of operator requires an identifier lhs.');
        }
        if (expr.operator === '*') {
          const addr = this.evaluateExpr(expr.argument);
          if (addr === 'NULL') {
            this.addMistake('NULL pointer dereference: attempted to read from NULL pointer address.');
            throw new Error('NULL pointer dereference.');
          }
          return this.readMemoryAddress(addr);
        }
        if (expr.operator === '-') {
          return -this.evaluateExpr(expr.argument);
        }
        if (expr.operator === '!') {
          return !this.evaluateExpr(expr.argument);
        }
        if (expr.operator === '++') {
          return this.performIncrement(expr.argument, true, true);
        }
        if (expr.operator === '--') {
          return this.performIncrement(expr.argument, false, true);
        }
        break;

      case 'PostfixExpr':
        if (expr.operator === '++') {
          return this.performIncrement(expr.argument, true, false);
        }
        if (expr.operator === '--') {
          return this.performIncrement(expr.argument, false, false);
        }
        break;

      case 'ArrayAccess':
        const arr = this.evaluateExpr(expr.array);
        const idx = this.evaluateExpr(expr.index);
        
        if (Array.isArray(arr)) {
          if (idx < 0 || idx >= arr.length) {
            this.addMistake(`Array out of bounds: attempted to access index ${idx} in array of size ${arr.length}.`);
          }
          return arr[idx];
        }
        throw new Error('Subscripted value is not an array.');

      case 'MemberAccess':
        const objVal = this.evaluateExpr(expr.object);
        if (objVal === 'NULL') {
          this.addMistake(`NULL pointer dereference: attempted to read member '${expr.member}' of NULL node pointer.`);
          throw new Error('NULL pointer dereference.');
        }
        const node = this.heap[objVal];
        if (!node) {
          throw new Error(`Access violation: no heap object exists at address '${objVal}'`);
        }
        return node.fields[expr.member];

      case 'FuncCall':
        const evaluatedArgs = expr.args.map(a => this.evaluateExpr(a));
        return this.executeFunction(expr.callee, evaluatedArgs, expr.line);

      case 'MallocExpr':
        const heapAddr = this.allocHeapAddr();
        const objId = this.makeObjectId();
        this.heap[heapAddr] = {
          id: objId,
          address: heapAddr,
          type: expr.sizeType,
          fields: {
            'next': 'NULL',
            'prev': 'NULL',
            'data': 0
          },
          highlighted: true
        };
        this.recordStep(expr.line, 'MEMORY_ALLOCATED', `malloc() allocated Node at address ${heapAddr}`);
        this.heap[heapAddr].highlighted = false;
        return heapAddr;

      case 'Assignment':
        const rightValue = this.evaluateExpr(expr.right);
        this.assignValue(expr.left, rightValue);
        return rightValue;
    }
  }

  findVMVar(name: string): VMVar {
    if (this.stackFrames.length > 0) {
      const frame = this.stackFrames[this.stackFrames.length - 1];
      const traceVar = frame.variables[name];
      if (traceVar) {
        return {
          name: traceVar.name,
          type: traceVar.type,
          value: traceVar.type.includes('[') ? parseArrayString(traceVar.value) : parseLiteralString(traceVar.value),
          address: traceVar.address,
          isPointer: traceVar.isPointer,
          pointerTo: traceVar.pointerTo,
          scope: 'local'
        };
      }
    }
    if (this.globals[name]) {
      return this.globals[name];
    }
    this.addMistake(`Uninitialized variable: variable '${name}' is used but was not declared.`);
    throw new Error(`Uninitialized variable identifier '${name}'`);
  }

  getVariableValue(name: string): any {
    const v = this.findVMVar(name);
    return v.value;
  }

  assignValue(lhs: ASTExpr, value: any) {
    if (lhs.type === 'Identifier') {
      const v = this.findVMVar(lhs.name);
      v.value = value;
      if (v.isPointer) {
        v.pointerTo = String(value);
      }
      this.updateVMEnvironment(lhs.name, v);

      const isPtrUpdate = v.isPointer;
      this.recordStep(
        lhs.line,
        isPtrUpdate ? 'POINTER_UPDATED' : 'VARIABLE_CHANGED',
        `Assign ${lhs.name} = ${value}`
      );
      return;
    }

    if (lhs.type === 'ArrayAccess') {
      if (lhs.array.type === 'Identifier') {
        const v = this.findVMVar(lhs.array.name);
        const idx = this.evaluateExpr(lhs.index);
        if (Array.isArray(v.value)) {
          if (idx < 0 || idx >= v.value.length) {
            this.addMistake(`Array out of bounds: write index ${idx} out of range for array size ${v.value.length}.`);
          }
          v.value[idx] = value;
          this.updateVMEnvironment(lhs.array.name, v);

          const isStackPush = lhs.array.name === 'stack';
          this.recordStep(
            lhs.line,
            isStackPush ? 'STACK_PUSH' : 'VARIABLE_CHANGED',
            `Write ${lhs.array.name}[${idx}] = ${value}`
          );
          return;
        }
      }
    }

    if (lhs.type === 'MemberAccess') {
      const objVal = this.evaluateExpr(lhs.object);
      if (objVal === 'NULL') {
        this.addMistake(`NULL pointer dereference: attempted to assign member '${lhs.member}' of NULL node pointer.`);
        throw new Error('NULL pointer dereference.');
      }
      const node = this.heap[objVal];
      if (node) {
        node.fields[lhs.member] = value;
        const isPointerLink = lhs.member === 'next' || lhs.member === 'prev';
        this.recordStep(
          lhs.line,
          isPointerLink ? 'POINTER_UPDATED' : 'VARIABLE_CHANGED',
          `Update node ${objVal}->${lhs.member} = ${value}`
        );
        return;
      }
    }

    if (lhs.type === 'UnaryExpr' && lhs.operator === '*') {
      const targetAddr = this.evaluateExpr(lhs.argument);
      if (targetAddr === 'NULL') {
        this.addMistake('NULL pointer dereference: attempted pointer write to NULL address.');
        throw new Error('NULL pointer dereference.');
      }
      this.writeMemoryAddress(targetAddr, value);
      this.recordStep(lhs.line, 'POINTER_UPDATED', `Write to address *(${targetAddr}) = ${value}`);
      return;
    }

    throw new Error('Invalid assignment target (l-value required).');
  }

  updateVMEnvironment(name: string, v: VMVar) {
    if (this.globals[name]) {
      this.globals[name] = v;
    } else if (this.stackFrames.length > 0) {
      const frame = this.stackFrames[this.stackFrames.length - 1];
      frame.variables[name] = this.mapVMVarToVariable(v, 'local');
    }
  }

  readMemoryAddress(addr: string): any {
    for (let i = this.stackFrames.length - 1; i >= 0; i--) {
      const frame = this.stackFrames[i];
      for (const variable of Object.values(frame.variables)) {
        if (variable.address === addr) {
          return variable.value;
        }
      }
    }
    for (const variable of Object.values(this.globals)) {
      if (variable.address === addr) {
        return variable.value;
      }
    }
    if (this.heap[addr]) {
      return addr;
    }
    throw new Error(`Segmentation fault: invalid memory read at address '${addr}'`);
  }

  writeMemoryAddress(addr: string, val: any) {
    for (let i = this.stackFrames.length - 1; i >= 0; i--) {
      const frame = this.stackFrames[i];
      for (const variable of Object.values(frame.variables)) {
        if (variable.address === addr) {
          variable.value = String(val);
          if (variable.isPointer) {
            variable.pointerTo = String(val);
          }
          return;
        }
      }
    }
    for (const variable of Object.values(this.globals)) {
      if (variable.address === addr) {
        variable.value = val;
        if (variable.isPointer) {
          variable.pointerTo = String(val);
        }
        return;
      }
    }
    throw new Error(`Segmentation fault: invalid memory write at address '${addr}'`);
  }

  performIncrement(arg: ASTExpr, isAdd: boolean, isPrefix: boolean): number {
    if (arg.type !== 'Identifier') {
      throw new Error('Increment/Decrement operand must be a variable.');
    }
    const v = this.findVMVar(arg.name);
    const oldVal = parseInt(v.value);
    const newVal = isAdd ? oldVal + 1 : oldVal - 1;

    const isStackTopChange = arg.name === 'top';

    v.value = newVal;
    this.updateVMEnvironment(arg.name, v);

    this.recordStep(
      arg.line,
      isStackTopChange && !isAdd ? 'STACK_POP' : 'VARIABLE_CHANGED',
      `${isAdd ? 'Increment' : 'Decrement'} ${arg.name} to ${newVal}`
    );

    return isPrefix ? newVal : oldVal;
  }
}

// ============================================================================
// 4. PARSING HELPERS
// ============================================================================

function codeMatches(program: ASTProgram, key: string): boolean {
  return JSON.stringify(program).toLowerCase().includes(key.toLowerCase());
}

function parseArrayString(val: string): number[] {
  try {
    const match = val.match(/\[(.*)\]/);
    if (match) {
      return match[1].split(',').map(s => parseInt(s.trim()));
    }
  } catch (e) {}
  return [];
}

function parseLiteralString(val: string): any {
  if (val === 'NULL') return 'NULL';
  if (/^-?\d+$/.test(val)) return parseInt(val);
  return val;
}
