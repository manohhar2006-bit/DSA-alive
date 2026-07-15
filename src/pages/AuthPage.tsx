import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldAlert, CheckCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, loginOAuth, error } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) return;

    setLoadingLocal(true);
    try {
      if (isSignUp) {
        await register(name, email);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoadingLocal(true);
    try {
      await loginOAuth(provider);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-6 py-12 overflow-hidden bg-grid-pattern">
      <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl border border-zinc-800 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <span 
            onClick={() => navigate('/')}
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
          >
            CodeAlive AI
          </span>
          <p className="mt-2 text-zinc-400 text-sm font-light">
            {isSignUp ? 'Create your platform workspace' : 'Welcome back, sign in to your dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showForgotMsg && (
          <div className="mb-6 p-3 rounded-lg border border-green-500/20 bg-green-950/20 text-green-400 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Password reset instructions dispatched to your inbox.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Coder"
                required
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@codealive.edu"
              required
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotMsg(true);
                    setTimeout(() => setShowForgotMsg(false), 5000);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-all"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 bg-zinc-900 border border-zinc-800 rounded text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-zinc-400 cursor-pointer select-none">
                Remember Me
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingLocal}
            className="w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
          >
            {loadingLocal ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>{isSignUp ? 'Create Workspace' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center text-xs uppercase tracking-widest text-zinc-600">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-zinc-950 px-3 z-10 font-medium">Or Continue With</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loadingLocal}
            className="flex items-center justify-center gap-2 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-sm font-medium text-zinc-300 transition-colors"
          >
            <Mail className="h-4 w-4 text-red-400" />
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuth('github')}
            disabled={loadingLocal}
            className="flex items-center justify-center gap-2 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-sm font-medium text-zinc-300 transition-colors"
          >
            {/* Inline SVG GitHub Icon */}
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button onClick={() => setIsSignUp(false)} className="text-blue-400 hover:underline font-semibold ml-1">
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button onClick={() => setIsSignUp(true)} className="text-blue-400 hover:underline font-semibold ml-1">
                Sign Up Free
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
