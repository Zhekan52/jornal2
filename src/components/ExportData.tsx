import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

interface ExportDataProps {
  students: any[];
  grades: any[];
  attendance: any[];
  diaryEntries: any[];
  selectedSubject: string;
}

export function ExportData({ 
  students, grades, attendance, diaryEntries, selectedSubject 
}: ExportDataProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Экспорт в Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      // Подготовка данных для экспорта
      const data = students.map(student => {
        const studentGrades = grades.filter(g => g.studentId === student.id && g.subject === selectedSubject);
        const avgGrade = studentGrades.length > 0 
          ? (studentGrades.reduce((sum: number, g: any) => sum + g.value, 0) / studentGrades.length).toFixed(2)
          : '—';
        
        const studentAttendance = attendance.filter(a => a.studentId === student.id && a.subject === selectedSubject);
        const presentCount = studentAttendance.filter(a => a.type === 'П').length;
        const absentCount = studentAttendance.filter(a => a.type === 'Н').length;
        
        return {
          '№': students.indexOf(student) + 1,
          'ФИО': `${student.lastName} ${student.firstName}`,
          'Класс': student.className || '—',
          'Средний балл': avgGrade,
          'Количество оценок': studentGrades.length,
          'Присутствовал': presentCount,
          'Отсутствовал': absentCount,
        };
      });

      // Создание workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Журнал');

      // Стилизация заголовков
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key]).length))
      }));
      ws['!cols'] = colWidths;

      // Сохранение файла
      XLSX.writeFile(wb, `Журнал_${selectedSubject}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте данных');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  // Экспорт в PDF
  const exportToPDF = () => {
    setExporting(true);
    try {
      const element = document.getElementById('journal-table');
      if (!element) {
        alert('Таблица не найдена');
        setExporting(false);
        return;
      }

      const opt = {
        margin: 10,
        filename: `Журнал_${selectedSubject}_${new Date().toLocaleDateString('ru-RU')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте PDF');
    } finally {
      setTimeout(() => setExporting(false), 2000);
      setShowExportModal(false);
    }
  };

  // Экспорт отчёта по ученику
  const exportStudentReport = (studentId: string) => {
    setExporting(true);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const studentGrades = grades.filter(g => g.studentId === studentId);
      const studentAttendance = attendance.filter(a => a.studentId === studentId);
      const studentDiary = diaryEntries.filter(d => d.subject === selectedSubject);

      // Группировка оценок по предметам
      const gradesBySubject = {};
      studentGrades.forEach(g => {
        if (!gradesBySubject[g.subject]) {
          gradesBySubject[g.subject] = [];
        }
        gradesBySubject[g.subject].push(g);
      });

      // Подготовка данных для отчёта
      const reportData = {
        'Личная информация': {
          'ФИО': `${student.lastName} ${student.firstName}`,
          'Класс': student.className || '—',
        },
        'Успеваемость': Object.keys(gradesBySubject).map(subject => {
          const subjectGrades = gradesBySubject[subject];
          const avg = (subjectGrades.reduce((sum, g) => sum + g.value, 0) / subjectGrades.length).toFixed(2);
          return {
            'Предмет': subject,
            'Количество оценок': subjectGrades.length,
            'Средний балл': avg,
          };
        }),
        'Посещаемость': {
          'Всего отметок': studentAttendance.length,
          'Присутствовал': studentAttendance.filter(a => a.type === 'П').length,
          'Отсутствовал': studentAttendance.filter(a => a.type === 'Н').length,
          'Опоздал': studentAttendance.filter(a => a.type === 'ОП').length,
        },
      };

      const ws = XLSX.utils.json_to_sheet(reportData['Успеваемость']);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Успеваемость');

      // Добавляем лист с посещаемостью
      const attendanceWs = XLSX.utils.json_to_sheet([reportData['Посещаемость']]);
      XLSX.utils.book_append_sheet(wb, attendanceWs, 'Посещаемость');

      XLSX.writeFile(wb, `Отчёт_${student.lastName}_${student.firstName}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте отчёта');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowExportModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-soft transition-all font-medium text-sm"
      >
        <Download className="w-4 h-4" />
        Экспорт
      </button>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowExportModal(false)}>
          <div 
            className="glass-dark shadow-soft-xl w-full max-w-md p-6 space-y-6 animate-scaleIn"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Экспорт данных</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl hover:bg-white/60 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="w-full flex items-center gap-4 p-4 bg-white/60 hover:bg-white rounded-2xl transition-all border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Excel</div>
                  <div className="text-sm text-gray-500">Экспорт журнала в Excel</div>
                </div>
              </button>

              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full flex items-center gap-4 p-4 bg-white/60 hover:bg-white rounded-2xl transition-all border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">PDF</div>
                  <div className="text-sm text-gray-500">Экспорт журнала в PDF</div>
                </div>
              </button>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3">Экспорт отчёта по ученику:</div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {students.slice(0, 10).map(student => (
                    <button
                      key={student.id}
                      onClick={() => exportStudentReport(student.id)}
                      disabled={exporting}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors disabled:opacity-50"
                    >
                      {student.lastName} {student.firstName}
                    </button>
                  ))}
                  {students.length > 10 && (
                    <div className="text-center text-xs text-gray-500 pt-2">
                      ...и ещё {students.length - 10} учеников
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
