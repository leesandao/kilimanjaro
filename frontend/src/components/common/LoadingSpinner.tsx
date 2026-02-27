import clsx from 'clsx'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center justify-center p-8', className)}>
      <div className="w-8 h-8 border-[3px] border-gray-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}
