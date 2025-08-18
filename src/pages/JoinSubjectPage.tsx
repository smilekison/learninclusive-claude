import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, UserPlus, ArrowLeft } from 'lucide-react';

export const JoinSubjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found. Please ensure you are logged in.');
      }

      // Find subject by invitation code
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          description,
          class:classes!inner(
            id,
            name,
            teacher:profiles!teacher_id(
              first_name,
              last_name
            )
          )
        `)
        .eq('invitation_code', invitationCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (subjectError || !subject) {
        throw new Error('Invalid invitation code. Please check the code and try again.');
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id, status')
        .eq('student_id', profile.id)
        .eq('class_id', subject.class.id)
        .single();

      if (existingEnrollment) {
        if (existingEnrollment.status === 'active') {
          toast({
            title: 'Already Enrolled',
            description: `You are already enrolled in ${subject.name}`,
          });
          navigate('/student/subjects');
          return;
        } else if (existingEnrollment.status === 'pending') {
          toast({
            title: 'Request Pending',
            description: `Your enrollment request for ${subject.name} is pending teacher approval`,
          });
          navigate('/student/subjects');
          return;
        }
      }

      // Create enrollment request
      const { error: enrollmentError } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: profile.id,
          class_id: subject.class.id,
          status: 'pending'
        });

      if (enrollmentError) {
        throw enrollmentError;
      }

      toast({
        title: 'Request Submitted',
        description: `Your enrollment request for ${subject.name} has been submitted and is pending teacher approval.`,
      });

      navigate('/student/subjects');
    } catch (error: any) {
      console.error('Error joining subject:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join subject. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join a Subject</CardTitle>
            <CardDescription>
              Enter the invitation code provided by your teacher to join their subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinSubject} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invitationCode">Invitation Code</Label>
                <Input
                  id="invitationCode"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code (e.g., ABC12345)"
                  maxLength={8}
                  className="text-center text-lg font-mono tracking-wider"
                  autoComplete="off"
                />
                <p className="text-sm text-muted-foreground">
                  The invitation code is case-insensitive and contains 8 characters
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !invitationCode.trim()}
              >
                {loading ? (
                  <>Please wait...</>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Request to Join Subject
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">How to join a subject:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Get the invitation code from your teacher</li>
                <li>Enter the code in the field above</li>
                <li>Submit your enrollment request</li>
                <li>Wait for your teacher to approve your request</li>
                <li>Once approved, you'll have access to the subject</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};