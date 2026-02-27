import clsx from 'clsx'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function Card({ title, children, className, action }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
