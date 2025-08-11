import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, GraduationCap, Mail, Users, Search, Eye } from 'lucide-react';
import { Truncate } from '@/components/ui/truncate';
interface StudentListProps {
  students: any[];
  classInfo: any;
  onStudentSelect: (student: any) => void;
  onBack: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  classInfo,
  onStudentSelect,
  onBack,
  searchTerm,
  onSearchChange
}) => {
  const filteredStudents = students.filter(student => 
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Classes
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{classInfo?.name}</h2>
          <p className="text-muted-foreground">
            {filteredStudents.length} students in this class
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student: any) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 min-w-0">
                  <GraduationCap className="w-5 h-5" />
                  <Truncate lines={1} className="flex-1">{student.first_name} {student.last_name}</Truncate>
                </CardTitle>
                <Badge variant="secondary">Student</Badge>
              </div>
              <CardDescription>
                {student.disabilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {student.disabilities.map((disability: string) => (
                      <Badge key={disability} variant="outline" className="text-xs">
                        {disability.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{student.user_id || 'No email available'}</span>
                </div>
                {student.parent_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Parent: {student.parent_email}</span>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onStudentSelect(student)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No students found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No students in this class'}
          </p>
        </div>
      )}
    </div>
  );
};