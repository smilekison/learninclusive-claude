import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  Calendar
} from 'lucide-react';

export const StudentSubjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subjects = [] } = useSubjects();

  // Filter subjects for enrolled classes
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  
  React.useEffect(() => {
    const fetchStudentSubjects = async () => {
      if (!user) return;
      
      // For now, return empty subjects until student enrollment system is properly implemented
      setStudentSubjects([]);
    };

    fetchStudentSubjects();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
          <p className="text-muted-foreground mt-2">
            All subjects from your enrolled classes
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentSubjects.map((subject: any) => {
            const upcomingAssignments = subject.assignments?.filter((a: any) => {
              const due = new Date(a.due_date);
              const now = new Date();
              return due > now;
            }).length || 0;

            return (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {subject.name}
                    </CardTitle>
                    <Badge variant="secondary">{subject.class?.name}</Badge>
                  </div>
                  <CardDescription>
                    {subject.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Class: {subject.class?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{upcomingAssignments} upcoming assignments</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/student/subjects/${subject.id}`)}
                  >
                    View Subject Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
          {studentSubjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subjects found</h3>
              <p className="text-muted-foreground">You're not enrolled in any classes yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};