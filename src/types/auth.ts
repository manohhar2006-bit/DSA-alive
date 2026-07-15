export interface CompletedAlgorithm {
  id: string;
  name: string;
  category: 'Array' | 'Stack' | 'Queue' | 'Linked List' | 'Tree' | 'Graph';
  completedAt: string;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
  xpReward: number;
  progressMax: number;
  progressCurrent: number;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  streak: number;
  lastActiveDate?: string;
  completedCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'student' | 'admin';
  stats: UserStats;
  achievements: Achievement[];
  completedAlgorithms: CompletedAlgorithm[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
