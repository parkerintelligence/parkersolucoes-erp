
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Link as LinkIcon, Building, Filter, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompanyLinks, useCreateCompanyLink, useUpdateCompanyLink, useDeleteCompanyLink } from '@/hooks/useCompanyLinks';

const Links = () => {
  const { isAuthenticated } = useAuth();
  const { data: companies = [] } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const { data: links = [] } = useCompanyLinks(selectedCompanyId);
  const createLink = useCreateCompanyLink();
  const updateLink = useUpdateCompanyLink();
  const deleteLink = useDeleteCompanyLink();

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isMasterPasswordDialogOpen, setIsMasterPasswordDialogOpen] = useState(false);
  const [currentLinkForPassword, setCurrentLinkForPassword] = useState<string>('');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [isAuthenticated2, setIsAuthenticated2] = useState(false);

  const [linkFormData, setLinkFormData] = useState({
    name: '',
    url: '',
    service: ''
  });

  const [passwordFormData, setPasswordFormData] = useState({
    username: '',
    password: ''
  });

  const services = ['ERP', 'Email', 'Administração', 'Vendas', 'Financeiro', 'RH', 'Backup', 'Monitoramento'];

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleSaveLink = () => {
    if (!linkFormData.name || !linkFormData.url || !selectedCompanyId) {
      toast({
        title: "Erro",
        description: "Nome, URL e empresa são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createLink.mutate({
      ...linkFormData,
      company_id: selectedCompanyId,
      username: null,
      password: null
    });

    setLinkFormData({ name: '', url: '', service: '' });
    setIsLinkDialogOpen(false);
  };

  const handleSavePassword = () => {
    if (!passwordFormData.username || !passwordFormData.password) {
      toast({
        title: "Erro",
        description: "Usuário e senha são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    updateLink.mutate({
      id: currentLinkForPassword,
      updates: {
        username: passwordFormData.username,
        password: passwordFormData.password
      }
    });

    setPasswordFormData({ username: '', password: '' });
    setIsPasswordDialogOpen(false);
    setCurrentLinkForPassword('');
  };

  const handleCompanyFilterChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const openPasswordDialog = (linkId: string) => {
    setCurrentLinkForPassword(linkId);
    setIsPasswordDialogOpen(true);
  };

  const handleShowPassword = (linkId: string) => {
    const masterPassword = localStorage.getItem('systemMasterPassword');
    
    if (!masterPassword) {
      toast({
        title: "Erro",
        description: "Senha master não configurada no sistema.",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated2) {
      setCurrentLinkForPassword(linkId);
      setIsMasterPasswordDialogOpen(true);
      return;
    }

    setShowPasswords(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };

  const verifyMasterPassword = () => {
    const masterPassword = localStorage.getItem('systemMasterPassword');
    
    if (masterPasswordInput === masterPassword) {
      setIsAuthenticated2(true);
      setShowPasswords(prev => ({
        ...prev,
        [currentLinkForPassword]: true
      }));
      setIsMasterPasswordDialogOpen(false);
      setMasterPasswordInput('');
      
      // Desautenticar após 5 minutos
      setTimeout(() => {
        setIsAuthenticated2(false);
        setShowPasswords({});
      }, 300000);
      
      toast({
        title: "Sucesso!",
        description: "Senha verificada. Acesso liberado por 5 minutos.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Senha master incorreta.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLink = (linkId: string) => {
    deleteLink.mutate(linkId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <LinkIcon className="h-8 w-8" />
              Gerenciador de Links
            </h1>
            <p className="text-blue-600">Organize links de acesso aos sistemas das empresas</p>
          </div>
        </div>

        {/* Filtro por Empresa */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Selecionar Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="company-filter">Selecione uma empresa para ver seus links</Label>
                <Select value={selectedCompanyId} onValueChange={handleCompanyFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setSelectedCompanyId('')}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Limpar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links da Empresa Selecionada */}
        {selectedCompanyId && selectedCompany && (
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Links - {selectedCompany.name}
                </CardTitle>
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Link</DialogTitle>
                      <DialogDescription>
                        Adicione um link para {selectedCompany.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Sistema *</Label>
                        <Input 
                          id="name" 
                          placeholder="Nome do sistema"
                          value={linkFormData.name}
                          onChange={(e) => setLinkFormData({...linkFormData, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="url">URL *</Label>
                        <Input 
                          id="url" 
                          placeholder="https://..."
                          value={linkFormData.url}
                          onChange={(e) => setLinkFormData({...linkFormData, url: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="service">Tipo de Serviço</Label>
                        <Select value={linkFormData.service} onValueChange={(value) => setLinkFormData({...linkFormData, service: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveLink}>
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <LinkIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum link cadastrado para esta empresa</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {links.map((link) => (
                    <Card key={link.id} className="border-blue-100 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-blue-900 line-clamp-2">{link.name}</h4>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            {link.service && (
                              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                {link.service}
                              </Badge>
                            )}
                            {link.username && link.password && (
                              <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                <Lock className="h-3 w-3 mr-1" />
                                Senha
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 truncate" title={link.url}>{link.url}</p>
                        
                        {/* Mostrar senha se existir */}
                        {link.username && link.password && (
                          <div className="mb-3 p-2 bg-gray-50 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">Usuário:</span>
                              <span className="text-xs text-gray-600">{link.username}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">Senha:</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-600 font-mono">
                                  {showPasswords[link.id] ? link.password : '••••••••'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleShowPassword(link.id)}
                                >
                                  {showPasswords[link.id] ? 
                                    <EyeOff className="h-3 w-3" /> : 
                                    <Eye className="h-3 w-3" />
                                  }
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Acessar
                          </Button>
                          
                          {!(link.username && link.password) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => openPasswordDialog(link.id)}
                            >
                              <Key className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog para cadastrar senha */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Senha do Link</DialogTitle>
              <DialogDescription>
                Adicione as credenciais de acesso para este sistema
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuário *</Label>
                <Input 
                  id="username" 
                  placeholder="Nome de usuário"
                  value={passwordFormData.username}
                  onChange={(e) => setPasswordFormData({...passwordFormData, username: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha *</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Senha de acesso"
                  value={passwordFormData.password}
                  onChange={(e) => setPasswordFormData({...passwordFormData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSavePassword}>
                Salvar Senha
              </Button>
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para verificar senha master */}
        <Dialog open={isMasterPasswordDialogOpen} onOpenChange={setIsMasterPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Verificação de Segurança</DialogTitle>
              <DialogDescription>
                Digite a senha master do sistema para visualizar as senhas
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="masterPassword">Senha Master</Label>
                <Input 
                  id="masterPassword" 
                  type="password"
                  placeholder="Digite a senha master"
                  value={masterPasswordInput}
                  onChange={(e) => setMasterPasswordInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-red-600 hover:bg-red-700" onClick={verifyMasterPassword}>
                Verificar
              </Button>
              <Button variant="outline" onClick={() => setIsMasterPasswordDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Estatísticas só aparece quando empresa estiver selecionada */}
        {selectedCompanyId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{links.length}</p>
                    <p className="text-sm text-blue-600">Links da Empresa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {links.filter(l => l.username && l.password).length}
                    </p>
                    <p className="text-sm text-blue-600">Com Senhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {[...new Set(links.map(l => l.service))].filter(Boolean).length}
                    </p>
                    <p className="text-sm text-blue-600">Tipos de Serviços</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Links;
