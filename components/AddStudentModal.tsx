'use client';


import React, { useState, useEffect, useCallback } from 'react';
import { type Student, StudentStatus } from '../types';
import { XIcon, UserIcon, BookOpenIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<Student, 'id'> = {
  nacionalidad: 'V',
  cedula: '',
  nombres: '',
  apellidos: '',
  email: '',
  genero: 'F',
  fecha_nacimiento: '',
  id_grado: null,
  id_seccion: null,
  status: StudentStatus.Activo,
};

// Modal para Añadir o Editar Estudiante
export const StudentModal: React.FC = () => {
  const { grados, secciones, modalState } = useAppState();
  const dispatch = useAppDispatch();

  // Determinar si estamos editando o creando
  const studentToEdit = modalState.data as Student | null;
  const isEditing = studentToEdit !== null;

  const [formData, setFormData] = useState<Omit<Student, 'id'>>(initialFormState);

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      setFormData({
        ...studentToEdit,
        // Ajustar formato de fecha para input date
        fecha_nacimiento: studentToEdit.fecha_nacimiento ? studentToEdit.fecha_nacimiento.split('T')[0] : '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [studentToEdit, isEditing]);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
  };

  // Enviar formulario (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      fecha_nacimiento: formData.fecha_nacimiento || null,
    };

    try {
      if (isEditing) {
        await api.updateStudent(studentToEdit.id, dataToSave);
        dispatch({ type: ActionType.SAVE_STUDENT, payload: { ...dataToSave, id: studentToEdit.id } });
      } else {
        const response = await api.createStudent(dataToSave);
        dispatch({ type: ActionType.SAVE_STUDENT, payload: response.data });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save student", error);
      // Idealmente mostrar un mensaje de error al usuario
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
    >
      {/* Detener propagación para no cerrar al clickear el modal */}
      <div
        className="bg-moon-component rounded-xl border border-moon-border w-full max-w-3xl m-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-moon-border flex-shrink-0">
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Estudiante' : 'Añadir Nuevo Estudiante'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* Información Personal */}
              <div className="space-y-4 p-4 bg-moon-nav/50 rounded-lg">
                <h4 className="text-lg font-medium text-white flex items-center mb-4"><UserIcon /><span className="ml-2">Información Personal</span></h4>
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
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="María José" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Apellidos</label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="García Rodríguez" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nombre@ejemplo.com" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Género</label>
                    <select name="genero" value={formData.genero} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento || ''} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                  </div>
                </div>
              </div>
              {/* Información Académica */}
              <div className="space-y-4 p-4 bg-moon-nav/50 rounded-lg">
                <h4 className="text-lg font-medium text-white flex items-center mb-4"><BookOpenIcon /><span className="ml-2">Información Académica</span></h4>
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
                <div>
                  <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Estado</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                    {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end p-6 border-t border-moon-border rounded-b-xl space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-moon-border hover:bg-opacity-80 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-moon-purple hover:bg-moon-purple-light text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
              {isEditing ? 'Guardar Cambios' : 'Registrar Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
