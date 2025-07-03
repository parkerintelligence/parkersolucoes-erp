import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Search,
  Calendar,
  Building,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([
    {
      id: '1',
      name: 'Lembrete de Vencimento',
      content: 'Olá! Lembro que o {sistema} da empresa {empresa} tem vencimento em {dias} dias ({data}). Precisa de ajuda para renovação?',
      category: 'Lembrete',
      variables: ['sistema', 'empresa', 'dias', 'data']
    },
    {
      id: '2', 
      name: 'Vencimento Urgente',
      content: '🚨 URGENTE: O {sistema} da {empresa} vence hoje ({data})! Entre em contato imediatamente para renovação.',
      category: 'Urgente',
      variables: ['sistema', 'empresa', 'data']
    },
    {
      id: '3',
      name: 'Backup Agendado',
      content: 'O backup do sistema {sistema} da {empresa} está agendado para hoje às {hora}. Certifique-se de que o sistema esteja acessível.',
      category: 'Backup',
      variables: ['sistema', 'empresa', 'hora']
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: ''
  });

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content || !formData.category) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const variables = extractVariables(formData.content);
    const newTemplate: WhatsAppTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name,
      content: formData.content,
      category: formData.category,
      variables
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? newTemplate : t));
      toast({
        title: "Modelo atualizado!",
        description: "O modelo foi atualizado com sucesso."
      });
    } else {
      setTemplates([...templates, newTemplate]);
      toast({
        title: "Modelo criado!",
        description: "O modelo foi criado com sucesso."
      });
    }

    setFormData({ name: '', content: '', category: '' });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleEdit = (template: WhatsAppTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Modelo excluído!",
      description: "O modelo foi excluído com sucesso."
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Modelo copiado!",
      description: "O conteúdo foi copiado para a área de transferência."
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Lembrete': 'bg-blue-100 text-blue-800 border-blue-200',
      'Urgente': 'bg-red-100 text-red-800 border-red-200',
      'Backup': 'bg-green-100 text-green-800 border-green-200',
      'Manutenção': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Geral': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modelos WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie modelos de mensagens para envio via Evolution API</p>
        </div>
        <Button 
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', content: '', category: '' });
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Modelo
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar modelos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  {template.name}
                </CardTitle>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{template.content}</p>
              </div>
              
              {template.variables.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Variáveis disponíveis:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(template.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Nenhum modelo encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm ? 'Nenhum modelo corresponde aos filtros aplicados.' : 'Crie seu primeiro modelo de mensagem para WhatsApp.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      {showForm && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <CardHeader className="p-0">
              <CardTitle>{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</CardTitle>
              <CardDescription>
                {editingTemplate ? 'Edite o modelo de mensagem.' : 'Crie um novo modelo de mensagem para WhatsApp.'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lembrete de Vencimento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Lembrete, Urgente, Backup"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo da Mensagem *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Use {variavel} para inserir dados dinâmicos"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{empresa}, {sistema}, {data}, {dias}, {hora}`} como variáveis dinâmicas.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingTemplate ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppTemplates;