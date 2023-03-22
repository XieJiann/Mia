import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import BaseAppBar from '../components/BaseAppBar'
import { useSettingsStore } from '../stores/settings'
import { shallow } from '../stores'

import { Formik, Form, Field } from 'formik'
import { Select, TextField } from 'formik-mui'
import { useSnackbar } from 'notistack'
import { Settings } from '../backend/models'
import PasswordField from '../components/forms/PasswordField'
import { useUserStore } from '../stores/users'

type FormData = Settings & {
  userSettings: {
    displayName: string
    avatarUrl: string
  }
}

export function SettingsPage() {
  const [mainSettings, updateMainSettings] = useSettingsStore(
    (s) => [s.main, s.updateMainSettings],
    shallow
  )

  const [currentUserRes, updateCurrentUser] = useUserStore(
    (s) => [s.getCurrentUser(), s.updateCurrentUser],
    shallow
  )

  const handleUpdateSettings = async (data: FormData) => {
    await updateMainSettings({
      apiSettings: data.apiSettings,
      chatDefaultSettings: data.chatDefaultSettings,
    })

    await updateCurrentUser({
      displayName: data.userSettings.displayName,
      avatarUrl: data.userSettings.avatarUrl || '',
    })
  }

  const { enqueueSnackbar } = useSnackbar()

  const currentUser = currentUserRes.value
  if (!currentUser) {
    return null
  }

  return (
    <Box>
      <BaseAppBar title="Settings" />
      <Box
        sx={{
          px: 4,
          mt: '80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Formik
          initialValues={
            {
              apiSettings: {
                ...mainSettings.apiSettings,
              },
              chatDefaultSettings: {
                ...mainSettings.chatDefaultSettings,
              },
              userSettings: {
                displayName: currentUser.displayName,
                avatarUrl: currentUser.avatarUrl,
              },
            } as FormData
          }
          onSubmit={(data, { setSubmitting }) => {
            handleUpdateSettings(data)
            setSubmitting(false)

            enqueueSnackbar('Settings saved', {
              variant: 'success',
              autoHideDuration: 1000,
              anchorOrigin: {
                vertical: 'top',
                horizontal: 'center',
              },
            })
          }}
        >
          {({ submitForm, resetForm, isSubmitting }) => (
            <Form>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <Stack gap={2}>
                  <Typography variant="h6">User Settings</Typography>
                  <Field
                    component={TextField}
                    name="userSettings.displayName"
                    label="User Display Name"
                  />
                  <Field
                    component={TextField}
                    name="userSettings.avatarUrl"
                    label="User Avatar URL"
                  />
                </Stack>

                <Divider />
                <Stack gap={2}>
                  <Typography variant="h6">API Settings</Typography>
                  <Field
                    component={TextField}
                    name="apiSettings.openaiApiEndpoint"
                    label="OpenAI API Endpoint"
                  />
                  <Field
                    component={PasswordField}
                    name="apiSettings.openaiApiKey"
                    label="OpenAI API Key"
                  />
                </Stack>
                <Divider />

                <Stack gap={2}>
                  <Typography variant="h6">Chat Settings</Typography>
                  <Field
                    component={TextField}
                    name="chatDefaultSettings.defaultBotName"
                    label="Chat Default Bot Name"
                  />
                </Stack>

                <Stack direction="row" gap={4} justifyContent="center">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                  <Button type="reset" variant="outlined">
                    Reset
                  </Button>
                </Stack>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  )
}
