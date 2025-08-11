import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InvitationFormProps {
  token: string;
  onSuccess: () => void;
}

interface InvitationData {
  email: string;
  role: string;
  invited_by: string;
  additional_data: {
    firstName?: string;
    lastName?: string;
    classId?: string;
    parentEmail?: string;
  };
}

export const InvitationForm: React.FC<InvitationFormProps> = ({ token, onSuccess }) => {
  const { register } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('email_invitations')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setError('Invalid or expired invitation link');
        return;
      }

      setInvitation(data as InvitationData);
    } catch (err) {
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!invitation) return;

    setSubmitting(true);

    try {
      // Register the user with invitation data
      await register({
        email: invitation.email,
        password: formData.password,
        firstName: invitation.additional_data.firstName || '',
        lastName: invitation.additional_data.lastName || '',
        role: invitation.role as any,
      });

      // Mark invitation as used
      await supabase
        .from('email_invitations')
        .update({ used: true })
        .eq('token', token);

      // If it's a student with a parent email, send parent invitation
      if (invitation.role === 'student' && invitation.additional_data.parentEmail) {
        await supabase.functions.invoke('send-invitation', {
          body: {
            email: invitation.additional_data.parentEmail,
            role: 'parent',
            invitedBy: invitation.invited_by,
            additionalData: {
              studentEmail: invitation.email,
              childName: `${invitation.additional_data.firstName} ${invitation.additional_data.lastName}`
            }
          }
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md card-elevated">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading invitation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !invitation) {
    return (
      <Card className="w-full max-w-md card-elevated">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-destructive">
            Invalid Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md card-elevated" role="main">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-primary">
          Complete Your Registration
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          You've been invited to join as a {invitation?.role}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Email:</strong> {invitation?.email}
          </p>
          <p className="text-sm">
            <strong>Role:</strong> {invitation?.role?.charAt(0).toUpperCase()}{invitation?.role?.slice(1)}
          </p>
          {invitation?.additional_data.firstName && (
            <p className="text-sm">
              <strong>Name:</strong> {invitation.additional_data.firstName} {invitation.additional_data.lastName}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Create Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a secure password"
                className="pr-10"
                required
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="pr-10"
                required
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>By completing registration, you agree to our terms of service and privacy policy.</p>
        </div>
      </CardContent>
    </Card>
  );
};