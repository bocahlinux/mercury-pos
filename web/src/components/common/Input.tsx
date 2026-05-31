import React from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '@/utils/cn';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: FieldError;
};

const Input: React.FC<Props> = ({ label, error, className, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block font-medium">{label}</label>}
    <input
      className={cn(
        'w-full border rounded p-2 focus:outline-none focus:ring-2',
        error ? 'border-red-600 focus:ring-red-600' : 'border-gray-300 focus:ring-primary',
        className
      )}
      {...props}
    />
    {error && <p className="text-red-600 text-sm">{error.message}</p>}
  </div>
);

export default Input;
