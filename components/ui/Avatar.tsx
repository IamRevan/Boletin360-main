import React from 'react';

interface AvatarProps {
    name: string; // Full name or First name
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, className = "w-9 h-9 text-xs" }) => {
    // Extract initials
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';

    // Different colors based on name length to give some variety without random images
    const colors = [
        'bg-moon-purple', 'bg-moon-blue', 'bg-moon-green', 'bg-moon-orange', 'bg-pink-500', 'bg-indigo-500'
    ];
    const colorIndex = name ? name.length % colors.length : 0;
    const bgClass = colors[colorIndex];

    return (
        <div className={`${className} ${bgClass} rounded-full flex items-center justify-center text-white font-bold tracking-wider shadow-sm`}>
            {initials}
        </div>
    );
};
