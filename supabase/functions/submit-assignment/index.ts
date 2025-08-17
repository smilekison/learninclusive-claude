import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitAssignmentRequest {
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  filePath?: string;
  files?: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
  links?: string[];
  codeContent?: string;
  codeLanguage?: string;
  notes?: string;
  timeSpent?: number;
  wordCount?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const submissionData: SubmitAssignmentRequest = await req.json();
    console.log('Submitting assignment with data:', submissionData);

    // Get assignment details to check max attempts
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', submissionData.assignmentId)
      .single();

    if (assignmentError || !assignment) {
      console.error('Error fetching assignment:', assignmentError);
      throw new Error('Assignment not found');
    }

    // Check existing submissions for this student and assignment
    const { data: existingSubmissions, error: existingError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', submissionData.assignmentId)
      .eq('student_id', submissionData.studentId)
      .order('attempt_number', { ascending: false });

    if (existingError) {
      console.error('Error fetching existing submissions:', existingError);
      throw new Error('Failed to check existing submissions');
    }

    const maxAttempts = assignment.max_attempts || 3;
    const currentAttempts = existingSubmissions?.length || 0;

    if (currentAttempts >= maxAttempts) {
      throw new Error(`Maximum attempts (${maxAttempts}) exceeded for this assignment`);
    }

    // Check if there's an existing ungraded submission
    const existingUngraded = existingSubmissions?.find(sub => sub.score === null);

    let submissionResult;

    // Prepare file paths JSON for storage
    const filePathsJson = submissionData.files && submissionData.files.length > 0 
      ? JSON.stringify(submissionData.files) 
      : null;

    // Prepare additional submission data
    const submissionMetadata = {
      links: submissionData.links || [],
      codeContent: submissionData.codeContent || '',
      codeLanguage: submissionData.codeLanguage || '',
      notes: submissionData.notes || '',
      timeSpent: submissionData.timeSpent || 0,
      wordCount: submissionData.wordCount || 0
    };

    if (existingUngraded) {
      // Update existing ungraded submission
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          submission_text: submissionData.submissionText,
          file_path: filePathsJson,
          submitted_at: new Date().toISOString(),
          late_submission: assignment.due_date ? new Date() > new Date(assignment.due_date) : false,
          time_spent_minutes: Math.round((submissionData.timeSpent || 0) / 60),
          grading_notes: JSON.stringify(submissionMetadata)
        })
        .eq('id', existingUngraded.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        throw new Error('Failed to update submission');
      }

      submissionResult = data;
      console.log('Updated existing submission:', existingUngraded.id);
    } else {
      // Create new submission
      const nextAttemptNumber = currentAttempts + 1;
      
      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: submissionData.assignmentId,
          student_id: submissionData.studentId,
          submission_text: submissionData.submissionText,
          file_path: filePathsJson,
          submitted_at: new Date().toISOString(),
          attempt_number: nextAttemptNumber,
          late_submission: assignment.due_date ? new Date() > new Date(assignment.due_date) : false,
          time_spent_minutes: Math.round((submissionData.timeSpent || 0) / 60),
          grading_notes: JSON.stringify(submissionMetadata)
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating submission:', error);
        throw new Error('Failed to create submission');
      }

      submissionResult = data;
      console.log('Created new submission with attempt number:', nextAttemptNumber);
    }

    // Get teacher info for notification
    const { data: teacher, error: teacherError } = await supabase
      .from('assignments')
      .select(`
        subject:subjects (
          class:classes (
            teacher:profiles!classes_teacher_id_fkey (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('id', submissionData.assignmentId)
      .single();

    // Create notification for teacher
    if (teacher?.subject?.class?.teacher) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: teacher.subject.class.teacher.id,
          title: `New Assignment Submission`,
          message: `A student has submitted "${assignment.title}". Review and grade when ready.`,
          type: 'submission'
        });

      if (notificationError) {
        console.error('Error creating teacher notification:', notificationError);
      }
    }

    console.log('Assignment submitted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingUngraded ? 'Assignment updated successfully' : 'Assignment submitted successfully',
        submissionId: submissionResult.id,
        attemptNumber: submissionResult.attempt_number,
        remainingAttempts: maxAttempts - submissionResult.attempt_number
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in submit-assignment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to submit assignment',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});