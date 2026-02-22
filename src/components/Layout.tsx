import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Settings } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">ОГЭ Подготовка</h1>
            </div>
            
            <nav className="flex space-x-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === '/' 
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Расписание
              </Link>
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === '/admin' 
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Админ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white/80 backdrop-blur border-t border-gray-200/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Центр подготовки к ОГЭ. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
