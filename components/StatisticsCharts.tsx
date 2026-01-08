'use client';

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { type Student, type Grado } from '../types';

interface StatisticsChartsProps {
    students: Student[];
    grados: Grado[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

export const StatisticsCharts: React.FC<StatisticsChartsProps> = ({ students, grados }) => {

    const dataByGrade = useMemo(() => {
        // Inicializar contadores por grado
        const counts: Record<string, number> = {};
        grados.forEach(g => counts[g.nombre_grado] = 0);
        // Tambien manejar "Sin Asignar" o grados que no esten en la lista
        counts['Otros'] = 0;

        students.forEach(s => {
            const grado = grados.find(g => g.id_grado === s.id_grado);
            if (grado) {
                counts[grado.nombre_grado] = (counts[grado.nombre_grado] || 0) + 1;
            } else {
                counts['Otros']++;
            }
        });

        // Filtrar "Otros" si es 0
        if (counts['Otros'] === 0) delete counts['Otros'];

        return Object.entries(counts).map(([name, count]) => ({
            name,
            count
        }));
    }, [students, grados]);

    const dataByStatus = useMemo(() => {
        const counts: Record<string, number> = {};
        students.forEach(s => {
            const status = s.status || 'Desconocido';
            counts[status] = (counts[status] || 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [students]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Gráfico de Barras: Estudiantes por Grado */}
            <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                <h3 className="text-xl font-bold text-white mb-4">Matrícula por Grado</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataByGrade}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" fill="#8884d8" name="Estudiantes" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfico Circular: Distribución por Estatus */}
            <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                <h3 className="text-xl font-bold text-white mb-4">Estatus Académico</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#82ca9d"
                                dataKey="value"
                            >
                                {dataByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
