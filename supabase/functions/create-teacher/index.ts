import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: Record<string, unknown>;
  emergencyContacts?: Array<{ name: string; relationship: string; phone: string; email: string }>;
  qualifications?: string;
  experience?: string;
  specializations?: string[];
  certifications?: string;
  subjects?: string[];
  accessibilityNeeds?: string[];
  communicationPreferences?: Record<string, unknown>;
  notes?: string;
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

    const body: TeacherFormData = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller (must be authenticated and a principal)
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

    if (!callerProfile || callerProfile.role !== 'principal') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only principals can create teachers' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create auth user (service role bypasses admin restriction)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        role: 'teacher',
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
        role: 'teacher',
        date_of_birth: body.dateOfBirth || null,
        gender: body.gender || null,
        phone_number: body.phoneNumber || null,
        address: body.address || {},
        emergency_contacts: body.emergencyContacts || [],
        communication_preferences: body.communicationPreferences || {},
        notes: body.notes || null,
        // Store teacher-specific data in JSON fields for now
        // In a real app, you might create dedicated tables for teacher qualifications, etc.
        medical_information: {
          qualifications: body.qualifications || '',
          experience: body.experience || '',
          specializations: body.specializations || [],
          certifications: body.certifications || '',
          subjects: body.subjects || [],
          accessibilityNeeds: body.accessibilityNeeds || []
        },
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
      JSON.stringify({ 
        profile, 
        login: { email: body.email, tempPassword: body.tempPassword },
        message: 'Teacher created successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('create-teacher error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});