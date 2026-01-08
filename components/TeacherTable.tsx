'use client';


import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { type Teacher, TeacherStatus } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon } from './Icons';

// Badge de estado para Docentes
const StatusBadge: React.FC<{ status: TeacherStatus }> = ({ status }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
  const statusClasses = {
    [TeacherStatus.Activo]: 'bg-moon-green/20 text-moon-green',
    [TeacherStatus.Inactivo]: 'bg-moon-orange/20 text-moon-orange',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

// Menú de acciones por fila
const TableRowActions: React.FC<{ teacher: Teacher; onEdit: (teacher: Teacher) => void; onDelete: (teacherId: number) => void; }> = ({ teacher, onEdit, onDelete }) => {
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
            <button onClick={() => { onEdit(teacher); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onDelete(teacher.id); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


interface TeacherTableProps {
  teachers: Teacher[];
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacherId: number) => void;
}

// Tabla principal de Docentes
export const TeacherTable: React.FC<TeacherTableProps> = ({ teachers, onEdit, onDelete }) => {
  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Docentes</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Lista de todos los docentes registrados.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Docente</th>
              <th scope="col" className="px-6 py-3">Cédula</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-moon-text-secondary">No se encontraron docentes.</td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <Image className="rounded-full object-cover mr-3" src={`https://i.pravatar.cc/150?u=${teacher.email}`} alt={teacher.apellidos} width={36} height={36} />
                      <div>
                        <div>{teacher.nombres} {teacher.apellidos}</div>
                        <div className="text-xs text-moon-text-secondary">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{teacher.nacionalidad}-{teacher.cedula}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={teacher.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableRowActions teacher={teacher} onEdit={onEdit} onDelete={onDelete} />
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
