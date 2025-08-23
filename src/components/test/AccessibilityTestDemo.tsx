import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedInput, EnhancedTextarea, EnhancedSelect, EnhancedCheckbox } from '@/components/accessibility/EnhancedAccessibleForm';
import { SelectItem } from '@/components/ui/select';
import { useAccessibilityAudit } from '@/hooks/useAccessibilityAudit';
import { announceToScreenReader } from '@/utils/accessibilityHelpers';

export const AccessibilityTestDemo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    priority: '',
    subscribe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  
  const { runAudit, results, isAuditing } = useAccessibilityAudit();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Please select a priority level';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitted(true);
      announceToScreenReader('Form submitted successfully!', 'polite');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          message: '',
          priority: '',
          subscribe: false
        });
        setSubmitted(false);
      }, 3000);
    } else {
      announceToScreenReader('Please correct the errors in the form', 'assertive');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Accessibility Testing Demo</h1>
        <p className="text-muted-foreground">
          This page demonstrates WCAG 2.1 AA compliant form components and accessibility features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Form */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Form Demo</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div 
                role="alert" 
                aria-live="polite"
                className="p-4 bg-success/10 text-success rounded-lg text-center"
              >
                <h3 className="font-semibold">Success!</h3>
                <p>Your message has been sent successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <EnhancedInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                  required
                  helpText="This will be used to address you in our response"
                />
                
                <EnhancedInput
                  label="Email Address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={errors.email}
                  required
                  description="We'll use this to send you a response"
                />
                
                <EnhancedSelect
                  label="Priority Level"
                  placeholder="Select priority"
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  error={errors.priority}
                  required
                  helpText="This helps us prioritize your request"
                >
                  <SelectItem value="low">Low - General inquiry</SelectItem>
                  <SelectItem value="medium">Medium - Support needed</SelectItem>
                  <SelectItem value="high">High - Urgent issue</SelectItem>
                </EnhancedSelect>
                
                <EnhancedTextarea
                  label="Message"
                  placeholder="Please describe your inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  error={errors.message}
                  required
                  rows={4}
                />
                
                <EnhancedCheckbox
                  label="Subscribe to newsletter"
                  description="Receive updates about new features and accessibility improvements"
                  checked={formData.subscribe}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, subscribe: checked }))}
                />
                
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Accessibility Status */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">WCAG 2.1 Compliance</h4>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default" className="bg-success text-success-foreground">
                  Level AA
                </Badge>
                <Badge variant="outline">
                  Semantic HTML
                </Badge>
                <Badge variant="outline">
                  Keyboard Navigation
                </Badge>
                <Badge variant="outline">
                  Screen Reader Ready
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Form Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Proper label associations</li>
                <li>✓ Error message announcements</li>
                <li>✓ Required field indication</li>
                <li>✓ Descriptive help text</li>
                <li>✓ Focus management</li>
                <li>✓ ARIA attributes</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={runAudit}
                disabled={isAuditing}
                variant="outline"
                className="w-full"
              >
                {isAuditing ? 'Running Audit...' : 'Run Accessibility Audit'}
              </Button>
              
              {results && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">
                    Last Audit: {results.violations.length === 0 ? 'No issues found' : `${results.violations.length} issues found`}
                  </p>
                  <p className="text-muted-foreground">
                    Compliance Score: {Math.round((results.passes / (results.passes + results.violations.length)) * 100)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};