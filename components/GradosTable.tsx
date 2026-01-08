'use client';

import React, { useState, useRef, useEffect } from 'react';
import { type Grado } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon, BookOpenIcon } from './Icons';

// Acciones por fila (Dropdown)
const TableRowActions: React.FC<{ grado: Grado; onEdit: (grado: Grado) => void; onDelete: (gradoId: number) => void; }> = ({ grado, onEdit, onDelete }) => {
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
            <button onClick={() => { onEdit(grado); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onDelete(grado.id_grado); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface GradosTableProps {
  grados: Grado[];
  onEdit: (grado: Grado) => void;
  onDelete: (gradoId: number) => void;
}

// Tabla para lista de Grados
export const GradosTable: React.FC<GradosTableProps> = ({ grados, onEdit, onDelete }) => {
  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Grados</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Lista de todos los grados académicos registrados.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Nombre del Grado</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grados.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-10 text-moon-text-secondary">No se encontraron grados.</td>
              </tr>
            ) : (
              grados.map((grado) => (
                <tr key={grado.id_grado} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-moon-purple/20 flex items-center justify-center mr-3">
                        <BookOpenIcon />
                      </div>
                      {grado.nombre_grado}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableRowActions grado={grado} onEdit={onEdit} onDelete={onDelete} />
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
