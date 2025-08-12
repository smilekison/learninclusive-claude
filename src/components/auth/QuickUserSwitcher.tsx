import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, GraduationCap, BookOpen, Users } from 'lucide-react';

export const QuickUserSwitcher: React.FC = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const demoUsers = [
    {
      email: 'teacher1@riverside.edu',
      password: 'teacher123',
      role: 'teacher',
      name: 'Dr. Sarah Johnson',
      icon: GraduationCap
    },
    {
      email: 'student1@riverside.edu', 
      password: 'student123',
      role: 'student',
      name: 'Alex Martinez',
      icon: User
    },
    {
      email: 'principal@riverside.edu',
      password: 'principal123', 
      role: 'principal',
      name: 'Principal Williams',
      icon: Users
    }
  ];

  const handleSwitchUser = async (demoUser: typeof demoUsers[0]) => {
    try {
      // Sign out current user
      await supabase.auth.signOut();
      
      // Sign in as demo user
      await login(demoUser.email, demoUser.password);
      
      toast({
        title: 'Switched User',
        description: `Now logged in as ${demoUser.name} (${demoUser.role})`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to switch user',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Quick User Switch (Demo)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Current: {user.firstName} {user.lastName} ({user.role})
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {demoUsers.map((demoUser) => {
          const Icon = demoUser.icon;
          const isCurrent = user.email === demoUser.email;
          
          return (
            <Button
              key={demoUser.email}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => !isCurrent && handleSwitchUser(demoUser)}
              disabled={isCurrent}
            >
              <Icon className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">{demoUser.name}</div>
                <div className="text-xs opacity-75">{demoUser.role}</div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};