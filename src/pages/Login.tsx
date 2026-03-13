import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Server, Database, Lock, Eye, EyeOff, Sparkles, Zap, BarChart3, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const companyName = 'Parker Soluções ERP';

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/atendimentos', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse glow-primary">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast({ title: "Login realizado com sucesso!", description: "Redirecionando..." });
      } else {
        toast({ title: "Erro no login", description: "Email ou senha incorretos.", variant: "destructive" });
        setIsLoading(false);
      }
    } catch {
      toast({ title: "Erro no login", description: "Ocorreu um erro inesperado.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-3/5 flex-col justify-center p-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-12 animate-fade-in-up">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-6 shadow-2xl glow-primary">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-5xl font-extrabold text-foreground mb-4 leading-tight">
                <span className="gradient-text">{companyName}</span>
              </h1>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">
                Plataforma integrada de gestão de TI com monitoramento, automação e segurança.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-12">
              {[
                { icon: Server, title: "GLPI", desc: "Helpdesk & ITSM", gradient: "from-primary/20 to-primary/5" },
                { icon: BarChart3, title: "Zabbix", desc: "Monitoramento", gradient: "from-info/20 to-info/5" },
                { icon: Database, title: "Backups", desc: "Proteção de Dados", gradient: "from-warning/20 to-warning/5" },
                { icon: Lock, title: "Senhas", desc: "Cofre Seguro", gradient: "from-accent/20 to-accent/5" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              {[
                { icon: Sparkles, text: "Dashboard unificado com métricas em tempo real" },
                { icon: Zap, text: "Automação inteligente de processos" },
                { icon: Shield, text: "Segurança avançada e criptografia" },
                { icon: Users, text: "Colaboração integrada entre equipes" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 lg:w-2/5 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow-2xl glow-primary">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold gradient-text mb-1">{companyName}</h1>
              <p className="text-sm text-muted-foreground">Acesse sua conta</p>
            </div>

            <Card className="bg-card/60 backdrop-blur-2xl border-border/50 shadow-2xl animate-fade-in-up">
              <CardContent className="p-8">
                {isForgotPassword ? (
                  <>
                    <div className="text-center mb-8">
                      {resetEmailSent ? (
                        <>
                          <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mail className="h-7 w-7 text-primary" />
                          </div>
                          <h2 className="text-xl font-bold text-foreground mb-2">Email enviado!</h2>
                          <p className="text-sm text-muted-foreground">Verifique sua caixa de entrada.</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-xl font-bold text-foreground mb-2">Recuperar senha</h2>
                          <p className="text-sm text-muted-foreground">Digite seu email para receber o link</p>
                        </>
                      )}
                    </div>
                    {!resetEmailSent && (
                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="text-foreground text-sm font-medium">Email</Label>
                          <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="bg-background/60 border-border text-foreground h-11 focus:border-primary focus:ring-primary/30"
                            placeholder="Digite seu email" required />
                        </div>
                        <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20" disabled={isLoading}>
                          {isLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /><span>Enviando...</span></div> : 'Enviar link de recuperação'}
                        </Button>
                      </form>
                    )}
                    <Button type="button" variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-foreground" onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }}>
                      <ArrowLeft className="h-4 w-4 mr-2" />Voltar ao login
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
                      <p className="text-sm text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground text-sm font-medium">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="bg-background/60 border-border text-foreground h-11 focus:border-primary focus:ring-primary/30"
                          placeholder="Digite seu email" required />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-foreground text-sm font-medium">Senha</Label>
                          <Button type="button" variant="link" className="text-xs text-primary hover:text-primary/80 p-0 h-auto" onClick={() => setIsForgotPassword(true)}>
                            Esqueci minha senha
                          </Button>
                        </div>
                        <div className="relative">
                          <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                            className="bg-background/60 border-border text-foreground h-11 pr-12 focus:border-primary focus:ring-primary/30"
                            placeholder="Digite sua senha" required />
                          <Button type="button" variant="ghost" size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300"
                        disabled={isLoading}>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            <span>Autenticando...</span>
                          </div>
                        ) : 'Entrar no Sistema'}
                      </Button>
                    </form>
                  </>
                )}

                <div className="mt-6 p-3 bg-background/30 rounded-lg border border-border/50">
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-medium">Suporte Técnico</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    <span className="text-primary font-medium">contato@parkersolucoes.com.br</span>
                  </p>
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
