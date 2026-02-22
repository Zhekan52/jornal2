import { AuthProvider, DataProvider, useAuth, useData } from './context';
import { Login } from './components/Login';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mx-auto mb-6" />
      <p className="text-gray-600 text-lg font-medium animate-pulse-soft">Загрузка данных...</p>
      <p className="text-gray-400 text-sm mt-2">Подключение к базе данных</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { loading } = useData();

  if (!user) return <Login />;
  if (loading) return <LoadingScreen />;
  if (user.role === 'admin') return <AdminView />;
  return <StudentView />;
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
