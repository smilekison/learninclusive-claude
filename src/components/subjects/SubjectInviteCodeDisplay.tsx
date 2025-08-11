import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';

interface SubjectInviteCodeDisplayProps {
  subjectId: string;
  invitationCode?: string;
  onCodeUpdated?: (newCode: string) => void;
}

export const SubjectInviteCodeDisplay: React.FC<SubjectInviteCodeDisplayProps> = ({
  subjectId,
  invitationCode,
  onCodeUpdated
}) => {
  const { toast } = useToast();

  const regenerateCodeMutation = useSupabaseMutation(
    async () => {
      const { data, error } = await supabase.rpc('regen_subject_invitation_code', {
        subject_id: subjectId,
      });

      if (error) throw error;
      return { data, error: null };
    },
    {
      successMessage: "Invitation code regenerated successfully!",
      onSuccess: (result) => {
        const newCode = typeof result === 'string' ? result : (result as any)?.invitation_code;
        if (newCode) {
          onCodeUpdated?.(newCode);
        }
      }
    }
  );

  const copyToClipboard = async () => {
    if (!invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      toast({
        title: "Code Copied",
        description: "Invitation code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateCode = () => {
    if (confirm('Are you sure you want to regenerate the invitation code? Students using the old code will no longer be able to join.')) {
      regenerateCodeMutation.mutate({});
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Invitation Code:</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 p-2 bg-muted rounded font-mono text-center">
          {invitationCode || 'Not set'}
        </div>
        {invitationCode && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              title="Copy invitation code"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateCode}
              disabled={regenerateCodeMutation.isPending}
              title="Regenerate invitation code"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Share this code with students so they can request to join this subject
      </p>
    </div>
  );
};