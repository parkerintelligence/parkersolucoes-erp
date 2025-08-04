import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/links', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Carregando sistema...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log("Login realizado com sucesso!");
      } else {
        console.error("Email ou senha incorretos");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Parker Soluções ERP
            </h1>
            <p className="text-slate-400">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite seu email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-700 rounded-lg">
            <h4 className="text-white font-semibold mb-2 text-center text-sm">Suporte Técnico</h4>
            <div className="text-sm text-slate-300 text-center">
              <p><strong className="text-blue-400">Master:</strong> contato@parkersolucoes.com.br</p>
              <p className="text-xs opacity-75 mt-1">Para suporte, entre em contato com a administração</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;