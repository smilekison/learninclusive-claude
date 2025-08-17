import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useClasses, useProfiles } from '@/hooks/useSupabaseQuery';
import { 
  GraduationCap, 
  Menu, 
  Search, 
  Filter, 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import usePresence from '@/hooks/usePresence';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useLocation } from 'react-router-dom';
import { RoutePresenceBadge } from './RoutePresenceBadge';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export const TopNavbar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const location = useLocation();
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useProfiles('teacher');
  const presence = usePresence();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');

  if (!user) return null;

  const isCollapsed = state === "collapsed";
  const currentPage = location.pathname;
  
  // Always show navbar for consistency

  // Calculate quick stats for display
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;
  const activeClasses = classes.filter((cls: any) => cls.enrollment_count > 0).length;

  const getPageTitle = () => {
    switch (currentPage) {
      case '/dashboard': return t('nav.dashboard');
      case '/insights': return t('header.insightsAnalytics');
      case '/subjects': return t('header.subjectManagement');
      case '/assignments': return t('header.assignmentCenter');
      case '/students': return t('header.studentManagement');
      case '/submissions': return t('header.submissionReview');
      default: return t('header.learningManagement');
    }
  };

  const getQuickStats = () => {
    if (user.role === 'principal') {
      return [
        { label: t('stats.teachers'), value: totalTeachers, icon: Users, color: 'text-blue-600' },
        { label: t('stats.classes'), value: totalClasses, icon: GraduationCap, color: 'text-green-600' },
        { label: t('common.active'), value: activeClasses, icon: TrendingUp, color: 'text-purple-600' }
      ];
    } else if (user.role === 'teacher') {
      const myClasses = classes.filter((cls: any) => cls.teacher?.id === user.id);
      const myStudents = myClasses.reduce((total: number, cls: any) => total + (cls.enrollment_count || 0), 0);
      return [
        { label: t('stats.myClasses'), value: myClasses.length, icon: BookOpen, color: 'text-blue-600' },
        { label: t('stats.students'), value: myStudents, icon: Users, color: 'text-green-600' },
        { label: t('common.active'), value: myClasses.length, icon: TrendingUp, color: 'text-purple-600' }
      ];
    }
    return [];
  };

  const quickStats = getQuickStats();

  return (
    <header className="h-16 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side - Logo, Title and Quick Stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <SidebarTrigger className="p-2" />
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <div>
                <span className="font-semibold text-primary hidden sm:block">
                  {t("app.shortName")}
                </span>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {getPageTitle()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats - Only show for insights or dashboard pages */}
          {(currentPage === '/insights' || currentPage === '/dashboard') && quickStats.length > 0 && (
            <div className="hidden lg:flex items-center space-x-4">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-lg">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <p className="text-sm font-medium">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center - Search and Filters for specific pages */}
        {(currentPage === '/insights' || currentPage === '/subjects' || currentPage === '/students') && (
          <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md mx-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.quickSearch")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            
            {user.role === 'principal' && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allClasses")}</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Right side - Language switcher, User info, Presence and Notifications */}
        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          <LanguageSwitcher variant="default" />
          
          {/* User role badge */}
          <Badge 
            variant="outline" 
            className={`hidden sm:flex ${
              user.role === 'principal' ? 'border-purple-500 text-purple-700' :
              user.role === 'teacher' ? 'border-green-500 text-green-700' :
              'border-blue-500 text-blue-700'
            }`}
          >
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>

          {/* Presence indicator (route-scoped) */}
          <RoutePresenceBadge />
          
          <NotificationBell />
          
          {/* Profile Settings */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Profile Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <ProfileSettings />
            </DialogContent>
          </Dialog>
        </div>
        </div>
    </header>
  );
};