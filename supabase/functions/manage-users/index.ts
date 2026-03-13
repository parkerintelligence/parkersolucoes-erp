import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse body first to check for bootstrap action
    const body = await req.json();
    const { action, ...params } = body;

    // Bootstrap action - no auth required, uses service role secret
    if (action === "bootstrap") {
      const { email, password, role = "master", bootstrapKey } = params;
      
      // Security: only allow bootstrap if bootstrapKey matches or no master users exist
      const { data: masterUsers } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("role", "master");
      
      const hasMasters = masterUsers && masterUsers.length > 0;
      
      // If masters exist, bootstrap is not allowed (use the UI instead)
      if (hasMasters) {
        return new Response(JSON.stringify({ error: "Bootstrap não permitido - masters já existem. Use o painel admin." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

      if (existingUser) {
        // Reset password
        await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true });
        await supabase.from("user_profiles").upsert({ id: existingUser.id, email, role }, { onConflict: "id" });
        await supabase.from("user_roles").delete().eq("user_id", existingUser.id);
        await supabase.from("user_roles").insert({ user_id: existingUser.id, role: role as any });
        return new Response(JSON.stringify({ success: true, action: "reset", userId: existingUser.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { role },
        });
        if (createError) throw createError;
        await supabase.from("user_profiles").upsert({ id: newUser.user.id, email, role }, { onConflict: "id" });
        await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: role as any });
        return new Response(JSON.stringify({ success: true, action: "created", userId: newUser.user.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // All other actions require master auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "master") {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas master pode gerenciar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "list": {
        const { data: profiles, error } = await supabase
          .from("user_profiles")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify({ users: profiles }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { email, password, role = "user" } = params;
        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create user in auth (auto-confirmed, no email sent)
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role },
        });

        if (createError) throw createError;

        // Ensure user_profiles entry exists (trigger should create it, but just in case)
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: newUser.user.id,
            email,
            role,
          }, { onConflict: "id" });

        if (profileError) console.error("Profile upsert error:", profileError);

        // Add to user_roles table
        const appRole = role === "master" ? "master" : role === "admin" ? "admin" : "user";
        await supabase.from("user_roles").upsert({
          user_id: newUser.user.id,
          role: appRole,
        }, { onConflict: "user_id,role" });

        return new Response(JSON.stringify({ success: true, user: { id: newUser.user.id, email, role } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { userId, email, password, role } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, updateData);
          if (updateError) throw updateError;
        }

        if (role) {
          await supabase.from("user_profiles").update({ role }).eq("id", userId);
          
          // Update user_roles
          await supabase.from("user_roles").delete().eq("user_id", userId);
          const appRole = role === "master" ? "master" : role === "admin" ? "admin" : "user";
          await supabase.from("user_roles").upsert({
            user_id: userId,
            role: appRole,
          }, { onConflict: "user_id,role" });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { userId } = params;
        if (!userId) {
          return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Don't allow deleting yourself
        if (userId === caller.id) {
          return new Response(JSON.stringify({ error: "Você não pode deletar seu próprio usuário" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset-password": {
        const { userId, newPassword } = params;
        if (!userId || !newPassword) {
          return new Response(JSON.stringify({ error: "userId e newPassword são obrigatórios" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
          password: newPassword,
        });
        if (resetError) throw resetError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Ação desconhecida: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
