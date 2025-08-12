import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Image, 
  Download, 
  Calendar,
  Clock,
  Paperclip
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  lesson_order: number;
  created_at: string;
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  materials?: Material[];
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export const StudentLessons: React.FC = () => {
  const { user } = useAuth();

  // Fetch lessons for student's enrolled classes
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['student-lessons', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) {
        console.log('StudentLessons: No auth user ID available, user object:', user);
        return [];
      }
      
      console.log('StudentLessons: Fetching profile for auth user:', user.authUserId);
      
      // Get user profile using the auth user ID
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.authUserId)
        .maybeSingle();
      
      console.log('StudentLessons: Profile query result:', { userProfile, profileError });
      
      if (profileError) {
        console.error('StudentLessons: Profile query error:', profileError);
        return [];
      }
      
      if (!userProfile) {
        console.log('StudentLessons: Profile not found for auth user:', user.authUserId);
        return [];
      }

      console.log('StudentLessons: Profile found, fetching lessons for student ID:', userProfile.id);

      // First, get student's enrolled classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', userProfile.id)
        .eq('status', 'active');

      if (enrollmentError) {
        console.error('StudentLessons: Error fetching enrollments:', enrollmentError);
        return [];
      }

      if (!enrollments || enrollments.length === 0) {
        console.log('StudentLessons: No active enrollments found');
        return [];
      }

      const classIds = enrollments.map(e => e.class_id);
      console.log('StudentLessons: Found enrolled classes:', classIds);

      // Then get lessons from subjects in those classes
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          subject:subjects!inner(
            id,
            name,
            class:classes!inner(
              id,
              name
            )
          ),
          materials(*)
        `)
        .in('subject.class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(6);

      console.log('StudentLessons: Lessons query result:', { lessonsData, lessonsError });

      if (lessonsError) {
        console.error('StudentLessons: Error fetching lessons:', lessonsError);
        return [];
      }

      return lessonsData as Lesson[];
    },
    enabled: !!user
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading lessons...</div>;
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No lessons available yet</p>
        <p className="text-sm text-muted-foreground">Check back later for new content from your teachers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <Dialog key={lesson.id}>
          <DialogTrigger asChild>
            <div className="cursor-pointer p-4 border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">#{lesson.lesson_order}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {lesson.subject.name} • {lesson.subject.class.name}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{lesson.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{lesson.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(lesson.created_at)}
                    </div>
                    {lesson.materials && lesson.materials.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {lesson.materials.length} materials
                      </div>
                    )}
                  </div>
                </div>
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">#{lesson.lesson_order}</Badge>
                <span className="text-sm text-muted-foreground">
                  {lesson.subject.name} • {lesson.subject.class.name}
                </span>
              </div>
              <DialogTitle>{lesson.title}</DialogTitle>
              <p className="text-muted-foreground">{lesson.description}</p>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Lesson Content */}
              {lesson.content && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Lesson Content</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{lesson.content}</p>
                  </div>
                </div>
              )}

              {/* Materials */}
              {lesson.materials && lesson.materials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Materials ({lesson.materials.length})
                  </h3>
                  <div className="grid gap-3">
                    {lesson.materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(material.file_type)}
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {formatDate(material.created_at)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Download functionality would go here
                            // For now, we'll just show the file path
                            console.log('Download:', material.file_path);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson Info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Lesson added on {formatDate(lesson.created_at)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
      
      {lessons.length === 6 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            View All Lessons
          </Button>
        </div>
      )}
    </div>
  );
};