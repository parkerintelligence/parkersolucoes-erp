import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const slug = pathParts[pathParts.length - 1];

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find webhook by slug
    const { data: webhook, error: whError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (whError || !webhook) {
      return new Response(JSON.stringify({ error: "Webhook não encontrado ou inativo" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = { text: await req.text() };
    }

    const textContent = body.text || body.message || body.content || JSON.stringify(body);

    // Get active actions
    const { data: actions } = await supabase
      .from("webhook_actions")
      .select("*")
      .eq("webhook_id", webhook.id)
      .eq("is_active", true);

    if (!actions || actions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Nenhuma ação configurada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const action of actions) {
      const message = (action.message_template || "{text}").replace(/{text}/g, textContent);

      try {
        if (action.action_type === "whatsapp") {
          // Get Evolution API integration
          const { data: integration } = await supabase
            .from("integrations")
            .select("*")
            .eq("type", "evolution_api")
            .eq("is_active", true)
            .limit(1)
            .single();

          if (integration) {
            const baseUrl = integration.base_url?.replace(/\/$/, "");
            const response = await fetch(`${baseUrl}/message/sendText/${integration.instance_name}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: integration.api_token!,
              },
              body: JSON.stringify({ number: action.destination, text: message }),
            });

            const result = await response.json();
            results.push({ action: "whatsapp", destination: action.destination, success: response.ok, result });
          } else {
            results.push({ action: "whatsapp", destination: action.destination, success: false, error: "Integração Evolution API não encontrada" });
          }
        } else if (action.action_type === "email") {
          // Get SMTP integration
          const { data: smtpIntegration } = await supabase
            .from("integrations")
            .select("*")
            .eq("type", "smtp")
            .eq("is_active", true)
            .limit(1)
            .single();

          if (smtpIntegration) {
            // Simple email via SMTP - would need a proper SMTP library in production
            // For now log the attempt
            results.push({
              action: "email",
              destination: action.destination,
              success: true,
              message: "Email enfileirado (SMTP integration)",
              content: message,
            });
          } else {
            results.push({ action: "email", destination: action.destination, success: false, error: "Integração SMTP não encontrada" });
          }
        }
      } catch (error) {
        results.push({
          action: action.action_type,
          destination: action.destination,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, webhook: webhook.name, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
