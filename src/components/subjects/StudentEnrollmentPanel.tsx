import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Users, X, Search, Mail } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  parent_email?: string;
}

interface EnrolledStudent extends Student {
  enrolled_at: string;
  status: string;
}

interface StudentEnrollmentPanelProps {
  subjectId: string;
  classId: string;
}

export const StudentEnrollmentPanel: React.FC<StudentEnrollmentPanelProps> = ({
  subjectId,
  classId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [inviteByEmailOpen, setInviteByEmailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Fetch enrolled students
  const fetchEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          *,
          student:profiles!student_id(
            id,
            first_name,
            last_name,
            parent_email
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (error) throw error;

      const students = data?.map(enrollment => ({
        id: enrollment.student.id,
        first_name: enrollment.student.first_name,
        last_name: enrollment.student.last_name,
        parent_email: enrollment.student.parent_email,
        enrolled_at: enrollment.enrolled_at,
        status: enrollment.status
      })) || [];

      setEnrolledStudents(students);
    } catch (error: any) {
      console.error('Error fetching enrolled students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch enrolled students',
        variant: 'destructive',
      });
    }
  };

  // Fetch available students (not enrolled in this class)
  const fetchAvailableStudents = async () => {
    try {
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, parent_email')
        .eq('role', 'student')
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      // Get already enrolled student IDs
      const enrolledIds = enrolledStudents.map(s => s.id);
      
      // Filter out already enrolled students
      const available = allStudents?.filter(student => 
        !enrolledIds.includes(student.id) &&
        (searchTerm === '' || 
         `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
      ) || [];

      setAvailableStudents(available);
    } catch (error: any) {
      console.error('Error fetching available students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available students',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, [classId]);

  useEffect(() => {
    if (addStudentOpen) {
      fetchAvailableStudents();
    }
  }, [addStudentOpen, enrolledStudents, searchTerm]);

  const handleEnrollStudent = async (studentId: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: studentId,
          class_id: classId,
          status: 'active'
        });

      if (error) throw error;

      // Find the student details
      const student = availableStudents.find(s => s.id === studentId);
      
      toast({
        title: 'Student Enrolled',
        description: `${student?.first_name} ${student?.last_name} has been enrolled successfully`,
      });

      // Refresh data
      await fetchEnrolledStudents();
      setAddStudentOpen(false);
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll student',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInviteEmail = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setIsLoading(true);

      // Create enrollment link (you can customize this URL)
      const enrollmentLink = `${window.location.origin}/enroll-subject?subject=${subjectId}&email=${encodeURIComponent(inviteEmail)}`;

      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: inviteEmail,
          inviteType: 'subject_enrollment',
          subjectId: subjectId,
          enrollmentLink: enrollmentLink
        }
      });

      if (error) throw error;

      toast({
        title: 'Invitation Sent',
        description: `Enrollment invitation sent to ${inviteEmail}`,
      });

      setInviteByEmailOpen(false);
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('student_enrollments')
        .update({ status: 'inactive' })
        .eq('student_id', studentId)
        .eq('class_id', classId);

      if (error) throw error;

      const student = enrolledStudents.find(s => s.id === studentId);
      
      toast({
        title: 'Student Removed',
        description: `${student?.first_name} ${student?.last_name} has been removed from the class`,
      });

      // Refresh data
      await fetchEnrolledStudents();
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove student',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enrolled Students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students ({enrolledStudents.length})
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Existing Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Existing Student</DialogTitle>
                  </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search Students</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {availableStudents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No available students found</p>
                        </div>
                      ) : (
                        availableStudents.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {student.first_name} {student.last_name}
                              </p>
                              {student.parent_email && (
                                <p className="text-sm text-muted-foreground">
                                  {student.parent_email}
                                </p>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleEnrollStudent(student.id)}
                              disabled={isLoading}
                            >
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={inviteByEmailOpen} onOpenChange={setInviteByEmailOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Invite by Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Student by Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inviteEmail">Student Email</Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="student@example.com"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      The student will receive an email with a link to enroll in this subject.
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setInviteByEmailOpen(false);
                          setInviteEmail('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSendInviteEmail}
                        disabled={!inviteEmail.trim() || isLoading}
                      >
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {enrolledStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students enrolled yet</p>
                  <p className="text-sm">Add students to get started</p>
                </div>
              ) : (
                enrolledStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      {student.parent_email && (
                        <p className="text-sm text-muted-foreground">
                          {student.parent_email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Active
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRemoveStudent(student.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};