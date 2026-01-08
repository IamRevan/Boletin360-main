import React from 'react';
import { ShieldIcon } from './Icons';

export const AccessDeniedPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="mt-8 bg-moon-component border border-moon-border rounded-xl p-16 text-center">
      <div className="w-16 h-16 bg-moon-nav rounded-full flex items-center justify-center mx-auto text-moon-orange">
        <ShieldIcon />
      </div>
      <h3 className="text-2xl font-bold text-white mt-6">Acceso Denegado</h3>
      <p className="text-moon-text-secondary mt-2 max-w-sm">
        No tiene los permisos necesarios para acceder a esta sección. Por favor, contacte a un administrador si cree que esto es un error.
      </p>
    </div>
  </div>
);
