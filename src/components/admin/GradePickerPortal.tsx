import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

interface GradePickerPortalProps {
  anchorRect: DOMRect;
  currentGrade?: number;
  onSelect: (v: number) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const GradePickerPortal: React.FC<GradePickerPortalProps> = ({
  anchorRect,
  currentGrade,
  onSelect,
  onDelete,
  onClose
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const widgetW = 200;
  const widgetH = currentGrade ? 90 : 60;
  let top = anchorRect.bottom + 4;
  let left = anchorRect.left + anchorRect.width / 2 - widgetW / 2;
  if (top + widgetH > window.innerHeight) top = anchorRect.top - widgetH - 4;
  if (left < 8) left = 8;
  if (left + widgetW > window.innerWidth - 8) left = window.innerWidth - widgetW - 8;

  return createPortal(
    <div 
      ref={ref} 
      className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-scaleIn"
      style={{ top, left, width: widgetW }}
    >
      <div className="flex gap-1.5 justify-center">
        {[5, 4, 3, 2].map(v => (
          <button 
            key={v} 
            onClick={() => onSelect(v)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
              v === 5 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
              v === 4 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
              v === 3 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
              'bg-red-100 text-red-700 hover:bg-red-200'
            } ${currentGrade === v ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>
      {currentGrade && onDelete && (
        <button 
          onClick={onDelete} 
          className="w-full mt-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Удалить
        </button>
      )}
    </div>,
    document.body
  );
};
