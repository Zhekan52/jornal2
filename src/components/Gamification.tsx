import { useMemo } from 'react';
import { Trophy, Target, Award, Star, Zap, Flame, TrendingUp } from 'lucide-react';

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface GamificationProps {
  students: any[];
  grades: any[];
  attendance: any[];
  testAttempts: any[];
}

export function Gamification({ students, grades, attendance, testAttempts }: GamificationProps) {
  // Вычисление ачивок для учеников
  const studentAchievements = useMemo(() => {
    return students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const studentTests = testAttempts.filter(t => t.studentId === student.id);

      // Средний балл
      const avgGrade = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length 
        : 0;

      // Посещаемость
      const attendanceRate = studentAttendance.length > 0
        ? (studentAttendance.filter(a => a.type === 'П').length / studentAttendance.length) * 100
        : 0;

      // Количество пятёрок
      const fivesCount = studentGrades.filter(g => g.value === 5).length;

      // Ачивки
      const achievements: Achievement[] = [
        {
          id: 'excellent',
          icon: <Trophy className="w-5 h-5" />,
          title: 'Отличник',
          description: 'Средний балл 5.0',
          unlocked: avgGrade === 5,
        },
        {
          id: 'good-student',
          icon: <Award className="w-5 h-5" />,
          title: 'Хорошист',
          description: 'Средний балл выше 4.5',
          unlocked: avgGrade >= 4.5 && avgGrade < 5,
        },
        {
          id: 'perfect-attendance',
          icon: <Star className="w-5 h-5" />,
          title: 'Без пропусков',
          description: '100% посещаемость',
          unlocked: attendanceRate === 100 && studentAttendance.length > 0,
        },
        {
          id: 'grade-master',
          icon: <Zap className="w-5 h-5" />,
          title: 'Мастер оценок',
          description: 'Получить 10 пятёрок',
          unlocked: fivesCount >= 10,
          progress: fivesCount,
          maxProgress: 10,
        },
        {
          id: 'streak',
          icon: <Flame className="w-5 h-5" />,
          title: 'Серия успехов',
          description: '5 пятёрок подряд',
          unlocked: checkStreak(studentGrades, 5),
        },
        {
          id: 'improver',
          icon: <TrendingUp className="w-5 h-5" />,
          title: 'Прогресс',
          description: 'Улучшение среднего балла на 0.5',
          unlocked: checkImprovement(studentGrades, 0.5),
        },
      ];

      return {
        ...student,
        avgGrade,
        attendanceRate,
        fivesCount,
        achievements,
        totalUnlocked: achievements.filter(a => a.unlocked).length,
      };
    });
  }, [students, grades, attendance, testAttempts]);

  // Проверка серии пятёрок
  const checkStreak = (grades: any[], target: number) => {
    if (grades.length < target) return false;
    const sortedGrades = [...grades].sort((a, b) => a.date.localeCompare(b.date));
    let streak = 0;
    for (let i = sortedGrades.length - 1; i >= 0; i--) {
      if (sortedGrades[i].value === 5) {
        streak++;
        if (streak >= target) return true;
      } else {
        streak = 0;
      }
    }
    return false;
  };

  // Проверка улучшения
  const checkImprovement = (grades: any[], threshold: number) => {
    if (grades.length < 4) return false;
    const sortedGrades = [...grades].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sortedGrades.length / 2);
    const firstHalf = sortedGrades.slice(0, mid);
    const secondHalf = sortedGrades.slice(mid);
    
    const avgFirst = firstHalf.reduce((sum, g) => sum + g.value, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, g) => sum + g.value, 0) / secondHalf.length;
    
    return avgSecond - avgFirst >= threshold;
  };

  // Лидеры по ачивкам
  const topAchievers = [...studentAchievements]
    .sort((a, b) => b.totalUnlocked - a.totalUnlocked)
    .slice(0, 5);

  // Общая статистика ачивок
  const achievementStats = useMemo(() => {
    const allAchievements = studentAchievements.flatMap(s => s.achievements);
    const totalAchievements = allAchievements.length;
    const unlockedAchievements = allAchievements.filter(a => a.unlocked).length;
    
    return {
      total: totalAchievements,
      unlocked: unlockedAchievements,
      percentage: totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0,
    };
  }, [studentAchievements]);

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="glass rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏆</span> Статистика достижений
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{achievementStats.unlocked}</div>
            <div className="text-sm text-gray-600 mt-1">Разблокировано</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">{achievementStats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Всего достижений</div>
          </div>
          <div className="bg-white/60 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-success-600">{achievementStats.percentage.toFixed(0)}%</div>
            <div className="text-sm text-gray-600 mt-1">Прогресс</div>
          </div>
        </div>
      </div>

      {/* Лидеры */}
      <div className="glass rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">👑</span> Лидеры по достижениям
        </h3>
        <div className="space-y-3">
          {topAchievers.map((student, index) => (
            <div 
              key={student.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/50 hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {student.lastName} {student.firstName}
                </div>
                <div className="text-sm text-gray-500">
                  {student.totalUnlocked} достижений
                </div>
              </div>
              <div className="flex gap-1">
                {student.achievements.slice(0, 5).map(achievement => (
                  <div 
                    key={achievement.id}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      achievement.unlocked 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-gray-100 text-gray-300'
                    }`}
                    title={achievement.title}
                  >
                    {achievement.icon}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Детальная информация по ученику */}
      {studentAchievements.length > 0 && (
        <div className="glass rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Достижения: {studentAchievements[0].lastName} {studentAchievements[0].firstName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentAchievements[0].achievements.map(achievement => (
              <div 
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{achievement.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{achievement.description}</div>
                    {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Прогресс</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="text-yellow-500">
                      <Award className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
