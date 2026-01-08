'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { type Student, type Materia, type Grado, type Seccion, type AñoEscolar, type Calificacion, type Evaluacion, UserRole, ModalType } from '../types';
import { GradesTable } from './GradesTable';
import { FileTextIcon, PlusIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${active
        ? 'bg-moon-purple text-white'
        : 'text-moon-text-secondary hover:bg-moon-component hover:text-white'
      }`}
  >
    {children}
  </button>
);

export const GradesPage: React.FC = () => {
  const { students, materias, grados, secciones, añosEscolares, calificaciones, currentUser } = useAppState();
  const dispatch = useAppDispatch();

  const [selectedAño, setSelectedAño] = useState<number | null>(añosEscolares[añosEscolares.length - 1]?.id ?? null);
  const [selectedGrado, setSelectedGrado] = useState<number | null>(null);
  const [selectedSeccion, setSelectedSeccion] = useState<number | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<number | null>(null);
  const [activeLapso, setActiveLapso] = useState<1 | 2 | 3>(1);

  if (!currentUser) return null;
  const isTeacher = currentUser.role === UserRole.Teacher;

  // UX Improvement: Pre-select the first available class for the teacher
  useEffect(() => {
    if (isTeacher && materias.length > 0 && !selectedMateria) {
      const firstMateria = materias[0];
      setSelectedGrado(firstMateria.id_grado);
      setSelectedSeccion(firstMateria.id_seccion);
      setSelectedMateria(firstMateria.id);
    }
  }, [isTeacher, materias, selectedMateria]);


  const onAddEvaluation = () => {
    const studentIds = filteredStudents.map(s => s.id);
    const modalInfo = { studentIds, materiaId: selectedMateria!, añoId: selectedAño!, lapso: activeLapso };
    dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddEvaluation, data: modalInfo } });
  };

  const availableGrados = useMemo(() => {
    const gradeIds = [...new Set(materias.map(m => m.id_grado))];
    return grados.filter(g => gradeIds.includes(g.id_grado));
  }, [grados, materias]);

  const availableSecciones = useMemo(() => {
    if (!selectedGrado) return [];
    const sectionIds = [...new Set(materias.filter(m => m.id_grado === selectedGrado).map(m => m.id_seccion))];
    return secciones.filter(s => sectionIds.includes(s.id_seccion));
  }, [secciones, materias, selectedGrado]);

  const filteredMateriasForDropdown = useMemo(() => {
    if (!selectedGrado || !selectedSeccion) return [];
    return materias.filter(m => m.id_grado === selectedGrado && m.id_seccion === selectedSeccion);
  }, [materias, selectedGrado, selectedSeccion]);

  const filteredStudents = useMemo(() => {
    if (!selectedGrado || !selectedSeccion) return [];
    return students.filter(s => s.id_grado === selectedGrado && s.id_seccion === selectedSeccion);
  }, [students, selectedGrado, selectedSeccion]);

  const handleGradoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedGrado(value);
    setSelectedSeccion(null);
    setSelectedMateria(null);
  }

  const handleSeccionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedSeccion(value);
    setSelectedMateria(null);
  }

  const showTable = selectedAño && selectedGrado && selectedSeccion && selectedMateria;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Gestión de Calificaciones</h2>
        <p className="text-moon-text-secondary mt-1">Seleccione un curso y materia para ver o editar las notas detalladas.</p>
      </div>

      <div className="bg-moon-component rounded-xl border border-moon-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Año Escolar</label>
            <select value={selectedAño || ''} onChange={(e) => setSelectedAño(e.target.value ? parseInt(e.target.value, 10) : null)} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent">
              <option value="">Seleccione...</option>
              {añosEscolares.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Grado</label>
            <select value={selectedGrado || ''} disabled={!selectedAño} onChange={handleGradoChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Seleccione...</option>
              {(isTeacher ? availableGrados : grados).map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre_grado}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Sección</label>
            <select value={selectedSeccion || ''} disabled={!selectedGrado} onChange={handleSeccionChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Seleccione...</option>
              {(isTeacher ? availableSecciones : secciones).map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre_seccion}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-moon-text-secondary mb-2">Materia</label>
            <select disabled={!selectedGrado || !selectedSeccion} onChange={(e) => setSelectedMateria(e.target.value ? parseInt(e.target.value, 10) : null)} value={selectedMateria || ''} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Seleccione...</option>
              {filteredMateriasForDropdown.map(m => <option key={m.id} value={m.id}>{m.nombre_materia}</option>)}
            </select>
          </div>
        </div>
      </div>

      {showTable ? (
        <div className="space-y-4">
          <div className="bg-moon-component rounded-xl border border-moon-border p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TabButton active={activeLapso === 1} onClick={() => setActiveLapso(1)}>Lapso 1</TabButton>
              <TabButton active={activeLapso === 2} onClick={() => setActiveLapso(2)}>Lapso 2</TabButton>
              <TabButton active={activeLapso === 3} onClick={() => setActiveLapso(3)}>Lapso 3</TabButton>
            </div>
            <button onClick={onAddEvaluation} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
              <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Evaluación</span>
            </button>
          </div>
          <GradesTable
            key={`${selectedAño}-${selectedMateria}-${activeLapso}`}
            students={filteredStudents}
            materiaId={selectedMateria!}
            añoId={selectedAño!}
            lapso={activeLapso}
            calificaciones={calificaciones}
          />
        </div>
      ) : (
        <div className="mt-8 bg-moon-component border border-moon-border rounded-xl p-16 text-center">
          <div className="w-16 h-16 bg-moon-nav rounded-full flex items-center justify-center mx-auto text-moon-text-secondary">
            <FileTextIcon />
          </div>
          <h3 className="text-xl font-bold text-white mt-6">Seleccione un Curso</h3>
          <p className="text-moon-text-secondary mt-2">Por favor, complete todos los campos para cargar la planilla de calificaciones.</p>
        </div>
      )}
    </div>
  );
};
