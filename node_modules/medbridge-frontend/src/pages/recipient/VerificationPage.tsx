import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Alert } from '@/components/feedback/Alert';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import { useVerification, useSubmitVerification } from '@/hooks/useVerification';
import { verificationSchema, type VerificationFormData } from '@/schemas/verificationSchemas';
import { formatDateTime } from '@/utils/formatDate';

export function VerificationPage() {
  const { data: verification, isLoading, isError, refetch } = useVerification();
  const submitVerification = useSubmitVerification();
  const [document, setDocument] = useState<File | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { registrationNumber: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!document) return;
    await submitVerification.mutateAsync({
      registrationNumber: data.registrationNumber,
      document,
    });
  });

  const canSubmit =
    !verification || verification.status === 'REJECTED' || verification.status === 'PENDING';

  return (
    <>
      <PageHeader
        title="Organization verification"
        subtitle="Submit documents to verify your healthcare organization"
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {verification && verification.status !== 'REJECTED' && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text-primary">{verification.organizationName}</p>
                <p className="text-sm text-text-secondary">
                  Submitted {formatDateTime(verification.submittedAt)}
                </p>
              </div>
              <StatusBadge status={verification.status} />
            </div>
            {verification.rejectionReason && (
              <Alert variant="error" title="Rejection reason" className="mt-4">
                {verification.rejectionReason}
              </Alert>
            )}
          </div>
        )}

        {canSubmit && (
          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-lg space-y-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
          >
            {submitVerification.isSuccess && (
              <Alert variant="success" title="Submitted">
                Your verification documents have been submitted for review.
              </Alert>
            )}

            {submitVerification.isError && (
              <Alert variant="error">Unable to submit verification. Please try again.</Alert>
            )}

            <Input
              label="Registration number"
              placeholder="Organization registration number"
              error={errors.registrationNumber?.message}
              {...register('registrationNumber')}
            />

            <div className="space-y-1.5">
              <label htmlFor="document" className="block text-sm font-medium text-text-primary">
                Verification document
              </label>
              <input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                onChange={(e) => setDocument(e.target.files?.[0])}
                className="text-sm text-text-secondary"
              />
            </div>

            <Button
              type="submit"
              isLoading={submitVerification.isPending}
              disabled={!document}
            >
              Submit for review
            </Button>
          </form>
        )}

        {verification?.status === 'APPROVED' && (
          <Alert variant="success" title="Verified">
            Your organization is verified. You can browse and claim medicines.
          </Alert>
        )}
      </QueryState>
    </>
  );
}
