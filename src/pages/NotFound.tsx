import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 text-white shadow-2xl text-center">
        <CardHeader className="pb-8">
          <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <CardTitle className="text-3xl font-bold text-white">404</CardTitle>
          <CardDescription className="text-blue-100 text-lg">
            Página não encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-white/80">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-white/20 hover:bg-white/30 text-white border-white/20">
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Ir para Dashboard
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="text-center text-sm text-white/60 mt-6">
            Sistema Parker - Gestão Integrada
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
