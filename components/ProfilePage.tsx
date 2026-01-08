'use client';


import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { type User } from '../types';
import { UserIcon, LockIcon, SaveIcon } from './Icons';

export const ProfilePage: React.FC = () => {
    const { currentUser } = useAppState();
    const dispatch = useAppDispatch();

    const [profileData, setProfileData] = useState({
        nombres: '',
        apellidos: '',
        email: '',
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (currentUser) {
            setProfileData({
                nombres: currentUser.nombres,
                apellidos: currentUser.apellidos,
                email: currentUser.email,
            });
        }
    }, [currentUser]);

    if (!currentUser) return null;

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({
            type: ActionType.UPDATE_CURRENT_USER_PROFILE,
            payload: { userId: currentUser.id, updates: profileData }
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Las nuevas contraseñas no coinciden.');
            return;
        }
        if (!passwordData.oldPassword || !passwordData.newPassword) {
            alert('Por favor, rellene todos los campos de contraseña.');
            return;
        }
        dispatch({
            type: ActionType.UPDATE_CURRENT_USER_PROFILE,
            payload: {
                userId: currentUser.id,
                updates: {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword,
                }
            }
        });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Mi Perfil</h2>
                <p className="text-moon-text-secondary mt-1">Gestiona tu información personal y de seguridad.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-moon-component rounded-xl border border-moon-border p-8 text-center sticky top-10">
                        <Image
                            src={`https://i.pravatar.cc/150?u=${currentUser.email}`}
                            alt="User Avatar"
                            className="rounded-full object-cover mx-auto mb-4 border-4 border-moon-purple"
                            width={112}
                            height={112}
                        />
                        <h3 className="text-2xl font-bold text-white">{currentUser.nombres} {currentUser.apellidos}</h3>
                        <p className="text-moon-text-secondary">{currentUser.email}</p>
                        <span className="mt-4 px-3 py-1 text-xs font-semibold rounded-full inline-block bg-moon-purple/20 text-moon-purple-light">
                            {currentUser.role}
                        </span>
                    </div>
                </div>

                {/* Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Edit Profile Form */}
                    <div className="bg-moon-component rounded-xl border border-moon-border">
                        <form onSubmit={handleProfileSubmit}>
                            <div className="p-6 border-b border-moon-border">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <UserIcon /> <span className="ml-3">Información Personal</span>
                                </h3>
                                <p className="text-moon-text-secondary text-sm mt-1">Actualiza tu nombre y correo electrónico.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nombres</label>
                                        <input type="text" name="nombres" value={profileData.nombres} onChange={handleProfileChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Apellidos</label>
                                        <input type="text" name="apellidos" value={profileData.apellidos} onChange={handleProfileChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Correo Electrónico</label>
                                    <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                </div>
                            </div>
                            <div className="flex justify-end p-4 bg-moon-nav/50 rounded-b-xl">
                                <button type="submit" className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                                    <SaveIcon /> <span className="ml-2">Guardar Cambios</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-moon-component rounded-xl border border-moon-border">
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="p-6 border-b border-moon-border">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <LockIcon /> <span className="ml-3">Cambiar Contraseña</span>
                                </h3>
                                <p className="text-moon-text-secondary text-sm mt-1">Para mayor seguridad, te recomendamos usar una contraseña segura.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Contraseña Actual</label>
                                    <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Nueva Contraseña</label>
                                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-moon-text-secondary">Confirmar Nueva Contraseña</label>
                                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="bg-moon-nav border border-moon-border text-moon-text text-sm rounded-lg focus:ring-moon-purple focus:border-moon-purple block w-full p-2.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end p-4 bg-moon-nav/50 rounded-b-xl">
                                <button type="submit" className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                                    <SaveIcon /> <span className="ml-2">Actualizar Contraseña</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
