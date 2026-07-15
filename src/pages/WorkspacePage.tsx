import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useTrace } from '../context/TraceContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import CodePanel from '../components/workspace/CodePanel';
import VizPanel from '../components/workspace/VizPanel';
import AITutorPanel from '../components/workspace/AITutorPanel';
import PlaybackController from '../components/workspace/PlaybackController';
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react';

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { trace, loading, selectedLessonId, restart } = useTrace();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useKeyboardShortcuts(toggleFullscreen);

  useEffect(() => {
    if (!trace && !loading) {
      navigate('/dashboard');
    }
  }, [trace, loading, navigate]);

  if (loading || !trace) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide text-zinc-400">Compiling C execution trace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      
      {/* Workspace header */}
      <header className="h-14 shrink-0 glass-panel px-6 flex items-center justify-between border-b border-zinc-800/40 relative z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              restart();
              navigate('/dashboard');
            }}
            className="p-1.5 border border-zinc-800/80 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">
              Active Session
            </span>
            <p className="text-xs font-bold text-white mt-0.5">
              {selectedLessonId ? `Lesson: ${selectedLessonId.replace('-', ' ')}` : 'Custom Sandbox.c'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
            <span>[Space] Play/Pause</span>
            <span>[⇄] Step</span>
            <span>[R] Restart</span>
            <span>[F] Fullscreen</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 border border-zinc-800/85 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Resizable Workspace Area */}
      <div className="flex-1 min-h-0 w-full relative z-10">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize="40%" minSize="25%" maxSize="60%">
            <div className="h-full w-full bg-zinc-950 relative overflow-hidden">
              <CodePanel />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle cursor-col-resize hover:bg-blue-600/40 active:bg-blue-600" />

          <Panel defaultSize="35%" minSize="20%" maxSize="50%">
            <div className="h-full w-full bg-zinc-950 relative overflow-hidden">
              <VizPanel />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle cursor-col-resize hover:bg-blue-600/40 active:bg-blue-600" />

          <Panel defaultSize="25%" minSize="20%" maxSize="40%">
            <div className="h-full w-full bg-zinc-950 relative overflow-hidden">
              <AITutorPanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <footer className="h-20 shrink-0 glass-panel border-t border-zinc-850 px-6 flex items-center justify-center relative z-25">
        <PlaybackController />
      </footer>

    </div>
  );
};

export default WorkspacePage;
