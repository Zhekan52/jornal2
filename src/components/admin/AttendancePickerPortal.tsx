import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { ATTENDANCE_TYPES, type AttendanceRecord } from '../../data';

interface AttendancePickerPortalProps {
  anchorRect: DOMRect;
  currentType?: AttendanceRecord['type'];
  onSelect: (type: AttendanceRecord['type']) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const AttendancePickerPortal: React.FC<AttendancePickerPortalProps> = ({
  anchorRect,
  currentType,
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

  const widgetW = 220;
  let top = anchorRect.bottom + 4;
  let left = anchorRect.left + anchorRect.width / 2 - widgetW / 2;
  if (top + 120 > window.innerHeight) top = anchorRect.top - 120;
  if (left < 8) left = 8;
  if (left + widgetW > window.innerWidth - 8) left = window.innerWidth - widgetW - 8;

  return createPortal(
    <div 
      ref={ref} 
      className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 p-2 animate-scaleIn"
      style={{ top, left, width: widgetW }}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {ATTENDANCE_TYPES.map(at => (
          <button 
            key={at.value} 
            onClick={() => onSelect(at.value)}
            className={`px-2 py-2 rounded-lg text-xs font-bold transition-all ${at.bgColor} ${at.color} ${currentType === at.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
          >
            {at.short} — {at.label.slice(0, 10)}
          </button>
        ))}
      </div>
      {currentType && (
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
