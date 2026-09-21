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
      // This branch had no auth check at all — anyone could make it send
      // an email to an arbitrary address (spam relay / mail-bombing), and
      // there was no verification that the caller has any right to invite
      // people into the given subject.
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userRes?.user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get subject details, plus enough of the class to check the caller's
      // right to invite (its teacher_id and school_id).
      const { data: subject } = await supabase
        .from('subjects')
        .select(`
          name,
          description,
          class:classes(name, teacher_id, school_id, teacher:profiles!teacher_id(first_name, last_name))
        `)
        .eq('id', subjectId)
        .single();

      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', userRes.user.id)
        .single();

      const isOwningTeacher = callerProfile?.role === 'teacher' && callerProfile.id === subject?.class?.teacher_id;
      const isPrincipal = callerProfile?.role === 'principal';
      if (!isOwningTeacher && !isPrincipal) {
        return new Response(JSON.stringify({ error: 'Forbidden: not authorized to invite to this subject' }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: rateOk } = await supabase.rpc('check_and_record_rate_limit', {
        p_event_type: 'subject_enrollment_invite',
        p_identifier: callerProfile.id,
        p_max_count: 30,
        p_window_seconds: 3600,
      });
      if (!rateOk) {
        return new Response(JSON.stringify({ error: 'Too many invitations sent. Please try again later.' }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

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

      // Get Authorization header and validate format
      console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Invalid authorization header format');
        return new Response(JSON.stringify({ error: 'Invalid authorization header format' }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Extract JWT token from Authorization header
      const jwtToken = authHeader.replace('Bearer ', '');
      console.log('JWT token length:', jwtToken.length);
      console.log('JWT token preview:', jwtToken.substring(0, 50) + '...');
      
      // Validate JWT using service role client
      const { data: userRes, error: userErr } = await supabase.auth.getUser(jwtToken);
      console.log('Auth validation result:', { user: userRes?.user?.id, error: userErr });
      
      if (userErr || !userRes?.user) {
        console.error('User token verification failed:', userErr);
        return new Response(JSON.stringify({ 
          error: `Authentication failed: ${userErr?.message || 'Invalid token'}`,
          details: userErr 
        }), {
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

      const appUrl = Deno.env.get('APP_URL') || 'https://learn.smilekisan.com';
      const inviteUrl = `${appUrl.replace(/\/$/, '')}/auth?invite=${token}`;

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
