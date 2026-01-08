'use client';


import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { SearchIcon, BellIcon, UserIcon, CogIcon, LogOutIcon, ChevronDownIcon } from './Icons';
import { type User, UserRole } from '../types';

interface HeaderProps {
  onLogout: () => void;
  currentUser: User;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, currentUser, onNavigate }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-moon-nav border-b border-moon-border p-4 flex items-center justify-between">
      <div className="relative w-full max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Buscar estudiantes, docentes..."
          className="w-full bg-moon-component border border-moon-border rounded-lg py-2 pl-10 pr-4 text-moon-text focus:outline-none focus:ring-2 focus:ring-moon-purple-light focus:border-transparent"
        />
      </div>
      <div className="flex items-center space-x-5">
        <button className="relative text-moon-text-secondary hover:text-moon-text">
          <BellIcon />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moon-purple opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-moon-purple"></span>
          </span>
        </button>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 p-1 rounded-lg hover:bg-moon-component transition-colors">
            <Image
              src={`https://i.pravatar.cc/150?u=${currentUser.email}`}
              alt="User Avatar"
              className="rounded-full object-cover"
              width={36}
              height={36}
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-moon-text">{currentUser.nombres} {currentUser.apellidos}</p>
              <p className="text-xs text-moon-text-secondary">{currentUser.email}</p>
            </div>
            <ChevronDownIcon />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 z-50 mt-2 w-48 bg-moon-component rounded-lg shadow-lg border border-moon-border animate-[fade-in_0.1s_ease-out]"
            >
              <div className="p-2">
                <button onClick={() => { onNavigate('profile'); setDropdownOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
                  <UserIcon />
                  <span className="ml-3">Mi Perfil</span>
                </button>
                {currentUser.role === UserRole.Admin && (
                  <button onClick={() => { onNavigate('settings'); setDropdownOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-moon-text rounded-lg hover:bg-moon-nav">
                    <CogIcon />
                    <span className="ml-3">Configuración</span>
                  </button>
                )}
                <hr className="my-2 border-moon-border" />
                <button onClick={onLogout} className="w-full flex items-center px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/20">
                  <LogOutIcon />
                  <span className="ml-3">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
