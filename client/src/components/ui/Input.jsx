import React from 'react';
import { cn } from '../../lib/utils.js';

export function Input({
  className = '',
  type = 'text',
  error = false,
  disabled = false,
  ...props
}) {
  return (
    <input
      type={type}
      disabled={disabled}
      className={cn(
        'w-full h-10 px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors duration-150',
        'placeholder:text-slate-400 text-slate-800 outline-none',
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
        'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
        error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
          : 'border-slate-300 hover:border-slate-400',
        className
      )}
      {...props}
    />
  );
}

export default Input;
