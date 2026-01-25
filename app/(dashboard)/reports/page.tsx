'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAppState } from '@/state/AppContext';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { PrinterIcon, SearchIcon, FileTextIcon, DownloadIcon } from '@/components/Icons';
import { ConstanciaReport } from '@/components/reports/ConstanciaReport';
import { ResumenReport } from '@/components/reports/ResumenReport';

type ReportType = 'boletin' | 'acta' | 'resumen';

export default function ReportsPage() {
    const { students, añosEscolares, grados, secciones, isLoading: isAppLoading } = useAppState();

    // Estados generales
    const [reportType, setReportType] = useState<ReportType>('boletin');
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [reportData, setReportData] = useState<any | null>(null);
    const [selectedAnoId, setSelectedAnoId] = useState<number | null>(null);

    // Estados Boletín Individual
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados Acta de Evaluación
    const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
    const [selectedSeccionId, setSelectedSeccionId] = useState<number | null>(null);

    // Filtrar estudiantes para el buscador (Boletín)
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return students.filter(s =>
            s.nombres.toLowerCase().includes(lowerTerm) ||
            s.apellidos.toLowerCase().includes(lowerTerm) ||
            s.cedula.includes(searchTerm)
        ).slice(0, 10);
    }, [students, searchTerm]);

    const handleGenerateReport = async () => {
        // Validacion
        if (reportType === 'resumen') {
            if (!selectedAnoId || !selectedGradoId || !selectedSeccionId) return;
        } else {
            if (!selectedStudentId || !selectedAnoId) return;
        }

        setIsLoadingReport(true);
        setReportData(null);

        try {
            // Reusamos /reports/acta para constancia y resumen, el backend maneja la logica según params
            const endpoint = reportType === 'boletin' ? '/reports/boletin' : '/reports/acta';

            const params: any = { anoEscolarId: selectedAnoId };
            if (reportType === 'resumen') {
                params.gradoId = selectedGradoId;
                params.seccionId = selectedSeccionId;
            } else {
                params.studentId = selectedStudentId;
            }

            const response = await api.get(endpoint, { params });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report", error);
            alert("No se pudo generar el reporte. Verifique los datos.");
            setReportData(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadExcel = async () => {
        if (!selectedAnoId || !selectedGradoId || !selectedSeccionId) return;

        try {
            const response = await api.get('/reports/export-xlsx', {
                params: {
                    anoEscolarId: selectedAnoId,
                    gradoId: selectedGradoId,
                    seccionId: selectedSeccionId
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `constancia_estudios_${selectedGradoId}_${selectedSeccionId}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error downloading excel", error);
            alert("Error al descargar el archivo Excel.");
        }
    };

    // Helper para nota de lapso (Boletín)
    const getLapsoNota = (lapso: any[]) => {
        if (!lapso || lapso.length === 0) return '';
        const sum = lapso.reduce((acc, curr) => acc + Number(curr.nota), 0);
        return (sum / lapso.length).toFixed(0);
    };

    const getDefinitiva = (materia: any) => {
        const n1 = getLapsoNota(materia.lapso1);
        const n2 = getLapsoNota(materia.lapso2);
        const n3 = getLapsoNota(materia.lapso3);

        if (!n1 && !n2 && !n3) return '';

        let sum = 0;
        let count = 0;
        if (n1) { sum += Number(n1); count++; }
        if (n2) { sum += Number(n2); count++; }
        if (n3) { sum += Number(n3); count++; }

        if (count === 0) return '';
        return (sum / count).toFixed(0);
    };

    const isGenerateDisabled = () => {
        if (isLoadingReport) return true;
        if (!selectedAnoId) return true;
        if (reportType === 'resumen') return !selectedGradoId || !selectedSeccionId;
        return !selectedStudentId;
    };

    return (
        <div className="space-y-6">
            {/* Controles de Selección - Ocultos al imprimir */}
            <div className="bg-moon-component p-6 rounded-xl border border-moon-border print:hidden">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FileTextIcon /><span className="ml-2">Generador de Reportes</span>
                    </h2>

                    {/* Selector de Tipo */}
                    <div className="flex bg-moon-bg rounded-lg p-1 border border-moon-border">
                        <button
                            onClick={() => { setReportType('boletin'); setReportData(null); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === 'boletin' ? 'bg-blue-600 text-white shadow-lg' : 'text-moon-text hover:text-white'}`}
                        >
                            Boletín Individual
                        </button>
                        <button
                            onClick={() => { setReportType('acta'); setReportData(null); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === 'acta' ? 'bg-blue-600 text-white shadow-lg' : 'text-moon-text hover:text-white'}`}
                        >
                            Constancia de Estudio
                        </button>
                        <button
                            onClick={() => { setReportType('resumen'); setReportData(null); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reportType === 'resumen' ? 'bg-blue-600 text-white shadow-lg' : 'text-moon-text hover:text-white'}`}
                        >
                            Resumen de Notas
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Campos según tipo */}
                    {reportType !== 'resumen' ? (
                        // Buscador de Estudiante (Boletín y Constancia)
                        <div className="relative md:col-span-2">
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
                    ) : (
                        // Selectores de Grado y Sección (Solo para Resumen)
                        <>
                            <div>
                                <label className="block text-sm font-medium text-moon-text-secondary mb-2">Grado</label>
                                <select
                                    className="w-full bg-moon-bg border border-moon-border text-moon-text rounded-lg px-3 py-2 focus:outline-none focus:border-moon-primary"
                                    value={selectedGradoId || ''}
                                    onChange={(e) => setSelectedGradoId(Number(e.target.value))}
                                >
                                    <option value="" style={{ backgroundColor: '#1a1d2d' }}>Seleccionar...</option>
                                    {grados.map(g => (
                                        <option key={g.id_grado} value={g.id_grado} style={{ backgroundColor: '#1a1d2d' }}>{g.nombre_grado}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moon-text-secondary mb-2">Sección</label>
                                <select
                                    className="w-full bg-moon-bg border border-moon-border text-moon-text rounded-lg px-3 py-2 focus:outline-none focus:border-moon-primary"
                                    value={selectedSeccionId || ''}
                                    onChange={(e) => setSelectedSeccionId(Number(e.target.value))}
                                >
                                    <option value="" style={{ backgroundColor: '#1a1d2d' }}>Seleccionar...</option>
                                    {secciones.map(s => (
                                        <option key={s.id_seccion} value={s.id_seccion} style={{ backgroundColor: '#1a1d2d' }}>{s.nombre_seccion}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Selector de Año Escolar (Común) */}
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
                            disabled={isGenerateDisabled()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingReport ? 'Generando...' : (
                                reportType === 'boletin' ? 'Ver Boletín' :
                                    reportType === 'acta' ? 'Ver Constancia' : 'Ver Resumen'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Vista Previa */}
            {reportData && (
                <div className="animate-fade-in pb-10">
                    {/* Botonera Flotante */}
                    <div className="flex justify-end mb-4 print:hidden gap-2">
                        {reportType === 'resumen' && (
                            <button
                                onClick={handleDownloadExcel}
                                className="flex items-center bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
                            >
                                <DownloadIcon />
                                <span className="ml-2">Excel (XLSX)</span>
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
                        >
                            <PrinterIcon />
                            <span className="ml-2">Imprimir PDF</span>
                        </button>
                    </div>

                    {/* Renderizado Condicional */}
                    {reportType === 'acta' ? (
                        <ConstanciaReport data={reportData} />
                    ) : reportType === 'resumen' ? (
                        <ResumenReport data={reportData} />
                    ) : (
                        // Diseño Boletín - Ajustado para parecerse a la imagen de referencia #2
                        <div className="bg-white text-black mx-auto print:mx-0 w-[21.59cm] min-h-[27.94cm] p-8 shadow-2xl print:shadow-none font-sans text-xs flex flex-col justify-between">

                            <div>
                                {/* Header Boletín */}
                                <div className="flex justify-between items-start mb-2 px-4">
                                    <div className="w-20 h-24 flex items-center justify-center">
                                        {/* Placeholder si no hay imagen específica, o escudo de Venezuela si se encuentra */}
                                    </div>
                                    <div className="text-center flex-1 mx-2">
                                        <h2 className="font-bold text-xs tracking-wide">REPUBLICA BOLIVARIANA DE VENEZUELA</h2>
                                        <h2 className="font-bold text-xs tracking-wide">MINISTERIO DEL PODER POPULAR PARA LA EDUCACION</h2>
                                        <h1 className="font-extrabold text-sm mt-1">U.E.N "PEDRO EMILIO COLL"</h1>
                                        <h3 className="font-bold text-xs mt-1">DEPARTAMENTO DE EVALUACION</h3>
                                    </div>
                                    <div className="w-20 h-24 flex items-center justify-center">
                                        <img src="/images/logo_school.png" alt="Logo Escuela" className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                {/* Título y Año */}
                                <div className="mb-4">
                                    <div className="flex justify-end pr-8 mb-1">
                                        <div className="text-right">
                                            <div className="font-bold text-[10px] border-b border-black inline-block">{reportData.boletin[0]?.nombre_grado || '1er'} Año AÑO</div>
                                            <br />
                                            <div className="font-bold text-[10px] border-b border-black inline-block">SECCION: "{reportData.boletin[0]?.nombre_seccion || 'A'}"</div>
                                        </div>
                                    </div>
                                    <div className="text-center border-t border-black pt-1 mx-4">
                                        <h3 className="font-bold uppercase text-[11px] tracking-widest">REGISTRO INFORMATIVO DE LOS PROCESOS APRENDIZAJE</h3>
                                        <h2 className="text-lg font-extrabold mt-1">Año Escolar: {reportData.anoEscolar.nombre}</h2>
                                    </div>
                                </div>

                                {/* Datos Estudiante */}
                                <div className="flex items-end mb-4 text-xs font-bold uppercase gap-2 border-b-2 border-black pb-1">
                                    <span className="mb-0.5">ESTUDIANTE</span>
                                    <div className="flex-1 text-center text-sm font-extrabold pb-0.5 border-b border-black">
                                        {reportData.student.apellidos} {reportData.student.nombres}
                                    </div>
                                    <span className="mb-0.5">C.I:</span>
                                    <div className="w-32 text-center text-sm font-extrabold pb-0.5 border-b border-black">
                                        {reportData.student.nacionalidad}-{reportData.student.cedula}
                                    </div>
                                </div>

                                {/* Tabla de Notas */}
                                <div className="mb-4">
                                    <table className="w-full border-collapse border-2 border-black text-xs font-bold uppercase">
                                        <thead>
                                            <tr>
                                                <th rowSpan={2} className="border-2 border-black px-2 py-1 text-center bg-white align-middle w-auto">ASIGNATURAS</th>
                                                <th colSpan={3} className="border-2 border-black px-2 py-1 text-center bg-white border-b-0 w-[30%]">LAPSO</th>
                                                <th rowSpan={2} className="border-2 border-black px-2 py-1 text-center bg-white w-[10%] align-middle">DEF</th>
                                            </tr>
                                            <tr>
                                                <th className="border-2 border-black px-2 py-1 text-center w-[10%]">1°</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-[10%]">2°</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-[10%]">3°</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Filas de materias reales */}
                                            {reportData.boletin.map((materia: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="border-2 border-black px-2 py-1.5 text-left">{materia.nombre_materia}</td>
                                                    <td className="border-2 border-black px-2 py-1.5 text-center text-sm">{getLapsoNota(materia.lapso1)}</td>
                                                    <td className="border-2 border-black px-2 py-1.5 text-center text-sm">{getLapsoNota(materia.lapso2)}</td>
                                                    <td className="border-2 border-black px-2 py-1.5 text-center text-sm">{getLapsoNota(materia.lapso3)}</td>
                                                    <td className="border-2 border-black px-2 py-1.5 text-center text-sm font-extrabold">{getDefinitiva(materia)}</td>
                                                </tr>
                                            ))}

                                            {/* Relleno para mantener altura constante (ej. 13 filas total incluyendo promedio) */}
                                            {[...Array(Math.max(0, 11 - reportData.boletin.length))].map((_, i) => (
                                                <tr key={`fill-${i}`}>
                                                    <td className="border-2 border-black px-2 py-1.5 text-left text-transparent">.</td>
                                                    <td className="border-2 border-black px-2 py-1.5"></td>
                                                    <td className="border-2 border-black px-2 py-1.5"></td>
                                                    <td className="border-2 border-black px-2 py-1.5"></td>
                                                    <td className="border-2 border-black px-2 py-1.5"></td>
                                                </tr>
                                            ))}

                                            {/* Promedio */}
                                            <tr className="bg-gray-100 print:bg-gray-100">
                                                <td className="border-2 border-black px-2 py-1.5 text-left">PROMEDIO DE CALIFICACION LAPSO</td>
                                                <td className="border-2 border-black px-2 py-1.5 text-center font-bold">
                                                    {(reportData.boletin.reduce((acc: number, m: any) => acc + Number(getLapsoNota(m.lapso1) || 0), 0) / (reportData.boletin.filter((m: any) => getLapsoNota(m.lapso1)).length || 1)).toFixed(0)}
                                                </td>
                                                <td className="border-2 border-black px-2 py-1.5 text-center font-bold">
                                                    {(reportData.boletin.reduce((acc: number, m: any) => acc + Number(getLapsoNota(m.lapso2) || 0), 0) / (reportData.boletin.filter((m: any) => getLapsoNota(m.lapso2)).length || 1)).toFixed(0)}
                                                </td>
                                                <td className="border-2 border-black px-2 py-1.5 text-center font-bold"></td>
                                                <td className="border-2 border-black px-2 py-1.5 text-center font-bold"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Materia Pendiente */}
                                <div className="mb-4">
                                    <table className="w-full border-collapse border-2 border-black text-xs font-bold uppercase">
                                        <thead>
                                            <tr>
                                                <th className="border-2 border-black px-2 py-1 text-center bg-gray-100 print:bg-gray-100 w-1/3">MATERIA PENDIENTE</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-12">1°</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-12">2°</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-12">3°</th>
                                                <th className="border-2 border-black px-2 py-1 text-center w-16">4°</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                            </tr>
                                            <tr>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                                <td className="border-2 border-black px-2 py-2"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer / Firmas */}
                            <div>
                                <div className="border-2 border-black mb-2">
                                    {/* Fecha Entrega */}
                                    <div className="grid grid-cols-[1fr_3fr] border-b-2 border-black h-8">
                                        <div className="border-r-2 border-black px-2 flex items-center font-bold bg-white print:bg-white">FECHA DE ENTREGA</div>
                                        <div className="grid grid-cols-3 h-full">
                                            <div className="border-r-2 border-black"></div>
                                            <div className="border-r-2 border-black"></div>
                                            <div></div>
                                        </div>
                                    </div>
                                    {/* Profesor Guia */}
                                    <div className="grid grid-cols-[1fr_3fr] border-b-2 border-black h-12">
                                        <div className="border-r-2 border-black px-2 flex items-center justify-center font-bold text-center">PROFESOR GUIA</div>
                                        <div className="grid grid-cols-3 h-full">
                                            <div className="border-r-2 border-black"></div>
                                            <div className="border-r-2 border-black"></div>
                                            <div></div>
                                        </div>
                                    </div>
                                    {/* Representante */}
                                    <div className="grid grid-cols-[1fr_3fr] border-b-2 border-black h-12">
                                        <div className="border-r-2 border-black px-2 flex items-center justify-center font-bold text-center">REPRESENTANTE</div>
                                        <div className="grid grid-cols-3 h-full">
                                            <div className="border-r-2 border-black"></div>
                                            <div className="border-r-2 border-black"></div>
                                            <div></div>
                                        </div>
                                    </div>
                                    {/* Observaciones */}
                                    <div className="grid grid-cols-[1fr_3fr] h-20">
                                        <div className="border-r-2 border-black px-2 flex items-center justify-center font-bold text-center">OBSERVACIONES</div>
                                        <div className="grid grid-cols-3 h-full">
                                            <div className="border-r-2 border-black"></div>
                                            <div className="border-r-2 border-black"></div>
                                            <div></div>
                                        </div>
                                    </div>
                                </div>


                                {/* Texto Legal */}
                                <div className="text-justify text-[9px] leading-tight font-medium">
                                    <p>Articulo 109. (RLOE): "La asistencia a clases es obligatoria. El porcentaje mínimo de asistencia para optar a la aprobación de un grado, área, asignatura o similar, según el caso, será del setenta y cinco por ciento (75%). Queda a salvo lo que se determine en el articulo 60 de este Reglamento"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
