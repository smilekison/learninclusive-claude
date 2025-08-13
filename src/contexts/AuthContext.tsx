import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthContextType, User, RegisterData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cleanupAuthState } from '@/lib/authCleanup';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    console.log(`Fetching user profile for userId: ${userId}, attempt: ${retryCount + 1}`);
    
    try {
      // Small delay to ensure session is fully established
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Profile query result:', { profile, error });

      if (error) {
        console.error('Profile query error:', error);
        
        // If it's an RLS error and we haven't retried, try again
        if (error.code === '42P17' && retryCount < 2) {
          console.log('RLS recursion detected, retrying...');
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 500 * (retryCount + 1));
          return;
        }
        
        throw error;
      }

      if (profile) {
        console.log('Profile found, setting user state');
        // Get the actual email from auth user
        const { data: authUser } = await supabase.auth.getUser();
        
        const userData = {
          id: profile.id, // This is the profile ID
          authUserId: userId, // This is the auth user ID
          email: authUser.user?.email || '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role as 'principal' | 'teacher' | 'student',
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        
        toast({
          title: "Success",
          description: `Welcome back, ${profile.first_name}!`,
        });
      } else {
        console.error('Profile not found for authenticated user:', userId);
        
        // If no profile found and we haven't retried, try again
        if (retryCount < 2) {
          console.log('No profile found, retrying...');
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        
        toast({
          title: "Error",
          description: "User profile not found. Please contact support.",
          variant: "destructive",
        });
        setUser(null);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      
      // If we haven't retried and it's not a permanent error, try again
      if (retryCount < 2 && error?.code !== 'PGRST116') {
        console.log('Retrying profile fetch due to error...');
        setTimeout(() => {
          fetchUserProfile(userId, retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try logging in again.",
        variant: "destructive",
      });
      setUser(null);
      
      // If profile loading fails completely, sign out
      if (retryCount >= 2) {
        console.log('Profile loading failed after retries, signing out');
        supabase.auth.signOut();
      }
    } finally {
      // Only set loading to false on the final attempt or if we succeeded
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Clean up existing state before login
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log('Global signout failed, continuing with login');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user.id);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            school_name: userData.schoolName,
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast({
          title: "Success",
          description: "Account created successfully. Please check your email to verify your account.",
        });
      } else if (data.session) {
        // User is immediately logged in (email confirmation disabled)
        await fetchUserProfile(data.user!.id);
        toast({
          title: "Success", 
          description: "Account created and logged in successfully.",
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors and continue
        console.log('Global signout failed, continuing with logout');
      }
      
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: error.message || "Logout failed",
        variant: "destructive",
      });
      
      // Even on error, try to redirect
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};