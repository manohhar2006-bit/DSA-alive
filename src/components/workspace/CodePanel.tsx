import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { useExecutionStore } from '../../hooks/useExecution';
import { useTrace } from '../../context/TraceContext';
import { executionEngine } from '../../execution/executionEngine';
import { Upload, Download, Copy, Play, Type, ClipboardCheck, X } from 'lucide-react';

const CodePanel: React.FC = () => {
  const trace = useExecutionStore((s) => s.executionTrace);
  const currentStepIndex = useExecutionStore((s) => s.currentStep);
  const currentStep = trace ? trace.steps[currentStepIndex] || null : null;

  const { 
    breakpoints, 
    toggleBreakpoint 
  } = useTrace();

  const [fontSize, setFontSize] = useState<number>(14);
  const [copied, setCopied] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [isDevModeOpen, setIsDevModeOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDevModeOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !trace || !currentStep) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations: any[] = [];

    // 1. Highlight current executing line with a blue background and left border, and show the pointer in the margin
    newDecorations.push({
      range: new monaco.Range(currentStep.line, 1, currentStep.line, 1),
      options: {
        isWholeLine: true,
        className: 'bg-blue-600/15 border-l-2 border-blue-500',
        glyphMarginClassName: 'text-blue-400 bg-blue-500/20 rounded-full cursor-pointer current-line-pointer',
        glyphMarginHoverMessage: { value: `Current Execution Pointer (Line ${currentStep.line})` }
      }
    });

    // 2. Highlight current function definition
    const activeFrame = currentStep.stack[currentStep.stack.length - 1];
    if (activeFrame) {
      const funcName = activeFrame.functionName;
      const codeLines = trace.code.split('\n');
      let funcLine = -1;
      for (let i = 0; i < codeLines.length; i++) {
        const trimmedLine = codeLines[i].trim();
        if (
          trimmedLine.startsWith(`void ${funcName}`) || 
          trimmedLine.startsWith(`int ${funcName}`) || 
          trimmedLine.startsWith(`struct Node* ${funcName}`) ||
          trimmedLine.includes(`${funcName}(`) || 
          trimmedLine.includes(`${funcName} (`)
        ) {
          funcLine = i + 1;
          break;
        }
      }
      if (funcLine !== -1) {
        newDecorations.push({
          range: new monaco.Range(funcLine, 1, funcLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-purple-950/15 border-l border-purple-500/40',
            hoverMessage: { value: `Currently executing within function: ${funcName}()` }
          }
        });
      }
    }

    // 3. Highlight variables that changed in this step
    const changedVarNames: string[] = [];
    if (currentStepIndex > 0) {
      const prevStep = trace.steps[currentStepIndex - 1];
      Object.entries(currentStep.variables).forEach(([name, variable]) => {
        const prevVar = prevStep.variables[name];
        if (!prevVar || prevVar.value !== variable.value) {
          changedVarNames.push(name);
        }
      });
    }

    if (changedVarNames.length > 0) {
      const currentLineText = trace.code.split('\n')[currentStep.line - 1] || '';
      changedVarNames.forEach((varName) => {
        let index = currentLineText.indexOf(varName);
        while (index !== -1) {
          const startCol = index + 1;
          const endCol = startCol + varName.length;
          newDecorations.push({
            range: new monaco.Range(currentStep.line, startCol, currentStep.line, endCol),
            options: {
              inlineClassName: 'bg-amber-500/25 border-b-2 border-amber-500 font-semibold text-amber-200',
              hoverMessage: { value: `Variable '${varName}' updated in this step!` }
            }
          });
          index = currentLineText.indexOf(varName, index + 1);
        }
      });
    }

    // 4. Highlight breakpoints
    breakpoints.forEach((line) => {
      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          glyphMarginClassName: 'breakpoint-glyph text-red-500 bg-red-600/30 rounded-full cursor-pointer',
          glyphMarginHoverMessage: { value: `Breakpoint Active (Line ${line})` }
        }
      });
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Scroll smoothly to the executing line
    editor.revealLineInCenterIfOutsideViewport(currentStep.line);

  }, [currentStep, breakpoints, trace, currentStepIndex]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onMouseDown((e: any) => {
      // If clicking the glyph margin area, toggle a breakpoint
      if (e.target.type === 2) {
        const line = e.target.position.lineNumber;
        toggleBreakpoint(line);
      }
    });

    // Monaco Hover Provider for variable inspection in the editor
    monaco.languages.registerHoverProvider('cpp', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word || !currentStep) return null;

        const activeVar = currentStep.variables[word.word];
        if (activeVar) {
          const isPointer = !!activeVar.isPointer;
          const targetAddrMsg = isPointer ? `\n- **Points To Address**: \`${activeVar.pointerTo}\`` : '';

          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: `### Variable Inspector: **${activeVar.name}**` },
              { value: `* **Data Type**: \`${activeVar.type}\`
* **Current Value**: \`${activeVar.value}\`
* **RAM Address**: \`${activeVar.address}\`${targetAddrMsg}` }
            ]
          };
        }
        return null;
      }
    });
  };

  const handleCopy = () => {
    if (!trace) return;
    navigator.clipboard.writeText(trace.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const codeText = event.target?.result as string;
      if (codeText) {
        await executionEngine.loadCode(codeText);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!trace) return;
    const blob = new Blob([trace.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codealive_sandbox.c';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full flex flex-col bg-zinc-950">
      <div className="h-10 shrink-0 border-b border-zinc-900 bg-zinc-950/60 px-4 flex items-center justify-between text-zinc-400">
        <span 
          onDoubleClick={() => setIsDevModeOpen((prev) => !prev)}
          className="text-[10px] uppercase font-bold tracking-widest font-mono text-zinc-500 cursor-pointer select-none"
          title="Double click to toggle Developer Tools"
        >
          Source Editor
        </span>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-zinc-900 bg-zinc-900/40 px-2 py-0.5 rounded text-xs font-semibold">
            <Type className="h-3.5 w-3.5" />
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-transparent text-[10px] focus:outline-none cursor-pointer"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>

          <button
            onClick={handleCopy}
            className="p-1 border border-zinc-900 hover:bg-zinc-900/60 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Copy Source"
          >
            {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1 border border-zinc-900 hover:bg-zinc-900/60 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Download .c File"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <label className="p-1 border border-zinc-900 hover:bg-zinc-900/60 rounded text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer flex items-center justify-center">
            <Upload className="h-3.5 w-3.5" />
            <input 
              type="file" 
              accept=".c" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={trace?.code}
          onChange={(newVal) => {
            if (newVal) setCustomInput(newVal);
          }}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: true },
            lineNumbers: 'on',
            glyphMargin: true,
            cursorBlinking: 'smooth',
            readOnly: false,
            selectOnLineNumbers: true,
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            renderLineHighlight: 'all',
            automaticLayout: true
          }}
        />
        {customInput && customInput !== trace?.code && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={async () => {
                await executionEngine.loadCode(customInput);
                setCustomInput('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow-xl shadow-blue-500/20 flex items-center gap-2 animate-bounce"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Compile & Run Sandbox</span>
            </button>
          </div>
        )}

        {isDevModeOpen && (
          <div className="absolute inset-0 z-30 bg-zinc-950/95 border-l border-zinc-800 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
            <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider font-mono">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Developer Mode Console</span>
              </div>
              <button 
                onClick={() => setIsDevModeOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs text-zinc-300">
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Execution Status</div>
                  <div className="text-white font-bold">{trace ? 'Loaded' : 'Idle'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Current Step</div>
                  <div className="text-white font-bold">{trace ? `${currentStepIndex + 1} / ${trace.steps.length}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Active Heap Blocks</div>
                  <div className="text-white font-bold">{currentStep ? Object.keys(currentStep.heap).length : 0}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase">Active Stack Frames</div>
                  <div className="text-white font-bold">{currentStep ? currentStep.stack.length : 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1">
                  <span>Memory Objects</span>
                </div>
                <div className="space-y-1">
                  <div className="text-blue-400 font-semibold">Stack Variables:</div>
                  {currentStep && Object.keys(currentStep.variables).length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-zinc-500 text-[10px] border-b border-zinc-850">
                          <th className="py-1">Name</th>
                          <th className="py-1">Type</th>
                          <th className="py-1">Addr</th>
                          <th className="py-1 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.variables).map(([name, v]) => (
                          <tr key={name} className="border-b border-zinc-900/40 text-zinc-300">
                            <td className="py-1">{name}</td>
                            <td className="py-1 text-zinc-500">{v.type}</td>
                            <td className="py-1 text-zinc-500 font-mono">{v.address}</td>
                            <td className="py-1 text-right text-green-400">{v.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-zinc-600 italic">No variables in scope.</div>
                  )}

                  <div className="text-purple-400 font-semibold mt-3">Heap Allocations:</div>
                  {currentStep && Object.keys(currentStep.heap).length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-zinc-500 text-[10px] border-b border-zinc-850">
                          <th className="py-1">Addr</th>
                          <th className="py-1">ID</th>
                          <th className="py-1">Node Value</th>
                          <th className="py-1 text-right">Next Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.heap).map(([addr, node]) => (
                          <tr key={addr} className="border-b border-zinc-900/40 text-zinc-300">
                            <td className="py-1 font-mono text-purple-400">{addr}</td>
                            <td className="py-1 text-zinc-500">{node.id}</td>
                            <td className="py-1 text-green-400">{node.value}</td>
                            <td className="py-1 text-right text-zinc-500 font-mono">{node.nextAddress || 'NULL'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-zinc-600 italic">Heap is empty.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-400 font-bold border-b border-zinc-800 pb-1 flex items-center justify-between">
                  <span>Raw Execution Trace JSON</span>
                  {trace && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
                        alert('Trace JSON copied to clipboard!');
                      }}
                      className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded border border-blue-500/20 text-[10px] transition-colors"
                    >
                      Copy JSON
                    </button>
                  )}
                </div>
                {trace ? (
                  <pre className="p-3 bg-zinc-900 rounded border border-zinc-800 max-h-48 overflow-y-auto text-[10px] text-zinc-400 select-all scrollbar-thin">
                    {JSON.stringify(trace, null, 2)}
                  </pre>
                ) : (
                  <div className="text-zinc-600 italic">No trace loaded yet. Compile and run sandbox first.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePanel;
