/**
 * Auth cleanup utility to prevent authentication limbo states
 */

export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export const forceAuthCleanupAndReload = () => {
  console.log('Forcing complete auth cleanup and reload...');
  
  // Clear all localStorage
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }
  
  // Clear all sessionStorage
  try {
    sessionStorage?.clear();
  } catch (e) {
    console.warn('Could not clear sessionStorage:', e);
  }
  
  // Force reload to completely reset state
  window.location.href = '/auth';
};