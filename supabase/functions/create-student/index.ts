import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  gradeLevel?: string;
  enrollmentDate?: string;
  address?: Record<string, unknown>;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  emergencyContacts?: Array<{ name: string; relationship: string; phone: string; email: string }>;
  disabilities?: string[];
  disabilityDetails?: Record<string, unknown>;
  medicalInformation?: Record<string, unknown>;
  accommodationsNeeded?: string[];
  assistiveTechnology?: string[];
  supportServices?: string[];
  learningPreferences?: Record<string, unknown>;
  accessibilityPreferences?: Record<string, unknown>;
  communicationPreferences?: Record<string, unknown>;
  iepStatus?: boolean;
  iepDocumentPath?: string;
  notes?: string;
  tempPassword?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body: StudentFormData = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller (must be authenticated and a teacher/principal)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch caller profile
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userRes.user.id)
      .single();

    if (!callerProfile || !['teacher', 'principal'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const tempPassword = body.tempPassword || 'TempPassword123!';

    // Create auth user (service role bypasses admin restriction)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        role: 'student',
      },
    });

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const newUserId = created.user.id;

    // Update profile with extended fields (trigger likely created minimal row already)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        role: 'student',
        date_of_birth: body.dateOfBirth || null,
        gender: body.gender || null,
        phone_number: body.phoneNumber || null,
        grade_level: body.gradeLevel || null,
        enrollment_date: body.enrollmentDate || null,
        guardian_name: body.guardianName || null,
        guardian_email: body.guardianEmail || null,
        guardian_phone: body.guardianPhone || null,
        address: body.address || {},
        emergency_contacts: body.emergencyContacts || [],
        disabilities: body.disabilities || [],
        disability_details: body.disabilityDetails || {},
        medical_information: body.medicalInformation || {},
        accommodations_needed: body.accommodationsNeeded || [],
        assistive_technology: body.assistiveTechnology || [],
        support_services: body.supportServices || [],
        learning_preferences: body.learningPreferences || {},
        accessibility_preferences: body.accessibilityPreferences || {},
        communication_preferences: body.communicationPreferences || {},
        iep_status: body.iepStatus ?? false,
        iep_document_path: body.iepDocumentPath || null,
        notes: body.notes || null,
        is_active: true,
      })
      .eq('user_id', newUserId)
      .select()
      .single();

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ profile, login: { email: body.email, tempPassword } }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('create-student error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
