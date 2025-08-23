import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { AccessibilityAuditPanel } from './AccessibilityAuditPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Eye, Ear, Hand, Brain, MonitorSpeaker, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accessibility } from 'lucide-react';

export const AccessibilityPanel: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-5 right-24 z-50 bg-primary text-primary-foreground rounded-full h-16 w-16 shadow-lg"
          aria-label="Open accessibility settings"
          title="Accessibility Settings"
        >
          <Accessibility className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </SheetTitle>
          <SheetDescription>
            Customize your experience with accessibility options and compliance tools
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="compliance">
                <Shield className="h-4 w-4 mr-2" />
                Compliance Check
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Visual & Audio Settings</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="large-targets">Large Click Targets</Label>
                  <Switch
                    id="large-targets"
                    checked={settings.largeClickTargets}
                    onCheckedChange={(checked) => updateSetting('largeClickTargets', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="focus-assistance">Focus Assistance</Label>
                  <Switch
                    id="focus-assistance"
                    checked={settings.focusAssistance}
                    onCheckedChange={(checked) => updateSetting('focusAssistance', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcementLevel">Page Announcements</Label>
                  <Select 
                    value={settings.announcementLevel} 
                    onValueChange={(value) => updateSetting('announcementLevel', value as 'none' | 'low' | 'medium' | 'high')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low (page title only)</SelectItem>
                      <SelectItem value="medium">Medium (title + headings)</SelectItem>
                      <SelectItem value="high">High (full page structure)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={resetSettings}
                >
                  Reset to Defaults
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="compliance">
              <AccessibilityAuditPanel />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};