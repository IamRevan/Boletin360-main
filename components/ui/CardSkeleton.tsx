import React from 'react';
import { Skeleton } from './Skeleton';

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-moon-component border border-moon-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={48} height={48} className="shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" height={24} />
                </div>
            </div>
        </div>
    );
};
