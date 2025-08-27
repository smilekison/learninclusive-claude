import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, X, Check, Crown, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AdvancedGroupCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  onGroupCreated: (group: any) => void;
}

export const AdvancedGroupCreationDialog: React.FC<AdvancedGroupCreationDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  onGroupCreated
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [maxMembers, setMaxMembers] = useState(assignment?.max_group_size || 4);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [existingGroups, setExistingGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    if (open && assignment) {
      loadClassmatesAndGroups();
      loadCurrentUserProfile();
    }
  }, [open, assignment]);

  const loadCurrentUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      setCurrentUserProfile(profile);
      if (profile) {
        setSelectedStudents([profile.id]); // Auto-select current user
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadClassmatesAndGroups = async () => {
    if (!assignment?.subject_id) return;
    
    setLoading(true);
    try {
      // Get all students enrolled in the same class as this assignment's subject
      const { data: classmates, error: classmatesError } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          profiles:student_id (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .eq('status', 'active')
        .eq('class_id', (
          await supabase
            .from('subjects')
            .select('class_id')
            .eq('id', assignment.subject_id)
            .single()
        ).data?.class_id);

      if (classmatesError) throw classmatesError;

      // Filter out students who are already in groups for this assignment
      const { data: existingMemberships } = await supabase
        .from('assignment_group_memberships')
        .select(`
          student_id,
          group_id
        `)
        .eq('is_active', true);

      // Get group IDs for this assignment
      const { data: assignmentGroups } = await supabase
        .from('assignment_groups')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('is_active', true);

      const assignmentGroupIds = assignmentGroups?.map(g => g.id) || [];
      const studentsInGroups = existingMemberships
        ?.filter(m => assignmentGroupIds.includes(m.group_id))
        ?.map(m => m.student_id) || [];

      const availableClassmates = classmates
        ?.filter(c => c.profiles && !studentsInGroups.includes(c.student_id))
        ?.map(c => c.profiles) || [];

      setAvailableStudents(availableClassmates);

      // Load existing groups for this assignment
      const { data: groups } = await supabase
        .from('assignment_groups')
        .select(`
          *,
          assignment_group_memberships (
            student_id,
            role,
            profiles:student_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('assignment_id', assignment.id)
        .eq('is_active', true);

      setExistingGroups(groups || []);

    } catch (error) {
      console.error('Error loading classmates and groups:', error);
      toast({
        title: "Error",
        description: "Failed to load classmates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => {
      // Don't allow removing current user
      if (studentId === currentUserProfile?.id && prev.includes(studentId)) {
        return prev;
      }
      
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        if (prev.length >= maxMembers) {
          toast({
            title: "Group Full",
            description: `Maximum ${maxMembers} members allowed per group.`,
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name.",
        variant: "destructive"
      });
      return;
    }

    if (selectedStudents.length < 2) {
      toast({
        title: "Error", 
        description: "Group must have at least 2 members.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('assignment_groups')
        .insert({
          name: groupName,
          assignment_id: assignment.id,
          created_by: currentUserProfile?.id,
          max_members: maxMembers,
          is_active: true
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members to the group
      const memberships = selectedStudents.map((studentId, index) => ({
        group_id: group.id,
        student_id: studentId,
        role: studentId === currentUserProfile?.id ? 'leader' : 'member',
        is_active: true
      }));

      const { error: membershipError } = await supabase
        .from('assignment_group_memberships')
        .insert(memberships);

      if (membershipError) throw membershipError;

      toast({
        title: "Success",
        description: `Group "${groupName}" created successfully!`
      });

      onGroupCreated(group);
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setGroupName('');
    setSelectedStudents(currentUserProfile ? [currentUserProfile.id] : []);
    setMaxMembers(assignment?.max_group_size || 4);
  };

  const getSelectedStudentNames = () => {
    return selectedStudents
      .map(id => {
        const student = availableStudents.find(s => s.id === id);
        return student ? `${student.first_name} ${student.last_name}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5 text-primary" />
            Create Study Group - {assignment?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto p-1">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">Group Details</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">Select Members</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">Review & Create</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Group Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter a creative group name..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMembers">Maximum Members</Label>
                    <Select 
                      value={maxMembers.toString()} 
                      onValueChange={(value) => setMaxMembers(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {[2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} members
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Show existing groups */}
              {existingGroups.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Existing Groups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingGroups.map((group) => (
                        <div key={group.id} className="p-3 border rounded-lg bg-muted/50">
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {group.assignment_group_memberships?.length || 0} / {group.max_members} members
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {group.assignment_group_memberships?.map((member: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Your Team Members</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose classmates to join your group ({selectedStudents.length}/{maxMembers} selected)
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading classmates...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id);
                      const isCurrentUser = student.id === currentUserProfile?.id;
                      
                      return (
                        <div
                          key={student.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          } ${isCurrentUser ? 'ring-2 ring-primary/20' : ''}`}
                          onClick={() => handleStudentToggle(student.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className={isSelected ? 'bg-primary text-primary-foreground' : ''}>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                  {student.first_name} {student.last_name}
                                </p>
                                {isCurrentUser && <Crown className="w-4 h-4 text-yellow-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground">Student</p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {availableStudents.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No available classmates to form a group with.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Your Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Group Name</Label>
                  <p className="text-lg font-medium mt-1">{groupName}</p>
                </div>
                <div>
                  <Label>Members ({selectedStudents.length}/{maxMembers})</Label>
                  <div className="mt-2 space-y-2">
                    {selectedStudents.map((studentId) => {
                      const student = availableStudents.find(s => s.id === studentId);
                      const isLeader = studentId === currentUserProfile?.id;
                      
                      return student ? (
                        <div key={studentId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {isLeader ? 'Group Leader' : 'Member'}
                              </p>
                            </div>
                          </div>
                          {isLeader && <Crown className="w-4 h-4 text-yellow-500" />}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  onOpenChange(false);
                  resetForm();
                }
              }}
            >
              {step > 1 ? 'Previous' : 'Cancel'}
            </Button>

            <Button
              onClick={() => {
                if (step < 3) {
                  if (step === 1 && !groupName.trim()) {
                    toast({
                      title: "Error",
                      description: "Please enter a group name.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setStep(step + 1);
                } else {
                  createGroup();
                }
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : step < 3 ? 'Next' : 'Create Group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};