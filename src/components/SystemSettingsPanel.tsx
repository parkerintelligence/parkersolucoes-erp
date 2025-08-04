import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Plus, Edit, Trash2, Save, Clock, HardDrive, 
  MessageCircle, ExternalLink, Database 
} from 'lucide-react';
import { useSystemSettings, useUpsertSystemSetting, useDeleteSystemSetting } from '@/hooks/useSystemSettings';
import { toast } from '@/hooks/use-toast';

const SystemSettingsPanel = () => {
  const { data: settings = [], isLoading, refetch } = useSystemSettings();
  const upsertSetting = useUpsertSystemSetting();
  const deleteSetting = useDeleteSystemSetting();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    setting_type: 'text',
    description: '',
    category: 'general'
  });

  // Agrupar configurações por categoria
  const settingsByCategory = settings.reduce((acc, setting) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  const categories = {
    ftp: { name: 'FTP/Backup', icon: HardDrive, color: 'blue' },
    whatsapp: { name: 'WhatsApp', icon: MessageCircle, color: 'green' },
    glpi: { name: 'GLPI', icon: ExternalLink, color: 'purple' },
    database: { name: 'Database', icon: Database, color: 'orange' },
    general: { name: 'Geral', icon: Settings, color: 'gray' }
  };

  const handleSaveSetting = async () => {
    if (!formData.setting_key || !formData.setting_value) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a chave e o valor da configuração.",
        variant: "destructive"
      });
      return;
    }

    try {
      await upsertSetting.mutateAsync(formData as any);
      setIsDialogOpen(false);
      setEditingSetting(null);
      setFormData({
        setting_key: '',
        setting_value: '',
        setting_type: 'text',
        description: '',
        category: 'general'
      });
      refetch();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setFormData({
      setting_key: setting.setting_key,
      setting_value: setting.setting_value,
      setting_type: setting.setting_type,
      description: setting.description || '',
      category: setting.category
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSetting = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      try {
        await deleteSetting.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir configuração:', error);
      }
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      text: 'bg-gray-100 text-gray-800',
      number: 'bg-blue-100 text-blue-800',
      boolean: 'bg-green-100 text-green-800'
    };
    return <Badge className={colors[type] || colors.text}>{type}</Badge>;
  };

  const getCategoryIcon = (categoryKey) => {
    const category = categories[categoryKey] || categories.general;
    const Icon = category.icon;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
          <p className="text-muted-foreground">Gerencie os parâmetros globais do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSetting(null);
              setFormData({
                setting_key: '',
                setting_value: '',
                setting_type: 'text',
                description: '',
                category: 'general'
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSetting ? 'Editar Configuração' : 'Nova Configuração'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingSetting ? 'Atualize a configuração existente' : 'Adicione uma nova configuração ao sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="setting_key">Chave da Configuração *</Label>
                <Input 
                  id="setting_key" 
                  placeholder="ex: ftp_backup_alert_hours"
                  value={formData.setting_key}
                  onChange={(e) => setFormData({...formData, setting_key: e.target.value})}
                  disabled={!!editingSetting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="setting_value">Valor *</Label>
                <Input 
                  id="setting_value" 
                  placeholder="Valor da configuração"
                  value={formData.setting_value}
                  onChange={(e) => setFormData({...formData, setting_value: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="setting_type">Tipo</Label>
                <Select value={formData.setting_type} onValueChange={(value) => setFormData({...formData, setting_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(key)}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descrição da configuração"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveSetting} disabled={upsertSetting.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {editingSetting ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {Object.entries(categories).map(([key, category]) => (
            settingsByCategory[key] && (
              <TabsTrigger key={key} value={key}>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(key)}
                  {category.name}
                </div>
              </TabsTrigger>
            )
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Configurações</CardTitle>
              <CardDescription>
                Lista completa de todas as configurações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono font-medium">{setting.setting_key}</TableCell>
                      <TableCell className="font-mono">{setting.setting_value}</TableCell>
                      <TableCell>{getTypeBadge(setting.setting_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(setting.category)}
                          {categories[setting.category]?.name || setting.category}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={setting.description}>
                        {setting.description || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditSetting(setting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSetting(setting.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {settings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma configuração encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(settingsByCategory).map(([categoryKey, categorySettings]) => (
          <TabsContent key={categoryKey} value={categoryKey}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(categoryKey)}
                  {categories[categoryKey]?.name || categoryKey}
                </CardTitle>
                <CardDescription>
                  Configurações específicas da categoria {categories[categoryKey]?.name || categoryKey}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chave</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categorySettings as any[]).map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-mono font-medium">{setting.setting_key}</TableCell>
                        <TableCell className="font-mono">{setting.setting_value}</TableCell>
                        <TableCell>{getTypeBadge(setting.setting_type)}</TableCell>
                        <TableCell className="max-w-xs truncate" title={setting.description}>
                          {setting.description || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditSetting(setting)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSetting(setting.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(categorySettings as any[]).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma configuração encontrada nesta categoria.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SystemSettingsPanel;