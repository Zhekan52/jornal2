import { useState } from 'react';
import { useScheduleStore, SUBJECTS, DAYS, Subject, DayOfWeek, ClassSession, getWeekStart, getPreviousWeek, getNextWeek, formatWeekRange } from '../data/store';
import { Modal } from '../components/Modal';
import { ScheduleGrid } from '../components/ScheduleGrid';
import { Plus, Pencil, Trash2, Search, Filter, Lock, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminPage() {
  const { schedule, addSession, updateSession, deleteSession } = useScheduleStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentWeek, setCurrentWeek] = useState(getWeekStart());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const [formData, setFormData] = useState<Omit<ClassSession, 'id'>>({
    subject: SUBJECTS[0],
    day: DAYS[0],
    startTime: '10:00',
    endTime: '11:30',
    room: '',
    teacher: '',
    weekStart: getWeekStart()
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple hardcoded password
    if (password === 'admin' || password === 'admin123') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleOpenAdd = () => {
    setEditingSession(null);
    setFormData({
      subject: SUBJECTS[0],
      day: DAYS[0],
      startTime: '10:00',
      endTime: '11:30',
      room: '',
      teacher: '',
      weekStart: currentWeek
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (session: ClassSession) => {
    setEditingSession(session);
    setFormData({
      subject: session.subject,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      room: session.room,
      teacher: session.teacher,
      weekStart: session.weekStart
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      updateSession({ ...formData, id: editingSession.id });
    } else {
      addSession(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это занятие?')) {
      deleteSession(id);
      setIsModalOpen(false);
    }
  };

  const filteredSchedule = schedule.filter(session => {
    const matchesSearch = 
      session.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || session.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const isCurrentWeek = currentWeek === getWeekStart();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-md mx-auto px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Вход для администратора</h2>
          <p className="text-center text-gray-500 mb-6">Введите пароль для доступа к панели управления.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••"
                autoFocus
              />
              {loginError && <p className="text-red-500 text-sm mt-1">Неверный пароль</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Управление расписанием</h2>
          <p className="text-gray-500">Добавляйте и редактируйте занятия.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Список"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Сетка расписания"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex flex-1 sm:flex-initial justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Добавить занятие</span>
            <span className="sm:hidden">Добавить</span>
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div>
          <div className="mb-4 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Нажмите на карточку занятия, чтобы отредактировать его.
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setCurrentWeek(getPreviousWeek(currentWeek))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Предыдущая неделя"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{formatWeekRange(currentWeek)}</div>
              {isCurrentWeek && <div className="text-sm text-indigo-600 font-medium">Текущая неделя</div>}
            </div>

            <button
              onClick={() => setCurrentWeek(getNextWeek(currentWeek))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Следующая неделя"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <ScheduleGrid weekStart={currentWeek} onSessionClick={handleOpenEdit} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 bg-gray-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по преподавателю или аудитории..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative min-w-[200px]">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="all">Все предметы</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">Предмет</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">День</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Время</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Аудитория</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Преподаватель</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">Неделя</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSchedule.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{session.subject}</td>
                    <td className="px-6 py-4 text-gray-600">{session.day}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{session.startTime} - {session.endTime}</td>
                    <td className="px-6 py-4 text-gray-600">{session.room}</td>
                    <td className="px-6 py-4 text-gray-600">{session.teacher}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs whitespace-nowrap">{formatWeekRange(session.weekStart)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(session)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSchedule.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Занятия не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'Редактировать занятие' : 'Новое занятие'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">День недели</label>
            <select
              required
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Конец</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Аудитория</label>
            <input
              type="text"
              required
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Например: 101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Преподаватель</label>
            <input
              type="text"
              required
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ФИО преподавателя"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Неделя</label>
            <div className="relative">
              <input
                type="text"
                value={formatWeekRange(formData.weekStart)}
                readOnly
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, weekStart: getPreviousWeek(formData.weekStart) })}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Предыдущая неделя"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, weekStart: getNextWeek(formData.weekStart) })}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Следующая неделя"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3">
             {editingSession && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingSession.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
             )}
             <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  {editingSession ? 'Сохранить' : 'Добавить'}
                </button>
             </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
