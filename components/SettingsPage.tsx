'use client';

import React, { useState } from 'react';
import { type User, ModalType } from '../types';
import { api } from '../lib/api';
import { UserTable } from './UserTable';
import { PlusIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from '../state/ToastContext';

export const SettingsPage: React.FC = () => {
  const { users } = useAppState();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userEmail: string;
  }>({ isOpen: false, userId: null, userEmail: '' });

  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddUser } });
  const onEdit = (user: User) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditUser, data: user } });

  // Mostrar diálogo de confirmación
  const onDelete = (userId: number) => {
    const user = users.find(u => u.id === userId);
    const userEmail = user ? user.email : 'este usuario';
    setConfirmDialog({ isOpen: true, userId, userEmail });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (confirmDialog.userId === null) return;
    try {
      await api.deleteUser(confirmDialog.userId);
      dispatch({ type: ActionType.DELETE_USER, payload: confirmDialog.userId });
      addToast('Usuario eliminado correctamente', 'success');
    } catch (error) {
      console.error("Failed to delete user", error);
      addToast('Error al eliminar usuario', 'error');
    }
    setConfirmDialog({ isOpen: false, userId: null, userEmail: '' });
  };

  const onSave = (user: User) => {
    dispatch({ type: ActionType.SAVE_USER, payload: user });
  };
  const onResetPassword = (user: User) => {
    dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.ResetPassword, data: user } });
  };


  return (
    <div className="space-y-8">
      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar Usuario"
        message={`¿Está seguro que desea eliminar al usuario "${confirmDialog.userEmail}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, userId: null, userEmail: '' })}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Configuración del Sistema</h2>
          <p className="text-moon-text-secondary mt-1">Administra los usuarios y los roles del sistema.</p>
        </div>
        <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
          <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Usuario</span>
        </button>
      </div>

      <UserTable users={users} onEdit={onEdit} onDelete={onDelete} onSave={onSave} onResetPassword={onResetPassword} />
    </div>
  );
};