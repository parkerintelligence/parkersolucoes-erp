
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 [TEST-GLPI] Iniciando teste manual...');

    // Chamar a função de processamento GLPI
    const { data, error } = await supabase.functions.invoke('process-glpi-scheduled-tickets', {
      body: { manual_test: true }
    });

    if (error) {
      console.error('❌ [TEST-GLPI] Erro ao chamar função:', error);
      throw error;
    }

    console.log('✅ [TEST-GLPI] Resultado:', data);

    return new Response(JSON.stringify({
      success: true,
      message: 'Teste executado com sucesso',
      result: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('❌ [TEST-GLPI] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
