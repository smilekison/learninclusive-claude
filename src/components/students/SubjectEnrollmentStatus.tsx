import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, XCircle, BookOpen } from 'lucide-react';

interface SubjectEnrollmentRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  teacher_feedback?: string;
  requested_at: string;
  processed_at?: string;
  subjects: {
    name: string;
    classes: {
      name: string;
      teacher: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

export const SubjectEnrollmentStatus: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubjectEnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollmentRequests = async () => {
      if (!user?.id) return;

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profileData) return;

        const { data, error } = await supabase
          .from('subject_enrollment_requests')
          .select(`
            id,
            status,
            teacher_feedback,
            requested_at,
            processed_at,
            subjects:subject_id (
              name,
              classes:class_id (
                name,
                teacher:teacher_id (
                  first_name,
                  last_name
                )
              )
            )
          `)
          .eq('student_id', profileData.id)
          .order('requested_at', { ascending: false });

        if (error) {
          console.error('Error fetching enrollment requests:', error);
          return;
        }

        setRequests((data as any) || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('subject-enrollment-requests-changes')
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'denied':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="w-5 h-5" />
            Subject Enrollment Status
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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <BookOpen className="w-5 h-5" />
          Subject Enrollment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No subject enrollment requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{request.subjects.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Class: {request.subjects.classes.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Teacher: {request.subjects.classes.teacher.first_name} {request.subjects.classes.teacher.last_name}
                    </p>
                  </div>
                  <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Requested: {new Date(request.requested_at).toLocaleDateString()}</p>
                  {request.processed_at && (
                    <p>Processed: {new Date(request.processed_at).toLocaleDateString()}</p>
                  )}
                  {request.teacher_feedback && (
                    <div className="mt-2 p-2 bg-muted rounded">
                      <p className="font-medium">Teacher feedback:</p>
                      <p>{request.teacher_feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};