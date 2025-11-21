import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SnapshotSchedule {
  id: string;
  integration_id: string;
  vps_id: string;
  vps_name: string;
  name: string;
  cron_expression: string;
  retention_days: number;
  next_execution: string;
  execution_count: number;
}

serve(async (req) => {
  try {
    console.log('🔄 Iniciando processamento de snapshots agendados...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Buscar agendamentos ativos que precisam ser executados
    const now = new Date().toISOString();
    const { data: schedules, error: fetchError } = await supabase
      .from('hostinger_snapshot_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', now);

    if (fetchError) {
      console.error('❌ Erro ao buscar agendamentos:', fetchError);
      throw fetchError;
    }

    if (!schedules || schedules.length === 0) {
      console.log('ℹ️ Nenhum agendamento para processar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum agendamento para processar',
          processed: 0 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 ${schedules.length} agendamento(s) encontrado(s)`);

    const results = [];

    for (const schedule of schedules as SnapshotSchedule[]) {
      console.log(`\n🎯 Processando: ${schedule.name} (${schedule.vps_name})`);
      
      try {
        // Buscar dados da integração
        const { data: integration, error: integrationError } = await supabase
          .from('integrations')
          .select('*')
          .eq('id', schedule.integration_id)
          .single();

        if (integrationError || !integration) {
          console.error(`❌ Integração não encontrada: ${schedule.integration_id}`);
          results.push({ 
            schedule_id: schedule.id, 
            success: false, 
            error: 'Integração não encontrada' 
          });
          continue;
        }

        // Criar snapshot via Hostinger API
        const snapshotName = `${schedule.name}-${new Date().toISOString().split('T')[0]}`;
        
        console.log(`📸 Criando snapshot: ${snapshotName}`);
        
        const { data: snapshotResult, error: snapshotError } = await supabase.functions.invoke(
          'hostinger-proxy',
          {
            body: {
              integration_id: schedule.integration_id,
              endpoint: `/virtual-machines/${schedule.vps_id}/snapshots`,
              method: 'POST',
              data: {
                name: snapshotName,
                description: `Snapshot automático criado por: ${schedule.name}`,
              }
            }
          }
        );

        if (snapshotError) {
          console.error(`❌ Erro ao criar snapshot:`, snapshotError);
          results.push({ 
            schedule_id: schedule.id, 
            success: false, 
            error: snapshotError.message 
          });
          continue;
        }

        console.log(`✅ Snapshot criado com sucesso`);

        // Calcular próxima execução baseado no cron expression
        // Por simplicidade, vamos adicionar 24 horas se for diário
        // Para uma solução mais robusta, use uma biblioteca de parsing de cron
        const nextExecution = new Date();
        nextExecution.setHours(nextExecution.getHours() + 24);

        // Atualizar agendamento
        const { error: updateError } = await supabase
          .from('hostinger_snapshot_schedules')
          .update({
            last_execution: now,
            next_execution: nextExecution.toISOString(),
            execution_count: schedule.execution_count + 1,
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`⚠️ Erro ao atualizar agendamento:`, updateError);
        }

        results.push({ 
          schedule_id: schedule.id, 
          success: true, 
          snapshot_name: snapshotName 
        });

      } catch (error: any) {
        console.error(`❌ Erro ao processar agendamento ${schedule.id}:`, error);
        results.push({ 
          schedule_id: schedule.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Processamento concluído: ${successCount}/${results.length} sucesso(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successful: successCount,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});
