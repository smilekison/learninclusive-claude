import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  VolumeX, 
  Volume2,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  Flag,
  Accessibility,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

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
  questions: Question[];
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  availability_start: string | null;
  availability_end: string | null;
}

interface StudentQuizInterfaceProps {
  quiz: Quiz;
  onComplete: () => void;
  onExit: () => void;
}

export default function StudentQuizInterface({ quiz, onComplete, onExit }: StudentQuizInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Accessibility states
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  
  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.time_limit ? quiz.time_limit * 60 : null
  );
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Refs for accessibility
  const questionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  
  // Initialize accessibility features
  useEffect(() => {
    // Detect screen reader
    const detectScreenReader = () => {
      const isScreenReader = window.navigator.userAgent.includes('NVDA') || 
                            window.navigator.userAgent.includes('JAWS') ||
                            !!window.speechSynthesis;
      setScreenReaderMode(isScreenReader);
    };
    
    detectScreenReader();
    speechSynthRef.current = window.speechSynthesis;
    
    // Log accessibility usage
    logAccessibilityAction('quiz_started', 'interface_initialized');
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0 || isReviewMode) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isReviewMode]);

  // Focus management for accessibility
  useEffect(() => {
    if (questionRef.current && sessionStarted) {
      questionRef.current.focus();
      announceQuestion();
    }
  }, [currentQuestionIndex, sessionStarted]);

  const logAccessibilityAction = async (actionType: string, feature: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.authUserId)
        .single();

      if (profile) {
        await supabase
          .from('accessibility_audit_log')
          .insert({
            user_id: profile.id,
            action_type: actionType,
            accessibility_feature: feature,
            context_data: {
              quiz_id: quiz.id,
              question_index: currentQuestionIndex,
              high_contrast: highContrast,
              screen_reader_mode: screenReaderMode,
              voice_enabled: voiceEnabled,
              font_size: fontSize
            },
            user_agent: navigator.userAgent,
            screen_reader_detected: screenReaderMode
          });
      }
    } catch (error) {
      console.error('Error logging accessibility action:', error);
    }
  };

  const announceQuestion = () => {
    if (voiceEnabled && speechSynthRef.current) {
      const currentQuestion = quiz.questions[currentQuestionIndex];
      const utterance = new SpeechSynthesisUtterance(
        `Question ${currentQuestionIndex + 1} of ${quiz.questions.length}. ${currentQuestion.question}`
      );
      utterance.rate = 0.8;
      speechSynthRef.current.speak(utterance);
    }
  };

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.authUserId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('student_quiz_sessions')
        .insert({
          student_id: profile.id,
          quiz_id: quiz.id,
          attempt_number: 1, // TODO: Calculate actual attempt number
          time_remaining_seconds: timeRemaining,
          accessibility_settings: {
            high_contrast: highContrast,
            font_size: fontSize,
            screen_reader_mode: screenReaderMode,
            voice_enabled: voiceEnabled,
            focus_mode: focusMode
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setSessionStarted(true);
      toast({
        title: "Quiz Started",
        description: "Good luck! Remember to read each question carefully."
      });
    }
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.authUserId)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Calculate score
      let score = 0;
      quiz.questions.forEach((question, index) => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          score += question.points;
        }
      });

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          student_id: profile.id,
          answers: answers,
          score: score,
          completed_at: new Date().toISOString(),
          accessibility_settings: {
            high_contrast: highContrast,
            font_size: fontSize,
            screen_reader_mode: screenReaderMode,
            voice_enabled: voiceEnabled
          },
          screen_reader_used: screenReaderMode,
          keyboard_navigation_used: true // Assume keyboard navigation for accessibility
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Quiz Submitted",
        description: "Your answers have been saved successfully!"
      });
      onComplete();
    }
  });

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleAutoSubmit = () => {
    if (voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance("Time is up. Your quiz is being submitted automatically.");
      speechSynthRef.current?.speak(utterance);
    }
    submitQuizMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    logAccessibilityAction('answer_selected', 'question_interaction');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      logAccessibilityAction('navigation', 'next_question');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      logAccessibilityAction('navigation', 'previous_question');
    }
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
    logAccessibilityAction('flag_question', 'question_flagged');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Accessibility CSS classes
  const accessibilityClasses = `
    ${highContrast ? 'contrast-200 bg-black text-white' : ''}
    ${focusMode ? 'focus-within:ring-4 focus-within:ring-primary' : ''}
  `;

  if (!sessionStarted) {
    return (
      <div className={`min-h-screen bg-background p-6 ${accessibilityClasses}`}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2" style={{ fontSize: `${fontSize}px` }}>
                  {quiz.title}
                </CardTitle>
                <p className="text-muted-foreground" style={{ fontSize: `${fontSize - 2}px` }}>
                  {quiz.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                aria-label={voiceEnabled ? "Disable voice narration" : "Enable voice narration"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accessibility Toolbar */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Accessibility className="h-5 w-5 mr-2" />
                Accessibility Options
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant={highContrast ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setHighContrast(!highContrast);
                    logAccessibilityAction('toggle_contrast', 'high_contrast');
                  }}
                  aria-pressed={highContrast}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  High Contrast
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFontSize(prev => Math.min(prev + 2, 24));
                    logAccessibilityAction('font_size', 'increase');
                  }}
                  aria-label="Increase font size"
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Larger Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFontSize(prev => Math.max(prev - 2, 12));
                    logAccessibilityAction('font_size', 'decrease');
                  }}
                  aria-label="Decrease font size"
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Smaller Text
                </Button>
                <Button
                  variant={focusMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFocusMode(!focusMode);
                    logAccessibilityAction('toggle_focus', 'focus_mode');
                  }}
                  aria-pressed={focusMode}
                >
                  Focus Mode
                </Button>
              </div>
            </div>

            {/* Quiz Instructions */}
            {quiz.instructions && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <p style={{ fontSize: `${fontSize - 2}px` }}>{quiz.instructions}</p>
              </div>
            )}

            {/* Quiz Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-semibold">{quiz.questions.length}</p>
                </div>
              </div>
              {quiz.time_limit && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time Limit</p>
                    <p className="font-semibold">{quiz.time_limit} minutes</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Passing Score</p>
                  <p className="font-semibold">{quiz.passing_score}%</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onExit}>
                Exit
              </Button>
              <Button 
                onClick={handleStartQuiz}
                disabled={startQuizMutation.isPending}
                className="min-w-32"
              >
                {startQuizMutation.isPending ? "Starting..." : "Start Quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${accessibilityClasses}`}>
      {/* Header with progress and timer */}
      <div className="bg-card border-b p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm font-medium" style={{ fontSize: `${fontSize - 2}px` }}>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <Badge variant={quiz.quiz_type === 'exam' ? 'destructive' : 'default'}>
                {quiz.quiz_type}
              </Badge>
              {flaggedQuestions.has(currentQuestionIndex) && (
                <Badge variant="outline">
                  <Flag className="h-3 w-3 mr-1" />
                  Flagged
                </Badge>
              )}
            </div>
            <Progress 
              value={progress} 
              className="w-full"
              aria-label={`Quiz progress: ${Math.round(progress)}% complete`}
            />
          </div>
          
          {timeRemaining !== null && (
            <div 
              ref={timerRef}
              className={`ml-6 text-right ${timeRemaining < 300 ? 'text-destructive' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-sm text-muted-foreground">Time Remaining</p>
              <p className="text-xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            {/* Question */}
            <div 
              ref={questionRef}
              tabIndex={-1}
              className="mb-8"
              role="main"
              aria-label={`Question ${currentQuestionIndex + 1}`}
            >
              <h2 
                className="text-xl font-semibold mb-6"
                style={{ fontSize: `${fontSize + 4}px` }}
                id={`question-${currentQuestionIndex}`}
              >
                {currentQuestion.question}
              </h2>

              {/* Answer options based on question type */}
              {currentQuestion.type === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-4"
                  aria-labelledby={`question-${currentQuestionIndex}`}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`option-${index}`}
                        className="mt-0"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'true_false' && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-4"
                  aria-labelledby={`question-${currentQuestionIndex}`}
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="true" id="true-option" />
                    <Label 
                      htmlFor="true-option" 
                      className="flex-1 cursor-pointer"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="false" id="false-option" />
                    <Label 
                      htmlFor="false-option" 
                      className="flex-1 cursor-pointer"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                <Textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-32"
                  style={{ fontSize: `${fontSize}px` }}
                  aria-labelledby={`question-${currentQuestionIndex}`}
                />
              )}
            </div>

            {/* Navigation and actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  aria-label="Previous question"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={toggleFlag}
                  aria-label={
                    flaggedQuestions.has(currentQuestionIndex) 
                      ? "Remove flag from this question" 
                      : "Flag this question for review"
                  }
                  aria-pressed={flaggedQuestions.has(currentQuestionIndex)}
                >
                  <Flag className={`h-4 w-4 mr-1 ${flaggedQuestions.has(currentQuestionIndex) ? 'fill-current' : ''}`} />
                  {flaggedQuestions.has(currentQuestionIndex) ? 'Unflag' : 'Flag'}
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExitDialog(true)}
                >
                  Exit Quiz
                </Button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <Button onClick={handleNextQuestion}>
                    Next
                    <SkipForward className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => submitQuizMutation.mutate()}
                    disabled={submitQuizMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit this quiz? Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={onExit} className="bg-destructive text-destructive-foreground">
              Exit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}