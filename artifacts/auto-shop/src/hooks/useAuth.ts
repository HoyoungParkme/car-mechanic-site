import { useQuery } from '@tanstack/react-query';

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  profile_image: string | null;
  is_admin: boolean;
}

export function useAuth() {
  const { data: user = null, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  return { user, isLoading, isAdmin: user?.is_admin ?? false };
}
