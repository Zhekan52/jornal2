// ==================== TYPES ====================

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'student' | 'admin';
  name: string;
}

export interface Lesson {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD specific date
  lessonNumber: number;
  startTime?: string;
  endTime?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  value: number;
  date: string;
  lessonNumber?: number;
  columnId?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  lessonNumber: number;
  subject: string;
  topic: string;
  homework: string;
  grade?: number;
  testId?: string;
  checkHomework?: boolean;
  testType?: 'real';
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

export interface TestQuestion {
  id: string;
  type: 'single' | 'multiple' | 'text';
  text: string;
  image?: string;
  formula?: string;
  options: { id: string; text: string; correct: boolean }[];
  correctAnswer?: string;
  points: number;
}

export interface TestVariant {
  id: string;
  name: string; // Например: "Вариант 1", "Вариант 2"
  questions: TestQuestion[];
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  timeLimit: number;
  gradingScale: { minPercent: number; grade: number }[];
  questions: TestQuestion[];
  variants: TestVariant[];
  useVariants: boolean; // true = использовать варианты, false = использовать основной список questions
  assignedLessonId?: string;
  createdAt: string;
}

export interface JournalColumn {
  id: string;
  date: string;
  subject: string;
  lessonNumber?: number;
  type: 'grade' | 'homework' | 'test';
}

export interface LessonTypeEntry {
  id: string;
  date: string;
  subject: string;
  type: string;
  lessonNumber?: number;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  testId: string;
  variantId?: string; // Выбранный вариант (если используются варианты)
  date: string;
  subject: string;
  correct: number;
  total: number;
  percent: number;
  grade: number;
  completedAt: string;
  timeSpent: number; // seconds spent on test
  answers: { questionId: string; answer: string | string[]; correct: boolean }[];
}

export interface TestAssignment {
  id: string;
  studentId: string;
  testId: string;
  date: string;
  subject: string;
  lessonNumber: number;
  assigned: boolean; // true = тест назначен, false = не назначен (например, болеет)
  variantId?: string; // Назначенный вариант (если используются варианты)
}

// Notifications removed

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  subject: string;
  type: 'Н' | 'УП' | 'Б' | 'ОП';
}

export const ATTENDANCE_TYPES: { value: AttendanceRecord['type']; label: string; short: string; color: string; bgColor: string }[] = [
  { value: 'Н', label: 'Неуважительная причина', short: 'Н', color: 'text-red-700', bgColor: 'bg-red-100' },
  { value: 'УП', label: 'Уважительная причина', short: 'УП', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  { value: 'Б', label: 'Болел', short: 'Б', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { value: 'ОП', label: 'Опоздал', short: 'ОП', color: 'text-orange-700', bgColor: 'bg-orange-100' },
];

export interface CustomLessonType {
  id: string;
  value: string;
  label: string;
  color: string;
  short: string;
}

export const defaultCustomLessonTypes: CustomLessonType[] = [];

// ==================== CONSTANTS ====================

export const TIME_SLOTS = [
  { num: 1, start: '08:00', end: '08:45' },
  { num: 2, start: '08:55', end: '09:40' },
  { num: 3, start: '09:50', end: '10:35' },
  { num: 4, start: '10:55', end: '11:40' },
  { num: 5, start: '11:50', end: '12:35' },
  { num: 6, start: '12:45', end: '13:30' },
  { num: 7, start: '13:40', end: '14:25' },
];

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const DAY_NAMES_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const MONTH_NAMES_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export const SUBJECTS = [
  'Математика', 'Русский язык', 'Обществознание', 'География'
];

export const LESSON_TYPE_OPTIONS: { value: string; label: string; color: string; short: string }[] = [
  { value: '', label: 'Не указан', color: 'bg-gray-100 text-gray-500', short: '' },
  { value: 'new', label: 'Новая тема', color: 'bg-blue-100 text-blue-700', short: 'НТ' },
  { value: 'consolidation', label: 'Закрепление', color: 'bg-cyan-100 text-cyan-700', short: 'Зк' },
  { value: 'practice', label: 'Практика', color: 'bg-green-100 text-green-700', short: 'Пр' },
  { value: 'lab', label: 'Лаб. работа', color: 'bg-teal-100 text-teal-700', short: 'Лр' },
  { value: 'control', label: 'Контрольная', color: 'bg-red-100 text-red-700', short: 'Кр' },
  { value: 'independent', label: 'Самост. работа', color: 'bg-orange-100 text-orange-700', short: 'Ср' },
  { value: 'test', label: 'Тест', color: 'bg-purple-100 text-purple-700', short: 'Тс' },
  { value: 'review', label: 'Повторение', color: 'bg-amber-100 text-amber-700', short: 'Пв' },
  { value: 'exam', label: 'Зачёт', color: 'bg-rose-100 text-rose-700', short: 'Зч' },
];

// ==================== USERS ====================

export const adminUsers: User[] = [
  { id: 'u2', username: 'admin', password: 'admin', role: 'admin', name: 'Директор' },
];

// ==================== STUDENTS ====================

export const initialStudents: Student[] = [];

// ==================== SCHEDULE ====================

export const initialLessons: Lesson[] = [];

// ==================== GRADES ====================

export const initialGrades: Grade[] = [];

// ==================== DIARY ENTRIES ====================

function generateDiaryEntries(): DiaryEntry[] {
  // No initial lessons, so no diary entries
  return [];
}

export const initialDiaryEntries: DiaryEntry[] = generateDiaryEntries();

// ==================== TESTS ====================

export const initialTests: Test[] = [];

// ==================== HELPERS ====================

export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateRu(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_GEN[date.getMonth()]}`;
}

export function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  startDow -= 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
