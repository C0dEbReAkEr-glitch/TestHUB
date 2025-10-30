export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  domain: Domain[];
  section: 'A' | 'B';
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer: number;
  correctAnswerText?: string; // For fill-in-the-blank
  domain: Domain;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // Time limit in seconds for this question
  createdBy: string;
  createdAt: string;
}

export interface Test {
  id: string;
  title: string;
  domain: Domain;
  subject: string;
  section: 'A' | 'B' | 'both';
  questions: Question[];
  randomizeQuestions: boolean;
  questionPoolSize?: number; // If set, randomly select this many questions
  duration: number; // in minutes
  timePerQuestion?: number; // Time limit per question in seconds
  totalMarks: number;
  createdBy: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isScheduled: boolean;
  createdAt: string;
  isActive: boolean;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, number>;
  textAnswers?: Record<string, string>; // For fill-in-the-blank
  score: number;
  totalQuestions: number;
  timeSpent: number;
  tabSwitchCount?: number;
  warningCount?: number;
  // Optional anti-cheating metadata
  violations?: string[];
  terminationReason?: string;
  wasTerminated?: boolean;
  ipAddress?: string;
  userAgent?: string;
  browserInfo?: string;
  completedAt: string;
  isCompleted: boolean;
}

export type Domain = 'BCA' | 'MCA' | 'PGDM';

export interface Subject {
  name: string;
  domain: Domain;
}

export const SUBJECTS: Subject[] = [
  // BCA Subjects
  { name: 'Programming Fundamentals (C, C++, Java)', domain: 'BCA' },
  { name: 'Data Structures', domain: 'BCA' },
  { name: 'Database Management Systems', domain: 'BCA' },
  { name: 'Operating Systems', domain: 'BCA' },
  { name: 'Computer Networks', domain: 'BCA' },
  { name: 'Software Engineering', domain: 'BCA' },
  { name: 'Web Technologies', domain: 'BCA' },
  { name: 'Mathematics (Discrete, Numerical Methods)', domain: 'BCA' },
  { name: 'Digital Electronics', domain: 'BCA' },
  { name: 'Computer Architecture', domain: 'BCA' },
  { name: 'Communication Skills', domain: 'BCA' },
  { name: 'Mobile App Development', domain: 'BCA' },
  { name: 'Cloud Computing', domain: 'BCA' },
  { name: 'Cybersecurity', domain: 'BCA' },

  // MCA Subjects
  { name: 'Python Programming', domain: 'MCA' },
  { name: 'Web Technologies (PHP, JavaScript)', domain: 'MCA' },
  { name: 'Software Engineering & Project Management', domain: 'MCA' },
  { name: 'Object-Oriented Analysis and Design (UML)', domain: 'MCA' },
  { name: 'Database Systems', domain: 'MCA' },
  { name: 'Operating Systems', domain: 'MCA' },
  { name: 'Computer Networks', domain: 'MCA' },
  { name: 'Artificial Intelligence', domain: 'MCA' },
  { name: 'Compiler Design', domain: 'MCA' },
  { name: 'Cryptography & Network Security', domain: 'MCA' },
  { name: 'Design and Analysis of Algorithms', domain: 'MCA' },
  { name: 'Data Science', domain: 'MCA' },

  // PGDM Subjects
  { name: 'Principles of Management', domain: 'PGDM' },
  { name: 'Marketing Management', domain: 'PGDM' },
  { name: 'Financial Accounting', domain: 'PGDM' },
  { name: 'Organizational Behavior', domain: 'PGDM' },
  { name: 'Business Communication', domain: 'PGDM' },
  { name: 'Human Resource Management', domain: 'PGDM' },
  { name: 'Operations Management', domain: 'PGDM' },
  { name: 'Business Law', domain: 'PGDM' },
  { name: 'Strategic Management', domain: 'PGDM' },
  { name: 'Managerial Economics', domain: 'PGDM' },
  { name: 'Finance', domain: 'PGDM' },
  { name: 'International Business', domain: 'PGDM' },
  { name: 'Supply Chain Management', domain: 'PGDM' },
];