'use client';

import React, { useState, useMemo } from 'react';
import { type Materia, type Teacher, type Grado, type Seccion, UserRole, ModalType } from '../types';
import { api } from '../lib/api';
import { MateriaTable } from './MateriaTable';
import { PlusIcon, UploadIcon, DownloadIcon, SearchIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from '../state/ToastContext';

// Página de Gestión de Materias
export const MateriasPage: React.FC = () => {
  const { materias, teachers, grados, secciones, currentUser } = useAppState();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const materiasPerPage = 8;

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    materiaId: number | null;
    materiaName: string;
  }>({ isOpen: false, materiaId: null, materiaName: '' });

  if (!currentUser) return null;
  const isTeacher = currentUser.role === UserRole.DOCENTE;

  // Handlers para acciones
  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddMateria } });
  const onEdit = (materia: Materia) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditMateria, data: materia } });

  // Mostrar diálogo de confirmación
  const onDelete = (materiaId: number) => {
    const materia = materias.find(m => m.id === materiaId);
    const materiaName = materia ? materia.nombre_materia : 'esta materia';
    setConfirmDialog({ isOpen: true, materiaId, materiaName });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (confirmDialog.materiaId === null) return;
    try {
      await api.deleteMateria(confirmDialog.materiaId);
      dispatch({ type: ActionType.DELETE_MATERIA, payload: confirmDialog.materiaId });
      addToast('Materia eliminada correctamente', 'success');
    } catch (error) {
      console.error("Failed to delete materia", error);
      addToast('Error al eliminar materia', 'error');
    }
    setConfirmDialog({ isOpen: false, materiaId: null, materiaName: '' });
  };

  // Filtrado de materias
  const filteredMaterias = useMemo(() => {
    // El array `materias` del estado ya está filtrado para docentes si aplica
    return materias.filter(materia => {
      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' ||
        materia.nombre_materia.toLowerCase().includes(searchLower);
    });
  }, [materias, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredMaterias.length / materiasPerPage);
  const paginatedMaterias = filteredMaterias.slice((currentPage - 1) * materiasPerPage, currentPage * materiasPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Materia"
        message={`¿Está seguro que desea eliminar la materia "${confirmDialog.materiaName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, materiaId: null, materiaName: '' })}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestión de Materias</h2>
          <p className="text-moon-text-secondary mt-1">Administra las materias y sus asignaciones.</p>
        </div>
        {!isTeacher && (
          <div className="flex space-x-3">
            <button className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <UploadIcon /> <span className="ml-2 hidden sm:inline">Importar</span>
            </button>
            <button className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <DownloadIcon /> <span className="ml-2 hidden sm:inline">Exportar</span>
            </button>
            <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Materia</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-moon-component rounded-xl border border-moon-border p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-moon-text-secondary mb-2">Buscar Materia</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Nombre de la materia..."
              className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 pl-10 pr-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Materias */}
      <MateriaTable
        materias={paginatedMaterias}
        teachers={teachers}
        grados={grados}
        secciones={secciones}
        onEdit={onEdit}
        onDelete={onDelete}
        readOnly={isTeacher}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <p className="text-moon-text-secondary">
            Mostrando {paginatedMaterias.length} de {filteredMaterias.length} materias
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
