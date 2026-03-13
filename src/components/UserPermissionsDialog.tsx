import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { ALL_SCREENS, ACTIONS, useUserPermissions, useSaveUserPermissions, buildFullPermissions, type ScreenPermissions, type ActionKey } from '@/hooks/useUserPermissions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

export const UserPermissionsDialog = ({ open, onOpenChange, userId, userEmail }: UserPermissionsDialogProps) => {
  const { data: permissions, isLoading } = useUserPermissions(userId);
  const saveMutation = useSaveUserPermissions();
  const [perms, setPerms] = useState<ScreenPermissions>({});
  const [initialized, setInitialized] = useState(false);
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && !isLoading) {
      const raw = permissions?.allowed_screens;
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        setPerms(raw as ScreenPermissions);
      } else if (Array.isArray(raw) && (raw as string[]).length > 0) {
        // Legacy migration
        const migrated: ScreenPermissions = {};
        (raw as string[]).forEach(key => {
          const screen = ALL_SCREENS.find(s => s.key === key);
          migrated[key] = screen ? [...screen.actions] : ['view'];
        });
        setPerms(migrated);
      } else {
        setPerms(buildFullPermissions());
      }
      setInitialized(true);
    }
  }, [open, isLoading, permissions]);

  const isScreenEnabled = (key: string) => !!perms[key] && perms[key].length > 0;

  const toggleScreen = (screenKey: string) => {
    setPerms(prev => {
      const copy = { ...prev };
      if (isScreenEnabled(screenKey)) {
        delete copy[screenKey];
      } else {
        const screen = ALL_SCREENS.find(s => s.key === screenKey);
        copy[screenKey] = screen ? [...screen.actions] : ['view'];
      }
      return copy;
    });
  };

  const toggleAction = (screenKey: string, action: ActionKey) => {
    setPerms(prev => {
      const copy = { ...prev };
      const current = copy[screenKey] || [];
      if (current.includes(action)) {
        const updated = current.filter(a => a !== action);
        if (updated.length === 0) {
          delete copy[screenKey];
        } else {
          copy[screenKey] = updated;
        }
      } else {
        copy[screenKey] = [...current, action];
      }
      return copy;
    });
  };

  const toggleExpand = (key: string) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => setPerms(buildFullPermissions());
  const selectNone = () => setPerms({});

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ userId, permissions: perms });
      toast({ title: 'Permissões salvas!', description: `Permissões de ${userEmail} atualizadas.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar permissões', description: error.message, variant: 'destructive' });
    }
  };

  const actionLabels: Record<string, string> = {
    view: 'Visualizar',
    create: 'Criar',
    edit: 'Editar',
    delete: 'Excluir',
  };

  const actionColors: Record<string, string> = {
    view: 'text-blue-400',
    create: 'text-emerald-400',
    edit: 'text-amber-400',
    delete: 'text-red-400',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[85vh] flex flex-col">
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

            <div className="text-xs text-slate-500 mb-2 px-1">Clique na seta para expandir e gerenciar ações individuais por tela.</div>

            {ALL_SCREENS.map(screen => {
              const enabled = isScreenEnabled(screen.key);
              const expanded = expandedScreens.has(screen.key);
              const currentActions = perms[screen.key] || [];

              return (
                <Collapsible key={screen.key} open={expanded} onOpenChange={() => toggleExpand(screen.key)}>
                  <div className={`rounded-lg border transition-colors ${enabled ? 'bg-slate-700/50 border-slate-600/50' : 'bg-slate-800/50 border-slate-700/30 opacity-60'}`}>
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2 flex-1">
                        <CollapsibleTrigger asChild>
                          <button className="text-slate-400 hover:text-slate-200 transition-colors p-0.5">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </CollapsibleTrigger>
                        <Label className="text-sm text-slate-200 cursor-pointer flex-1" onClick={() => toggleExpand(screen.key)}>
                          {screen.label}
                        </Label>
                        {enabled && (
                          <span className="text-[10px] text-slate-500">
                            {currentActions.length}/{screen.actions.length} ações
                          </span>
                        )}
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => toggleScreen(screen.key)}
                      />
                    </div>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-0">
                        <div className="flex flex-wrap gap-3 pl-7 pt-1 border-t border-slate-600/30">
                          {screen.actions.map(action => (
                            <label key={action} className="flex items-center gap-1.5 cursor-pointer py-1.5">
                              <Checkbox
                                checked={currentActions.includes(action)}
                                onCheckedChange={() => toggleAction(screen.key, action)}
                                disabled={!enabled}
                                className="border-slate-500 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                              />
                              <span className={`text-xs ${enabled ? actionColors[action] : 'text-slate-600'}`}>
                                {actionLabels[action]}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
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
