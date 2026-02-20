import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg'
}

const SIZE_CLASSES = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`rounded-lg p-0 backdrop:bg-black/50 ${SIZE_CLASSES[size]} w-[calc(100%-2rem)] m-auto`}
    >
      <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-body">{title}</h2>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-secondary active:text-secondary text-xl leading-none cursor-pointer p-2 -m-2 rounded"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
