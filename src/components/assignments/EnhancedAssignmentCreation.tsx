import React, { useState } from 'react';
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
import { 
  Target, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Award, 
  Clock, 
  BookOpen,
  Plus,
  Trash2,
  GraduationCap,
  BarChart3,
  Eye,
  Shield,
  Sparkles,
  Brain,
  CheckCircle,
  Upload,
  Link2 as Link,
  Video,
  Code
} from 'lucide-react';

interface EnhancedAssignmentCreationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  subjectId?: string;
}

export const EnhancedAssignmentCreation: React.FC<EnhancedAssignmentCreationProps> = ({
  open,
  onOpenChange,
  onSubmit,
  subjectId
}) => {
  const [activeTab, setActiveTab] = useState('basics');
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    maxScore: 100,
    dueDate: '',
    submissionTypes: ['text'],
    groupAssignment: false,
    maxAttempts: 1,
    showGradesToStudents: true,
    enablePeerReview: false,
    plagiarismCheck: true,
    allowLateSubmissions: false,
    timeLimit: null,
    resources: [],
    rubric: {
      criteria: [
        { name: 'Content Quality', maxPoints: 40, description: 'Accuracy and depth of content' },
        { name: 'Organization', maxPoints: 30, description: 'Structure and clarity of presentation' },
        { name: 'Grammar & Style', maxPoints: 20, description: 'Language usage and writing mechanics' },
        { name: 'Creativity', maxPoints: 10, description: 'Original thinking and innovation' }
      ]
    },
    aiAssistance: {
      enabled: true,
      provideFeedback: true,
      suggestResources: true,
      grammarCheck: true
    },
    analytics: {
      trackTimeSpent: true,
      trackViewCount: true,
      generateInsights: true
    }
  });

  const submissionTypeOptions = [
    { value: 'text', label: 'Text Entry', icon: FileText },
    { value: 'file', label: 'File Upload', icon: Upload },
    { value: 'url', label: 'Website URL', icon: Link },
    { value: 'media', label: 'Media Upload', icon: Video },
    { value: 'code', label: 'Code Submission', icon: Code }
  ];

  const addRubricCriterion = () => {
    setAssignmentData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        criteria: [
          ...prev.rubric.criteria,
          { name: '', maxPoints: 10, description: '' }
        ]
      }
    }));
  };

  const removeRubricCriterion = (index: number) => {
    setAssignmentData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        criteria: prev.rubric.criteria.filter((_, i) => i !== index)
      }
    }));
  };

  const addResource = () => {
    setAssignmentData(prev => ({
      ...prev,
      resources: [
        ...prev.resources,
        { type: 'link', title: '', url: '', description: '' }
      ]
    }));
  };

  const handleSubmit = () => {
    onSubmit({ ...assignmentData, subjectId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Create Advanced Assignment
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basics" className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3 h-3" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="submission" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Submission
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-1 text-xs">
              <Award className="w-3 h-3" />
              Grading
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3 h-3" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="ai-features" className="flex items-center gap-1 text-xs">
              <Brain className="w-3 h-3" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1 text-xs">
              <Eye className="w-3 h-3" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="overflow-auto p-6 space-y-6">
            <TabsContent value="basics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Assignment Details
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
                      <Label htmlFor="description">Description*</Label>
                      <Textarea
                        id="description"
                        value={assignmentData.description}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the assignment..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Detailed Instructions*</Label>
                      <Textarea
                        id="instructions"
                        value={assignmentData.instructions}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Provide detailed instructions for students..."
                        className="mt-1 min-h-[150px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Basic Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxScore">Max Score*</Label>
                        <Input
                          id="maxScore"
                          type="number"
                          value={assignmentData.maxScore}
                          onChange={(e) => setAssignmentData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxAttempts">Max Attempts</Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          value={assignmentData.maxAttempts}
                          onChange={(e) => setAssignmentData(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={assignmentData.dueDate}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Group Assignment</Label>
                          <p className="text-sm text-muted-foreground">Allow students to work in groups</p>
                        </div>
                        <Switch
                          checked={assignmentData.groupAssignment}
                          onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, groupAssignment: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Show Grades to Students</Label>
                          <p className="text-sm text-muted-foreground">Students can see their scores</p>
                        </div>
                        <Switch
                          checked={assignmentData.showGradesToStudents}
                          onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, showGradesToStudents: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Allow Late Submissions</Label>
                          <p className="text-sm text-muted-foreground">Accept submissions after due date</p>
                        </div>
                        <Switch
                          checked={assignmentData.allowLateSubmissions}
                          onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, allowLateSubmissions: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="submission" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Submission Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {submissionTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = assignmentData.submissionTypes.includes(option.value);
                      return (
                        <div
                          key={option.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                          }`}
                          onClick={() => {
                            setAssignmentData(prev => ({
                              ...prev,
                              submissionTypes: isSelected
                                ? prev.submissionTypes.filter(t => t !== option.value)
                                : [...prev.submissionTypes, option.value]
                            }));
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              {isSelected && <CheckCircle className="w-4 h-4 text-primary mt-1" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Grading Rubric
                  </CardTitle>
                  <Button onClick={addRubricCriterion} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Criterion
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignmentData.rubric.criteria.map((criterion, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            placeholder="Criterion name"
                            value={criterion.name}
                            onChange={(e) => {
                              const newCriteria = [...assignmentData.rubric.criteria];
                              newCriteria[index].name = e.target.value;
                              setAssignmentData(prev => ({
                                ...prev,
                                rubric: { ...prev.rubric, criteria: newCriteria }
                              }));
                            }}
                          />
                          <Input
                            type="number"
                            placeholder="Max points"
                            value={criterion.maxPoints}
                            onChange={(e) => {
                              const newCriteria = [...assignmentData.rubric.criteria];
                              newCriteria[index].maxPoints = parseInt(e.target.value);
                              setAssignmentData(prev => ({
                                ...prev,
                                rubric: { ...prev.rubric, criteria: newCriteria }
                              }));
                            }}
                          />
                          <Input
                            placeholder="Description"
                            value={criterion.description}
                            onChange={(e) => {
                              const newCriteria = [...assignmentData.rubric.criteria];
                              newCriteria[index].description = e.target.value;
                              setAssignmentData(prev => ({
                                ...prev,
                                rubric: { ...prev.rubric, criteria: newCriteria }
                              }));
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRubricCriterion(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-features" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI-Powered Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Writing Assistant</Label>
                        <p className="text-sm text-muted-foreground">Help students with writing and suggestions</p>
                      </div>
                      <Switch
                        checked={assignmentData.aiAssistance.enabled}
                        onCheckedChange={(checked) => setAssignmentData(prev => ({
                          ...prev,
                          aiAssistance: { ...prev.aiAssistance, enabled: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Automatic Plagiarism Check</Label>
                        <p className="text-sm text-muted-foreground">Scan submissions for originality</p>
                      </div>
                      <Switch
                        checked={assignmentData.plagiarismCheck}
                        onCheckedChange={(checked) => setAssignmentData(prev => ({ ...prev, plagiarismCheck: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Grammar Check</Label>
                        <p className="text-sm text-muted-foreground">Automatically check grammar and style</p>
                      </div>
                      <Switch
                        checked={assignmentData.aiAssistance.grammarCheck}
                        onCheckedChange={(checked) => setAssignmentData(prev => ({
                          ...prev,
                          aiAssistance: { ...prev.aiAssistance, grammarCheck: checked }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Assignment Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{assignmentData.title || 'Assignment Title'}</h3>
                      <p className="text-muted-foreground">{assignmentData.description || 'Assignment description'}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{assignmentData.maxScore} points</Badge>
                      {assignmentData.dueDate && (
                        <Badge variant="secondary">Due: {new Date(assignmentData.dueDate).toLocaleDateString()}</Badge>
                      )}
                      {assignmentData.groupAssignment && <Badge>Group Assignment</Badge>}
                      {assignmentData.aiAssistance.enabled && <Badge className="bg-purple-100 text-purple-800">AI Assisted</Badge>}
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Instructions:</h4>
                      <p className="text-sm whitespace-pre-wrap">{assignmentData.instructions || 'Detailed instructions will appear here...'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab('preview')}>
              Preview
            </Button>
            <Button onClick={handleSubmit} className="bg-primary">
              <Target className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};