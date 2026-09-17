import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // This resets every user's password in the system — restrict to
    // authenticated principals only. It was previously callable by anyone,
    // including unauthenticated visitors on the login page.
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .single();
    if (!callerProfile || callerProfile.role !== "principal") {
      return new Response(JSON.stringify({ error: "Forbidden: Only principals can reset demo passwords" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    let resetCount = 0;
    const results = [];

    // Reset password for each user
    for (const user of users.users) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { 
            password: "demo123",
            email_confirm: true
          }
        );

        if (error) {
          console.error(`Failed to reset password for user ${user.email}:`, error);
          results.push({
            email: user.email,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Successfully reset password for user: ${user.email}`);
          resetCount++;
          results.push({
            email: user.email,
            success: true
          });
        }
      } catch (userError) {
        console.error(`Exception resetting password for user ${user.email}:`, userError);
        results.push({
          email: user.email,
          success: false,
          error: userError.message
        });
      }
    }

    console.log(`Password reset completed. ${resetCount} out of ${users.users.length} users updated.`);

    return new Response(
      JSON.stringify({
        message: `Successfully reset passwords for ${resetCount} users`,
        totalUsers: users.users.length,
        successCount: resetCount,
        results: results
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in reset-demo-passwords function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to reset demo passwords"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);