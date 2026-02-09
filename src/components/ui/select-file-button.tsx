import {ComponentProps, useId, useRef, useState} from 'react'
import {Button} from '@/components/ui/button.tsx'
import {Spinner} from '@/components/ui/spinner.tsx'

export function SelectFileButton({
  onFileSelected,
  children,
  ...props
}: {
  onFileSelected?: (file: File) => Promise<void>,
} & Omit<ComponentProps<typeof Button>, 'asChild' | 'onClick'>) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [callbackLoading, setCallbackLoading] = useState(false)

  const onFile = async (file: File | undefined) => {
    if (file && onFileSelected) {
      setCallbackLoading(true)
      try {
        await onFileSelected(file)
      } finally {
        setCallbackLoading(false)
      }
    }
  }

  return (
    <Button
      {...props}
      onClick={() => fileInputRef.current?.click()}
      disabled={callbackLoading}
    >
      <span className={callbackLoading ? 'opacity-0' : ''}>
        {children}
      </span>
      {callbackLoading && <span className={'absolute inset-0 grid place-content-center'}>
        <Spinner/>
      </span>}
      <input
        id={fileInputId}
        ref={fileInputRef}
        type={'file'}
        className={'hidden'}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </Button>
  )
}
