import React, { useState } from 'react';
import { useAuth } from '../context';
import { Schedule } from './Schedule';
import { Tests } from './Tests';
import { BookOpen, Calendar, ClipboardList, Users, LogOut, Tag, BarChart3 } from 'lucide-react';

import { AdminDashboard } from './admin/AdminDashboard';
import { LessonTypesManager } from './admin/LessonTypesManager';
import { Journal } from './admin/Journal';
import { StudentsManager } from './admin/StudentsManager';

type Tab = 'dashboard' | 'schedule' | 'journal' | 'tests' | 'students' | 'lessonTypes';

export const AdminView: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [scheduleEditMode, setScheduleEditMode] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Сводка', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-5 h-5" /> },
    { id: 'journal', label: 'Журнал', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'tests', label: 'Тесты', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'students', label: 'Ученики', icon: <Users className="w-5 h-5" /> },
    { id: 'lessonTypes', label: 'Типы уроков', icon: <Tag className="w-5 h-5" /> },
  ];

  const handleOpenLessonPage = (subject: string, date: string, lessonNumber: number) => {
    localStorage.setItem('open_journal_params', JSON.stringify({ subject, date, lessonNumber }));
    setActiveTab('journal');
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg">Панель управления</span>
            </div>
            <nav className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
              {tabs.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                >
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button 
                onClick={logout} 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'schedule' && <Schedule editable={scheduleEditMode} onEditModeChange={setScheduleEditMode} onOpenLessonPage={handleOpenLessonPage} />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'tests' && <Tests />}
        {activeTab === 'students' && <StudentsManager />}
        {activeTab === 'lessonTypes' && <LessonTypesManager />}
      </main>
    </div>
  );
};
