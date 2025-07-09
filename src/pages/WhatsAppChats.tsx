
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatsAppChats = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to WhatsApp page after a short delay
    const timer = setTimeout(() => {
      navigate('/whatsapp', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <Card className="max-w-md mx-auto mt-20 bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <CardTitle className="text-white">Página Removida</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-400">
            A funcionalidade de Chats foi integrada à página principal do WhatsApp.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando automaticamente em 3 segundos...
          </p>
          <Button 
            onClick={() => navigate('/whatsapp')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Ir para WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppChats;
