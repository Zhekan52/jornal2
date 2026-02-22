import { useState, useEffect } from 'react';

export type Subject = 'Русский язык' | 'Математика' | 'Обществознание' | 'География';

export const SUBJECTS: Subject[] = ['Русский язык', 'Математика', 'Обществознание', 'География'];

export type DayOfWeek = 'Понедельник' | 'Вторник' | 'Среда' | 'Четверг' | 'Пятница' | 'Суббота' | 'Воскресенье';

export const DAYS: DayOfWeek[] = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export interface ClassSession {
  id: string;
  subject: Subject;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  teacher: string;
  weekStart: string; // ISO string of week start date (Monday)
}

const STORAGE_KEY = 'oge_schedule_data';

// Helper functions for week navigation
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export function getPreviousWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  return getWeekStart(date);
}

export function getNextWeek(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 7);
  return getWeekStart(date);
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  return `${formatter.format(start)} — ${formatter.format(end)}`;
}

const currentWeek = getWeekStart();

const INITIAL_DATA: ClassSession[] = [
  {
    id: '1',
    subject: 'Математика',
    day: 'Понедельник',
    startTime: '16:00',
    endTime: '17:30',
    room: '101',
    teacher: 'Иванов И.И.',
    weekStart: currentWeek
  },
  {
    id: '2',
    subject: 'Русский язык',
    day: 'Среда',
    startTime: '15:00',
    endTime: '16:30',
    room: '204',
    teacher: 'Петрова А.С.',
    weekStart: currentWeek
  },
  {
    id: '3',
    subject: 'Обществознание',
    day: 'Вторник',
    startTime: '17:00',
    endTime: '18:30',
    room: '305',
    teacher: 'Сидоров В.В.',
    weekStart: currentWeek
  },
  {
    id: '4',
    subject: 'География',
    day: 'Пятница',
    startTime: '16:00',
    endTime: '17:30',
    room: '102',
    teacher: 'Кузнецова Е.М.',
    weekStart: currentWeek
  }
];

export function useScheduleStore() {
  const [schedule, setSchedule] = useState<ClassSession[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  }, [schedule]);

  const addSession = (session: Omit<ClassSession, 'id'>) => {
    const newSession = { ...session, id: crypto.randomUUID() };
    setSchedule([...schedule, newSession]);
  };

  const updateSession = (updatedSession: ClassSession) => {
    setSchedule(schedule.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const deleteSession = (id: string) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  return {
    schedule,
    addSession,
    updateSession,
    deleteSession
  };
}
