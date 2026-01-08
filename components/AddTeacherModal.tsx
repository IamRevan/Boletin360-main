'use client';


import React, { useState, useEffect } from 'react';
import { type Teacher, TeacherStatus } from '../types';
import { XIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<Teacher, 'id'> = {
  nacionalidad: 'V',
  cedula: '',
  nombres: '',
  apellidos: '',
  email: '',
  status: TeacherStatus.Activo,
};

// Modal para Añadir o Editar Docente
export const TeacherModal: React.FC = () => {
  const { modalState } = useAppState();
  const dispatch = useAppDispatch();

  const teacherToEdit = modalState.data as Teacher | null;
  const isEditing = teacherToEdit !== null;

  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>(initialFormState);

  // Cargar datos para edición
  useEffect(() => {
    if (isEditing) {
      setFormData(teacherToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [teacherToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulario (Crear o Editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.updateTeacher(teacherToEdit.id, formData);
        dispatch({ type: ActionType.SAVE_TEACHER, payload: { ...formData, id: teacherToEdit.id } });
      } else {
        const response = await api.createTeacher(formData);
        dispatch({ type: ActionType.SAVE_TEACHER, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save teacher", error);
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
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Docente' : 'Añadir Nuevo Docente'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nac.</label>
                <select name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                  <option value="V">V</option>
                  <option value="E">E</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Cédula</label>
                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} placeholder="12345678" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombres</label>
                <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Juan" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Apellidos</label>
                <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Pérez" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nombre@ejemplo.com" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                {Object.values(TeacherStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
              {isEditing ? 'Guardar Cambios' : 'Registrar Docente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
