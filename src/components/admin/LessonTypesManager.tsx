import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../context';
import { type CustomLessonType } from '../../data';
import {
  BookOpen, Plus, Trash2, Edit2, X
} from 'lucide-react';

const colorOptions = [
  { value: 'bg-blue-100 text-blue-700', label: 'Синий', preview: 'bg-blue-100 text-blue-700' },
  { value: 'bg-green-100 text-green-700', label: 'Зелёный', preview: 'bg-green-100 text-green-700' },
  { value: 'bg-red-100 text-red-700', label: 'Красный', preview: 'bg-red-100 text-red-700' },
  { value: 'bg-amber-100 text-amber-700', label: 'Жёлтый', preview: 'bg-amber-100 text-amber-700' },
  { value: 'bg-purple-100 text-purple-700', label: 'Фиолетовый', preview: 'bg-purple-100 text-purple-700' },
  { value: 'bg-pink-100 text-pink-700', label: 'Розовый', preview: 'bg-pink-100 text-pink-700' },
  { value: 'bg-teal-100 text-teal-700', label: 'Бирюзовый', preview: 'bg-teal-100 text-teal-700' },
  { value: 'bg-orange-100 text-orange-700', label: 'Оранжевый', preview: 'bg-orange-100 text-orange-700' },
  { value: 'bg-cyan-100 text-cyan-700', label: 'Голубой', preview: 'bg-cyan-100 text-cyan-700' },
  { value: 'bg-rose-100 text-rose-700', label: 'Розовый тёмный', preview: 'bg-rose-100 text-rose-700' },
];

const generateValue = (label: string) => {
  return label.toLowerCase()
    .replace(/[^а-яёa-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20) || 'custom';
};

export const LessonTypesManager: React.FC = () => {
  const { customLessonTypes, setCustomLessonTypes } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<CustomLessonType | null>(null);
  const [formData, setFormData] = useState({ label: '', short: '', color: 'bg-blue-100 text-blue-700' });

  const openAdd = () => {
    setEditingType(null);
    setFormData({ label: '', short: '', color: 'bg-blue-100 text-blue-700' });
    setShowModal(true);
  };

  const openEdit = (type: CustomLessonType) => {
    setEditingType(type);
    setFormData({ label: type.label, short: type.short, color: type.color });
    setShowModal(true);
  };

  const save = () => {
    if (!formData.label || !formData.short) {
      alert('Заполните все поля');
      return;
    }
    const value = generateValue(formData.label);
    if (editingType) {
      setCustomLessonTypes(prev => prev.map(t => t.id === editingType.id ? { ...t, ...formData, value } : t));
    } else {
      setCustomLessonTypes(prev => [...prev, { id: `clt${Date.now()}`, value, ...formData }]);
    }
    setShowModal(false);
  };

  const deleteType = (id: string) => {
    if (confirm('Удалить этот тип урока?')) {
      setCustomLessonTypes(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Типы уроков</h2>
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium"
        >
          <Plus className="w-5 h-5" /> Добавить тип
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
        {customLessonTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">Нет пользовательских типов уроков</p>
            <p className="text-gray-300 text-sm mt-1">Создайте свой тип урока для использования в журнале</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customLessonTypes.map(type => (
              <div key={type.id} className="p-5 rounded-xl bg-gray-50/50 border border-white/50 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type.color}`}>
                    {type.short}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(type)} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteType(type.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900">{type.label}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl w-full max-w-md p-7 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingType ? 'Редактировать тип урока' : 'Добавить тип урока'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
                <input 
                  type="text" 
                  value={formData.label} 
                  onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                  placeholder="Например: Проектная работа"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Сокращение</label>
                <input 
                  type="text" 
                  value={formData.short} 
                  onChange={e => setFormData(p => ({ ...p, short: e.target.value }))}
                  placeholder="Пр"
                  maxLength={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(opt => (
                    <button 
                      key={opt.value} 
                      onClick={() => setFormData(p => ({ ...p, color: opt.value }))}
                      className={`p-3 rounded-xl border-2 transition-all ${formData.color === opt.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-full h-8 rounded-lg ${opt.preview.split(' ')[0]}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Отмена
              </button>
              <button 
                onClick={save}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
