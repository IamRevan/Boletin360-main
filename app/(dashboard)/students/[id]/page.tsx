'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserRole, StudentStatus } from '@/types';
import { ArrowRightIcon, BookOpenIcon, UsersIcon } from '@/components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function calcLapsoPromedio(lapso: any[]): number | null {
    if (!lapso || lapso.length === 0) return null;
    const sum = lapso.reduce((acc, curr) => acc + Number(curr.nota), 0);
    return sum / lapso.length;
}

function weightedLapsoAverage(evals: any[]): number {
    if (!evals || evals.length === 0) return 0;
    const totalWeight = evals.reduce((s: number, e: any) => s + Number(e.ponderacion), 0);
    if (totalWeight === 0) return 0;
    return evals.reduce((s: number, e: any) => s + Number(e.nota) * Number(e.ponderacion), 0) / totalWeight;
}

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<number | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/students/${id}/profile`);
                setProfile(response.data);
                if (response.data.history.length > 0) {
                    setActiveTab(response.data.history[0].id);
                }
            } catch (error) {
                console.error("Error fetching profile", error);
                alert("No se pudo cargar el perfil.");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-moon-component h-48 rounded-xl animate-pulse"></div>
                <div className="bg-moon-component h-96 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (!profile) return <div>Estudiante no encontrado.</div>;

    const activeYear = profile.history.find((y: any) => y.id === activeTab);
    const chartData = activeYear?.materias?.map((m: any) => ({
        materia: m.nombreMateria.length > 18 ? m.nombreMateria.slice(0, 15) + '...' : m.nombreMateria,
        Lapso1: parseFloat(weightedLapsoAverage(m.lapso1).toFixed(1)),
        Lapso2: parseFloat(weightedLapsoAverage(m.lapso2).toFixed(1)),
        Lapso3: parseFloat(weightedLapsoAverage(m.lapso3).toFixed(1)),
    })) ?? [];

    const allDefinitivas = activeYear?.materias?.map((m: any) => {
        const l1 = weightedLapsoAverage(m.lapso1);
        const l2 = weightedLapsoAverage(m.lapso2);
        const l3 = weightedLapsoAverage(m.lapso3);
        return (l1 + l2 + l3) / 3;
    }) ?? [];

    const promedioGeneral = allDefinitivas.length > 0
        ? (allDefinitivas.reduce((s: number, v: number) => s + v, 0) / allDefinitivas.length).toFixed(1)
        : '-';
    const aprobadas = allDefinitivas.filter((d: number) => d >= 9.5).length;
    const reprobadas = allDefinitivas.filter((d: number) => d < 9.5).length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12">
                    <div className="relative w-24 h-24 rounded-full bg-moon-component border-4 border-moon-component flex items-center justify-center text-4xl shadow-xl text-white">
                        <UsersIcon />
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex-1">
                        <h1 className="text-2xl font-bold text-white">{profile.student.nombres} {profile.student.apellidos}</h1>
                        <p className="text-moon-text-secondary">{profile.student.nacionalidad}-{profile.student.cedula}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-4">
                        <div className="text-right">
                            <p className="text-xs text-moon-text-secondary uppercase">Estado</p>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${profile.student.status === StudentStatus.ACTIVO ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {profile.student.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {profile.history.length > 1 && (
                <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                    <div className="flex items-center space-x-2 overflow-x-auto py-2">
                        {profile.history.map((year: any, idx: number) => (
                            <React.Fragment key={year.id}>
                                <button
                                    onClick={() => setActiveTab(year.id)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === year.id ? 'bg-blue-600 text-white' : 'bg-moon-nav text-moon-text-secondary hover:text-white'}`}
                                >
                                    {year.nombre} - {year.nombreGrado} "{year.nombreSeccion}"
                                </button>
                                {idx < profile.history.length - 1 && (
                                    <ArrowRightIcon />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                        <h3 className="text-lg font-bold text-white mb-4">Datos Personales</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Contacto</span>
                                <div className="text-moon-text">{profile.student.email}</div>
                                <div className="text-moon-text">{profile.student.telefono || 'Sin teléfono'}</div>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Nacimiento</span>
                                <div className="text-moon-text">{profile.student.fechaNacimiento || 'No registrada'}</div>
                                <div className="text-moon-text text-moon-text-secondary">{profile.student.lugarNacimiento || 'Lugar no registrado'}</div>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Dirección</span>
                                <div className="text-moon-text">{profile.student.direccion || 'No registrada'}</div>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Género</span>
                                <span className="text-moon-text">{profile.student.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                        <h3 className="text-lg font-bold text-white mb-4">Datos del Representante</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Nombre</span>
                                <div className="text-moon-text font-medium">{profile.student.representante || 'No registrado'}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-moon-text-secondary block text-xs uppercase mb-1">Cédula</span>
                                    <div className="text-moon-text">{profile.student.cedulaR || '-'}</div>
                                </div>
                                <div>
                                    <span className="text-moon-text-secondary block text-xs uppercase mb-1">Teléfono</span>
                                    <div className="text-moon-text">{profile.student.telefonoR || '-'}</div>
                                </div>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block text-xs uppercase mb-1">Email</span>
                                <div className="text-moon-text">{profile.student.emailR || '-'}</div>
                            </div>
                            {profile.student.observaciones && (
                                <div>
                                    <span className="text-moon-text-secondary block text-xs uppercase mb-1">Observaciones</span>
                                    <div className="text-moon-text italic bg-moon-nav p-2 rounded border border-moon-border/50 text-xs">
                                        {profile.student.observaciones}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Summary */}
                    {activeYear && allDefinitivas.length > 0 && (
                        <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                            <h3 className="text-lg font-bold text-white mb-4">Resumen</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-moon-text-secondary text-xs uppercase">Promedio General</span>
                                    <div className={`text-2xl font-bold ${Number(promedioGeneral) >= 9.5 ? 'text-green-400' : 'text-orange-400'}`}>
                                        {promedioGeneral}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-moon-border">
                                    <div className="bg-green-500/10 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-400">{aprobadas}</div>
                                        <div className="text-xs text-moon-text-secondary">Aprobadas</div>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-400">{reprobadas}</div>
                                        <div className="text-xs text-moon-text-secondary">Reprobadas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <BookOpenIcon className="mr-2" /> Historial Académico
                    </h2>

                    {/* Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                            <h3 className="text-sm font-medium text-moon-text-secondary uppercase mb-4">Notas por Materia y Lapso</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="materia" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <YAxis domain={[0, 20]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F3F4F6' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
                                        <Bar dataKey="Lapso1" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Lapso2" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Lapso3" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {profile.history.length === 0 ? (
                        <div className="bg-moon-component p-8 rounded-xl border border-moon-border text-center text-moon-text-secondary">
                            No hay historial académico registrado.
                        </div>
                    ) : (
                        <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                            <div className="flex overflow-x-auto border-b border-moon-border">
                                {profile.history.map((year: any) => (
                                    <button
                                        key={year.id}
                                        onClick={() => setActiveTab(year.id)}
                                        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === year.id
                                            ? 'text-white border-b-2 border-blue-500 bg-moon-nav'
                                            : 'text-moon-text-secondary hover:text-white hover:bg-moon-nav/50'
                                            }`}
                                    >
                                        {year.nombre}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {profile.history.map((year: any) => (
                                    activeTab === year.id && (
                                        <div key={year.id} className="animate-fade-in">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{year.nombreGrado}</h3>
                                                    <p className="text-sm text-moon-text-secondary">Sección "{year.nombreSeccion}"</p>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/reports?studentId=${id}&anoId=${year.id}`)}
                                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                                                >
                                                    Ver en Reportes <span className="ml-1 flex items-center"><ArrowRightIcon /></span>
                                                </button>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left text-moon-text">
                                                    <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                                                        <tr>
                                                            <th className="px-4 py-3">Materia</th>
                                                            <th className="px-4 py-3 text-center">Lapso 1</th>
                                                            <th className="px-4 py-3 text-center">Lapso 2</th>
                                                            <th className="px-4 py-3 text-center">Lapso 3</th>
                                                            <th className="px-4 py-3 text-center text-white">Def.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {year.materias.map((materia: any, idx: number) => {
                                                            const l1 = weightedLapsoAverage(materia.lapso1);
                                                            const l2 = weightedLapsoAverage(materia.lapso2);
                                                            const l3 = weightedLapsoAverage(materia.lapso3);
                                                            const def = (l1 + l2 + l3) / 3;
                                                            return (
                                                                <tr key={idx} className="border-b border-moon-border hover:bg-moon-nav/50">
                                                                    <td className="px-4 py-3 font-medium text-white">{materia.nombreMateria}</td>
                                                                    <td className="px-4 py-3 text-center">{l1 > 0 ? l1.toFixed(1) : '-'}</td>
                                                                    <td className="px-4 py-3 text-center">{l2 > 0 ? l2.toFixed(1) : '-'}</td>
                                                                    <td className="px-4 py-3 text-center">{l3 > 0 ? l3.toFixed(1) : '-'}</td>
                                                                    <td className={`px-4 py-3 text-center font-bold ${def >= 9.5 ? 'text-green-400' : 'text-red-400'}`}>{def > 0 ? def.toFixed(1) : '-'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
