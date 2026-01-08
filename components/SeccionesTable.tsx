'use client';

import React, { useState, useRef, useEffect } from 'react';
import { type Seccion } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon, UsersIcon } from './Icons';

// Acciones por fila (Dropdown)
const TableRowActions: React.FC<{ seccion: Seccion; onEdit: (seccion: Seccion) => void; onDelete: (seccionId: number) => void; }> = ({ seccion, onEdit, onDelete }) => {
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
        <div className="absolute right-0 mt-2 w-40 bg-moon-component rounded-lg shadow-lg border border-moon-border z-10 animate-[fade-in_0.1s_ease-out]">
          <div className="p-2">
            <button onClick={() => { onEdit(seccion); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onDelete(seccion.id_seccion); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SeccionesTableProps {
  secciones: Seccion[];
  onEdit: (seccion: Seccion) => void;
  onDelete: (seccionId: number) => void;
}

// Tabla para lista de Secciones
export const SeccionesTable: React.FC<SeccionesTableProps> = ({ secciones, onEdit, onDelete }) => {
  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Secciones</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Lista de todas las secciones registradas.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Nombre de la Sección</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {secciones.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-10 text-moon-text-secondary">No se encontraron secciones.</td>
              </tr>
            ) : (
              secciones.map((seccion) => (
                <tr key={seccion.id_seccion} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-moon-purple/20 flex items-center justify-center mr-3">
                        <UsersIcon />
                      </div>
                      {seccion.nombre_seccion}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableRowActions seccion={seccion} onEdit={onEdit} onDelete={onDelete} />
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
