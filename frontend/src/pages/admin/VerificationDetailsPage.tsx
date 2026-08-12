import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Alert } from '@/components/feedback/Alert';
import { StatusBadge } from '@/components/common/StatusBadge';
import { QueryState } from '@/components/dashboard/QueryState';
import {
  useAdminVerification,
  useApproveRecipient,
  useRejectRecipient,
} from '@/hooks/useAdmin';
import { ROUTES } from '@/lib/constants';
import { formatDateTime } from '@/utils/formatDate';

export function VerificationDetailsPage() {
  const { id = '' } = useParams();
  const { data: verification, isLoading, isError, refetch } = useAdminVerification(id);
  const approve = useApproveRecipient();
  const reject = useRejectRecipient();
  const [reason, setReason] = useState('');

  return (
    <>
      <PageHeader
        title="Verification details"
        actions={
          <Link to={ROUTES.admin.verifications}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to queue
            </Button>
          </Link>
        }
      />

      <QueryState isLoading={isLoading} isError={isError} onRetry={() => refetch()}>
        {verification && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {verification.organizationName}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {verification.organizationType.replace(/_/g, ' ')}
                  </p>
                </div>
                <StatusBadge status={verification.status} />
              </div>

              <dl className="mt-6 space-y-3 text-sm">
                <div>
                  <dt className="text-text-secondary">Registration number</dt>
                  <dd className="font-medium text-text-primary">
                    {verification.registrationNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Submitted</dt>
                  <dd className="font-medium text-text-primary">
                    {formatDateTime(verification.submittedAt)}
                  </dd>
                </div>
                {verification.documentName && (
                  <div>
                    <dt className="text-text-secondary">Document</dt>
                    <dd className="font-medium text-text-primary">
                      {verification.documentName}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {verification.status === 'PENDING' && (
              <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
                {(approve.isSuccess || reject.isSuccess) && (
                  <Alert variant="success">Decision recorded successfully.</Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    isLoading={approve.isPending}
                    onClick={() => approve.mutate(verification.recipientId)}
                  >
                    Approve
                  </Button>
                </div>

                <div className="border-t border-border pt-4">
                  <Input
                    label="Rejection reason"
                    placeholder="Reason for rejection (required to reject)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <Button
                    variant="danger"
                    className="mt-3"
                    disabled={!reason.trim()}
                    isLoading={reject.isPending}
                    onClick={() =>
                      reject.mutate({ id: verification.recipientId, reason: reason.trim() })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </QueryState>
    </>
  );
}
