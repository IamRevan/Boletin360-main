'use client';

import React, { useState } from 'react';
import { type AñoEscolar, type Grado, type Seccion, ModalType } from '../types';
import { api } from '../lib/api';
import { SchoolYearTable } from './SchoolYearTable';
import { GradosTable } from './GradosTable';
import { SeccionesTable } from './SeccionesTable';
import { PlusIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';

// Componente Button para pestañas
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

// Página de Estructura Académica (Años, Grados, Secciones)
export const SchoolYearsPage: React.FC = () => {
    const { añosEscolares, grados, secciones } = useAppState();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('years'); // Pestaña activa ('years', 'grades', 'sections')

    // --- Handlers para Años Escolares ---
    const onAddAño = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddSchoolYear } });
    const onEditAño = (schoolYear: AñoEscolar) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditSchoolYear, data: schoolYear } });
    const onDeleteAño = async (id: number) => {
        const item = añosEscolares.find(i => i.id === id);
        if (window.confirm(`¿Está seguro que desea eliminar el año escolar '${item?.nombre}'? Esta acción no se puede deshacer.`)) {
            try {
                await api.deleteSchoolYear(id);
                dispatch({ type: ActionType.DELETE_SCHOOL_YEAR, payload: id });
            } catch (error) {
                console.error("Failed to delete school year", error);
                alert("Error al eliminar año escolar");
            }
        }
    };

    // --- Handlers para Grados ---
    const onAddGrado = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddGrado } });
    const onEditGrado = (grado: Grado) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditGrado, data: grado } });
    const onDeleteGrado = async (id: number) => {
        const item = grados.find(i => i.id_grado === id);
        if (window.confirm(`¿Está seguro que desea eliminar el grado '${item?.nombre_grado}'? Esto podría afectar a estudiantes y materias asignadas.`)) {
            try {
                await api.deleteGrado(id);
                dispatch({ type: ActionType.DELETE_GRADO, payload: id });
            } catch (error) {
                console.error("Failed to delete grade", error);
                alert("Error al eliminar grado");
            }
        }
    };

    // --- Handlers para Secciones ---
    const onAddSeccion = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddSeccion } });
    const onEditSeccion = (seccion: Seccion) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditSeccion, data: seccion } });
    const onDeleteSeccion = async (id: number) => {
        const item = secciones.find(i => i.id_seccion === id);
        if (window.confirm(`¿Está seguro que desea eliminar la sección '${item?.nombre_seccion}'? Esto podría afectar a estudiantes y materias asignadas.`)) {
            try {
                await api.deleteSeccion(id);
                dispatch({ type: ActionType.DELETE_SECCION, payload: id });
            } catch (error) {
                console.error("Failed to delete section", error);
                alert("Error al eliminar sección");
            }
        }
    };

    // Renderizar contenido basado en la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'years':
                return (
                    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
                        <div className="flex justify-between items-center">
                            <p className="text-moon-text-secondary">Gestiona los períodos académicos del sistema.</p>
                            <button onClick={onAddAño} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                                <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Año Escolar</span>
                            </button>
                        </div>
                        <SchoolYearTable añosEscolares={añosEscolares} onEdit={onEditAño} onDelete={onDeleteAño} />
                    </div>
                );
            case 'grades':
                return (
                    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
                        <div className="flex justify-between items-center">
                            <p className="text-moon-text-secondary">Gestiona los grados o años que componen la estructura académica.</p>
                            <button onClick={onAddGrado} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                                <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Grado</span>
                            </button>
                        </div>
                        <GradosTable grados={grados} onEdit={onEditGrado} onDelete={onDeleteGrado} />
                    </div>
                );
            case 'sections':
                return (
                    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
                        <div className="flex justify-between items-center">
                            <p className="text-moon-text-secondary">Gestiona las secciones en las que se dividen los grados.</p>
                            <button onClick={onAddSeccion} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                                <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Sección</span>
                            </button>
                        </div>
                        <SeccionesTable secciones={secciones} onEdit={onEditSeccion} onDelete={onDeleteSeccion} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Estructura Académica</h2>
                <p className="text-moon-text-secondary mt-1">Gestiona los componentes fundamentales de la organización académica.</p>
            </div>

            {/* Navegación por Pestañas */}
            <div className="bg-moon-component rounded-xl border border-moon-border p-2 flex items-center space-x-2">
                <TabButton active={activeTab === 'years'} onClick={() => setActiveTab('years')}>Años Escolares</TabButton>
                <TabButton active={activeTab === 'grades'} onClick={() => setActiveTab('grades')}>Grados</TabButton>
                <TabButton active={activeTab === 'sections'} onClick={() => setActiveTab('sections')}>Secciones</TabButton>
            </div>

            <div>{renderContent()}</div>
        </div>
    );
};
