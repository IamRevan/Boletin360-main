'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchIcon } from '@/components/Icons';

interface AuditLog {
    id: number;
    userId: number | null;
    userName: string;
    action: string;
    details: string | null;
    timestamp: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [actions, setActions] = useState<string[]>([]);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Fetch available actions
    useEffect(() => {
        const fetchActions = async () => {
            try {
                const response = await api.get('/audit-logs/actions');
                setActions(response.data);
            } catch (err) {
                console.error('Error fetching actions:', err);
            }
        };
        fetchActions();
    }, []);

    // Fetch logs
    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (filterAction) params.append('action', filterAction);
                if (filterStartDate) params.append('startDate', filterStartDate);
                if (filterEndDate) params.append('endDate', filterEndDate);
                params.append('limit', String(ITEMS_PER_PAGE));
                params.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE));

                const response = await api.get(`/audit-logs?${params.toString()}`);
                setLogs(response.data.logs);
                setTotal(response.data.total);
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [filterAction, filterStartDate, filterEndDate, currentPage]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-VE', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-400';
        if (action.includes('CREATE')) return 'text-green-400';
        if (action.includes('UPDATE')) return 'text-yellow-400';
        if (action.includes('LOGIN')) return 'text-blue-400';
        return 'text-moon-text-secondary';
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 animate-[fade-in_0.5s_ease-out]">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Auditoría del Sistema</h2>
                <p className="text-moon-text-secondary mt-1">Registro de todas las acciones realizadas en el sistema.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-moon-component p-4 rounded-xl border border-moon-border">
                <select
                    value={filterAction}
                    onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                    className="bg-moon-nav border border-moon-border rounded-lg px-3 py-2 text-moon-text"
                >
                    <option value="">Todas las acciones</option>
                    {actions.map(a => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <span className="text-moon-text-secondary text-sm">Desde:</span>
                    <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                        className="bg-moon-nav border border-moon-border rounded-lg px-3 py-2 text-moon-text"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-moon-text-secondary text-sm">Hasta:</span>
                    <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-moon-nav border border-moon-border rounded-lg px-3 py-2 text-moon-text"
                    />
                </div>

                {(filterAction || filterStartDate || filterEndDate) && (
                    <button
                        onClick={() => { setFilterAction(''); setFilterStartDate(''); setFilterEndDate(''); setCurrentPage(1); }}
                        className="text-red-400 hover:text-red-300 text-sm"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-moon-component rounded-xl border border-moon-border overflow-hidden">
                <div className="p-4 border-b border-moon-border">
                    <span className="text-moon-text-secondary text-sm">
                        Mostrando {logs.length} de {total} registros
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} height={48} />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-moon-text-secondary uppercase bg-moon-nav">
                                <tr>
                                    <th className="px-4 py-3">Fecha/Hora</th>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Acción</th>
                                    <th className="px-4 py-3">Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-moon-text-secondary">
                                            No se encontraron registros.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="border-b border-moon-border hover:bg-moon-nav/50">
                                            <td className="px-4 py-3 text-moon-text-secondary whitespace-nowrap">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-4 py-3 text-white">
                                                {log.userName}
                                            </td>
                                            <td className={`px-4 py-3 font-mono text-xs ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </td>
                                            <td className="px-4 py-3 text-moon-text-secondary max-w-md truncate">
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-moon-border">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-moon-nav rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 text-moon-text-secondary">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-moon-nav rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
