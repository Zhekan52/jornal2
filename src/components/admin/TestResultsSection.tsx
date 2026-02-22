import React, { useState } from 'react';
import { useData } from '../../context';
import { type Test, type Student, type TestQuestion } from '../../data';
import { QuestionEditor } from '../QuestionEditor';
import katex from 'katex';
import {
  FileText, ChevronRight, ArrowLeft, RefreshCw, Save, Eye, X
} from 'lucide-react';

// ==================== TEST RESULTS SECTION ====================
export const TestResultsSection: React.FC<{
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

