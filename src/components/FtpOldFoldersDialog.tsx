
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Folder, AlertTriangle, ExternalLink } from 'lucide-react';
import { RealFtpFile } from '@/services/realFtpService';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from '@/hooks/use-toast';

interface FtpOldFoldersDialogProps {
  files: RealFtpFile[];
}

const FtpOldFoldersDialog: React.FC<FtpOldFoldersDialogProps> = ({ files }) => {
  const { createTicket } = useGLPIExpanded();

  const getOldFolders = () => {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    
    return files.filter(file => 
      file.isDirectory && 
      new Date(file.lastModified) < fortyEightHoursAgo
    );
  };

  const oldFolders = getOldFolders();

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d atrás`;
    }
  };

  const handleCreateGLPITicket = async (folder: RealFtpFile) => {
    try {
      const timeAgo = getTimeAgo(new Date(folder.lastModified));
      const ticketContent = `🚨 ALERTA DE BACKUP NÃO REALIZADO - URGENTE

📁 Pasta: ${folder.name}
📅 Última modificação: ${new Date(folder.lastModified).toLocaleString('pt-BR')}
⏰ Tempo desde última modificação: ${timeAgo}

⚠️ Esta pasta não foi modificada há mais de 48 horas, indicando que o backup pode não estar sendo executado corretamente.

🔍 Ações necessárias:
- Verificar se o processo de backup está funcionando
- Identificar possíveis falhas no sistema
- Garantir que os backups sejam executados regularmente

📊 Status: CRÍTICO - Requer atenção imediata`;

      console.log('Criando chamado no GLPI:', folder.name);
      
      const result = await createTicket.mutateAsync({
        name: `BACKUPS NÃO REALIZADOS - URGENTE - ${folder.name}`,
        content: ticketContent,
        urgency: 5, // Muito Alta
        impact: 5,  // Muito Alto
        priority: 5, // Muito Alta
        status: 1,   // Novo
        type: 1,     // Incidente
      });

      console.log('Resposta da criação de chamado:', result);

      toast({
        title: "✅ Chamado criado com sucesso!",
        description: `Chamado #${result.id || 'N/A'} criado para a pasta ${folder.name}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao criar chamado GLPI:', error);
      toast({
        title: "❌ Erro ao criar chamado",
        description: `Falha ao criar chamado: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30">
          <Clock className="mr-2 h-4 w-4" />
          Pastas Antigas ({oldFolders.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Pastas com +48h sem Modificação
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Pastas que não foram modificadas há mais de 48 horas
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-3">
          {oldFolders.length === 0 ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-6 text-center">
                <Folder className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p className="text-gray-300">Todas as pastas foram modificadas recentemente!</p>
              </CardContent>
            </Card>
          ) : (
            oldFolders.map((folder) => (
              <Card key={folder.name} className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-600">
                        {getTimeAgo(new Date(folder.lastModified))}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleCreateGLPITicket(folder)}
                        disabled={createTicket.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 h-8"
                        title="Criar chamado urgente"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Última modificação:</span>
                      <p className="text-gray-200">{new Date(folder.lastModified).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Permissões:</span>
                      <p className="text-gray-200">{folder.permissions || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FtpOldFoldersDialog;
