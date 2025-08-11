export interface Class {
  id: string;
  name: string;
  teacherId: string;
  principalId: string;
  students: Student[];
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  classId: string;
  teacherId: string;
  lessons: Lesson[];
  assignments: Assignment[];
  quizzes: Quiz[];
  materials: Material[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  subjectId: string;
  order: number;
  materials: Material[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'document' | 'image';
  url: string;
  subjectId?: string;
  lessonId?: string;
  hasSubtitles?: boolean;
  hasTranscript?: boolean;
  altText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  dueDate: Date;
  maxAttempts: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  submissions: Submission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  attempt: number;
  files: SubmissionFile[];
  submittedAt: Date;
  grading?: Grading;
}

export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export interface Grading {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  maxScore: number;
  feedback: string;
  feedbackFiles?: string[];
  gradedAt: Date;
  released: boolean;
  releasedAt?: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  maxAttempts: number;
  autoGrade: boolean;
  attempts: QuizAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  points: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attempt: number;
  answers: QuizAnswer[];
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  maxScore: number;
  autoGraded: boolean;
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'quiz' | 'grade' | 'deadline' | 'general';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

import type { Student } from './auth';