'use client';

import React, { useState, useEffect } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleCancel = () => {
        setIsClosing(true);
        setTimeout(onCancel, 150);
    };

    const handleConfirm = () => {
        setIsClosing(true);
        setTimeout(onConfirm, 150);
    };

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-500/20',
            confirmBtn: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-yellow-500/20',
            confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-blue-500/20',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-150 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-moon-component rounded-xl border border-moon-border w-full max-w-md shadow-2xl transition-transform duration-150 ${isClosing ? 'scale-95' : 'scale-100'}`}>
                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 text-2xl`}>
                        {styles.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>

                    {/* Message */}
                    <p className="text-moon-text-secondary text-center mb-6">{message}</p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2.5 bg-moon-border hover:bg-moon-nav text-white rounded-lg transition-colors font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 px-4 py-2.5 ${styles.confirmBtn} text-white rounded-lg transition-colors font-medium`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hook for easier usage
export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        onConfirm: () => { },
    });

    const showConfirm = (options: {
        title: string;
        message: string;
        variant?: 'danger' | 'warning' | 'info';
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title: options.title,
                message: options.message,
                variant: options.variant || 'danger',
                onConfirm: () => {
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const closeDialog = () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
    };

    const DialogComponent = () => (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            title={dialogState.title}
            message={dialogState.message}
            variant={dialogState.variant}
            onConfirm={dialogState.onConfirm}
            onCancel={closeDialog}
            confirmText="Eliminar"
        />
    );

    return { showConfirm, DialogComponent, closeDialog };
};
