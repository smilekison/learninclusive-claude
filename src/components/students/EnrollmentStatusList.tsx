import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';

interface EnrollmentRequest {
  id: string;
  subject_id: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  teacher_feedback?: string;
  subject: {
    name: string;
    description?: string;
  };
}

export const EnrollmentStatusList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEnrollmentRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subject_enrollment_requests')
        .select(`
          *,
          subject:subjects!subject_id(name, description)
        `)
        .eq('student_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error loading enrollment requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrollment requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollmentRequests();
  }, [user]);

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subject_enrollment_requests')
        .delete()
        .eq('id', requestId)
        .eq('student_id', user?.id); // Ensure only own requests can be deleted

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: 'Request Deleted',
        description: 'Enrollment request has been deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete request',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Enrollment Requests Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEnrollmentRequests}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading requests...</p>
              </div>
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{request.subject?.name}</p>
                      {request.subject?.description && (
                        <p className="text-sm text-muted-foreground">{request.subject.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p>Requested: {new Date(request.requested_at).toLocaleDateString()}</p>
                    {request.processed_at && (
                      <p>Processed: {new Date(request.processed_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  {request.teacher_feedback && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-foreground">Teacher Feedback:</p>
                      <p className="text-muted-foreground">{request.teacher_feedback}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No enrollment requests found</p>
                <p className="text-sm">Teachers will add you directly to subjects</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};