import React from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/80',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
};

const Button: React.FC<Props> = ({ variant = 'primary', className, ...props }) => (
  <button
    className={cn(
      'px-4 py-2 rounded transition-colors',
      variantClasses[variant],
      className
    )}
    {...props}
  />
);

export default Button;
