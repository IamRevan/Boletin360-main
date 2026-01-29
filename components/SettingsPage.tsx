'use client';

import React, { useState } from 'react';
import { type User, ModalType } from '../types';
import { api } from '../lib/api';
import { UserTable } from './UserTable';
import { PlusIcon } from './Icons';
import { useAppState, useAppDispatch } from '../state/AppContext';
import { ActionType } from '../state/actions';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from '../state/ToastContext';

import { EasterEggModal } from './EasterEggModal';

export const SettingsPage: React.FC = () => {
  const { users } = useAppState();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  // Estado para diálogo de confirmación de usuario
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userEmail: string;
  }>({ isOpen: false, userId: null, userEmail: '' });

  // Easter Egg States
  const [confirmationStep, setConfirmationStep] = useState(0); // 0: closed, 1-3: warning steps
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const onAdd = () => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.AddUser } });
  const onEdit = (user: User) => dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.EditUser, data: user } });

  // Mostrar diálogo de confirmación
  const onDelete = (userId: number) => {
    const user = users.find(u => u.id === userId);
    const userEmail = user ? user.email : 'este usuario';
    setConfirmDialog({ isOpen: true, userId, userEmail });
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (confirmDialog.userId === null) return;
    try {
      await api.deleteUser(confirmDialog.userId);
      dispatch({ type: ActionType.DELETE_USER, payload: confirmDialog.userId });
      addToast('Usuario eliminado correctamente', 'success');
    } catch (error) {
      console.error("Failed to delete user", error);
      addToast('Error al eliminar usuario', 'error');
    }
    setConfirmDialog({ isOpen: false, userId: null, userEmail: '' });
  };

  const onSave = (user: User) => {
    dispatch({ type: ActionType.SAVE_USER, payload: user });
  };
  const onResetPassword = (user: User) => {
    dispatch({ type: ActionType.OPEN_MODAL, payload: { modal: ModalType.ResetPassword, data: user } });
  };

  // Easter Egg Handlers
  const handleNextStep = () => {
    if (confirmationStep < 5) {
      setConfirmationStep(prev => prev + 1);
    } else {
      setConfirmationStep(0);
      setShowEasterEgg(true);
    }
  };

  const handleCancelSteps = () => {
    setConfirmationStep(0);
  };

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* ... (previous dialogs) */}

      {/* STEP 1: Advertencia Inicial */}
      <ConfirmDialog
        isOpen={confirmationStep === 1}
        title="⚠️ PRECAUCIÓN EXTREMA ⚠️"
        message="¿Estás completamente seguro? Una vez hecho no hay vuelta atrás. Esto podría alterar el tejido mismo de la realidad académica."
        confirmText="SÍ, ARRIESGARSE"
        cancelText="Huir cobardemente"
        variant="danger"
        onConfirm={handleNextStep}
        onCancel={handleCancelSteps}
      />

      {/* STEP 2: Claptrap Style Warning */}
      <ConfirmDialog
        isOpen={confirmationStep === 2}
        title="☢️ PROTOCOLO DE INESTABILIDAD ☢️"
        message="ADVERTENCIA: Este comando es fundamentalmente inestable. Podría causar un error de desbordamiento en el promedio de matemáticas o, peor aún, que el sistema empiece a cantar ópera en binario. ¿Realmente quieres continuar?"
        confirmText="SÍ, SOY UN CAOS"
        cancelText="Mi cordura es prioridad"
        variant="danger"
        onConfirm={handleNextStep}
        onCancel={handleCancelSteps}
      />

      {/* STEP 3: The Squirrel Contract */}
      <ConfirmDialog
        isOpen={confirmationStep === 3}
        title="📜 CONTRATO DE LA ARDILLA 📜"
        message="Al continuar, aceptas que: 1) La ardilla es el nuevo administrador supremo. 2) No nos hacemos responsables si tu teclado empieza a oler a nueces. 3) El concepto de 'nota aprobatoria' se vuelve puramente subjetivo."
        confirmText="ACEPTO LOS TÉRMINOS"
        cancelText="No leo contratos"
        variant="warning"
        onConfirm={handleNextStep}
        onCancel={handleCancelSteps}
      />

      {/* STEP 4: Linguistic Anomaly */}
      <ConfirmDialog
        isOpen={confirmationStep === 4}
        title="🌀 ANOMALÍA LINGÜÍSTICA 🌀"
        message="¡DETENTE! Hemos detectado que tu determinación es peligrosamente alta. El sistema está empezando a sudar píxeles. ¿Seguro que no prefieres simplemente ir a revisar una asistencia o algo... normal?"
        confirmText="LO NORMAL ES ABURRIDO"
        cancelText="Tienes razón, me asusté"
        variant="info"
        onConfirm={handleNextStep}
        onCancel={handleCancelSteps}
      />

      {/* STEP 5: Final Absurdity */}
      <ConfirmDialog
        isOpen={confirmationStep === 5}
        title="💀 PUNTO DE NO RETORNO 💀"
        message="ÚLTIMA OPORTUNIDAD: Si presionas este botón, el destino del Boletín360 quedará sellado. Las notas se volverán relativas, los profesores bailarán y la ardilla... bueno, no digas que no te advertimos. ¿ESTÁS COMPLETAMENTE, TOTALMENTE Y ABSURDAMENTE SEGURO?"
        confirmText="¡DAME LA ARDILLA!"
        cancelText="¡NO, ESPERA!"
        variant="danger"
        onConfirm={handleNextStep}
        onCancel={handleCancelSteps}
      />

      {showEasterEgg && <EasterEggModal onClose={() => setShowEasterEgg(false)} />}

      <div className="flex justify-between items-center bg-moon-component/50 p-6 rounded-xl border border-moon-border" suppressHydrationWarning>
        <div>
          <h2 className="text-3xl font-bold text-white">Configuración del Sistema</h2>
          <p className="text-moon-text-secondary mt-1">Administra los usuarios y los roles del sistema.</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setConfirmationStep(1)}
            className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/50 font-bold py-2 px-4 rounded-lg flex items-center transition-all animate-pulse"
          >
            ⛔ NO PRESIONAR
          </button>
          <button onClick={onAdd} className="bg-moon-purple hover:bg-moon-purple-light text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
            <PlusIcon /> <span className="ml-2 hidden sm:inline">Añadir Usuario</span>
          </button>
        </div>
      </div>

      <UserTable users={users} onEdit={onEdit} onDelete={onDelete} onSave={onSave} onResetPassword={onResetPassword} />
    </div>
  );
};