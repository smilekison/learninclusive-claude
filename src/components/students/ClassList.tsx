import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, BookOpen, Search } from 'lucide-react';
import { Truncate } from '@/components/ui/truncate';
interface ClassListProps {
  classes: any[];
  onClassSelect: (classId: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ClassList: React.FC<ClassListProps> = ({
  classes,
  onClassSelect,
  searchTerm,
  onSearchChange
}) => {
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls: any) => (
          <Card 
            key={cls.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onClassSelect(cls.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5" />
                <Truncate lines={1} className="flex-1">{cls.name}</Truncate>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cls.description && (
                  <Truncate lines={2} className="text-sm text-muted-foreground">{cls.description}</Truncate>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {(cls.enrollment_count ?? cls.student_enrollments?.[0]?.count ?? (Array.isArray(cls.student_enrollments) ? cls.student_enrollments.length : 0) ?? 0)} students
                  </span>
                </div>
                {cls.teacher && (
                  <Badge variant="outline" className="text-xs">
                    Teacher: {cls.teacher.first_name} {cls.teacher.last_name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No classes found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No classes available'}
          </p>
        </div>
      )}
    </div>
  );
};