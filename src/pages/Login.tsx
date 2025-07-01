
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
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
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
        navigate('/dashboard', { replace: true });
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
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Sistema de Gestão de TI</h1>
          <p className="text-blue-200 text-xl">Plataforma completa para gerenciamento de infraestrutura tecnológica</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Card className="bg-white/10 backdrop-blur-md border-blue-300/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Digite suas credenciais para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200 h-12 text-lg"
                    placeholder="Digite seu email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200 h-12 text-lg pr-12"
                      placeholder="Digite sua senha"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-medium shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                </Button>
              </form>

              <div className="mt-8 p-6 bg-blue-900/40 rounded-lg border border-blue-300/20">
                <h4 className="text-white font-semibold mb-3 text-center">Informações de Acesso</h4>
                <div className="text-sm text-blue-200 space-y-2">
                  <p className="text-center">
                    <strong className="text-blue-100">Master:</strong> contato@parkersolucoes.com.br
                  </p>
                  <p className="text-center text-xs opacity-75">
                    Para suporte técnico, entre em contato com a administração
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Server className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-lg">GLPI</h3>
                  <p className="text-blue-200 text-sm">Sistema de Chamados</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Database className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-lg">Zabbix</h3>
                  <p className="text-blue-200 text-sm">Monitoramento</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Shield className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-lg">Backups</h3>
                  <p className="text-blue-200 text-sm">Verificação FTP</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20 hover:bg-white/15 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Lock className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                  <h3 className="text-white font-semibold text-lg">Senhas</h3>
                  <p className="text-blue-200 text-sm">Cofre Seguro</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
              <CardContent className="p-8">
                <h3 className="text-white font-semibold mb-4 text-xl">Recursos da Plataforma</h3>
                <ul className="text-blue-200 space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Dashboard unificado com status de todos os sistemas
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Integração completa com GLPI e Zabbix
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Monitoramento automático de backups FTP
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Gerenciador seguro de senhas e acessos
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    Sistema de notificações inteligente
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
