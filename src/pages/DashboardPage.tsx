import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrace } from '../context/TraceContext';
import { LESSONS } from '../models/lessons';
import { Award, Zap, Coins, CheckCircle, ArrowRight, Play, BookOpen, Compass, LogOut } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { loadLesson } = useTrace();

  if (!user) return null;

  const xpPercent = Math.min(100, Math.floor((user.stats.xp / user.stats.xpToNextLevel) * 100));

  const handleStartLesson = async (lessonId: string) => {
    await loadLesson(lessonId);
    navigate('/workspace');
  };

  const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Grace Hopper', xp: 2450, level: 8 },
    { rank: 2, name: 'Donald Knuth', xp: 1980, level: 6 },
    { rank: 3, name: 'Ada Lovelace', xp: 1720, level: 5 },
    { rank: 4, name: user.name, xp: user.stats.xp + (user.stats.level - 1) * 500, level: user.stats.level, isSelf: true },
    { rank: 5, name: 'Linus Torvalds', xp: 950, level: 3 }
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col bg-grid-pattern">
      {/* Header bar */}
      <header className="sticky top-0 z-50 glass-panel px-8 py-4 flex items-center justify-between border-b border-zinc-800/40">
        <div className="flex items-center gap-3">
          <span onClick={() => navigate('/')} className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer">
            CodeAlive AI
          </span>
          <span className="text-xs text-zinc-500 font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-6">
          {/* User profile brief */}
          <div className="flex items-center gap-3">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="h-8 w-8 rounded-full border border-zinc-700/80 object-cover" 
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-zinc-500 font-medium">Level {user.stats.level} Student</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="p-2 border border-zinc-800/80 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Columns - stats and syllabus (col-span-3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Stats widgets grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-850">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Level Progress</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-white">{user.stats.xp}</span>
                  <span className="text-xs text-zinc-500 font-medium">/ {user.stats.xpToNextLevel} XP</span>
                </div>
                <div className="w-40 h-2 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-850">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daily Streak</p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-purple-400">{user.stats.streak}</span>
                  <span className="text-xs text-zinc-400 font-medium">Days Active</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Keep learning daily to stack XP multiplier</p>
              </div>
              <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl glow-animation">
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center justify-between border-zinc-850">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CodeAlive Coins</p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-cyan-400">{user.stats.coins}</span>
                  <span className="text-xs text-zinc-400 font-medium">Coins Earned</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Redeemable in upcoming themes store</p>
              </div>
              <div className="p-3 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                <Coins className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Continue Learning Prompt Banner */}
          {user.completedAlgorithms.length > 0 && (
            <div className="glass-card p-6 rounded-2xl border-blue-500/20 bg-gradient-to-r from-blue-950/20 via-zinc-900/60 to-zinc-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/50">
                  Continue learning
                </span>
                <h3 className="text-lg font-bold text-white mt-2">Pick up where you left off</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Last completed: {user.completedAlgorithms[user.completedAlgorithms.length - 1].name} ({user.completedAlgorithms[user.completedAlgorithms.length - 1].category})
                </p>
              </div>
              <button 
                onClick={() => handleStartLesson(LESSONS[1].id)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-blue-500/15"
              >
                <span>Resume Syllabus</span>
                <Play className="h-3.5 w-3.5 fill-current text-white" />
              </button>
            </div>
          )}

          {/* Recommended algorithms list */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <span>Recommended Topics</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LESSONS.map(lesson => {
                const isCompleted = user.completedAlgorithms.some(a => a.id === lesson.id);
                return (
                  <div key={lesson.id} className="glass-card p-6 rounded-2xl border-zinc-850 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                          {lesson.category}
                        </span>
                        {isCompleted ? (
                          <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                            Completed
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            lesson.difficulty === 'Beginner' ? 'bg-green-950/40 text-green-400 border border-green-800/40' :
                            lesson.difficulty === 'Intermediate' ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' :
                            'bg-red-950/40 text-red-400 border border-red-800/40'
                          }`}>
                            {lesson.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">{lesson.title}</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-900">
                      <span className="text-xs text-zinc-500 font-mono font-medium">
                        +{lesson.xpReward} XP Reward
                      </span>
                      <button
                        onClick={() => handleStartLesson(lesson.id)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
                      >
                        <span>Start Sandbox</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Algorithms Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-purple-400" />
              <span>Completed Algorithms</span>
            </h2>
            {user.completedAlgorithms.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-zinc-500 text-xs">
                No algorithms completed yet. Select a topic above to begin.
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border-zinc-850">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/60 text-zinc-400 uppercase tracking-widest text-[10px] font-bold border-b border-zinc-850">
                    <tr>
                      <th className="px-6 py-3.5">Algorithm Name</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Completed Date</th>
                      <th className="px-6 py-3.5 text-right">XP Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300 font-light">
                    {user.completedAlgorithms.map(algo => (
                      <tr key={algo.id} className="hover:bg-zinc-900/40">
                        <td className="px-6 py-3.5 font-bold text-white">{algo.name}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-850 border border-zinc-800 text-[10px] font-medium font-sans uppercase">
                            {algo.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-zinc-500">
                          {new Date(algo.completedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-green-400">+{algo.xpEarned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - achievements & leaderboard (col-span-1) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Achievements widget */}
          <div className="glass-card p-6 rounded-2xl border-zinc-850 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              <span>Achievements</span>
            </h3>
            <div className="space-y-4">
              {user.achievements.map(ach => {
                const percent = Math.floor((ach.progressCurrent / ach.progressMax) * 100);
                const isUnlocked = !!ach.unlockedAt;

                return (
                  <div key={ach.id} className="flex gap-3">
                    <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${
                      isUnlocked ? 'bg-purple-950/20 border-purple-500/40 text-purple-400 glow-animation' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                    }`}>
                      ★
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className={`text-xs font-semibold truncate ${isUnlocked ? 'text-white font-bold' : 'text-zinc-400'}`}>
                          {ach.title}
                        </p>
                        <span className="text-[9px] text-zinc-500 font-mono font-bold">
                          +{ach.xpReward}XP
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5">
                        {ach.description}
                      </p>
                      {!isUnlocked && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[8px] text-zinc-500 font-mono font-medium">
                            {ach.progressCurrent}/{ach.progressMax}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard widget */}
          <div className="glass-card p-6 rounded-2xl border-zinc-850 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">
              🏆 Leaderboard
            </h3>
            <div className="space-y-3.5">
              {MOCK_LEADERBOARD.map(item => (
                <div 
                  key={item.rank} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    item.isSelf ? 'bg-blue-950/20 border border-blue-500/20' : 'hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-bold w-4 ${
                      item.rank === 1 ? 'text-yellow-400' :
                      item.rank === 2 ? 'text-zinc-400' :
                      item.rank === 3 ? 'text-amber-600' : 'text-zinc-600'
                    }`}>
                      {item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.name}</p>
                      <p className="text-[9px] text-zinc-500 font-medium">Level {item.level}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    {item.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
