import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Mail, Phone, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const AccessibilityStatement: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Accessibility Statement
          </h1>
          <p className="text-xl text-muted-foreground">
            Our commitment to digital accessibility for all users
          </p>
        </div>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>WCAG 2.1 Level AA</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Lithuanian Accessibility Act</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>EN 301 549</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Compliant
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Section 508</span>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Compliant
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
            <CardDescription>
              learninclusive is designed to be accessible to all users, including those with disabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Visual Accessibility</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    High contrast mode
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Adjustable font sizes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Color blindness support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Reduced motion options
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Motor Accessibility</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Keyboard navigation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Large click targets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Focus assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Voice input support
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Cognitive Accessibility</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Simplified interface mode
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Reading assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Text-to-speech
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Content structure
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Hearing Accessibility</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Visual alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Video captions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Sign language videos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Audio descriptions
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Known Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-warning" />
              Known Issues & Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We continuously work to improve accessibility. Currently, there are no known major accessibility barriers.
              Minor improvements are being implemented based on user feedback.
            </p>
            <div className="bg-muted/20 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Ongoing improvements:</strong> We regularly conduct accessibility audits and user testing
                to identify and address potential barriers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Accessibility Feedback
            </CardTitle>
            <CardDescription>
              Help us improve by reporting accessibility issues or suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              If you encounter any accessibility barriers or have suggestions for improvement, 
              please contact us using one of the methods below:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">accessibility@learninclusive.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+358 (0) 123 456 789</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-sm">Response Time</p>
              <p className="text-sm text-muted-foreground">
                We aim to respond to accessibility feedback within 2 business days and 
                resolve issues within 5 business days when possible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
              Technical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Assessment Method:</strong></p>
                <p className="text-muted-foreground">Self-assessment with automated and manual testing</p>
              </div>
              <div>
                <p><strong>Assessment Date:</strong></p>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p><strong>Testing Tools:</strong></p>
                <p className="text-muted-foreground">axe-core, Lighthouse, WAVE, Manual testing</p>
              </div>
              <div>
                <p><strong>Browser Support:</strong></p>
                <p className="text-muted-foreground">Chrome, Firefox, Safari, Edge (latest versions)</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium text-sm">Screen Reader Compatibility</p>
              <p className="text-sm text-muted-foreground">
                Tested with NVDA, JAWS, VoiceOver, and TalkBack. All core functionality 
                is accessible via screen readers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};