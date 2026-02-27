import clsx from 'clsx'

const VARIANTS: Record<string, string> = {
  online: 'bg-green-100 text-green-700',
  offline: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-600',
  scanning: 'bg-blue-100 text-blue-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        VARIANTS[status] || VARIANTS.unknown
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-gray-400'
        )}
      />
      {status}
    </span>
  )
}
