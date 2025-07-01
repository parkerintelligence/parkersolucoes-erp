
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { RealFtpService, RealFtpFile } from '@/services/realFtpService';

export const useRealFtp = () => {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('=== Real FTP Hook Debug ===');
  console.log('Active FTP integration found:', !!activeFtpIntegration);
  
  if (activeFtpIntegration) {
    console.log('Integration details:', {
      id: activeFtpIntegration.id,
      name: activeFtpIntegration.name,
      host: activeFtpIntegration.base_url,
      username: activeFtpIntegration.username
    });
  }

  // Fetch FTP files using real connection
  const { data: files = [], isLoading: isLoadingFiles, error: filesError, refetch: refetchFiles } = useQuery({
    queryKey: ['real-ftp-files', activeFtpIntegration?.id],
    queryFn: async (): Promise<RealFtpFile[]> => {
      if (!activeFtpIntegration) {
        console.log('No active FTP integration - returning empty array');
        return [];
      }

      console.log('=== Fetching Real FTP Files ===');
      console.log('Using integration:', activeFtpIntegration.name);
      console.log('Server URL:', activeFtpIntegration.base_url);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      const fileList = await realFtpService.listDirectory('/');
      
      console.log('Real FTP files retrieved:', fileList.length);
      fileList.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          permissions: file.permissions,
          owner: file.owner
        });
      });
      
      return fileList;
    },
    enabled: !!activeFtpIntegration && !isLoadingIntegrations,
    retry: 2,
    retryDelay: 2000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 60000, // Cache for 1 minute
  });

  // Download file from real FTP
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Downloading from Real FTP ===');
      console.log('File:', fileName);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('Real FTP download successful:', data.fileName);
      toast({
        title: "📥 Download Concluído",
        description: `${data.fileName} foi baixado do servidor FTP real.`,
      });
    },
    onError: (error: any) => {
      console.error('Real FTP download failed:', error);
      toast({
        title: "❌ Falha no Download",
        description: error.message || "Erro ao baixar arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Upload file to real FTP
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Uploading to Real FTP ===');
      console.log('File:', file.name);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.uploadFile(file);
      
      return { success: true, fileName: file.name };
    },
    onSuccess: (data) => {
      console.log('Real FTP upload successful:', data.fileName);
      toast({
        title: "📤 Upload Concluído",
        description: `${data.fileName} foi enviado para o servidor FTP real.`,
      });
      queryClient.invalidateQueries({ queryKey: ['real-ftp-files'] });
    },
    onError: (error: any) => {
      console.error('Real FTP upload failed:', error);
      toast({
        title: "❌ Falha no Upload",
        description: error.message || "Erro ao enviar arquivo para o servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Delete file from real FTP
  const deleteFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Deleting from Real FTP ===');
      console.log('File:', fileName);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.deleteFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('Real FTP deletion successful:', data.fileName);
      toast({
        title: "🗑️ Arquivo Excluído",
        description: `${data.fileName} foi removido do servidor FTP real.`,
      });
      queryClient.invalidateQueries({ queryKey: ['real-ftp-files'] });
    },
    onError: (error: any) => {
      console.error('Real FTP deletion failed:', error);
      toast({
        title: "❌ Falha na Exclusão",
        description: error.message || "Erro ao excluir arquivo do servidor FTP.",
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
    downloadFile,
    uploadFile,
    deleteFile,
    refetchFiles,
  };
};
