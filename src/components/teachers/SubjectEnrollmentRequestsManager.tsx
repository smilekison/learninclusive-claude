import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubjectEnrollmentRequestsManagerProps {
  subjectId?: string;
  showPendingOnly?: boolean;
}

export const SubjectEnrollmentRequestsManager: React.FC<SubjectEnrollmentRequestsManagerProps> = ({
  subjectId,
  showPendingOnly = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Enrollment request management temporarily unavailable.
        </p>
      </CardContent>
    </Card>
  );
};