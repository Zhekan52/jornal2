import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AnalyticsChartsProps {
  students: any[];
  grades: any[];
  attendance: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsCharts({ students, grades, attendance, lessons }: AnalyticsChartsProps) {
  // Данные для графика успеваемости по предметам
  const subjectPerformance = useMemo(() => {
    const subjects = ['Русский язык', 'Математика', 'Обществознание', 'География'];
    return subjects.map(subject => {
      const subjectGrades = grades.filter(g => g.subject === subject);
      const avg = subjectGrades.length > 0 
        ? subjectGrades.reduce((sum, g) => sum + g.value, 0) / subjectGrades.length 
        : 0;
      return {
        subject: subject.substring(0, 10),
        average: avg.toFixed(2),
        count: subjectGrades.length
      };
    });
  }, [grades]);

  // Данные для графика посещаемости
  const attendanceData = useMemo(() => {
    const present = attendance.filter(a => a.type === 'П').length;
    const absent = attendance.filter(a => a.type === 'Н').length;
    const late = attendance.filter(a => a.type === 'ОП').length;
    const excused = attendance.filter(a => a.type === 'ОУ').length;
    
    return [
      { name: 'Присутствовал', value: present, color: '#10b981' },
      { name: 'Отсутствовал', value: absent, color: '#ef4444' },
      { name: 'Опоздал', value: late, color: '#f59e0b' },
      { name: 'Уваж.', value: excused, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [attendance]);

  // Данные для графика динамики оценок ученика
  const studentProgress = useMemo(() => {
    if (students.length === 0 || grades.length === 0) return [];
    
    // Берем первого ученика для примера
    const studentId = students[0].id;
    const studentGrades = grades
      .filter(g => g.studentId === studentId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // Последние 10 оценок
    
    return studentGrades.map(g => ({
      date: new Date(g.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      grade: g.value,
      subject: g.subject.substring(0, 8)
    }));
  }, [students, grades]);

  // Данные для графика сравнения тестов
  const testComparison = useMemo(() => {
    // Симуляция данных для тестов
    return [
      { name: 'Тренировочный 1', score: 65 },
      { name: 'Тренировочный 2', score: 72 },
      { name: 'Тренировочный 3', score: 78 },
      { name: 'Настоящий тест', score: 85 },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* График успеваемости по предметам */}
      <div className="glass rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span> Средний балл по предметам
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={subjectPerformance}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="subject" 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 5]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="average" 
              fill="url(#barGradient)" 
              radius={[8, 8, 0, 0]}
            >
              {subjectPerformance.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* График посещаемости */}
        <div className="glass rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Посещаемость
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={attendanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                labelLine={false}
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* График динамики оценок */}
        <div className="glass rounded-2xl p-6 shadow-soft">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📉</span> Динамика оценок
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={studentProgress}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 5]}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="grade" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* График сравнения тестов */}
      <div className="glass rounded-2xl p-6 shadow-soft">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span> Прогресс тестов
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={testComparison}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="score" 
              fill="url(#testGradient)" 
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="testGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
