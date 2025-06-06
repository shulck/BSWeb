import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl shadow-sm placeholder-gray-500 
      focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
      transition-all duration-200 bg-surface-dark text-white text-sm sm:text-base
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600'}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && (
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
