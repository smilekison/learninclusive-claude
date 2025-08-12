import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, XCircle, BookOpen } from 'lucide-react';

interface SubjectEnrollmentStatusProps {
  subjectId: string;
}

interface EnrollmentData {
  status: 'enrolled' | 'pending' | 'rejected' | 'none';
  enrollmentDate?: string;
  requestDate?: string;
  feedback?: string;
}

export const SubjectEnrollmentStatus: React.FC<SubjectEnrollmentStatusProps> = ({ 
  subjectId 
}) => {
  const { user } = useAuth();
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>({ status: 'none' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!user || !subjectId) return;

      try {
        setIsLoading(true);

        // First check if student is enrolled in the class that contains this subject
        const { data: subject } = await supabase
          .from('subjects')
          .select('class_id')
          .eq('id', subjectId)
          .single();

        if (!subject) {
          setEnrollmentData({ status: 'none' });
          return;
        }

        // Check class enrollment
        const { data: classEnrollment } = await supabase
          .from('student_enrollments')
          .select('*')
          .eq('student_id', user.id)
          .eq('class_id', subject.class_id)
          .eq('status', 'approved')
          .maybeSingle();

        if (classEnrollment) {
          setEnrollmentData({
            status: 'enrolled',
            enrollmentDate: classEnrollment.enrolled_at
          });
          return;
        }

        // Check pending enrollment requests
        const { data: enrollmentRequest } = await supabase
          .from('subject_enrollment_requests')
          .select('*')
          .eq('student_id', user.id)
          .eq('subject_id', subjectId)
          .order('requested_at', { ascending: false })
          .maybeSingle();

        if (enrollmentRequest) {
          setEnrollmentData({
            status: enrollmentRequest.status as 'pending' | 'rejected',
            requestDate: enrollmentRequest.requested_at,
            feedback: enrollmentRequest.teacher_feedback
          });
        } else {
          setEnrollmentData({ status: 'none' });
        }
      } catch (error) {
        console.error('Error checking enrollment status:', error);
        setEnrollmentData({ status: 'none' });
      } finally {
        setIsLoading(false);
      }
    };

    checkEnrollmentStatus();
  }, [user, subjectId]);

  const getStatusContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span>Checking status...</span>
        </div>
      );
    }

    switch (enrollmentData.status) {
      case 'enrolled':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default" className="bg-green-500">
                Enrolled
              </Badge>
            </div>
            {enrollmentData.enrollmentDate && (
              <p className="text-xs text-muted-foreground">
                Enrolled: {new Date(enrollmentData.enrollmentDate).toLocaleDateString()}
              </p>
            )}
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline">
                Request Pending
              </Badge>
            </div>
            {enrollmentData.requestDate && (
              <p className="text-xs text-muted-foreground">
                Requested: {new Date(enrollmentData.requestDate).toLocaleDateString()}
              </p>
            )}
          </div>
        );

      case 'rejected':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive">
                Request Rejected
              </Badge>
            </div>
            {enrollmentData.requestDate && (
              <p className="text-xs text-muted-foreground">
                Requested: {new Date(enrollmentData.requestDate).toLocaleDateString()}
              </p>
            )}
            {enrollmentData.feedback && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p className="font-medium">Teacher Feedback:</p>
                <p className="text-muted-foreground">{enrollmentData.feedback}</p>
              </div>
            )}
          </div>
        );

      case 'none':
      default:
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Not enrolled</span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Subject Enrollment Status</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {getStatusContent()}
      </CardContent>
    </Card>
  );
};