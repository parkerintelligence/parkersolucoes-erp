import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { ALL_SCREENS, useUserPermissions, useSaveUserPermissions } from '@/hooks/useUserPermissions';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

export const UserPermissionsDialog = ({ open, onOpenChange, userId, userEmail }: UserPermissionsDialogProps) => {
  const { data: permissions, isLoading } = useUserPermissions(userId);
  const saveMutation = useSaveUserPermissions();
  const [selected, setSelected] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (open && !isLoading) {
      const allowed = permissions?.allowed_screens as string[] | undefined;
      if (allowed && allowed.length > 0) {
        setSelected(allowed);
      } else {
        // Default: all screens allowed
        setSelected(ALL_SCREENS.map(s => s.key));
      }
      setInitialized(true);
    }
  }, [open, isLoading, permissions]);

  const toggleScreen = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectAll = () => setSelected(ALL_SCREENS.map(s => s.key));
  const selectNone = () => setSelected([]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ userId, allowedScreens: selected });
      toast({ title: 'Permissões salvas!', description: `Permissões de ${userEmail} atualizadas.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar permissões', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Permissões - {userEmail}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !initialized ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
                Marcar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone} className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700">
                Desmarcar Todos
              </Button>
            </div>
            {ALL_SCREENS.map(screen => (
              <div key={screen.key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 transition-colors">
                <Label className="text-sm text-slate-200 cursor-pointer" htmlFor={`perm-${screen.key}`}>
                  {screen.label}
                </Label>
                <Switch
                  id={`perm-${screen.key}`}
                  checked={selected.includes(screen.key)}
                  onCheckedChange={() => toggleScreen(screen.key)}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="pt-4 border-t border-slate-700">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
