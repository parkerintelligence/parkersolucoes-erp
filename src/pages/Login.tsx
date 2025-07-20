
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Server, Database, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuários autenticados para o dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('Usuário já autenticado, redirecionando para dashboard');
      navigate('/links', { replace: true }); // Redirecionar para links ao invés de dashboard
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Tela de carregamento durante inicialização
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">Carregando sistema...</div>
      </div>
    );
  }

  // Se já estiver autenticado, não renderizar nada (está redirecionando)
  if (isAuthenticated) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        // O redirecionamento será feito pelo useEffect
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Parker Soluções ERP</h1>
          <p className="text-blue-200 text-lg">Sistema completo de gestão empresarial e infraestrutura de TI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <Card className="bg-white/10 backdrop-blur-md border-blue-300/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-xl">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-blue-200">
                Digite suas credenciais para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200"
                    placeholder="Digite seu email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200 pr-10"
                      placeholder="Digite sua senha"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-900/40 rounded-lg border border-blue-300/20">
                <h4 className="text-white font-semibold mb-2 text-center">Informações de Acesso</h4>
                <div className="text-sm text-blue-200 text-center">
                  <p><strong className="text-blue-100">Master:</strong> contato@parkersolucoes.com.br</p>
                  <p className="text-xs opacity-75 mt-1">Para suporte técnico, entre em contato com a administração</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Server className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-semibold">GLPI</h3>
                  <p className="text-blue-200 text-sm">Sistema de Chamados</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-semibold">Zabbix</h3>
                  <p className="text-blue-200 text-sm">Monitoramento</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-semibold">Backups</h3>
                  <p className="text-blue-200 text-sm">Verificação FTP</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Lock className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-semibold">Senhas</h3>
                  <p className="text-blue-200 text-sm">Cofre Seguro</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-3">Recursos da Plataforma</h3>
                <ul className="text-blue-200 space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Dashboard unificado com status de todos os sistemas
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Integração completa com GLPI e Zabbix
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Monitoramento automático de backups FTP
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Gerenciador seguro de senhas e acessos
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
