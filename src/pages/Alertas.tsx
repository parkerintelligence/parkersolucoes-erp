import React from 'react';

export default function Alertas() {
  // Return a simple message since monitoring integrations were removed
  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-white mb-4">Alertas</h1>
        <p className="text-muted-foreground">Funcionalidade de alertas desabilitada. Configure uma integração de monitoramento no painel administrativo.</p>
      </div>
    </div>
  );
}