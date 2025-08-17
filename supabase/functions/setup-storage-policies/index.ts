import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create RLS policies for assignment submissions storage
    const policies = [
      {
        name: "Students can upload assignment files",
        table: "objects",
        operation: "INSERT",
        definition: `bucket_id = 'assignment-submissions' AND (storage.foldername(name))[1] IN (
          SELECT p.id::text 
          FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'student'
        )`
      },
      {
        name: "Students can view their own uploaded files",
        table: "objects", 
        operation: "SELECT",
        definition: `bucket_id = 'assignment-submissions' AND (storage.foldername(name))[1] IN (
          SELECT p.id::text 
          FROM profiles p 
          WHERE p.user_id = auth.uid() AND p.role = 'student'
        )`
      },
      {
        name: "Teachers can view assignment files from their students",
        table: "objects",
        operation: "SELECT", 
        definition: `bucket_id = 'assignment-submissions' AND (
          (storage.foldername(name))[1] IN (
            SELECT se.student_id::text
            FROM student_enrollments se
            JOIN classes c ON se.class_id = c.id
            JOIN profiles p ON c.teacher_id = p.id
            WHERE p.user_id = auth.uid() AND p.role = 'teacher'
          )
          OR
          EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.user_id = auth.uid() AND p.role = 'principal'
          )
        )`
      }
    ];

    const results = [];
    
    for (const policy of policies) {
      try {
        // Note: In a real implementation, you would use Supabase CLI or dashboard
        // This is just for documentation purposes
        console.log(`Policy would be created: ${policy.name}`);
        results.push({
          policy: policy.name,
          status: "documented",
          message: "Policy definition prepared for manual setup"
        });
      } catch (error) {
        results.push({
          policy: policy.name,
          status: "error",
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Storage policies documented. Please configure in Supabase dashboard.",
        policies: results,
        instructions: [
          "1. Go to Supabase Dashboard > Storage > Settings",
          "2. Navigate to the 'assignment-submissions' bucket", 
          "3. Add the documented RLS policies manually",
          "4. Test file upload and access permissions"
        ]
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
    console.error("Error in setup-storage-policies function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to set up storage policies"
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