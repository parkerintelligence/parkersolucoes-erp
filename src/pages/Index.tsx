
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Server, Database, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
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
            <div className="bg-blue-600 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sistema de Gestão de TI</h1>
          <p className="text-blue-200 text-lg">Plataforma completa para gerenciamento de infraestrutura</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
            <CardHeader>
              <CardTitle className="text-white">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-blue-200">
                Entre com suas credenciais para acessar o painel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200"
                    placeholder="Digite seu usuário"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
                <h4 className="text-white font-medium mb-2">Credenciais de Teste:</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p><strong>Usuário:</strong> admin / admin123</p>
                  <p><strong>Master:</strong> master / master123</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Server className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-medium">GLPI</h3>
                  <p className="text-blue-200 text-sm">Chamados</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Zabbix</h3>
                  <p className="text-blue-200 text-sm">Monitoramento</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Backups</h3>
                  <p className="text-blue-200 text-sm">Verificação FTP</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
                <CardContent className="p-4 text-center">
                  <Lock className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <h3 className="text-white font-medium">Senhas</h3>
                  <p className="text-blue-200 text-sm">Cofre Seguro</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-blue-300/20">
              <CardContent className="p-6">
                <h3 className="text-white font-medium mb-3">Funcionalidades Principais</h3>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li>• Dashboard unificado com status de todos os sistemas</li>
                  <li>• Integração completa com GLPI e Zabbix</li>
                  <li>• Monitoramento automático de backups FTP</li>
                  <li>• Gerenciador seguro de senhas e acessos</li>
                  <li>• Sistema de notificações inteligente</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
