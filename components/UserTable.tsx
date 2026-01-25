'use client';


import React, { useState, useRef, useEffect } from 'react';
import { type User, UserRole } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon } from './Icons';
import { Avatar } from './ui/Avatar';

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
  const roleClasses = {
    [UserRole.Admin]: 'bg-moon-purple/20 text-moon-purple-light',
    [UserRole.ControlEstudios]: 'bg-moon-green/20 text-moon-green',
    [UserRole.Teacher]: 'bg-moon-blue/20 text-moon-blue',
  };
  return <span className={`${baseClasses} ${roleClasses[role]}`}>{role}</span>;
};

const TableRowActions: React.FC<{ user: User; onEdit: (user: User) => void; onDelete: (userId: number) => void; onResetPassword: (user: User) => void; }> = ({ user, onEdit, onDelete, onResetPassword }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-moon-border transition-colors">
        <MoreVerticalIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-moon-component rounded-lg shadow-lg border border-moon-border z-10 animate-[fade-in_0.1s_ease-out]">
          <div className="p-2">
            <button onClick={() => { onEdit(user); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onResetPassword(user); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <span className="w-4 h-4 flex items-center justify-center">🔑</span>
              <span className="ml-3">Cambiar Clave</span>
            </button>
            <button onClick={() => { onDelete(user.id); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onSave: (user: User) => void;
  onResetPassword: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onSave, onResetPassword }) => {

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>, user: User) => {
    const newRole = e.target.value as UserRole;
    onSave({ ...user, role: newRole });
  };

  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Usuarios</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Gestiona los usuarios que pueden acceder al sistema.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Usuario</th>
              <th scope="col" className="px-6 py-3">Rol</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-10 text-moon-text-secondary">No se encontraron usuarios.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar name={`${user.nombres} ${user.apellidos}`} className="w-9 h-9 mr-3 text-xs" />
                      <div>
                        <div>{user.nombres} {user.apellidos}</div>
                        <div className="text-xs text-moon-text-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(e, user)}
                      className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableRowActions user={user} onEdit={onEdit} onDelete={onDelete} onResetPassword={onResetPassword} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
