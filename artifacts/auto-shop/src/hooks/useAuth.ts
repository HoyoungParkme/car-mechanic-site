import { useQueryClient } from '@tanstack/react-query';

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  profile_image: null;
  is_admin: boolean;
}

const STORAGE_KEY = 'dream_motors_demo_user';

export function getDemoUser(): DemoUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearDemoUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useAuth() {
  const user = getDemoUser();
  return {
    user,
    isLoading: false,
    isAdmin: user?.is_admin ?? false,
  };
}
