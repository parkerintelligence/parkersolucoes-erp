
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { FtpService, FtpFile } from '@/services/ftpService';

export const useFtp = () => {
  const queryClient = useQueryClient();
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('=== FTP Hook Status ===');
  console.log('Total integrations:', integrations?.length || 0);
  console.log('FTP integrations found:', ftpIntegrations.length);
  
  if (activeFtpIntegration) {
    console.log('Active FTP integration details:', {
      id: activeFtpIntegration.id,
      name: activeFtpIntegration.name,
      host: activeFtpIntegration.base_url,
      username: activeFtpIntegration.username,
      port: activeFtpIntegration.port || 21,
      is_active: activeFtpIntegration.is_active
    });
  } else {
    console.log('No active FTP integration found');
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
      
      const ftpService = new FtpService(activeFtpIntegration);
      const fileList = await ftpService.listFiles('/');
      
      console.log('FTP files retrieved:', fileList.length);
      console.log('Files details:', fileList);
      
      return fileList;
    },
    enabled: !!activeFtpIntegration && !isLoadingIntegrations,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Test FTP connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!activeFtpIntegration) {
        throw new Error('No FTP integration configured');
      }

      console.log('=== Testing FTP Connection ===');
      const ftpService = new FtpService(activeFtpIntegration);
      const isConnected = await ftpService.testConnection();
      
      if (!isConnected) {
        throw new Error('FTP connection test failed');
      }

      return { success: true, connectionInfo: ftpService.getConnectionInfo() };
    },
    onSuccess: (data) => {
      console.log('FTP connection test successful:', data.connectionInfo);
      toast({
        title: "✅ FTP Connection Test Successful",
        description: `Connected to ${data.connectionInfo.host}:${data.connectionInfo.port}`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('FTP connection test failed:', error);
      toast({
        title: "❌ FTP Connection Test Failed",
        description: error.message || "Please check your FTP server configuration.",
        variant: "destructive"
      });
    },
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!activeFtpIntegration) {
        throw new Error('No FTP integration configured');
      }

      console.log('=== Uploading File ===');
      console.log('File:', file.name, 'Size:', file.size);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.uploadFile(file);
      
      return { success: true, fileName: file.name };
    },
    onSuccess: (data) => {
      console.log('File upload successful:', data.fileName);
      toast({
        title: "📤 Upload Successful",
        description: `${data.fileName} uploaded successfully to FTP server.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('File upload failed:', error);
      toast({
        title: "❌ Upload Failed",
        description: error.message || "Failed to upload file to FTP server.",
        variant: "destructive"
      });
    },
  });

  // Download file
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('No FTP integration configured');
      }

      console.log('=== Downloading File ===');
      console.log('File:', fileName);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('File download successful:', data.fileName);
      toast({
        title: "📥 Download Started",
        description: `${data.fileName} download started successfully.`,
      });
    },
    onError: (error: any) => {
      console.error('File download failed:', error);
      toast({
        title: "❌ Download Failed",
        description: error.message || "Failed to download file from FTP server.",
        variant: "destructive"
      });
    },
  });

  // Delete file
  const deleteFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('No FTP integration configured');
      }

      console.log('=== Deleting File ===');
      console.log('File:', fileName);
      
      const ftpService = new FtpService(activeFtpIntegration);
      await ftpService.deleteFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('File deletion successful:', data.fileName);
      toast({
        title: "🗑️ File Deleted",
        description: `${data.fileName} deleted successfully from FTP server.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ftp-files'] });
    },
    onError: (error: any) => {
      console.error('File deletion failed:', error);
      toast({
        title: "❌ Delete Failed",
        description: error.message || "Failed to delete file from FTP server.",
        variant: "destructive"
      });
    },
  });

  // Log current state
  console.log('=== FTP Hook State ===');
  console.log('Files loaded:', files.length);
  console.log('Loading files:', isLoadingFiles);
  console.log('Files error:', filesError);

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
