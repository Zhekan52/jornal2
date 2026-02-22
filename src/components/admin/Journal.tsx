import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../context';
import { SUBJECTS, MONTH_NAMES, MONTH_NAMES_GEN, ATTENDANCE_TYPES, type AttendanceRecord } from '../../data';
import {
  Settings, Plus, X, ChevronDown, AlertTriangle, TrendingUp, TrendingDown, ArrowLeft
} from 'lucide-react';
import { GradePickerPortal } from './GradePickerPortal';
import { AttendancePickerPortal } from './AttendancePickerPortal';
import { TestResultsSection } from './TestResultsSection';

// ==================== JOURNAL ====================
export const Journal: React.FC = () => {
  const {
    students, grades, setGrades, diaryEntries, setDiaryEntries, lessons,
    journalColumns, setJournalColumns, lessonTypes, setLessonTypes,
    customLessonTypes, attendance, setAttendance, tests,
    testAttempts, testRetakes, setTestRetakes, setTestAttempts,
    testAssignments, setTestAssignments,
  } = useData();

  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [journalTab, setJournalTab] = useState<'grades' | 'topics' | 'attendance'>('grades');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [showNotAsked, setShowNotAsked] = useState(true);
  const [gradePickerState, setGradePickerState] = useState<{ rect: DOMRect; studentId: string; date: string; columnId?: string; lessonNumber?: number } | null>(null);
  const [attendancePickerState, setAttendancePickerState] = useState<{ rect: DOMRect; studentId: string; date: string } | null>(null);
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const [lessonPageDate, setLessonPageDate] = useState<string | null>(null);
  const [lessonPageLessonNum, setLessonPageLessonNum] = useState<number>(1);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check for journal open parameters from schedule
  useEffect(() => {
    const params = localStorage.getItem('open_journal_params');
    if (params) {
      try {
        const { subject, date, lessonNumber } = JSON.parse(params);
        localStorage.removeItem('open_journal_params');
        if (subject && date) {
          setSelectedSubject(subject);
          setLessonPageDate(date);
          setLessonPageLessonNum(lessonNumber || 1);
        }
      } catch (e) {
        console.error('Error parsing journal params:', e);
      }
    }
  }, [setSelectedSubject, setLessonPageDate, setLessonPageLessonNum]);

  const sortedStudents = useMemo(() =>
    [...students].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)),
    [students]
  );

  // Each lesson = one slot in the journal (date + lessonNumber)
  const allSlots = useMemo(() => {
    return lessons
      .filter(l => l.subject === selectedSubject)
      .map(l => ({ date: l.date, lessonNumber: l.lessonNumber, key: `${l.date}_${l.lessonNumber}` }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.lessonNumber - b.lessonNumber);
  }, [lessons, selectedSubject]);

  // For backward compatibility, unique dates list
  const allDates = useMemo(() => {
    const s = new Set<string>();
    allSlots.forEach(sl => s.add(sl.date));
    return Array.from(s).sort();
  }, [allSlots]);

  const monthGroups = useMemo(() => {
    const groups: { month: string; slots: typeof allSlots }[] = [];
    let currentMonth = '';
    allSlots.forEach(sl => {
      const m = MONTH_NAMES[parseInt(sl.date.split('-')[1]) - 1]?.slice(0, 3) || '';
      if (m !== currentMonth) { currentMonth = m; groups.push({ month: m, slots: [sl] }); }
      else { groups[groups.length - 1].slots.push(sl); }
    });
    return groups;
  }, [allSlots]);

  // unused removed

  const getColumnsForSlot = (date: string, lessonNumber: number) => {
    return journalColumns.filter(c => c.date === date && c.subject === selectedSubject && (c.lessonNumber === lessonNumber || (!c.lessonNumber && lessonNumber === 0)));
  };

  // Legacy: get columns for date (used in lesson page and popover)
  const getColumnsForDate = (date: string) => {
    return journalColumns.filter(c => c.date === date && c.subject === selectedSubject);
  };

  const addColumn = (date: string, lessonNumber?: number) => {
    setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date, subject: selectedSubject, lessonNumber, type: 'grade' }]);
  };

  const removeColumn = (colId: string) => {
    setJournalColumns(prev => prev.filter(c => c.id !== colId));
    setGrades(prev => prev.filter(g => g.columnId !== colId));
  };

  const getGrade = (studentId: string, date: string, columnId?: string, lessonNumber?: number) => {
    const result = grades.find(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject
      && (columnId ? g.columnId === columnId : !g.columnId)
      && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true));
    // Логирование для отладки поиска оценок в колонках
    if (columnId && result) {
      console.log('getGrade found column grade:', { studentId, date, columnId, lessonNumber, grade: result });
    } else if (columnId) {
      console.log('getGrade NOT found column grade:', { studentId, date, columnId, lessonNumber, matchingGrades: grades.filter(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject) });
    }
    return result;
  };

  const setGrade = (studentId: string, date: string, value: number, columnId?: string, lessonNumber?: number) => {
    setGrades(prev => {
      const existing = prev.find(g => g.studentId === studentId && g.date === date && g.subject === selectedSubject
        && (columnId ? g.columnId === columnId : !g.columnId)
        && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true));
      if (existing) return prev.map(g => g.id === existing.id ? { ...g, value } : g);
      return [...prev, { id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId, subject: selectedSubject, value, date, lessonNumber, columnId }];
    });
  };

  const deleteGrade = (studentId: string, date: string, columnId?: string, lessonNumber?: number) => {
    setGrades(prev => prev.filter(g => !(g.studentId === studentId && g.date === date && g.subject === selectedSubject
      && (columnId ? g.columnId === columnId : !g.columnId)
      && (lessonNumber !== undefined ? g.lessonNumber === lessonNumber : true))));
  };

  const getLessonType = (date: string, lessonNumber?: number) => {
    const lessonNum = lessonNumber ?? 0;
    // ONLY exact match — no fallback
    return lessonTypes.find(lt => lt.date === date && lt.subject === selectedSubject && ((lt as any).lessonNumber === lessonNum || (!lt.lessonNumber && lessonNum === 0)));
  };

  const getAttendanceMark = (studentId: string, date: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === date && a.subject === selectedSubject);
  };

  const setAttendanceMark = (studentId: string, date: string, type: AttendanceRecord['type']) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.date === date && a.subject === selectedSubject);
      if (existing) return prev.map(a => a.id === existing.id ? { ...a, type } : a);
      return [...prev, { id: `at${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId, date, subject: selectedSubject, type }];
    });
  };

  const deleteAttendanceMark = (studentId: string, date: string) => {
    setAttendance(prev => prev.filter(a => !(a.studentId === studentId && a.date === date && a.subject === selectedSubject)));
  };

  const getStudentAvg = (studentId: string) => {
    if (!grades || !lessons) return 0;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    );
    return sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
  };

  const getStudentTrend = (studentId: string) => {
    if (!grades || !lessons) return 0;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    ).sort((a, b) => a.date.localeCompare(b.date));
    if (sg.length < 2) return 0;
    const mid = Math.floor(sg.length / 2);
    const firstHalf = sg.slice(0, mid);
    const secondHalf = sg.slice(mid);
    const avgFirst = firstHalf.reduce((a, g) => a + g.value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, g) => a + g.value, 0) / secondHalf.length;
    if (avgSecond - avgFirst > 0.2) return 1;
    if (avgFirst - avgSecond > 0.2) return -1;
    return 0;
  };

  const getLastGradeDate = (studentId: string) => {
    if (!grades || !lessons) return null;
    const sg = grades.filter(g =>
      g.studentId === studentId &&
      g.subject === selectedSubject &&
      lessons.some(l => l.date === g.date && l.subject === selectedSubject)
    ).sort((a, b) => b.date.localeCompare(a.date));
    return sg.length > 0 ? sg[0].date : null;
  };

  const getOrCreateDiaryEntry = (date: string, lessonNumber?: number) => {
    const lessonNum = lessonNumber ?? 1;
    // Защита от undefined
    if (!diaryEntries || !Array.isArray(diaryEntries) || !setDiaryEntries) {
      return null;
    }
    // ONLY match by date + subject + lessonNumber — no fallback to avoid sharing between lessons
    const exact = diaryEntries.find(e => e.date === date && e.subject === selectedSubject && e.lessonNumber === lessonNum);
    if (exact) return exact;
    // Create a brand new entry for this specific lesson
    const newEntry = { id: `de${Date.now()}${Math.random().toString(36).slice(2, 6)}`, date, lessonNumber: lessonNum, subject: selectedSubject, topic: '', homework: '' };
    setDiaryEntries(prev => [...(prev || []), newEntry]);
    return newEntry;
  };

  // ==================== LESSON PAGE ====================
  if (lessonPageDate) {
    console.log('Rendering lesson page:', lessonPageDate, lessonPageLessonNum);
    if (!diaryEntries || !Array.isArray(diaryEntries) || !tests || !Array.isArray(tests)) {
      return (
        <div className="animate-fadeIn">
          <button onClick={() => setLessonPageDate(null)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 font-medium">
            <ArrowLeft className="w-4 h-4" /> Назад к журналу
          </button>
          <div className="text-center py-12 text-gray-500">Загрузка данных...</div>
        </div>
      );
    }

    const entry = diaryEntries.find(e => e.date === lessonPageDate && e.subject === selectedSubject && e.lessonNumber === lessonPageLessonNum);
    const lpLessonType = getLessonType(lessonPageDate, lessonPageLessonNum);
    const cols = getColumnsForSlot(lessonPageDate, lessonPageLessonNum);
    console.log('Lesson page - columns for slot:', { date: lessonPageDate, lessonNumber: lessonPageLessonNum, cols });
    const assignedTest = entry?.testId ? tests.find(t => t.id === entry.testId) : null;

    // Simple calculation without useMemo
    const last5Dates = (!grades || !Array.isArray(grades)) ? [] : (() => {
      const datesSet = new Set(
        grades
          .filter(g => g.subject === selectedSubject && g.date !== lessonPageDate && g.date < lessonPageDate && !g.columnId)
          .map(g => g.date)
      );
      return Array.from(datesSet).sort((a, b) => a.localeCompare(b)).slice(-5);
    })();

    const lpStudentGrades = (!sortedStudents || !grades || !lessons) ? [] : sortedStudents.map(s => {
      const avg = getStudentAvg(s.id);
      const trend = getStudentTrend(s.id);
      const lastDate = getLastGradeDate(s.id);
      const daysSinceLastGrade = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : 999;
      return { ...s, avg, trend, daysSinceLastGrade };
    });

    return (
      <div className="animate-fadeIn space-y-6">
        <button onClick={() => setLessonPageDate(null)} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Назад к журналу
        </button>

        <div className="glass rounded-3xl p-6 text-gray-900 shadow-soft-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{selectedSubject}</h2>
                <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                  Урок №{lessonPageLessonNum}
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                {new Date(lessonPageDate + 'T00:00').getDate()} {MONTH_NAMES_GEN[new Date(lessonPageDate + 'T00:00').getMonth()]} {new Date(lessonPageDate + 'T00:00').getFullYear()}
              </p>
            </div>
            {lpLessonType && (() => {
              const lt = customLessonTypes.find(c => c.value === lpLessonType.type);
              return lt ? (
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${lt.color}`}>
                  {lt.label}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-soft space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тема урока</label>
              <input type="text" value={entry?.topic || ''} onChange={e => {
                const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                if (ent) setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, topic: e.target.value } : de));
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-gray-400" placeholder="Тема урока..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Домашнее задание</label>
              <input type="text" value={entry?.homework || ''} onChange={e => {
                const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                if (ent) setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, homework: e.target.value } : de));
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-gray-400" placeholder="ДЗ..." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тип урока</label>
              <select value={lpLessonType?.type || ''} onChange={e => {
                const val = e.target.value;
                setLessonTypes(prev => {
                  const existing = prev.find(lt => lt.date === lessonPageDate && lt.subject === selectedSubject && (lt.lessonNumber === lessonPageLessonNum || (!lt.lessonNumber && !lessonPageLessonNum)));
                  if (existing) return prev.map(lt => lt.id === existing.id ? { ...lt, type: val, lessonNumber: lessonPageLessonNum } : lt);
                  return [...prev, { id: `lt${Date.now()}`, date: lessonPageDate, subject: selectedSubject, type: val, lessonNumber: lessonPageLessonNum }];
                });
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                <option value="">Не указан</option>
                {customLessonTypes && Array.isArray(customLessonTypes) && customLessonTypes.map(lt => <option key={lt.id} value={lt.value}>{lt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тест</label>
              <select value={entry?.testId || ''} onChange={e => {
                const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                if (ent) {
                  const prevTestId = ent.testId;
                  setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, testId: e.target.value || undefined, testType: e.target.value ? 'real' as const : undefined } : de));
                  
                  // При назначении теста создаем колонку, при удалении - удаляем
                  if (e.target.value && !prevTestId) {
                    const hasCol = journalColumns.some(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)));
                    if (!hasCol) {
                      const newCol = { id: `jc${Date.now()}`, date: lessonPageDate, subject: selectedSubject, lessonNumber: lessonPageLessonNum, type: 'test' };
                      setJournalColumns(prev => [...prev, newCol]);
                    }
                  } else if (!e.target.value && prevTestId) {
                    // Удаляем колонку теста и связанные оценки
                    const testCol = journalColumns.find(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)));
                    if (testCol && setGrades) {
                      setGrades(prev => prev.filter(g => !(g.date === lessonPageDate && g.subject === selectedSubject && g.columnId === testCol.id)));
                    }
                    setJournalColumns(prev => prev.filter(c => !(c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === lessonPageLessonNum || (!c.lessonNumber && lessonPageLessonNum === 0)))));
                  }
                }
              }} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                <option value="">Без теста</option>
                {tests && Array.isArray(tests) && tests.filter(t => t.subject === selectedSubject).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${entry?.checkHomework ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <input type="checkbox" checked={entry?.checkHomework || false} onChange={e => {
                  const ent = getOrCreateDiaryEntry(lessonPageDate, lessonPageLessonNum);
                  if (ent) {
                    setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, checkHomework: e.target.checked } : de));
                    if (e.target.checked) {
                      const hasCol = journalColumns.some(c => c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === lessonPageLessonNum || !c.lessonNumber));
                      if (!hasCol) setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date: lessonPageDate, subject: selectedSubject, lessonNumber: lessonPageLessonNum, type: 'homework' }]);
                    } else {
                      setJournalColumns(prev => prev.filter(c => !(c.date === lessonPageDate && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === lessonPageLessonNum || !c.lessonNumber))));
                    }
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${entry?.checkHomework ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">Проверять ДЗ (колонка)</span>
            </label>

            <div className="flex gap-2">
              {cols.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {c.type === 'homework' ? 'ДЗ' : c.type === 'test' ? 'Тест' : 'Доп.'}
                  <button onClick={() => removeColumn(c.id)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => addColumn(lessonPageDate, lessonPageLessonNum)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Plus className="w-3 h-3" /> Колонка
              </button>
            </div>
          </div>
        </div>

        {assignedTest && entry && (
          <TestResultsSection test={assignedTest} date={lessonPageDate} subject={selectedSubject} students={sortedStudents} testAttempts={testAttempts} testRetakes={testRetakes} setTestRetakes={setTestRetakes} setTestAttempts={setTestAttempts} grades={grades} setGrades={setGrades} journalColumns={journalColumns} lessonNumber={lessonPageLessonNum} testAssignments={testAssignments} setTestAssignments={setTestAssignments} />
        )}

        <div className="glass rounded-2xl shadow-soft overflow-hidden border border-white/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="sticky left-0 z-10 bg-gray-50/80 px-4 py-3 text-left font-semibold w-48 min-w-[180px] border-r border-gray-200">Ученик</th>
                  
                  {last5Dates.map(d => (
                    <th key={d} className="px-2 py-3 text-center font-semibold min-w-[50px] border-r border-gray-200 text-gray-400">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px]">{MONTH_NAMES[parseInt(d.split('-')[1]) - 1]?.slice(0, 3)}</span>
                        <span className="text-xs font-bold">{parseInt(d.split('-')[2])}</span>
                      </div>
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200 bg-primary-50 text-primary-700">
                    Осн.
                  </th>

                  {entry?.checkHomework && (
                    <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200">
                      ДЗ
                    </th>
                  )}

                  {cols.filter(c => c.type !== 'homework').map(c => (
                    <th key={c.id} className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200 bg-blue-50 text-blue-700">
                      {c.type === 'test' ? 'Тест' : 'Доп'}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center font-semibold min-w-[60px] border-r border-gray-200">Ср.</th>
                  <th className="px-2 py-3 text-center font-semibold min-w-[40px] border-r border-gray-200">Тренд</th>
                  <th className="px-2 py-3 text-center font-semibold min-w-[40px]">⚠</th>
                </tr>
              </thead>
              <tbody>
                {lpStudentGrades.map((s, idx) => {
                  const mainGrade = getGrade(s.id, lessonPageDate, undefined, lessonPageLessonNum);
                  // Get all columns for this lesson (including homework)
                  const allColsForLesson = getColumnsForSlot(lessonPageDate, lessonPageLessonNum);
                  const hwCol = entry?.checkHomework ? allColsForLesson.find(c => c.type === 'homework') : null;
                  const hwGrade = hwCol ? getGrade(s.id, lessonPageDate, hwCol.id, lessonPageLessonNum) : null;

                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-white/40 transition-colors">
                      <td className="sticky left-0 z-10 bg-white/0 hover:bg-white/40 px-4 py-2 font-medium text-gray-900 text-xs border-r border-gray-100 whitespace-nowrap backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs w-4">{idx + 1}.</span>
                          <span>{s.lastName} {s.firstName}</span>
                        </div>
                      </td>

                      {last5Dates.map(d => {
                        const g = grades.find(grade => grade.studentId === s.id && grade.date === d && grade.subject === selectedSubject && !grade.columnId);
                        const att = attendance.find(a => a.studentId === s.id && a.date === d && a.subject === selectedSubject);
                        const at = att ? ATTENDANCE_TYPES.find(at => at.value === att.type) : null;
                        return (
                          <td key={d} className="px-1 py-2 text-center border-r border-gray-100">
                            {att ? (
                              <span className={`inline-block w-7 h-7 leading-7 rounded-md text-[10px] font-bold ${at?.bgColor} ${at?.color}`}>
                                {att.type}
                              </span>
                            ) : g ? (
                              <span className={`inline-block w-7 h-7 leading-7 rounded-md text-[10px] font-bold ${
                                g.value === 5 ? 'bg-green-50 text-green-600' :
                                g.value === 4 ? 'bg-blue-50 text-blue-600' :
                                g.value === 3 ? 'bg-yellow-50 text-yellow-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {g.value}
                              </span>
                            ) : <span className="text-gray-200">·</span>}
                          </td>
                        );
                      })}

                      <td className="px-1 py-2 text-center border-r border-gray-100">
                        {(() => {
                          const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                          const at = att ? ATTENDANCE_TYPES.find(at => at.value === att.type) : null;
                          // Если есть посещаемость — показываем её на всю клетку, иначе оценку
                          const showAttendance = !!att;
                          // Блокируем кнопку если есть посещаемость (нельзя ставить оценку)
                          const isBlocked = showAttendance;
                          return (
                            <button
                              onClick={e => {
                                if (!isBlocked) {
                                  setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, lessonNumber: lessonPageLessonNum });
                                }
                              }}
                              disabled={isBlocked}
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${showAttendance ? `${at?.bgColor} ${at?.color}` : mainGrade ?
                                (mainGrade.value === 5 ? 'bg-green-100 text-green-700' : mainGrade.value === 4 ? 'bg-blue-100 text-blue-700' : mainGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                : 'bg-gray-50 text-gray-300 hover:bg-gray-100 border-2 border-dashed border-gray-300'}`}
                              title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                            >
                              {showAttendance ? att?.type : (mainGrade?.value || '')}
                            </button>
                          );
                        })()}
                      </td>

                      {entry?.checkHomework && (
                        <td className="px-1 py-2 text-center border-r border-gray-100">
                          {(() => {
                            const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                            const isBlocked = !!att;
                            return (
                              <button 
                                onClick={e => {
                                  if (!isBlocked) {
                                    setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, columnId: hwCol?.id, lessonNumber: lessonPageLessonNum });
                                  }
                                }}
                                disabled={isBlocked}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${hwGrade ?
                                  (hwGrade.value === 5 ? 'bg-green-100 text-green-700' : hwGrade.value === 4 ? 'bg-blue-100 text-blue-700' : hwGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                  : 'bg-gray-50 text-gray-300 hover:bg-gray-100 border-2 border-dashed border-gray-300'}`}
                                title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                              >
                                {hwGrade?.value || ''}
                              </button>
                            );
                          })()}
                        </td>
                      )}

                      {cols.filter(c => c.type !== 'homework').map(c => {
                        const g = getGrade(s.id, lessonPageDate, c.id, lessonPageLessonNum);
                        const att = attendance.find(a => a.studentId === s.id && a.date === lessonPageDate && a.subject === selectedSubject);
                        const isBlocked = !!att;
                        return (
                          <td key={c.id} className="px-1 py-2 text-center border-r border-gray-100">
                            <button
                              onClick={e => {
                                if (!isBlocked) {
                                  setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: s.id, date: lessonPageDate, columnId: c.id, lessonNumber: lessonPageLessonNum });
                                }
                              }}
                              disabled={isBlocked}
                              className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${g ?
                                (g.value === 5 ? 'bg-green-100 text-green-700' : g.value === 4 ? 'bg-blue-100 text-blue-700' : g.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                : 'bg-gray-50 text-gray-300 hover:bg-gray-100 border-2 border-dashed border-gray-300'}`}
                              title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                            >
                              {g?.value || ''}
                            </button>
                          </td>
                        );
                      })}

                      <td className="px-2 py-2 text-center border-r border-gray-100 font-bold text-gray-700">
                        {s.avg > 0 ? s.avg.toFixed(1) : '—'}
                      </td>
                      <td className="px-2 py-2 text-center border-r border-gray-100">
                        {s.trend === 1 && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                        {s.trend === -1 && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                        {s.trend === 0 && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {(s.daysSinceLastGrade >= 14 || s.avg === 0) && allSlots.length > 0 && (
                          <span title={s.daysSinceLastGrade >= 999 ? 'Ни разу не спрашивали' : `Не спрашивали ${s.daysSinceLastGrade} дн.`}>
                            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {gradePickerState && (
          <GradePickerPortal
            anchorRect={gradePickerState.rect}
            currentGrade={getGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber)?.value}
            onSelect={v => { setGrade(gradePickerState.studentId, gradePickerState.date, v, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
            onDelete={() => { deleteGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
            onClose={() => setGradePickerState(null)}
          />
        )}
      </div>
    );
  }

  // ==================== MAIN JOURNAL VIEW ====================
  return (
    <div className="animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['grades', 'topics', 'attendance'] as const).map(tab => (
              <button key={tab} onClick={() => setJournalTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${journalTab === tab ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab === 'grades' ? 'Оценки' : tab === 'topics' ? 'Темы и ДЗ' : 'Посещаемость'}
              </button>
            ))}
          </div>
          {journalTab === 'grades' && (
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Settings only for grades tab */}
      {showSettings && journalTab === 'grades' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 animate-fadeIn">
          <h4 className="font-medium text-gray-900 mb-3">Настройки журнала</h4>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-all ${showTrend ? 'bg-primary-600' : 'bg-gray-300'} relative`}
                onClick={() => setShowTrend(!showTrend)}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${showTrend ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">Тренд</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-all ${showNotAsked ? 'bg-primary-600' : 'bg-gray-300'} relative`}
                onClick={() => setShowNotAsked(!showNotAsked)}>
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${showNotAsked ? 'left-[18px]' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-gray-700">Давно не спрашивали</span>
            </label>
          </div>
        </div>
      )}

      {/* GRADES TAB */}
      {journalTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Month row */}
                {monthGroups.length > 0 && (
                  <tr className="bg-amber-50">
                    <th className="sticky left-0 z-20 bg-amber-50 w-[48px] min-w-[48px] border-b border-r border-amber-200" />
                    <th className="sticky left-[48px] z-20 bg-amber-50 min-w-[140px] border-b border-r border-amber-200" />
                    {monthGroups.map((mg, i) => {
                      const totalCols = mg.slots.reduce((sum: number, sl) => sum + 1 + getColumnsForSlot(sl.date, sl.lessonNumber).length, 0);
                      return (
                        <th key={i} colSpan={totalCols} className="px-2 py-2 text-center font-semibold text-amber-800 border-b border-r border-amber-200 text-xs uppercase">
                          {mg.month}
                        </th>
                      );
                    })}
                    <th className="px-3 py-2 border-b border-amber-200" />
                    {showTrend && <th className="border-b border-amber-200" />}
                    {showNotAsked && <th className="border-b border-amber-200" />}
                  </tr>
                )}
                {/* Date + lesson number row */}
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-20 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-500 border-b border-r border-gray-200 w-[48px] min-w-[48px]">№</th>
                  <th className="sticky left-[48px] z-20 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-r border-gray-200 min-w-[140px]">ФИ</th>
                  {allSlots.map(sl => {
                    const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
                    const totalCols = 1 + cols.length;
                    const lt = getLessonType(sl.date, sl.lessonNumber);
                    const ltType = lt ? customLessonTypes.find(c => c.value === lt.type) : null;
                    // Count how many slots share same date
                    const slotsOnDate = allSlots.filter(s => s.date === sl.date);
                    const showLessonNum = slotsOnDate.length > 1;
                    return (
                      <th key={sl.key} colSpan={totalCols} className="px-1 py-1 text-center border-b border-r border-gray-200 min-w-[44px] relative">
                        <button onClick={(e) => {
                          if (popoverDate === sl.key) {
                            setPopoverDate(null);
                            setPopoverRect(null);
                          } else {
                            setPopoverDate(sl.key);
                            setPopoverRect(e.currentTarget.getBoundingClientRect());
                          }
                        }}
                          className="text-xs font-medium text-gray-600 hover:text-primary-600 transition-colors">
                          {parseInt(sl.date.split('-')[2])}
                          <ChevronDown className={`w-3 h-3 inline ml-0.5 transition-transform ${popoverDate === sl.key ? 'rotate-180' : ''}`} />
                        </button>
                        {showLessonNum && (
                          <div className="text-[9px] font-bold text-primary-600 bg-primary-50 rounded px-1 mt-0.5">
                            Ур. {sl.lessonNumber}
                          </div>
                        )}
                        {ltType && (
                          <div className={`text-[9px] font-bold rounded px-1 mt-0.5 ${ltType.color}`}>{ltType.short}</div>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[56px]">Ср.</th>
                  {showTrend && <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 w-10">↕</th>}
                  {showNotAsked && <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 w-10">⚠</th>}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, idx) => {
                  const avg = getStudentAvg(student.id);
                  const trend = getStudentTrend(student.id);
                  const lastDate = getLastGradeDate(student.id);
                  const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : 999;

                  return (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-center text-xs text-gray-500 border-r border-gray-200 w-[48px]">{idx + 1}</td>
                      <td className="sticky left-[48px] z-10 bg-white px-3 py-1.5 font-medium text-gray-900 text-xs border-r border-gray-200 whitespace-nowrap">{student.lastName} {student.firstName}</td>
                      {allSlots.map(sl => {
                        const cols = getColumnsForSlot(sl.date, sl.lessonNumber);
                        const mainGrade = getGrade(student.id, sl.date, undefined, sl.lessonNumber);
                        const att = getAttendanceMark(student.id, sl.date);
                        const at = att ? ATTENDANCE_TYPES.find(a => a.value === att.type) : null;
                        // Если есть посещаемость — показываем её на всю клетку, иначе оценку
                        const showAttendance = !!att;
                        // Блокируем кнопку если есть посещаемость (нельзя ставить оценку)
                        const isBlocked = showAttendance;
                        return (
                          <React.Fragment key={sl.key}>
                            <td className="px-0.5 py-0.5 text-center border-r border-gray-100">
                              <button 
                                onClick={e => {
                                  if (!isBlocked) {
                                    setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: student.id, date: sl.date, lessonNumber: sl.lessonNumber });
                                  }
                                }}
                                disabled={isBlocked}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${showAttendance ? `${at?.bgColor} ${at?.color}` : mainGrade ?
                                  (mainGrade.value === 5 ? 'bg-green-100 text-green-700' : mainGrade.value === 4 ? 'bg-blue-100 text-blue-700' : mainGrade.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                  : 'hover:bg-gray-100 text-gray-300 border-2 border-dashed border-gray-300'}`}
                                title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                              >
                                {showAttendance ? att?.type : (mainGrade?.value || '')}
                              </button>
                            </td>
                            {cols.map(c => {
                              const g = getGrade(student.id, sl.date, c.id, sl.lessonNumber);
                              return (
                                <td key={c.id} className="px-0.5 py-0.5 text-center border-r border-gray-100">
                                  <button 
                                    onClick={e => {
                                      if (!isBlocked) {
                                        setGradePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: student.id, date: sl.date, columnId: c.id, lessonNumber: sl.lessonNumber });
                                      }
                                    }}
                                    disabled={isBlocked}
                                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isBlocked ? 'cursor-not-allowed opacity-70' : ''} ${g ?
                                      (g.value === 5 ? 'bg-green-100 text-green-700' : g.value === 4 ? 'bg-blue-100 text-blue-700' : g.value === 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                      : 'hover:bg-gray-100 text-gray-300 border-2 border-dashed border-gray-300'}`}
                                    title={isBlocked ? 'Нельзя поставить оценку при отсутствии' : ''}
                                  >
                                    {g?.value || ''}
                                  </button>
                                </td>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center border-gray-200">
                        {avg > 0 ? (
                          <span className={`font-bold text-sm ${avg >= 4.5 ? 'text-green-600' : avg >= 3.5 ? 'text-blue-600' : avg >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avg.toFixed(1)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      {showTrend && (
                        <td className="px-2 py-1.5 text-center">
                          {trend === 1 && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                          {trend === -1 && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                        </td>
                      )}
                      {showNotAsked && (
                        <td className="px-2 py-1.5 text-center">
                          {allDates.length > 0 && (daysSince >= 14 || grades.filter(g => g.studentId === student.id && g.subject === selectedSubject && lessons.some(l => l.date === g.date && l.subject === selectedSubject)).length === 0) && (
                            <span title={daysSince >= 999 ? 'Ни разу не спрашивали' : `Не спрашивали ${daysSince} дн.`}>
                              <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOPICS TAB */}
      {journalTab === 'topics' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
                <th className="px-3 py-2 text-left w-10">№</th>
                <th className="px-3 py-2 text-left w-28">Дата</th>
                <th className="px-3 py-2 text-left w-28">Тип урока</th>
                <th className="px-3 py-2 text-left">Тема урока</th>
                <th className="px-3 py-2 text-left">Домашнее задание</th>
                <th className="px-3 py-2 text-center w-16">Пров. ДЗ</th>
                <th className="px-3 py-2 text-left w-40">Тест</th>
              </tr>
            </thead>
            <tbody>
              {allSlots.map((sl, idx) => {
                // ONLY exact match — no fallback to prevent sharing between lessons on same date
                const entry = diaryEntries && Array.isArray(diaryEntries) 
                  ? diaryEntries.find(e => e.date === sl.date && e.subject === selectedSubject && e.lessonNumber === sl.lessonNumber)
                  : null;
                const lt = getLessonType(sl.date, sl.lessonNumber);
                const testObj = entry?.testId && tests && Array.isArray(tests) 
                  ? tests.find(t => t.id === entry.testId) 
                  : null;
                const slotsOnDate = allSlots.filter(s => s.date === sl.date);

                return (
                  <tr key={sl.key} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">
                      {parseInt(sl.date.split('-')[2])} {MONTH_NAMES_GEN[parseInt(sl.date.split('-')[1]) - 1]?.slice(0, 3)}
                      {slotsOnDate.length > 1 && <span className="text-primary-600 text-[10px] ml-1">(Ур.{sl.lessonNumber})</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select value={lt?.type || ''} onChange={e => {
                        setLessonTypes(prev => {
                          const existing = prev.find(l => l.date === sl.date && l.subject === selectedSubject && (l.lessonNumber === sl.lessonNumber || (!l.lessonNumber && !sl.lessonNumber)));
                          if (existing) return prev.map(l => l.id === existing.id ? { ...l, type: e.target.value, lessonNumber: sl.lessonNumber } : l);
                          return [...prev, { id: `lt${Date.now()}`, date: sl.date, subject: selectedSubject, type: e.target.value, lessonNumber: sl.lessonNumber }];
                        });
                      }} className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">—</option>
                        {customLessonTypes && Array.isArray(customLessonTypes) && customLessonTypes.map(clt => <option key={clt.id} value={clt.value}>{clt.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={entry?.topic || ''} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, topic: e.target.value } : de));
                        }
                      }} placeholder="Тема..." className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={entry?.homework || ''} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, homework: e.target.value } : de));
                        }
                      }} placeholder="ДЗ..." className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={entry?.checkHomework || false} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, checkHomework: e.target.checked } : de));
                          if (e.target.checked) {
                            const hasCol = journalColumns.some(c => c.date === sl.date && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber));
                            if (!hasCol) setJournalColumns(prev => [...prev, { id: `jc${Date.now()}`, date: sl.date, subject: selectedSubject, lessonNumber: sl.lessonNumber, type: 'homework' }]);
                          } else {
                            setJournalColumns(prev => prev.filter(c => !(c.date === sl.date && c.subject === selectedSubject && c.type === 'homework' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber))));
                          }
                        }
                      }} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                    </td>
                    <td className="px-3 py-2">
                      <select value={entry?.testId || ''} onChange={e => {
                        const ent = getOrCreateDiaryEntry(sl.date, sl.lessonNumber);
                        if (ent) {
                          const prevTestId = ent.testId;
                          setDiaryEntries(prev => prev.map(de => de.id === ent.id ? { ...de, testId: e.target.value || undefined, testType: e.target.value ? 'real' as const : undefined } : de));
                          
                          // При назначении теста создаем колонку, при удалении - удаляем
                          if (e.target.value && !prevTestId) {
                            const hasCol = journalColumns.some(c => c.date === sl.date && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber));
                            if (!hasCol) {
                              const newCol = { id: `jc${Date.now()}`, date: sl.date, subject: selectedSubject, lessonNumber: sl.lessonNumber, type: 'test' };
                              setJournalColumns(prev => [...prev, newCol]);
                            }
                          } else if (!e.target.value && prevTestId) {
                            // Удаляем колонку теста и связанные оценки
                            const testCol = journalColumns.find(c => c.date === sl.date && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber));
                            if (testCol && setGrades) {
                              setGrades(prev => prev.filter(g => !(g.date === sl.date && g.subject === selectedSubject && g.columnId === testCol.id)));
                            }
                            setJournalColumns(prev => prev.filter(c => !(c.date === sl.date && c.subject === selectedSubject && c.type === 'test' && (c.lessonNumber === sl.lessonNumber || !c.lessonNumber))));
                          }
                        }
                      }} className="w-full px-2 py-1.5 text-xs border-2 border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500">
                        <option value="">—</option>
                        {tests && Array.isArray(tests) && tests.filter(t => t.subject === selectedSubject).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {allDates.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Нет дат. Добавьте уроки в расписание.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {journalTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
            <div className="flex gap-2 text-xs">
              {ATTENDANCE_TYPES.map(at => (
                <span key={at.value} className={`px-2 py-1 rounded-md font-bold ${at.bgColor} ${at.color}`}>
                  {at.short} — {at.label}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {monthGroups.length > 0 && (
                  <tr className="bg-amber-50">
                    <th className="sticky left-0 z-20 bg-amber-50 w-[48px] border-b border-r border-amber-200" />
                    <th className="sticky left-[48px] z-20 bg-amber-50 min-w-[140px] border-b border-r border-amber-200" />
                    {monthGroups.map((mg, i) => (
                      <th key={i} colSpan={mg.slots.length} className="px-2 py-2 text-center font-semibold text-amber-800 border-b border-r border-amber-200 text-xs uppercase">{mg.month}</th>
                    ))}
                    <th className="border-b border-amber-200" />
                  </tr>
                )}
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-20 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-500 border-b border-r border-gray-200 w-[48px]">№</th>
                  <th className="sticky left-[48px] z-20 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-r border-gray-200 min-w-[140px]">ФИ</th>
                  {allSlots.map(sl => {
                    const slotsOnDate = allSlots.filter(s => s.date === sl.date);
                    return (
                      <th key={sl.key} className="px-1 py-2 text-center text-xs font-medium text-gray-600 border-b border-r border-gray-200 min-w-[44px]">
                        <div>{parseInt(sl.date.split('-')[2])}</div>
                        {slotsOnDate.length > 1 && <div className="text-[9px] text-primary-600">Ур.{sl.lessonNumber}</div>}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200 min-w-[100px]">Итого</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, idx) => {
                  const studentAtt = attendance.filter(a => a.studentId === student.id && a.subject === selectedSubject);
                  const counts = { 'Н': 0, 'УП': 0, 'Б': 0, 'ОП': 0 };
                  studentAtt.forEach(a => { counts[a.type]++; });
                  return (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-center text-xs text-gray-500 border-r border-gray-200">{idx + 1}</td>
                      <td className="sticky left-[48px] z-10 bg-white px-3 py-1.5 font-medium text-gray-900 text-xs border-r border-gray-200 whitespace-nowrap">{student.lastName} {student.firstName}</td>
                      {allSlots.map(sl => {
                        const mark = getAttendanceMark(student.id, sl.date);
                        const at = mark ? ATTENDANCE_TYPES.find(a => a.value === mark.type) : null;
                        return (
                          <td key={sl.key} className="px-0.5 py-0.5 text-center border-r border-gray-100">
                            <button onClick={e => setAttendancePickerState({ rect: e.currentTarget.getBoundingClientRect(), studentId: student.id, date: sl.date })}
                              className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all ${at ? `${at.bgColor} ${at.color}` : 'hover:bg-gray-100 text-gray-300 border-2 border-dashed border-gray-300'}`}>
                              {mark?.type || ''}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex gap-1 justify-center">
                          {Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => {
                            const at = ATTENDANCE_TYPES.find(a => a.value === k);
                            return <span key={k} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${at?.bgColor} ${at?.color}`}>{k}:{v}</span>;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Picker */}
      {gradePickerState && (
        <GradePickerPortal
          anchorRect={gradePickerState.rect}
          currentGrade={getGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber)?.value}
          onSelect={v => { setGrade(gradePickerState.studentId, gradePickerState.date, v, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
          onDelete={() => { deleteGrade(gradePickerState.studentId, gradePickerState.date, gradePickerState.columnId, gradePickerState.lessonNumber); setGradePickerState(null); }}
          onClose={() => setGradePickerState(null)}
        />
      )}

      {/* Date Popover Portal */}
      {popoverDate && popoverRect && (() => {
        // popoverDate is now a slot key like "2025-02-08_3"
        const parts = popoverDate.split('_');
        if (parts.length < 2) return null;
        const [pDate, pLessonStr] = parts;
        const pLesson = parseInt(pLessonStr) || 1;
        return createPortal(
          <div className="fixed inset-0 z-[9999]" onClick={() => { setPopoverDate(null); setPopoverRect(null); }}>
            <div ref={popoverRef}
              className="fixed w-52 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 text-left animate-scaleIn"
              style={{
                top: Math.min(popoverRect.bottom + 4, window.innerHeight - 220),
                left: Math.max(8, Math.min(popoverRect.left + popoverRect.width / 2 - 104, window.innerWidth - 220)),
              }}
              onClick={e => e.stopPropagation()}>
              <div className="text-xs font-bold text-gray-900 mb-1">
                {parseInt(pDate.split('-')[2])} {MONTH_NAMES_GEN[parseInt(pDate.split('-')[1]) - 1]}
              </div>
              <div className="text-[10px] text-primary-600 font-medium mb-2">Урок №{pLesson}</div>
              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 text-xs text-gray-600">Основная</div>
                {getColumnsForSlot(pDate, pLesson).map(c => (
                  <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-blue-50 text-xs text-blue-700 group">
                    <span>{c.type === 'homework' ? 'ДЗ' : c.type === 'test' ? 'Тест' : 'Доп.'}</span>
                    <button onClick={() => removeColumn(c.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => { addColumn(pDate, pLesson); }} className="w-full text-xs text-primary-600 hover:bg-primary-50 rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Добавить колонку
              </button>
              <hr className="my-2" />
              <button onClick={(e) => {
                e.stopPropagation();
                console.log('Opening lesson page:', pDate, pLesson);
                setLessonPageDate(pDate);
                setLessonPageLessonNum(pLesson);
                setPopoverDate(null);
                setPopoverRect(null);
              }} className="w-full text-xs text-gray-700 hover:bg-gray-50 rounded-lg py-1.5 transition-colors">
                Страница урока →
              </button>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Attendance Picker */}
      {attendancePickerState && (
        <AttendancePickerPortal
          anchorRect={attendancePickerState.rect}
          currentType={getAttendanceMark(attendancePickerState.studentId, attendancePickerState.date)?.type}
          onSelect={type => { setAttendanceMark(attendancePickerState.studentId, attendancePickerState.date, type); setAttendancePickerState(null); }}
          onDelete={() => { deleteAttendanceMark(attendancePickerState.studentId, attendancePickerState.date); setAttendancePickerState(null); }}
          onClose={() => setAttendancePickerState(null)}
        />
      )}
    </div>
  );
};

// ==================== TEST RESULTS SECTION ====================
const TestResultsSection: React.FC<{
  test: Test; date: string; subject: string; students: Student[];
  testAttempts: any[]; testRetakes: any[]; setTestRetakes: any; setTestAttempts: any;
  grades: any[]; setGrades: any; journalColumns: any[]; lessonNumber: number;
  testAssignments: any[]; setTestAssignments: any;
}> = ({ test, date, subject, students, testAttempts, testRetakes, setTestRetakes, setTestAttempts, grades, setGrades, journalColumns, lessonNumber, testAssignments, setTestAssignments }) => {
  const [showResults, setShowResults] = useState(false);
  const [viewingAttempt, setViewingAttempt] = useState<any>(null);
  const [manualGrading, setManualGrading] = useState<Record<string, boolean>>({});

  // Защита от undefined, если данные не пришли из контекста
  const safeAttempts = testAttempts || [];
  const safeRetakes = testRetakes || [];
  const safeAssignments = testAssignments || [];

  // Получить назначение теста для ученика
  // Логика: если записи нет в базе - ученик НАЗНАЧЕН (по умолчанию)
  // Если запись есть и assigned = false - ученик ОСВОБОЖДЁН
  // Если запись есть и assigned = true - ученик НАЗНАЧЕН с определённым вариантом
  const getAssignment = (studentId: string) => {
    const found = safeAssignments.find((a: any) =>
      a.studentId === studentId &&
      a.testId === test.id &&
      a.date === date &&
      a.subject === subject &&
      a.lessonNumber === lessonNumber
    );
    // Если записи нет - ученик назначен по умолчанию
    if (!found) {
      return { assigned: true, variantId: undefined };
    }
    return found;
  };

  // Создать или обновить назначение теста
  const setAssignment = (studentId: string, updates: { assigned?: boolean; variantId?: string }) => {
    console.log('setAssignment called:', { studentId, updates, testId: test.id, date, subject, lessonNumber });

    setTestAssignments((prev: any[]) => {
      console.log('prev assignments count:', prev.length);
      
      const existing = prev.find((a: any) =>
        a.studentId === studentId &&
        a.testId === test.id &&
        a.date === date &&
        a.subject === subject &&
        a.lessonNumber === lessonNumber
      );

      console.log('Found existing assignment:', existing);

      // Если хотим освободить (assigned = false)
      if (updates.assigned === false) {
        if (existing) {
          // Если назначение существует - обновляем его на assigned: false
          console.log('Marking student as exempt (assigned = false)');
          return prev.map((a: any) => a.id === existing.id ? { ...a, assigned: false } : a);
        } else {
          // Если назначения нет - создаём запись с assigned: false
          console.log('Creating exemption record (assigned = false)');
          const exemption = {
            id: `ta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            studentId,
            testId: test.id,
            date,
            subject,
            lessonNumber,
            assigned: false,
          };
          return [...prev, exemption];
        }
      }

      // Если назначаем (assigned = true) и назначение существует
      if (existing && updates.assigned !== false) {
        console.log('Updating assignment (assigned = true)');
        // Удаляем запись если она была с assigned: false
        if (existing.assigned === false && !updates.variantId) {
          return prev.filter((a: any) => a.id !== existing.id);
        }
        // Иначе обновляем
        return prev.map((a: any) => a.id === existing.id ? { ...a, ...updates, assigned: true } : a);
      }

      // Если назначаем и назначение не существует, но указан вариант
      if (!existing && updates.variantId) {
        console.log('Creating assignment with variant');
        const newAssignment = {
          id: `ta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          testId: test.id,
          date,
          subject,
          lessonNumber,
          assigned: true,
          variantId: updates.variantId,
        };
        return [...prev, newAssignment];
      }

      // Если назначаем без варианта - просто удаляем запись (возвращаемся к дефолту)
      if (!existing && updates.assigned !== false && !updates.variantId) {
        console.log('Removing record (back to default assigned)');
        return prev;
      }

      return prev;
    });
  };

  // Найти колонку теста для этого урока
  const testColumn = journalColumns?.find((c: any) => c.date === date && c.subject === subject && c.type === 'test' && (c.lessonNumber === lessonNumber || (!c.lessonNumber && lessonNumber === 0)));

  // Пересчитать результаты на основе вручную отмеченных ответов
  const recalculateResults = () => {
    if (!viewingAttempt || !setTestAttempts) return;

    const questions = getAttemptQuestions(viewingAttempt.variantId);
    const updatedAnswers = (viewingAttempt.answers || []).map((ans: any) => ({
      ...ans,
      correct: manualGrading[ans.questionId] ?? ans.correct,
    }));

    const correctCount = updatedAnswers.filter((a: any) => a.correct).length;
    const totalCount = questions.length;
    const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // Найти оценку по шкале
    let grade = 0;
    for (const gs of test.gradingScale) {
      if (percent >= gs.minPercent) {
        grade = gs.grade;
        break;
      }
    }

    const updatedAttempt = {
      ...viewingAttempt,
      answers: updatedAnswers,
      correct: correctCount,
      total: totalCount,
      percent,
      grade,
      manuallyGraded: true,
    };

    // Сохранить изменения в попытках теста
    setTestAttempts((prev: any[]) => {
      const idx = prev.findIndex((a: any) => a.id === viewingAttempt.id);
      if (idx >= 0) {
        const newAttempts = [...prev];
        newAttempts[idx] = updatedAttempt;
        return newAttempts;
      }
      return prev;
    });

    // Обновить оценку в колонке теста
    if (testColumn && setGrades && viewingAttempt.studentId) {
      setGrades((prev: any[]) => {
        const existing = prev.find((g: any) =>
          g.studentId === viewingAttempt.studentId &&
          g.date === date &&
          g.subject === subject &&
          g.columnId === testColumn.id &&
          g.lessonNumber === lessonNumber
        );
        if (existing) {
          return prev.map((g: any) => g.id === existing.id ? { ...g, value: grade } : g);
        }
        return [
          ...prev,
          {
            id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
            studentId: viewingAttempt.studentId,
            subject: subject,
            value: grade,
            date: date,
            lessonNumber: lessonNumber,
            columnId: testColumn.id
          }
        ];
      });
    }

    setViewingAttempt(updatedAttempt);
  };

  // Сбросить на автоматическую проверку
  const resetToAutoGrading = () => {
    if (!viewingAttempt || !setTestAttempts) return;

    const questions = getAttemptQuestions(viewingAttempt.variantId);

    // Пересчитываем правильность для каждого вопроса
    const autoGradedAnswers = questions.map((q: any) => {
      const existingAns = viewingAttempt.answers?.find((a: any) => a.questionId === q.id);
      const userAnswer = existingAns?.answer;

      let correct = false;
      if (q.type === 'text') {
        // Для текстовых ответов - точное совпадение (игнорируя регистр)
        correct = q.correctAnswer && userAnswer &&
          q.correctAnswer.toLowerCase().trim() === (userAnswer as string).toLowerCase().trim();
      } else if (q.type === 'single') {
        const selectedOpt = q.options.find((o: any) => o.id === userAnswer);
        correct = selectedOpt?.correct ?? false;
      } else if (q.type === 'multiple') {
        const selectedOpts = q.options.filter((o: any) => (userAnswer || []).includes(o.id));
        const correctOpts = q.options.filter((o: any) => o.correct);
        const allCorrect = selectedOpts.length === correctOpts.length &&
          selectedOpts.every((o: any) => o.correct);
        correct = allCorrect;
      }

      return {
        questionId: q.id,
        answer: userAnswer || '',
        correct
      };
    });

    const correctCount = autoGradedAnswers.filter((a: any) => a.correct).length;
    const totalCount = questions.length;
    const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    let grade = 0;
    for (const gs of test.gradingScale) {
      if (percent >= gs.minPercent) {
        grade = gs.grade;
        break;
      }
    }

    const updatedAttempt = {
      ...viewingAttempt,
      answers: autoGradedAnswers,
      correct: correctCount,
      total: totalCount,
      percent,
      grade,
      manuallyGraded: false,
    };

    setTestAttempts((prev: any[]) => {
      const idx = prev.findIndex((a: any) => a.id === viewingAttempt.id);
      if (idx >= 0) {
        const newAttempts = [...prev];
        newAttempts[idx] = updatedAttempt;
        return newAttempts;
      }
      return prev;
    });

    setViewingAttempt(updatedAttempt);
    setManualGrading({});
  };

  // Переключить правильность ответа
  const toggleAnswerCorrect = (questionId: string) => {
    setManualGrading(prev => ({
      ...prev,
      [questionId]: prev[questionId] === undefined
        ? !(viewingAttempt.answers?.find((a: any) => a.questionId === questionId)?.correct ?? false)
        : !prev[questionId],
    }));
  };

  // Получить вопросы по variantId
  const getAttemptQuestions = (variantId?: string) => {
    if (test.useVariants && variantId && test.variants) {
      const variant = test.variants.find(v => v.id === variantId);
      return variant?.questions || test.questions;
    }
    return test.questions;
  };

  // Получить ответ для вопроса по его ID (с учётом вариантов)
  const getAnswerForQuestion = (questionId: string, viewingAttempt: any, questionIndex?: number) => {
    // Сначала ищем по точному совпадению ID вопроса
    const ans = viewingAttempt.answers?.find((a: any) => a.questionId === questionId);

    if (ans) {
      console.log('Found answer by questionId:', { questionId, answer: ans.answer, correct: ans.correct });
      return ans;
    }

    // Если ответ не найден по ID, попробуем найти по индексу (для старых данных)
    if (questionIndex !== undefined && viewingAttempt.answers && viewingAttempt.answers[questionIndex]) {
      console.log('Answer NOT found by questionId, using index fallback:', { questionId, questionIndex });
      return viewingAttempt.answers[questionIndex];
    }

    console.log('Answer NOT found for questionId:', questionId);
    console.log('Available answers:', viewingAttempt.answers?.map((a: any) => ({ questionId: a.questionId, answer: a.answer })));
    return null;
  };

  // Получить название варианта
  const getVariantName = (variantId?: string) => {
    if (!variantId || !test.useVariants || !test.variants) return null;
    const variant = test.variants.find(v => v.id === variantId);
    return variant?.name || null;
  };

  const studentResults = students.map(s => {
    const allAttempts = safeAttempts.filter((a: any) => a.studentId === s.id && a.testId === test.id && a.date === date)
      .sort((a: any, b: any) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      });
    const latest = allAttempts[0];
    const hasRetake = safeRetakes.some((r: any) => r.studentId === s.id && r.testId === test.id);
    const assignment = getAssignment(s.id);
    return { student: s, latest, allAttempts, hasRetake, attemptCount: allAttempts.length, assignment };
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6">
      <button onClick={() => setShowResults(!showResults)}
        className="flex items-center gap-2 px-4 py-3 bg-violet-50 text-violet-700 rounded-xl font-medium hover:bg-violet-100 transition-colors w-full border border-violet-200">
        <FileText className="w-5 h-5" />
        Результаты теста: {test.title}
        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showResults ? 'rotate-90' : ''}`} />
      </button>

      {showResults && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 overflow-hidden animate-fadeIn">
          {viewingAttempt ? (
            // Detailed attempt view
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => {
                  setViewingAttempt(null);
                  setManualGrading({});
                }} className="flex items-center gap-1 text-sm text-primary-600">
                  <ArrowLeft className="w-4 h-4" /> Назад к списку
                </button>
                <div className="flex items-center gap-2">
                  {viewingAttempt.manuallyGraded && (
                    <button onClick={resetToAutoGrading}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Сбросить на авто
                    </button>
                  )}
                  <button onClick={recalculateResults}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Сохранить проверку
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Баллы</div>
                  <div className="font-bold text-gray-900">{viewingAttempt.correct ?? 0}/{viewingAttempt.total ?? 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Процент</div>
                  <div className="font-bold text-gray-900">{viewingAttempt.percent ?? 0}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Оценка</div>
                  <div className={`font-bold text-lg ${viewingAttempt.grade >= 4 ? 'text-green-600' : viewingAttempt.grade === 3 ? 'text-yellow-600' : 'text-red-600'}`}>{viewingAttempt.grade ?? 0}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Время</div>
                  <div className="font-bold text-gray-900">{viewingAttempt.timeSpent ? formatTime(viewingAttempt.timeSpent) : '—'}</div>
                </div>
              </div>
              {getVariantName(viewingAttempt.variantId) && (
                <div className="bg-amber-50 rounded-lg p-2 text-center mb-4">
                  <span className="text-xs text-gray-600">Вариант: </span>
                  <span className="text-sm font-semibold text-amber-700">{getVariantName(viewingAttempt.variantId)}</span>
                </div>
              )}
              {viewingAttempt.manuallyGraded && (
                <div className="bg-blue-50 rounded-lg p-2 text-center mb-4">
                  <span className="text-xs text-blue-700">✏️ Ручная проверка - нажмите "Сохранить проверку" для фиксации изменений</span>
                </div>
              )}

              <h4 className="font-medium text-gray-900 mb-3">Ответы по вопросам:</h4>
              <div className="space-y-3">
                {getAttemptQuestions(viewingAttempt.variantId).map((q, qi) => {
                  const ans = getAnswerForQuestion(q.id, viewingAttempt, qi);
                  const currentCorrect = manualGrading[q.id] ?? ans?.correct ?? false;
                  const isModified = manualGrading[q.id] !== undefined;

                  return (
                    <div key={q.id} className={`p-3 rounded-xl border transition-colors ${currentCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} ${isModified ? 'ring-2 ring-blue-400' : ''}`}>
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleAnswerCorrect(q.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                            currentCorrect ? 'bg-green-200 text-green-800 cursor-pointer' : 'bg-red-200 text-red-800 cursor-pointer'
                          }`}
                          title="Нажмите, чтобы изменить правильность"
                        >
                          {currentCorrect ? '✓' : '✗'}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{q.text}</p>
                          {q.formula && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center">
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
                          {q.image && <img src={q.image} alt="" className="mt-2 max-w-full rounded-lg max-h-48 object-contain" />}
                          {q.type === 'text' ? (
                            <div className="mt-1 text-xs">
                              <span className="text-gray-500">Ответ: </span>
                              <span className={currentCorrect ? 'text-green-700' : 'text-red-700'}>{ans?.answer || '—'}</span>
                              {!currentCorrect && q.correctAnswer && <span className="text-green-700 ml-2">(Верно: {q.correctAnswer})</span>}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs">
                              {q.options && q.options.map(opt => {
                                const selected = Array.isArray(ans?.answer) ? ans.answer.includes(opt.id) : ans?.answer === opt.id;
                                return (
                                  <div key={opt.id} className={`flex items-center gap-1 ${selected ? (opt.correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium') : opt.correct ? 'text-green-600' : 'text-gray-500'}`}>
                                    {selected ? (opt.correct ? '✓' : '✗') : opt.correct ? '○' : '·'} {opt.text}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {isModified && (
                            <div className="mt-1 text-xs text-blue-600 font-medium">
                              ← Изменено (нажмите для отмены)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Student list
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 border-b border-gray-200">
                  <th className="px-3 py-2 text-left">№</th>
                  <th className="px-3 py-2 text-left">ФИ</th>
                  <th className="px-3 py-2 text-center">Назначен</th>
                  {test.useVariants && <th className="px-3 py-2 text-center">Вариант</th>}
                  <th className="px-3 py-2 text-center">Статус</th>
                  <th className="px-3 py-2 text-center">Результат</th>
                  <th className="px-3 py-2 text-center">Оценка</th>
                  <th className="px-3 py-2 text-center">Время</th>
                  <th className="px-3 py-2 text-center">Попытки</th>
                  <th className="px-3 py-2 text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((sr, idx) => (
                  <tr key={sr.student.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{sr.student.lastName} {sr.student.firstName}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setAssignment(sr.student.id, { assigned: !sr.assignment?.assigned })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          sr.assignment?.assigned !== false
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {sr.assignment?.assigned !== false ? 'Да' : 'Нет'}
                      </button>
                    </td>
                    {test.useVariants && (
                      <td className="px-3 py-2 text-center">
                        {sr.assignment?.assigned !== false ? (
                          <select
                            value={sr.assignment?.variantId || ''}
                            onChange={(e) => setAssignment(sr.student.id, { variantId: e.target.value || undefined })}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="">—</option>
                            {test.variants?.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-center">
                      {sr.assignment?.assigned === false ? (
                        <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-md">Освобождён</span>
                      ) : sr.latest ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">Сдал</span>
                      ) : sr.hasRetake ? (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">⏳ Ожидает</span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Не сдал</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {sr.latest ? `${sr.latest.correct}/${sr.latest.total} (${sr.latest.percent}%)` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {sr.latest ? (
                        <span className={`font-bold ${sr.latest.grade >= 4 ? 'text-green-600' : sr.latest.grade === 3 ? 'text-yellow-600' : 'text-red-600'}`}>{sr.latest.grade}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">
                      {sr.latest?.timeSpent ? formatTime(sr.latest.timeSpent) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{sr.attemptCount}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {sr.latest && (
                          <button onClick={() => setViewingAttempt(sr.latest)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Подробнее">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {sr.latest && !sr.hasRetake && sr.assignment?.assigned !== false && (
                          <button onClick={() => {
                            if (setTestRetakes && typeof setTestRetakes === 'function') {
                              setTestRetakes((prev: any[]) => [...(prev || []), { studentId: sr.student.id, testId: test.id, date }]);
                            }
                          }}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Дать пересдачу">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {sr.hasRetake && (
                          <button onClick={() => {
                            if (setTestRetakes && typeof setTestRetakes === 'function') {
                              setTestRetakes((prev: any[]) => (prev || []).filter((r: any) => !(r.studentId === sr.student.id && r.testId === test.id)));
                            }
                          }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Отменить">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== TESTS MANAGER ====================
const TestsManager: React.FC = () => {
  const { tests, setTests } = useData();
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const createNewTest = () => {
    const newTest: Test = {
      id: `t${Date.now()}`, title: '', subject: SUBJECTS[0], timeLimit: 0,
      gradingScale: [{ minPercent: 90, grade: 5 }, { minPercent: 70, grade: 4 }, { minPercent: 50, grade: 3 }, { minPercent: 0, grade: 2 }],
      questions: [], variants: [], useVariants: false, createdAt: new Date().toISOString(),
    };
    setEditingTest(newTest);
    setShowEditor(true);
  };

  const startEdit = (test: Test) => {
    setEditingTest({
      ...test,
      questions: test.questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) })),
      variants: test.variants || [],
      useVariants: test.useVariants || false,
    });
    setShowEditor(true);
  };

  const saveTest = (test: Test) => {
    setTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) return prev.map(t => t.id === test.id ? test : t);
      return [...prev, test];
    });
    setShowEditor(false);
    setEditingTest(null);
  };

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
  };

  if (showEditor && editingTest) {
    return <TestEditor test={editingTest} onSave={saveTest} onCancel={() => { setShowEditor(false); setEditingTest(null); }} />;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Тесты</h2>
        <button onClick={createNewTest} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          <Plus className="w-5 h-5" /> Создать тест
        </button>
      </div>
      <div className="grid gap-4">
        {tests.map(test => {
          const hasVariants = test.useVariants && test.variants && test.variants.length > 0;
          return (
            <div key={test.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{test.title || 'Без названия'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {test.subject} · {hasVariants ? `${test.variants.length} вариант${test.variants.length === 1 ? '' : test.variants.length > 1 && test.variants.length < 5 ? 'а' : 'ов'}` : `${test.questions.length} вопросов`} {test.timeLimit > 0 ? `· ${test.timeLimit} мин` : ''}
                  </p>
                  {hasVariants && (
                    <div className="flex gap-1 mt-1">
                      {test.variants.map(v => (
                        <span key={v.id} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                          {v.name}: {v.questions.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingTest(test); setShowEditor(true); }} className="p-2 rounded-lg hover:bg-gray-100">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => deleteTest(test.id)} className="p-2 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
        {tests.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Нет тестов. Создайте первый тест.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TEST EDITOR ====================
const TestEditor: React.FC<{ test: Test; onSave: (t: Test) => void; onCancel: () => void }> = ({ test: initialTest, onSave, onCancel }) => {
  const [test, setTest] = useState<Test>(initialTest);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const addOption = (qId: string) => {
    updateEditingQuestions(
      getEditingQuestions().map(q => q.id === qId ? { ...q, options: [...q.options, { id: `o${Date.now()}`, text: '', correct: false }] } : q)
    );
  };

  const updateOption = (qId: string, oId: string, updates: { text?: string; correct?: boolean }) => {
    updateEditingQuestions(
      getEditingQuestions().map(q => q.id === qId ? {
        ...q, options: q.options.map(o => {
          if (o.id === oId) return { ...o, ...updates };
          if (updates.correct && q.type === 'single') return { ...o, correct: false };
          return o;
        })
      } : q)
    );
  };

  const removeOption = (qId: string, oId: string) => {
    updateEditingQuestions(
      getEditingQuestions().map(q => q.id === qId ? { ...q, options: q.options.filter(o => o.id !== oId) } : q)
    );
  };

  // Variant management functions
  const addVariant = () => {
    const newVariant = {
      id: `v${Date.now()}`,
      name: `Вариант ${(test.variants?.length || 0) + 1}`,
      questions: [],
    };
    setTest(prev => ({ ...prev, variants: [...(prev.variants || []), newVariant] }));
  };

  const updateVariant = (variantId: string, updates: { name?: string; questions?: TestQuestion[] }) => {
    setTest(prev => ({
      ...prev,
      variants: (prev.variants || []).map(v => v.id === variantId ? { ...v, ...updates } : v),
    }));
  };

  const deleteVariant = (variantId: string) => {
    if (editingVariantId === variantId) setEditingVariantId(null);
    setTest(prev => ({ ...prev, variants: (prev.variants || []).filter(v => v.id !== variantId) }));
  };

  const duplicateVariant = (variantId: string) => {
    const variant = (test.variants || []).find(v => v.id === variantId);
    if (!variant) return;
    const newVariant = {
      id: `v${Date.now()}`,
      name: `${variant.name} (копия)`,
      questions: variant.questions.map(q => ({
        ...q,
        id: `q${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        options: q.options.map(o => ({ ...o, id: `o${Date.now()}_${Math.random().toString(36).substr(2, 9)}` })),
      })),
    };
    setTest(prev => ({ ...prev, variants: [...(prev.variants || []), newVariant] }));
  };

  const getEditingQuestions = () => {
    if (!editingVariantId) return test.questions;
    const variant = (test.variants || []).find(v => v.id === editingVariantId);
    return variant?.questions || [];
  };

  const updateEditingQuestions = (questions: TestQuestion[]) => {
    if (editingVariantId) {
      updateVariant(editingVariantId, { questions });
    } else {
      setTest(prev => ({ ...prev, questions }));
    }
  };

  const addQuestion = () => {
    const q: TestQuestion = { id: `q${Date.now()}`, type: 'single', text: '', options: [{ id: `o${Date.now()}a`, text: '', correct: true }, { id: `o${Date.now()}b`, text: '', correct: false }], points: 1 };
    updateEditingQuestions([...getEditingQuestions(), q]);
  };

  const updateQuestion = (qId: string, updates: Partial<TestQuestion>) => {
    updateEditingQuestions(
      getEditingQuestions().map(q => q.id === qId ? { ...q, ...updates } : q)
    );
  };

  const removeQuestion = (qId: string) => {
    updateEditingQuestions(getEditingQuestions().filter(q => q.id !== qId));
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <button onClick={() => onSave(test)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          <Save className="w-4 h-4" /> Сохранить
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input type="text" value={test.title} onChange={e => setTest(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <select value={test.subject} onChange={e => setTest(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Лимит (мин, 0=без)</label>
            <input type="number" value={test.timeLimit} onChange={e => setTest(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Шкала оценок</label>
          <div className="flex flex-wrap gap-2">
            {test.gradingScale.sort((a, b) => b.minPercent - a.minPercent).map((gs, i) => (
              <div key={i} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-500">от</span>
                <input type="number" value={gs.minPercent} onChange={e => {
                  setTest(prev => ({ ...prev, gradingScale: prev.gradingScale.map((g, gi) => gi === i ? { ...g, minPercent: Number(e.target.value) } : g) }));
                }} className="w-12 px-1 py-0.5 text-xs border rounded bg-white text-center" />
                <span className="text-xs text-gray-500">% =</span>
                <span className="text-sm font-bold">{gs.grade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Variants Toggle */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={test.useVariants || false}
              onChange={e => setTest(prev => ({ ...prev, useVariants: e.target.checked }))}
              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
            />
            <span className="font-medium text-gray-900 dark:text-white">Использовать варианты теста</span>
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Ученики будут получать разные варианты вопросов для предотвращения списывания
          </span>
        </div>
      </div>

      {/* Variants Section */}
      {test.useVariants && (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Варианты теста</h3>
          <button onClick={addVariant}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Добавить вариант
          </button>
        </div>

        {(test.variants || []).length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-xl text-center">
            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Нет вариантов</p>
            <p className="text-gray-400 text-xs mt-1">Создайте варианты, чтобы ученики получали разные вопросы</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {(test.variants || []).map(variant => {
              const isEditing = editingVariantId === variant.id;
              return (
                <div key={variant.id} className={`p-4 rounded-xl border-2 transition-all ${
                  isEditing
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isEditing ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {variant.questions.length}
                      </span>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={e => updateVariant(variant.id, { name: e.target.value })}
                        className="font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none px-1 py-0.5"
                      />
                      <span className="text-xs text-gray-500">вопросов</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isEditing ? (
                        <button onClick={() => setEditingVariantId(variant.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Редактировать вопросы варианта">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                      ) : (
                        <button onClick={() => setEditingVariantId(null)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Закрыть редактор">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      <button onClick={() => duplicateVariant(variant.id)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Скопировать вариант">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => deleteVariant(variant.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Удалить вариант">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingVariantId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Редактируете: <span className="font-semibold">{(test.variants || []).find(v => v.id === editingVariantId)?.name}</span>
            </p>
          </div>
        )}
      </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">
          {editingVariantId
            ? `Вопросы варианта "${(test.variants || []).find(v => v.id === editingVariantId)?.name}"`
            : 'Базовые вопросы'}
        </h3>

        {getEditingQuestions().map((q, qi) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Вопрос {qi + 1}</span>
              <div className="flex items-center gap-2">
                <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })}
                  className="px-2 py-1 text-xs border rounded-lg bg-gray-50">
                  <option value="single">Один ответ</option>
                  <option value="multiple">Несколько ответов</option>
                  <option value="text">Текстовый</option>
                </select>
                <button onClick={() => removeQuestion(q.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <QuestionEditor
              value={q.text}
              onChange={(value) => updateQuestion(q.id, { text: value })}
              placeholder="Введите текст вопроса..."
              image={q.image}
              onImageChange={(image) => updateQuestion(q.id, { image })}
              formula={q.formula || ''}
              onFormulaChange={(formula) => updateQuestion(q.id, { formula })}
            />

            {(q.type === 'single' || q.type === 'multiple') && (
              <div className="mt-6 space-y-2">
                {q.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input type={q.type === 'single' ? 'radio' : 'checkbox'} checked={opt.correct}
                      onChange={() => updateOption(q.id, opt.id, { correct: q.type === 'single' ? true : !opt.correct })}
                      className="w-4 h-4" />
                    <input type="text" value={opt.text} onChange={e => updateOption(q.id, opt.id, { text: e.target.value })}
                      placeholder="Вариант ответа..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <button onClick={() => removeOption(q.id, opt.id)} className="p-1 text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addOption(q.id)} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Добавить вариант
                </button>
              </div>
            )}

            {q.type === 'text' && (
              <div className="mt-6">
                <input type="text" value={q.correctAnswer || ''} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}
                  placeholder="Правильный ответ..." className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}
          </div>
        ))}
        <button onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Добавить вопрос
        </button>
      </div>
    </div>
  );
};

// ==================== TRANSLITERATION ====================
const TRANSLIT_MAP: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
  'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
  'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'',
  'э':'e','ю':'yu','я':'ya',
  'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I',
  'Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T',
  'У':'U','Ф':'F','Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'',
  'Э':'E','Ю':'Yu','Я':'Ya',
};

function transliterate(text: string): string {
  return text.split('').map(c => TRANSLIT_MAP[c] ?? c).join('');
}

function generateUsername(lastName: string, firstName: string): string {
  const lastTranslit = transliterate(lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const firstTranslit = transliterate(firstName).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!lastTranslit) return firstTranslit || 'user';
  if (!firstTranslit) return lastTranslit;
  return `${lastTranslit}.${firstTranslit.charAt(0)}`;
}

function generatePassword(length: number = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

// ==================== STUDENTS MANAGER ====================
const StudentsManager: React.FC = () => {
  const { students, setStudents, setGrades, setAttendance, setTestAttempts, setTestRetakes } = useData();
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', password: '' });

  const sorted = useMemo(() =>
    [...students]
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
      .filter(s => `${s.lastName} ${s.firstName}`.toLowerCase().includes(search.toLowerCase())),
    [students, search]
  );

  const openAdd = () => {
    setEditingStudent(null);
    const newPass = generatePassword();
    setFormData({ firstName: '', lastName: '', username: '', password: newPass });
    setShowModal(true);
    setShowPassword(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({ firstName: s.firstName, lastName: s.lastName, username: s.username, password: s.password });
    setShowModal(true);
    setShowPassword(false);
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate username only when adding new student (not editing)
      if (!editingStudent) {
        updated.username = generateUsername(
          field === 'lastName' ? value : prev.lastName,
          field === 'firstName' ? value : prev.firstName
        );
      }
      return updated;
    });
  };

  const regeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }));
    setShowPassword(true);
  };

  const save = () => {
    if (!formData.firstName || !formData.lastName || !formData.username) {
      alert('Заполните имя, фамилию и логин');
      return;
    }
    if (!formData.password) {
      setFormData(prev => ({ ...prev, password: generatePassword() }));
    }
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s));
    } else {
      setStudents(prev => [...prev, { id: `s${Date.now()}`, ...formData }]);
    }
    setShowModal(false);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    // Clean up all related data for deleted student
    setGrades(prev => prev.filter(g => g.studentId !== id));
    setAttendance(prev => prev.filter(a => a.studentId !== id));
    setTestAttempts(prev => prev.filter(a => a.studentId !== id));
    setTestRetakes(prev => prev.filter(r => r.studentId !== id));
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ученики</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          <Plus className="w-5 h-5" /> Добавить
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">ФИО</th>
              <th className="px-4 py-3 text-left">Логин</th>
              <th className="px-4 py-3 text-left">Пароль</th>
              <th className="px-4 py-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.lastName} {s.firstName}</td>
                <td className="px-4 py-3 text-gray-600">{s.username}</td>
                <td className="px-4 py-3 text-gray-600">••••••</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => deleteStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{editingStudent ? 'Редактировать' : 'Добавить ученика'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Фамилия</label>
                <input type="text" value={formData.lastName} onChange={e => handleNameChange('lastName', e.target.value)}
                  placeholder="Иванов" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                <input type="text" value={formData.firstName} onChange={e => handleNameChange('firstName', e.target.value)}
                  placeholder="Артём" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Логин <span className="text-gray-400">(генерируется автоматически)</span></label>
                <input type="text" value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  placeholder="ivanov.a" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Пароль <span className="text-gray-400">(генерируется автоматически)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="Пароль" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={regeneratePassword} className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
                {editingStudent ? 'Сохранить' : 'Добавить'}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                Отмена
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
