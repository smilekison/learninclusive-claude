import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, User, Mail, Lock } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  class: {
    id: string;
    name: string;
    teacher: {
      first_name: string;
      last_name: string;
    };
  };
}

export const EnrollSubjectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const { toast } = useToast();
  
  const subjectId = searchParams.get('subject');
  const emailParam = searchParams.get('email');
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: emailParam || '',
    password: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId]);

  useEffect(() => {
    // If user is already logged in, try to enroll them
    if (user && subject) {
      handleEnrollment();
    }
  }, [user, subject]);

  const fetchSubject = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          description,
          class:classes(
            id,
            name,
            teacher:profiles!teacher_id(first_name, last_name)
          )
        `)
        .eq('id', subjectId)
        .single();

      if (error) throw error;
      setSubject(data);
    } catch (error: any) {
      console.error('Error fetching subject:', error);
      toast({
        title: 'Error',
        description: 'Subject not found or invalid link',
        variant: 'destructive',
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: 'student'
        });
        
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account, then sign in.',
        });
        setIsSignUp(false);
      } else {
        await login(formData.email, formData.password);
        // Enrollment will happen automatically via useEffect when user state changes
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!user || !subject) return;

    try {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.authUserId)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', profile.id)
        .eq('class_id', subject.class.id)
        .eq('status', 'active')
        .single();

      if (existingEnrollment) {
        toast({
          title: 'Already Enrolled',
          description: 'You are already enrolled in this subject',
        });
        navigate('/dashboard');
        return;
      }

      // Enroll student
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: profile.id,
          class_id: subject.class.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Successfully Enrolled',
        description: `You have been enrolled in ${subject.name}`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error enrolling:', error);
      toast({
        title: 'Enrollment Error',
        description: error.message || 'Failed to enroll in subject',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subjectId || !subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground mb-4">
              The enrollment link is invalid or expired.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Enrolling...</h2>
            <p className="text-muted-foreground">
              Please wait while we enroll you in the subject.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Enroll in Subject</CardTitle>
          <div className="text-left bg-muted p-4 rounded-lg mt-4">
            <h3 className="font-semibold">{subject.name}</h3>
            {subject.description && (
              <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Class: {subject.class.name} • Teacher: {subject.class.teacher.first_name} {subject.class.teacher.last_name}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account & Enroll' : 'Sign In & Enroll')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};