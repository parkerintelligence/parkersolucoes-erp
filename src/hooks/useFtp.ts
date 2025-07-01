
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { FtpService, FtpFile } from '@/services/ftpService';

export const useFtp = () => {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('Integrações FTP ativas encontradas:', ftpIntegrations.length);
  if (activeFtpIntegration) {
    console.log('Integração FTP ativa:', {
      name: activeFtpIntegration.name,
      host: activeFtpIntegration.base_url,
      username: activeFtpIntegration.username
    });
  }

  // Buscar arquivos do FTP
  const { data: files = [], isLoading: isLoadingFiles, error: filesError } = useQuery({
    queryKey: ['ftp-files', activeFtpIntegration?.id],
    queryFn: async (): Promise<FtpFile[]> => {
      if (!activeFtpIntegration) {
        console.log('Nenhuma integração FTP ativa');
        return [];
      }

      console.log('Conectando ao FTP para listar arquivos...');
      console.log('Dados da conexão:', {
        host: activeFtpIntegration.base_url,
        username: activeFtpIntegration.username,
        hasPassword: !!activeFtpIntegration.password
      });

      const ftpService = new FtpService(activeFtpIntegration);
      const fileList = await ftpService.listFiles();
      
      console.log(`Arquivos encontrados: ${fileList.length}`);
      return fileList;
    },
    enabled: !!activeFtpIntegration && !isLoadingIntegrations,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Testar conexão FTP
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('Testando conexão FTP...');
      const ftpService = new FtpService(activeFtpIntegration);
      const connectionInfo = ftpService.getConnectionInfo();
      
      console.log('Testando conexão com:', connectionInfo);
      
      const isConnected = await ftpService.testConnection();
      
      if (!isConnected) {
        throw new Error('Falha na conexão com o servidor FTP');
      }

      return { success: true, connectionInfo };
    },
    onSuccess: (data) => {
      console.log('Conexão FTP testada com sucesso:', data.connectionInfo);
      toast({
        title: "✅ Conexão FTP testada!",
        description: `Conexão estabelecida com ${data.connectionInfo.host}:${data.connectionInfo.port}`,
      });
      // Recarregar arquivos após teste bem-sucedido
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('Erro na conexão FTP:', error);
      toast({
        title: "❌ Erro na conexão FTP",
        description: error.message || "Verifique os dados de configuração do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Download de arquivo
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('Iniciando download de:', fileName);
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('Download realizado:', data.fileName);
      toast({
        title: "📥 Download iniciado",
        description: `Download de ${data.fileName} foi iniciado com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Erro no download:', error);
      toast({
        title: "❌ Erro no download",
        description: error.message || "Não foi possível baixar o arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  return {
    files,
    isLoadingFiles: isLoadingFiles || isLoadingIntegrations,
    filesError,
    ftpIntegration: activeFtpIntegration,
    ftpIntegrations,
    testConnection,
    downloadFile,
  };
};
