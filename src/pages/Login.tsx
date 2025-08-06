import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Server, Database, Lock, Eye, EyeOff, Sparkles, Zap, BarChart3, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// import { useSystemSettings } from '@/hooks/useSystemSettings';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  // Temporarily remove useSystemSettings to fix the startup issue
  // const { data: brandingSettings } = useSystemSettings('branding');
  const brandingSettings = null;

  // const companyLogo = brandingSettings?.find(setting => setting.setting_key === 'company_logo_url')?.setting_value;
  // const companyName = brandingSettings?.find(setting => setting.setting_key === 'company_name')?.setting_value || 'Parker Soluções ERP';
  const companyLogo = null;
  const companyName = 'Parker Soluções ERP';

  // Floating particles animation
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="absolute w-1 h-1 bg-gold rounded-full opacity-30 animate-particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  ));

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/links', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg animate-pulse">Carregando sistema...</div>
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
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o sistema...",
        });
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, hsl(var(--gold)) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, hsl(var(--navy-light)) 0%, transparent 50%),
            linear-gradient(45deg, transparent 40%, hsl(var(--gold) / 0.05) 50%, transparent 60%)
          `
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles}
      </div>

      {/* Hexagonal pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="relative min-h-screen flex">
        {/* Left Panel - Company Presentation */}
        <div className="hidden lg:flex lg:w-3/5 flex-col justify-center p-12 relative">
          <div className="max-w-2xl mx-auto">
            {/* Company Logo/Name */}
            <div className="mb-12 text-center animate-fade-in-up">
              {companyLogo ? (
                <div className="flex justify-center mb-6">
                  <img 
                    src={companyLogo} 
                    alt={companyName} 
                    className="h-20 w-auto object-contain animate-float"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold to-gold-glow rounded-2xl flex items-center justify-center mb-4 animate-float shadow-2xl shadow-gold/30">
                    <Shield className="h-10 w-10 text-gold-foreground" />
                  </div>
                </div>
              )}
              
              <h1 className="text-5xl font-bold text-foreground mb-4">
                <span className="bg-gradient-to-r from-gold via-gold-glow to-gold bg-clip-text text-transparent">
                  {companyName}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground font-light">
                Sistema completo de gestão empresarial
              </p>
            </div>

            {/* Floating feature cards */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              {[
                { icon: Server, title: "GLPI", desc: "Helpdesk & ITSM", delay: "0ms" },
                { icon: BarChart3, title: "Zabbix", desc: "Monitoramento", delay: "100ms" },
                { icon: Database, title: "Backups", desc: "Proteção de Dados", delay: "200ms" },
                { icon: Lock, title: "Senhas", desc: "Cofre Seguro", delay: "300ms" }
              ].map((item, index) => (
                <Card 
                  key={index}
                  className="bg-card/30 backdrop-blur-xl border-gold/20 hover:border-gold/40 transition-all duration-500 hover:scale-105 animate-fade-in-up shadow-lg hover:shadow-gold/20"
                  style={{ animationDelay: item.delay }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gold/20 to-gold/10 rounded-xl flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Platform features */}
            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <h3 className="text-2xl font-semibold text-foreground mb-6">Recursos da Plataforma</h3>
              {[
                { icon: Sparkles, text: "Dashboard unificado com métricas em tempo real" },
                { icon: Zap, text: "Automação inteligente de processos" },
                { icon: Shield, text: "Segurança avançada e criptografia" },
                { icon: Users, text: "Colaboração integrada entre equipes" }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-gold/10 rounded-lg flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-gold" />
                  </div>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 lg:w-2/5 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gold to-gold-glow rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-gold/30">
                <Shield className="h-8 w-8 text-gold-foreground" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gold via-gold-glow to-gold bg-clip-text text-transparent mb-2">
                {companyName}
              </h1>
              <p className="text-muted-foreground">Acesse sua conta</p>
            </div>

            {/* Login form */}
            <Card className="bg-card/40 backdrop-blur-2xl border-gold/30 shadow-2xl shadow-black/20 animate-fade-in-up">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
                  <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/60 border-muted-foreground/30 text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/30 h-12 transition-all duration-300"
                      placeholder="Digite seu email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background/60 border-muted-foreground/30 text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/30 h-12 pr-12 transition-all duration-300"
                        placeholder="Digite sua senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gold hover:bg-transparent h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-gold to-gold-glow hover:from-gold-glow hover:to-gold text-gold-foreground font-semibold shadow-lg hover:shadow-gold/40 transition-all duration-300 transform hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
                        <span>Autenticando...</span>
                      </div>
                    ) : (
                      'Entrar no Sistema'
                    )}
                  </Button>
                </form>

                {/* Support info */}
                <div className="mt-8 p-4 bg-background/30 rounded-lg border border-gold/20">
                  <h4 className="text-foreground font-semibold mb-2 text-center text-sm">Suporte Técnico</h4>
                  <div className="text-sm text-muted-foreground text-center">
                    <p><strong className="text-gold">Master:</strong> contato@parkersolucoes.com.br</p>
                    <p className="text-xs opacity-75 mt-1">Para suporte, entre em contato com a administração</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;