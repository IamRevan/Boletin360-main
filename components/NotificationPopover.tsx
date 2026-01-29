import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, CheckCircleIcon, UsersIcon, BookOpenIcon, XIcon, PlusIcon, MegaphoneIcon } from './Icons';
import { useData, useDataDispatch } from '../state/DataContext';
import { ActionType } from '../state/actions';
import { useAuth } from '../state/AuthContext';
import { ModalType, UserRole } from '../types';

export const NotificationPopover: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
    const ref = useRef<HTMLDivElement>(null);
    const { notifications, announcements } = useData();
    const dispatch = useDataDispatch();
    const { currentUser } = useAuth();

    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    // Announcements don't have read status per user in this simple impl, so we just show them.
    // Enhanced impl would track read status for announcements too.

    // Sort announcements by date desc
    const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const toggleOpen = () => setIsOpen(!isOpen);

    const markAsRead = (id: number) => {
        dispatch({ type: ActionType.MARK_NOTIFICATION_READ, payload: id });
    };

    const markAllRead = () => {
        if (currentUser) {
            dispatch({ type: ActionType.MARK_ALL_NOTIFICATIONS_READ, payload: currentUser.id });
        }
    };

    const removeNotification = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        // Optimistic delete from UI not fully implemented in reducer for Notifications delete, 
        // assuming MARK_READ is main action. But we can implement delete if API supports it.
        // API supports deleteNotification.
        // We'd need a DELETE_NOTIFICATION action. For now, mark as read is main interaction.
    };

    const handleCreateAnnouncement = () => {
        setIsOpen(false);
        dispatch({
            type: ActionType.OPEN_MODAL,
            payload: { modal: ModalType.CreateAnnouncement }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={toggleOpen}
                className="relative text-moon-text-secondary hover:text-moon-text focus:outline-none transition-colors p-1"
            >
                <BellIcon />
                {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moon-purple opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-moon-purple"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-moon-component rounded-lg shadow-xl border border-moon-border z-50 animate-[fade-in_0.1s_ease-out] overflow-hidden flex flex-col max-h-[500px]">
                    <div className="p-3 border-b border-moon-border bg-moon-nav/50 flex justify-between items-center">
                        <h3 className="font-semibold text-white text-sm">Centro de Notificaciones</h3>
                        {currentUser?.role === UserRole.Admin && (
                            <button
                                onClick={handleCreateAnnouncement}
                                className="text-xs flex items-center gap-1 bg-moon-purple px-2 py-1 rounded text-white hover:bg-moon-purple-light transition-colors"
                            >
                                <PlusIcon className="w-3 h-3" /> Anuncio
                            </button>
                        )}
                    </div>

                    <div className="flex border-b border-moon-border">
                        <button
                            className={`flex-1 p-2 text-sm text-center transition-colors ${activeTab === 'notifications' ? 'text-moon-purple border-b-2 border-moon-purple font-medium' : 'text-moon-text-secondary hover:text-moon-text'}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            Notificaciones ({unreadNotifications})
                        </button>
                        <button
                            className={`flex-1 p-2 text-sm text-center transition-colors ${activeTab === 'announcements' ? 'text-moon-purple border-b-2 border-moon-purple font-medium' : 'text-moon-text-secondary hover:text-moon-text'}`}
                            onClick={() => setActiveTab('announcements')}
                        >
                            <span className="flex items-center justify-center gap-1">
                                <MegaphoneIcon className="w-3 h-3" /> Anuncios
                            </span>
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {activeTab === 'notifications' ? (
                            sortedNotifications.length === 0 ? (
                                <div className="p-8 text-center text-moon-text-secondary text-sm flex flex-col items-center">
                                    <CheckCircleIcon className="w-8 h-8 opacity-50 mb-2" />
                                    <p>Estás al día.</p>
                                </div>
                            ) : (
                                <ul>
                                    {sortedNotifications.map(notification => (
                                        <li key={notification.id} className={`p-3 border-b border-moon-border hover:bg-moon-nav/30 transition-colors relative group ${notification.isRead ? 'opacity-70' : 'bg-moon-purple/5'}`}>
                                            <div className="flex items-start" onClick={() => !notification.isRead && markAsRead(notification.id)}>
                                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-transparent' : 'bg-moon-purple'}`}></div>
                                                <div className="ml-3 flex-1 cursor-pointer">
                                                    <p className={`text-sm font-medium ${notification.isRead ? 'text-moon-text-secondary' : 'text-white'}`}>{notification.title}</p>
                                                    <p className="text-xs text-moon-text-secondary mt-0.5">{notification.content}</p>
                                                    <p className="text-[10px] text-moon-text-secondary mt-1 opacity-60">{formatDate(notification.createdAt)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )
                        ) : (
                            // Announcements Tab
                            sortedAnnouncements.length === 0 ? (
                                <div className="p-8 text-center text-moon-text-secondary text-sm flex flex-col items-center">
                                    <MegaphoneIcon className="w-8 h-8 opacity-50 mb-2" />
                                    <p>No hay anuncios recientes.</p>
                                </div>
                            ) : (
                                <ul>
                                    {sortedAnnouncements.map(announcement => (
                                        <li key={announcement.id} className="p-3 border-b border-moon-border hover:bg-moon-nav/30 transition-colors relative">
                                            <div className="flex items-start">
                                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${announcement.type === 'warning' ? 'bg-yellow-500' :
                                                        announcement.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}></div>
                                                <div className="ml-3 flex-1">
                                                    <p className="text-sm font-medium text-white">{announcement.title}</p>
                                                    <p className="text-xs text-moon-text-secondary mt-0.5">{announcement.content}</p>
                                                    <p className="text-[10px] text-moon-text-secondary mt-1 opacity-60">{formatDate(announcement.createdAt)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )
                        )}
                    </div>

                    {activeTab === 'notifications' && unreadNotifications > 0 && (
                        <div className="p-2 text-center border-t border-moon-border bg-moon-nav/30">
                            <button onClick={markAllRead} className="text-xs text-moon-purple-light hover:underline w-full">
                                Marcar todas como leídas
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
