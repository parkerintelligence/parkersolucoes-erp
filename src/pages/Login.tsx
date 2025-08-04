import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Login = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - redirect to links page
    window.location.href = '/links';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-md p-8">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">
                  Parker Soluções ERP
                </h1>
                <p className="text-slate-300">
                  Sistema de Gestão Empresarial
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">
                    Senha
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Entrar
                </Button>
              </form>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                <div className="text-center space-y-1">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-blue-400">🛡️</span>
                  </div>
                  <p className="text-xs text-slate-300">Seguro</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-green-400">⚡</span>
                  </div>
                  <p className="text-xs text-slate-300">Rápido</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;