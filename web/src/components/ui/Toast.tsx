import React from 'react';
import { useToastStore } from '@/stores/toastStore';

const bgColor = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

const icon = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${bgColor[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in cursor-pointer`}
          onClick={() => removeToast(t.id)}
        >
          <span className="font-bold text-lg">{icon[t.type]}</span>
          <span className="text-sm flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-full" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-4 border-b">
      <Skeleton className="h-6 w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b flex gap-4">
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
      </div>
    ))}
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  </div>
);
