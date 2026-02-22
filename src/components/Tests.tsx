import React, { useState } from 'react';
import { useData } from '../context';
import {
  Plus, Edit2, Trash2, X, Save, Clock, FileText, Image, Type,
  CheckCircle, List, AlignLeft, ChevronDown, ChevronUp
} from 'lucide-react';
import { type Test, type TestQuestion, SUBJECTS } from '../data';

export const Tests: React.FC = () => {
  const { tests, setTests, lessons } = useData();
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
  };

  const startCreate = () => {
    const newTest: Test = {
      id: `t${Date.now()}`,
      title: '',
      subject: SUBJECTS[0],
      timeLimit: 0,
      gradingScale: [
        { minPercent: 90, grade: 5 },
        { minPercent: 70, grade: 4 },
        { minPercent: 50, grade: 3 },
        { minPercent: 0, grade: 2 },
      ],
      questions: [],
      variants: [],
      useVariants: false,
      createdAt: new Date().toISOString(),
    };
    setEditingTest(newTest);
    setIsCreating(true);
  };

  const startEdit = (test: Test) => {
    setEditingTest({ ...test, questions: test.questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) })) });
    setIsCreating(false);
  };

  const saveTest = (test: Test) => {
    if (isCreating) {
      setTests(prev => [...prev, test]);
    } else {
      setTests(prev => prev.map(t => t.id === test.id ? test : t));
    }
    setEditingTest(null);
    setIsCreating(false);
  };

  if (editingTest) {
    return <TestEditor test={editingTest} onSave={saveTest} onCancel={() => { setEditingTest(null); setIsCreating(false); }} />;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Тесты</h2>
        <button onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-medium">
          <Plus className="w-4 h-4" /> Создать тест
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-12 text-center shadow-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">Нет тестов</p>
          <p className="text-gray-400 text-sm mt-1">Создайте первый тест</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map(test => {
            const assignedLesson = lessons.find(l => l.id === test.assignedLessonId);
            const totalPoints = test.questions.reduce((s, q) => s + q.points, 0);
            return (
              <div key={test.id} className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-lg">{test.title || 'Без названия'}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        {test.subject}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {test.questions.length} вопросов
                      </span>
                      <span className="text-sm text-gray-500">
                        {totalPoints} баллов
                      </span>
                      {test.timeLimit > 0 && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {test.timeLimit} мин
                        </span>
                      )}
                      {assignedLesson && (
                        <span className="text-sm text-gray-500">
                          📌 {assignedLesson.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(test)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteTest(test.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== TEST EDITOR ====================

interface TestEditorProps {
  test: Test;
  onSave: (test: Test) => void;
  onCancel: () => void;
}

const TestEditor: React.FC<TestEditorProps> = ({ test: initialTest, onSave, onCancel }) => {
  const { lessons } = useData();
  const [test, setTest] = useState<Test>(initialTest);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const updateTest = (updates: Partial<Test>) => {
    setTest(prev => ({ ...prev, ...updates }));
  };

  const addQuestion = (type: 'single' | 'multiple' | 'text') => {
    const newQ: TestQuestion = {
      id: `q${Date.now()}`,
      type,
      text: '',
      options: type !== 'text' ? [
        { id: `o${Date.now()}a`, text: '', correct: false },
        { id: `o${Date.now()}b`, text: '', correct: false },
      ] : [],
      correctAnswer: type === 'text' ? '' : undefined,
      points: 1,
    };
    updateTest({ questions: [...test.questions, newQ] });
    setExpandedQ(newQ.id);
  };

  const updateQuestion = (qId: string, updates: Partial<TestQuestion>) => {
    updateTest({
      questions: test.questions.map(q => q.id === qId ? { ...q, ...updates } : q),
    });
  };

  const deleteQuestion = (qId: string) => {
    updateTest({ questions: test.questions.filter(q => q.id !== qId) });
  };

  const addOption = (qId: string) => {
    const q = test.questions.find(q => q.id === qId);
    if (!q) return;
    updateQuestion(qId, {
      options: [...q.options, { id: `o${Date.now()}`, text: '', correct: false }],
    });
  };

  const updateOption = (qId: string, optId: string, updates: { text?: string; correct?: boolean }) => {
    const q = test.questions.find(q => q.id === qId);
    if (!q) return;
    let newOptions = q.options.map(o => o.id === optId ? { ...o, ...updates } : o);
    if (q.type === 'single' && updates.correct === true) {
      newOptions = newOptions.map(o => ({ ...o, correct: o.id === optId }));
    }
    updateQuestion(qId, { options: newOptions });
  };

  const deleteOption = (qId: string, optId: string) => {
    const q = test.questions.find(q => q.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: q.options.filter(o => o.id !== optId) });
  };

  const updateGradingScale = (idx: number, field: 'minPercent' | 'grade', value: number) => {
    const newScale = [...test.gradingScale];
    newScale[idx] = { ...newScale[idx], [field]: value };
    updateTest({ gradingScale: newScale });
  };

  const handleImageUpload = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateQuestion(qId, { image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return <CheckCircle className="w-4 h-4" />;
      case 'multiple': return <List className="w-4 h-4" />;
      case 'text': return <AlignLeft className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Один ответ';
      case 'multiple': return 'Несколько ответов';
      case 'text': return 'Текстовый ответ';
      default: return '';
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {initialTest.title ? 'Редактирование теста' : 'Новый тест'}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
            Отмена
          </button>
          <button onClick={() => onSave(test)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 text-sm font-medium flex items-center gap-2">
            <Save className="w-4 h-4" /> Сохранить
          </button>
        </div>
      </div>

      {/* Test Settings */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-5 shadow-lg">
        <h3 className="font-medium text-gray-900">Основные настройки</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <input type="text" value={test.title} onChange={e => updateTest({ title: e.target.value })}
              placeholder="Введите название теста"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <select value={test.subject} onChange={e => updateTest({ subject: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ограничение по времени (мин)</label>
            <input type="number" value={test.timeLimit || ''} onChange={e => updateTest({ timeLimit: parseInt(e.target.value) || 0 })}
              placeholder="0 = без ограничения"
              min={0}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Привязать к уроку</label>
            <select value={test.assignedLessonId || ''} onChange={e => updateTest({ assignedLessonId: e.target.value || undefined })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option value="">Не привязан</option>
              {lessons.filter(l => l.subject === test.subject).map(l => (
                <option key={l.id} value={l.id}>{l.subject} — Урок {l.lessonNumber}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grading Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Шкала оценок</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {test.gradingScale.map((gs, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-white text-sm shadow-md ${
                  gs.grade === 5 ? 'bg-gradient-to-br from-green-400 to-green-500' : gs.grade === 4 ? 'bg-gradient-to-br from-blue-400 to-blue-500' : gs.grade === 3 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : 'bg-gradient-to-br from-red-400 to-red-500'
                }`}>{gs.grade}</span>
                <span className="text-xs text-gray-500">от</span>
                <input type="number" value={gs.minPercent} onChange={e => updateGradingScale(idx, 'minPercent', parseInt(e.target.value) || 0)}
                  min={0} max={100}
                  className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Вопросы ({test.questions.length})
          </h3>
        </div>

        {test.questions.map((q, idx) => {
          const isExpanded = expandedQ === q.id;
          return (
            <div key={q.id} className="bg-white/80 backdrop-blur rounded-xl border border-white/50 overflow-hidden shadow-lg">
              {/* Question Header */}
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                <span className="text-sm font-medium text-gray-400 w-6">{idx + 1}</span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100/50 rounded-lg">
                  {getTypeIcon(q.type)}
                  <span className="text-xs font-medium text-gray-600">{getTypeLabel(q.type)}</span>
                </div>
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {q.text || 'Без текста'}
                </span>
                <span className="text-xs text-gray-400">{q.points} б.</span>
                <button onClick={e => { e.stopPropagation(); deleteQuestion(q.id); }}
                  className="p-1 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-400" /></button>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Текст вопроса</label>
                    <textarea value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })}
                      rows={2} placeholder="Введите текст вопроса..."
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all" />
                  </div>

                  {/* Formula */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Формула (необязательно)</label>
                    <input type="text" value={q.formula || ''} onChange={e => updateQuestion(q.id, { formula: e.target.value })}
                      placeholder="Например: x² + 2x + 1 = 0"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all" />
                    {q.formula && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <span className="text-sm text-blue-800 font-mono italic">{q.formula}</span>
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-sm">
                        <Image className="w-4 h-4" /> Загрузить
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(q.id, e)} className="hidden" />
                      </label>
                      {q.image && (
                        <button onClick={() => updateQuestion(q.id, { image: undefined })}
                          className="text-sm text-red-500 hover:underline">Удалить</button>
                      )}
                    </div>
                    {q.image && (
                      <img src={q.image} alt="Question" className="mt-2 max-h-40 rounded-xl border border-gray-200" />
                    )}
                  </div>

                  {/* Points */}
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Баллы</label>
                    <input type="number" value={q.points} onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                  </div>

                  {/* Options for single/multiple */}
                  {(q.type === 'single' || q.type === 'multiple') && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Варианты ответа {q.type === 'single' ? '(выберите правильный)' : '(отметьте правильные)'}
                      </label>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type={q.type === 'single' ? 'radio' : 'checkbox'}
                              checked={opt.correct}
                              onChange={e => updateOption(q.id, opt.id, { correct: e.target.checked })}
                              name={`q-${q.id}`}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <input type="text" value={opt.text} onChange={e => updateOption(q.id, opt.id, { text: e.target.value })}
                              placeholder={`Вариант ${oi + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                            <button onClick={() => deleteOption(q.id, opt.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50">
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addOption(q.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                          <Plus className="w-3.5 h-3.5" /> Добавить вариант
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Correct answer for text */}
                  {q.type === 'text' && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Правильный ответ</label>
                      <input type="text" value={q.correctAnswer || ''} onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })}
                        placeholder="Введите правильный ответ"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Question Buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => addQuestion('single')}
            className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur border-2 border-dashed border-blue-200 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Один ответ
          </button>
          <button onClick={() => addQuestion('multiple')}
            className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur border-2 border-dashed border-indigo-200 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium">
            <List className="w-4 h-4" /> Несколько ответов
          </button>
          <button onClick={() => addQuestion('text')}
            className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur border-2 border-dashed border-purple-200 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all text-sm font-medium">
            <Type className="w-4 h-4" /> Текстовый ответ
          </button>
        </div>
      </div>
    </div>
  );
};
