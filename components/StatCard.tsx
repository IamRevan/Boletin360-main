
import React from 'react';

interface StatCardProps {
  title: string; // Título de la tarjeta (e.g. Total Estudiantes)
  value: string; // Valor numérico principal
  icon: React.ReactNode; // Icono a mostrar
}

// Componente de Tarjeta de Estadística para el Dashboard
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-moon-component p-6 rounded-xl border border-moon-border flex items-center">
      <div className="p-3 bg-moon-purple/20 rounded-lg text-moon-purple-light">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm text-moon-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};
