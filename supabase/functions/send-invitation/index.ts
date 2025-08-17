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
  inviteType?: 'teacher' | 'student' | 'subject_enrollment';
  role?: string;
  schoolName?: string;
  subjectId?: string;
  enrollmentLink?: string;
  firstName?: string;
  lastName?: string;
  parentEmail?: string;
  classId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteType, role, schoolName, subjectId, enrollmentLink, firstName, lastName, parentEmail, classId }: InvitationRequest = await req.json();
    
    console.log('Sending invitation:', { email, inviteType, role, schoolName, subjectId, firstName, lastName, parentEmail, classId });

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let emailResponse;

    if (inviteType === 'subject_enrollment') {
      // Get subject details
      const { data: subject } = await supabase
        .from('subjects')
        .select(`
          name,
          description,
          class:classes(name, teacher:profiles!teacher_id(first_name, last_name))
        `)
        .eq('id', subjectId)
        .single();

      emailResponse = await resend.emails.send({
        from: "LMS System <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to join ${subject?.name || 'a subject'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You're Invited to Join a Subject!</h1>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>${subject?.name || 'Subject'}</h2>
              ${subject?.description ? `<p><strong>Description:</strong> ${subject.description}</p>` : ''}
              <p><strong>Class:</strong> ${subject?.class?.name || 'Class'}</p>
              <p><strong>Teacher:</strong> ${subject?.class?.teacher?.first_name} ${subject?.class?.teacher?.last_name}</p>
            </div>
            <p>Click the link below to enroll in this subject:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${enrollmentLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Enroll Now
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you already have an account, simply click the link above. If you're new, you'll be able to create an account during the enrollment process.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact your teacher or administrator.
            </p>
          </div>
        `,
      });
    } else {
      // Existing invitation logic for teachers/students
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Get inviter profile
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized: missing Authorization header' }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Extract JWT token from Authorization header
      const jwtToken = authHeader.replace('Bearer ', '');
      
      // Validate JWT using service role client
      const { data: userRes, error: userErr } = await supabase.auth.getUser(jwtToken);
      if (userErr || !userRes?.user) {
        console.error('User token verification error:', userErr);
        return new Response(JSON.stringify({ error: `Invalid user token: ${userErr?.message || 'Unknown error'}` }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const authUser = userRes.user;

      // Fetch inviter profile using service role
      const { data: inviterProfile, error: inviterErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('user_id', authUser.id)
        .single();

      if (inviterErr || !inviterProfile) {
        console.error('Inviter profile error:', inviterErr);
        throw new Error('Inviter profile not found');
      }

      // Store invitation in database using service role
      const { error: inviteError } = await supabase
        .from('email_invitations')
        .insert({
          email,
          token,
          role: (role || 'student'),
          expires_at: expiresAt.toISOString(),
          invited_by: inviterProfile.id,
          additional_data: {
            school_name: schoolName,
            firstName,
            lastName,
            parentEmail,
            classId,
          },
        });

      if (inviteError) throw inviteError;

      const inviteUrl = `${req.headers.get('origin') || 'http://localhost:8080'}/auth?invite=${token}`;

      emailResponse = await resend.emails.send({
        from: "LMS System <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to join as a ${role}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You're Invited!</h1>
            <p>Hello! You've been invited by ${inviterProfile.first_name} ${inviterProfile.last_name} to join ${schoolName || 'our learning management system'} as a ${role}.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This invitation will expire in 7 days. If you have any questions, please contact your administrator.
            </p>
            <p style="color: #666; font-size: 14px;">
              Invitation link: <a href="${inviteUrl}">${inviteUrl}</a>
            </p>
          </div>
        `,
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
