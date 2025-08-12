import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
  Users,
  BookOpen,
  Target,
  Upload,
  Edit,
  Copy,
  Share,
  Settings
} from 'lucide-react';
import { InviteCodeDisplay } from './InviteCodeDisplay';
import { LessonManager } from './LessonManager';

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  max_attempts: number;
  allowed_file_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  description: string | null;
  invitation_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class: {
    id: string;
    name: string;
    description: string | null;
    teacher: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

interface SubjectDetailViewProps {
  subject: Subject;
  classInfo?: any;
  onBack: () => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  classInfo,
  onBack
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: null as Date | null,
    max_score: 100,
    max_attempts: 3,
    allowed_file_types: [] as string[]
  });

  // Fetch assignments for this subject
  React.useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('subject_id', subject.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssignments(data || []);
      } catch (error: any) {
        console.error('Error fetching assignments:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch assignments',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (subject?.id) {
      fetchAssignments();
    }
  }, [subject?.id, toast]);

  const handleCreateAssignment = async () => {
    if (!user || !assignmentForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          subject_id: subject.id,
          title: assignmentForm.title,
          description: assignmentForm.description || null,
          due_date: assignmentForm.due_date?.toISOString() || null,
          max_score: assignmentForm.max_score,
          max_attempts: assignmentForm.max_attempts,
          allowed_file_types: assignmentForm.allowed_file_types
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment created successfully!',
      });

      setCreateAssignmentOpen(false);
      setAssignmentForm({
        title: '',
        description: '',
        due_date: null,
        max_score: 100,
        max_attempts: 3,
        allowed_file_types: []
      });
      
      // Refresh assignments
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', subject.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Button>
        </div>

        {/* Subject Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{subject.name}</h1>
              <p className="text-muted-foreground">
                {subject.class?.name} • {subject.class?.teacher?.first_name} {subject.class?.teacher?.last_name}
              </p>
            </div>
          </div>
          {subject.description && (
            <p className="text-muted-foreground mt-2">
              {subject.description}
            </p>
          )}
        </div>

        {/* Subject Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">
                {assignments.filter(a => a.is_active).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.filter(a => 
                  a.due_date && 
                  new Date(a.due_date) > new Date() && 
                  new Date(a.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{subject.class?.name}</div>
              <p className="text-xs text-muted-foreground">
                {subject.class?.teacher?.first_name} {subject.class?.teacher?.last_name}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-6">
            {/* Assignments Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>
                      Manage and track assignments for this subject
                    </CardDescription>
                  </div>
                  {user?.role === 'teacher' && (
                    <Dialog open={createAssignmentOpen} onOpenChange={setCreateAssignmentOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Assignment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Assignment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Assignment Title</Label>
                            <Input
                              id="title"
                              value={assignmentForm.title}
                              onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Enter assignment title"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={assignmentForm.description}
                              onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter assignment description"
                              rows={4}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="max_score">Max Score</Label>
                              <Input
                                id="max_score"
                                type="number"
                                min="1"
                                value={assignmentForm.max_score}
                                onChange={(e) => setAssignmentForm(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="max_attempts">Max Attempts</Label>
                              <Input
                                id="max_attempts"
                                type="number"
                                min="1"
                                value={assignmentForm.max_attempts}
                                onChange={(e) => setAssignmentForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Due Date (Optional)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !assignmentForm.due_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {assignmentForm.due_date ? format(assignmentForm.due_date, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={assignmentForm.due_date}
                                  onSelect={(date) => setAssignmentForm(prev => ({ ...prev, due_date: date }))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCreateAssignmentOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateAssignment} disabled={!assignmentForm.title.trim()}>
                              Create Assignment
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first assignment to get started
                      </p>
                      {user?.role === 'teacher' && (
                        <Button onClick={() => setCreateAssignmentOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Assignment
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {assignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{assignment.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={assignment.due_date ? 'default' : 'secondary'}>
                                  {assignment.due_date ? 'Due Date Set' : 'No Due Date'}
                                </Badge>
                                <Badge variant="outline">
                                  {assignment.max_score} points
                                </Badge>
                              </div>
                            </div>
                            {assignment.description && (
                              <CardDescription>{assignment.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                {assignment.due_date && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  <span>Max {assignment.max_attempts} attempts</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Created {new Date(assignment.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <LessonManager subjectId={subject.id} subjectName={subject.name} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Settings</CardTitle>
                <CardDescription>
                  Manage subject configuration and student access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <InviteCodeDisplay 
                  enrollmentCode={subject.invitation_code} 
                  className={subject.class?.name || 'Class'}
                  subjectName={subject.name}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};