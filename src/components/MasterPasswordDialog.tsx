import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MasterPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const MasterPasswordDialog: React.FC<MasterPasswordDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  title = "Autorização Master Necessária",
  description = "Para continuar com esta ação, insira sua senha de usuário master:"
}) => {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleValidate = async () => {
    if (!password.trim()) {
      setError('Digite sua senha');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Tentar fazer login com a senha fornecida para validar
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user) {
        setError('Usuário não autenticado');
        return;
      }

      // Verificar se o usuário atual pode reauthenticar com a senha
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.user.email!,
        password: password
      });

      if (authError) {
        setError('Senha incorreta');
        return;
      }

      // Sucesso - senha validada
      setPassword('');
      setError('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro na validação da senha:', error);
      setError('Erro ao validar senha');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-orange-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="master-password" className="text-white">
              Senha Master
            </Label>
            <div className="relative">
              <Input
                id="master-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua senha"
                className="bg-slate-700 border-slate-600 text-white pr-10"
                disabled={isValidating}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isValidating}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isValidating}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleValidate}
            disabled={isValidating || !password.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isValidating ? 'Validando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};