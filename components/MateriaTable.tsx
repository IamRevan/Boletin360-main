'use client';

import React, { useState, useRef, useEffect } from 'react';
import { type Materia, type Teacher, TeacherStatus, type Grado, type Seccion } from '../types';
import { MoreVerticalIcon, EditIcon, Trash2Icon, BookOpenIcon } from './Icons';

// Acciones de fila (Dropdown)
const TableRowActions: React.FC<{ materia: Materia; onEdit: (materia: Materia) => void; onDelete: (materiaId: number) => void; }> = ({ materia, onEdit, onDelete }) => {
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
            <button onClick={() => { onEdit(materia); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
              <EditIcon />
              <span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onDelete(materia.id); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon />
              <span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


interface MateriaTableProps {
  materias: Materia[];
  teachers: Teacher[];
  grados: Grado[];
  secciones: Seccion[];
  onEdit: (materia: Materia) => void;
  onDelete: (materiaId: number) => void;
  readOnly?: boolean;
}

// Tabla de Materias
export const MateriaTable: React.FC<MateriaTableProps> = ({ materias, teachers, grados, secciones, onEdit, onDelete, readOnly = false }) => {

  // Obtener nombre del docente
  const getTeacherName = (id_docente: number | null): React.ReactNode => {
    if (!id_docente) return 'Sin asignar';
    const teacher = teachers.find(t => t.id === id_docente);
    if (!teacher) return 'Desconocido';

    const fullName = `${teacher.nombres} ${teacher.apellidos}`;
    if (teacher.status === TeacherStatus.INACTIVO) {
      return (
        <div className="flex items-center">
          <span className="text-moon-text-secondary">{fullName}</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-moon-orange/20 text-moon-orange">
            INACTIVO
          </span>
        </div>
      );
    }
    return fullName;
  };

  // Obtener Grado y Sección
  const getGradoSeccion = (id_grado: number | null, id_seccion: number | null) => {
    const grado = grados.find(g => g.id_grado === id_grado)?.nombre_grado || '';
    const seccion = secciones.find(s => s.id_seccion === id_seccion)?.nombre_seccion || '';
    if (grado && seccion) return `${grado} "${seccion}"`;
    return 'Sin asignar';
  };

  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Lista de Materias</h3>
        <p className="text-moon-text-secondary text-sm mt-1">Lista de todas las materias registradas y sus asignaciones.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-moon-text">
          <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
            <tr>
              <th scope="col" className="px-6 py-3">Materia</th>
              <th scope="col" className="px-6 py-3">Docente Asignado</th>
              <th scope="col" className="px-6 py-3">Clase Asignada</th>
              {!readOnly && <th scope="col" className="px-6 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {materias.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 3 : 4} className="text-center py-10 text-moon-text-secondary">No se encontraron materias.</td>
              </tr>
            ) : (
              materias.map((materia) => (
                <tr key={materia.id} className="bg-moon-component border-b border-moon-border hover:bg-moon-nav/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-moon-purple/20 flex items-center justify-center mr-3">
                        <BookOpenIcon />
                      </div>
                      {materia.nombre_materia}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTeacherName(materia.id_docente)}</td>
                  <td className="px-6 py-4">{getGradoSeccion(materia.id_grado, materia.id_seccion)}</td>
                  {!readOnly && (
                    <td className="px-6 py-4 text-right">
                      <TableRowActions materia={materia} onEdit={onEdit} onDelete={onDelete} />
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
