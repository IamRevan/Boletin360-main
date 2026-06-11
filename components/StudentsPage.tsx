'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { StudentTable } from './StudentTable';
import { PlusIcon, UploadIcon, DownloadIcon, SearchIcon } from './Icons';
import { ExcelImportModal } from './ExcelImportModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { type Student, ModalType, UserRole } from '../types';
import * as XLSX from 'xlsx';
import { useToast } from '../state/ToastContext';

export const StudentsPage: React.FC = () => {
    const { grados, secciones, currentUser, isLoading: globalLoading } = useAppState();
    const dispatch = useAppDispatch();
    const { addToast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const [filters, setFilters] = useState({ search: '', grade: '', section: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [pageInput, setPageInput] = useState('1');

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        studentId: number | null;
        studentName: string;
    }>({ isOpen: false, studentId: null, studentName: '' });

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(currentPage));
            params.set('pageSize', String(pageSize));
            if (filters.search) params.set('search', filters.search);
            if (filters.grade) params.set('gradoId', filters.grade);
            if (filters.section) params.set('seccionId', filters.section);

            const res = await api.get(`/students?${params.toString()}`);
            setStudents(res.data.students);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching students', error);
            addToast('Error al cargar estudiantes', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filters, addToast]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    if (!currentUser) return null;
    const isTeacher = currentUser.role === UserRole.DOCENTE;
    const canManageStudents = !isTeacher;

    const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddStudent } });
    const onEdit = (student: any) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditStudent, data: student } });

    const onDelete = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        const studentName = student ? `${student.nombres} ${student.apellidos}` : 'este estudiante';
        setConfirmDialog({ isOpen: true, studentId, studentName });
    };

    const handleConfirmDelete = async () => {
        if (confirmDialog.studentId === null) return;
        try {
            await api.deleteStudent(confirmDialog.studentId);
            addToast('Estudiante eliminado correctamente', 'success');
            fetchStudents();
        } catch (error) {
            console.error("Failed to delete student", error);
            addToast('Error al eliminar estudiante', 'error');
        }
        setConfirmDialog({ isOpen: false, studentId: null, studentName: '' });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ search: '', grade: '', section: '' });
        setCurrentPage(1);
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^[0-9\b]+$/.test(value)) setPageInput(value);
    };

    const goToPage = (page: string) => {
        const pageNum = parseInt(page, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
        } else {
            setPageInput(currentPage.toString());
        }
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { goToPage(pageInput); e.currentTarget.blur(); }
    };

    const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => goToPage(e.target.value);

    const handleExport = () => {
        try {
            const exportData = students.map(s => ({
                Nacionalidad: s.nacionalidad,
                Cedula: s.cedula,
                Nombres: s.nombres,
                Apellidos: s.apellidos,
                Email: s.email || '',
                Genero: s.genero || '',
                Grado: grados.find(g => g.id === s.idGrado)?.nombreGrado || '',
                Seccion: secciones.find(sec => sec.id === s.idSeccion)?.nombreSeccion || '',
                Estado: s.status
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
            XLSX.writeFile(workbook, `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
            addToast('Estudiantes exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exporting:', error);
            addToast('Error al exportar estudiantes', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <ExcelImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Eliminar Estudiante"
                message={`¿Está seguro que desea eliminar a "${confirmDialog.studentName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, studentId: null, studentName: '' })}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">Gestión de Estudiantes</h2>
                    <p className="text-moon-text-secondary mt-1">Administra la información de los estudiantes.</p>
                </div>
                {canManageStudents && (
                    <div className="flex space-x-3">
                        <button onClick={() => setIsImportModalOpen(true)} className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <UploadIcon /> <span className="ml-2 hidden sm:inline">Importar</span>
                        </button>
                        <button onClick={handleExport} className="bg-moon-component hover:bg-moon-border text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <DownloadIcon /> <span className="ml-2 hidden sm:inline">Exportar</span>
                        </button>
                        <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Estudiante</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-moon-component rounded-xl border border-moon-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Buscar</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Nombre, apellido o cédula..." className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 pl-10 pr-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Grado</label>
                        <select name="grade" value={filters.grade} onChange={handleFilterChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent">
                            <option value="">Todos</option>
                            {grados.map((g: any) => <option key={g.id} value={g.id}>{g.nombreGrado}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Sección</label>
                        <select name="section" value={filters.section} onChange={handleFilterChange} className="w-full bg-moon-nav border border-moon-border rounded-lg py-2 px-3 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent">
                            <option value="">Todas</option>
                            {secciones
                                .filter((s: any) => !filters.grade || s.idGrado === parseInt(filters.grade, 10))
                                .map((s: any) => {
                                    const grado = grados.find((g: any) => g.id === s.idGrado);
                                    return (
                                        <option key={s.id} value={s.id}>
                                            {grado ? `${grado.nombreGrado} "${s.nombreSeccion}"` : s.nombreSeccion}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={clearFilters} className="text-moon-text-secondary hover:text-white text-sm font-medium">Limpiar filtros</button>
                </div>
            </div>

            <StudentTable students={students} grados={grados as any} secciones={secciones as any} onEdit={onEdit} onDelete={onDelete} readOnly={isTeacher} isLoading={isLoading || globalLoading} />

            {totalPages > 1 && (
                <div className="flex justify-between items-center text-sm">
                    <p className="text-moon-text-secondary">
                        Total de <span className="font-semibold text-moon-text">{total}</span> estudiantes
                    </p>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-moon-component hover:bg-moon-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Anterior</button>
                        <div className="flex items-center space-x-2">
                            <span className="text-moon-text-secondary">Página</span>
                            <input type="text" value={pageInput} onChange={handlePageInputChange} onKeyDown={handlePageInputKeyDown} onBlur={handlePageInputBlur} className="w-14 bg-moon-nav border border-moon-border rounded-lg py-2 px-2 text-center text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light" />
                            <span className="text-moon-text-secondary">de {totalPages}</span>
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-moon-component hover:bg-moon-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Siguiente</button>
                    </div>
                </div>
            )}
        </div>
    );
}
