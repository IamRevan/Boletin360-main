import React from 'react';
import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="w-full">
            {/* Header Mock */}
            <div className="flex space-x-4 p-4 border-b border-moon-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`head-${i}`} variant="text" className="w-1/4 h-6" />
                ))}
            </div>
            {/* Rows */}
            <div className="space-y-4 p-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <Skeleton key={`cell-${i}-${j}`} variant="text" className="w-1/4 h-4" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
