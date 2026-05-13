import { PrescriptionStatus } from '@/types';

type Props = {
  status: PrescriptionStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span className={status === 'consumed' ? 'badge-consumed' : 'badge-pending'}>
      {status === 'consumed' ? 'Consumida' : 'Pendiente'}
    </span>
  );
}