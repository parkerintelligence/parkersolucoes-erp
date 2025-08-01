import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Server, Database, Lock, Eye, EyeOff, Sparkles, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import parkerLogo from '@/assets/parker-logo.jpg';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  field?: string;
  message: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginError[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const {
    login,
    isAuthenticated,
    isLoading: authLoading
  } = useAuth();
  
  const {
    data: settings,
    isLoading: settingsLoading
  } = useSystemSettings('branding');
  
  const navigate = useNavigate();

  // Configurações da empresa
  const companyLogo = settings?.find(s => s.setting_key === 'company_logo_url')?.setting_value || parkerLogo;
  const companyName = settings?.find(s => s.setting_key === 'company_name')?.setting_value || 'Parker Soluções ERP';

  // Validação de email
  const isValidEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validação do formulário
  const validateForm = useCallback((): LoginError[] => {
    const newErrors: LoginError[] = [];

    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email é obrigatório' });
    } else if (!isValidEmail(formData.email)) {
      newErrors.push({ field: 'email', message: 'Email deve ter um formato válido' });
    }

    if (!formData.password) {
      newErrors.push({ field: 'password', message: 'Senha é obrigatória' });
    } else if (formData.password.length < 6) {
      newErrors.push({ field: 'password', message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    return newErrors;
  }, [formData, isValidEmail]);

  // Limpar erros quando o usuário digita
  const handleInputChange = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erros específicos do campo
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  // Alternar visibilidade da senha
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Redirecionar usuários autenticados
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('Usuário já autenticado, redirecionando para alertas');
      navigate('/alertas', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Gerenciar tentativas de login bloqueadas
  useEffect(() => {
    if (attemptCount >= 3) {
      const timer = setTimeout(() => {
        setAttemptCount(0);
        setErrors([]);
      }, 30000); // 30 segundos de bloqueio

      return () => clearTimeout(timer);
    }
  }, [attemptCount]);

  // Handler do login
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se está bloqueado
    if (attemptCount >= 3) {
      toast({
        title: "Muitas tentativas",
        description: "Aguarde 30 segundos antes de tentar novamente.",
        variant: "destructive"
      });
      return;
    }

    // Validar formulário
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      console.log('Tentativa de login:', formData.email);
      
      const success = await login(formData.email.trim(), formData.password);
      
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o painel principal..."
        });
        
        // Reset do formulário
        setFormData({ email: '', password: '' });
        setAttemptCount(0);
      } else {
        setAttemptCount(prev => prev + 1);
        const remainingAttempts = 3 - (attemptCount + 1);
        
        setErrors([{
          message: remainingAttempts > 0 
            ? `Credenciais inválidas. ${remainingAttempts} tentativas restantes.`
            : 'Credenciais inválidas. Conta temporariamente bloqueada.'
        }]);

        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      
      setErrors([{
        message: 'Erro de conexão. Verifique sua internet e tente novamente.'
      }]);

      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, login, attemptCount]);

  // Loading inicial
  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="w-20 h-20 mx-auto rounded-xl shadow-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = parkerLogo;
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-white text-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando sistema...
          </div>
        </div>
      </div>
    );
  }

  // Se já autenticado, não renderizar
  if (isAuthenticated) {
    return null;
  }

  const isBlocked = attemptCount >= 3;
  const hasFieldError = (field: string) => errors.some(error => error.field === field);
  const getFieldError = (field: string) => errors.find(error => error.field === field)?.message;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="w-24 h-24 rounded-xl shadow-2xl object-cover"
              onError={(e) => {
                e.currentTarget.src = parkerLogo;
              }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              {companyName}
            </h1>
            <p className="text-slate-300 text-lg lg:text-xl max-w-2xl mx-auto">
              Sistema completo de gestão empresarial e infraestrutura de TI
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
              <span className="text-sm text-slate-400">Plataforma integrada de gestão</span>
              <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Card de Login */}
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-600/50 shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-white text-2xl font-bold">
                Acesso ao Sistema
              </CardTitle>
              <CardDescription className="text-slate-300 text-base">
                Digite suas credenciais para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Alertas de erro */}
              {errors.filter(error => !error.field).map((error, index) => (
                <Alert key={index} variant="destructive" className="bg-red-900/20 border-red-500/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    {error.message}
                  </AlertDescription>
                </Alert>
              ))}

              {isBlocked && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    Conta temporariamente bloqueada. Aguarde 30 segundos.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Campo Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 h-12 rounded-lg backdrop-blur-sm transition-colors ${
                      hasFieldError('email') ? 'border-red-500 focus:border-red-500' : 'focus:border-secondary'
                    }`}
                    placeholder="Digite seu email"
                    disabled={isLoading || isBlocked}
                    required
                  />
                  {hasFieldError('email') && (
                    <p className="text-red-400 text-sm">{getFieldError('email')}</p>
                  )}
                </div>

                {/* Campo Senha */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 h-12 rounded-lg backdrop-blur-sm pr-12 transition-colors ${
                        hasFieldError('password') ? 'border-red-500 focus:border-red-500' : 'focus:border-secondary'
                      }`}
                      placeholder="Digite sua senha"
                      disabled={isLoading || isBlocked}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white hover:bg-transparent h-auto p-1"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading || isBlocked}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {hasFieldError('password') && (
                    <p className="text-red-400 text-sm">{getFieldError('password')}</p>
                  )}
                </div>

                {/* Botão de Login */}
                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  disabled={isLoading || isBlocked}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
            </CardContent>
          </Card>

          {/* Seção de Recursos */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-600/50 hover:bg-slate-800/50 transition-colors duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Server className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">GLPI</h3>
                  <p className="text-slate-300 text-sm">Sistema de Chamados</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-600/50 hover:bg-slate-800/50 transition-colors duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Database className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Zabbix</h3>
                  <p className="text-slate-300 text-sm">Monitoramento</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-600/50 hover:bg-slate-800/50 transition-colors duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Backups</h3>
                  <p className="text-slate-300 text-sm">Verificação FTP</p>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-600/50 hover:bg-slate-800/50 transition-colors duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">Senhas</h3>
                  <p className="text-slate-300 text-sm">Cofre Seguro</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;