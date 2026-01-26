import { ComponentProps, useId, useRef } from 'react'
import { Button } from '@/components/ui/button.tsx'

export function SelectFileButton({
  onFileSelected,
  children,
  ...props
}: {
  onFileSelected?: (file: File) => void,
} & Omit<ComponentProps<typeof Button>, 'asChild' | 'onClick'>) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <Button
      {...props}
      onClick={() => fileInputRef.current?.click()}
    >
      {children}
      <input
        id={fileInputId}
        ref={fileInputRef}
        type={'file'}
        className={'hidden'}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && onFileSelected) {
            onFileSelected(file)
          }
        }}
      />
    </Button>
  )
}
