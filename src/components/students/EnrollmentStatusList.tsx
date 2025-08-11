import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EnrollmentStatusList: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Enrollment management temporarily unavailable.
        </p>
      </CardContent>
    </Card>
  );
};