import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, CheckCircleIcon, UsersIcon, BookOpenIcon, XIcon } from './Icons';

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'success' | 'warning';
}

export const NotificationPopover: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, title: 'Bienvenido', message: 'Bienvenido al nuevo sistema Boletín360.', time: 'Hace 5 min', read: false, type: 'success' },
        { id: 2, title: 'Actualización', message: 'Se han actualizado los módulos de docentes.', time: 'Hace 1 hora', read: false, type: 'info' },
        { id: 3, title: 'Recordatorio', message: 'Recuerde subir las notas del lapso 1.', time: 'Hace 2 horas', read: true, type: 'warning' },
    ]);
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Toggle popover
    const toggleOpen = () => setIsOpen(!isOpen);

    // Mark as read
    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(notifications.filter(n => n.id !== id));
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggleOpen}
                className="relative text-moon-text-secondary hover:text-moon-text focus:outline-none transition-colors p-1"
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moon-purple opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-moon-purple"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-moon-component rounded-lg shadow-xl border border-moon-border z-50 animate-[fade-in_0.1s_ease-out] overflow-hidden">
                    <div className="p-3 border-b border-moon-border flex justify-between items-center bg-moon-nav/50">
                        <h3 className="font-semibold text-white text-sm">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-moon-purple-light hover:underline">
                                Marcar todas leídas
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-moon-text-secondary text-sm">
                                <CheckCircleIcon />
                                <p className="mt-2">No tienes notificaciones.</p>
                            </div>
                        ) : (
                            <ul>
                                {notifications.map(notification => (
                                    <li key={notification.id} className={`p-3 border-b border-moon-border hover:bg-moon-nav/30 transition-colors relative group ${notification.read ? 'opacity-70' : 'bg-moon-purple/5'}`}>
                                        <div className="flex items-start" onClick={() => markAsRead(notification.id)}>
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-transparent' : 'bg-moon-purple'}`}></div>
                                            <div className="ml-3 flex-1 cursor-pointer">
                                                <p className={`text-sm font-medium ${notification.read ? 'text-moon-text-secondary' : 'text-white'}`}>{notification.title}</p>
                                                <p className="text-xs text-moon-text-secondary mt-0.5">{notification.message}</p>
                                                <p className="text-[10px] text-moon-text-secondary mt-1 opacity-60">{notification.time}</p>
                                            </div>
                                            <button onClick={(e) => removeNotification(notification.id, e)} className="text-moon-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <XIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-2 text-center border-t border-moon-border bg-moon-nav/30">
                        <button className="text-xs text-moon-text-secondary hover:text-white transition-colors">
                            Ver historial completo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
