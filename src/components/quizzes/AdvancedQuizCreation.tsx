import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Clock, Users, Target, Settings } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface QuizData {
  title: string;
  description: string;
  instructions: string;
  quiz_type: 'practice' | 'assessment' | 'homework' | 'exam';
  time_limit: number | null;
  max_attempts: number;
  max_score: number;
  passing_score: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  show_correct_answers: boolean;
  allow_review: boolean;
  availability_start: string;
  availability_end: string;
  questions: Question[];
}

interface AdvancedQuizCreationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  lessonId?: string;
  onQuizCreated: () => void;
}

export default function AdvancedQuizCreation({
  open,
  onOpenChange,
  subjectId,
  lessonId,
  onQuizCreated
}: AdvancedQuizCreationProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [quizData, setQuizData] = useState<QuizData>({
    title: '',
    description: '',
    instructions: '',
    quiz_type: 'practice',
    time_limit: null,
    max_attempts: 3,
    max_score: 100,
    passing_score: 60,
    randomize_questions: false,
    randomize_answers: false,
    show_correct_answers: true,
    allow_review: true,
    availability_start: '',
    availability_end: '',
    questions: []
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      explanation: ''
    };
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, ...updatedQuestion } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!quizData.title.trim() || quizData.questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a title and at least one question.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .insert({
          title: quizData.title,
          description: quizData.description,
          instructions: quizData.instructions,
          subject_id: subjectId,
          lesson_id: lessonId || null,
          quiz_type: quizData.quiz_type,
          time_limit: quizData.time_limit,
          max_attempts: quizData.max_attempts,
          max_score: quizData.max_score,
          passing_score: quizData.passing_score,
          randomize_questions: quizData.randomize_questions,
          randomize_answers: quizData.randomize_answers,
          show_correct_answers: quizData.show_correct_answers,
          allow_review: quizData.allow_review,
          availability_start: quizData.availability_start || null,
          availability_end: quizData.availability_end || null,
          questions: JSON.parse(JSON.stringify(quizData.questions))
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz created successfully!"
      });
      
      onQuizCreated();
      onOpenChange(false);
      
      // Reset form
      setQuizData({
        title: '',
        description: '',
        instructions: '',
        quiz_type: 'practice',
        time_limit: null,
        max_attempts: 3,
        max_score: 100,
        passing_score: 60,
        randomize_questions: false,
        randomize_answers: false,
        show_correct_answers: true,
        allow_review: true,
        availability_start: '',
        availability_end: '',
        questions: []
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionEditor = (question: Question, index: number) => (
    <Card key={question.id} className="mb-4">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">Question {index + 1}</Badge>
          <Select
            value={question.type}
            onValueChange={(value: Question['type']) => 
              updateQuestion(index, { 
                type: value,
                options: value === 'multiple_choice' ? ['', '', '', ''] : undefined
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="true_false">True/False</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeQuestion(index)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`question-${index}`}>Question</Label>
          <Textarea
            id={`question-${index}`}
            value={question.question}
            onChange={(e) => updateQuestion(index, { question: e.target.value })}
            placeholder="Enter your question..."
            className="min-h-20"
          />
        </div>

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            <Label>Answer Options</Label>
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(question.options || [])];
                    newOptions[optionIndex] = e.target.value;
                    updateQuestion(index, { options: newOptions });
                  }}
                  placeholder={`Option ${optionIndex + 1}`}
                />
                <Button
                  variant={question.correctAnswer === optionIndex.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateQuestion(index, { correctAnswer: optionIndex.toString() })}
                >
                  {question.correctAnswer === optionIndex.toString() ? "Correct" : "Set Correct"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="space-y-2">
            <Label>Correct Answer</Label>
            <div className="flex space-x-2">
              <Button
                variant={question.correctAnswer === 'true' ? "default" : "outline"}
                onClick={() => updateQuestion(index, { correctAnswer: 'true' })}
              >
                True
              </Button>
              <Button
                variant={question.correctAnswer === 'false' ? "default" : "outline"}
                onClick={() => updateQuestion(index, { correctAnswer: 'false' })}
              >
                False
              </Button>
            </div>
          </div>
        )}

        {(question.type === 'short_answer' || question.type === 'essay') && (
          <div>
            <Label htmlFor={`answer-${index}`}>Model Answer / Keywords</Label>
            <Textarea
              id={`answer-${index}`}
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
              placeholder="Enter model answer or keywords for grading..."
            />
          </div>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`points-${index}`}>Points:</Label>
            <Input
              id={`points-${index}`}
              type="number"
              value={question.points}
              onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1 })}
              className="w-16"
              min="1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`explanation-${index}`}>Explanation (Optional)</Label>
          <Textarea
            id={`explanation-${index}`}
            value={question.explanation || ''}
            onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
            placeholder="Explain why this is the correct answer..."
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Create Advanced Quiz</span>
            {lessonId && <Badge variant="secondary">Lesson Quiz</Badge>}
          </DialogTitle>
          <DialogDescription>
            Create an interactive quiz with advanced features and analytics
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span>Basic</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Questions ({quizData.questions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quizData.title}
                  onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title..."
                />
              </div>
              <div>
                <Label htmlFor="quiz_type">Quiz Type</Label>
                <Select
                  value={quizData.quiz_type}
                  onValueChange={(value: QuizData['quiz_type']) => 
                    setQuizData(prev => ({ ...prev, quiz_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quizData.description}
                onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this quiz covers..."
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={quizData.instructions}
                onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Provide instructions for students..."
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timing & Attempts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                    <Input
                      id="time_limit"
                      type="number"
                      value={quizData.time_limit || ''}
                      onChange={(e) => setQuizData(prev => ({ 
                        ...prev, 
                        time_limit: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      placeholder="No limit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_attempts">Max Attempts</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      value={quizData.max_attempts}
                      onChange={(e) => setQuizData(prev => ({ 
                        ...prev, 
                        max_attempts: parseInt(e.target.value) || 1 
                      }))}
                      min="1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Scoring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max_score">Total Points</Label>
                    <Input
                      id="max_score"
                      type="number"
                      value={quizData.max_score}
                      onChange={(e) => setQuizData(prev => ({ 
                        ...prev, 
                        max_score: parseInt(e.target.value) || 100 
                      }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      value={quizData.passing_score}
                      onChange={(e) => setQuizData(prev => ({ 
                        ...prev, 
                        passing_score: parseInt(e.target.value) || 60 
                      }))}
                      min="0"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quiz Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize_questions">Randomize Questions</Label>
                  <Switch
                    id="randomize_questions"
                    checked={quizData.randomize_questions}
                    onCheckedChange={(checked) => setQuizData(prev => ({ 
                      ...prev, 
                      randomize_questions: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize_answers">Randomize Answer Options</Label>
                  <Switch
                    id="randomize_answers"
                    checked={quizData.randomize_answers}
                    onCheckedChange={(checked) => setQuizData(prev => ({ 
                      ...prev, 
                      randomize_answers: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show_correct_answers">Show Correct Answers After</Label>
                  <Switch
                    id="show_correct_answers"
                    checked={quizData.show_correct_answers}
                    onCheckedChange={(checked) => setQuizData(prev => ({ 
                      ...prev, 
                      show_correct_answers: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_review">Allow Review Before Submit</Label>
                  <Switch
                    id="allow_review"
                    checked={quizData.allow_review}
                    onCheckedChange={(checked) => setQuizData(prev => ({ 
                      ...prev, 
                      allow_review: checked 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="availability_start">Available From</Label>
                  <Input
                    id="availability_start"
                    type="datetime-local"
                    value={quizData.availability_start}
                    onChange={(e) => setQuizData(prev => ({ 
                      ...prev, 
                      availability_start: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="availability_end">Available Until</Label>
                  <Input
                    id="availability_end"
                    type="datetime-local"
                    value={quizData.availability_end}
                    onChange={(e) => setQuizData(prev => ({ 
                      ...prev, 
                      availability_end: e.target.value 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Quiz Questions</h3>
              <Button onClick={addQuestion} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </Button>
            </div>

            {quizData.questions.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No questions added yet</p>
                  <Button onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              quizData.questions.map((question, index) => renderQuestionEditor(question, index))
            )}
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>{quizData.title || "Untitled Quiz"}</CardTitle>
                <div className="flex space-x-2">
                  <Badge variant="outline">{quizData.quiz_type}</Badge>
                  {quizData.time_limit && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {quizData.time_limit} min
                    </Badge>
                  )}
                  <Badge variant="outline">{quizData.questions.length} questions</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {quizData.description && (
                  <p className="text-muted-foreground mb-4">{quizData.description}</p>
                )}
                {quizData.instructions && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Instructions:</h4>
                    <p className="text-sm">{quizData.instructions}</p>
                  </div>
                )}
                <div className="space-y-4">
                  {quizData.questions.map((question, index) => (
                    <div key={question.id} className="border rounded p-4">
                      <h5 className="font-medium mb-2">
                        {index + 1}. {question.question || "Question not set"}
                      </h5>
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="text-sm">
                              {String.fromCharCode(97 + optionIndex)}. {option || `Option ${optionIndex + 1}`}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Points: {question.points} | Type: {question.type.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}