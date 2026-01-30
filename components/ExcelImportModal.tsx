'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { XIcon } from './Icons';
import { useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { api } from '../lib/api';
import { useToast } from '../state/ToastContext';
import { StudentStatus } from '../types';

interface ImportedStudent {
    nacionalidad: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    genero: string;
    fecha_nacimiento?: string;
    id_grado?: number;
    id_seccion?: number;
}

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [parsedData, setParsedData] = useState<ImportedStudent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setErrors([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

                // Mapear columnas del Excel a campos esperados
                const mapped: ImportedStudent[] = jsonData.map((row, index) => {
                    const student: ImportedStudent = {
                        nacionalidad: row['Nacionalidad'] || row['nacionalidad'] || 'V',
                        cedula: String(row['Cedula'] || row['cedula'] || row['Cédula'] || ''),
                        nombres: row['Nombres'] || row['nombres'] || '',
                        apellidos: row['Apellidos'] || row['apellidos'] || '',
                        email: row['Email'] || row['email'] || row['Correo'] || '',
                        genero: row['Genero'] || row['genero'] || row['Género'] || 'F',
                        fecha_nacimiento: row['Fecha_Nacimiento'] || row['fecha_nacimiento'] || undefined,
                        id_grado: row['Grado'] ? Number(row['Grado']) : undefined,
                        id_seccion: row['Seccion'] ? Number(row['Seccion']) : undefined,
                    };
                    return student;
                });

                // Validar datos mínimos
                const validationErrors: string[] = [];
                mapped.forEach((s, i) => {
                    if (!s.cedula) validationErrors.push(`Fila ${i + 2}: Cédula requerida`);
                    if (!s.nombres) validationErrors.push(`Fila ${i + 2}: Nombres requeridos`);
                    if (!s.apellidos) validationErrors.push(`Fila ${i + 2}: Apellidos requeridos`);
                });

                if (validationErrors.length > 0) {
                    setErrors(validationErrors.slice(0, 5)); // Mostrar máx 5 errores
                    if (validationErrors.length > 5) {
                        setErrors(prev => [...prev, `... y ${validationErrors.length - 5} errores más`]);
                    }
                }

                setParsedData(mapped.filter(s => s.cedula && s.nombres && s.apellidos));
            } catch (err) {
                console.error('Error parsing Excel:', err);
                setErrors(['Error al leer el archivo. Asegúrese de que sea un archivo Excel válido.']);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const student of parsedData) {
            try {
                const response = await api.createStudent({
                    ...student,
                    status: StudentStatus.ACTIVO
                });
                dispatch({ type: ActionType.SAVE_STUDENT, payload: response.data });
                successCount++;
            } catch (err) {
                console.error('Error importing student:', student.cedula, err);
                errorCount++;
            }
        }

        setIsLoading(false);

        if (successCount > 0) {
            addToast(`${successCount} estudiantes importados correctamente`, 'success');
        }
        if (errorCount > 0) {
            addToast(`${errorCount} estudiantes no pudieron ser importados`, 'error');
        }

        onClose();
        setParsedData([]);
        setFileName('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-moon-component rounded-xl border border-moon-border w-full max-w-2xl shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-moon-border">
                    <h3 className="text-xl font-bold text-white">Importar Estudiantes desde Excel</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-moon-text-secondary hover:bg-moon-border hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Instrucciones */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                        <p className="font-semibold mb-2">Formato esperado del Excel:</p>
                        <p>Columnas: Nacionalidad, Cedula, Nombres, Apellidos, Email, Genero, Grado, Seccion</p>
                    </div>

                    {/* Input File */}
                    <div>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-moon-border rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                        >
                            <div className="text-moon-text-secondary">
                                {fileName ? (
                                    <span className="text-white">{fileName}</span>
                                ) : (
                                    <>
                                        <span className="text-3xl block mb-2">📁</span>
                                        <span>Click para seleccionar archivo Excel</span>
                                    </>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* Errores */}
                    {errors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
                            <p className="font-semibold mb-2">Errores encontrados:</p>
                            <ul className="list-disc list-inside">
                                {errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Preview */}
                    {parsedData.length > 0 && (
                        <div className="bg-moon-nav rounded-lg p-4">
                            <p className="text-sm text-moon-text-secondary mb-2">
                                Vista previa: {parsedData.length} estudiantes válidos
                            </p>
                            <div className="max-h-40 overflow-y-auto text-sm">
                                {parsedData.slice(0, 5).map((s, i) => (
                                    <div key={i} className="text-moon-text py-1 border-b border-moon-border/50">
                                        {s.nacionalidad}-{s.cedula} - {s.nombres} {s.apellidos}
                                    </div>
                                ))}
                                {parsedData.length > 5 && (
                                    <div className="text-moon-text-secondary py-1">
                                        ... y {parsedData.length - 5} más
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-moon-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-moon-border hover:bg-moon-nav text-white rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={parsedData.length === 0 || isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Importando...' : `Importar ${parsedData.length} estudiantes`}
                    </button>
                </div>
            </div>
        </div>
    );
};
