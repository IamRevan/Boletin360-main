import React from 'react';
import { type User, ModalType } from '../types';
import { api } from '../lib/api';
import { UserTable } from './UserTable';
import { PlusIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';

export const SettingsPage: React.FC = () => {
  const { users } = useAppState();
  const dispatch = useAppDispatch();

  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddUser } });
  const onEdit = (user: User) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditUser, data: user } });
  const onDelete = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    const userEmail = user ? user.email : 'este usuario';
    if (window.confirm(`¿Está seguro que desea eliminar al usuario '${userEmail}'?`)) {
      try {
        await api.deleteUser(userId);
        dispatch({ type: ActionType.DELETE_USER, payload: userId });
      } catch (error) {
        console.error("Failed to delete user", error);
        alert("Error al eliminar usuario");
      }
    }
  };
  const onSave = (user: User) => {
    dispatch({ type: ActionType.SAVE_USER, payload: user });
  };
  const onResetPassword = (user: User) => {
    dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.ResetPassword, data: user } });
  };


  return (
    <div className="space-y-8">
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