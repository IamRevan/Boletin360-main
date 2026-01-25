'use client';

import React, { useState, useMemo } from 'react';
import { type Teacher, ModalType } from '../types';
import { api } from '../lib/api';
import { TeacherTable } from './TeacherTable';
import { PlusIcon, UploadIcon, DownloadIcon, SearchIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from '../state/ToastContext';

// Página de Gestión de Docentes
export const TeachersPage: React.FC = () => {
  const { teachers } = useAppState();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 8;

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    teacherId: number | null;
    teacherName: string;
  }>({ isOpen: false, teacherId: null, teacherName: '' });

  // Handlers
  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddTeacher } });
  const onEdit = (teacher: Teacher) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditTeacher, data: teacher } });

  // Mostrar diálogo de confirmación para eliminar
  const onDelete = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher ? `${teacher.nombres} ${teacher.apellidos}` : 'este docente';
    setConfirmDialog({ isOpen: true, teacherId, teacherName });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (confirmDialog.teacherId === null) return;
    try {
      await api.deleteTeacher(confirmDialog.teacherId);
      dispatch({ type: ActionType.DELETE_TEACHER, payload: confirmDialog.teacherId });
      addToast('Docente eliminado correctamente', 'success');
    } catch (error) {
      console.error("Failed to delete teacher", error);
      addToast('Error al eliminar docente', 'error');
    }
    setConfirmDialog({ isOpen: false, teacherId: null, teacherName: '' });
  };

  // Filtro de docentes por nombre, apellido o cédula
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' ||
        teacher.nombres.toLowerCase().includes(searchLower) ||
        teacher.apellidos.toLowerCase().includes(searchLower) ||
        teacher.cedula.includes(searchLower);
    });
  }, [teachers, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * teachersPerPage, currentPage * teachersPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a página 1 al buscar
  };

  return (
    <div className="space-y-8">
      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Docente"
        message={`¿Está seguro que desea eliminar a "${confirmDialog.teacherName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, teacherId: null, teacherName: '' })}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestión de Docentes</h2>
          <p className="text-moon-text-secondary mt-1">Administra la información de los docentes.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
            <UploadIcon /> <span className="ml-2 hidden sm:inline">Importar</span>
          </button>
          <button className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
            <DownloadIcon /> <span className="ml-2 hidden sm:inline">Exportar</span>
          </button>
          <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
            <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Docente</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-moon-component rounded-xl border border-moon-border p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-moon-text-secondary mb-2">Buscar Docente</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Nombre, apellido o cédula..."
              className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 pl-10 pr-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <TeacherTable teachers={paginatedTeachers} onEdit={onEdit} onDelete={onDelete} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <p className="text-moon-text-secondary">
            Mostrando {paginatedTeachers.length} de {filteredTeachers.length} docentes
          </p>
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-moon-component hover:bg-moon-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
            <span className="text-moon-text-secondary">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-moon-component hover:bg-moon-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
};
