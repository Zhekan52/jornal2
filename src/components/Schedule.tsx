import React, { useState } from 'react';
import { useData } from '../context';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Edit2, Trash2, X, Save, Pencil, BookOpen
} from 'lucide-react';
import { type Lesson, DAY_NAMES, DAY_NAMES_SHORT, MONTH_NAMES, MONTH_NAMES_GEN, SUBJECTS, getWeekDates, getMonthDays, formatDate } from '../data';

interface ScheduleProps {
  editable?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
  onOpenLessonPage?: (subject: string, date: string, lessonNumber: number) => void;
}

const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export const Schedule: React.FC<ScheduleProps> = ({ editable = false, onEditModeChange, onOpenLessonPage }) => {
  const { lessons, setLessons, setGrades, setAttendance, setDiaryEntries, setLessonTypes, setJournalColumns, setTestAttempts, setTestRetakes } = useData();
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [modalData, setModalData] = useState({
    subject: '', date: '', lessonNumber: 1,
    startTime: '', endTime: '',
  });
  const [popupDay, setPopupDay] = useState<{ date: Date } | null>(null);

  const weekDates = getWeekDates(currentDate);

  const navigateWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const navigateMonth = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
    setCurrentDate(d);
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getLessonsForDate = (dateStr: string) => {
    return lessons.filter(l => l.date === dateStr).sort((a, b) => a.lessonNumber - b.lessonNumber);
  };

  const openAddModal = (dateStr: string, lessonNumber: number) => {
    setEditingLesson(null);
    setModalData({ subject: SUBJECTS[0], date: dateStr, lessonNumber, startTime: '', endTime: '' });
    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setModalData({
      subject: lesson.subject,
      date: lesson.date,
      lessonNumber: lesson.lessonNumber,
      startTime: lesson.startTime || '',
      endTime: lesson.endTime || '',
    });
    setShowModal(true);
  };

  const saveLesson = () => {
    if (!modalData.subject || !modalData.date) return;
    const lessonData = {
      subject: modalData.subject,
      date: modalData.date,
      lessonNumber: modalData.lessonNumber,
      startTime: modalData.startTime || undefined,
      endTime: modalData.endTime || undefined,
    };
    if (editingLesson) {
      setLessons(prev => prev.map(l => l.id === editingLesson.id ? { ...l, ...lessonData } : l));
    } else {
      const newLesson: Lesson = { id: `l${Date.now()}`, ...lessonData };
      setLessons(prev => [...prev, newLesson]);
    }
    setShowModal(false);
  };

  const deleteLesson = (id: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;

    if (!confirm(`Удалить урок "${lesson.subject}" от ${lesson.date}?\n\nЭто также удалит:\n• Все оценки за этот урок\n• Тему и домашнее задание\n• Посещаемость\n• Результаты тестов`)) {
      return;
    }

    // Удаляем сам урок
    setLessons(prev => prev.filter(l => l.id !== id));

    // Каскадное удаление всех связанных данных за этот урок
    // 1. Оценки за этот урок (учитываем lessonNumber)
    setGrades(prev => prev.filter(g => !(g.date === lesson.date && g.subject === lesson.subject && g.lessonNumber === lesson.lessonNumber)));

    // 2. Посещаемость за этот урок
    setAttendance(prev => prev.filter(a => !(a.date === lesson.date && a.subject === lesson.subject)));

    // 3. Записи дневника за этот урок (учитываем lessonNumber)
    setDiaryEntries(prev => prev.filter(de => !(de.date === lesson.date && de.subject === lesson.subject && de.lessonNumber === lesson.lessonNumber)));

    // 4. Типы уроков за эту дату, предмет и номер урока
    setLessonTypes(prev => prev.filter(lt => !(lt.date === lesson.date && lt.subject === lesson.subject && lt.lessonNumber === lesson.lessonNumber)));

    // 5. Колонки журнала за эту дату, предмет и номер урока
    setJournalColumns(prev => prev.filter(jc => !(jc.date === lesson.date && jc.subject === lesson.subject && jc.lessonNumber === lesson.lessonNumber)));

    // 6. Попытки тестов за этот урок
    setTestAttempts(prev => prev.filter(ta => !(ta.date === lesson.date && ta.subject === lesson.subject)));

    // 7. Пересдачи тестов за этот урок
    setTestRetakes(prev => prev.filter(tr => !(tr.date === lesson.date)));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      'Математика': 'bg-blue-100 text-blue-800 border-blue-200',
      'Русский язык': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Обществознание': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'География': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="animate-fadeIn">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={goToday} className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20">
            Сегодня
          </button>
          <div className="flex items-center bg-white/80 backdrop-blur rounded-xl overflow-hidden border border-white/50">
            <button onClick={() => viewMode === 'week' ? navigateWeek(-1) : viewMode === 'month' ? navigateMonth(-1) : navigateDay(-1)}
              className="p-2.5 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => viewMode === 'week' ? navigateWeek(1) : viewMode === 'month' ? navigateMonth(1) : navigateDay(1)}
              className="p-2.5 hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 ml-1">
            {viewMode === 'week' && `${weekDates[0].getDate()} - ${weekDates[5].getDate()} ${MONTH_NAMES[weekDates[5].getMonth()]} ${weekDates[5].getFullYear()}`}
            {viewMode === 'month' && `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {viewMode === 'day' && `${DAY_NAMES[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}, ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onEditModeChange && (
            <button
              onClick={() => onEditModeChange(!editable)}
              className={`
                px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2
                ${editable
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Pencil className="w-4 h-4" />
              {editable ? 'Режим редактирования' : 'Просмотр'}
            </button>
          )}
          <div className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}>
                {mode === 'day' ? 'День' : mode === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-16 p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  {weekDates.map((date, i) => (
                    <th key={i}
                      className={`p-4 text-center border-l border-gray-200 cursor-pointer hover:bg-blue-50/50 transition-colors ${isToday(date) ? 'bg-blue-50' : ''}`}
                      onClick={() => { setSelectedDate(date); setViewMode('day'); }}>
                      <div className="text-xs font-medium text-gray-500 uppercase">{DAY_NAMES_SHORT[i]}</div>
                      <div className={`text-2xl font-semibold mt-1 ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LESSON_NUMBERS.map(num => (
                  <tr key={num} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-center">
                      <div className="text-sm font-medium text-gray-400">{num}</div>
                    </td>
                    {weekDates.map((weekDate, dayIdx) => {
                      const dateStr = formatDate(weekDate);
                      const lesson = lessons.find(l => l.date === dateStr && l.lessonNumber === num);
                      return (
                        <td key={dayIdx} className={`p-2 border-l border-gray-200 ${isToday(weekDate) ? 'bg-blue-50/30' : ''}`}>
                          {lesson ? (
                            <div className={`p-3 rounded-lg border text-sm ${getSubjectColor(lesson.subject)} transition-all hover:shadow-md cursor-pointer relative group`}
                              onClick={() => editable ? openEditModal(lesson) : onOpenLessonPage && onOpenLessonPage(lesson.subject, lesson.date, lesson.lessonNumber)}>
                              <div className="font-medium truncate">{lesson.subject}</div>
                              {lesson.startTime && (
                                <div className="opacity-70 text-xs mt-1">{lesson.startTime}-{lesson.endTime}</div>
                              )}
                              {editable && (
                                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                  <button onClick={e => { e.stopPropagation(); openEditModal(lesson); }}
                                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id); }}
                                    className="p-1.5 rounded-lg bg-white/90 hover:bg-red-50 text-red-500 shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                              {!editable && (
                                <div className="absolute top-2 right-2 hidden group-hover:flex">
                                  <div className="p-1.5 rounded-lg bg-white shadow-sm">
                                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : editable ? (
                            <button onClick={() => openAddModal(dateStr, num)}
                              className="w-full h-full min-h-[70px] rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-center">
                              <Plus className="w-5 h-5 text-gray-300" />
                            </button>
                          ) : (
                            <div className="min-h-[70px]" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="glass rounded-3xl overflow-hidden shadow-soft relative">
          <div className="grid grid-cols-7">
            {DAY_NAMES_SHORT.concat('Вс').map(d => (
              <div key={d} className="p-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                {d}
              </div>
            ))}
            {getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map((date, i) => {
              if (!date) return <div key={i} className="p-3 min-h-[90px] border-b border-r border-gray-50 bg-gray-50/30" />;
              const dateStr = formatDate(date);
              const dayLessons = getLessonsForDate(dateStr);
              return (
                <div key={i}
                  className={`p-3 min-h-[90px] border-b border-r border-gray-50 cursor-pointer hover:bg-white/50 transition-colors ${isToday(date) ? 'bg-primary-50/30' : ''}`}
                  onClick={() => setPopupDay({ date })}>
                  <div className={`text-sm font-bold mb-2 ${isToday(date) ? 'text-primary-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayLessons.slice(0, 3).map(l => (
                      <div key={l.id} className="text-[10px] font-medium text-gray-600 bg-white/60 rounded-lg px-2 py-1 border border-gray-100">
                        {l.subject}
                      </div>
                    ))}
                    {dayLessons.length > 3 && (
                      <div className="text-[10px] text-gray-400 font-medium">+{dayLessons.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day Popup */}
          {popupDay && (() => {
            const dateStr = formatDate(popupDay.date);
            const dayLessons = getLessonsForDate(dateStr);
            const dow = popupDay.date.getDay();
            const dayIdx = dow === 0 ? 6 : dow - 1;
            const dayName = DAY_NAMES[dayIdx];
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setPopupDay(null)}>
                <div className="glass-dark shadow-soft-xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                  <div className="px-6 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xl">{dayName}</h3>
                        <p className="text-primary-100 text-sm mt-1">{popupDay.date.getDate()} {MONTH_NAMES_GEN[popupDay.date.getMonth()]} {popupDay.date.getFullYear()}</p>
                      </div>
                      <button onClick={() => setPopupDay(null)} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {dayLessons.length === 0 ? (
                      <div className="text-center py-12">
                        <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400">Нет уроков в этот день</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayLessons.map(lesson => (
                          <div key={lesson.id} className={`flex items-center gap-4 p-4 rounded-2xl bg-white/60 transition-colors border border-white/80 ${!editable ? 'hover:bg-white cursor-pointer' : ''}`}
                            onClick={() => !editable && onOpenLessonPage && onOpenLessonPage(lesson.subject, lesson.date, lesson.lessonNumber)}>
                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                              <span className="text-base font-bold text-white">{lesson.lessonNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900">{lesson.subject}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {lesson.startTime && lesson.endTime ? (
                                <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl">{lesson.startTime}-{lesson.endTime}</div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-5 pb-5">
                    <button onClick={() => {
                      setSelectedDate(popupDay.date);
                      setCurrentDate(popupDay.date);
                      setViewMode('day');
                      setPopupDay(null);
                    }} className="w-full py-3 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-2xl transition-colors border border-primary-200">
                      Подробнее →
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (() => {
        const dateStr = formatDate(selectedDate);
        const dayLessons = getLessonsForDate(dateStr);
        return (
          <div className="space-y-4">
            {dayLessons.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-medium">Нет уроков в этот день</p>
              </div>
            ) : dayLessons.map((lesson, idx) => (
              <div key={lesson.id}
                className={`glass rounded-2xl p-5 flex items-center gap-5 hover:shadow-soft transition-all animate-fadeIn card-hover ${!editable ? 'cursor-pointer' : ''}`}
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => !editable && onOpenLessonPage && onOpenLessonPage(lesson.subject, lesson.date, lesson.lessonNumber)}>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex flex-col items-center justify-center shadow-lg shadow-primary-200">
                  <div className="text-xl font-bold text-white">{lesson.lessonNumber}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg">{lesson.subject}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  {lesson.startTime && lesson.endTime ? (
                    <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl">{lesson.startTime} - {lesson.endTime}</div>
                  ) : (
                    <div className="text-sm font-medium text-gray-400 italic">Время не указано</div>
                  )}
                </div>
                {editable && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEditModal(lesson); }} className="p-2.5 rounded-xl hover:bg-white/60 transition-colors text-gray-500 hover:text-primary-600">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteLesson(lesson.id); }} className="p-2.5 rounded-xl hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {!editable && (
                  <div className="flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
              </div>
            ))}
            {editable && (
              <button onClick={() => openAddModal(dateStr, dayLessons.length + 1)}
                className="w-full py-5 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-3 font-medium">
                <Plus className="w-6 h-6" /> Добавить урок
              </button>
            )}
          </div>
        );
      })()}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl w-full max-w-md p-7 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingLesson ? 'Редактировать урок' : 'Добавить урок'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Предмет</label>
                <select value={modalData.subject} onChange={e => setModalData(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                  <input type="date" value={modalData.date} onChange={e => setModalData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Урок №</label>
                  <select value={modalData.lessonNumber} onChange={e => setModalData(p => ({ ...p, lessonNumber: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Время начала</label>
                  <input type="time" value={modalData.startTime} onChange={e => setModalData(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Время окончания</label>
                  <input type="time" value={modalData.endTime} onChange={e => setModalData(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Время указывать необязательно</p>
            </div>
            <div className="flex gap-3 pt-2">
              {editingLesson && (
                <button onClick={() => { deleteLesson(editingLesson.id); setShowModal(false); }}
                  className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                Отмена
              </button>
              <button onClick={saveLesson}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
