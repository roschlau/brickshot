import { ReactNode, useState, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils.ts'

export function EditableTextCell({column, value, placeholder, onUpdate, className, children}: {
  column: string,
  value: string,
  placeholder?: string,
  onUpdate: (value: string) => void,
  className?: string,
  children?: ReactNode,
}) {
  const [editing, setEditing] = useState(false)
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    switch (event.key) {
      case 'Escape':
        setEditing(false)
        break
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault()
          ;(event.target as HTMLTextAreaElement).blur()
          setEditing(false)
        }
        break
    }
  }
  return (
    <div className={cn(column + ' self-stretch relative hover:bg-accent dark:hover:bg-accent/50', className)}>
      <div className={`h-full p-1 whitespace-break-spaces text-sm opacity-0`}>
        {value || (placeholder ?? '')}
      </div>
      <textarea
        className={'absolute top-0 left-0 size-full resize-none focus:z-10 p-1 text-sm'}
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={event => onUpdate(event.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={onKeyDown}
      />
      <span className={editing ? 'opacity-0 pointer-events-none' : ''}>{children}</span>
    </div>
  )
}
