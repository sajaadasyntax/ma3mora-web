import { useUser } from './userContext';

/**
 * Hook to check if current user is an auditor (read-only)
 */
export function useIsAuditor() {
  const { user } = useUser();
  return user?.role === 'AUDITOR';
}

/**
 * Hook to check if current user can perform write operations
 */
export function useCanWrite() {
  const { user } = useUser();
  return user?.role !== 'AUDITOR';
}

/**
 * Utility function to check if user is auditor
 */
export function isAuditor(role: string | undefined) {
  return role === 'AUDITOR';
}

/**
 * Utility function to check if user can write
 */
export function canWrite(role: string | undefined) {
  return role !== 'AUDITOR';
}
