import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Filter, Users, GraduationCap, Edit, Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Truncate } from '@/components/ui/truncate';
interface SubjectFiltersProps {
  subjects: any[];
  classes: any[];
  onSubjectSelect: (subject: any) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  classFilter: string;
  onClassFilterChange: (value: string) => void;
  teacherFilter: string;
  onTeacherFilterChange: (value: string) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onToggleSubjectStatus?: (subjectId: string, currentStatus: boolean) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

export const SubjectFilters: React.FC<SubjectFiltersProps> = ({
  subjects,
  classes,
  onSubjectSelect,
  searchTerm,
  onSearchChange,
  classFilter,
  onClassFilterChange,
  teacherFilter,
  onTeacherFilterChange,
  onDeleteSubject,
  onToggleSubjectStatus,
  statusFilter = 'all',
  onStatusFilterChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Get unique teachers from classes
  const teachers = classes.reduce((acc: any[], cls: any) => {
    if (cls.teacher && !acc.find(t => t.id === cls.teacher.id)) {
      acc.push(cls.teacher);
    }
    return acc;
  }, []);

  // Filter subjects based on all criteria
  const filteredSubjects = subjects.filter((subject: any) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = classFilter === 'all-classes' || !classFilter || subject.class_id === classFilter;
    
    const relatedClass = classes.find((cls: any) => cls.id === subject.class_id);
    const matchesTeacher = teacherFilter === 'all-teachers' || !teacherFilter || relatedClass?.teacher?.id === teacherFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && subject.is_active !== false) ||
      (statusFilter === 'inactive' && subject.is_active === false);
    
    return matchesSearch && matchesClass && matchesTeacher && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
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
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            {/* Class Filter */}
            <Select value={classFilter} onValueChange={onClassFilterChange}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all-classes">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Teacher Filter */}
            <Select value={teacherFilter} onValueChange={onTeacherFilterChange}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all-teachers">All Teachers</SelectItem>
                {teachers.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || (classFilter && classFilter !== 'all-classes') || (teacherFilter && teacherFilter !== 'all-teachers') || statusFilter !== 'all') && (
            <div className="mt-4 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSearchChange('');
                  onClassFilterChange('all-classes');
                  onTeacherFilterChange('all-teachers');
                  onStatusFilterChange?.('all');
                }}
                className="border-border"
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
          Showing {filteredSubjects.length} of {subjects.length} subjects
        </p>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject: any) => {
          const relatedClass = classes.find((cls: any) => cls.id === subject.class_id);
          return (
            <Card 
              key={subject.id} 
              className="hover:shadow-md transition-shadow border-border bg-card flex flex-col"
            >
              <CardHeader onClick={() => onSubjectSelect(subject)} className="cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-card-foreground min-w-0">
                    <BookOpen className="w-5 h-5" />
                    <Truncate lines={1} className="flex-1">{subject.name}</Truncate>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary">{relatedClass?.name}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <div className="flex flex-col gap-3 flex-1">
                  {subject.description && (
                    <Truncate lines={2} className="text-sm text-muted-foreground">{subject.description}</Truncate>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground min-w-0">
                      <Users className="w-4 h-4" />
                      <Truncate lines={1} className="flex-1">Class: {relatedClass?.name}</Truncate>
                    </div>
                    
                    {relatedClass?.teacher && (
                      <div className="flex items-center gap-2 text-sm text-foreground min-w-0">
                        <GraduationCap className="w-4 h-4" />
                        <Truncate lines={1} className="flex-1">Teacher: {relatedClass.teacher.first_name} {relatedClass.teacher.last_name}</Truncate>
                      </div>
                    )}

                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{subject.class?.student_enrollments?.[0]?.count || 0} students</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-border">
                      ID: {subject.id.slice(0, 8)}
                    </Badge>
                  </div>

                  {user?.role === 'principal' && (
                    <div className="mt-auto flex items-center gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSubjectStatus?.(subject.id, subject.is_active);
                        }}
                      >
                        {subject.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add edit functionality here
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSubject?.(subject.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">No subjects found</h3>
          <p className="text-muted-foreground">
            {searchTerm || (classFilter && classFilter !== 'all-classes') || (teacherFilter && teacherFilter !== 'all-teachers') 
              ? 'Try adjusting your filters' 
              : 'No subjects available'
            }
          </p>
        </div>
      )}
    </div>
  );
};