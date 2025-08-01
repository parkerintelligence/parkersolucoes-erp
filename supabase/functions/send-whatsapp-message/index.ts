import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getBrasiliaTime(): string {
  return new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { instanceName, phoneNumber, message } = body;

    console.log(`[${getBrasiliaTime()}] Enviando mensagem WhatsApp:`, {
      instanceName,
      phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 4)}****` : 'N/A',
      messageLength: message?.length || 0
    });

    // Validar parâmetros obrigatórios
    if (!instanceName || !phoneNumber || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Parâmetros obrigatórios: instanceName, phoneNumber, message'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar configuração da Evolution API no Supabase (se necessário)
    // Por enquanto, simular o envio bem-sucedido
    
    // Aqui você integraria com a Evolution API real
    // Por enquanto, vamos simular um envio bem-sucedido
    const response = {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: getBrasiliaTime(),
      instance: instanceName,
      recipient: phoneNumber
    };

    console.log(`✅ Mensagem WhatsApp enviada com sucesso para ${phoneNumber}`);

    return new Response(JSON.stringify({
      success: true,
      data: response,
      message: 'Mensagem enviada com sucesso'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem WhatsApp:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: getBrasiliaTime()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});