import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  Home, 
  BarChart3, 
  Users, 
  BookOpen, 
  FileText, 
  GraduationCap,
  School,
  Settings,
  LogOut,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Clapperboard
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

const getNavigationItems = (userRole: string, t: (key: string) => string) => {
  const baseItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: Home },
    { title: t("nav.insights"), url: "/insights", icon: BarChart3 }
  ];

  if (userRole === 'principal') {
    return [
      ...baseItems,
      { title: t("nav.teachers"), url: "/teachers", icon: Users },
      { title: t("nav.classes"), url: "/classes", icon: School },
      { title: t("nav.students"), url: "/students", icon: GraduationCap },
      { title: t("nav.subjects"), url: "/subjects", icon: BookOpen },
      { title: t("nav.videos") || 'Videos', url: "/videos/manage", icon: Clapperboard },
      { title: t("nav.assignments"), url: "/assignments", icon: FileText },
      { title: t("nav.submissions"), url: "/submissions", icon: School },
      { title: t("nav.bin"), url: "/bin", icon: BarChart3 }
    ];
  } else if (userRole === 'teacher') {
      return [
        ...baseItems,
        { title: t("nav.myClasses"), url: "/classes", icon: School },
        { title: t("nav.students"), url: "/students", icon: GraduationCap },
        { title: t("nav.subjects"), url: "/subjects", icon: BookOpen },
        { title: t("nav.videos") || 'Videos Section', url: "/videos/manage", icon: Clapperboard },
        { title: t("nav.assignments"), url: "/assignments", icon: FileText },
        { title: t("nav.submissions"), url: "/submissions", icon: School },
        { title: t("nav.bin"), url: "/bin", icon: BarChart3 }
      ];
  } else if (userRole === 'student') {
    return [
      ...baseItems,
      { title: t("nav.myClasses"), url: "/student/classes", icon: School },
      { title: t("nav.mySubjects"), url: "/student/subjects", icon: BookOpen },
      { title: t("nav.myAssignments"), url: "/student/assignments", icon: FileText },
      { title: t("nav.bin"), url: "/bin", icon: BarChart3 }
    ];
  }

  return baseItems;
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!user) return null;

  const isCollapsed = state === "collapsed";
  const navigationItems = getNavigationItems(user.role, t);

  const isActive = (path: string) => currentPath === path;

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

  return (
    <Sidebar
      collapsible="icon"
    >
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-4'} border-b`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold text-primary">{t("app.shortName")}</span>
          </div>
        )}
        {isCollapsed && <GraduationCap className="h-6 w-6 text-primary" />}
        
        <div className="flex items-center space-x-2">
          {!isCollapsed && <LanguageSwitcher variant="compact" />}
          <SidebarTrigger className={isCollapsed ? "hidden" : "block"} />
        </div>
      </div>

      <SidebarContent className="flex-1">
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            {t("nav.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive(item.url)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Section */}
      <div className={`border-t p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge className={`text-xs mt-1 ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                {t("nav.settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1"
                onClick={() => {/* Settings handler */}}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}