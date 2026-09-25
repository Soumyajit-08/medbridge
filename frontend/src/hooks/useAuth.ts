import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getDashboardPath } from '@/utils/roleHelpers';
import type { LoginCredentials, RegisterData } from '@/types/auth';

export function useAuthInit() {
  const { setAuth, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const state = useAuthStore.getState();
    const token = state.accessToken;

    if (token && state.isAuthenticated) {
      // Validate current token with /me
      authService
        .getMe()
        .then((user) => {
          setUser(user);
        })
        .catch(() => {
          // Token expired, attempt refresh
          authService
            .refresh()
            .then(({ user, accessToken }) => setAuth(user, accessToken))
            .catch(() => logout());
        })
        .finally(() => setLoading(false));
    } else {
      // Attempt silent cookie refresh if any
      authService
        .refresh()
        .then(({ user, accessToken }) => setAuth(user, accessToken))
        .catch(() => {
          // No active session, stay unauthenticated
        })
        .finally(() => setLoading(false));
    }
  }, [setAuth, setUser, setLoading, logout]);
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      addToast('success', `Welcome back, ${user.name}!`, 'Signed In');
      navigate(getDashboardPath(user.role));
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      addToast('success', 'Your account has been successfully created.', 'Registration Complete');
      navigate(getDashboardPath(user.role));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      addToast('info', 'You have been safely signed out.', 'Signed Out');
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
