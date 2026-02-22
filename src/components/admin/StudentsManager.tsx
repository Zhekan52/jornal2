import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../../context';
import { type Student } from '../../data';
import {
  Plus, Edit2, Trash2, Search, Eye, EyeOff, RefreshCw
} from 'lucide-react';

export const StudentsManager: React.FC = () => {
  const { students, setStudents, setGrades, setAttendance, setTestAttempts, setTestRetakes } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', username: '', password: ''
  });

  const sorted = useMemo(() => {
    return [...students]
      .filter(s => {
        const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [students, search]);

  const generateUsername = (lastName: string, firstName: string) => {
    const ln = lastName.toLowerCase().replace(/[^а-яёa-z]/g, '').slice(0, 8);
    const fn = firstName.toLowerCase().replace(/[^а-яёa-z]/g, '').charAt(0);
    return `${ln}.${fn}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(2, 8);
  };

  const handleNameChange = (field: 'lastName' | 'firstName', value: string) => {
    setFormData(p => {
      const newData = { ...p, [field]: value };
      if (!editingStudent) {
        newData.username = generateUsername(newData.lastName, newData.firstName);
        if (!newData.password) {
          newData.password = generatePassword();
        }
      }
      return newData;
    });
  };

  const regeneratePassword = () => {
    setFormData(p => ({ ...p, password: generatePassword() }));
  };

  const openAdd = () => {
    setEditingStudent(null);
    setFormData({ lastName: '', firstName: '', username: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      lastName: student.lastName,
      firstName: student.firstName,
      username: student.username,
      password: ''
    });
    setShowModal(true);
  };

  const save = () => {
    if (!formData.lastName || !formData.firstName) {
      alert('Заполните ФИО');
      return;
    }
    const username = formData.username || generateUsername(formData.lastName, formData.firstName);
    const password = formData.password || generatePassword();

    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? {
        ...s, lastName: formData.lastName, firstName: formData.firstName, username
      } : s));
    } else {
      const newStudent: Student = {
        id: `st${Date.now()}`,
        lastName: formData.lastName,
        firstName: formData.firstName,
        username,
        password,
        role: 'student'
      };
      setStudents(prev => [...prev, newStudent]);
    }
    setShowModal(false);
  };

  const deleteStudent = (id: string) => {
    if (confirm('Удалить ученика и все его оценки?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setGrades(prev => prev.filter(g => g.studentId !== id));
      setAttendance(prev => prev.filter(a => a.studentId !== id));
      setTestAttempts(prev => prev.filter(a => a.studentId !== id));
      setTestRetakes(prev => prev.filter(r => r.studentId !== id));
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ученики</h2>
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Добавить
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Поиск..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">ФИО</th>
              <th className="px-4 py-3 text-left">Логин</th>
              <th className="px-4 py-3 text-left">Пароль</th>
              <th className="px-4 py-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.lastName} {s.firstName}</td>
                <td className="px-4 py-3 text-gray-600">{s.username}</td>
                <td className="px-4 py-3 text-gray-600">••••••</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => deleteStudent(s.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">{editingStudent ? 'Редактировать' : 'Добавить ученика'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Фамилия</label>
                <input 
                  type="text" 
                  value={formData.lastName} 
                  onChange={e => handleNameChange('lastName', e.target.value)}
                  placeholder="Иванов" 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={e => handleNameChange('firstName', e.target.value)}
                  placeholder="Артём" 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Логин <span className="text-gray-400">(генерируется автоматически)</span></label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                  placeholder="ivanov.a" 
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Пароль <span className="text-gray-400">(генерируется автоматически)</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={formData.password} 
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="Пароль" 
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    onClick={regeneratePassword} 
                    className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={save} 
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                {editingStudent ? 'Сохранить' : 'Добавить'}
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
