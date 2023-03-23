import { useMemoizedFn } from 'ahooks'
import { useEffect, useMemo, useState } from 'react'

export function useEditable(opts: {
  value: string
  onValueEdited?: (value: string) => void
}) {
  const [editFormValue, setEditFormValue] = useState('')
  const [editing, setEditing] = useState(false)

  const startEditing = useMemoizedFn(() => {
    setEditFormValue(opts.value)
    setEditing(true)
  })

  const finishEditing = useMemoizedFn(() => {
    opts.onValueEdited && opts.onValueEdited(editFormValue)
    setEditing(false)
  })

  const cancelEditing = useMemoizedFn(() => {
    setEditFormValue(opts.value)
    setEditing(false)
  })

  const onEditFormValueChange = setEditFormValue

  return {
    editing,
    startEditing,
    finishEditing,
    cancelEditing,
    editFormValue,
    onEditFormValueChange,
  }
}
