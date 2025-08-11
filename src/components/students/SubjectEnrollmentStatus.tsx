import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SubjectEnrollmentStatusProps {
  subjectId: string;
}

export const SubjectEnrollmentStatus: React.FC<SubjectEnrollmentStatusProps> = ({ subjectId }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">
          Subject enrollment temporarily unavailable.
        </p>
      </CardContent>
    </Card>
  );
};