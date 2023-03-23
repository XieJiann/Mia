import { useMemoizedFn } from 'ahooks'
import { useRef, useState } from 'react'

/**
 * Hook to handle double confirm
 * @param opts
 * @returns
 */
export function useDoubleConfirm<Keys extends string | number>(opts: {
  onConfirm: (key: Keys) => void
  onConfirmCanceled: (key: Keys) => void
  onConfirming?: (key: Keys) => void
}) {
  const [confirming, setConfirming] = useState<boolean>(false)
  const confirmingKeyRef = useRef<Keys | null>()

  const startConfirming = useMemoizedFn((key: Keys) => {
    setConfirming(true)
    confirmingKeyRef.current = key
    opts.onConfirming && opts.onConfirming(key)
  })

  const confirm = useMemoizedFn(() => {
    const key = confirmingKeyRef.current
    if (key == null) {
      return
    }
    setConfirming(false)
    opts.onConfirm(key)
  })

  const cancelConfirm = useMemoizedFn(() => {
    setConfirming(false)
    const key = confirmingKeyRef.current
    if (key == null) {
      return
    }
    opts.onConfirmCanceled(key)
    confirmingKeyRef.current = null
  })

  return {
    confirmingKey: confirmingKeyRef.current,
    confirming,
    startConfirming,
    confirm,
    cancelConfirm,
  }
}
