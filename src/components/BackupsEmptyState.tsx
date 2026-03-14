
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive } from 'lucide-react';

const BackupsEmptyState: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="text-center">
            <HardDrive className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma Integração FTP Configurada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Configure uma integração FTP na seção de Administração para visualizar os backups.
            </p>
            <Button onClick={() => window.location.href = '/admin'} size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
              Configurar FTP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupsEmptyState;
