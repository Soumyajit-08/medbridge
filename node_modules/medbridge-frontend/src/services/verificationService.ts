import { api } from './api';
import type { VerificationSubmission, VerificationPayload } from '@/types/verification';

export const verificationService = {
  async getVerification(): Promise<VerificationSubmission | null> {
    const { data } = await api.get<VerificationSubmission | null>('/recipients/verification');
    return data;
  },

  async submitVerification(payload: VerificationPayload): Promise<VerificationSubmission> {
    const formData = new FormData();
    formData.append('registrationNumber', payload.registrationNumber);
    formData.append('document', payload.document);
    const { data } = await api.post<VerificationSubmission>(
      '/recipients/verification',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
