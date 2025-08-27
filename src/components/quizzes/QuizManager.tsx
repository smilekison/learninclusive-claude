import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  PlayCircle, 
  Clock, 
  Users, 
  Target, 
  BarChart3,
  Settings,
  Trash2,
  Edit
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdvancedQuizCreation from './AdvancedQuizCreation';

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  time_limit: number | null;
  max_attempts: number;
  max_score: number;
  passing_score: number;
  questions: any[];
  created_at: string;
  is_active: boolean;
  lesson_id: string | null;
}

interface QuizManagerProps {
  subjectId: string;
  lessonId?: string;
  className?: string;
}

export default function QuizManager({ subjectId, lessonId, className }: QuizManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch quizzes
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', subjectId, lessonId],
    queryFn: async () => {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else {
        query = query.is('lesson_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quiz[];
    }
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', subjectId, lessonId] });
      toast({
        title: "Success",
        description: "Quiz deleted successfully!"
      });
    },
    onError: (error) => {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz.",
        variant: "destructive"
      });
    }
  });

  const handleQuizCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['quizzes', subjectId, lessonId] });
  };

  const getQuizTypeColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'destructive';
      case 'assessment':
        return 'default';
      case 'homework':
        return 'secondary';
      case 'practice':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return 'No limit';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">
            {lessonId ? 'Lesson Quizzes' : 'Subject Quizzes'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage interactive quizzes with advanced features
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Quiz</span>
        </Button>
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Quizzes Yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first quiz to engage students with interactive assessments
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <Badge variant={getQuizTypeColor(quiz.quiz_type)}>
                        {quiz.quiz_type}
                      </Badge>
                    </div>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteQuizMutation.mutate(quiz.id)}
                      disabled={deleteQuizMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Questions</p>
                      <p className="text-sm font-medium">{quiz.questions?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time Limit</p>
                      <p className="text-sm font-medium">{formatTimeLimit(quiz.time_limit)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Max Score</p>
                      <p className="text-sm font-medium">{quiz.max_score}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Attempts</p>
                      <p className="text-sm font-medium">{quiz.max_attempts}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Pass: {quiz.passing_score}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Created: {new Date(quiz.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm">
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdvancedQuizCreation
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        subjectId={subjectId}
        lessonId={lessonId}
        onQuizCreated={handleQuizCreated}
      />
    </div>
  );
}