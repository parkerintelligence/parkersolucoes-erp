
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { FtpService, FtpFile } from '@/services/ftpService';

export const useFtp = () => {
  const queryClient = useQueryClient();
  const { data: integrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('Integrações FTP ativas encontradas:', ftpIntegrations.length);

  // Buscar arquivos do FTP
  const { data: files = [], isLoading: isLoadingFiles, error: filesError } = useQuery({
    queryKey: ['ftp-files', activeFtpIntegration?.id],
    queryFn: async (): Promise<FtpFile[]> => {
      if (!activeFtpIntegration) {
        console.log('Nenhuma integração FTP ativa');
        return [];
      }

      console.log('Conectando ao FTP para listar arquivos...');
      const ftpService = new FtpService(activeFtpIntegration);
      return await ftpService.listFiles();
    },
    enabled: !!activeFtpIntegration,
    retry: 2,
    retryDelay: 1000,
  });

  // Testar conexão FTP
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!activeFtpIntegration) {
        throw new Error('Integração FTP não configurada');
      }

      const ftpService = new FtpService(activeFtpIntegration);
      const isConnected = await ftpService.testConnection();
      
      if (!isConnected) {
        throw new Error('Falha na conexão com o servidor FTP');
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Conexão FTP testada!",
        description: "Conexão com o servidor FTP estabelecida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro na conexão FTP:', error);
      toast({
        title: "Erro na conexão FTP",
        description: error.message || "Erro ao conectar com o servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Download de arquivo
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Integração FTP não configurada');
      }

      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      toast({
        title: "Download iniciado",
        description: `Download de ${data.fileName} foi iniciado.`,
      });
    },
    onError: (error) => {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: error.message || "Erro ao baixar arquivo do FTP.",
        variant: "destructive"
      });
    },
  });

  return {
    files,
    isLoadingFiles,
    filesError,
    ftpIntegration: activeFtpIntegration,
    ftpIntegrations,
    testConnection,
    downloadFile,
  };
};
