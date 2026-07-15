import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Layers, Cpu, Zap, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel px-6 py-4 flex items-center justify-between border-b border-zinc-800/40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            CodeAlive AI
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/60">
            BETA
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-zinc-100 transition-colors">Success Stories</a>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/auth')} 
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="relative group overflow-hidden px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all text-white shadow-lg shadow-blue-500/20"
          >
            <span className="relative z-10">Start Learning</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-16 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>New: Interactive C & DS&A visualization compiler</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl"
        >
          See Your Code <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Come Alive.
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl font-light leading-relaxed"
        >
          Paste your C code. Watch it execute in 3D. <br />
          Understand every variable allocation and pointer line with an AI tutor.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10"
          >
            <span>Start Learning</span>
            <Play className="h-4 w-4 fill-current text-zinc-950" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 transition-all flex items-center justify-center gap-2"
          >
            Explore Sandbox
          </a>
        </motion.div>

        {/* Workspace Teaser Card Mockup */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-20 w-full max-w-5xl rounded-2xl glass-card overflow-hidden border border-zinc-800 p-2 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="h-4 w-full bg-zinc-900/60 rounded-t-lg flex items-center px-4 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="text-[10px] text-zinc-500 font-mono ml-4">workspace.c - CodeAlive Debugger</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 h-[300px] md:h-[450px] bg-zinc-950/80 text-left text-xs font-mono text-zinc-500">
            {/* Mock Code panel */}
            <div className="border-r border-zinc-900 p-4 space-y-2 overflow-hidden hidden md:block">
              <p className="text-zinc-600">// 3D Linked List Append</p>
              <p><span className="text-purple-400">#include</span> &lt;stdlib.h&gt;</p>
              <p><span className="text-blue-400">struct</span> Node &#123;</p>
              <p className="pl-4">int data;</p>
              <p className="pl-4">Node* next;</p>
              <p>&#125;;</p>
              <p><span className="text-blue-400">void</span> append(Node** head) &#123;</p>
              <p className="pl-4 bg-blue-900/30 text-blue-300 border-l border-blue-500 py-0.5">- Node* n = malloc(sizeof(Node));</p>
              <p className="pl-4">n-&gt;data = 42;</p>
              <p className="pl-4">n-&gt;next = NULL;</p>
              <p>&#125;</p>
            </div>
            {/* Mock 3D Panel */}
            <div className="col-span-1 md:col-span-2 bg-zinc-950/50 p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-60">
                <div className="flex gap-12 items-center">
                  <div className="px-6 py-4 rounded-xl border border-zinc-800 bg-zinc-900/80 text-center relative shadow-lg">
                    <p className="text-xs text-zinc-500">0x10A8</p>
                    <p className="text-xl font-bold text-blue-400">Val: 10</p>
                    <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 text-cyan-400 text-lg">➜</div>
                  </div>
                  <div className="px-6 py-4 rounded-xl border border-blue-500/40 bg-zinc-900/90 text-center relative shadow-lg glow-animation">
                    <p className="text-xs text-zinc-400">0x10B8</p>
                    <p className="text-xl font-bold text-cyan-400">Val: 42</p>
                    <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 text-zinc-700 text-lg">➜</div>
                  </div>
                  <div className="px-6 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center opacity-40">
                    <p className="text-xs">NULL</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center z-20">
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
                  WebGL active
                </span>
                <span className="text-[10px] text-zinc-500">Camera: Perspective Orbit</span>
              </div>
              <div className="h-10 bg-zinc-900/80 border border-zinc-850 rounded-lg flex items-center justify-between px-4 z-20">
                <div className="flex gap-3 text-zinc-400">
                  <span>⏮</span><span>▶</span><span>⏭</span>
                </div>
                <div className="h-1 w-1/2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-blue-500" />
                </div>
                <span className="text-[10px]">Step 3 / 5</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Engineered For Visual Understanding
          </h2>
          <p className="mt-4 text-zinc-400 font-light">
            We isolate execution, layout adapters, and descriptions to ensure absolute code synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl w-fit">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Triple-Panel Sync</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Code editor highlights, 3D WebGL boxes, and AI tutors never speak directly. They listen to a single execution trace log to remain strictly synchronized.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl w-fit">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">WebGL 3D Layout Adapters</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Tailored layout models map Stack heaps, FIFO lines, and BST branches cleanly into 3D grids with smooth camera orbits and coordinate links.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="p-3 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-xl w-fit">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Checkpoint MCQs</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Pause code execution at critical points to test comprehension. Earn XP and coins for correct answers on stack operations and memory shifting.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">Loved by Students and Educators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <p className="text-sm italic text-zinc-300">
              "Pointers in C were always a complete mystery to me. Seeing them as address cards pointing to coordinates in 3D completely rewired my brain. The MCQ checkpoint features are amazingly fun."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
              <div>
                <p className="text-xs font-semibold text-white">Sarah Jenkins</p>
                <p className="text-[10px] text-zinc-500">CS Freshman, UT Austin</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl flex flex-col gap-4">
            <p className="text-sm italic text-zinc-300">
              "As a lecturer, explaining memory leaks is difficult. CodeAlive AI shows the heap node remaining after the pointer goes out of stack bounds. It is a game changer for teaching."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700" />
              <div>
                <p className="text-xs font-semibold text-white">Dr. Robert Chen</p>
                <p className="text-[10px] text-zinc-500">Assistant Professor, Stanford University</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-900 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pricing Plans</h2>
        <p className="text-zinc-400 mb-16 max-w-xl mx-auto font-light">
          Unlock unlimited compiles, FAANG interview questions, and deep debugging warnings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="glass-card p-8 rounded-2xl flex flex-col justify-between border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base Tier</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">$0</h3>
              <p className="text-zinc-500 text-xs mt-1">Free Forever</p>
              <ul className="text-left text-sm text-zinc-400 mt-8 space-y-4">
                <li>✓ Run 4 default preset lessons</li>
                <li>✓ Synchronized 3D rendering</li>
                <li>✓ Standard timelines and playbacks</li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/auth')} 
              className="mt-8 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              Get Started
            </button>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col justify-between border-blue-500/40 relative">
            <div className="absolute top-0 right-1/2 translate-x-1/2 translate-y-[-50%] bg-blue-600 text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pro License</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">$9<span className="text-sm font-normal text-zinc-500">/mo</span></h3>
              <p className="text-zinc-500 text-xs mt-1">Full Unlimited Suite</p>
              <ul className="text-left text-sm text-zinc-400 mt-8 space-y-4">
                <li>✓ Upload unlimited C files</li>
                <li>✓ Unlock BST Trees & Graphs Adapters</li>
                <li>✓ Deep AI memory leaks & Big O optimizer suggestions</li>
                <li>✓ FAANG interview tips database</li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/auth')} 
              className="mt-8 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Unlock Premium
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-500">
          <p>© 2026 CodeAlive AI Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
