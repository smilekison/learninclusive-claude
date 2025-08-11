import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { BookOpen, UserCheck, UserX, MessageSquare } from 'lucide-react';

interface SubjectEnrollmentRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  subjects: {
    id: string;
    name: string;
    classes: {
      name: string;
    };
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    user_id: string;
  };
}

export const SubjectEnrollmentRequestsManager: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubjectEnrollmentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SubjectEnrollmentRequest | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollmentRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('subject-enrollment-requests-teacher')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subject_enrollment_requests'
        },
        () => {
          fetchEnrollmentRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchEnrollmentRequests = async () => {
    if (!user?.id) return;

    try {
      // First get the teacher's profile ID
      const { data: teacherProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'teacher')
        .single();

      if (profileError || !teacherProfile) {
        console.error('Teacher profile not found:', profileError);
        return;
      }

      // Use proper join syntax for the query
      const { data, error } = await supabase
        .from('subject_enrollment_requests')
        .select(`
          id,
          status,
          requested_at,
          subject_id,
          student_id,
          teacher_feedback,
          processed_at,
          processed_by,
          subjects (
            id,
            name,
            classes (
              name,
              teacher_id
            )
          ),
          profiles (
            id,
            first_name,
            last_name,
            user_id
          )
        `)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching enrollment requests:', error);
        return;
      }

      // Filter by teacher's profile ID and transform data
      const teacherRequests = data?.filter((request: any) => 
        request.subjects?.classes?.teacher_id === teacherProfile.id
      ).map((request: any) => ({
        id: request.id,
        status: request.status as 'pending' | 'approved' | 'denied',
        requested_at: request.requested_at,
        subjects: {
          id: request.subjects.id,
          name: request.subjects.name,
          classes: {
            name: request.subjects.classes.name
          }
        },
        profiles: {
          id: request.profiles.id,
          first_name: request.profiles.first_name,
          last_name: request.profiles.last_name,
          user_id: request.profiles.user_id
        }
      })) || [];

      setRequests(teacherRequests);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRequestMutation = useSupabaseMutation(
    async (data: { requestId: string; action: 'approve' | 'deny'; feedback?: string }) => {
      const request = requests.find(r => r.id === data.requestId);
      if (!request) throw new Error('Request not found');

      // Update the request status
      const { error: updateError } = await supabase
        .from('subject_enrollment_requests')
        .update({
          status: data.action === 'approve' ? 'approved' : 'denied',
          teacher_feedback: data.feedback || null,
          processed_at: new Date().toISOString(),
        processed_by: user?.id
      })
      .eq('id', data.requestId);

    if (updateError) throw updateError;

      // If approved, create the enrollment
      if (data.action === 'approve') {
        const { error: enrollmentError } = await supabase
          .from('student_subject_enrollments')
          .insert({
            student_id: request.profiles.id,
            subject_id: request.subjects.id
          });

        if (enrollmentError) throw enrollmentError;
      }

      // Create notification for student
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: request.profiles.user_id,
          title: `Subject Enrollment ${data.action === 'approve' ? 'Approved' : 'Denied'}`,
          message: `Your request to join "${request.subjects.name}" has been ${data.action === 'approve' ? 'approved' : 'denied'}${data.feedback ? '. Teacher feedback: ' + data.feedback : '.'}`,
          type: 'enrollment_response'
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      return { data: { success: true }, error: null };
    },
    {
      successMessage: `Request processed successfully!`,
      invalidateKeys: [['subject-enrollment-requests']]
    }
  );

  const handleApprove = (request: SubjectEnrollmentRequest) => {
    processRequestMutation.mutate({
      requestId: request.id,
      action: 'approve'
    });
  };

  const handleDeny = (request: SubjectEnrollmentRequest) => {
    setSelectedRequest(request);
    setFeedback('');
    setIsDenyDialogOpen(true);
  };

  const handleDenyWithFeedback = () => {
    if (!selectedRequest) return;

    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      action: 'deny',
      feedback: feedback.trim() || undefined
    });

    setIsDenyDialogOpen(false);
    setSelectedRequest(null);
    setFeedback('');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Enrollment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Enrollment Requests
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending enrollment requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium">
                          {request.profiles.first_name} {request.profiles.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          wants to join: {request.subjects.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Class: {request.subjects.classes.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={processRequestMutation.isPending}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeny(request)}
                        disabled={processRequestMutation.isPending}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deny with Feedback Dialog */}
      <Dialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Enrollment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to deny this enrollment request? You can optionally provide feedback to the student.
            </p>
            <div>
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDenyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDenyWithFeedback}
                disabled={processRequestMutation.isPending}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Deny Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};