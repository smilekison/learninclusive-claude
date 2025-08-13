import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PrincipalDashboardReal } from '@/components/dashboards/PrincipalDashboardReal';
import { TeacherDashboardReal } from '@/components/dashboards/TeacherDashboardReal';
import { StudentDashboardReal } from '@/components/dashboards/StudentDashboardReal';
import { ParentDashboardReal } from '@/components/dashboards/ParentDashboardReal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // This should not happen due to route protection
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'principal':
        return <PrincipalDashboardReal />;
      case 'teacher':
        return <TeacherDashboardReal />;
      case 'student':
        return <StudentDashboardReal />;
      case 'parent':
        return <ParentDashboardReal />;
      default:
        return (
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-destructive">
              Unknown user role: {user.role}
            </h1>
          </div>
        );
    }
  };

  return renderDashboard();
};