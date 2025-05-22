import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { ModuleType, UserRole } from '../types/models';

interface AppStateContextType {
  isLoading: boolean;
  errorMessage: string | null;
  hasAccess: (moduleType: ModuleType) => boolean;
  hasEditPermission: (moduleType: ModuleType) => boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateContextType>({} as AppStateContextType);

export const useAppState = () => {
  return useContext(AppStateContext);
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Save user data to localStorage when user changes (like UserDefaults in iOS)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('userID', currentUser.id);
      localStorage.setItem('userName', currentUser.name);
      localStorage.setItem('userEmail', currentUser.email);
      localStorage.setItem('userGroupID', currentUser.groupId || '');
      localStorage.setItem('userPhone', currentUser.phone);
      localStorage.setItem('userRole', currentUser.role);
      console.log('AppState: user data saved to localStorage');
    } else {
      // Clear localStorage when user logs out
      ['userID', 'userName', 'userEmail', 'userGroupID', 'userPhone', 'userRole'].forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }, [currentUser]);

  // Check access to module for current user
  const hasAccess = (moduleType: ModuleType): boolean => {
    console.log(`AppState: checking access to module ${moduleType}`);
    
    if (!currentUser) {
      console.log(`AppState: access to module ${moduleType} denied - not authorized`);
      return false;
    }

    // For now, all logged users have access to all modules
    // TODO: Implement PermissionService when provided
    const hasAccess = true;
    console.log(`AppState: access to module ${moduleType} ${hasAccess ? 'allowed' : 'denied'}`);
    return hasAccess;
  };

  // Check if user has edit permissions in the module
  const hasEditPermission = (moduleType: ModuleType): boolean => {
    console.log(`AppState: checking edit permissions for module ${moduleType}`);
    
    if (!currentUser) {
      console.log(`AppState: edit access for module ${moduleType} denied - not authorized`);
      return false;
    }

    // Admins and managers have edit permissions
    const hasPermission = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
    console.log(`AppState: edit access for module ${moduleType} ${hasPermission ? 'allowed' : 'denied'}`);
    return hasPermission;
  };

  const setError = (error: string | null) => {
    setErrorMessage(error);
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  const value = {
    isLoading,
    errorMessage,
    hasAccess,
    hasEditPermission,
    setIsLoading,
    setError,
    clearError
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};
