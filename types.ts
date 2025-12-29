
export enum UserRole {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT'
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface Reading {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  title: string; // e.g., "تكوين 1-3"
  question?: string;
  options?: QuizOption[];
  correctOptionId?: string;
  bonusPoints: number;
}

export interface Submission {
  userId: string;
  readingId: string;
  completedAt: string; // ISO timestamp
  quizAnswerId?: string;
  isCorrect?: boolean;
  score: number;
}

export interface User {
  id: string;
  name: string;
  group: string;
  role: UserRole;
  totalScore: number;
  password?: string; // Simple password for admin
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  readingIds: string[]; 
  icon?: string;
}
