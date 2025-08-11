import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface InviteCodeDisplayProps {
  enrollmentCode: string;
  className: string;
  subjectName: string;
}

export const InviteCodeDisplay: React.FC<InviteCodeDisplayProps> = ({
  enrollmentCode,
  className,
  subjectName
}) => {
  const { toast } = useToast();
  const [isCodeVisible, setIsCodeVisible] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(enrollmentCode);
      toast({
        title: "Code Copied",
        description: "Invitation code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed", 
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <QrCode className="w-5 h-5" />
          Subject Invitation Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share this code with students to let them join your subject:
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-muted rounded-lg border">
              <div className="font-mono text-lg tracking-wider text-center">
                {isCodeVisible ? enrollmentCode : '••••••••'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCodeVisible(!isCodeVisible)}
            >
              {isCodeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 text-sm">
          <Badge variant="outline">Class: {className}</Badge>
          <Badge variant="outline">Subject: {subjectName}</Badge>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Students can enter this code in their "Join Subject" section to request enrollment.
        </div>
      </CardContent>
    </Card>
  );
};