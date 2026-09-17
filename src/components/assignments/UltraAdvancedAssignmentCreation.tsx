import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Sparkles, Brain, Target, Accessibility, Clock, Users, Award, 
  FileText, Code, Mic, Video, Link2, Globe, ChevronDown, Plus, 
  Trash2, Save, Eye, Wand2, BarChart3, Shield, BookOpen, Calendar as CalendarIcon,
  Palette, Volume2, Subtitles, MousePointer, Keyboard, Camera,
  Layers, Zap, Workflow, Gauge, Lightbulb, TrendingUp, Heart,
  Share2, Copy, Download, RefreshCw, Play, Settings, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UltraAdvancedAssignmentCreationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  subjectId?: string;
  subjects?: any[];
  classes?: any[];
  initialData?: any;
}

export const UltraAdvancedAssignmentCreation: React.FC<UltraAdvancedAssignmentCreationProps> = ({
  open,
  onOpenChange,
  onSubmit,
  subjectId,
  subjects = [],
  classes = [],
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignmentData, setAssignmentData] = useState(() => ({
    // Basic Information
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions_rich_text || '',
    category: initialData?.category || 'homework',
    
    // Scheduling & Time Management
    dueDate: initialData?.due_date ? new Date(initialData.due_date) : undefined,
    availableFrom: initialData?.available_from ? new Date(initialData.available_from) : new Date(),
    estimatedDuration: initialData?.estimated_duration_minutes || 60,
    timeLimit: initialData?.time_limit_minutes || null,
    lateSubmissionPolicy: initialData?.late_submission_policy || 'penalty',
    latePenaltyPercent: initialData?.late_penalty_percent || 10,
    
    // Submission & Grading
    maxScore: initialData?.max_score || 100,
    gradingScale: initialData?.grading_scale || 'percentage',
    submissionTypes: initialData?.submission_types || ['text'],
    maxAttempts: initialData?.max_attempts || 1,
    showGradesToStudents: initialData?.show_grades_to_students ?? true,
    instantFeedback: initialData?.instant_feedback ?? false,
    
    // Collaboration & Group Work
    groupAssignment: initialData?.group_assignment || false,
    maxGroupSize: initialData?.max_group_size || 4,
    groupFormationType: initialData?.group_formation || 'self_select',
    peerReview: initialData?.peer_review || false,
    peerReviewCount: initialData?.peer_review_count || 2,
    
    // Advanced Features
    plagiarismCheck: initialData?.plagiarism_check ?? true,
    aiDetection: initialData?.ai_detection ?? true,
    originalityThreshold: initialData?.originality_threshold || 80,
    
    // Accessibility & Universal Design
    accessibilityLevel: initialData?.accessibility_level || 'AA',
    accessibilityFeatures: initialData?.accessibility_features || {
      screenReader: true,
      highContrast: true,
      keyboardNav: true,
      audioDescription: false,
      signLanguage: false,
      dyslexiaFriendly: true,
      cognitiveSupport: true,
      alternativeFormats: true
    },
    
    // Micro-Learning & Chunking
    enableChunking: initialData?.enable_chunking || false,
    chunkCount: initialData?.chunk_count || 3,
    adaptivePath: initialData?.adaptive_path || false,
    personalizedScheduling: initialData?.personalized_scheduling || true,
    
    // AI & Automation
    aiAssistance: initialData?.ai_assistance_config || {
      enabled: true,
      suggestions: true,
      feedback: true,
      grading: false,
      plagiarismHelp: true,
      resourceRecommendations: true,
      writingSupport: true,
      languageSupport: true
    },
    
    // Analytics & Insights
    analytics: initialData?.analytics_config || {
      trackEngagement: true,
      timeTracking: true,
      difficultyAnalysis: true,
      learningPath: true,
      predictiveInsights: true,
      parentNotifications: false,
      realTimeAlerts: true
    },
    
    // Multimedia & Interactive Elements
    multimedia: initialData?.multimedia || {
      videos: [],
      audio: [],
      interactive: [],
      simulations: [],
      vr: false,
      ar: false
    },
    
    // Competency & Skills
    competencies: initialData?.competencies || [],
    skillLevel: initialData?.skill_level || 'intermediate',
    industryStandards: initialData?.industry_standards || [],
    
    // Advanced Rubric
    rubric: initialData?.rubric || {
      type: 'advanced',
      criteria: [
        { name: 'Content Quality', weight: 40, levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] },
        { name: 'Critical Thinking', weight: 30, levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] },
        { name: 'Communication', weight: 20, levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] },
        { name: 'Collaboration', weight: 10, levels: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] }
      ],
      holistic: false,
      customDescriptors: true
    },
    
    // Workflow & Approval
    workflow: initialData?.workflow || {
      type: 'simple',
      approvalChain: [],
      peerReviewRequired: false,
      teacherApproval: true,
      parentNotification: false
    },
    
    // Resources & Materials
    resources: initialData?.resources || [],
    prerequisites: initialData?.prerequisites || [],
    followUpActivities: initialData?.follow_up_activities || [],
    
    // Template & Sharing
    saveAsTemplate: false,
    templateCategory: 'custom',
    shareWithCommunity: false,
    
    // Reading Level
    readingLevel: initialData?.reading_level || 5,
    
    subjectId: initialData?.subject_id || subjectId || ''
  }));

  const generateAIContent = async (type: string) => {
    setIsAIGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'description') {
        setAssignmentData(prev => ({
          ...prev,
          description: `AI-generated description based on the title "${prev.title}". This assignment focuses on developing critical thinking and analytical skills through hands-on application of key concepts.`
        }));
      } else if (type === 'instructions') {
        setAssignmentData(prev => ({
          ...prev,
          instructions: `Step-by-step instructions:\n1. Research the given topic thoroughly\n2. Analyze different perspectives\n3. Develop your own informed opinion\n4. Present your findings clearly\n5. Support with evidence and examples`
        }));
      } else if (type === 'rubric') {
        setAssignmentData(prev => ({
          ...prev,
          rubric: {
            ...prev.rubric,
            criteria: [
              { name: 'Research Quality', weight: 35, levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
              { name: 'Analysis Depth', weight: 30, levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
              { name: 'Evidence Support', weight: 20, levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] },
              { name: 'Presentation', weight: 15, levels: ['Exceptional', 'Proficient', 'Developing', 'Beginning'] }
            ]
          }
        }));
      }
      
      toast.success(`AI-generated ${type} has been added!`);
    } catch (error) {
      toast.error(`Failed to generate ${type}`);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleAccessibilityFeatureChange = (feature: string, checked: boolean) => {
    setAssignmentData(prev => ({
      ...prev,
      accessibilityFeatures: {
        ...prev.accessibilityFeatures,
        [feature]: checked
      }
    }));
  };

  const addCompetency = () => {
    setAssignmentData(prev => ({
      ...prev,
      competencies: [...prev.competencies, {
        name: '',
        level: 'intermediate',
        weight: 1.0,
        criteria: []
      }]
    }));
  };

  const removeCompetency = (index: number) => {
    setAssignmentData(prev => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index)
    }));
  };

  const addResource = (type: string) => {
    const newResource = {
      id: Date.now().toString(),
      type,
      title: '',
      url: '',
      description: '',
      required: false,
      estimatedTime: 10
    };
    
    setAssignmentData(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }));
  };

  const handleSubmit = () => {
    if (!assignmentData.title || !assignmentData.subjectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submissionData = {
      ...assignmentData,
      accessibility_features: assignmentData.accessibilityFeatures,
      ai_assistance_config: assignmentData.aiAssistance,
      analytics_config: assignmentData.analytics,
      workflow_config: assignmentData.workflow,
      multimedia_config: assignmentData.multimedia,
      due_date: assignmentData.dueDate?.toISOString(),
      available_from: assignmentData.availableFrom?.toISOString(),
      estimated_duration_minutes: assignmentData.estimatedDuration,
      time_limit_minutes: assignmentData.timeLimit,
      max_score: assignmentData.maxScore,
      submission_types: assignmentData.submissionTypes,
      show_grades_to_students: assignmentData.showGradesToStudents,
      group_assignment: assignmentData.groupAssignment,
      max_group_size: assignmentData.maxGroupSize,
      max_attempts: assignmentData.maxAttempts,
      peer_review: assignmentData.peerReview,
      plagiarism_check: assignmentData.plagiarismCheck,
      subject_id: assignmentData.subjectId
    };

    onSubmit(submissionData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="relative">
              <Target className="w-7 h-7 text-primary" />
              <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            Ultra-Advanced Assignment Creation
            <Badge variant="outline" className="ml-2">AI-Powered</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-8 mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
                <Target className="w-3 h-3" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center gap-1 text-xs">
                <Accessibility className="w-3 h-3" />
                Access
              </TabsTrigger>
              <TabsTrigger value="ai-features" className="flex items-center gap-1 text-xs">
                <Brain className="w-3 h-3" />
                AI
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="flex items-center gap-1 text-xs">
                <Users className="w-3 h-3" />
                Collab
              </TabsTrigger>
              <TabsTrigger value="multimedia" className="flex items-center gap-1 text-xs">
                <Video className="w-3 h-3" />
                Media
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
                <BarChart3 className="w-3 h-3" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-1 text-xs">
                <Workflow className="w-3 h-3" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1 text-xs">
                <Eye className="w-3 h-3" />
                Preview
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Assignment Details
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateAIContent('description')}
                            disabled={isAIGenerating}
                            className="ml-auto"
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            AI Generate
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="title">Assignment Title*</Label>
                          <Input
                            id="title"
                            value={assignmentData.title}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter assignment title..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={assignmentData.category} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="homework">Homework</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="presentation">Presentation</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="creative">Creative Work</SelectItem>
                              <SelectItem value="lab">Lab Work</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={assignmentData.description}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description..."
                            className="mt-1 min-h-[100px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="instructions">Detailed Instructions</Label>
                          <div className="flex gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateAIContent('instructions')}
                              disabled={isAIGenerating}
                            >
                              <Wand2 className="w-4 h-4 mr-1" />
                              AI Generate
                            </Button>
                          </div>
                          <Textarea
                            id="instructions"
                            value={assignmentData.instructions}
                            onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="Provide detailed instructions..."
                            className="min-h-[150px]"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Quick Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Subject & Class*</Label>
                          <Select value={assignmentData.subjectId} onValueChange={(value) => setAssignmentData(prev => ({ ...prev, subjectId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Due Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {assignmentData.dueDate ? assignmentData.dueDate.toDateString() : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={assignmentData.dueDate}
                                onSelect={(date) => setAssignmentData(prev => ({ ...prev, dueDate: date }))}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Max Score</Label>
                            <Input
                              type="number"
                              value={assignmentData.maxScore}
                              onChange={(e) => setAssignmentData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <Label>Duration (min)</Label>
                            <Input
                              type="number"
                              value={assignmentData.estimatedDuration}
                              onChange={(e) => setAssignmentData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Group Assignment</Label>
                            <Switch
                              checked={assignmentData.groupAssignment}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, groupAssignment: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Peer Review</Label>
                            <Switch
                              checked={assignmentData.peerReview}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, peerReview: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>AI Assistance</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.enabled}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, enabled: checked }
                              }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Accessibility Tab */}
                <TabsContent value="accessibility" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Accessibility className="w-5 h-5" />
                        Universal Design & Accessibility
                        <Badge variant="secondary">WCAG {assignmentData.accessibilityLevel}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label>WCAG Compliance Level</Label>
                        <RadioGroup 
                          value={assignmentData.accessibilityLevel}
                          onValueChange={(value) => setAssignmentData(prev => ({ ...prev, accessibilityLevel: value }))}
                          className="flex space-x-6 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id="wcag-a" />
                            <Label htmlFor="wcag-a">Level A</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="AA" id="wcag-aa" />
                            <Label htmlFor="wcag-aa">Level AA</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="AAA" id="wcag-aaa" />
                            <Label htmlFor="wcag-aaa">Level AAA</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Visual Accessibility */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Visual
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="screen-reader" className="text-sm">Screen Reader</Label>
                              <Switch
                                id="screen-reader"
                                checked={assignmentData.accessibilityFeatures.screenReader}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('screenReader', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="high-contrast" className="text-sm">High Contrast</Label>
                              <Switch
                                id="high-contrast"
                                checked={assignmentData.accessibilityFeatures.highContrast}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('highContrast', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="dyslexia" className="text-sm">Dyslexia Friendly</Label>
                              <Switch
                                id="dyslexia"
                                checked={assignmentData.accessibilityFeatures.dyslexiaFriendly}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('dyslexiaFriendly', checked)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Motor Accessibility */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MousePointer className="w-4 h-4" />
                              Motor
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="keyboard-nav" className="text-sm">Keyboard Navigation</Label>
                              <Switch
                                id="keyboard-nav"
                                checked={assignmentData.accessibilityFeatures.keyboardNav}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('keyboardNav', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="voice-control" className="text-sm">Voice Control</Label>
                              <Switch
                                id="voice-control"
                                checked={assignmentData.accessibilityFeatures.voiceControl || false}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('voiceControl', checked)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Auditory Accessibility */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Volume2 className="w-4 h-4" />
                              Auditory
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="captions" className="text-sm">Captions</Label>
                              <Switch
                                id="captions"
                                checked={assignmentData.accessibilityFeatures.captions || false}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('captions', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="sign-language" className="text-sm">Sign Language</Label>
                              <Switch
                                id="sign-language"
                                checked={assignmentData.accessibilityFeatures.signLanguage}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('signLanguage', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="audio-description" className="text-sm">Audio Description</Label>
                              <Switch
                                id="audio-description"
                                checked={assignmentData.accessibilityFeatures.audioDescription}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('audioDescription', checked)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      {/* Cognitive Support */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Cognitive Support Features
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Reduce Cognitive Load</Label>
                              <Switch
                                checked={assignmentData.accessibilityFeatures.cognitiveSupport}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('cognitiveSupport', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Alternative Formats</Label>
                              <Switch
                                checked={assignmentData.accessibilityFeatures.alternativeFormats}
                                onCheckedChange={(checked) => handleAccessibilityFeatureChange('alternativeFormats', checked)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Reading Level Adjustment</Label>
                            <Slider
                              value={[assignmentData.readingLevel || 5]}
                              onValueChange={(value) => setAssignmentData(prev => ({ ...prev, readingLevel: value[0] }))}
                              max={12}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Grade 1</span>
                              <span>Grade {assignmentData.readingLevel || 5}</span>
                              <span>Grade 12</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Features Tab */}
                <TabsContent value="ai-features" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          AI Assistant Configuration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Enable AI Assistant</Label>
                          <Switch
                            checked={assignmentData.aiAssistance.enabled}
                            onCheckedChange={(checked) => setAssignmentData(prev => ({
                              ...prev,
                              aiAssistance: { ...prev.aiAssistance, enabled: checked }
                            }))}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Smart Suggestions</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.suggestions}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, suggestions: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Real-time Feedback</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.feedback}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, feedback: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Writing Support</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.writingSupport}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, writingSupport: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Language Support</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.languageSupport}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, languageSupport: checked }
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Resource Recommendations</Label>
                            <Switch
                              checked={assignmentData.aiAssistance.resourceRecommendations}
                              onCheckedChange={(checked) => setAssignmentData(prev => ({
                                ...prev,
                                aiAssistance: { ...prev.aiAssistance, resourceRecommendations: checked }
                              }))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Academic Integrity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Plagiarism Detection</Label>
                          <Switch
                            checked={assignmentData.plagiarismCheck}
                            onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, plagiarismCheck: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>AI Content Detection</Label>
                          <Switch
                            checked={assignmentData.aiDetection}
                            onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, aiDetection: checked }))}
                          />
                        </div>

                        <div>
                          <Label>Originality Threshold</Label>
                          <Slider
                            value={[assignmentData.originalityThreshold]}
                            onValueChange={(value) => setAssignmentData(prev => ({ ...prev, originalityThreshold: value[0] }))}
                            max={100}
                            min={0}
                            step={5}
                            className="mt-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0%</span>
                            <span>{assignmentData.originalityThreshold}%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        <div>
                          <Label>AI Assistance Level for Students</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No AI Assistance</SelectItem>
                              <SelectItem value="basic">Basic Guidance</SelectItem>
                              <SelectItem value="moderate">Moderate Support</SelectItem>
                              <SelectItem value="full">Full AI Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Assignment Preview
                        <Button variant="outline" size="sm" className="ml-auto">
                          <Play className="w-4 h-4 mr-1" />
                          Student View
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border rounded-lg p-6 bg-muted/30">
                        <h3 className="text-xl font-semibold mb-2">{assignmentData.title || 'Assignment Title'}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{assignmentData.category}</Badge>
                          <Badge variant="outline">Due: {assignmentData.dueDate?.toDateString() || 'No due date'}</Badge>
                          <Badge variant="outline">{assignmentData.estimatedDuration} min</Badge>
                          <Badge variant="outline">{assignmentData.maxScore} pts</Badge>
                          {assignmentData.groupAssignment && <Badge variant="secondary">Group</Badge>}
                          {assignmentData.aiAssistance.enabled && <Badge variant="secondary">AI Assisted</Badge>}
                        </div>
                        <p className="text-muted-foreground mb-4">{assignmentData.description || 'Assignment description will appear here...'}</p>
                        
                        {assignmentData.instructions && (
                          <div>
                            <h4 className="font-medium mb-2">Instructions:</h4>
                            <div className="bg-background p-3 rounded border text-sm whitespace-pre-wrap">
                              {assignmentData.instructions}
                            </div>
                          </div>
                        )}

                        {assignmentData.accessibilityFeatures.screenReader && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <Accessibility className="w-4 h-4" />
                              <span className="text-sm font-medium">Screen Reader Optimized</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{assignmentData.accessibilityFeatures ? Object.values(assignmentData.accessibilityFeatures).filter(Boolean).length : 0}</div>
                          <div className="text-xs text-muted-foreground">Accessibility Features</div>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{assignmentData.aiAssistance.enabled ? '✓' : '✗'}</div>
                          <div className="text-xs text-muted-foreground">AI Assistance</div>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{assignmentData.rubric.criteria.length}</div>
                          <div className="text-xs text-muted-foreground">Rubric Criteria</div>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{assignmentData.submissionTypes.length}</div>
                          <div className="text-xs text-muted-foreground">Submission Types</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save as Template
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              <Sparkles className="w-4 h-4 mr-1" />
              Create Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};