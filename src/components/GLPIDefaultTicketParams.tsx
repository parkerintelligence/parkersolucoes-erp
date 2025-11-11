import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, FileJson } from 'lucide-react';
import { useSystemSettings, useUpsertSystemSetting } from '@/hooks/useSystemSettings';
import { toast } from '@/hooks/use-toast';

export const GLPIDefaultTicketParams = () => {
  const { data: settings, isLoading } = useSystemSettings('glpi');
  const upsertSetting = useUpsertSystemSetting();
  
  // Parâmetros padrão do GLPI para criação de chamados
  const defaultParams = {
    name: "",
    content: "",
    priority: 3,
    urgency: 3,
    impact: 3,
    type: 1,
    itilcategories_id: null,
    requesttypes_id: 1,
    entities_id: 0,
    _users_id_requester: null,
    _users_id_assign: null,
    _groups_id_assign: null
  };

  // Buscar configuração salva ou usar padrão
  const glpiTicketParams = settings?.find(s => s.setting_key === 'glpi_default_ticket_params');
  const savedParams = glpiTicketParams?.setting_value 
    ? JSON.parse(glpiTicketParams.setting_value) 
    : defaultParams;

  const [paramsJson, setParamsJson] = useState(JSON.stringify(savedParams, null, 2));
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    if (glpiTicketParams?.setting_value) {
      try {
        const parsed = JSON.parse(glpiTicketParams.setting_value);
        setParamsJson(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.error('Erro ao parsear parâmetros salvos:', e);
      }
    }
  }, [glpiTicketParams]);

  const handleJsonChange = (value: string) => {
    setParamsJson(value);
    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  };

  const handleSave = async () => {
    if (!isValidJson) {
      toast({
        title: "JSON inválido",
        description: "Corrija os erros no JSON antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsedParams = JSON.parse(paramsJson);
      
      await upsertSetting.mutateAsync({
        setting_key: 'glpi_default_ticket_params',
        setting_value: JSON.stringify(parsedParams),
        setting_type: 'text',
        category: 'glpi',
        description: 'Parâmetros padrão para criação de chamados GLPI'
      });

      toast({
        title: "Parâmetros salvos!",
        description: "Os parâmetros padrão foram salvos com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar parâmetros:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os parâmetros.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setParamsJson(JSON.stringify(defaultParams, null, 2));
    setIsValidJson(true);
    toast({
      title: "Parâmetros resetados",
      description: "Os valores padrão foram restaurados.",
    });
  };

  return (
    <Card className="mt-6 border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileJson className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Parâmetros Padrão de Chamados
                {!isValidJson && (
                  <Badge variant="destructive">JSON Inválido</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure os valores padrão usados ao criar novos chamados GLPI
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="glpi-params-json" className="text-sm font-medium">
            Parâmetros da API GLPI (JSON)
          </Label>
          <Textarea
            id="glpi-params-json"
            value={paramsJson}
            onChange={(e) => handleJsonChange(e.target.value)}
            className={`font-mono text-sm min-h-[400px] ${
              !isValidJson ? 'border-red-500 focus-visible:ring-red-500' : ''
            }`}
            placeholder={JSON.stringify(defaultParams, null, 2)}
          />
          {!isValidJson && (
            <p className="text-sm text-red-600">
              ⚠️ JSON inválido. Verifique a sintaxe.
            </p>
          )}
        </div>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Campos disponíveis:
          </h4>
          <div className="text-sm text-orange-800 space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <strong>name:</strong> Título do chamado (string)
              </div>
              <div>
                <strong>content:</strong> Descrição (string)
              </div>
              <div>
                <strong>priority:</strong> Prioridade (1-6)
              </div>
              <div>
                <strong>urgency:</strong> Urgência (1-5)
              </div>
              <div>
                <strong>impact:</strong> Impacto (1-5)
              </div>
              <div>
                <strong>type:</strong> Tipo (1=Incidente, 2=Solicitação)
              </div>
              <div>
                <strong>itilcategories_id:</strong> ID da categoria
              </div>
              <div>
                <strong>requesttypes_id:</strong> ID tipo de requisição
              </div>
              <div>
                <strong>entities_id:</strong> ID da entidade
              </div>
              <div>
                <strong>_users_id_requester:</strong> ID usuário solicitante
              </div>
              <div>
                <strong>_users_id_assign:</strong> ID usuário atribuído
              </div>
              <div>
                <strong>_groups_id_assign:</strong> ID grupo atribuído
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-300">
              <strong>Nota:</strong> Use <code>null</code> para campos opcionais. Valores numéricos devem ser números, não strings.
            </div>
            <div className="mt-2 pt-2 border-t border-orange-300">
              <strong>Exemplo de uso:</strong> Estes parâmetros serão mesclados com os dados fornecidos pelo usuário ao criar um chamado. 
              Os valores definidos aqui servem como padrão quando o usuário não especifica algo.
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={upsertSetting.isPending || !isValidJson || isLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {upsertSetting.isPending ? 'Salvando...' : 'Salvar Parâmetros'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};