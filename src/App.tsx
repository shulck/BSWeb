import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppStateProvider } from './hooks/useAppState';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import './App.css';

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Загрузка BandSync...</div>;
  }

  return currentUser ? <Dashboard /> : <Auth />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </AuthProvider>
  );
};

export default App;
