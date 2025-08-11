export type UserRole = 'principal' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string; // Profile ID
  authUserId?: string; // Auth user ID (optional for backward compatibility)
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Principal extends User {
  role: 'principal';
  schoolName: string;
  schoolId: string;
}

export interface Teacher extends User {
  role: 'teacher';
  assignedClassId?: string;
  subjects: string[];
}

export interface Student extends User {
  role: 'student';
  classId?: string;
  disabilities?: DisabilityType[];
  parentEmail?: string;
  enrollmentCode?: string;
}

export type DisabilityType = 
  | 'blind_low_vision'
  | 'deaf_hard_hearing'
  | 'mute_non_verbal'
  | 'cognitive_disability'
  | 'motor_impairment';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolName?: string; // For principal
  enrollmentCode?: string; // For student
}