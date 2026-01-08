'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserRole } from '@/types';
import { ArrowRightIcon, BookOpenIcon, UsersIcon } from '@/components/Icons';

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
                    setActiveTab(response.data.history[0].id); // Select first year by default (usually latest)
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

    const getLapsoNota = (lapso: any[]) => {
        if (!lapso || lapso.length === 0) return '-';
        const sum = lapso.reduce((acc, curr) => acc + Number(curr.nota), 0);
        return (sum / lapso.length).toFixed(1);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-moon-component h-48 rounded-xl animate-pulse"></div>
                <div className="bg-moon-component h-96 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    if (!profile) return <div>Estudiante no encontrado.</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Perfil */}
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
                            <span className={`px-2 py-1 rounded text-xs font-bold ${profile.student.status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {profile.student.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Info Lateral */}
                <div className="space-y-6">
                    <div className="bg-moon-component p-6 rounded-xl border border-moon-border">
                        <h3 className="text-lg font-bold text-white mb-4">Datos Personales</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-moon-text-secondary block">Email</span>
                                <span className="text-moon-text">{profile.student.email}</span>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block">Género</span>
                                <span className="text-moon-text">{profile.student.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                            </div>
                            <div>
                                <span className="text-moon-text-secondary block">Fecha de Nacimiento</span>
                                <span className="text-moon-text">{profile.student.fecha_nacimiento || 'No registrada'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Historial Académico */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <BookOpenIcon className="mr-2" /> Historial Académico
                    </h2>

                    {profile.history.length === 0 ? (
                        <div className="bg-moon-component p-8 rounded-xl border border-moon-border text-center text-moon-text-secondary">
                            No hay historial académico registrado.
                        </div>
                    ) : (
                        <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                            {/* Tabs de Años */}
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

                            {/* Contenido del Tab */}
                            <div className="p-6">
                                {profile.history.map((year: any) => (
                                    activeTab === year.id && (
                                        <div key={year.id} className="animate-fade-in">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{year.grado}</h3>
                                                    <p className="text-sm text-moon-text-secondary">Sección "{year.seccion}"</p>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/reports?studentId=${id}&anoId=${year.id}`)} // Navegación simulada al reporte
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
                                                            const def = ((Number(getLapsoNota(materia.lapso1)) + Number(getLapsoNota(materia.lapso2)) + Number(getLapsoNota(materia.lapso3))) / 3).toFixed(1);
                                                            return (
                                                                <tr key={idx} className="border-b border-moon-border hover:bg-moon-nav/50">
                                                                    <td className="px-4 py-3 font-medium text-white">{materia.nombre_materia}</td>
                                                                    <td className="px-4 py-3 text-center">{getLapsoNota(materia.lapso1)}</td>
                                                                    <td className="px-4 py-3 text-center">{getLapsoNota(materia.lapso2)}</td>
                                                                    <td className="px-4 py-3 text-center">{getLapsoNota(materia.lapso3)}</td>
                                                                    <td className={`px-4 py-3 text-center font-bold ${Number(def) >= 10 ? 'text-green-400' : 'text-red-400'}`}>{def}</td>
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
