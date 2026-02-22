import React, { useMemo } from 'react';
import { useData } from '../../context';
import { SUBJECTS, MONTH_NAMES_GEN, formatDate } from '../../data';
import {
  Users, Award, ClipboardList, AlertTriangle, BarChart3
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { students, grades, lessons, tests, attendance } = useData();
  const today = formatDate(new Date());
  const todayLessons = lessons.filter(l => l.date === today).sort((a, b) => a.lessonNumber - b.lessonNumber);

  const existingStudentIds = new Set(students.map(s => s.id));
  const filteredGrades = grades.filter(g => existingStudentIds.has(g.studentId));
  const avgGrade = filteredGrades.length > 0 
    ? (filteredGrades.reduce((s, g) => s + g.value, 0) / filteredGrades.length).toFixed(2) 
    : '—';
  const absentCount = attendance.filter(a => a.type === 'Н' && existingStudentIds.has(a.studentId)).length;

  const topStudents = useMemo(() => {
    return students.map(s => {
      const sg = filteredGrades.filter(g => g.studentId === s.id);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { ...s, avg, count: sg.length };
    }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);
  }, [students, filteredGrades]);

  const weakStudents = useMemo(() => {
    return students.map(s => {
      const sg = filteredGrades.filter(g => g.studentId === s.id);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { ...s, avg, count: sg.length };
    }).filter(s => s.count > 0).sort((a, b) => a.avg - b.avg).slice(0, 5);
  }, [students, filteredGrades]);

  const avgBySubject = useMemo(() => {
    return SUBJECTS.map(s => {
      const sg = filteredGrades.filter(g => g.subject === s);
      const avg = sg.length > 0 ? sg.reduce((a, g) => a + g.value, 0) / sg.length : 0;
      return { subject: s, avg, count: sg.length };
    }).filter(s => s.count > 0);
  }, [filteredGrades]);

  const distribution = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0 };
    filteredGrades.forEach(g => { 
      d[g.value as keyof typeof d] = (d[g.value as keyof typeof d] || 0) + 1; 
    });
    return d;
  }, [filteredGrades]);

  const totalGrades = filteredGrades.length;

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20">
        <h1 className="text-2xl font-semibold mb-2">Добро пожаловать!</h1>
        <p className="text-blue-100">
          {new Date().getDate()} {MONTH_NAMES_GEN[new Date().getMonth()]} · {students.length} учеников · {todayLessons.length} уроков сегодня
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Учеников</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Средний балл</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{avgGrade}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Оценок</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{filteredGrades.length}</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Пропуски (Н)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{absentCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Лучшие ученики</h3>
          <div className="space-y-3">
            {topStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                  i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {i + 1}
                </div>
                <span className="flex-1 font-medium text-gray-900">{s.lastName} {s.firstName}</span>
                <span className="font-semibold text-blue-600">{s.avg.toFixed(2)}</span>
              </div>
            ))}
            {topStudents.length === 0 && <p className="text-gray-400 text-center py-8">Нет данных</p>}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Требуют внимания</h3>
          <div className="space-y-3">
            {weakStudents.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-sm font-medium text-red-600">
                  {i + 1}
                </div>
                <span className="flex-1 font-medium text-gray-900">{s.lastName} {s.firstName}</span>
                <span className="font-semibold text-red-600">{s.avg.toFixed(2)}</span>
              </div>
            ))}
            {weakStudents.length === 0 && <p className="text-gray-400 text-center py-8">Нет данных</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-5">Средний балл по предметам</h3>
          <div className="space-y-4">
            {avgBySubject.map(item => (
              <div key={item.subject}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{item.subject}</span>
                  <span className="font-semibold text-gray-900">{item.avg.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.avg >= 4.5 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                      item.avg >= 3.5 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 
                      item.avg >= 2.5 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${(item.avg / 5) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-12">Распределение оценок</h3>
          <div className="flex items-end justify-center gap-8 h-52 mt-6">
            {[5, 4, 3, 2].map(v => {
              const count = distribution[v as keyof typeof distribution] || 0;
              const pct = totalGrades > 0 ? (count / totalGrades) * 100 : 0;
              const colors = {
                5: 'bg-gradient-to-t from-green-400 to-green-500',
                4: 'bg-gradient-to-t from-blue-400 to-blue-500',
                3: 'bg-gradient-to-t from-yellow-400 to-yellow-500',
                2: 'bg-gradient-to-t from-red-400 to-red-500'
              };
              return (
                <div key={v} className="flex flex-col items-center gap-3">
                  <span className="text-lg font-semibold text-gray-700">{count}</span>
                  <div 
                    className={`w-16 rounded-t-lg ${colors[v as keyof typeof colors]} shadow-md`}
                    style={{ height: `${Math.max(pct * 1.8, 12)}px` }} 
                  />
                  <span className="text-sm font-medium text-gray-600">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {todayLessons.length > 0 && (
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/50 p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Расписание на сегодня</h3>
          <div className="space-y-3">
            {todayLessons.map(l => (
              <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-medium text-white shadow-md">
                  {l.lessonNumber}
                </div>
                <span className="flex-1 font-medium text-gray-900">{l.subject}</span>
                {l.startTime && (
                  <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg">
                    {l.startTime}-{l.endTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{tests.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Тестов</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{SUBJECTS.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Предметов</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{lessons.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Уроков в расписании</div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-xl border border-white/50 p-5 text-center shadow-lg">
          <div className="text-3xl font-bold text-gray-900">{attendance.length}</div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Отметок посещаемости</div>
        </div>
      </div>
    </div>
  );
};
