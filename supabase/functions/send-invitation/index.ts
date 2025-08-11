import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: string;
  invitedBy: string;
  additionalData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, invitedBy, additionalData }: InvitationRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate invitation token
    const token = crypto.randomUUID();
    const inviteUrl = `${Deno.env.get('SITE_URL')}/auth?invite=${token}`;

    // Store invitation in database
    const { error: dbError } = await supabase
      .from('email_invitations')
      .insert({
        email,
        role,
        invited_by: invitedBy,
        token,
        additional_data: additionalData || {}
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "ILS Learning <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ILS Learning as a ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to ILS Learning!</h1>
          <p>You've been invited to join our Inclusive Learning System as a <strong>${role}</strong>.</p>
          
          <p>Click the button below to set up your account:</p>
          
          <a href="${inviteUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Set Up Your Account
          </a>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all;">
            ${inviteUrl}
          </p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, inviteUrl }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);