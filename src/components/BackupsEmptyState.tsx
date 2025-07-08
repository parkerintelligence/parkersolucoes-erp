
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive } from 'lucide-react';

const BackupsEmptyState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhuma Integração FTP Configurada
              </h3>
              <p className="text-gray-400 mb-4">
                Configure uma integração FTP na seção de Administração para visualizar os backups.
              </p>
              <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                Configurar FTP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackupsEmptyState;
