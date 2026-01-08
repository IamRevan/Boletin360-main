'use client';


import React, { useState, useEffect } from 'react';
import { type AñoEscolar } from '../types';
import { XIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<AñoEscolar, 'id'> = {
  nombre: '',
};

// Modal para Crear/Editar Año Escolar
export const AddSchoolYearModal: React.FC = () => {
  const { modalState } = useAppState();
  const dispatch = useAppDispatch();

  // Determinar si es modo edición
  const schoolYearToEdit = modalState.data as AñoEscolar | null;
  const isEditing = schoolYearToEdit !== null;

  const [formData, setFormData] = useState<Omit<AñoEscolar, 'id'>>(initialFormState);

  // Cargar datos al abrir en modo edición
  useEffect(() => {
    if (isEditing) {
      setFormData(schoolYearToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [schoolYearToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateSchoolYear(schoolYearToEdit.id, formData);
        dispatch({ type: ActionType.SAVE_SCHOOL_YEAR, payload: { ...formData, id: schoolYearToEdit.id } });
      } else {
        const response = await api.createSchoolYear(formData);
        dispatch({ type: ActionType.SAVE_SCHOOL_YEAR, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save school year", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-moon-component rounded-xl border border-moon-border w-full max-w-lg m-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-moon-border">
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Año Escolar' : 'Añadir Nuevo Año Escolar'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombre del Año Escolar</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: 2024-2025"
              required
              className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
            />
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
              {isEditing ? 'Guardar Cambios' : 'Crear Año Escolar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
