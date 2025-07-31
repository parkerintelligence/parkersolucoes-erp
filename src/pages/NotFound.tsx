import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <AlertTriangle className="h-24 w-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-slate-300 mb-4">Página não encontrada</h2>
          <p className="text-slate-400 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
            <Link to="/alertas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Alertas
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">
              Dashboard Geral
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;