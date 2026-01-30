import React from 'react';
import { HomeIcon, UsersIcon, BookOpenIcon, ChartBarIcon, CogIcon, UserCheckIcon, ClipboardListIcon, CalendarIcon, GraduationCapIcon, LayersIcon } from './Icons';
import { UserRole } from '../types';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-left ${active
      ? 'bg-moon-purple text-white'
      : 'text-moon-text-secondary hover:bg-moon-component hover:text-moon-text'
      }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

export const Sidebar: React.FC<{ setCurrentPage: (page: string) => void, currentPage: string, userRole: UserRole }> = ({ setCurrentPage, currentPage, userRole }) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const isControlEstudios = userRole === UserRole.CONTROL_ESTUDIOS;
  const isTeacher = userRole === UserRole.DOCENTE;
  const isDirector = userRole === UserRole.DIRECTOR;

  // Permisos combinados
  const canManageStudents = isAdmin || isControlEstudios || isDirector; // Admin, Control de Estudios y Director pueden gestionar estudiantes
  const canManageGrades = isAdmin || isControlEstudios || isDirector; // Admin y Control pueden validar calificaciones
  const canViewReports = isAdmin || isControlEstudios || isDirector; // Admin y Control pueden ver reportes
  const canManageAcademic = isAdmin || isControlEstudios || isDirector; // Admin y Control pueden ver estructura académica

  return (
    <aside className="w-64 flex-shrink-0 bg-moon-nav p-6 hidden lg:flex flex-col">
      <div className="flex items-center mb-10">
        <div className="w-10 h-10 bg-moon-purple rounded-lg flex items-center justify-center">
          <GraduationCapIcon />
        </div>
        <h1 className="text-xl font-bold text-white ml-3">Boletín360</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {/* Dashboard - Todos */}
        <NavItem icon={<HomeIcon />} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />

        {/* Estudiantes - Admin, Control de Estudios (gestión), Profesor (solo ver) */}
        <NavItem icon={<UsersIcon />} label="Estudiantes" active={currentPage === 'students'} onClick={() => setCurrentPage('students')} />

        {/* Docentes - Solo Admin */}
        {isAdmin && <NavItem icon={<UserCheckIcon />} label="Docentes" active={currentPage === 'teachers'} onClick={() => setCurrentPage('teachers')} />}

        {/* Calificaciones - Todos (Profesor edita, Admin/Control validan) */}
        <NavItem icon={<ClipboardListIcon />} label="Calificaciones" active={currentPage === 'grades'} onClick={() => setCurrentPage('grades')} />

        {/* Materias - Admin, Control de Estudios (gestión), Profesor (solo ver) */}
        <NavItem icon={<BookOpenIcon />} label="Materias" active={currentPage === 'courses'} onClick={() => setCurrentPage('courses')} />

        {/* Estructura Académica - Admin y Control de Estudios */}
        {canManageAcademic && <NavItem icon={<CalendarIcon />} label="Estructura Académica" active={currentPage === 'schoolyears'} onClick={() => setCurrentPage('schoolyears')} />}

        {/* Promoción de Año - Admin y Control de Estudios */}
        {canManageAcademic && <NavItem icon={<LayersIcon />} label="Promoción de Año" active={currentPage === 'promotion'} onClick={() => setCurrentPage('promotion')} />}

        {/* Reportes - Admin y Control de Estudios */}
        {canViewReports && <NavItem icon={<ChartBarIcon />} label="Reportes" active={currentPage === 'reports'} onClick={() => setCurrentPage('reports')} />}

        {/* Auditoría - Solo Admin */}
        {isAdmin && <NavItem icon={<ClipboardListIcon />} label="Auditoría" active={currentPage === 'audit'} onClick={() => setCurrentPage('audit')} />}

        {/* Configuración - Solo Admin */}
        {isAdmin && <NavItem icon={<CogIcon />} label="Configuración" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} />}
      </nav>
    </aside>
  );
};
