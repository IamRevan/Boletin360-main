'use client';


import React, { useState, useEffect, useMemo } from 'react';
import { type User, UserRole } from '../types';
import { XIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';

const initialFormState: Omit<User, 'id'> & { confirmPassword?: string } = {
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: UserRole.DOCENTE,
  teacherId: null,
};

export const AddUserModal: React.FC = () => {
  const { modalState, users, teachers } = useAppState();
  const dispatch = useAppDispatch();

  const userToEdit = modalState.data as User | null;
  const isEditing = userToEdit !== null;

  const [formData, setFormData] = useState(initialFormState);

  const onClose = () => dispatch({ type: ActionType.CLOSE_MODAL });

  const unlinkedTeachers = useMemo(() => {
    const linkedTeacherIds = new Set(users.map(u => u.teacherId).filter(Boolean));
    // If we are editing, the current user's teacher is also available in the list
    if (isEditing && userToEdit.teacherId) {
      linkedTeacherIds.delete(userToEdit.teacherId);
    }
    return teachers.filter(t => !linkedTeacherIds.has(t.id));
  }, [users, teachers, isEditing, userToEdit]);


  useEffect(() => {
    if (isEditing) {
      setFormData({ ...userToEdit, password: '', confirmPassword: '' }); // Don't show password when editing
    } else {
      setFormData(initialFormState);
    }
  }, [userToEdit, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (!isEditing && !formData.password) {
      alert("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }

    if (formData.role === UserRole.DOCENTE && !formData.teacherId) {
      alert("Debe seleccionar un perfil de docente para vincularlo a este usuario.");
      return;
    }

    // Clean up data before saving
    const finalData = { ...formData };
    if (finalData.role !== UserRole.DOCENTE) {
      finalData.teacherId = null;
    }
    delete finalData.confirmPassword;


    if (isEditing) {
      const dataToSave: Partial<User> = { nombres: finalData.nombres, apellidos: finalData.apellidos, email: finalData.email, role: finalData.role, teacherId: finalData.teacherId };
      if (finalData.password) {
        dataToSave.password = finalData.password;
      }
      try {
        await api.updateUser(userToEdit.id, dataToSave);
        dispatch({ type: ActionType.SAVE_USER, payload: { ...userToEdit, ...dataToSave } });
        onClose();
      } catch (error) {
        console.error("Failed to update user", error);
      }
    } else {
      try {
        const response = await api.createUser(finalData as Omit<User, 'id'>);
        dispatch({ type: ActionType.SAVE_USER, payload: response.data });
        onClose();
      } catch (error) {
        console.error("Failed to create user", error);
      }
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
          <h3 className="text-xl font-bold text-white">{isEditing ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombres</label>
                <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} placeholder="Ej: Juan" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Apellidos</label>
                <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} placeholder="Ej: Pérez" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nombre@ejemplo.com" required className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Contraseña</label>
                <input type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder={isEditing ? 'Nueva contraseña' : '••••••••'} required={!isEditing} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Confirmar Contraseña</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword || ''} onChange={handleChange} placeholder={isEditing ? 'Confirmar nueva' : '••••••••'} required={!!formData.password} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Rol</label>
              <select name="role" value={formData.role} onChange={handleChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {formData.role === UserRole.DOCENTE && (
              <div className="animate-[fade-in_0.2s_ease-out]">
                <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Vincular a Docente</label>
                <select name="teacherId" value={formData.teacherId || ''} onChange={handleNumericChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5">
                  <option value="">Seleccione un docente...</option>
                  {unlinkedTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.nombres} {t.apellidos}</option>
                  ))}
                </select>
                {unlinkedTeachers.length === 0 && (
                  <p className="text-xs text-moon-orange mt-2">No hay docentes sin cuenta para vincular.</p>
                )}
              </div>
            )}
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
              {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
