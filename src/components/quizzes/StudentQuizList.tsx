import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  PlayCircle, 
  Clock, 
  Target, 
  Users, 
  CheckCircle,
  AlertCircle,
  Trophy,
  BarChart3,
  Eye,
  BookOpen
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import StudentQuizInterface from './StudentQuizInterface';

interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  quiz_type: string;
  time_limit: number | null;
  max_attempts: number;
  max_score: number;
  passing_score: number;
  questions: any[];
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  availability_start: string | null;
  availability_end: string | null;
  lesson_id: string | null;
  subject_id: string;
}

interface StudentQuizListProps {
  subjectId: string;
  lessonId?: string;
}

export default function StudentQuizList({ subjectId, lessonId }: StudentQuizListProps) {
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizInterface, setShowQuizInterface] = useState(false);

  // Fetch available quizzes for student
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['student-quizzes', subjectId, lessonId],
    queryFn: async () => {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true);

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      } else {
        query = query.is('lesson_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    }
  });

  // Fetch student's quiz attempts
  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', profile.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const getQuizStatus = (quiz: Quiz) => {
    const quizAttempts = attempts.filter(attempt => attempt.quiz_id === quiz.id);
    
    if (quizAttempts.length === 0) {
      return { status: 'not_started', color: 'secondary', text: 'Not Started' };
    }
    
    const bestAttempt = quizAttempts.reduce((best, current) => 
      (current.score || 0) > (best.score || 0) ? current : best
    );
    
    const passed = (bestAttempt.score || 0) >= quiz.passing_score;
    const hasAttemptsLeft = quizAttempts.length < quiz.max_attempts;
    
    if (passed) {
      return { status: 'passed', color: 'default', text: 'Passed', score: bestAttempt.score };
    } else if (hasAttemptsLeft) {
      return { status: 'can_retry', color: 'destructive', text: 'Can Retry', score: bestAttempt.score };
    } else {
      return { status: 'failed', color: 'destructive', text: 'Failed', score: bestAttempt.score };
    }
  };

  const canTakeQuiz = (quiz: Quiz) => {
    const quizAttempts = attempts.filter(attempt => attempt.quiz_id === quiz.id);
    const hasAttemptsLeft = quizAttempts.length < quiz.max_attempts;
    
    // Check availability window
    const now = new Date();
    const startTime = quiz.availability_start ? new Date(quiz.availability_start) : null;
    const endTime = quiz.availability_end ? new Date(quiz.availability_end) : null;
    
    const isAvailable = (!startTime || now >= startTime) && (!endTime || now <= endTime);
    
    return hasAttemptsLeft && isAvailable;
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'No limit';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizInterface(true);
  };

  const handleQuizComplete = () => {
    setShowQuizInterface(false);
    setSelectedQuiz(null);
    // Refetch attempts to update status
  };

  if (showQuizInterface && selectedQuiz) {
    return (
      <StudentQuizInterface
        quiz={selectedQuiz}
        onComplete={handleQuizComplete}
        onExit={() => {
          setShowQuizInterface(false);
          setSelectedQuiz(null);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="animate-pulse p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">
            {lessonId ? 'Lesson Quizzes' : 'Subject Quizzes'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Test your knowledge and track your progress
          </p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Quizzes Available</h4>
            <p className="text-muted-foreground">
              Your teacher hasn't created any quizzes for this {lessonId ? 'lesson' : 'subject'} yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const canTake = canTakeQuiz(quiz);
            const quizAttempts = attempts.filter(attempt => attempt.quiz_id === quiz.id);

            return (
              <Card key={quiz.id} className={`hover:shadow-md transition-shadow ${
                status.status === 'passed' ? 'border-green-200 bg-green-50/30' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getQuizTypeColor(quiz.quiz_type)}>
                          {quiz.quiz_type}
                        </Badge>
                        <Badge variant={status.color as any}>
                          {status.status === 'passed' && <Trophy className="h-3 w-3 mr-1" />}
                          {status.text}
                          {status.score !== undefined && ` (${status.score}/${quiz.max_score})`}
                        </Badge>
                        {!canTake && status.status !== 'passed' && (
                          <Badge variant="outline">
                            No attempts left
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      )}
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
                        <p className="text-sm font-medium">{formatTime(quiz.time_limit)}</p>
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
                        <p className="text-sm font-medium">
                          {quizAttempts.length}/{quiz.max_attempts}
                        </p>
                      </div>
                    </div>
                  </div>

                  {quiz.instructions && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium mb-1">Instructions:</h4>
                      <p className="text-sm">{quiz.instructions}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Pass: {quiz.passing_score}%
                      </Badge>
                      {quiz.availability_end && (
                        <Badge variant="outline" className="text-xs">
                          Due: {new Date(quiz.availability_end).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {quizAttempts.length > 0 && (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                      )}
                      {canTake ? (
                        <Button 
                          size="sm"
                          onClick={() => handleStartQuiz(quiz)}
                          className="min-w-24"
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          {quizAttempts.length > 0 ? 'Retake' : 'Start'}
                        </Button>
                      ) : status.status === 'passed' ? (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <AlertCircle className="h-4 w-4 mr-1" />
                          No Attempts Left
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}