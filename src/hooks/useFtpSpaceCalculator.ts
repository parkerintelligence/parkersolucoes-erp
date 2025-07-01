
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FtpSpaceResult {
  totalSize: number;
  totalFiles: number;
  totalDirectories: number;
  processedPaths: string[];
  errors: string[];
}

export const useFtpSpaceCalculator = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [spaceData, setSpaceData] = useState<FtpSpaceResult | null>(null);

  const calculateTotalSpace = async (integration: any, path: string = '/') => {
    setIsCalculating(true);
    
    try {
      const cleanHost = integration.base_url
        .replace(/^(ftp:\/\/|ftps:\/\/|http:\/\/|https:\/\/)/, '')
        .replace(/\/$/, '');

      console.log('Calculating FTP space for:', cleanHost);
      
      const { data, error } = await supabase.functions.invoke('ftp-space-calculator', {
        body: {
          host: cleanHost,
          port: integration.port || 21,
          username: integration.username || 'anonymous',
          password: integration.password || '',
          path: path
        }
      });

      if (error) {
        throw new Error(`Space calculation failed: ${error.message}`);
      }

      console.log('Space calculation result:', data);
      setSpaceData(data);
      
      toast({
        title: "📊 Cálculo Concluído",
        description: `Espaço total: ${formatFileSize(data.totalSize)} | Arquivos: ${data.totalFiles} | Pastas: ${data.totalDirectories}`,
      });

      return data;
      
    } catch (error) {
      console.error('FTP space calculation error:', error);
      toast({
        title: "❌ Erro no Cálculo",
        description: error.message || "Erro ao calcular espaço total do FTP.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCalculating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    calculateTotalSpace,
    isCalculating,
    spaceData,
    formatFileSize
  };
};
