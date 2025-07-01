
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { FtpService, FtpFile } from '@/services/ftpService';

export const useFtp = () => {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('=== FTP Hook Debug Info ===');
  console.log('Total integrations loaded:', integrations?.length || 0);
  console.log('FTP integrations found:', ftpIntegrations.length);
  
  if (activeFtpIntegration) {
    console.log('Active FTP integration:', {
      id: activeFtpIntegration.id,
      name: activeFtpIntegration.name,
      host: activeFtpIntegration.base_url,
      username: activeFtpIntegration.username,
      is_active: activeFtpIntegration.is_active
    });
  } else {
    console.log('No active FTP integration found');
    console.log('Available integrations:', integrations?.map(i => ({ type: i.type, name: i.name, active: i.is_active })));
  }

  // Fetch FTP files
  const { data: files = [], isLoading: isLoadingFiles, error: filesError, refetch: refetchFiles } = useQuery({
    queryKey: ['ftp-files', activeFtpIntegration?.id],
    queryFn: async (): Promise<FtpFile[]> => {
      if (!activeFtpIntegration) {
        console.log('No active FTP integration - returning empty array');
        return [];
      }

      console.log('=== Fetching FTP Files ===');
      console.log('Using integration:', activeFtpIntegration.name);
      console.log('Server:', activeFtpIntegration.base_url);
      
      const ftpService = new FtpService(activeFtpIntegration);
      const fileList = await ftpService.listFiles('/');
      
      console.log('FTP files retrieved:', fileList.length);
      fileList.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          isDirectory: file.isDirectory,
          lastModified: file.lastModified.toISOString()
        });
      });
      
      return fileList;
    },
    enabled: !!activeFtpIntegration && !isLoadingIntegrations,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 30000,
  });

  // Test FTP connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Testing FTP Connection ===');
      const ftpService = new FtpService(activeFtpIntegration);
      const isConnected = await ftpService.testConnection();
      
      if (!isConnected) {
        throw new Error('Falha no teste de conexão FTP');
      }

      return { success: true, connectionInfo: ftpService.getConnectionInfo() };
    },
    onSuccess: (data) => {
      console.log('FTP connection test successful:', data.connectionInfo);
      toast({
        title: "✅ Teste de Conexão FTP Bem-sucedido",
        description: `Conectado ao ${data.connectionInfo.host}:${data.connectionInfo.port}`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('FTP connection test failed:', error);
      toast({
        title: "❌ Falha no Teste de Conexão FTP",
        description: error.message || "Verifique a configuração do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Uploading File to FTP ===');
      console.log('File:', file.name, 'Size:', file.size);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.uploadFile(file);
      
      return { success: true, fileName: file.name };
    },
    onSuccess: (data) => {
      console.log('File upload successful:', data.fileName);
      toast({
        title: "📤 Upload Realizado com Sucesso",
        description: `${data.fileName} foi enviado para o servidor FTP.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('File upload failed:', error);
      toast({
        title: "❌ Falha no Upload",
        description: error.message || "Falha ao enviar arquivo para o servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Download file
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Downloading File from FTP ===');
      console.log('File:', fileName);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('File download successful:', data.fileName);
      toast({
        title: "📥 Download Iniciado",
        description: `${data.fileName} está sendo baixado do servidor FTP.`,
      });
    },
    onError: (error: any) => {
      console.error('File download failed:', error);
      toast({
        title: "❌ Falha no Download",
        description: error.message || "Falha ao baixar arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Delete file
  const deleteFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Deleting File from FTP ===');
      console.log('File:', fileName);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.deleteFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('File deletion successful:', data.fileName);
      toast({
        title: "🗑️ Arquivo Excluído",
        description: `${data.fileName} foi removido do servidor FTP.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('File deletion failed:', error);
      toast({
        title: "❌ Falha na Exclusão",
        description: error.message || "Falha ao excluir arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Log current hook state
  console.log('=== FTP Hook Current State ===');
  console.log('Files loaded:', files.length);
  console.log('Loading files:', isLoadingFiles);
  console.log('Files error:', filesError?.message);
  console.log('Has active integration:', !!activeFtpIntegration);

  return {
    files,
    isLoadingFiles: isLoadingFiles || isLoadingIntegrations,
    filesError,
    ftpIntegration: activeFtpIntegration,
    ftpIntegrations,
    testConnection,
    uploadFile,
    downloadFile,
    deleteFile,
    refetchFiles,
  };
};
