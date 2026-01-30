'use client';


import React, { useMemo, useState, useRef, useEffect } from 'react';
import { type Student, type User, UserRole, type Grado, type Seccion, ModalType, StudentStatus } from '../types';
import { Avatar } from './ui/Avatar';
import { api } from '../lib/api';
import { StatCard } from './StatCard';
import { UsersIcon, CheckCircleIcon, PlusIcon, BookOpenIcon, UserCheckIcon, MoreVerticalIcon, EditIcon, Trash2Icon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { Skeleton } from './ui/Skeleton';
import { CardSkeleton } from './ui/CardSkeleton';
import { TableSkeleton } from './ui/TableSkeleton';
import { StatisticsCharts } from './StatisticsCharts';

interface DashboardPageProps { }

// Componente para manejar las acciones (Editar/Eliminar) de un estudiante reciente
const RecentStudentActions: React.FC<{ student: Student; onEdit: (student: Student) => void; onDelete: (studentId: number) => void; }> = ({ student, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
              <EditIcon /><span className="ml-3">Editar</span>
            </button>
            <button onClick={() => { onDelete(student.id); setIsOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
              <Trash2Icon /><span className="ml-3">Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


// Lista de Estudiantes Recientes
const RecentStudentsList: React.FC<{
  students: Student[];
  grados: Grado[];
  secciones: Seccion[];
  readOnly: boolean; // Si es true (Docente), no muestra acciones de editar/eliminar
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: number) => void;
  isLoading?: boolean;
}> = ({ students, grados, secciones, readOnly, onEdit, onDelete, isLoading }) => {

  // Helper para mostrar Grado y Sección formateados
  const getGradoSeccion = (id_grado: number | null, id_seccion: number | null) => {
    const grado = grados.find(g => g.id_grado === id_grado)?.nombre_grado || '';
    const seccion = secciones.find(s => s.id_seccion === id_seccion)?.nombre_seccion || '';
    if (grado && seccion) return `${grado} "${seccion}"`;
    return 'Sin asignar';
  };

  if (isLoading) {
    return (
      <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white">Estudiantes Recientes</h3>
          <Skeleton variant="text" width="40%" height={20} className="mt-2" />
        </div>
        <TableSkeleton rows={5} columns={3} />
      </div>
    );
  }

  return (
    <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">Estudiantes Recientes</h3>
        <p className="text-moon-text-secondary text-sm mt-1">
          {readOnly ? 'Últimos estudiantes inscritos en sus cursos.' : 'Últimos estudiantes registrados en el sistema.'}
        </p>
      </div>
      <div className="overflow-x-auto">
        {students.length > 0 ? (
          <table className="w-full text-sm text-left text-moon-text">
            <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
              <tr>
                <th scope="col" className="px-6 py-3">Estudiante</th>
                <th scope="col" className="px-6 py-3">Grado/Sección</th>
                {!readOnly && <th scope="col" className="px-6 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
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
                  <td className="px-6 py-4">{getGradoSeccion(student.id_grado, student.id_seccion)}</td>
                  {!readOnly && onEdit && onDelete && (
                    <td className="px-6 py-4 text-right">
                      <RecentStudentActions student={student} onEdit={onEdit} onDelete={onDelete} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8 text-moon-text-secondary">No se encontraron estudiantes recientes.</p>
        )}
      </div>
    </div>
  );
}


// Página del Dashboard Principal
export const DashboardPage: React.FC<DashboardPageProps> = () => {
  const { students, materias, teachers, grados, secciones, currentUser, isLoading } = useAppState();
  const dispatch = useAppDispatch();

  // If loading and we have no currentUser, we might be in initial auth check,
  // but useAppState().isLoading handles Data. Auth check might be separate.
  // Assuming currentUser is set quickly or we show loading too.

  if (isLoading) {
    // Loading State for Dashboard
    return (
      <div className="space-y-8 animate-[fade-in_0.5s_ease-out]">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton variant="text" width={250} height={32} />
            <Skeleton variant="text" width={350} height={20} className="mt-2" />
          </div>
          <Skeleton width={180} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
          <div className="p-6">
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="text" width={300} height={16} className=" mt-2" />
          </div>
          <TableSkeleton rows={5} columns={3} />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const isTeacher = currentUser.role === UserRole.DOCENTE;

  // Handlers para modales
  const onAddStudentClick = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddStudent } });
  const onEditStudent = (student: Student) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditStudent, data: student } });

  // Handler para eliminar estudiante
  const onDeleteStudent = async (studentId: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este estudiante? Esta acción no se puede deshacer.')) {
      try {
        await api.deleteStudent(studentId);
        dispatch({ type: ActionType.DELETE_STUDENT, payload: studentId });
      } catch (error) {
        console.error("Failed to delete student", error);
        alert("Error al eliminar estudiante");
      }
    }
  };


  // Obtener los 5 estudiantes más recientes (ID más alto primero)
  const recentStudents = useMemo(() => {
    // El array de estudiantes ya está filtrado para docentes en el AppContext/Backend si aplicara
    return [...students].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [students]);

  // Vista para Docentes
  if (isTeacher) {
    return (
      <div className="space-y-8 animate-[fade-in_0.5s_ease-out]">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard del Docente</h2>
          <p className="text-moon-text-secondary mt-1">¡Bienvenido! Aquí tiene un resumen de sus clases.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Mis Estudiantes" value={students.length.toString()} icon={<UsersIcon />} />
          <StatCard title="Mis Materias" value={materias.length.toString()} icon={<BookOpenIcon />} />
        </div>
        <RecentStudentsList students={recentStudents} grados={grados} secciones={secciones} readOnly={true} isLoading={isLoading} />
      </div>
    );
  }

  // Vista para Admin (Dashboard completo)
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalSubjects = materias.length;
  const graduates = students.filter(s => s.status === StudentStatus.GRADUADO).length;

  return (
    <div className="space-y-8 animate-[fade-in_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-moon-text-secondary mt-1">¡Bienvenido! Aquí tiene un resumen de su sistema académico.</p>
        </div>
        <button
          onClick={onAddStudentClick}
          className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
          <PlusIcon />
          <span className="ml-2 hidden sm:inline">Añadir Estudiante</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Estudiantes" value={totalStudents.toString()} icon={<UsersIcon />} />
        <StatCard title="Total Docentes" value={totalTeachers.toString()} icon={<UserCheckIcon />} />
        <StatCard title="Total Materias" value={totalSubjects.toString()} icon={<BookOpenIcon />} />
        <StatCard title="Total Egresados" value={graduates.toString()} icon={<CheckCircleIcon />} />
      </div>

      <StatisticsCharts students={students} grados={grados} />

      <RecentStudentsList
        students={recentStudents}
        grados={grados}
        secciones={secciones}
        readOnly={false}
        onEdit={onEditStudent}
        onDelete={onDeleteStudent}
        isLoading={isLoading}
      />
    </div>
  );
}
