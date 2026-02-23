import React, { useState } from 'react';
import { X, Save, Type, List } from 'lucide-react';

interface HomeworkEditorProps {
  value: string;
  isRich: boolean;
  onChange: (value: string, isRich: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const HomeworkEditor: React.FC<HomeworkEditorProps> = ({
  value,
  isRich,
  onChange,
  onCancel,
  onSave,
}) => {
  const [text, setText] = useState(value);
  const [rich, setRich] = useState(isRich);

  const handleSave = () => {
    onChange(text, rich);
    onSave();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Редактор домашнего задания</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRich(!rich)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              rich 
                ? 'bg-violet-100 text-violet-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={rich ? 'Обычный режим' : 'Расширенный режим'}
          >
            <List className="w-4 h-4" />
            {rich ? 'Расширенный' : 'Обычный'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Текст домашнего задания
        </label>
        {rich ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите домашнее задание..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[200px] resize-y text-gray-900"
          />
        ) : (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Введите домашнее задание..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          />
        )}
      </div>

      {rich && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Расширенный режим:</strong> домашнее задание будет отображаться ученикам с пометкой 📎 и будет показано в дневнике.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Отмена
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 font-medium flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Сохранить
        </button>
      </div>
    </div>
  );
};
