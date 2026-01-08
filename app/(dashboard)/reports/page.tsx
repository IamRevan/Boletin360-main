'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/state/AppContext';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { PrinterIcon, SearchIcon, FileTextIcon } from '@/components/Icons';

export default function ReportsPage() {
    const { students, añosEscolares, grados, secciones, isLoading: isAppLoading } = useAppState();
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedAnoId, setSelectedAnoId] = useState<number | null>(null);
    const [reportData, setReportData] = useState<any | null>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar estudiantes para el buscador
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return students.filter(s =>
            s.nombres.toLowerCase().includes(lowerTerm) ||
            s.apellidos.toLowerCase().includes(lowerTerm) ||
            s.cedula.includes(searchTerm)
        ).slice(0, 10); // Limitar a 10 resultados
    }, [students, searchTerm]);

    const handleGenerateReport = async () => {
        if (!selectedStudentId || !selectedAnoId) return;

        setIsLoadingReport(true);
        try {
            const response = await api.get('/reports/boletin', {
                params: { studentId: selectedStudentId, anoEscolarId: selectedAnoId }
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report", error);
            alert("No se pudo generar el boletín. Verifique que existan notas para este período.");
            setReportData(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calcular definitiva de una materia (promedio simple de lapsos)
    const calculateDefinitive = (materia: any) => {
        let total = 0;
        let count = 0;
        const lapsos = [materia.lapso1, materia.lapso2, materia.lapso3];

        lapsos.forEach(lapso => {
            if (Array.isArray(lapso) && lapso.length > 0) {
                // Asumimos que la nota del lapso es el promedio de sus evaluaciones o hay una logica especifica?
                // En el esquema actual, lapso es un array de evaluaciones.
                // Vamos a sumar ponderaciones. Si ponderacion es sobre 20, sumamos notas.
                const lapsoNota = lapso.reduce((acc: number, curr: any) => acc + (curr.nota * (curr.ponderacion / 100)), 0); // Si ponderacion es %, ejemplo 20 pts * 0.2
                // Simplificación: Si el sistema usa promedio directo de notas:
                const promedioLapso = lapso.reduce((acc: number, curr: any) => acc + curr.nota, 0) / (lapso.length || 1);

                // AJUSTE: Basado en el sistema venezolano común, a veces es suma directa del lapso o promedio.
                // Vamos a usar Promedio Simple de las evaluaciones del lapso para obtener "Nota Lapso" por ahora.
                total += promedioLapso;
                count++;
            }
        });

        if (count === 0) return 0;
        return (total / count).toFixed(2);
    };

    // Helper para nota de lapso
    const getLapsoNota = (lapso: any[]) => {
        if (!lapso || lapso.length === 0) return '-';
        const sum = lapso.reduce((acc, curr) => acc + Number(curr.nota), 0);
        return (sum / lapso.length).toFixed(1);
    };

    return (
        <div className="space-y-6">
            {/* Controles de Selección - Ocultos al imprimir */}
            <div className="bg-moon-component p-6 rounded-xl border border-moon-border print:hidden">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FileTextIcon /><span className="ml-2">Generador de Boletines</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Buscador de Estudiante */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Estudiante</label>
                        <div className="flex items-center bg-moon-bg rounded-lg border border-moon-border px-3 py-2">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                className="bg-transparent border-none focus:outline-none text-moon-text ml-2 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {searchTerm && filteredStudents.length > 0 && !selectedStudentId && (
                            <div className="absolute z-10 w-full bg-moon-component border border-moon-border mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {filteredStudents.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudentId(student.id);
                                            setSearchTerm(`${student.nombres} ${student.apellidos}`);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-moon-nav text-moon-text flex justify-between items-center"
                                    >
                                        <span>{student.nombres} {student.apellidos}</span>
                                        <span className="text-xs text-moon-text-secondary">{student.cedula}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedStudentId && (
                            <div className="mt-2 text-sm text-green-400 font-medium">
                                Seleccionado: {students.find(s => s.id === selectedStudentId)?.nombres}
                            </div>
                        )}
                    </div>

                    {/* Selector de Año Escolar */}
                    <div>
                        <label className="block text-sm font-medium text-moon-text-secondary mb-2">Año Escolar</label>
                        <select
                            className="w-full bg-moon-bg border border-moon-border text-moon-text rounded-lg px-3 py-2 focus:outline-none focus:border-moon-primary"
                            value={selectedAnoId || ''}
                            onChange={(e) => setSelectedAnoId(Number(e.target.value))}
                        >
                            <option value="" style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>Seleccione un año...</option>
                            {añosEscolares.map(ano => (
                                <option key={ano.id} value={ano.id} style={{ backgroundColor: '#1a1d2d', color: '#d0d2d6' }}>{ano.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Botón Generar */}
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerateReport}
                            disabled={!selectedStudentId || !selectedAnoId || isLoadingReport}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingReport ? 'Generando...' : 'Ver Boletín'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Vista Previa del Boletín */}
            {reportData && (
                <div className="animate-fade-in">
                    {/* Botón Imprimir Flotante */}
                    <div className="flex justify-end mb-4 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
                        >
                            <PrinterIcon />
                            <span className="ml-2">Imprimir / Guardar PDF</span>
                        </button>
                    </div>

                    {/* Hoja del Boletín (Diseño para Impresión) */}
                    <div className="bg-white text-black p-10 rounded-sm shadow-2xl max-w-4xl mx-auto print:shadow-none print:w-full print:max-w-none print:p-0">

                        {/* Membrete */}
                        <div className="text-center border-b-2 border-black pb-4 mb-6">
                            <h1 className="text-2xl font-bold uppercase">República Bolivariana de Venezuela</h1>
                            <h2 className="text-xl font-semibold">Ministerio del Poder Popular para la Educación</h2>
                            <h3 className="text-lg">U.E. "Boletín360 Academy"</h3>
                            <p className="text-sm mt-2">Informe de Rendimiento Académico</p>
                        </div>

                        {/* Datos del Estudiante con Foto */}
                        <div className="flex border border-black mb-8">
                            <div className="flex-1 p-4 text-sm whitespace-nowrap">
                                <p><span className="font-bold">Estudiante:</span> {reportData.student.apellidos}, {reportData.student.nombres}</p>
                                <p><span className="font-bold">Cédula:</span> {reportData.student.nacionalidad}-{reportData.student.cedula}</p>
                                <p><span className="font-bold">Año Escolar:</span> {reportData.anoEscolar.nombre}</p>
                                <p><span className="font-bold">Grado/Sección (Histórico):</span> {reportData.boletin[0]?.nombre_grado || 'N/A'} "{reportData.boletin[0]?.nombre_seccion || 'N/A'}"</p>
                            </div>
                            {/* Marco para Foto */}
                            <div className="w-32 border-l border-black flex flex-col justify-center items-center p-2">
                                <div className="w-24 h-28 border border-dashed border-gray-400 flex items-center justify-center">
                                    <span className="text-xs text-gray-400 text-center">Pegar Foto Aqui</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Notas */}
                        <table className="w-full border-collapse border border-black text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-black px-2 py-1 text-left">Asignatura</th>
                                    <th className="border border-black px-2 py-1 w-20 text-center">Lapso 1</th>
                                    <th className="border border-black px-2 py-1 w-20 text-center">Lapso 2</th>
                                    <th className="border border-black px-2 py-1 w-20 text-center">Lapso 3</th>
                                    <th className="border border-black px-2 py-1 w-20 text-center font-bold">Def.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.boletin.map((materia: any, index: number) => (
                                    <tr key={index}>
                                        <td className="border border-black px-2 py-1">{materia.nombre_materia}</td>
                                        <td className="border border-black px-2 py-1 text-center">{getLapsoNota(materia.lapso1)}</td>
                                        <td className="border border-black px-2 py-1 text-center">{getLapsoNota(materia.lapso2)}</td>
                                        <td className="border border-black px-2 py-1 text-center">{getLapsoNota(materia.lapso3)}</td>
                                        <td className="border border-black px-2 py-1 text-center font-bold">{((Number(getLapsoNota(materia.lapso1)) + Number(getLapsoNota(materia.lapso2)) + Number(getLapsoNota(materia.lapso3))) / 3).toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Firmas */}
                        <div className="mt-20 grid grid-cols-2 gap-20 text-center">
                            <div className="border-t border-black pt-2">
                                <p>Director(a)</p>
                            </div>
                            <div className="border-t border-black pt-2">
                                <p>Docente Guía</p>
                            </div>
                        </div>

                        <div className="mt-10 text-xs text-center text-gray-500">
                            Generado automáticamente por el sistema Boletín360 el {new Date().toLocaleDateString()}.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
