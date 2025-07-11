
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Zabbix Webhook Function Start ===')
    console.log('Method:', req.method)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))

    // Verificar se há body na requisição
    const contentType = req.headers.get('content-type') || ''
    console.log('Content-Type:', contentType)

    let webhookData = {}
    
    // Validar e fazer parse do JSON apenas se houver conteúdo
    try {
      const bodyText = await req.text()
      console.log('Raw body text:', bodyText)
      
      if (bodyText && bodyText.trim() !== '') {
        webhookData = JSON.parse(bodyText)
        console.log('Webhook data parsed successfully:', JSON.stringify(webhookData, null, 2))
      } else {
        console.log('Empty body received, using default test data')
        // Dados de teste padrão para requisições vazias
        webhookData = {
          problem_name: 'Teste de webhook vazio',
          host_name: 'servidor-teste',
          severity: '3',
          eventid: Date.now().toString(),
          status: '1'
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format in request body',
          details: parseError.message,
          receivedData: await req.text()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract problem data from webhook
    const {
      problem_name = webhookData.subject || 'Problema desconhecido',
      host_name = webhookData.host || 'Host desconhecido',
      severity = webhookData.severity || '3',
      event_id = webhookData.eventid || Date.now().toString(),
      trigger_id = webhookData.triggerid,
      status = webhookData.status || '1'
    } = webhookData

    console.log('Processed webhook data:', {
      problem_name,
      host_name,
      severity,
      event_id,
      trigger_id,
      status
    })

    // Find active Zabbix webhooks that match this trigger type
    let triggerType = status === '0' ? 'problem_resolved' : 'problem_created'
    
    // Determinar tipo de trigger baseado no status e outras condições
    if (status === '0') {
      triggerType = 'problem_resolved'
    } else if (status === '1') {
      triggerType = 'problem_created'
    }
    
    const { data: webhooks, error: webhooksError } = await supabase
      .from('zabbix_webhooks')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true)

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar webhooks', details: webhooksError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${webhooks?.length || 0} active webhooks for trigger type: ${triggerType}`)

    if (!webhooks || webhooks.length === 0) {
      console.log('No active webhooks found for this trigger type')
      return new Response(
        JSON.stringify({ message: 'No active webhooks configured', trigger_type: triggerType }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each webhook
    const results = []
    
    for (const webhook of webhooks) {
      console.log(`Processing webhook: ${webhook.name}`)
      
      try {
        // Update webhook trigger count and last triggered
        await supabase
          .from('zabbix_webhooks')
          .update({
            trigger_count: (webhook.trigger_count || 0) + 1,
            last_triggered: new Date().toISOString()
          })
          .eq('id', webhook.id)

        const webhookResult = { webhook_id: webhook.id, webhook_name: webhook.name, actions: [] }

        // Execute GLPI ticket creation
        if (webhook.actions.create_glpi_ticket) {
          console.log('Creating GLPI ticket...')
          
          try {
            // Get GLPI integration
            const { data: glpiIntegration } = await supabase
              .from('integrations')
              .select('*')
              .eq('type', 'glpi')
              .eq('is_active', true)
              .single()

            if (glpiIntegration) {
              const glpiResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/glpi-proxy`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({
                  integrationId: glpiIntegration.id,
                  action: 'createTicket',
                  data: {
                    name: `Zabbix: ${problem_name}`,
                    content: `Problema: ${problem_name}\nHost: ${host_name}\nSeveridade: ${severity}\nEvent ID: ${event_id}\nStatus: ${status === '0' ? 'Resolvido' : 'Ativo'}\n\nEste chamado foi criado automaticamente pelo webhook do Zabbix.`,
                    urgency: parseInt(severity) >= 4 ? 4 : 3,
                    impact: parseInt(severity) >= 4 ? 4 : 3,
                    priority: parseInt(severity) >= 4 ? 4 : 3,
                    status: 1,
                    type: 1,
                    entities_id: webhook.actions.glpi_entity_id || 0
                  }
                })
              })

              const glpiResult = await glpiResponse.json()
              webhookResult.actions.push({ type: 'glpi_ticket', success: !glpiResult.error, result: glpiResult })
              console.log('GLPI ticket result:', glpiResult)
            } else {
              webhookResult.actions.push({ type: 'glpi_ticket', success: false, error: 'GLPI integration not found' })
            }
          } catch (glpiError) {
            console.error('GLPI ticket creation error:', glpiError)
            webhookResult.actions.push({ type: 'glpi_ticket', success: false, error: glpiError.message })
          }
        }

        // Execute WhatsApp message
        if (webhook.actions.send_whatsapp && webhook.actions.whatsapp_number) {
          console.log('Sending WhatsApp message...')
          console.log('WhatsApp number configured:', webhook.actions.whatsapp_number)
          
          try {
            // Get Evolution API integration
            const { data: evolutionIntegration, error: evolutionError } = await supabase
              .from('integrations')
              .select('*')
              .eq('type', 'evolution_api')
              .eq('is_active', true)
              .single()

            console.log('Evolution integration found:', evolutionIntegration ? 'Yes' : 'No')
            if (evolutionError) {
              console.error('Evolution integration error:', evolutionError)
            }

            if (evolutionIntegration) {
              console.log('Evolution API details:', {
                base_url: evolutionIntegration.base_url,
                instance_name: evolutionIntegration.instance_name,
                has_token: !!evolutionIntegration.api_token
              })

              // Teste de conectividade com a API
              console.log('Testing Evolution API connectivity...')
              const testUrl = `${evolutionIntegration.base_url}/instance/fetchInstances`
              const testResponse = await fetch(testUrl, {
                method: 'GET',
                headers: {
                  'apikey': evolutionIntegration.api_token
                }
              })
              
              console.log('API connectivity test response:', testResponse.status, testResponse.statusText)
              
              // Verificar status da instância
              const instanceUrl = `${evolutionIntegration.base_url}/instance/connectionState/${evolutionIntegration.instance_name}`
              const instanceResponse = await fetch(instanceUrl, {
                method: 'GET',
                headers: {
                  'apikey': evolutionIntegration.api_token
                }
              })
              
              const instanceStatus = await instanceResponse.json()
              console.log('Instance status:', instanceStatus)

              // Prepare custom message with variable replacement
              let message = webhook.actions.custom_message || 
                `🚨 Alerta Zabbix\n\nProblema: ${problem_name}\nHost: ${host_name}\nSeveridade: ${severity}\nStatus: ${status === '0' ? 'Resolvido' : 'Ativo'}`

              // Replace variables in message
              message = message
                .replace(/{problem_name}/g, problem_name)
                .replace(/{host_name}/g, host_name)
                .replace(/{severity}/g, severity)
                .replace(/{timestamp}/g, new Date().toLocaleString('pt-BR'))

              console.log('Sending message to:', webhook.actions.whatsapp_number)
              console.log('Message content:', message)

              const whatsappUrl = `${evolutionIntegration.base_url}/message/sendText/${evolutionIntegration.instance_name}`
              console.log('WhatsApp API URL:', whatsappUrl)

              const whatsappPayload = {
                number: webhook.actions.whatsapp_number,
                text: message
              }
              console.log('WhatsApp payload:', whatsappPayload)

              const whatsappResponse = await fetch(whatsappUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionIntegration.api_token
                },
                body: JSON.stringify(whatsappPayload)
              })

              console.log('WhatsApp response status:', whatsappResponse.status, whatsappResponse.statusText)

              const whatsappResult = await whatsappResponse.json()
              console.log('WhatsApp message result:', JSON.stringify(whatsappResult, null, 2))

              webhookResult.actions.push({ 
                type: 'whatsapp_message', 
                success: whatsappResponse.ok, 
                result: whatsappResult,
                api_status: whatsappResponse.status,
                api_url: whatsappUrl,
                instance_status: instanceStatus
              })
            } else {
              const errorMsg = 'Evolution API integration not found or inactive'
              console.error(errorMsg)
              webhookResult.actions.push({ type: 'whatsapp_message', success: false, error: errorMsg })
            }
          } catch (whatsappError) {
            console.error('WhatsApp message error details:', {
              message: whatsappError.message,
              stack: whatsappError.stack,
              name: whatsappError.name
            })
            webhookResult.actions.push({ type: 'whatsapp_message', success: false, error: whatsappError.message })
          }
        }

        results.push(webhookResult)
        console.log(`Webhook ${webhook.name} processed successfully`)

      } catch (webhookError) {
        console.error(`Error processing webhook ${webhook.name}:`, webhookError)
        results.push({ 
          webhook_id: webhook.id, 
          webhook_name: webhook.name, 
          error: webhookError.message 
        })
      }
    }

    console.log('All webhooks processed. Results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhooks processed successfully',
        processed_webhooks: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message || 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
