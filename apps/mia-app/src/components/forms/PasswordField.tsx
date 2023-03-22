import { Visibility, VisibilityOff } from '@mui/icons-material'
import { IconButton, Input, InputAdornment, InputProps } from '@mui/material'
import { TextField, TextFieldProps } from 'formik-mui'
import { useState } from 'react'

export type PasswordFieldProps = Omit<TextFieldProps, 'type'>
export default function PasswordField(props: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TextField
      {...props}
      type={showPassword ? 'text' : 'password'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
