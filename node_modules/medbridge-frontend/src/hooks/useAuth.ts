import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/roleHelpers';
import type { LoginCredentials, RegisterData } from '@/types/auth';

export function useAuthInit() {
  const { setAuth, setLoading, logout } = useAuthStore();

  useEffect(() => {
    authService
      .refresh()
      .then(({ user, accessToken }) => setAuth(user, accessToken))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [setAuth, setLoading, logout]);
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate(getDashboardPath(user.role));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate(getDashboardPath(user.role));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
