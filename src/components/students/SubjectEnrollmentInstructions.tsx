import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, BookOpen, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubjectEnrollmentInstructionsProps {
  invitationCode?: string;
  subjectName?: string;
}

export const SubjectEnrollmentInstructions: React.FC<SubjectEnrollmentInstructionsProps> = ({
  invitationCode = "MATH101",
  subjectName = "Algebra Fundamentals"
}) => {
  const { toast } = useToast();
  const [demoCode, setDemoCode] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Invitation code copied to clipboard",
    });
  };

  const handleDemoEnrollment = () => {
    if (demoCode === invitationCode) {
      toast({
        title: "Success!",
        description: "Demo enrollment request submitted successfully",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter the correct invitation code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Enrollment Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to request enrollment in a subject
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-primary pl-4">
            <h4 className="font-semibold text-primary mb-2">How to Enroll:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Get the invitation code from your teacher</li>
              <li>Click the "Join Subject" button on your dashboard</li>
              <li>Enter the invitation code provided by your teacher</li>
              <li>Click "Request Enrollment"</li>
              <li>Wait for teacher approval</li>
              <li>You'll receive a notification once approved</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Demo Section */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            Demo: Try Enrollment Process
          </CardTitle>
          <CardDescription>
            Use the demo invitation code below to test the enrollment flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Demo Subject: {subjectName}</p>
                <p className="text-sm text-muted-foreground">Teacher: Sarah Johnson (Principal)</p>
              </div>
              <Badge variant="secondary">Demo</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Demo Invitation Code:</Label>
            <div className="flex items-center gap-2">
              <Input
                value={invitationCode}
                readOnly
                className="font-mono text-center bg-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(invitationCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this code and use it in the enrollment form
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-code">Try entering the code:</Label>
            <div className="flex gap-2">
              <Input
                id="demo-code"
                placeholder="Enter the invitation code..."
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button onClick={handleDemoEnrollment}>
                Test Enrollment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Status Examples</CardTitle>
          <CardDescription>
            Different states your enrollment requests can have
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="font-medium">Mathematics Advanced</p>
                <p className="text-sm text-muted-foreground">Teacher: Dr. Smith</p>
              </div>
            </div>
            <Badge variant="outline" className="text-yellow-600">
              Pending
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">English Literature</p>
                <p className="text-sm text-muted-foreground">Teacher: Ms. Johnson</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-green-600">
              Approved
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium">Physics Advanced</p>
                <p className="text-sm text-muted-foreground">Teacher: Mr. Wilson</p>
                <p className="text-xs text-red-600">Prerequisites not met</p>
              </div>
            </div>
            <Badge variant="destructive">
              Denied
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};