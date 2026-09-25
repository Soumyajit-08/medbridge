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

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<import('@/types/auth').AuthUser>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      useAuthStore.getState().setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      addToast('success', 'Your profile details have been updated successfully.', 'Profile Updated');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      addToast('error', msg, 'Update Failed');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    updateProfileError: updateProfileMutation.error,
  };
}
