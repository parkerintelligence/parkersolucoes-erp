
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Eye, CheckCircle } from 'lucide-react';
import { useContracts, useCreateContract, useUpdateContract } from '@/hooks/useContracts';
import { useCompanies } from '@/hooks/useCompanies';
import { format } from 'date-fns';

const Contracts = () => {
  const { data: contracts = [], isLoading } = useContracts();
  const { data: companies = [] } = useCompanies();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contract_number: '',
    company_id: '',
    title: '',
    content: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    total_value: 0
  });

  const defaultContractTemplate = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO

CONTRATANTE: [NOME DA EMPRESA]
CONTRATADA: [SUA EMPRESA]

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de tecnologia da informação conforme especificado no orçamento anexo.

CLÁUSULA 2ª - DO PRAZO
O prazo de vigência deste contrato será de [PERÍODO] contados a partir da data de assinatura.

CLÁUSULA 3ª - DO VALOR
O valor total dos serviços será de R$ [VALOR], a ser pago conforme cronograma estabelecido.

CLÁUSULA 4ª - DAS OBRIGAÇÕES
4.1 - DA CONTRATADA:
- Executar os serviços com qualidade técnica
- Cumprir os prazos estabelecidos
- Fornecer suporte técnico

4.2 - DA CONTRATANTE:
- Efetuar os pagamentos nas datas acordadas
- Fornecer acesso necessário para execução dos serviços
- Colaborar com a execução dos trabalhos

CLÁUSULA 5ª - DAS DISPOSIÇÕES GERAIS
Este contrato será regido pelas leis brasileiras e eventuais disputas serão resolvidas no foro da comarca de [CIDADE].

Local e Data: ________________

_______________________        _______________________
    CONTRATANTE                    CONTRATADA`;

  const handleSave = () => {
    if (!formData.title || !formData.company_id) return;

    const contractNumber = formData.contract_number || `CONT-${Date.now()}`;
    const content = formData.content || defaultContractTemplate;
    
    const contractData = {
      ...formData,
      contract_number: contractNumber,
      content,
      budget_id: null
    };

    if (editingContract) {
      updateContract.mutate({ id: editingContract, updates: contractData });
    } else {
      createContract.mutate(contractData);
    }

    setFormData({ contract_number: '', company_id: '', title: '', content: '', status: 'draft', start_date: '', end_date: '', total_value: 0 });
    setIsDialogOpen(false);
    setEditingContract(null);
  };

  const handleEdit = (contract: any) => {
    setFormData({
      contract_number: contract.contract_number || '',
      company_id: contract.company_id || '',
      title: contract.title || '',
      content: contract.content || '',
      status: contract.status || 'draft',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      total_value: contract.total_value || 0
    });
    setEditingContract(contract.id);
    setIsDialogOpen(true);
  };

  const handleSignContract = (contractId: string) => {
    updateContract.mutate({ 
      id: contractId, 
      updates: { 
        status: 'signed',
        signed_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'signed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'expired': 'bg-orange-100 text-orange-800',
    };
    const labels = {
      'draft': 'Rascunho',
      'sent': 'Enviado',
      'signed': 'Assinado',
      'cancelled': 'Cancelado',
      'expired': 'Expirado',
    };
    return <Badge className={colors[status]}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando contratos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Contratos
            </h1>
            <p className="text-blue-600">Gerencie contratos de prestação de serviços</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContract ? 'Editar Contrato' : 'Criar Novo Contrato'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do contrato. Um modelo padrão será usado se não especificar o conteúdo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contract_number">Número do Contrato</Label>
                    <Input 
                      id="contract_number" 
                      placeholder="Deixe vazio para gerar automaticamente"
                      value={formData.contract_number}
                      onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_id">Empresa *</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input 
                    id="title" 
                    placeholder="Título do contrato"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data de Término</Label>
                    <Input 
                      id="end_date" 
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_value">Valor Total</Label>
                    <Input 
                      id="total_value" 
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.total_value}
                      onChange={(e) => setFormData({...formData, total_value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Conteúdo do Contrato</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Cole aqui o conteúdo personalizado do contrato ou deixe vazio para usar o modelo padrão"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                  {editingContract ? 'Atualizar' : 'Criar Contrato'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingContract(null);
                  setFormData({ contract_number: '', company_id: '', title: '', content: '', status: 'draft', start_date: '', end_date: '', total_value: 0 });
                }}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Contratos Criados</CardTitle>
            <CardDescription>Lista de todos os contratos</CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum contrato criado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-blue-50">
                      <TableCell className="font-medium">{contract.contract_number}</TableCell>
                      <TableCell>{contract.companies?.name}</TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell>R$ {(contract.total_value || 0).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(contract.status || 'draft')}</TableCell>
                      <TableCell>{format(new Date(contract.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(contract)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {contract.status !== 'signed' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleSignContract(contract.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Contracts;
