import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth, useData } from '../context';
import { Schedule } from './Schedule';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  BookOpen, Calendar, ClipboardList, BarChart3, LogOut, ChevronLeft, ChevronRight,
  FileText, Clock, CheckCircle, AlertCircle, Play, ArrowLeft, ArrowRight
} from 'lucide-react';
import { SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, DAY_NAMES, getWeekDates, formatDate, ATTENDANCE_TYPES } from '../data';

type Tab = 'home' | 'schedule' | 'grades' | 'diary' | 'statistics';

export const StudentView: React.FC = () => {
  const { user, logout } = useAuth();
  const { lessons, grades, diaryEntries, tests, testAttempts, setTestAttempts, testRetakes, setTestRetakes, setGrades, journalColumns, students, testAssignments, attendance } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const studentId = user?.id || '';
  // Используем все оценки ученика (без фильтрации по урокам), чтобы совпадало с расчётами админа
  const myGrades = useMemo(() => grades.filter(g => g.studentId === studentId), [grades, studentId]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Главная', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-5 h-5" /> },
    { id: 'grades', label: 'Оценки', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'diary', label: 'Дневник', icon: <FileText className="w-5 h-5" /> },
    { id: 'statistics', label: 'Статистика', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg">Дневник</span>
            </div>
            <nav className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}>
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'home' && <Home myGrades={myGrades} lessons={lessons} />}
        {activeTab === 'schedule' && <Schedule />}
        {activeTab === 'grades' && <Grades myGrades={myGrades} attendance={attendance} studentId={studentId} />}
        {activeTab === 'diary' && (
          <Diary
            studentId={studentId}
            lessons={lessons}
            diaryEntries={diaryEntries}
            myGrades={myGrades}
            tests={tests}
            testAttempts={testAttempts}
            setTestAttempts={setTestAttempts}
            testRetakes={testRetakes}
            setTestRetakes={setTestRetakes}
            grades={grades}
            setGrades={setGrades}
            journalColumns={journalColumns}
            testAssignments={testAssignments}
            attendance={attendance}
          />
        )}
        {activeTab === 'statistics' && <Statistics studentId={studentId} grades={grades} lessons={lessons} students={students} />}
      </main>
    </div>
  );
};

// ==================== HOME ====================
const Home: React.FC<{ myGrades: any[]; lessons: any[] }> = ({ myGrades, lessons }) => {
  const today = formatDate(new Date());
  const todayLessons = lessons.filter((l: any) => l.date === today).sort((a: any, b: any) => a.lessonNumber - b.lessonNumber);
  const avgGrade = myGrades.length > 0 ? (myGrades.reduce((s: number, g: any) => s + g.value, 0) / myGrades.length).toFixed(2) : '—';

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20">
        <h1 className="text-2xl font-semibold mb-2">Добро пожаловать!</h1>
        <p className="text-blue-100">Сегодня {new Date().getDate()} {MONTH_NAMES_GEN[new Date().getMonth()]}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">Средний балл</div>
          <div className="text-4xl font-bold text-blue-600">{avgGrade}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">Всего оценок</div>
          <div className="text-4xl font-bold text-gray-900">{myGrades.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-gray-500 mb-2">Уроков сегодня</div>
          <div className="text-4xl font-bold text-gray-900">{todayLessons.length}</div>
        </div>
      </div>
      {todayLessons.length > 0 && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Расписание на сегодня</h3>
          <div className="space-y-3">
            {todayLessons.map((l: any) => (
              <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-medium text-white shadow-md">
                  {l.lessonNumber}
                </div>
                <span className="flex-1 font-medium text-gray-900">{l.subject}</span>
                {l.startTime && (
                  <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg">
                    {l.startTime}-{l.endTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== GRADES ====================
const Grades: React.FC<{ myGrades: any[]; attendance: any[]; studentId: string }> = ({ myGrades, attendance, studentId }) => {
  const gradesBySubject = useMemo(() => {
    const map: Record<string, { dates: Record<string, number[]>; allGrades: number[]; hasAttendance: Set<string> }> = {};
    SUBJECTS.forEach(s => { map[s] = { dates: {}, allGrades: [], hasAttendance: new Set() }; });
    
    // Добавляем оценки
    myGrades.forEach(g => {
      if (!map[g.subject]) map[g.subject] = { dates: {}, allGrades: [], hasAttendance: new Set() };
      if (!map[g.subject].dates[g.date]) map[g.subject].dates[g.date] = [];
      map[g.subject].dates[g.date].push(g.value);
      map[g.subject].allGrades.push(g.value);
    });
    
    // Добавляем информацию о посещаемости
    if (attendance && Array.isArray(attendance)) {
      attendance.forEach(a => {
        if (a.studentId === studentId && map[a.subject]) {
          map[a.subject].hasAttendance.add(a.date);
        }
      });
    }
    
    return map;
  }, [myGrades, attendance, studentId]);

  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    myGrades.forEach(g => dateSet.add(g.date));
    // Добавляем даты из посещаемости
    if (attendance && Array.isArray(attendance)) {
      attendance.forEach(a => {
        if (a.studentId === studentId) {
          dateSet.add(a.date);
        }
      });
    }
    return Array.from(dateSet).sort();
  }, [myGrades, attendance, studentId]);

  const monthGroups = useMemo(() => {
    const groups: { month: string; dates: string[] }[] = [];
    let currentMonth = '';
    allDates.forEach(d => {
      const m = MONTH_NAMES[parseInt(d.split('-')[1]) - 1]?.slice(0, 3) || '';
      if (m !== currentMonth) { currentMonth = m; groups.push({ month: m, dates: [d] }); }
      else { groups[groups.length - 1].dates.push(d); }
    });
    return groups;
  }, [allDates]);

  const gradeColor = (v: number) => v === 5 ? 'bg-green-100 text-green-700' : v === 4 ? 'bg-blue-100 text-blue-700' : v === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Оценки</h2>
      <div className="glass rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {monthGroups.length > 0 && (
                <tr className="bg-primary-50/50">
                  <th className="sticky left-0 z-10 bg-primary-50/50 px-5 py-3 text-left font-semibold text-primary-700 border-b border-r border-primary-100 min-w-[180px]"></th>
                  {monthGroups.map((mg, i) => (
                    <th key={i} colSpan={mg.dates.length} className="px-3 py-3 text-center font-bold text-primary-800 border-b border-r border-primary-100 text-xs uppercase">{mg.month}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-primary-700 border-b border-primary-100">Ср.</th>
                </tr>
              )}
              <tr className="bg-gray-50/50">
                <th className="sticky left-0 z-10 bg-gray-50/50 px-5 py-3 text-left font-semibold text-gray-600 border-b border-r border-gray-100 min-w-[180px]">Предмет</th>
                {allDates.map(d => (
                  <th key={d} className="px-3 py-3 text-center font-semibold text-gray-500 border-b border-r border-gray-50 min-w-[50px]">
                    {parseInt(d.split('-')[2])}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-semibold text-gray-500 border-b border-gray-100 min-w-[64px]">Ср.</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map(subject => {
                const data = gradesBySubject[subject];
                // Показываем предмет если у него есть оценки или посещаемость
                if (!data || (data.allGrades.length === 0 && data.hasAttendance.size === 0)) return null;
                const avg = data.allGrades.length > 0 
                  ? data.allGrades.reduce((a, b) => a + b, 0) / data.allGrades.length 
                  : null;
                return (
                  <tr key={subject} className="border-b border-gray-50 hover:bg-white/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-5 py-3 font-bold text-gray-900 border-r border-gray-100">{subject}</td>
                    {allDates.map(d => {
                      const vals = data.dates[d] || [];
                      // Ищем отметку посещаемости для этой даты и предмета
                      const att = attendance && Array.isArray(attendance) 
                        ? attendance.find((a: any) => a.studentId === studentId && a.date === d && a.subject === subject)
                        : null;
                      const at = att ? ATTENDANCE_TYPES.find((a: any) => a.value === att.type) : null;
                      
                      // Если есть посещаемость — показываем её, иначе оценки
                      if (att) {
                        return (
                          <td key={d} className="px-1.5 py-2 text-center border-r border-gray-50">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${at?.bgColor} ${at?.color}`}>
                              {att.type}
                            </span>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={d} className="px-1.5 py-2 text-center border-r border-gray-50">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {vals.map((v, i) => (
                              <span key={i} className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${gradeColor(v)}`}>{v}</span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center font-bold border-gray-100">
                      {avg !== null ? (
                        <span className={`inline-flex items-center justify-center w-11 h-9 rounded-xl text-sm font-bold ${avg >= 4.5 ? 'bg-success-100 text-success-700' : avg >= 3.5 ? 'bg-primary-100 text-primary-700' : avg >= 2.5 ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'}`}>
                          {avg.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== DIARY ====================
interface DiaryProps {
  studentId: string; lessons: any[]; diaryEntries: any[]; myGrades: any[];
  tests: any[]; testAttempts: any[]; setTestAttempts: any;
  testRetakes: any[]; setTestRetakes: any; grades: any[]; setGrades: any; journalColumns: any[];
  testAssignments: any[];
  attendance: any[];
}

const Diary: React.FC<DiaryProps> = ({
  studentId, lessons, diaryEntries, myGrades, tests,
  testAttempts, setTestAttempts, testRetakes, setTestRetakes, grades: _grades, setGrades, journalColumns, testAssignments, attendance
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDates = getWeekDates(currentDate);

  const [takingTest, setTakingTest] = useState<{ test: any; entry: any; variantId?: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ test: any; entry: any; variantId?: string } | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [testTimer, setTestTimer] = useState(0);
  const [testStartTime, setTestStartTime] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const finishTestRef = useRef<() => void>();

  const finishTest = useCallback(() => {
    if (!takingTest) return;
    const test = takingTest.test;
    const entry = takingTest.entry;

    // Используем вопросы выбранного варианта или основной список
    const questions = takingTest.variantId
      ? test.variants?.find((v: any) => v.id === takingTest.variantId)?.questions || test.questions
      : test.questions;

    let correct = 0;
    const total = questions.length;
    const answerDetails: any[] = [];

    questions.forEach((q: any) => {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      if (q.type === 'single') {
        const correctOpt = q.options.find((o: any) => o.correct);
        isCorrect = correctOpt && userAnswer === correctOpt.id;
      } else if (q.type === 'multiple') {
        const correctIds = q.options.filter((o: any) => o.correct).map((o: any) => o.id).sort();
        const selected = (Array.isArray(userAnswer) ? userAnswer : []).sort();
        isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
      } else if (q.type === 'text') {
        isCorrect = typeof userAnswer === 'string' && q.correctAnswer &&
          userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      }
      if (isCorrect) correct++;
      // Сохраняем ответ с ID вопроса из варианта (или базового списка)
      answerDetails.push({ questionId: q.id, answer: userAnswer || '', correct: isCorrect });
    });

    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    let grade = 2;
    const scale = [...(test.gradingScale || [])].sort((a: any, b: any) => b.minPercent - a.minPercent);
    for (const s of scale) { if (percent >= s.minPercent) { grade = s.grade; break; } }

    const timeSpent = Math.round((Date.now() - testStartTime) / 1000);

    const attempt = {
      id: `ta${Date.now()}`, studentId, testId: test.id, variantId: takingTest.variantId, date: entry.date,
      subject: entry.subject, correct, total, percent, grade,
      completedAt: new Date().toISOString(), timeSpent, answers: answerDetails,
    };

    setTestAttempts((prev: any[]) => {
      const filtered = prev.filter((a: any) => !(a.studentId === studentId && a.testId === test.id && a.date === entry.date));
      return [...filtered, attempt];
    });

    setTestRetakes((prev: any[]) => prev.filter((r: any) => !(r.studentId === studentId && r.testId === test.id)));

    const entryLessonNumber = entry.lessonNumber ?? 1;
    console.log('finishTest - looking for test column:', {
      date: entry.date,
      subject: entry.subject,
      entryLessonNumber,
      journalColumns: journalColumns.filter((c: any) => c.type === 'test')
    });

    // Более гибкий поиск колонки теста
    const testCol = journalColumns.find((c: any) =>
      c.date === entry.date &&
      c.subject === entry.subject &&
      c.type === 'test' &&
      (c.lessonNumber === entryLessonNumber || (!c.lessonNumber && entryLessonNumber === 0) || (entryLessonNumber === 1 && !c.lessonNumber))
    );

    console.log('finishTest - found test column:', testCol);

    if (testCol) {
      setGrades((prev: any[]) => {
        const filtered = prev.filter((g: any) => !(g.studentId === studentId && g.date === entry.date && g.subject === entry.subject && g.columnId === testCol.id));
        // Добавляем lessonNumber при создании оценки за тест
        return [...filtered, { id: `g${Date.now()}`, studentId, subject: entry.subject, value: grade, date: entry.date, lessonNumber: entryLessonNumber, columnId: testCol.id }];
      });
      console.log('finishTest - grade set successfully:', grade);
    } else {
      console.error('finishTest - test column not found for:', { date: entry.date, subject: entry.subject, lessonNumber: entryLessonNumber });
    }

    setTestResult({ correct, total, percent, grade, timeSpent });
    setTestFinished(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takingTest, answers, testStartTime, studentId, setTestAttempts, setTestRetakes, setGrades, journalColumns]);

  finishTestRef.current = finishTest;

  useEffect(() => {
    if (!takingTest || testFinished) return;
    const hasLimit = takingTest.test.timeLimit > 0;
    const limitSeconds = takingTest.test.timeLimit * 60;
    const interval = setInterval(() => {
      setTestTimer(prev => {
        const newVal = prev + 1;
        if (hasLimit && newVal >= limitSeconds) {
          setTimeout(() => { if (finishTestRef.current) finishTestRef.current(); }, 0);
        }
        return newVal;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [takingTest, testFinished]);

  const startTest = (test: any, entry: any, variantId?: string) => {
    setTakingTest({ test, entry, variantId });
    setCurrentQuestion(0);
    setAnswers({});
    setTestTimer(0);
    setTestStartTime(Date.now());
    setTestFinished(false);
    setTestResult(null);
    setShowConfirm(null);
    setShowCorrectAnswers(false);
    setSelectedVariantId(null);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Taking test UI
  if (takingTest && !testFinished) {
    const test = takingTest.test;
    // Используем вопросы выбранного варианта или основной список
    const questions = takingTest.variantId
      ? test.variants?.find((v: any) => v.id === takingTest.variantId)?.questions || test.questions
      : test.questions;
    const q = questions[currentQuestion];
    const remaining = test.timeLimit > 0 ? test.timeLimit * 60 - testTimer : null;

    return (
      <div className="animate-fadeIn max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{test.title}</h2>
              <p className="text-violet-200 text-sm mt-1">Вопрос {currentQuestion + 1} из {questions.length}</p>
            </div>
            <div className="text-right">
              {remaining !== null && (
                <div className={`text-2xl font-mono font-bold ${remaining < 60 ? 'text-red-300 animate-pulse' : ''}`}>
                  {formatTimer(remaining)}
                </div>
              )}
              <div className="text-violet-200 text-xs mt-1">Прошло: {formatTimer(testTimer)}</div>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">Вопрос {currentQuestion + 1}</span>
            <h3 className="text-lg font-semibold text-gray-900 mt-3" dangerouslySetInnerHTML={{ __html: q.text }}></h3>
            {q.formula && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <span
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(q.formula, {
                      throwOnError: false,
                      displayMode: true,
                    }),
                  }}
                  className="text-lg dark:text-blue-300"
                />
              </div>
            )}
            {q.image && <img src={q.image} alt="" className="mt-3 max-w-full rounded-lg" />}
          </div>

          {q.type === 'single' && (
            <div className="space-y-2">
              {q.options.map((opt: any) => (
                <label key={opt.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[q.id] === opt.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[q.id] === opt.id ? 'border-violet-500' : 'border-gray-300'
                  }`}>
                    {answers[q.id] === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                  </div>
                  <span className="font-medium text-gray-800">{opt.text}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'multiple' && (
            <div className="space-y-2">
              {q.options.map((opt: any) => {
                const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(opt.id) : false;
                return (
                  <label key={opt.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setAnswers(prev => {
                        const current = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];
                        if (current.includes(opt.id)) {
                          return { ...prev, [q.id]: current.filter(id => id !== opt.id) };
                        } else {
                          return { ...prev, [q.id]: [...current, opt.id] };
                        }
                      });
                    }}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      selected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                    }`}>
                      {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="font-medium text-gray-800">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          )}

          {q.type === 'text' && (
            <input type="text" value={(answers[q.id] as string) || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Введите ответ..."
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-lg" />
          )}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>

          <div className="flex gap-1.5">
            {questions.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrentQuestion(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  i === currentQuestion ? 'bg-violet-600 text-white' :
                  answers[questions[i].id] ? 'bg-violet-100 text-violet-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{i + 1}</button>
            ))}
          </div>

          {currentQuestion < questions.length - 1 ? (
            <button onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-violet-600 text-white hover:bg-violet-700 transition-all">
              Следующий <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => finishTest()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-all">
              <CheckCircle className="w-4 h-4" /> Завершить тест
            </button>
          )}
        </div>
      </div>
    );
  }

  // Test result screen
  if (takingTest && testFinished && testResult) {
    if (showCorrectAnswers) {
      const test = takingTest.test;
      // Используем вопросы выбранного варианта или основной список
      const questions = takingTest.variantId
        ? test.variants?.find((v: any) => v.id === takingTest.variantId)?.questions || test.questions
        : test.questions;
      return (
        <div className="animate-fadeIn max-w-3xl mx-auto">
          <button onClick={() => setShowCorrectAnswers(false)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Назад к результатам
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Разбор ответов</h2>
          <div className="space-y-4">
            {questions.map((q: any, qi: number) => {
              const userAnswer = answers[q.id];
              let isCorrect = false;
              if (q.type === 'single') {
                const correctOpt = q.options.find((o: any) => o.correct);
                isCorrect = correctOpt && userAnswer === correctOpt.id;
              } else if (q.type === 'multiple') {
                const correctIds = q.options.filter((o: any) => o.correct).map((o: any) => o.id).sort();
                const selected = (Array.isArray(userAnswer) ? userAnswer : []).sort();
                isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
              } else if (q.type === 'text') {
                isCorrect = typeof userAnswer === 'string' && q.correctAnswer &&
                  userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
              }
              return (
                <div key={q.id} className={`p-4 rounded-2xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{qi + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: q.text }}></p>
                      {q.formula && (
                        <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: katex.renderToString(q.formula, {
                                throwOnError: false,
                                displayMode: true,
                              }),
                            }}
                            className="text-base dark:text-blue-300"
                          />
                        </div>
                      )}
                      {q.type === 'text' ? (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Ваш ответ: </span>
                          <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{(userAnswer as string) || '—'}</span>
                          {!isCorrect && <span className="text-green-700 ml-2">(Верно: {q.correctAnswer})</span>}
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt: any) => {
                            const sel = q.type === 'single' ? userAnswer === opt.id : (Array.isArray(userAnswer) ? userAnswer.includes(opt.id) : false);
                            return (
                              <div key={opt.id} className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                                sel && opt.correct ? 'text-green-700 font-medium bg-green-100' :
                                sel && !opt.correct ? 'text-red-700 font-medium bg-red-100' :
                                !sel && opt.correct ? 'text-green-600 bg-green-50' :
                                'text-gray-500'
                              }`}>
                                {sel ? (opt.correct ? '✓' : '✗') : opt.correct ? '○' : '·'} {opt.text}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => { setTakingTest(null); setTestFinished(false); setTestResult(null); setShowCorrectAnswers(false); }}
            className="mt-6 w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
            Вернуться в дневник
          </button>
        </div>
      );
    }

    const resultColor = testResult.grade >= 4 ? 'green' : testResult.grade === 3 ? 'yellow' : 'red';
    return (
      <div className="animate-fadeIn max-w-lg mx-auto">
        <div className={`bg-gradient-to-br ${resultColor === 'green' ? 'from-green-50 to-green-100 border-green-200' : resultColor === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-red-50 to-red-100 border-red-200'} rounded-2xl p-8 text-center border`}>
          <div className={`w-20 h-20 rounded-full ${resultColor === 'green' ? 'bg-green-200' : resultColor === 'yellow' ? 'bg-yellow-200' : 'bg-red-200'} flex items-center justify-center mx-auto mb-4`}>
            {testResult.grade >= 4 ? <CheckCircle className="w-10 h-10 text-green-600" /> : <AlertCircle className="w-10 h-10 text-red-600" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест завершён!</h2>
          <p className="text-gray-600 mb-6">{takingTest.test.title}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-500">Правильных</div>
              <div className="text-2xl font-bold text-gray-900">{testResult.correct}/{testResult.total}</div>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-500">Процент</div>
              <div className="text-2xl font-bold text-gray-900">{testResult.percent}%</div>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-500">Оценка</div>
              <div className={`text-3xl font-bold ${testResult.grade >= 4 ? 'text-green-600' : testResult.grade === 3 ? 'text-yellow-600' : 'text-red-600'}`}>{testResult.grade}</div>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-500">Время</div>
              <div className="text-2xl font-bold text-gray-900">{formatTimer(testResult.timeSpent)}</div>
            </div>
          </div>

          <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg">✓ Оценка выставлена в журнал</p>

          <div className="flex flex-col gap-3 mt-6">
            <button onClick={() => setShowCorrectAnswers(true)}
              className="w-full px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors">
              Посмотреть правильные ответы
            </button>
            <button onClick={() => { setTakingTest(null); setTestFinished(false); setTestResult(null); }}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
              Вернуться в дневник
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation dialog
  if (showConfirm) {
    const test = showConfirm.test;
    const useVariants = test.useVariants && test.variants && test.variants.length > 0;
    const assignedVariantId = showConfirm.variantId;
    const assignedVariant = assignedVariantId ? test.variants?.find((v: any) => v.id === assignedVariantId) : null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Начать тест?</h3>
            <p className="text-gray-600 mb-1">{test.title}</p>
            <p className="text-sm text-gray-500 mb-2">
              {assignedVariant
                ? `Вариант: ${assignedVariant.name} (${assignedVariant.questions.length} вопросов)`
                : test.useVariants && test.variants && test.variants.length > 0
                  ? `${test.variants.length} вариант${test.variants.length === 1 ? '' : test.variants.length > 1 && test.variants.length < 5 ? 'а' : 'ов'}`
                  : `${test.questions.length} вопросов`}
            </p>
            {showConfirm.test.timeLimit > 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                <Clock className="w-4 h-4 inline mr-1" />
                Ограничение: {showConfirm.test.timeLimit} мин.
              </p>
            )}

            {/* Show assigned variant info */}
            {assignedVariant && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-semibold text-blue-700">Назначен вариант:</p>
                <p className="text-sm font-bold text-blue-900">{assignedVariant.name}</p>
                <p className="text-xs text-blue-600 mt-1">{assignedVariant.questions.length} вопросов</p>
              </div>
            )}

            {/* Variant selection - only if no variant is assigned */}
            {useVariants && !assignedVariant && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Выберите вариант:</p>
                <div className="grid grid-cols-2 gap-2">
                  {test.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedVariantId === variant.id
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 text-sm">{variant.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{variant.questions.length} вопросов</div>
                    </button>
                  ))}
                </div>
                {selectedVariantId === null && (
                  <p className="text-xs text-amber-600 mt-2">Выберите вариант для продолжения</p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setShowConfirm(null); setSelectedVariantId(null); }}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Отмена
            </button>
            <button
              onClick={() => startTest(showConfirm.test, showConfirm.entry, assignedVariantId || selectedVariantId || undefined)}
              disabled={useVariants && !assignedVariant && selectedVariantId === null}
              className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Начать
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal diary view
  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Дневник</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}
            className="p-2.5 rounded-xl hover:bg-white/60 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-700 px-3">
            {weekDates[0].getDate()} - {weekDates[5].getDate()} {MONTH_NAMES_GEN[weekDates[5].getMonth()]}
          </span>
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}
            className="p-2.5 rounded-xl hover:bg-white/60 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {weekDates.map((date, dayIdx) => {
          const dateStr = formatDate(date);
          const dayLessons = lessons.filter((l: any) => l.date === dateStr).sort((a: any, b: any) => a.lessonNumber - b.lessonNumber);
          if (dayLessons.length === 0) return null;
          const dow = date.getDay();
          const dayNameIdx = dow === 0 ? 6 : dow - 1;

          return (
            <div key={dayIdx} className="glass rounded-2xl overflow-hidden shadow-soft">
              <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{DAY_NAMES[dayNameIdx]}</h3>
                  <span className="text-sm font-semibold text-primary-700">{date.getDate()} {MONTH_NAMES_GEN[date.getMonth()]}</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-3 text-left w-10">№</th>
                    <th className="px-5 py-3 text-left">Предмет</th>
                    <th className="px-5 py-3 text-left">Тема</th>
                    <th className="px-5 py-3 text-left">Домашнее задание</th>
                    <th className="px-5 py-3 text-center w-24">Оценка</th>
                  </tr>
                </thead>
                <tbody>
                  {dayLessons.map((lesson: any) => {
                    // ONLY exact match — no fallback to prevent sharing between lessons
                    const entry = diaryEntries.find((e: any) => e.date === dateStr && e.subject === lesson.subject && e.lessonNumber === lesson.lessonNumber);
                    const dayGrades = myGrades.filter(g => g.date === dateStr && g.subject === lesson.subject);
                    const testObj = entry?.testId ? tests.find((t: any) => t.id === entry.testId) : null;

                    const attempt = testObj ? testAttempts.find((a: any) => a.studentId === studentId && a.testId === testObj.id && a.date === dateStr) : null;
                    const retakeAllowed = testObj ? testRetakes.some((r: any) => r.studentId === studentId && r.testId === testObj.id) : false;

                    // Получаем назначение теста для ученика
                    const assignment = testObj && testAssignments ? testAssignments.find((a: any) =>
                      a.studentId === studentId &&
                      a.testId === testObj.id &&
                      a.date === dateStr &&
                      a.subject === lesson.subject &&
                      a.lessonNumber === lesson.lessonNumber
                    ) : null;

                    // Если ученик освобождён от теста
                    const isExempt = assignment?.assigned === false;

                    return (
                      <tr key={lesson.id} className="border-b border-gray-50 last:border-b-0 hover:bg-white/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 font-bold">{lesson.lessonNumber}</td>
                        <td className="px-5 py-3 font-bold text-gray-900">{lesson.subject}</td>
                        <td className="px-5 py-3 text-gray-600">{entry?.topic || '—'}</td>
                        <td className="px-5 py-3">
                          {entry?.homework && (
                            <p className="text-gray-600 mb-2">{entry.homework}</p>
                          )}
                          {testObj && (
                            <div className="mt-2">
                              {isExempt ? (
                                <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-gray-700 truncate">{testObj.title}</div>
                                    <div className="text-[10px] text-red-600">Освобождён от теста</div>
                                  </div>
                                </div>
                              ) : attempt && !retakeAllowed ? (
                                <div className="flex items-center gap-2 p-2.5 bg-success-50 rounded-xl border border-success-200">
                                  <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-gray-700 truncate">{testObj.title}</div>
                                    <div className="text-[10px] text-gray-500">Оценка: {attempt.grade} ({attempt.percent}%)</div>
                                  </div>
                                </div>
                              ) : retakeAllowed ? (
                                <button onClick={() => setShowConfirm({ test: testObj, entry, variantId: assignment?.variantId })}
                                  className="flex items-center gap-2 p-2.5 bg-warning-50 rounded-xl border border-warning-200 hover:bg-warning-100 transition-colors w-full text-left">
                                  <div className="w-9 h-9 rounded-xl bg-warning-200 flex items-center justify-center flex-shrink-0">
                                    <Play className="w-4 h-4 text-warning-700" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-warning-900 truncate">{testObj.title}</div>
                                    <div className="text-[10px] text-warning-600">Пересдача доступна</div>
                                  </div>
                                </button>
                              ) : (
                                <button onClick={() => setShowConfirm({ test: testObj, entry, variantId: assignment?.variantId })}
                                  className="flex items-center gap-2 p-2.5 bg-primary-50 rounded-xl border border-primary-200 hover:bg-primary-100 transition-colors w-full text-left group">
                                  <div className="w-9 h-9 rounded-xl bg-primary-200 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-300 transition-colors">
                                    <Play className="w-4 h-4 text-primary-700" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-primary-900 truncate">{testObj.title}</div>
                                    <div className="text-[10px] text-primary-600">
                                      {assignment?.variantId && testObj.variants
                                        ? `Вариант: ${testObj.variants.find((v: any) => v.id === assignment.variantId)?.name || '—'}`
                                        : testObj.useVariants && testObj.variants && testObj.variants.length > 0
                                          ? `${testObj.variants.length} вариант${testObj.variants.length === 1 ? '' : testObj.variants.length > 1 && testObj.variants.length < 5 ? 'а' : 'ов'}`
                                          : `${testObj.questions.length} вопр.`}{testObj.timeLimit > 0 ? ` · ${testObj.timeLimit} мин` : ''}
                                    </div>
                                  </div>
                                </button>
                              )}
                            </div>
                          )}
                          {!entry?.homework && !testObj && <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {(() => {
                            // Ищем отметку посещаемости для этого урока
                            const att = attendance && Array.isArray(attendance) 
                              ? attendance.find((a: any) => a.studentId === studentId && a.date === dateStr && a.subject === lesson.subject)
                              : null;
                            const at = att ? ATTENDANCE_TYPES.find((a: any) => a.value === att.type) : null;
                            
                            // Если есть посещаемость — показываем её, иначе оценки
                            if (att) {
                              return (
                                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold ${at?.bgColor} ${at?.color}`}>
                                  {att.type}
                                </span>
                              );
                            }
                            
                            // Иначе показываем оценки
                            return (
                              <div className="flex flex-wrap gap-1.5 justify-center">
                                {dayGrades.map((g: any, i: number) => (
                                  <span key={i} className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold ${
                                    g.value === 5 ? 'bg-success-100 text-success-700' :
                                    g.value === 4 ? 'bg-primary-100 text-primary-700' :
                                    g.value === 3 ? 'bg-warning-100 text-warning-700' :
                                    'bg-danger-100 text-danger-700'
                                  }`}>{g.value}</span>
                                ))}
                                {dayGrades.length === 0 && <span className="text-gray-400">—</span>}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== STATISTICS ====================
interface StatisticsProps {
  studentId: string;
  grades: any[];
  lessons: any[];
  students: any[];
}

const Statistics: React.FC<StatisticsProps> = ({ studentId, grades, lessons, students }) => {
  // Используем все оценки без фильтрации по урокам, чтобы совпадало с расчётами админа
  const allGrades = grades;

  // Средний балл текущего ученика по всем предметам
  const myGrades = useMemo(() => allGrades.filter(g => g.studentId === studentId), [allGrades, studentId]);
  const myOverallAvg = useMemo(() => {
    if (myGrades.length === 0) return 0;
    return myGrades.reduce((sum, g) => sum + g.value, 0) / myGrades.length;
  }, [myGrades]);

  // Вычисляем статистику по каждому предмету
  const subjectStats = useMemo(() => {
    const stats: Array<{
      subject: string;
      myAvg: number;
      myCount: number;
      classAvg: number;
      classCount: number;
      myPosition: number;
      totalStudents: number;
    }> = [];

    // Получаем все предметы из оценок
    const subjects = [...new Set(allGrades.map(g => g.subject))];

    subjects.forEach(subject => {
      // Оценки текущего ученика по предмету
      const subjectMyGrades = myGrades.filter(g => g.subject === subject);
      const myAvg = subjectMyGrades.length > 0
        ? subjectMyGrades.reduce((sum, g) => sum + g.value, 0) / subjectMyGrades.length
        : 0;

      // Оценки всех учеников по предмету
      const subjectAllGrades = allGrades.filter(g => g.subject === subject);

      // Средний балл класса по предмету - считаем как среднее всех оценок (как в AdminView)
      const classAvg = subjectAllGrades.length > 0
        ? subjectAllGrades.reduce((sum, g) => sum + g.value, 0) / subjectAllGrades.length
        : 0;

      // Вычисляем средний балл для каждого ученика по предмету (для определения позиции)
      const studentAvgs: { studentId: string; avg: number; count: number }[] = [];
      const studentGradesMap: Record<string, number[]> = {};

      subjectAllGrades.forEach(g => {
        if (!studentGradesMap[g.studentId]) studentGradesMap[g.studentId] = [];
        studentGradesMap[g.studentId].push(g.value);
      });

      Object.entries(studentGradesMap).forEach(([sid, vals]) => {
        studentAvgs.push({
          studentId: sid,
          avg: vals.reduce((sum, v) => sum + v, 0) / vals.length,
          count: vals.length
        });
      });

      // Сортируем по среднему баллу (от большего к меньшему)
      studentAvgs.sort((a, b) => b.avg - a.avg);

      // Находим позицию текущего ученика
      const myPosition = studentAvgs.findIndex(s => s.studentId === studentId) + 1;

      stats.push({
        subject,
        myAvg,
        myCount: subjectMyGrades.length,
        classAvg,
        classCount: studentAvgs.length,
        myPosition: myPosition || 0,
        totalStudents: studentAvgs.length
      });
    });

    // Сортируем предметы по названию
    return stats.sort((a, b) => a.subject.localeCompare(b.subject));
  }, [allGrades, myGrades, studentId]);

  // Средний балл класса по всем предметам
  const classOverallAvg = useMemo(() => {
    if (allGrades.length === 0) return 0;
    return allGrades.reduce((sum, g) => sum + g.value, 0) / allGrades.length;
  }, [allGrades]);

  // Количество учеников в классе
  const totalStudents = students.length;

  const getPositionColor = (pos: number, total: number) => {
    if (pos === 0) return 'text-gray-400';
    const percentile = pos / total;
    if (percentile <= 0.25) return 'text-green-600 bg-green-100';
    if (percentile <= 0.5) return 'text-blue-600 bg-blue-100';
    if (percentile <= 0.75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPositionBadge = (pos: number, total: number) => {
    if (pos === 0) return <span className="text-gray-400">—</span>;
    const colorClass = getPositionColor(pos, total);
    const suffix = pos === 1 ? 'е' : pos >= 2 && pos <= 4 ? 'е' : 'е';
    return (
      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${colorClass}`}>
        {pos}-м{suffix} из {total}
      </span>
    );
  };

  const getAvgColor = (avg: number) => {
    if (avg === 0) return 'bg-gray-100 text-gray-400';
    if (avg >= 4.5) return 'bg-success-100 text-success-700';
    if (avg >= 3.5) return 'bg-primary-100 text-primary-700';
    if (avg >= 2.5) return 'bg-warning-100 text-warning-700';
    return 'bg-danger-100 text-danger-700';
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Статистика</h2>

      {/* Карточка среднего балла ученика */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="text-sm font-medium text-primary-200 mb-2">Ваш средний балл</div>
          <div className="text-5xl font-bold mb-2">{myOverallAvg > 0 ? myOverallAvg.toFixed(2) : '—'}</div>
          <div className="text-primary-200 text-sm">по всем предметам</div>
        </div>
      </div>

      {/* Статистика класса */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 card-hover">
          <div className="text-sm font-semibold text-gray-500 mb-2">Средний балл класса</div>
          <div className="text-4xl font-bold text-gray-900">{classOverallAvg > 0 ? classOverallAvg.toFixed(2) : '—'}</div>
        </div>
        <div className="glass rounded-2xl p-6 card-hover">
          <div className="text-sm font-semibold text-gray-500 mb-2">Учеников в классе</div>
          <div className="text-4xl font-bold text-gray-900">{totalStudents}</div>
        </div>
        <div className="glass rounded-2xl p-6 card-hover">
          <div className="text-sm font-semibold text-gray-500 mb-2">Всего оценок</div>
          <div className="text-4xl font-bold text-gray-900">{allGrades.length}</div>
        </div>
      </div>

      {/* Статистика по предметам */}
      <div className="glass rounded-3xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-6 text-lg">Статистика по предметам</h3>
        <div className="space-y-4">
          {subjectStats.length > 0 ? subjectStats.map(stat => (
            <div key={stat.subject} className="p-4 rounded-2xl bg-white/60 hover:bg-white transition-colors border border-white/80">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-gray-900 text-lg">{stat.subject}</div>
                <div className="flex items-center gap-2">
                  {stat.myCount > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {stat.myCount} оцен{stat.myCount === 1 ? 'ка' : stat.myCount >= 2 && stat.myCount <= 4 ? 'ки' : 'ок'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Средний балл ученика */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Ваш балл</div>
                  <div className={`inline-flex items-center justify-center h-12 rounded-xl text-2xl font-bold ${getAvgColor(stat.myAvg)}`}>
                    {stat.myAvg > 0 ? stat.myAvg.toFixed(2) : '—'}
                  </div>
                </div>

                {/* Место в классе */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Место в классе</div>
                  <div className="flex items-center h-12">
                    {getPositionBadge(stat.myPosition, stat.totalStudents)}
                  </div>
                </div>

                {/* Средний балл класса */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Балл класса</div>
                  <div className={`inline-flex items-center justify-center h-12 rounded-xl text-2xl font-bold ${getAvgColor(stat.classAvg)}`}>
                    {stat.classAvg > 0 ? stat.classAvg.toFixed(2) : '—'}
                  </div>
                </div>
              </div>

              {/* Прогресс бар */}
              {stat.myAvg > 0 && (
                <div className="mt-4">
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.myAvg >= 4.5 ? 'bg-gradient-to-r from-success-400 to-success-500' :
                        stat.myAvg >= 3.5 ? 'bg-gradient-to-r from-primary-400 to-primary-500' :
                        stat.myAvg >= 2.5 ? 'bg-gradient-to-r from-warning-400 to-warning-500' :
                        'bg-gradient-to-r from-danger-400 to-danger-500'
                      }`}
                      style={{ width: `${(stat.myAvg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Нет данных для отображения статистики</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
