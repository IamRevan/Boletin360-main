'use client';

import { useEffect } from 'react';

export function useKeyboardShortcut(
    key: string,
    callback: () => void,
    options?: { ctrl?: boolean; shift?: boolean; alt?: boolean; enabled?: boolean }
) {
    const { ctrl = false, shift = false, alt = false, enabled = true } = options || {};

    useEffect(() => {
        if (!enabled) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === key &&
                e.ctrlKey === ctrl &&
                e.shiftKey === shift &&
                e.altKey === alt &&
                !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [key, callback, ctrl, shift, alt, enabled]);
}
