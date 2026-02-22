import React, { useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Upload, X } from 'lucide-react';

interface QuestionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  image?: string;
  onImageChange: (image: string | undefined) => void;
  formula?: string;
  onFormulaChange: (formula: string) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  value,
  onChange,
  placeholder = 'Введите текст вопроса...',
  image,
  onImageChange,
  formula,
  onFormulaChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onImageChange(undefined);
  };

  const renderFormula = (formulaStr: string) => {
    try {
      return katex.renderToString(formulaStr, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      return '<span class="text-red-500">Ошибка в формуле</span>';
    }
  };

  return (
    <div className="space-y-4">
      {/* Текст вопроса */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Текст вопроса
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-y"
        />
      </div>

      {/* Изображение */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Изображение (необязательно)
        </label>
        {!image ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-gray-50 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">Загрузить изображение</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <span className="text-xs text-gray-400">Максимум 5MB</span>
          </div>
        ) : (
          <div className="relative group">
            <img
              src={image}
              alt="Question image"
              className="max-h-64 w-auto rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Удалить изображение"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Формула */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Формула (LaTeX, необязательно)
        </label>
        <div className="space-y-2">
          <input
            type="text"
            value={formula || ''}
            onChange={(e) => onFormulaChange(e.target.value)}
            placeholder="Например: x^2 + 2x + 1 = 0"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          {formula && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center min-h-[60px]">
              <span
                dangerouslySetInnerHTML={{
                  __html: renderFormula(formula),
                }}
                className="text-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
