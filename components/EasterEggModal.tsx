import React, { useEffect } from 'react';
import { XIcon } from './Icons';
import { useDataDispatch } from '../state/DataContext';
import { ActionType } from '../state/actions';

interface EasterEggModalProps {
    onClose: () => void;
}

export const EasterEggModal: React.FC<EasterEggModalProps> = ({ onClose }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fade-in_0.5s_ease-out]">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: "url('/expedition33_bg.png')" }}
            ></div>

            <div className="relative z-10 w-full max-w-4xl p-4 flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors bg-black/50 rounded-full p-2"
                >
                    <XIcon />
                </button>

                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-moon-purple/50 bg-black">
                    <video
                        className="w-full h-full object-cover"
                        src="/samuel%20ardilla.m4v"
                        autoPlay
                        loop
                        controls
                        playsInline
                    >
                        Tu navegador no soporta el elemento de video.
                    </video>
                </div>
            </div>
        </div>
    );
};
