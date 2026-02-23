import React, { useState } from 'react';
import { useData } from '../../context';
import { type Test, type TestQuestion, SUBJECTS } from '../../data';
import { QuestionEditor } from '../QuestionEditor';
import {
  Plus, Edit2, Trash2, FileText, ArrowLeft, Save, X
} from 'lucide-react';

// ==================== TESTS MANAGER ====================
export const TestsManager: React.FC = () => {
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
            Ученики будут получать разные вопросы для предотвращения списывания
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
                        title="Копировать вариант">
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
