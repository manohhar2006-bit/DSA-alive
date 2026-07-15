import type { User, Achievement, CompletedAlgorithm } from '../types/auth';

const STORAGE_KEY_USER = 'codealive_user';
const STORAGE_KEY_TOKEN = 'codealive_token';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Execute your first line of C code.',
    iconName: 'play',
    xpReward: 20,
    progressMax: 1,
    progressCurrent: 0,
  },
  {
    id: 'c-master',
    title: 'C Master',
    description: 'Complete 3 algorithms on the platform.',
    iconName: 'award',
    xpReward: 100,
    progressMax: 3,
    progressCurrent: 0,
  },
  {
    id: 'streak-3',
    title: 'Warm Up',
    description: 'Maintain a 3-day active streak.',
    iconName: 'zap',
    xpReward: 50,
    progressMax: 3,
    progressCurrent: 1,
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Answer 5 MCQ checkpoints correctly on the first attempt.',
    iconName: 'check-circle',
    xpReward: 80,
    progressMax: 5,
    progressCurrent: 0,
  }
];

const DEFAULT_USER: User = {
  id: 'usr_1',
  email: 'student@codealive.edu',
  name: 'Alex Coder',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'student',
  stats: {
    level: 2,
    xp: 240,
    xpToNextLevel: 500,
    coins: 150,
    streak: 3,
    completedCount: 1,
  },
  achievements: DEFAULT_ACHIEVEMENTS,
  completedAlgorithms: [
    {
      id: 'array-insertion',
      name: 'Array Insertion',
      category: 'Array',
      completedAt: new Date().toISOString(),
      xpEarned: 50,
    }
  ]
};

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const userStr = localStorage.getItem(STORAGE_KEY_USER);
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!userStr || !token) return null;
    return JSON.parse(userStr);
  },

  async login(email: string, _password?: string): Promise<{ user: User; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    let user = DEFAULT_USER;
    const existingStr = localStorage.getItem(STORAGE_KEY_USER);
    if (existingStr) {
      user = JSON.parse(existingStr);
      user.email = email;
    } else {
      user.email = email;
      user.name = email.split('@')[0];
    }
    
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(user))}.signature`;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    
    return { user, token: mockToken };
  },

  async loginWithOAuth(provider: 'google' | 'github'): Promise<{ user: User; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const user = { ...DEFAULT_USER };
    user.name = provider === 'google' ? 'Google Student' : 'GitHub Developer';
    user.email = `${provider}@codealive.dev`;
    
    const mockToken = `oauth_token_${provider}_12345`;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    
    return { user, token: mockToken };
  },

  async register(name: string, email: string): Promise<{ user: User; token: string }> {
    await new Promise((resolve) => setTimeout(resolve, 900));
    const newUser: User = {
      ...DEFAULT_USER,
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      name,
      email,
      stats: {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 50,
        streak: 1,
        completedCount: 0,
      },
      achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a, progressCurrent: 0 })),
      completedAlgorithms: []
    };
    
    const mockToken = `token_${newUser.id}`;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEY_TOKEN, mockToken);
    
    return { user: newUser, token: mockToken };
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  async updateUserStats(user: User, xpAdded: number, coinsAdded: number): Promise<User> {
    const updatedUser = { ...user };
    const stats = { ...updatedUser.stats };
    stats.xp += xpAdded;
    stats.coins += coinsAdded;
    
    while (stats.xp >= stats.xpToNextLevel) {
      stats.xp -= stats.xpToNextLevel;
      stats.level += 1;
      stats.xpToNextLevel = stats.level * 500;
    }
    
    updatedUser.stats = stats;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async completeAlgorithm(user: User, algorithmId: string, name: string, category: CompletedAlgorithm['category'], xpReward: number): Promise<User> {
    const updatedUser = { ...user };
    
    const alreadyDone = updatedUser.completedAlgorithms.some(a => a.id === algorithmId);
    if (!alreadyDone) {
      updatedUser.completedAlgorithms.push({
        id: algorithmId,
        name,
        category,
        completedAt: new Date().toISOString(),
        xpEarned: xpReward
      });
      
      updatedUser.achievements = updatedUser.achievements.map(ach => {
        if (ach.id === 'c-master') {
          const newProg = Math.min(ach.progressMax, ach.progressCurrent + 1);
          return {
            ...ach,
            progressCurrent: newProg,
            unlockedAt: newProg === ach.progressMax ? new Date().toISOString() : undefined
          };
        }
        return ach;
      });
      
      updatedUser.stats.completedCount += 1;
      return this.updateUserStats(updatedUser, xpReward, Math.floor(xpReward / 2));
    }
    
    return updatedUser;
  },

  async unlockAchievement(user: User, achievementId: string): Promise<User> {
    const updatedUser = { ...user };
    let xpAwarded = 0;
    
    updatedUser.achievements = updatedUser.achievements.map(ach => {
      if (ach.id === achievementId && !ach.unlockedAt) {
        xpAwarded = ach.xpReward;
        return {
          ...ach,
          progressCurrent: ach.progressMax,
          unlockedAt: new Date().toISOString()
        };
      }
      return ach;
    });

    if (xpAwarded > 0) {
      return this.updateUserStats(updatedUser, xpAwarded, Math.floor(xpAwarded / 2));
    }
    return updatedUser;
  }
};
