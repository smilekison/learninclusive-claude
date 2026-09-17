import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from './Layout';

/**
 * Some routes (video browsing/detail) are public — anonymous visitors see
 * them with the plain marketing-style nav. Logged-in users were losing the
 * app sidebar entirely on those routes since they weren't wrapped in
 * <Layout>. This restores it for authenticated users while leaving the
 * anonymous experience untouched.
 */
export const AuthAwareShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Layout>{children}</Layout>;
  }
  return <>{children}</>;
};
