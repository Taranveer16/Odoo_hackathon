import type { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '../../types';

type StatusType = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus | string;

const statusConfig: Record<string, { label: string; className: string; dot?: string }> = {
  // Vehicle
  available: { label: 'Available', className: 'badge-success', dot: 'bg-success' },
  on_trip: { label: 'On Trip', className: 'badge-info', dot: 'bg-info' },
  in_shop: { label: 'In Shop', className: 'badge-warning', dot: 'bg-warning' },
  retired: { label: 'Retired', className: 'badge-danger', dot: 'bg-danger' },
  // Driver
  off_duty: { label: 'Off Duty', className: 'badge-neutral', dot: 'bg-neutral' },
  suspended: { label: 'Suspended', className: 'badge-danger', dot: 'bg-danger' },
  // Trip
  draft: { label: 'Draft', className: 'badge-neutral', dot: 'bg-neutral' },
  dispatched: { label: 'Dispatched', className: 'badge-info', dot: 'bg-info' },
  completed: { label: 'Completed', className: 'badge-success', dot: 'bg-success' },
  cancelled: { label: 'Cancelled', className: 'badge-danger', dot: 'bg-danger' },
  // Maintenance
  open: { label: 'Open', className: 'badge-warning', dot: 'bg-warning' },
  // Aliases
  active: { label: 'Active', className: 'badge-success', dot: 'bg-success' },
  pending: { label: 'Pending', className: 'badge-warning', dot: 'bg-warning' },
};

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    className: 'badge-neutral',
    dot: 'bg-neutral',
  };

  return (
    <span className={`${config.className} ${size === 'md' ? 'px-3 py-1 text-sm' : ''} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      )}
      {config.label}
    </span>
  );
}
