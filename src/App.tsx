import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { TTSProvider } from "@/contexts/TTSContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { SkipNavigation, AccessibilityAnnouncements } from "@/components/accessibility/SkipNavigation";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { GlobalShortcutsProvider } from "@/contexts/GlobalShortcutsContext";
import { ShortcutsHelp } from "@/components/accessibility/ShortcutsHelp";
import { ChatbotDrawer } from "@/components/chatbot/ChatbotDrawer";
import UniversalAssistBar from "@/components/layout/UniversalAssistBar";
import { LiveAnnouncer } from "@/components/accessibility/LiveAnnouncer";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Layout } from "./components/layout/Layout";

// Lazy load all page components for better performance
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard").then(module => ({ default: module.Dashboard })));
const InsightsPage = React.lazy(() => import("./pages/InsightsPage").then(module => ({ default: module.InsightsPage })));
const VideoHomepage = React.lazy(() => import("./pages/VideoHomepage").then(module => ({ default: module.VideoHomepage })));
const YouTubeHomepage = React.lazy(() => import("./pages/YouTubeHomepage").then(module => ({ default: module.YouTubeHomepage })));
const VideoDetailsPage = React.lazy(() => import("./pages/VideoDetailsPage").then(module => ({ default: module.VideoDetailsPage })));
const SubjectsPage = React.lazy(() => import("./pages/SubjectsPage").then(module => ({ default: module.SubjectsPage })));
const AssignmentsPage = React.lazy(() => import("./pages/AssignmentsPage").then(module => ({ default: module.AssignmentsPage })));
const StudentAssignmentsPage = React.lazy(() => import("./pages/StudentAssignmentsPage").then(module => ({ default: module.StudentAssignmentsPage })));
const StudentsPage = React.lazy(() => import("./pages/StudentsPage").then(module => ({ default: module.StudentsPage })));
const TeachersPage = React.lazy(() => import("./pages/TeachersPage").then(module => ({ default: module.TeachersPage })));
const TeacherProfilePage = React.lazy(() => import("./pages/TeacherProfilePage").then(module => ({ default: module.TeacherProfilePage })));
const ClassesPage = React.lazy(() => import("./pages/ClassesPage").then(module => ({ default: module.ClassesPage })));
const BinPage = React.lazy(() => import("./pages/BinPage").then(module => ({ default: module.BinPage })));
const StudentSubjectsPage = React.lazy(() => import("./pages/StudentSubjectsPage").then(module => ({ default: module.StudentSubjectsPage })));
const SubmissionsPage = React.lazy(() => import("./pages/SubmissionsPage").then(module => ({ default: module.SubmissionsPage })));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage").then(module => ({ default: module.NotificationsPage })));
const AccessibilityStatement = React.lazy(() => import("./pages/AccessibilityStatement").then(module => ({ default: module.AccessibilityStatement })));

const VideoManagementPage = React.lazy(() => import("./pages/VideoManagementPage").then(module => ({ default: module.VideoManagementPage })));
import { EnrollSubjectPage } from '@/pages/EnrollSubjectPage';
const JoinSubjectPage = React.lazy(() => import("./pages/JoinSubjectPage").then(module => ({ default: module.JoinSubjectPage })));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route 
          path="/" 
          element={<YouTubeHomepage />} 
        />
        <Route 
          path="/auth" 
          element={<AuthPage />} 
        />
        <Route 
          path="/videos" 
          element={<VideoHomepage />} 
        />
        <Route 
          path="/video/:id" 
          element={<VideoDetailsPage />} 
        />
        
        {/* Protected routes with Layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <Dashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insights" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <InsightsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute requiredRole="principal">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <TeachersPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/:teacherId" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <TeacherProfilePage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/classes" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <ClassesPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subjects" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <SubjectsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assignments" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <AssignmentsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <StudentsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/classes" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <ClassesPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/subjects" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <StudentSubjectsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/subjects/:id" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  {React.createElement(React.lazy(() => import("./components/subjects/StudentSubjectDetailView").then(module => ({ default: module.StudentSubjectDetailView }))))}
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/assignments" 
          element={
            <ProtectedRoute requiredRole="student">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <StudentAssignmentsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bin" 
          element={
            <ProtectedRoute requiredRole="principal">
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <BinPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submissions" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <SubmissionsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/videos/manage" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <VideoManagementPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher', 'student']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <NotificationsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications/:notificationId" 
          element={
            <ProtectedRoute allowedRoles={['principal', 'teacher', 'student']}>
              <Layout>
                <Suspense fallback={<LoadingScreen />}>
                  <NotificationsPage />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/join-subject" 
          element={
            <ProtectedRoute requiredRole="student">
              <Suspense fallback={<LoadingScreen />}>
                <JoinSubjectPage />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/accessibility-statement" 
          element={<AccessibilityStatement />} 
        />
        <Route path="/enroll-subject" element={<EnrollSubjectPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="ils-theme" disableTransitionOnChange={false}>
      <LanguageProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <TTSProvider>
              <TooltipProvider>
                <GlobalShortcutsProvider>
                  <SkipNavigation />
                  <AccessibilityAnnouncements />
                  <AccessibilityPanel />
                  <ShortcutsHelp />
                  {/* Chatbot is global, lightweight, and opt-in */}
                  <ChatbotDrawer />
                  <UniversalAssistBar />
                  
        <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <LiveAnnouncer />
                    <AppContent />
                  </BrowserRouter>
                </GlobalShortcutsProvider>
              </TooltipProvider>
            </TTSProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
