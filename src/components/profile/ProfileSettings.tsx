import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  parentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  schoolName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      parentEmail: (user as any)?.parentEmail || '',
      schoolName: (user as any)?.schoolName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const updateData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
      };

      // Add role-specific fields
      if (user.role === 'student' && data.parentEmail) {
        updateData.parent_email = data.parentEmail;
      }
      if (user.role === 'principal' && data.schoolName) {
        updateData.school_name = data.schoolName;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'principal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'teacher': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Profile Settings
          <Badge className={getRoleBadgeColor(user.role)}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
                className="w-full"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
                className="w-full"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="w-full bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact administrator if you need to update your email.
            </p>
          </div>

          {user.role === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
              <Input
                id="parentEmail"
                type="email"
                {...form.register('parentEmail')}
                className="w-full"
                placeholder="parent@example.com"
              />
              {form.formState.errors.parentEmail && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.parentEmail.message}
                </p>
              )}
            </div>
          )}

          {user.role === 'principal' && (
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                {...form.register('schoolName')}
                className="w-full"
                placeholder="Enter school name"
              />
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Account Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Member since:</span>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last updated:</span>
                <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="min-w-24"
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};