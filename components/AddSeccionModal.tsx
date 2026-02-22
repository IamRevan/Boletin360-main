'use client';


import React, { useState, useEffect } from 'react';
import { type Seccion } from '../types';
import { XIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<Seccion, 'id'> = {
  nombreSeccion: '',
  idGrado: 0,
};

// Modal para Crear/Edit Sección
export const AddSeccionModal: React.FC = () => {
  const { modalState, grados } = useAppState();
  const dispatch = useAppDispatch();
  const seccionToEdit = modalState.data as Seccion | null;
  const isEditing = seccionToEdit !== null;

  const [formData, setFormData] = useState<Omit<Seccion, 'id'>>(initialFormState);

  // Cargar datos en edición
  useEffect(() => {
    if (isEditing) {
      setFormData(seccionToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [seccionToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'idGrado' ? Number(value) : value
    }));
  };

  // Enviar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateSeccion(seccionToEdit.id, formData);
        dispatch({ type: ActionType.SAVE_SECCION, payload: { ...formData, id: seccionToEdit.id } as Seccion });
      } else {
        const response = await api.createSeccion({
          nombreSeccion: formData.nombreSeccion,
          idGrado: formData.idGrado
        });
        dispatch({ type: ActionType.SAVE_SECCION, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save seccion", error);
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
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Sección' : 'Añadir Nueva Sección'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombre de la Sección</label>
            <input
              type="text"
              name="nombreSeccion"
              value={formData.nombreSeccion}
              onChange={handleChange}
              placeholder="Ej: A"
              required
              className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5 mb-4"
            />

            <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Grado al que Pertenece</label>
            <select
              name="idGrado"
              value={formData.idGrado || ''}
              onChange={handleChange}
              required
              className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5"
            >
              <option value="" disabled>Seleccione un Grado...</option>
              {grados.map(g => (
                <option key={g.id} value={g.id}>{g.nombreGrado}</option>
              ))}
            </select>
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
              {isEditing ? 'Guardar Cambios' : 'Crear Sección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
