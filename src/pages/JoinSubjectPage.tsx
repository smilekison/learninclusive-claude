import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { JoinSubjectForm } from '@/components/students/JoinSubjectForm';
import { SubjectEnrollmentStatus } from '@/components/students/SubjectEnrollmentStatus';
import { SubjectEnrollmentInstructions } from '@/components/students/SubjectEnrollmentInstructions';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const JoinSubjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only allow students to access this page
  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This page is only accessible to students. {user?.role === 'principal' ? 'As a principal, you can manage enrollments from the Classes page.' : user?.role === 'teacher' ? 'As a teacher, you can manage subject enrollments from your Subjects page.' : 'Please log in as a student to join subjects.'}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Join a Subject</h1>
          <p className="text-muted-foreground mt-2">
            Enter your teacher's invitation code to request enrollment in a subject
          </p>
        </div>

        {/* Join Subject Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JoinSubjectForm onSuccess={() => window.location.reload()} />
          <SubjectEnrollmentStatus subjectId={""} />
        </div>

        {/* Instructions Section */}
        <SubjectEnrollmentInstructions invitationCode="MATH101" subjectName="Algebra Fundamentals" />
      </main>
    </div>
  );
};