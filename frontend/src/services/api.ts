import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractErrorDetails(error: AxiosError<{ message?: string; detail?: string | Array<{ msg: string }> }>): {
  title: string;
  message: string;
} {
  const status = error.response?.status;
  const data = error.response?.data;

  // Extract raw backend message
  let backendMsg = '';
  if (typeof data?.message === 'string' && data.message.trim()) {
    backendMsg = data.message.trim();
  } else if (typeof data?.detail === 'string' && data.detail.trim()) {
    backendMsg = data.detail.trim();
  } else if (Array.isArray(data?.detail)) {
    backendMsg = data.detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
  }

  // Network or offline errors
  if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return {
      title: 'Server Connection Failed',
      message:
        'Unable to reach the server. The backend cloud instance may be waking up from standby (takes ~30-50s on Render Free Tier) or your device is offline. Please wait a moment and try again.',
    };
  }

  switch (status) {
    case 400:
      return {
        title: 'Request Failed (400)',
        message: backendMsg || 'The server could not process the submitted data. Please verify your inputs.',
      };
    case 401:
      return {
        title: 'Authentication Failed (401)',
        message: backendMsg || 'Incorrect email/password or your session has expired. Please sign in again.',
      };
    case 403:
      return {
        title: 'Access Restricted (403)',
        message:
          backendMsg ||
          'You do not have permission for this action. If you are a recipient, your verification might be pending.',
      };
    case 404:
      return {
        title: 'Not Found (404)',
        message: backendMsg || 'The requested medicine, listing, or resource could not be found.',
      };
    case 409:
      return {
        title: 'Conflict (409)',
        message: backendMsg || 'An account with this email or an identical active record already exists.',
      };
    case 422:
      return {
        title: 'Validation Error (422)',
        message: backendMsg || 'Some required fields are missing or improperly formatted. Please check form inputs.',
      };
    case 429:
      return {
        title: 'Too Many Requests (429)',
        message: 'Rate limit reached. Please wait a few moments before trying again.',
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        title: 'Server Error (500)',
        message: backendMsg || 'The server encountered an unexpected error. Please retry in a few moments.',
      };
    default:
      return {
        title: 'Action Failed',
        message: backendMsg || error.message || 'An unexpected error occurred. Please try again.',
      };
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; detail?: string | Array<{ msg: string }> }>) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (error.response?.status === 401 && !isAuthEndpoint && originalRequest) {
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken, user } = data;
        useAuthStore.getState().setAuth(user, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    const { title, message } = extractErrorDetails(error);

    // Dispatch a visible toast notification explaining the failure reason
    const isSilentCheck = url.endsWith('/auth/me') || url.endsWith('/auth/refresh');
    if (!isSilentCheck) {
      useUIStore.getState().addToast('error', message, title);
    }

    return Promise.reject(new Error(message));
  },
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
