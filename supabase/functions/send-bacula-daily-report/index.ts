import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting daily Bacula error report...')

    // Get yesterday's date range
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    console.log(`Checking for errors between ${yesterday.toISOString()} and ${yesterdayEnd.toISOString()}`)

    // Get all users with active Evolution API integrations
    const { data: evolutionIntegrations, error: evolutionError } = await supabase
      .from('integrations')
      .select('*')
      .eq('type', 'evolution_api')
      .eq('is_active', true)

    if (evolutionError) {
      console.error('Error fetching Evolution API integrations:', evolutionError)
      return new Response(JSON.stringify({ error: 'Failed to fetch integrations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${evolutionIntegrations?.length || 0} active Evolution API integrations`)

    // Process each user
    for (const integration of evolutionIntegrations || []) {
      try {
        console.log(`Processing user ${integration.user_id}...`)

        // Get user's Bacula integration
        const { data: baculaIntegrations, error: baculaError } = await supabase
          .from('integrations')
          .select('*')
          .eq('type', 'bacula')
          .eq('user_id', integration.user_id)
          .eq('is_active', true)
          .limit(1)

        if (baculaError || !baculaIntegrations || baculaIntegrations.length === 0) {
          console.log(`No active Bacula integration for user ${integration.user_id}`)
          continue
        }

        const baculaIntegration = baculaIntegrations[0]

        // Fetch yesterday's failed jobs from Bacula
        const ageInSeconds = 24 * 60 * 60 // 24 hours
        const auth = btoa(`${baculaIntegration.username}:${baculaIntegration.password}`)
        const baseUrl = baculaIntegration.base_url.replace(/\/$/, '')
        const fullUrl = `${baseUrl}/api/v2/jobs?age=${ageInSeconds}&limit=1000&order_by=jobid&order_direction=desc`

        console.log(`Fetching Bacula jobs from: ${fullUrl}`)

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })

        if (!response.ok) {
          console.error(`Bacula API error for user ${integration.user_id}: ${response.status}`)
          continue
        }

        const baculaData = await response.json()
        console.log(`Received ${baculaData?.output?.length || 0} jobs from Bacula`)

        // Extract and filter failed jobs
        const allJobs = baculaData?.output || baculaData?.result || baculaData?.data || []
        const failedJobs = allJobs.filter((job: any) => {
          // Check if job failed (status E or f)
          const isFailed = job.jobstatus === 'E' || job.jobstatus === 'f'
          
          // Check if job was from yesterday
          const jobDate = new Date(job.starttime || job.schedtime)
          const isYesterday = jobDate >= yesterday && jobDate <= yesterdayEnd
          
          return isFailed && isYesterday
        })

        console.log(`Found ${failedJobs.length} failed jobs for user ${integration.user_id}`)

        // If there are failed jobs, send WhatsApp notification
        if (failedJobs.length > 0) {
          const message = generateErrorReport(failedJobs, yesterday)
          
          // Send WhatsApp message via Evolution API
          const evolutionUrl = `${integration.base_url}/message/sendText/${integration.instance_name}`
          
          const whatsappPayload = {
            number: integration.phone_number,
            text: message
          }

          console.log(`Sending WhatsApp message to ${integration.phone_number}`)

          const whatsappResponse = await fetch(evolutionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': integration.api_token
            },
            body: JSON.stringify(whatsappPayload)
          })

          if (whatsappResponse.ok) {
            console.log(`Successfully sent error report to user ${integration.user_id}`)
          } else {
            console.error(`Failed to send WhatsApp message for user ${integration.user_id}: ${whatsappResponse.status}`)
          }
        } else {
          console.log(`No failed jobs found for user ${integration.user_id}, skipping notification`)
        }

      } catch (userError) {
        console.error(`Error processing user ${integration.user_id}:`, userError)
        continue
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: evolutionIntegrations?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in daily Bacula report:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateErrorReport(failedJobs: any[], date: Date): string {
  const dateStr = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let message = `🚨 *RELATÓRIO DE ERROS DE BACKUP* 🚨\n\n`
  message += `📅 *Data:* ${dateStr}\n`
  message += `❌ *Total de erros:* ${failedJobs.length}\n\n`
  
  message += `*DETALHES DOS ERROS:*\n`
  message += `${'='.repeat(40)}\n\n`

  failedJobs.forEach((job, index) => {
    const jobTime = new Date(job.starttime || job.schedtime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const statusText = job.jobstatus === 'E' ? 'ERRO' : 'FALHA FATAL'
    const statusEmoji = job.jobstatus === 'E' ? '⚠️' : '💥'
    
    message += `${statusEmoji} *Job ${index + 1}:*\n`
    message += `▪️ *Nome:* ${job.name || job.jobname || 'N/A'}\n`
    message += `▪️ *Cliente:* ${job.client || job.clientname || 'N/A'}\n`
    message += `▪️ *Status:* ${statusText}\n`
    message += `▪️ *Horário:* ${jobTime}\n`
    message += `▪️ *Job ID:* #${job.jobid}\n`
    
    if (job.joberrors && parseInt(job.joberrors) > 0) {
      message += `▪️ *Erros:* ${job.joberrors}\n`
    }
    
    message += `\n`
  })

  message += `${'='.repeat(40)}\n\n`
  message += `📋 *AÇÕES RECOMENDADAS:*\n`
  message += `• Verificar logs detalhados no Bacula\n`
  message += `• Analisar espaço em disco\n`
  message += `• Verificar conectividade dos clientes\n`
  message += `• Executar backup manual se necessário\n\n`
  
  message += `🤖 *Relatório automático do Sistema Parker*\n`
  message += `⏰ Enviado em: ${new Date().toLocaleString('pt-BR')}`

  return message
}