import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface FtpFile {
  name: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
  path: string;
  type: 'file' | 'directory';
  permissions: string;
  owner: string;
}

interface FtpConfig {
  host: string;
  username: string;
  password: string;
  port: number;
  secure: boolean;
  directory?: string;
  passive?: boolean;
}

export class FtpDirectClient {
  private config: FtpConfig;

  constructor(config: FtpConfig) {
    this.config = config;
  }

  private parseListResponse(data: string, currentPath: string): FtpFile[] {
    const lines = data.split('\n').filter(line => line.trim());
    const files: FtpFile[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;

      const permissions = parts[0];
      const isDirectory = permissions.startsWith('d');
      const size = parseInt(parts[4]) || 0;
      const fileName = parts.slice(8).join(' ');

      if (fileName === '.' || fileName === '..') continue;

      // Parse date
      const month = parts[5];
      const day = parts[6];
      const timeOrYear = parts[7];

      let lastModified = new Date();
      try {
        const currentYear = new Date().getFullYear();
        const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
        
        if (timeOrYear.includes(':')) {
          lastModified = new Date(currentYear, monthNum, parseInt(day));
        } else {
          lastModified = new Date(parseInt(timeOrYear), monthNum, parseInt(day));
        }
      } catch (e) {
        console.log('Error parsing date:', e);
      }

      files.push({
        name: fileName,
        size,
        lastModified,
        isDirectory,
        path: currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`,
        type: isDirectory ? 'directory' : 'file',
        permissions,
        owner: this.config.username
      });
    }

    return files;
  }

  private async executeFtpCommand(command: string): Promise<string> {
    // Since we can't use actual FTP in browser, we'll simulate based on WebDAV or HTTP
    // For now, return mock data structure
    console.log('FTP Direct Command (simulated):', command);
    
    // This would be replaced with actual WebDAV implementation or HTTP-based file API
    const mockData = this.getMockData(command);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    return mockData;
  }

  private getMockData(command: string): string {
    if (command.startsWith('LIST') || command.startsWith('NLST')) {
      return `drwxr-xr-x 1 ${this.config.username} ${this.config.username} 0 Jan 15 10:30 backups
drwxr-xr-x 1 ${this.config.username} ${this.config.username} 0 Jan 14 15:20 databases
-rw-r--r-- 1 ${this.config.username} ${this.config.username} 157286400 Jan 15 09:45 backup_${new Date().toISOString().split('T')[0]}.tar.gz
-rw-r--r-- 1 ${this.config.username} ${this.config.username} 2048576 Jan 15 11:15 system_logs.txt
-rw-r--r-- 1 ${this.config.username} ${this.config.username} 1024 Jan 15 12:00 config.ini`;
    }
    return '';
  }

  async listDirectory(path: string = '/'): Promise<FtpFile[]> {
    console.log('FTP Direct List:', path);
    
    try {
      const response = await this.executeFtpCommand(`LIST ${path}`);
      return this.parseListResponse(response, path);
    } catch (error) {
      console.error('FTP list error:', error);
      throw error;
    }
  }

  async downloadFile(fileName: string, remotePath: string = '/'): Promise<void> {
    console.log('FTP Direct Download:', { fileName, remotePath });
    
    try {
      // Create mock file content for download
      const content = `Mock content for ${fileName}\nDownloaded from FTP server: ${this.config.host}\nPath: ${remotePath}\nTime: ${new Date().toISOString()}\n\nThis is simulated content since browser FTP is limited.`;
      
      // Create blob and trigger download
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ File downloaded successfully (simulated)');
    } catch (error) {
      console.error('❌ FTP download failed:', error);
      throw error;
    }
  }

  async uploadFile(file: File, remotePath: string = '/'): Promise<void> {
    console.log('FTP Direct Upload:', { fileName: file.name, size: file.size, remotePath });
    
    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ File uploaded successfully (simulated)');
    } catch (error) {
      console.error('❌ FTP upload failed:', error);
      throw error;
    }
  }

  async deleteFile(fileName: string, remotePath: string = '/'): Promise<void> {
    console.log('FTP Direct Delete:', { fileName, remotePath });
    
    try {
      await this.executeFtpCommand(`DELE ${remotePath}/${fileName}`);
      console.log('✅ File deleted successfully (simulated)');
    } catch (error) {
      console.error('❌ FTP delete failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.executeFtpCommand('PWD');
      return true;
    } catch (error) {
      console.error('FTP connection test failed:', error);
      return false;
    }
  }

  getConnectionInfo() {
    return {
      host: this.config.host,
      username: this.config.username,
      port: this.config.port,
      secure: this.config.secure,
      directory: this.config.directory,
      passive: this.config.passive,
      serverUrl: `${this.config.secure ? 'ftps' : 'ftp'}://${this.config.host}:${this.config.port}${this.config.directory || ''}`
    };
  }
}

export const useFtpDirect = (integration?: any) => {
  const [client, setClient] = useState<FtpDirectClient | null>(null);
  const [currentPath, setCurrentPath] = useState('/');

  // Create client when integration is available
  useEffect(() => {
    if (integration) {
      const cleanHost = integration.base_url
        .replace(/^(ftp:\/\/|ftps:\/\/|http:\/\/|https:\/\/)/, '')
        .replace(/\/$/, '');
      
      const newClient = new FtpDirectClient({
        host: cleanHost,
        username: integration.username || 'anonymous',
        password: integration.password || '',
        port: integration.port || 21,
        secure: integration.use_ssl || false,
        directory: integration.directory || '/',
        passive: integration.passive_mode !== false
      });
      setClient(newClient);
    }
  }, [integration]);

  // List directory
  const { data: files = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ftp-files', currentPath, integration?.id],
    queryFn: () => client?.listDirectory(currentPath) || [],
    enabled: !!client,
    refetchInterval: 30000
  });

  // Test connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Client not initialized');
      return await client.testConnection();
    }
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: async ({ file, path }: { file: File; path?: string }) => {
      if (!client) throw new Error('Client not initialized');
      return await client.uploadFile(file, path || currentPath);
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Download file
  const downloadFile = useMutation({
    mutationFn: async ({ fileName, path }: { fileName: string; path?: string }) => {
      if (!client) throw new Error('Client not initialized');
      return await client.downloadFile(fileName, path || currentPath);
    }
  });

  // Delete file
  const deleteFile = useMutation({
    mutationFn: async ({ fileName, path }: { fileName: string; path?: string }) => {
      if (!client) throw new Error('Client not initialized');
      return await client.deleteFile(fileName, path || currentPath);
    },
    onSuccess: () => {
      refetch();
    }
  });

  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const navigateUp = useCallback(() => {
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      setCurrentPath(parentPath);
    }
  }, [currentPath]);

  return {
    client,
    files,
    currentPath,
    isLoading,
    error,
    testConnection,
    uploadFile,
    downloadFile,
    deleteFile,
    navigateToPath,
    navigateUp,
    refetch,
    connectionInfo: client?.getConnectionInfo()
  };
};