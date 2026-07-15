import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types/auth';
import { authService } from '../services/authService';
import confetti from 'canvas-confetti';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  loginOAuth: (provider: 'google' | 'github') => Promise<void>;
  register: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  addXpAndCoins: (xp: number, coins: number) => Promise<void>;
  completeLesson: (lessonId: string, title: string, category: 'Array' | 'Stack' | 'Queue' | 'Linked List' | 'Tree' | 'Graph', xp: number) => Promise<void>;
  checkAndUnlockAchievement: (achievementId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        const token = localStorage.getItem('codealive_token');
        setState({
          user,
          token,
          loading: false,
          error: null
        });
      } catch (err) {
        setState({
          user: null,
          token: null,
          loading: false,
          error: 'Failed to initialize session'
        });
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user, token } = await authService.login(email, password);
      setState({ user, token, loading: false, error: null });
      triggerXPSparkles();
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Login failed' }));
    }
  };

  const loginOAuth = async (provider: 'google' | 'github') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user, token } = await authService.loginWithOAuth(provider);
      setState({ user, token, loading: false, error: null });
      triggerXPSparkles();
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'OAuth authentication failed' }));
    }
  };

  const register = async (name: string, email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user, token } = await authService.register(name, email);
      setState({ user, token, loading: false, error: null });
      triggerXPSparkles();
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Registration failed' }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await authService.logout();
    setState({ user: null, token: null, loading: false, error: null });
  };

  const addXpAndCoins = async (xp: number, coins: number) => {
    if (!state.user) return;
    try {
      const updatedUser = await authService.updateUserStats(state.user, xp, coins);
      setState(prev => ({ ...prev, user: updatedUser }));
      
      // Level check
      if (updatedUser.stats.level > state.user.stats.level) {
        triggerLevelUpConfetti();
      } else if (xp > 0) {
        triggerXPSparkles();
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  };

  const completeLesson = async (
    lessonId: string,
    title: string,
    category: 'Array' | 'Stack' | 'Queue' | 'Linked List' | 'Tree' | 'Graph',
    xp: number
  ) => {
    if (!state.user) return;
    try {
      const updatedUser = await authService.completeAlgorithm(state.user, lessonId, title, category, xp);
      setState(prev => ({ ...prev, user: updatedUser }));
      triggerLevelUpConfetti();
      
      // Auto unlock 'first-step' if this is their first completion
      if (updatedUser.stats.completedCount === 1) {
        await checkAndUnlockAchievement('first-step');
      }
      // Auto check 'c-master'
      if (updatedUser.stats.completedCount >= 3) {
        await checkAndUnlockAchievement('c-master');
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  const checkAndUnlockAchievement = async (achievementId: string) => {
    if (!state.user) return;
    const achievement = state.user.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlockedAt) {
      try {
        const updatedUser = await authService.unlockAchievement(state.user, achievementId);
        setState(prev => ({ ...prev, user: updatedUser }));
        triggerAchievementConfetti();
      } catch (err) {
        console.error('Failed to unlock achievement:', err);
      }
    }
  };

  // Gamification Confetti Animations
  const triggerLevelUpConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#ffd700']
    });
  };

  const triggerAchievementConfetti = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#06b6d4']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#06b6d4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const triggerXPSparkles = () => {
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#60a5fa', '#c084fc']
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        login,
        loginOAuth,
        register,
        logout,
        addXpAndCoins,
        completeLesson,
        checkAndUnlockAchievement
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
