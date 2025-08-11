# Complete Project Recreation Prompt: Inclusive Learning Management System

## Project Overview
Create a comprehensive, fully accessible Learning Management System (LMS) with advanced accessibility features, multi-role support, and educational video capabilities. The system should be WCAG 2.1 AA compliant and designed specifically for inclusive education.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Accessibility**: Custom hooks + ARIA compliance + Screen reader support

## Core Features & Functionality

### 1. Authentication System
- Multi-role authentication (Student, Teacher, Principal, Parent)
- Custom auth context with user profile management
- Demo user creation functionality for testing
- Row Level Security (RLS) implementation
- Profile management with role-based access

### 2. User Roles & Permissions

#### Student Role:
- View enrolled classes and subjects
- Access educational videos with accessibility features
- Submit assignments with file uploads
- Take quizzes with multiple attempts
- Track video progress and completion
- Access captions, transcripts, and audio descriptions

#### Teacher Role:
- View all classes (for demo purposes)
- Create and manage subjects within classes
- Create assignments with scoring rubrics
- Grade submissions and provide feedback
- Add/manage students
- Access teaching analytics and reports
- Upload educational materials

#### Principal Role:
- Full system administration access
- Manage all schools, classes, and users
- View comprehensive analytics
- Oversee all educational content
- System-wide reporting capabilities

#### Parent Role:
- Monitor child's academic progress
- View assignment scores and completion rates
- Track accessibility feature usage
- Communicate with teachers
- Access progress reports and calendar events

### 3. Database Schema

```sql
-- Core Tables:
- profiles (user data with role-based info)
- schools (educational institutions)
- classes (class management with enrollment codes)
- subjects (curriculum subjects within classes)
- student_enrollments (class enrollment tracking)

-- Educational Content:
- lessons (structured learning content)
- materials (educational resources and files)
- video_materials (accessible video content with metadata)
- video_progress (student viewing progress tracking)

-- Assessment System:
- assignments (homework and projects)
- assignment_submissions (student submissions with grading)
- quizzes (interactive assessments with JSON questions)
- quiz_attempts (student quiz completion tracking)

-- Communication:
- notifications (system announcements and alerts)
```

### 4. Accessibility Features (Critical Implementation)

#### Video Player Accessibility:
- Full keyboard navigation support (Space, Arrow keys, M, C, F shortcuts)
- Screen reader compatibility with live announcements
- Closed captions with multiple language support
- Complete transcripts for every video
- Audio descriptions for visual content
- Sign language interpretation video overlays
- Customizable playback speeds (0.5x to 2x)
- High contrast video controls
- Mobile-friendly touch targets (44px minimum)

#### Text-to-Speech (TTS) Integration:
- Web Speech API implementation
- TTS buttons throughout the interface
- Automatic content reading for navigation changes
- Form error announcements
- Customizable voice selection

#### Cognitive Accessibility:
- Simple, clear navigation patterns
- Consistent UI layouts across all pages
- Visual alerts for important information
- Progress indicators for multi-step processes
- Error prevention and clear error messaging

#### Visual Accessibility:
- High contrast color schemes
- Scalable text and UI elements
- Screen reader landmark navigation
- Skip navigation links
- Focus management and visible focus indicators

### 5. Educational Video System

#### Video Management:
- Secure video upload to Supabase Storage
- Metadata storage (duration, file size, resolution)
- Category and tagging system
- Difficulty level classification
- Public/private access control

#### Accessibility Metadata:
- Captions file paths (WebVTT format)
- Transcript text storage
- Audio description track paths
- Sign language video overlay paths
- Alternative format availability

#### Student Experience:
- Progress tracking with resume functionality
- Bookmarking important sections
- Note-taking capabilities
- Completion certificates
- Accessibility preference saving

### 6. Assignment & Assessment System

#### Assignment Creation:
- Rich text descriptions with formatting
- File upload requirements specification
- Due date management with timezone support
- Scoring rubrics and grading criteria
- Multiple submission attempts configuration

#### Student Submissions:
- File upload with format validation
- Text-based submission support
- Submission history tracking
- Peer review capabilities (optional)
- Accessibility compliance checking

#### Quiz System:
- Multiple question types (multiple choice, true/false, short answer)
- Timed assessments with accessibility considerations
- Immediate feedback options
- Adaptive questioning based on performance
- Screen reader compatible question formats

### 7. Dashboard Implementations

#### Student Dashboard:
- Enrolled classes overview
- Assignment due dates calendar
- Video progress tracking
- Accessibility settings panel
- Quick access to recent content

#### Teacher Dashboard:
- Class management interface
- Student progress analytics
- Assignment grading workflow
- Content creation tools
- Communication center

#### Principal Dashboard:
- System-wide analytics
- User management tools
- Content oversight capabilities
- Performance reporting
- Accessibility compliance monitoring

#### Parent Dashboard:
- Child progress overview
- Teacher communication tools
- Accessibility usage tracking
- Event calendar integration
- Report generation

### 8. Technical Implementation Details

#### Design System:
```css
/* Custom design tokens in index.css */
:root {
  /* Semantic color palette with HSL values */
  --primary: [main brand color];
  --primary-glow: [lighter primary variant];
  --secondary: [complementary color];
  --accent: [highlight color];
  
  /* Accessibility-focused gradients */
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
  
  /* High-contrast shadows */
  --shadow-elegant: 0 10px 30px -10px hsl(var(--primary) / 0.3);
  
  /* Smooth transitions */
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Component Architecture:
- Modular component design with shadcn/ui base
- Custom accessibility hooks (useKeyboardNavigation, useTTS)
- Context providers for auth, accessibility, and TTS
- Reusable form components with accessibility built-in
- Error boundary implementation

#### Data Management:
- Custom Supabase hooks with React Query integration
- Optimistic updates for better UX
- Real-time subscriptions for notifications
- Efficient caching strategies
- Error handling and retry mechanisms

### 9. Row Level Security (RLS) Policies

#### Critical Security Implementation:
```sql
-- User profile access
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

-- Role-based class access
CREATE POLICY "Teachers can view all classes for demo" 
ON public.classes FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Student enrollment restrictions
CREATE POLICY "Students can manage their own submissions" 
ON public.assignment_submissions FOR ALL 
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Public video access for guests
CREATE POLICY "Public access to demo videos" 
ON public.video_materials FOR SELECT 
USING (subject_id IS NULL);
```

### 10. Advanced Features

#### Real-time Notifications:
- Assignment due date reminders
- Grade publication alerts
- System maintenance notifications
- Teacher-parent communication updates

#### Analytics & Reporting:
- Student engagement metrics
- Accessibility feature usage statistics
- Content effectiveness analysis
- Progress tracking visualization

#### Content Management:
- Bulk content upload capabilities
- Version control for educational materials
- Content approval workflows
- Accessibility compliance checking

### 11. Deployment Considerations

#### SEO & Publishing:
- Complete meta tag implementation
- Open Graph tags for social sharing
- Structured data markup (Schema.org)
- Sitemap generation
- Performance optimization

#### Security:
- HTTPS enforcement
- Content Security Policy (CSP)
- Rate limiting on API endpoints
- Input validation and sanitization
- Regular security audits

### 12. Future Enhancements

#### AI/ML Integration:
- Automatic caption generation
- Content recommendation engine
- Learning path optimization
- Accessibility need prediction

#### Advanced Accessibility:
- Eye-tracking navigation support
- Voice command interfaces
- Haptic feedback integration
- Brain-computer interface support

## Implementation Priority

1. **Phase 1**: Core authentication and user management
2. **Phase 2**: Basic dashboard functionality for all roles
3. **Phase 3**: Educational content management (videos, assignments)
4. **Phase 4**: Comprehensive accessibility features
5. **Phase 5**: Analytics and reporting systems
6. **Phase 6**: Advanced features and optimizations

## Key Success Metrics
- WCAG 2.1 AA compliance score: 100%
- User accessibility satisfaction: >95%
- System performance (Core Web Vitals): Green scores
- Educational outcome improvements: Measurable progress
- Cross-platform compatibility: Full support

This system represents a revolutionary approach to inclusive education technology, ensuring that students with diverse abilities can access high-quality educational content without barriers.