'use client';


import React, { useState, useEffect } from 'react';
import { type Materia, TeacherStatus } from '../types';
import { XIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<Materia, 'id'> = {
  nombre_materia: '',
  id_docente: null,
  id_grado: null,
  id_seccion: null,
};

// Modal para Crear/Editar Materia
export const MateriaModal: React.FC = () => {
  const { teachers, grados, secciones, modalState } = useAppState();
  const dispatch = useAppDispatch();

  // Determinar modo (crear o editar)
  const materiaToEdit = modalState.data as Materia | null;
  const isEditing = materiaToEdit !== null;

  const [formData, setFormData] = useState<Omit<Materia, 'id'>>(initialFormState);

  // Cargar datos al abrir en modo edición
  useEffect(() => {
    if (isEditing) {
      setFormData(materiaToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [materiaToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
  };

  // Guardar datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateMateria(materiaToEdit.id, formData);
        dispatch({ type: ActionType.SAVE_MATERIA, payload: { ...formData, id: materiaToEdit.id } });
      } else {
        const response = await api.createMateria(formData);
        dispatch({ type: ActionType.SAVE_MATERIA, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save materia", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-moon-component rounded-xl border border-moon-border w-full max-w-lg m-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-moon-border">
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Materia' : 'Añadir Nueva Materia'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 overflow-y-auto">
            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombre de la Materia</label>
              <input type="text" name="nombre_materia" value={formData.nombre_materia} onChange={handleChange} placeholder="Ej: Química" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Docente a Cargo</label>
              <select name="id_docente" value={formData.id_docente || ''} onChange={handleNumericChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                <option value="">Seleccione un docente...</option>
                {teachers.filter(t => t.status === TeacherStatus.ACTIVO).map(t => <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Grado</label>
                <select name="id_grado" value={formData.id_grado || ''} onChange={handleNumericChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                  <option value="">Seleccione...</option>
                  {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Sección</label>
                <select name="id_seccion" value={formData.id_seccion || ''} onChange={handleNumericChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                  <option value="">Seleccione...</option>
                  {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
                </select>
              </div>
            </div>

          </div>
          <div className="flex items-center justify-end p-6 border-t border-moon-border rounded-b-xl space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-moon-border hover:bg-opacity-80 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-moon-purple hover:bg-moon-purple-light text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              {isEditing ? 'Guardar Cambios' : 'Crear Materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
