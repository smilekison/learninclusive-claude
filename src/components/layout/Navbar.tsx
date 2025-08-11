import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { LogOut, User, GraduationCap, Settings, BarChart3, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useAccessibility();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'principal':
        return 'bg-accent text-accent-foreground';
      case 'teacher':
        return 'bg-success text-success-foreground';
      case 'student':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav 
      className={`bg-card border-b border-border shadow-sm ${settings.largeClickTargets ? 'py-2' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <GraduationCap 
                className={`text-primary mr-3 ${settings.largeClickTargets ? 'h-10 w-10' : 'h-8 w-8'}`} 
                aria-hidden="true" 
              />
              <h1 className={`font-semibold text-primary ${settings.largeClickTargets ? 'text-2xl' : 'text-xl'}`}>
                Inclusive Learning Suite
              </h1>
            </div>
            
            {/* Navigation Links */}
            <div className="ml-8 flex items-center space-x-4">
              <Link to="/dashboard">
                <Button
                  variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
                  className={`flex items-center space-x-1 ${settings.largeClickTargets ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'}`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link to="/insights">
                <Button
                  variant={location.pathname === '/insights' ? 'default' : 'ghost'}
                  className={`flex items-center space-x-1 ${settings.largeClickTargets ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Insights</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-2 h-auto ${settings.largeClickTargets ? 'px-4 py-3 min-h-[44px]' : 'px-3 py-2'}`}
                  aria-label={`User menu for ${user.firstName} ${user.lastName}. Current role: ${user.role}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      <Badge 
                        className={`text-xs ${getRoleBadgeColor(user.role)}`}
                        variant="secondary"
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <ProfileSettings />
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};