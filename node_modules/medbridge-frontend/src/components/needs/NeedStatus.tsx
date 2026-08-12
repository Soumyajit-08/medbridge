import type { NeedStatus } from '@/types/need';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface NeedStatusProps {
  status: NeedStatus;
  className?: string;
}

export function NeedStatus({ status, className }: NeedStatusProps) {
  return <StatusBadge status={status} className={className} />;
}
