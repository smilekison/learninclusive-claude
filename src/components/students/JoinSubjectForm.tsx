import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { useStudentProfile } from '@/hooks/useStudentProfile';

interface JoinSubjectFormProps {
  onSuccess?: () => void;
}

export const JoinSubjectForm: React.FC<JoinSubjectFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const { data: studentProfile, isLoading: profileLoading, error: profileError } = useStudentProfile();

  // Add debug logging
  console.log('JoinSubjectForm - user:', user);
  console.log('JoinSubjectForm - studentProfile:', studentProfile);
  console.log('JoinSubjectForm - profileLoading:', profileLoading);

  const joinSubjectMutation = useSupabaseMutation(
    async (data: { code: string; studentId: string }) => {
      // Use secure RPC to validate code, create request, and notify teacher
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'request_subject_enrollment',
        { invitation_code: data.code }
      );

      if (rpcError) {
        throw new Error(rpcError.message || 'Failed to submit enrollment request');
      }

      return { data: rpcData, error: null };
    },
    {
      successMessage: "Subject enrollment request submitted successfully! Wait for teacher approval.",
      onSuccess: () => {
        setInviteCode('');
        onSuccess?.();
      }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user?.id) return;

    // Ensure only students can use this form
    if (user.role !== 'student') {
      toast({
        title: "Error",
        description: "Only students can join subjects using invitation codes.",
        variant: "destructive"
      });
      return;
    }

    // If profile is still loading, wait a bit and try to get it directly
    let currentStudentProfile = studentProfile;
    if (!currentStudentProfile) {
      console.log('Profile not loaded, fetching directly...');
      const { data: directProfile, error: directError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, is_active')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .eq('is_active', true)
        .maybeSingle();

      if (directError || !directProfile) {
        toast({
          title: "Error",
          description: "Student profile not found. Please refresh the page and try again.",
          variant: "destructive"
        });
        return;
      }
      currentStudentProfile = directProfile;
    }

    await joinSubjectMutation.mutateAsync({
      code: inviteCode.trim(),
      studentId: currentStudentProfile.id
    });
  };

  // Show error if profile loading failed
  if (profileError) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="w-5 h-5" />
            Join a Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive">Failed to load student profile. Please refresh the page or contact support.</p>
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
          Join a Subject
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite-code">Subject Invitation Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invitation code"
              className="font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get this code from your teacher to join their subject
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={joinSubjectMutation.isPending || !inviteCode.trim()}
            className="w-full"
          >
            {joinSubjectMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              'Send Join Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};