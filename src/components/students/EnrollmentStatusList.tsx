import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnrollmentRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  teacher_feedback?: string;
  requested_at: string;
  subjects: {
    name: string;
  };
}

export const EnrollmentStatusList: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollmentRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('subject-enrollment-requests-student')
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
      // Get student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get enrollment requests
      const { data, error } = await supabase
        .from('subject_enrollment_requests')
        .select(`
          id,
          status,
          teacher_feedback,
          requested_at,
          subjects (
            name
          )
        `)
        .eq('student_id', profile.id)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollment requests:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        status: item.status as 'pending' | 'approved' | 'denied',
        teacher_feedback: item.teacher_feedback,
        requested_at: item.requested_at,
        subjects: {
          name: item.subjects?.name || 'Unknown Subject'
        }
      })) || [];
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="text-green-600">Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">Loading...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No enrollment requests yet</p>
        <p className="text-sm text-muted-foreground">
          Join subjects using invitation codes from your teachers
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.href = '/join-subject'}
        >
          Join a Subject
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {getStatusIcon(request.status)}
            <div>
              <p className="font-medium">{request.subjects?.name || 'Unknown Subject'}</p>
              <p className="text-sm text-muted-foreground">
                Requested: {new Date(request.requested_at).toLocaleDateString()}
              </p>
              {request.teacher_feedback && request.status === 'denied' && (
                <p className="text-xs text-red-600 mt-1">
                  Feedback: {request.teacher_feedback}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
      ))}
    </div>
  );
};