# Accessible Learning Management System (ALSM) - Complete User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Role-Based Access Control & CRUD Operations](#role-based-access-control--crud-operations)
4. [Beginner Guide - First Steps](#beginner-guide---first-steps)
5. [Intermediate Guide - Daily Operations](#intermediate-guide---daily-operations)
6. [Advanced Guide - Management & Analytics](#advanced-guide---management--analytics)
7. [Accessibility Features](#accessibility-features)
8. [Troubleshooting & Support](#troubleshooting--support)

---

## System Overview

The Accessible Learning Management System (ALSM) is a comprehensive educational platform designed to support inclusive learning environments. It provides role-based access control, comprehensive CRUD operations, and advanced accessibility features for users with disabilities.

### Key Features
- **Role-Based Access Control**: Four distinct user roles with appropriate permissions
- **Comprehensive CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Accessibility First**: Built-in support for screen readers, TTS, high contrast, and adaptive interfaces
- **Real-time Analytics**: Performance tracking and engagement insights
- **Inclusive Design**: Support for various disabilities and learning needs
- **Video Integration**: Accessible video player with captions, transcripts, and sign language support

### System Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Supabase with PostgreSQL, Row Level Security (RLS), and Edge Functions
- **Authentication**: Supabase Auth with JWT tokens and role-based policies
- **Storage**: Supabase Storage for files, videos, and documents

---

## Getting Started

### System Requirements
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection
- JavaScript enabled
- For optimal accessibility: Screen reader software (if needed)

### Access URLs
- **Production**: `https://your-alsm-domain.com`
- **Staging**: `https://alsm-staging.lovable.app`

### Default Login Credentials
```
Principal:
- Email: principal@demo.com
- Password: demo123

Teacher:
- Email: teacher@demo.com  
- Password: demo123

Student:
- Email: student@demo.com
- Password: demo123

Parent:
- Email: parent@demo.com
- Password: demo123
```

---

## Role-Based Access Control & CRUD Operations

### 1. Principal Role

**Access Level**: Full System Administrator

#### What Principals Can Do:
- **Manage Everything**: Complete CRUD access to all system entities
- **Oversee All Operations**: Monitor school-wide performance and activities
- **System Configuration**: Manage system settings and user permissions

#### CRUD Operations for Principals:

| Entity | Create | Read | Update | Delete | Restore |
|--------|--------|------|--------|---------|---------|
| Schools | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Teachers | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Students | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Parents | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Classes | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Subjects | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Assignments | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Lessons | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Materials | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Videos | ✅ | ✅ | ✅ | ✅ (Soft) | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Principal Dashboard Features:
- **Statistics Overview**: Total teachers, classes, students, subjects
- **Quick Actions**: Add teacher, create class, view reports
- **School Management**: Complete oversight of all school operations
- **Bin Management**: View and restore deleted items
- **Analytics**: Comprehensive school performance reports

### 2. Teacher Role

**Access Level**: Class & Subject Management

#### What Teachers Can Do:
- **Manage Their Classes**: Full control over assigned classes
- **Subject Management**: Create and manage subjects within their classes
- **Student Management**: Add students to their classes, track progress
- **Assignment Lifecycle**: Complete CRUD for assignments in their subjects
- **Lesson Management**: Create and manage lessons with materials

#### CRUD Operations for Teachers:

| Entity | Create | Read | Update | Delete | Scope |
|--------|--------|------|--------|---------|-------|
| Students | ✅ | ✅ | ✅ | ✅ (Soft) | Their classes only |
| Classes | ✅* | ✅ | ✅ | ✅ (Soft) | Their classes only |
| Subjects | ✅ | ✅ | ✅ | ✅ (Soft) | Their subjects only |
| Assignments | ✅ | ✅ | ✅ | ✅ (Soft) | Their subjects only |
| Lessons | ✅ | ✅ | ✅ | ✅ (Soft) | Their subjects only |
| Materials | ✅ | ✅ | ✅ | ✅ (Soft) | Their subjects only |
| Videos | ✅ | ✅ | ✅ | ✅ (Soft) | Their uploads only |
| Submissions | ❌ | ✅ | ✅ (Grading) | ❌ | Their assignments only |
| Grades | ✅ | ✅ | ✅ | ❌ | Their assignments only |
| Rubrics | ✅ | ✅ | ✅ | ✅ | Their assignments only |

*Limited create permissions based on school policies

#### Teacher Dashboard Features:
- **Class Overview**: Statistics for classes, students, subjects, assignments
- **Quick Actions**: Add subject, add assignment, add student, view reports
- **Student Management**: Track individual student progress and performance
- **Grading Tools**: Advanced grading with rubrics and feedback
- **Analytics**: Class and subject performance insights

### 3. Student Role

**Access Level**: Learning & Submission

#### What Students Can Do:
- **View Academic Content**: Access to enrolled classes, subjects, and lessons
- **Submit Work**: Submit assignments with text, files, and resubmissions
- **Track Progress**: Monitor grades, performance, and upcoming deadlines
- **Join Subjects**: Enroll in new subjects using invitation codes

#### CRUD Operations for Students:

| Entity | Create | Read | Update | Delete | Scope |
|--------|--------|------|--------|---------|-------|
| Submissions | ✅ | ✅ | ✅ (Before deadline) | ❌ | Own submissions only |
| Enrollment Requests | ✅ | ✅ | ❌ | ❌ | Own requests only |
| Profile | ❌ | ✅ | ✅ (Limited) | ❌ | Own profile only |
| Assignments | ❌ | ✅ | ❌ | ❌ | Enrolled subjects only |
| Lessons | ❌ | ✅ | ❌ | ❌ | Enrolled subjects only |
| Materials | ❌ | ✅ | ❌ | ❌ | Enrolled subjects only |
| Videos | ❌ | ✅ | ❌ | ❌ | Enrolled/public only |
| Grades | ❌ | ✅ | ❌ | ❌ | Own grades only |
| Classes | ❌ | ✅ | ❌ | ❌ | Enrolled classes only |
| Subjects | ❌ | ✅ | ❌ | ❌ | Enrolled subjects only |

#### Student Dashboard Features:
- **Progress Overview**: Classes, assignments, average grade, pending tasks
- **Quick Actions**: Join subject, view lessons, submit assignment
- **Assignment Management**: Track submissions, deadlines, and grades
- **Recent Grades**: Display recent graded assignments with performance metrics
- **Accessibility Support**: Adaptive interface for users with disabilities

### 4. Parent Role

**Access Level**: Child Monitoring & Communication

#### What Parents Can Do:
- **Monitor Children**: Track academic progress and performance
- **Communication**: Contact teachers and receive notifications
- **Progress Reports**: View detailed analytics and reports
- **Support Information**: Access disability support and accommodation details

#### CRUD Operations for Parents:

| Entity | Create | Read | Update | Delete | Scope |
|--------|--------|------|--------|---------|-------|
| Messages | ✅ | ✅ | ❌ | ❌ | To teachers only |
| Profile | ❌ | ✅ | ✅ (Limited) | ❌ | Own profile only |
| Child Progress | ❌ | ✅ | ❌ | ❌ | Own children only |
| Child Assignments | ❌ | ✅ | ❌ | ❌ | Own children only |
| Child Grades | ❌ | ✅ | ❌ | ❌ | Own children only |
| Support Services | ❌ | ✅ | ❌ | ❌ | Own children only |
| Accommodations | ❌ | ✅ | ❌ | ❌ | Own children only |
| Teacher Contacts | ❌ | ✅ | ❌ | ❌ | Child's teachers only |

#### Parent Dashboard Features:
- **Child Selection**: Multi-child support with individual dashboards
- **Performance Analytics**: Comprehensive grade and progress tracking
- **Communication Tools**: Direct messaging with teachers
- **Support Overview**: Disability services and accommodations tracking

---

## Beginner Guide - First Steps

### For Principals

#### Step 1: Initial System Setup
1. **Login** with principal credentials
2. **Review Dashboard** - familiarize yourself with the statistics overview
3. **Add First Teacher**:
   - Click "Add Teacher" button
   - Fill in: First Name, Last Name, Email, Password
   - Click "Add Teacher"
   - Teacher receives login credentials

#### Step 2: Create Your First Class
1. **Click "Create Class"** in Quick Actions
2. **Fill Class Information**:
   - Class Name: e.g., "Grade 11 Physics"
   - Description: Brief class description
   - Assign Teacher: Select from dropdown
3. **Submit** and class is created

#### Step 3: Navigate System
- **Use sidebar navigation** to access different sections
- **Statistics cards** are clickable for detailed views
- **Search functionality** available in top navigation

### For Teachers

#### Step 1: Explore Your Dashboard
1. **Login** with teacher credentials
2. **Review Quick Stats**: Classes, students, subjects, assignments
3. **Check Notifications** for important updates

#### Step 2: Create Your First Subject
1. **Click "Add Subject"** in Quick Actions
2. **Fill Subject Details**:
   - Subject Name: e.g., "Introduction to Physics"
   - Description: Subject overview
   - Select Class: Choose your assigned class
3. **Create Subject** and note the invitation code generated

#### Step 3: Add Students to Class
1. **Click "Add Student"** in Quick Actions
2. **Enter Student Information**:
   - First Name, Last Name, Email
   - Parent Email (optional)
   - Select Class
   - Password defaults to "demo123"
3. **Submit** - student account is created

### For Students

#### Step 1: Explore Your Dashboard
1. **Login** with student credentials
2. **View Progress Overview**: Classes, assignments, grades, tasks
3. **Check Recent Grades** for performance feedback

#### Step 2: Join a Subject
1. **Click "Join Subject"** in Quick Actions
2. **Enter Invitation Code** provided by teacher
3. **Submit Request** - wait for teacher approval
4. **Check Notifications** for approval status

#### Step 3: Submit Your First Assignment
1. **Click "Submit Assignment"** in Quick Actions
2. **Select Assignment** from dropdown
3. **Enter Your Work** in text area
4. **Attach File** (optional)
5. **Submit** - teacher receives notification

### For Parents

#### Step 1: Access Child Information
1. **Login** with parent credentials
2. **Select Child** (if multiple children)
3. **Review Performance Overview**

#### Step 2: Monitor Progress
1. **Navigate to Analytics Tab**
2. **Review Subject Performance** charts
3. **Check Assignment Progress** and completion rates

#### Step 3: Contact Teachers
1. **Use Quick Contact** section
2. **Send Email** or schedule meeting
3. **Monitor Communication** in activity tab

---

## Intermediate Guide - Daily Operations

### For Teachers

#### Assignment Management Workflow
1. **Create Assignment**:
   - Access subject detail page
   - Click "Add Assignment"
   - Set title, description, due date, max score
   - Configure file types and attempt limits
   - Save assignment

2. **Monitor Submissions**:
   - View submissions in real-time
   - Track completion rates
   - Receive notifications for new submissions

3. **Grade Assignments**:
   - Click on submission to grade
   - Enter score and feedback
   - Use rubrics for consistent grading
   - Release grades to students

4. **Manage Assignment Lifecycle**:
   - Edit assignment details before submissions
   - Extend deadlines if needed
   - Archive completed assignments
   - Analyze performance data

#### Lesson Content Creation
1. **Create Lesson**:
   - Navigate to subject → lessons
   - Click "Add Lesson"
   - Enter title, description, content
   - Set lesson order
   - Add materials (videos, documents, images)

2. **Upload Materials**:
   - Support for multiple file types
   - Automatic accessibility checks
   - Caption and transcript generation
   - File organization by lesson/subject

3. **Video Management**:
   - Upload videos with accessibility features
   - Add captions and transcripts
   - Set visibility (public, private, school)
   - Track video engagement analytics

### For Students

#### Daily Learning Routine
1. **Check Dashboard**:
   - Review upcoming assignments
   - Check new grades
   - Read notifications

2. **Complete Assignments**:
   - Access assignment details
   - Review requirements and rubric
   - Prepare submission (text + files)
   - Submit before deadline
   - Track submission status

3. **Access Learning Materials**:
   - Browse lessons by subject
   - Watch videos with captions
   - Download materials
   - Track learning progress

#### Time Management
1. **Use Assignment Tracker**:
   - View due dates
   - Prioritize urgent tasks
   - Set personal reminders
   - Monitor completion status

2. **Grade Monitoring**:
   - Check grade trends
   - Identify improvement areas
   - Review teacher feedback
   - Track overall performance

---

## Advanced Guide - Management & Analytics

### For Principals

#### Advanced School Management
1. **User Management**:
   - Bulk import teachers/students
   - Manage user permissions
   - Handle account issues
   - Monitor user activity

2. **System Analytics**:
   - School-wide performance reports
   - Engagement analytics
   - Resource utilization
   - Compliance reporting

3. **Data Management**:
   - Backup and restore procedures
   - Data export capabilities
   - Privacy compliance
   - Security monitoring

#### Advanced Reporting
1. **Performance Analytics**:
   - Class performance comparisons
   - Teacher effectiveness metrics
   - Student progress tracking
   - Intervention identification

2. **Operational Reports**:
   - System usage statistics
   - Resource allocation
   - Cost analysis
   - Trend identification

### For Teachers

#### Advanced Teaching Tools
1. **Rubric Creation**:
   - Design custom rubrics
   - Set criteria and point values
   - Apply to assignments
   - Generate consistent grades

2. **Student Progress Tracking**:
   - Individual student analytics
   - Learning pattern identification
   - Intervention planning
   - Parent communication

3. **Class Management**:
   - Bulk operations
   - Group assignments
   - Peer review systems
   - Collaborative projects

#### Analytics and Insights
1. **Assignment Analytics**:
   - Completion rate tracking
   - Performance distribution
   - Time-to-completion analysis
   - Difficulty assessment

2. **Engagement Metrics**:
   - Student participation
   - Material access patterns
   - Video engagement
   - Discussion activity

### Advanced Features for All Roles

#### Notification System
1. **Real-time Updates**:
   - Assignment submissions
   - Grade releases
   - System announcements
   - Deadline reminders

2. **Customization**:
   - Notification preferences
   - Delivery methods
   - Frequency settings
   - Priority levels

#### Search and Navigation
1. **Global Search**:
   - Find any content quickly
   - Filter by type and date
   - Bookmark important items
   - Recent activity tracking

2. **Navigation Efficiency**:
   - Keyboard shortcuts
   - Quick actions menu
   - Breadcrumb navigation
   - Context-sensitive help

---

## Accessibility Features

### Core Accessibility Features

#### For Vision Impairments
1. **Screen Reader Support**:
   - Full ARIA label compliance
   - Semantic HTML structure
   - Clear heading hierarchy
   - Descriptive link text

2. **Visual Accessibility**:
   - High contrast mode toggle
   - Font size adjustment (12px-24px)
   - Color customization
   - Focus indicators

3. **Text-to-Speech (TTS)**:
   - Built-in TTS buttons throughout interface
   - Content narration
   - Navigation assistance
   - Multi-language support

#### For Hearing Impairments
1. **Video Accessibility**:
   - Automatic captions
   - Manual transcript upload
   - Sign language video overlay
   - Visual notification alerts

2. **Audio Alternatives**:
   - Text-based notifications
   - Visual feedback systems
   - Vibration alerts (mobile)
   - Flash notifications

#### For Motor Impairments
1. **Navigation Support**:
   - Full keyboard navigation
   - Tab order optimization
   - Skip navigation links
   - Large click targets

2. **Input Assistance**:
   - Voice input support
   - Sticky drag functionality
   - Reduced motion options
   - Timeout extensions

#### For Cognitive Disabilities
1. **Interface Simplification**:
   - Clear, simple language
   - Consistent navigation
   - Reduced cognitive load
   - Error prevention

2. **Learning Support**:
   - Multiple content formats
   - Repetition options
   - Progress indicators
   - Clear instructions

### Adaptive Interface System

#### Disability Detection and Adaptation
1. **Automatic Adjustments**:
   - Interface adapts based on user profile
   - Disability-specific features activate
   - Personalized experience
   - Gradual feature introduction

2. **Customization Options**:
   - Personal accessibility preferences
   - Feature enabling/disabling
   - Interface layout adjustment
   - Content presentation options

#### Accommodation Management
1. **Student Accommodations**:
   - Extended time for assignments
   - Alternative assessment methods
   - Modified content presentation
   - Assistive technology integration

2. **Support Services**:
   - IEP document management
   - Progress tracking
   - Service provider coordination
   - Parent communication

---

## Troubleshooting & Support

### Common Issues and Solutions

#### Login and Authentication
**Problem**: Cannot log in
**Solutions**:
1. Check email and password spelling
2. Try password reset
3. Clear browser cache
4. Contact system administrator

**Problem**: "User not found" error
**Solutions**:
1. Verify account creation
2. Check with principal/teacher who added account
3. Ensure correct role assignment

#### Performance Issues
**Problem**: Slow loading times
**Solutions**:
1. Check internet connection
2. Clear browser cache
3. Disable browser extensions
4. Try different browser

**Problem**: Video not playing
**Solutions**:
1. Check browser video support
2. Update browser
3. Check network bandwidth
4. Try different video quality

#### Assignment Submission
**Problem**: Cannot submit assignment
**Solutions**:
1. Check file size limits
2. Verify file type allowed
3. Check deadline hasn't passed
4. Ensure text content isn't empty

**Problem**: File upload fails
**Solutions**:
1. Check file size (max 50MB)
2. Verify internet connection
3. Try different file format
4. Contact teacher if persistent

#### Accessibility Issues
**Problem**: Screen reader not working
**Solutions**:
1. Update screen reader software
2. Check browser compatibility
3. Verify ARIA settings
4. Try keyboard navigation

**Problem**: TTS not speaking
**Solutions**:
1. Check browser audio permissions
2. Verify system audio settings
3. Try different browser
4. Check for audio conflicts

### Getting Help

#### Self-Service Resources
1. **In-App Help**: Context-sensitive help throughout interface
2. **Video Tutorials**: Step-by-step guides for common tasks
3. **FAQ Section**: Answers to frequently asked questions
4. **User Manual**: This comprehensive guide

#### Contact Support
1. **Technical Support**:
   - Email: support@alsm-school.edu
   - Phone: 1-800-ALSM-HELP
   - Hours: Mon-Fri 8AM-6PM

2. **Accessibility Support**:
   - Email: accessibility@alsm-school.edu
   - Specialized support for users with disabilities
   - Assistive technology guidance

3. **Training Support**:
   - Email: training@alsm-school.edu
   - User training sessions
   - Professional development

#### Emergency Support
**For Critical Issues**:
- 24/7 Emergency Line: 1-800-ALSM-911
- System outages
- Data loss incidents
- Security concerns

### System Status and Updates

#### Maintenance Schedule
- **Routine Maintenance**: Sundays 2AM-4AM
- **Updates**: First Saturday of each month
- **Major Releases**: During school breaks

#### Status Monitoring
- **Status Page**: status.alsm-school.edu
- **Email Notifications**: Automatic updates for maintenance
- **In-App Alerts**: Real-time status updates

---

## Appendices

### Appendix A: Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Navigate to Dashboard | Alt + D | Global |
| Open Search | Ctrl + K | Global |
| Skip to Main Content | Alt + M | Global |
| Open Accessibility Menu | Alt + A | Global |
| Submit Form | Ctrl + Enter | Forms |
| Cancel Dialog | Escape | Modals |
| Next Tab | Ctrl + Tab | Tabs |
| Previous Tab | Ctrl + Shift + Tab | Tabs |

### Appendix B: File Format Support

#### Supported Upload Formats
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Images**: JPG, PNG, GIF, SVG, WEBP
- **Videos**: MP4, WEBM, MOV, AVI
- **Audio**: MP3, WAV, OGG
- **Archives**: ZIP, RAR, 7Z

#### Maximum File Sizes
- **Documents**: 25MB
- **Images**: 10MB
- **Videos**: 100MB
- **Audio**: 25MB
- **Archives**: 50MB

### Appendix C: Browser Compatibility

#### Fully Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Limited Support Browsers
- Internet Explorer 11 (accessibility features limited)
- Chrome 80-89 (some features may not work)
- Firefox 78-87 (some features may not work)

### Appendix D: API Documentation

For developers and advanced users, detailed API documentation is available at:
- **API Docs**: api-docs.alsm-school.edu
- **GraphQL Playground**: api.alsm-school.edu/graphql
- **REST Endpoints**: api.alsm-school.edu/docs

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: June 2025

For the most up-to-date version of this manual, visit: docs.alsm-school.edu