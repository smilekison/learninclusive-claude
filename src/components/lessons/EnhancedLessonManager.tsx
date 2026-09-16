import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Video, 
  Image, 
  Download,
  Upload,
  Paperclip,
  Play,
  Pause,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Accessibility,
  VolumeX,
  Volume2,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Share,
  Award,
  BarChart3,
  Settings
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QuizManager from '../quizzes/QuizManager';
import { AdvancedLessonVideoManager } from './AdvancedLessonVideoManager';

interface LessonManagerProps {
  subjectId: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  lesson_order: number;
  estimated_duration_minutes: number;
  difficulty_level: string;
  learning_objectives: any[];
  prerequisites: any[];
  rich_content: any;
  interactive_elements: any[];
  accessibility_features: any;
  created_at: string;
  materials?: Material[];
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
  uploaded_by: string;
}

interface LessonProgress {
  id: string;
  progress_percentage: number;
  time_spent_minutes: number;
  completed_at: string | null;
  last_accessed: string;
  accessibility_settings: any;
  notes: string;
}

export const EnhancedLessonManager: React.FC<LessonManagerProps> = ({ subjectId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Accessibility states
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // UI states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  
  // Form states
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    lesson_order: 1,
    estimated_duration_minutes: 30,
    difficulty_level: 'beginner',
    learning_objectives: [],
    prerequisites: [],
    rich_content: {},
    interactive_elements: [],
    accessibility_features: {
      screen_reader_compatible: true,
      keyboard_navigation: true,
      high_contrast_support: true,
      captions_available: false,
      sign_language_interpretation: false
    }
  });
  
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  const [currentObjective, setCurrentObjective] = useState('');
  const [currentPrerequisite, setCurrentPrerequisite] = useState('');

  // Refs for accessibility
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize accessibility features
  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    
    // Detect user preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
  }, []);

  // Fetch lessons with progress
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['enhanced-lessons', subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          materials(*),
          lesson_progress(*)
        `)
        .eq('subject_id', subjectId)
        .order('lesson_order', { ascending: true });

      if (error) throw error;
      return data as (Lesson & { lesson_progress?: LessonProgress[] })[];
    },
    enabled: !!subjectId
  });

  // Accessibility announcement function
  const announceToScreenReader = (message: string) => {
    if (screenReaderMode && announcementRef.current) {
      announcementRef.current.textContent = message;
    }
    if (voiceEnabled && speechSynthRef.current) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      speechSynthRef.current.speak(utterance);
    }
  };

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: typeof newLesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          ...lessonData,
          subject_id: subjectId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-lessons', subjectId] });
      setCreateDialogOpen(false);
      setNewLesson({
        title: '',
        description: '',
        content: '',
        lesson_order: 1,
        estimated_duration_minutes: 30,
        difficulty_level: 'beginner',
        learning_objectives: [],
        prerequisites: [],
        rich_content: {},
        interactive_elements: [],
        accessibility_features: {
          screen_reader_compatible: true,
          keyboard_navigation: true,
          high_contrast_support: true,
          captions_available: false,
          sign_language_interpretation: false
        }
      });
      announceToScreenReader('Lesson created successfully!');
      toast({
        title: 'Success',
        description: 'Lesson created successfully!',
      });
    }
  });

  // Update lesson progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ lessonId, progressData }: { lessonId: string; progressData: any }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.authUserId)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          student_id: profile.id,
          lesson_id: lessonId,
          ...progressData,
          accessibility_settings: {
            high_contrast: highContrast,
            font_size: fontSize,
            screen_reader_mode: screenReaderMode,
            voice_enabled: voiceEnabled,
            reduced_motion: reducedMotion
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-lessons', subjectId] });
    }
  });

  const addObjective = () => {
    if (currentObjective.trim()) {
      setNewLesson(prev => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, currentObjective.trim()]
      }));
      setCurrentObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setNewLesson(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const addPrerequisite = () => {
    if (currentPrerequisite.trim()) {
      setNewLesson(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, currentPrerequisite.trim()]
      }));
      setCurrentPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setNewLesson(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const handleStartLesson = (lesson: Lesson) => {
    updateProgressMutation.mutate({
      lessonId: lesson.id,
      progressData: {
        progress_percentage: 0,
        last_accessed: new Date().toISOString()
      }
    });
    announceToScreenReader(`Starting lesson: ${lesson.title}`);
  };

  const handleCompleteLesson = (lesson: Lesson) => {
    updateProgressMutation.mutate({
      lessonId: lesson.id,
      progressData: {
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      }
    });
    announceToScreenReader(`Lesson completed: ${lesson.title}`);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLessons = lessons.filter(lesson => 
    filterLevel === 'all' || lesson.difficulty_level === filterLevel
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading lessons">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const accessibilityClasses = `
    ${highContrast ? 'contrast-200 bg-black text-white' : ''}
    ${reducedMotion ? '' : 'transition-all duration-200'}
  `;

  return (
    <div className={`space-y-6 ${accessibilityClasses}`}>
      {/* Screen reader announcements */}
      <div 
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Accessibility Toolbar */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Accessibility className="h-5 w-5 mr-2" />
            Accessibility & View Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(prev => Math.max(prev - 2, 12))}
                  aria-label="Decrease font size"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-12 text-center">{fontSize}px</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
                  aria-label="Increase font size"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast">High Contrast</Label>
                <Switch
                  id="high-contrast"
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                  aria-describedby="high-contrast-desc"
                />
              </div>
              <p id="high-contrast-desc" className="text-xs text-muted-foreground">
                Enhances text visibility
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-enabled">Voice Narration</Label>
                <Switch
                  id="voice-enabled"
                  checked={voiceEnabled}
                  onCheckedChange={setVoiceEnabled}
                  aria-describedby="voice-desc"
                />
              </div>
              <p id="voice-desc" className="text-xs text-muted-foreground">
                Read content aloud
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion">Reduce Motion</Label>
                <Switch
                  id="reduced-motion"
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                  aria-describedby="motion-desc"
                />
              </div>
              <p id="motion-desc" className="text-xs text-muted-foreground">
                Minimize animations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold" style={{ fontSize: `${fontSize + 8}px` }}>
            Interactive Lessons
          </h3>
          <p className="text-muted-foreground" style={{ fontSize: `${fontSize}px` }}>
            Immersive learning experiences with full accessibility support
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? <FileText className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Advanced Lesson</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="objectives">Objectives</TabsTrigger>
                  <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lesson-title">Lesson Title</Label>
                      <Input
                        id="lesson-title"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter lesson title"
                        style={{ fontSize: `${fontSize}px` }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lesson-order">Lesson Order</Label>
                      <Input
                        id="lesson-order"
                        type="number"
                        value={newLesson.lesson_order}
                        onChange={(e) => setNewLesson(prev => ({ ...prev, lesson_order: parseInt(e.target.value) || 1 }))}
                        min="1"
                        style={{ fontSize: `${fontSize}px` }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lesson-description">Description</Label>
                    <Textarea
                      id="lesson-description"
                      value={newLesson.description}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what students will learn"
                      rows={3}
                      style={{ fontSize: `${fontSize}px` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newLesson.estimated_duration_minutes}
                        onChange={(e) => setNewLesson(prev => ({ 
                          ...prev, 
                          estimated_duration_minutes: parseInt(e.target.value) || 30 
                        }))}
                        min="5"
                        max="240"
                        style={{ fontSize: `${fontSize}px` }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={newLesson.difficulty_level}
                        onValueChange={(value) => setNewLesson(prev => ({ ...prev, difficulty_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="lesson-content">Rich Content</Label>
                    <Textarea
                      id="lesson-content"
                      value={newLesson.content}
                      onChange={(e) => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter lesson content (supports markdown)"
                      rows={12}
                      className="font-mono"
                      style={{ fontSize: `${fontSize}px` }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports markdown formatting for rich content
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="objectives" className="space-y-6">
                  <div>
                    <Label>Learning Objectives</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={currentObjective}
                        onChange={(e) => setCurrentObjective(e.target.value)}
                        placeholder="Add learning objective"
                        onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                        style={{ fontSize: `${fontSize}px` }}
                      />
                      <Button onClick={addObjective} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {newLesson.learning_objectives.map((objective, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span style={{ fontSize: `${fontSize}px` }}>{objective}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeObjective(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Prerequisites</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        value={currentPrerequisite}
                        onChange={(e) => setCurrentPrerequisite(e.target.value)}
                        placeholder="Add prerequisite"
                        onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                        style={{ fontSize: `${fontSize}px` }}
                      />
                      <Button onClick={addPrerequisite} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 mt-3">
                      {newLesson.prerequisites.map((prerequisite, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span style={{ fontSize: `${fontSize}px` }}>{prerequisite}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePrerequisite(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Screen Reader Compatible</Label>
                        <p className="text-sm text-muted-foreground">Content optimized for screen readers</p>
                      </div>
                      <Switch
                        checked={newLesson.accessibility_features.screen_reader_compatible}
                        onCheckedChange={(checked) => 
                          setNewLesson(prev => ({
                            ...prev,
                            accessibility_features: {
                              ...prev.accessibility_features,
                              screen_reader_compatible: checked
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Keyboard Navigation</Label>
                        <p className="text-sm text-muted-foreground">Full keyboard accessibility</p>
                      </div>
                      <Switch
                        checked={newLesson.accessibility_features.keyboard_navigation}
                        onCheckedChange={(checked) => 
                          setNewLesson(prev => ({
                            ...prev,
                            accessibility_features: {
                              ...prev.accessibility_features,
                              keyboard_navigation: checked
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>High Contrast Support</Label>
                        <p className="text-sm text-muted-foreground">Compatible with high contrast themes</p>
                      </div>
                      <Switch
                        checked={newLesson.accessibility_features.high_contrast_support}
                        onCheckedChange={(checked) => 
                          setNewLesson(prev => ({
                            ...prev,
                            accessibility_features: {
                              ...prev.accessibility_features,
                              high_contrast_support: checked
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Captions Available</Label>
                        <p className="text-sm text-muted-foreground">Video content includes captions</p>
                      </div>
                      <Switch
                        checked={newLesson.accessibility_features.captions_available}
                        onCheckedChange={(checked) => 
                          setNewLesson(prev => ({
                            ...prev,
                            accessibility_features: {
                              ...prev.accessibility_features,
                              captions_available: checked
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sign Language Interpretation</Label>
                        <p className="text-sm text-muted-foreground">Includes sign language videos</p>
                      </div>
                      <Switch
                        checked={newLesson.accessibility_features.sign_language_interpretation}
                        onCheckedChange={(checked) => 
                          setNewLesson(prev => ({
                            ...prev,
                            accessibility_features: {
                              ...prev.accessibility_features,
                              sign_language_interpretation: checked
                            }
                          }))
                        }
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createLessonMutation.mutate(newLesson)}
                  disabled={!newLesson.title || createLessonMutation.isPending}
                >
                  {createLessonMutation.isPending ? 'Creating...' : 'Create Lesson'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lessons Grid/List */}
      <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {filteredLessons.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No lessons found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first interactive lesson to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredLessons.map((lesson) => {
            const progress = lesson.lesson_progress?.[0];
            const isCompleted = progress?.progress_percentage === 100;
            
            return (
              <Card key={lesson.id} className={`hover:shadow-lg transition-all duration-200 ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{lesson.lesson_order}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getDifficultyColor(lesson.difficulty_level)}`}
                        >
                          {lesson.difficulty_level}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle 
                        className="text-lg mb-2" 
                        style={{ fontSize: `${fontSize + 2}px` }}
                      >
                        {lesson.title}
                      </CardTitle>
                      <p 
                        className="text-muted-foreground text-sm" 
                        style={{ fontSize: `${fontSize - 2}px` }}
                      >
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  {progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {progress.progress_percentage}%
                        </span>
                      </div>
                      <Progress 
                        value={progress.progress_percentage} 
                        className="h-2"
                        aria-label={`Lesson progress: ${progress.progress_percentage}% complete`}
                      />
                    </div>
                  )}

                  {/* Lesson details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.estimated_duration_minutes} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.learning_objectives?.length || 0} objectives</span>
                    </div>
                  </div>

                  {/* Learning objectives preview */}
                  {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        What you'll learn:
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {lesson.learning_objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                        {lesson.learning_objectives.length > 2 && (
                          <li className="text-xs">
                            +{lesson.learning_objectives.length - 2} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Materials and accessibility indicators */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center space-x-3">
                      {lesson.materials && lesson.materials.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {lesson.materials.length} files
                          </span>
                        </div>
                      )}
                      {lesson.accessibility_features?.screen_reader_compatible && (
                        <Badge variant="outline" className="text-xs">
                          <Accessibility className="h-3 w-3 mr-1" />
                          Accessible
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {!isCompleted ? (
                        <Button 
                          size="sm"
                          onClick={() => handleStartLesson(lesson)}
                          aria-label={`Start lesson: ${lesson.title}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {progress ? 'Continue' : 'Start'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStartLesson(lesson)}
                          aria-label={`Review lesson: ${lesson.title}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>

                      {/* Advanced Video Manager */}
                      <AdvancedLessonVideoManager 
                        lessonId={lesson.id}
                        lessonTitle={lesson.title}
                      />

                      {/* Include QuizManager for each lesson */}
                      <QuizManager 
                        subjectId={subjectId} 
                        lessonId={lesson.id} 
                      />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};