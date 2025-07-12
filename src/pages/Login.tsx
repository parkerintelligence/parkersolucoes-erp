
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Server, Database, Lock, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import parkerLogo from '@/assets/parker-logo.jpg';

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
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <img src={parkerLogo} alt="Parker Logo" className="w-20 h-20 mx-auto rounded-xl shadow-lg" />
          </div>
          <div className="text-primary-foreground text-lg">Carregando sistema...</div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-card/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl">
                <img 
                  src={parkerLogo} 
                  alt="Parker Soluções Logo" 
                  className="w-16 h-16 mx-auto rounded-xl shadow-lg object-cover"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-3">
              Parker Soluções ERP
            </h1>
            <p className="text-primary-foreground/80 text-lg lg:text-xl max-w-2xl mx-auto">
              Sistema completo de gestão empresarial e infraestrutura de TI
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
              <span className="text-sm text-primary-foreground/60">Plataforma integrada de gestão</span>
              <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Card de Login */}
          <Card className="glass border-white/20 shadow-2xl backdrop-blur-md bg-card/10">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-primary-foreground text-2xl font-bold">
                Acesso ao Sistema
              </CardTitle>
              <CardDescription className="text-primary-foreground/70 text-base">
                Digite suas credenciais para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-primary-foreground text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-card/20 border-white/30 text-primary-foreground placeholder:text-primary-foreground/50 h-12 rounded-lg backdrop-blur-sm"
                    placeholder="Digite seu email"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-primary-foreground text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-card/20 border-white/30 text-primary-foreground placeholder:text-primary-foreground/50 h-12 rounded-lg backdrop-blur-sm pr-12"
                      placeholder="Digite sua senha"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-transparent h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin"></div>
                      Autenticando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Entrar no Sistema
                    </div>
                  )}
                </Button>
              </form>

              <div className="p-4 bg-primary/20 backdrop-blur-sm rounded-lg border border-white/20">
                <h4 className="text-primary-foreground font-semibold mb-2 text-center">
                  Informações de Acesso
                </h4>
                <div className="text-sm text-primary-foreground/80 text-center">
                  <p><strong className="text-secondary">Master:</strong> contato@parkersolucoes.com.br</p>
                  <p className="text-xs opacity-75 mt-1">Para suporte técnico, entre em contato com a administração</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Recursos */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass border-white/20 card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Server className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-primary-foreground font-semibold text-lg">GLPI</h3>
                  <p className="text-primary-foreground/70 text-sm">Sistema de Chamados</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/20 card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Database className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-primary-foreground font-semibold text-lg">Zabbix</h3>
                  <p className="text-primary-foreground/70 text-sm">Monitoramento</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/20 card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-primary-foreground font-semibold text-lg">Backups</h3>
                  <p className="text-primary-foreground/70 text-sm">Verificação FTP</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/20 card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-primary-foreground font-semibold text-lg">Senhas</h3>
                  <p className="text-primary-foreground/70 text-sm">Cofre Seguro</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-white/20">
              <CardContent className="p-6">
                <h3 className="text-primary-foreground font-bold text-xl mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  Recursos da Plataforma
                </h3>
                <ul className="text-primary-foreground/80 space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse"></div>
                    Dashboard unificado com status de todos os sistemas
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse"></div>
                    Integração completa com GLPI e Zabbix
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse"></div>
                    Monitoramento automático de backups FTP
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse"></div>
                    Gerenciador seguro de senhas e acessos
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-secondary rounded-full mr-3 animate-pulse"></div>
                    Planos de ação e gestão de tarefas
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
