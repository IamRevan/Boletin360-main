'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BookOpenIcon, UserCheckIcon, ArrowRightIcon } from '@/components/Icons';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import Link from 'next/link';

interface TeacherClass {
    id: number;
    nombre_materia: string;
    nombre_grado: string;
    nombre_seccion: string;
    student_count: string;
}

export default function TeacherClassesPage() {
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/teacher/classes');
                setClasses(res.data);
            } catch (error) {
                console.error("Error fetching classes", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClasses();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white">Mis Clases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CardSkeleton /><CardSkeleton /><CardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold text-white">Mis Clases</h2>
                <p className="text-moon-text-secondary mt-1">Seleccione una asignatura para gestionar las calificaciones.</p>
            </div>

            {classes.length === 0 ? (
                <div className="text-center py-20 bg-moon-component rounded-xl border border-moon-border text-moon-text-secondary">
                    <BookOpenIcon />
                    <p className="mt-4">No tiene clases asignadas actualmente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Link
                            href={`/teacher/gradebook/${cls.id}`}
                            key={cls.id}
                            className="bg-moon-component border border-moon-border rounded-xl p-6 hover:border-moon-purple hover:shadow-lg hover:shadow-moon-purple/20 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-moon-purple/20 rounded-lg text-moon-purple">
                                    <BookOpenIcon />
                                </div>
                                <span className="bg-moon-nav px-3 py-1 rounded-full text-xs text-moon-text-secondary font-medium">
                                    {cls.nombre_grado} "{cls.nombre_seccion}"
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-moon-purple transition-colors">
                                {cls.nombre_materia}
                            </h3>

                            <div className="flex items-center text-moon-text-secondary text-sm mt-4">
                                <UserCheckIcon />
                                <span className="ml-2">{cls.student_count} Estudiantes</span>
                            </div>

                            <div className="mt-6 flex items-center text-moon-purple text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                                <span>Ir al libro de notas</span>
                                <span className="ml-2"><ArrowRightIcon /></span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
