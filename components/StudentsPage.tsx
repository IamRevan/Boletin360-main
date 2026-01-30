'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { type Student, UserRole, ModalType } from '../types';
import { api } from '../lib/api';
import { StudentTable } from './StudentTable';
import { PlusIcon, UploadIcon, DownloadIcon, SearchIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { ExcelImportModal } from './ExcelImportModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import * as XLSX from 'xlsx';
import { useToast } from '../state/ToastContext';

// Página de Gestión de Estudiantes
export const StudentsPage: React.FC = () => {
  const { students, grados, secciones, currentUser, isLoading } = useAppState();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  // Estado para modal de importación
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', grade: '', section: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 8;

  // Estado para el input de paginación manual
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    studentId: number | null;
    studentName: string;
  }>({ isOpen: false, studentId: null, studentName: '' });

  if (!currentUser) return null;
  const isTeacher = currentUser.role === UserRole.DOCENTE;
  const isControlEstudios = currentUser.role === UserRole.CONTROL_ESTUDIOS;
  const canManageStudents = !isTeacher; // Admin y ControlEstudios pueden gestionar

  // Handlers para abrir modales
  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddStudent } });
  const onEdit = (student: Student) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditStudent, data: student } });

  // Handler para mostrar diálogo de confirmación antes de eliminar
  const onDelete = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    const studentName = student ? `${student.nombres} ${student.apellidos}` : 'este estudiante';
    setConfirmDialog({ isOpen: true, studentId, studentName });
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (confirmDialog.studentId === null) return;
    try {
      await api.deleteStudent(confirmDialog.studentId);
      dispatch({ type: ActionType.DELETE_STUDENT, payload: confirmDialog.studentId });
      addToast('Estudiante eliminado correctamente', 'success');
    } catch (error) {
      console.error("Failed to delete student", error);
      addToast('Error al eliminar estudiante', 'error');
    }
    setConfirmDialog({ isOpen: false, studentId: null, studentName: '' });
  };


  // Filtrado de estudiantes en memoria
  const filteredStudents = useMemo(() => {
    // El array `students` del estado ya está filtrado para docentes si aplica (en backend/contexto)
    return students.filter(student => {
      const searchLower = filters.search.toLowerCase();
      // Búsqueda por nombre, apellido o cédula
      const matchesSearch = filters.search === '' ||
        student.nombres.toLowerCase().includes(searchLower) ||
        student.apellidos.toLowerCase().includes(searchLower) ||
        student.cedula.includes(searchLower);
      // Filtros por grado y sección
      const matchesGrade = filters.grade === '' || student.id_grado === parseInt(filters.grade, 10);
      const matchesSection = filters.section === '' || student.id_seccion === parseInt(filters.section, 10);
      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [students, filters]);

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;

  // Efecto para ajustar la página actual si se vuelve inválida tras filtrar/eliminar
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

  // Manejo de cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Regresar a página 1 al filtrar
  };

  const clearFilters = () => {
    setFilters({ search: '', grade: '', section: '' });
    setCurrentPage(1);
  }

  // --- Lógica de Input de Paginación ---
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9\b]+$/.test(value)) {
      setPageInput(value);
    }
  };

  const goToPage = (page: string) => {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInput(currentPage.toString()); // Revertir si es inválido
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      goToPage(pageInput);
      e.currentTarget.blur();
    }
  };

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    goToPage(e.target.value);
  };
  // --- Fin Lógica de Paginación ---

  // Función de exportar a Excel
  const handleExport = () => {
    try {
      // Preparar datos para Excel
      const exportData = students.map(s => ({
        Nacionalidad: s.nacionalidad,
        Cedula: s.cedula,
        Nombres: s.nombres,
        Apellidos: s.apellidos,
        Email: s.email || '',
        Genero: s.genero || '',
        Grado: grados.find(g => g.id_grado === s.id_grado)?.nombre_grado || '',
        Seccion: secciones.find(sec => sec.id_seccion === s.id_seccion)?.nombre_seccion || '',
        Estado: s.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
      XLSX.writeFile(workbook, `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('Estudiantes exportados correctamente', 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      addToast('Error al exportar estudiantes', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Modal de Importación */}
      <ExcelImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Estudiante"
        message={`¿Está seguro que desea eliminar a "${confirmDialog.studentName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, studentId: null, studentName: '' })}
      />
      {/* Header de la página */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestión de Estudiantes</h2>
          <p className="text-moon-text-secondary mt-1">Administra la información de los estudiantes.</p>
        </div>
        {/* Acciones solo visibles para Admin (No Teachers) */}
        {!isTeacher && (
          <div className="flex space-x-3">
            <button onClick={() => setIsImportModalOpen(true)} className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <UploadIcon /> <span className="ml-2 hidden sm:inline">Importar</span>
            </button>
            <button onClick={handleExport} className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <DownloadIcon /> <span className="ml-2 hidden sm:inline">Exportar</span>
            </button>
            <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Estudiante</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-moon-component rounded-xl border border-moon-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nombre, apellido o cédula..." className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 pl-10 pr-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Grado</label>
            <select name="grade" value={filters.grade} onChange={handleFilterChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent">
              <option value="">Todos</option>
              {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Sección</label>
            <select name="section" value={filters.section} onChange={handleFilterChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent">
              <option value="">Todas</option>
              {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={clearFilters} className="text-moon-text-secondary hover:text-white text-sm font-medium">Limpiar filtros</button>
        </div>
      </div>

      {/* Tabla de Estudiantes */}
      {/* Tabla de Estudiantes */}
      <StudentTable students={paginatedStudents} grados={grados} secciones={secciones} onEdit={onEdit} onDelete={onDelete} readOnly={isTeacher} isLoading={isLoading} />

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <p className="text-moon-text-secondary">
            Total de <span className="font-semibold text-moon-text">{filteredStudents.length}</span> estudiantes
          </p>
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-moon-component hover:bg-moon-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Anterior</button>

            <div className="flex items-center space-x-2">
              <span className="text-moon-text-secondary">Página</span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                onBlur={handlePageInputBlur}
                className="w-14 bg-moon-nav border border-moon-border rounded-lg py-2 px-2 text-center text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light"
              />
              <span className="text-moon-text-secondary">de {totalPages}</span>
            </div>

            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-moon-component hover:bg-moon-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
};
