import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Filter, Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssignmentFiltersProps {
  assignments: any[];
  subjects: any[];
  classes: any[];
  onAssignmentSelect: (assignment: any) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  classFilter: string;
  onClassFilterChange: (value: string) => void;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  assignments,
  subjects,
  classes,
  onAssignmentSelect,
  searchTerm,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  classFilter,
  onClassFilterChange
}) => {
  // Helper functions to get display text
  const getSubjectDisplayText = () => {
    if (subjectFilter === 'all-subjects' || !subjectFilter) return 'All Subjects';
    const selectedSubject = subjects.find((subject: any) => subject.id === subjectFilter);
    return selectedSubject ? selectedSubject.name : 'All Subjects';
  };

  const getClassDisplayText = () => {
    if (classFilter === 'all-classes' || !classFilter) return 'All Classes';
    const selectedClass = classes.find((cls: any) => cls.id === classFilter);
    return selectedClass ? selectedClass.name : 'All Classes';
  };

  const getStatusDisplayText = () => {
    switch (statusFilter) {
      case 'all-status': return 'All Status';
      case 'upcoming': return 'Upcoming';
      case 'due-soon': return 'Due Soon';
      case 'overdue': return 'Overdue';
      case 'no-due-date': return 'No Due Date';
      default: return 'All Status';
    }
  };

  const getAssignmentStatus = (dueDate: string | null) => {
    if (!dueDate) return 'no-due-date';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return 'upcoming';
  };

  // Filter assignments based on all criteria
  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'all-subjects' || !subjectFilter || assignment.subject_id === subjectFilter;
    
    const relatedSubject = subjects.find((subject: any) => subject.id === assignment.subject_id);
    const relatedClass = relatedSubject ? classes.find((cls: any) => cls.id === relatedSubject.class_id) : null;
    const matchesClass = classFilter === 'all-classes' || !classFilter || relatedClass?.id === classFilter;
    
    const assignmentStatus = getAssignmentStatus(assignment.due_date);
    const matchesStatus = statusFilter === 'all-status' || !statusFilter || assignmentStatus === statusFilter;
    
    return matchesSearch && matchesSubject && matchesClass && matchesStatus;
  });

  const getStatusBadge = (dueDate: string | null) => {
    if (!dueDate) return <Badge variant="secondary">No due date</Badge>;
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return <Badge variant="destructive">Overdue</Badge>;
    if (diffDays <= 3) return <Badge variant="destructive">Due soon</Badge>;
    if (diffDays <= 7) return <Badge variant="default">Due this week</Badge>;
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={onSubjectFilterChange}>
              <SelectTrigger>
                <SelectValue>
                  {getSubjectDisplayText()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all-subjects">All Subjects</SelectItem>
                {subjects.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={classFilter} onValueChange={onClassFilterChange}>
              <SelectTrigger>
                <SelectValue>
                  {getClassDisplayText()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all-classes">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue>
                  {getStatusDisplayText()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all-status">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="due-soon">Due Soon</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="no-due-date">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || (subjectFilter && subjectFilter !== 'all-subjects') || (classFilter && classFilter !== 'all-classes') || (statusFilter && statusFilter !== 'all-status')) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  onSubjectFilterChange('all-subjects');
                  onClassFilterChange('all-classes');
                  onStatusFilterChange('all-status');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </p>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment: any) => {
          const relatedSubject = subjects.find((subject: any) => subject.id === assignment.subject_id);
          const relatedClass = relatedSubject ? classes.find((cls: any) => cls.id === relatedSubject.class_id) : null;
          
          return (
            <Card 
              key={assignment.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onAssignmentSelect(assignment)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {assignment.title}
                  </CardTitle>
                  {getStatusBadge(assignment.due_date)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span>Subject: {relatedSubject?.name}</span>
                    </div>
                    
                    {relatedClass && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" />
                        <span>Class: {relatedClass.name}</span>
                      </div>
                    )}

                    {assignment.due_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Max Score: {assignment.max_score} points</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {assignment.id.slice(0, 8)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
          <p className="text-muted-foreground">
            {searchTerm || (subjectFilter && subjectFilter !== 'all-subjects') || (classFilter && classFilter !== 'all-classes') || (statusFilter && statusFilter !== 'all-status')
              ? 'Try adjusting your filters' 
              : 'No assignments available'
            }
          </p>
        </div>
      )}
    </div>
  );
};