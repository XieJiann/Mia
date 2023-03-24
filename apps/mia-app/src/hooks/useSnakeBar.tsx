import { useMemoizedFn } from 'ahooks'
import { OptionsObject, useSnackbar } from 'notistack'

export function useTopSnakebar() {
  const { enqueueSnackbar } = useSnackbar()

  const handleEnqueueSnackbar = useMemoizedFn(
    (message: string, options?: OptionsObject) => {
      const opts: OptionsObject = {
        variant: 'success',
        autoHideDuration: 1000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
        ...options,
      }

      enqueueSnackbar(message, opts)
    }
  )

  return { enqueueSnackbar: handleEnqueueSnackbar }
}
