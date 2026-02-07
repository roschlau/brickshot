import * as React from 'react'

import {cn} from '@/lib/utils'

/**
 *
 * @param className
 * @param type
 * @param props
 * @constructor
 */
function EditableText({className, ...props}: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type={'text'}
      data-slot="input"
      className={cn(
        'min-w-0 rounded-md bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow]',
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'hover:bg-input/30 focus:bg-input/30 not-focus:cursor-pointer',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export {EditableText}
