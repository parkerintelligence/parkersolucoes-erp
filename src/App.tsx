import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import { AuthenticatedApp } from '@/components/AuthenticatedApp';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { useAuth } from '@/contexts/AuthContext';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">Carregando sistema...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route 
        path="/*" 
        element={
          <AuthGuard>
            <AuthenticatedApp />
          </AuthGuard>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}