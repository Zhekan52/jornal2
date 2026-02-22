import { useScheduleStore, DAYS, ClassSession } from '../data/store';
import { Calendar, Clock, MapPin, User, Pencil, BookOpen } from 'lucide-react';

interface ScheduleGridProps {
  onSessionClick?: (session: ClassSession) => void;
  onOpenJournal?: (subject: string, date: string, lessonNumber: number) => void;
  weekStart: string;
  isEditMode?: boolean;
}

export function ScheduleGrid({ onSessionClick, onOpenJournal, weekStart, isEditMode = false }: ScheduleGridProps) {
  const { schedule } = useScheduleStore();

  const getSessionsForDay = (day: string) => {
    return schedule
      .filter(s => s.day === day && s.weekStart === weekStart)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const subjectColors: Record<string, string> = {
    'Русский язык': 'bg-red-50 text-red-700 border-red-200',
    'Математика': 'bg-blue-50 text-blue-700 border-blue-200',
    'Обществознание': 'bg-purple-50 text-purple-700 border-purple-200',
    'География': 'bg-green-50 text-green-700 border-green-200',
  };

  const handleCardClick = (session: ClassSession) => {
    if (isEditMode && onSessionClick) {
      onSessionClick(session);
    } else if (!isEditMode && onOpenJournal) {
      // Calculate the date from weekStart and day
      const weekStartObj = new Date(weekStart + 'T00:00:00');
      const dayIndex = DAYS.indexOf(session.day);
      const lessonDate = new Date(weekStartObj);
      lessonDate.setDate(lessonDate.getDate() + dayIndex);
      const dateStr = lessonDate.toISOString().split('T')[0];
      // Calculate lesson number from time
      const lessonNumber = Math.floor(parseInt(session.startTime.split(':')[0]) / 2) + 1;
      onOpenJournal(session.subject, dateStr, lessonNumber);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {DAYS.map(day => {
        const sessions = getSessionsForDay(day);
        if (sessions.length === 0) return null;

        return (
          <div key={day} className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">{day}</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {sessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => handleCardClick(session)}
                  className={`
                    p-3.5 rounded-xl border relative group cursor-pointer transition-all
                    ${isEditMode 
                      ? 'hover:shadow-md hover:border-indigo-300' 
                      : 'hover:shadow-md hover:border-indigo-300'
                    }
                    ${subjectColors[session.subject] || 'bg-gray-50 text-gray-700 border-gray-200'}
                  `}
                >
                  <div className="font-bold text-lg mb-1.5 pr-6">{session.subject}</div>

                  <div className="absolute top-3.5 right-3.5 flex gap-1">
                    {!isEditMode && (
                      <div className="p-1.5 bg-white/80 rounded-md shadow-sm">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                    )}
                    {isEditMode && onSessionClick && (
                      <div className="p-1.5 bg-white/80 rounded-md shadow-sm">
                        <Pencil className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm opacity-90">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{session.startTime} - {session.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Каб. {session.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{session.teacher}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
