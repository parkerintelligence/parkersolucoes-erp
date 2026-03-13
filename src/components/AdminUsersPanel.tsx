import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Trash2, KeyRound, Shield, User, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { UserPermissionsDialog } from '@/components/UserPermissionsDialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminUsersPanel = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Create user form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Reset password form
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const callManageUsers = async (body: any) => {
    const { data, error } = await supabase.functions.invoke('manage-users', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await callManageUsers({ action: 'list' });
      setUsers(data.users || []);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: 'Preencha email e senha', variant: 'destructive' });
      return;
    }
    try {
      setActionLoading(true);
      await callManageUsers({ action: 'create', email: newEmail, password: newPassword, role: newRole });
      toast({ title: 'Usuário criado com sucesso!' });
      setShowCreateDialog(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setActionLoading(true);
      await callManageUsers({ action: 'delete', userId });
      toast({ title: 'Usuário removido com sucesso!' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erro ao remover usuário', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !resetPassword) return;
    try {
      setActionLoading(true);
      await callManageUsers({ action: 'reset-password', userId: resetUserId, newPassword: resetPassword });
      toast({ title: 'Senha resetada com sucesso!' });
      setResetUserId(null);
      setResetPassword('');
    } catch (error: any) {
      toast({ title: 'Erro ao resetar senha', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await callManageUsers({ action: 'update', userId, role });
      toast({ title: 'Papel atualizado!' });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar papel', description: error.message, variant: 'destructive' });
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'master') return <Crown className="h-4 w-4 text-yellow-400" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-400" />;
    return <User className="h-4 w-4 text-slate-400" />;
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === 'master') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (role === 'admin') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription className="text-slate-400">
            Crie, edite e remova usuários do sistema
          </CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Papel</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="user" className="text-white">Usuário</SelectItem>
                    <SelectItem value="admin" className="text-white">Admin</SelectItem>
                    <SelectItem value="master" className="text-white">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-600 text-slate-300">Cancelar</Button>
              <Button onClick={handleCreate} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center gap-3">
                  {getRoleIcon(user.role)}
                  <div>
                    <p className="text-white font-medium">{user.email}</p>
                    <p className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</p>
                  </div>
                  <Badge className={getRoleBadgeClass(user.role)}>{user.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={user.role} onValueChange={(val) => handleUpdateRole(user.id, val)}>
                    <SelectTrigger className="w-28 bg-slate-600 border-slate-500 text-white text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="user" className="text-white">Usuário</SelectItem>
                      <SelectItem value="admin" className="text-white">Admin</SelectItem>
                      <SelectItem value="master" className="text-white">Master</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog open={resetUserId === user.id} onOpenChange={(open) => { if (!open) { setResetUserId(null); setResetPassword(''); } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setResetUserId(user.id)} className="border-slate-500 text-slate-300 hover:bg-slate-600">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Resetar Senha - {user.email}</DialogTitle>
                      </DialogHeader>
                      <div>
                        <Label className="text-slate-300">Nova Senha</Label>
                        <Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Nova senha" className="bg-slate-700 border-slate-600 text-white" />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleResetPassword} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                          {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Resetar Senha
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-800 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Remover Usuário</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          Tem certeza que deseja remover {user.email}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700">Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-slate-400 py-8">Nenhum usuário encontrado</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUsersPanel;
