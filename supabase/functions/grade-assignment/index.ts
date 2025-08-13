import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GradeAssignmentRequest {
  submissionId: string;
  score: number;
  feedback: string;
  gradingNotes?: string;
  submissionQuality?: string;
  timeSpentMinutes?: number;
  rubricScores?: Array<{
    criteriaId: string;
    score: number;
    criteria: string;
  }>;
  gradedBy: string;
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

    const gradeData: GradeAssignmentRequest = await req.json();
    console.log('Grading assignment with data:', gradeData);

    // Get submission details for notification
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        student_id,
        assignment:assignments (
          id,
          title,
          subject:subjects (
            name,
            class:classes (
              name
            )
          )
        ),
        student:profiles!assignment_submissions_student_id_fkey (
          id,
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', gradeData.submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('Error fetching submission:', submissionError);
      throw new Error('Submission not found');
    }

    // Update the assignment submission with grade
    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        score: gradeData.score,
        feedback: gradeData.feedback,
        grading_notes: gradeData.gradingNotes,
        submission_quality: gradeData.submissionQuality,
        time_spent_minutes: gradeData.timeSpentMinutes,
        rubric_scores: gradeData.rubricScores || [],
        graded_at: new Date().toISOString(),
        graded_by: gradeData.gradedBy
      })
      .eq('id', gradeData.submissionId);

    if (updateError) {
      console.error('Error updating submission:', updateError);
      throw new Error('Failed to update grade');
    }

    // Create notification for the student
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: submission.student.id,
        title: `Assignment Graded: ${submission.assignment.title}`,
        message: `Your assignment "${submission.assignment.title}" has been graded. Score: ${gradeData.score}/${submission.assignment.max_score || 100}. ${gradeData.feedback ? `Feedback: ${gradeData.feedback}` : ''}`,
        type: 'grade'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw here as the grade was successfully saved
    }

    console.log('Assignment graded successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Assignment graded successfully',
        submissionId: gradeData.submissionId,
        score: gradeData.score
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in grade-assignment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to grade assignment',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});