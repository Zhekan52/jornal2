import { useState, useEffect } from 'react';
import { Clock, Calendar, ArrowRight } from 'lucide-react';

interface Lesson {
  id: string;
  subject: string;
  date: string;
  lessonNumber: number;
  startTime?: string;
  endTime?: string;
}

interface NextLessonCounterProps {
  lessons: Lesson[];
  selectedSubject?: string;
}

export function NextLessonCounter({ lessons, selectedSubject }: NextLessonCounterProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const updateNextLesson = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Фильтруем уроки
      let filteredLessons = lessons;
      if (selectedSubject) {
        filteredLessons = lessons.filter(l => l.subject === selectedSubject);
      }

      // Ищем уроки на сегодня и в будущем
      const futureLessons = filteredLessons
        .filter(l => l.date >= today)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (!a.startTime || !b.startTime) return 0;
          return a.startTime.localeCompare(b.startTime);
        });

      if (futureLessons.length === 0) {
        setNextLesson(null);
        setTimeLeft(null);
        return;
      }

      const next = futureLessons[0];
      setNextLesson(next);

      // Вычисляем время до урока
      if (next.date === today && next.startTime) {
        const [hours, minutes] = next.startTime.split(':').map(Number);
        const lessonTime = new Date(now);
        lessonTime.setHours(hours, minutes, 0, 0);

        const diff = lessonTime.getTime() - now.getTime();
        
        if (diff > 0) {
          setTimeLeft({
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          });
        } else {
          // Урок уже идёт или закончился сегодня
          setTimeLeft(null);
        }
      } else {
        // Урок в будущем
        const lessonDate = new Date(next.date + 'T00:00:00');
        const diff = lessonDate.getTime() - now.getTime();
        
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    updateNextLesson();
    const interval = setInterval(updateNextLesson, 1000);

    return () => clearInterval(interval);
  }, [lessons, selectedSubject]);

  if (!nextLesson) {
    return (
      <div className="glass rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span> Расписание
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Нет предстоящих уроков</p>
        </div>
      </div>
    );
  }

  const lessonDate = new Date(nextLesson.date);
  const isToday = lessonDate.toDateString() === new Date().toDateString();
  const isTomorrow = lessonDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const getDayLabel = () => {
    if (isToday) return 'Сегодня';
    if (isTomorrow) return 'Завтра';
    return lessonDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="glass rounded-2xl p-6 shadow-soft overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
        <span className="text-2xl">⏰</span> Следующий урок
      </h3>

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{getDayLabel()}</span>
          {nextLesson.startTime && (
            <>
              <ArrowRight className="w-3 h-3" />
              <span>{nextLesson.startTime} - {nextLesson.endTime}</span>
            </>
          )}
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-5 text-white mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Предмет</div>
              <div className="text-2xl font-bold">{nextLesson.subject}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Урок №</div>
              <div className="text-3xl font-bold">{nextLesson.lessonNumber}</div>
            </div>
          </div>
        </div>

        {timeLeft && (
          <div className="bg-white/60 rounded-xl p-4 border border-white/80">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Clock className="w-4 h-4" />
              <span>До начала урока:</span>
            </div>
            <div className="flex gap-3 justify-center">
              {timeLeft.hours > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{timeLeft.hours}</div>
                  <div className="text-xs text-gray-500 mt-1">часов</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-500 mt-1">минут</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-500 mt-1">секунд</div>
              </div>
            </div>
          </div>
        )}

        {!timeLeft && isToday && nextLesson.startTime && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
            <div className="text-green-700 font-semibold">Урок уже идёт!</div>
          </div>
        )}
      </div>
    </div>
  );
}
