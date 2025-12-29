
import { Reading, User, UserRole } from './types';

export const FULL_SCORE = 10;
export const LATE_SCORE = 5;

export const INITIAL_READINGS: Reading[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    title: 'تكوين ١ - ٣',
    question: 'ماذا خلق الله في اليوم الأول؟',
    options: [
      { id: 'a', text: 'النور' },
      { id: 'b', text: 'الحيوانات' },
      { id: 'c', text: 'الإنسان' }
    ],
    correctOptionId: 'a',
    bonusPoints: 2
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'مينا سمير', group: 'المجموعة الأولى', role: UserRole.PARTICIPANT, totalScore: 0 },
  { id: 'u2', name: 'مريم جرجس', group: 'المجموعة الأولى', role: UserRole.PARTICIPANT, totalScore: 0 },
  { id: 'admin', name: 'أمين الخدمة', group: 'الإدارة', role: UserRole.ADMIN, totalScore: 0 }
];

export const APP_THEME = {
  primary: 'blue-600',
  secondary: 'amber-500',
  bg: 'slate-50',
  accent: 'emerald-500'
};
