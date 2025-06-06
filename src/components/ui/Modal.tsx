import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom bg-surface-dark rounded-xl sm:rounded-2xl text-left overflow-hidden shadow-medium-dark transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full w-full mx-4 sm:mx-0 relative z-50 border border-dark`}>
          <div className="bg-surface-dark px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-700 rounded-xl"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-gray-300">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
