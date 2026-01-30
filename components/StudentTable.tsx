'use client';

import React, { useState, useRef, useEffect } from 'react';
import { type Student, StudentStatus, Grado, Seccion } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon, UsersIcon } from './Icons';
import { TableSkeleton } from './ui/TableSkeleton';
import { Avatar } from './ui/Avatar';

// Componente para mostrar el badge de estado del estudiante
const StatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
  const statusClasses = {
    [StudentStatus.ACTIVO]: 'bg-moon-green/20 text-moon-green',
    [StudentStatus.INACTIVO]: 'bg-moon-orange/20 text-moon-orange',
    [StudentStatus.RETIRADO]: 'bg-red-500/20 text-red-500',
    [StudentStatus.GRADUADO]: 'bg-moon-blue/20 text-moon-blue',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

// Componente de menú contextual (Dropdown) para acciones de estudiante de la tabla
const TableRowActions: React.FC<{ student: Student; onEdit: (student: Student) => void; onDelete: (studentId: number) => void; }> = ({ student, onEdit, onDelete }) => {
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
            <button onClick={() => { onEdit(student); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <a href={`/students/${student.id}`} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <span className="flex items-center text-blue-400"><span className="mr-3">👤</span> Ver Perfil</span>
            </a>
            <button onClick={() => { onDelete(student.id); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


interface StudentTableProps {
  students: Student[];
  grados: Grado[];
  secciones: Seccion[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

// Tabla principal de estudiantes
export const StudentTable: React.FC<StudentTableProps> = ({ students, grados, secciones, onEdit, onDelete, readOnly = false, isLoading }) => {
  if (isLoading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

  const getGradoSeccion = (id_grado: number | null, id_seccion: number | null) => {
    const grado = grados.find(g => g.id_grado === id_grado)?.nombre_grado || '';
    const seccion = secciones.find(s => s.id_seccion === id_seccion)?.nombre_seccion || '';
    if (grado && seccion) return `${grado} "${seccion}"`;
    return 'Sin asignar';
  };

  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Estudiantes</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Lista de todos los estudiantes registrados.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Estudiante</th>
              <th scope="col" className="px-6 py-3">Cédula</th>
              <th scope="col" className="px-6 py-3">Grado/Sección</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              {!readOnly && <th scope="col" className="px-6 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="text-center py-10 text-moon-text-secondary">No se encontraron estudiantes.</td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar name={`${student.nombres} ${student.apellidos}`} className="w-9 h-9 mr-3 text-xs" />
                      <div>
                        <div>{student.nombres} {student.apellidos}</div>
                        <div className="text-xs text-moon-text-secondary">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.nacionalidad}-{student.cedula}</td>
                  <td className="px-6 py-4">{getGradoSeccion(student.id_grado, student.id_seccion)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  {!readOnly && (
                    <td className="px-6 py-4 text-right">
                      <TableRowActions student={student} onEdit={onEdit} onDelete={onDelete} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
