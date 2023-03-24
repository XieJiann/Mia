import { Box, Button, Stack } from '@mui/material'
import { TextField } from 'formik-mui'
import { FormikErrors, FormikConfig, Formik, Field, Form } from 'formik'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { Constants, miaService } from '../../backend/service'
import BaseAppBar from '../../components/BaseAppBar'
import { useTopSnakebar } from '../../hooks/useSnakeBar'
import { useBotStore } from '../../stores/bots'
import { formatErrorUserFriendly } from '../../utils'

interface FormData {
  name: string
  displayName: string
  avatarUrl: string
  description: string
  initialPrompts: string
}

export default function BotUpdatePage() {
  const { botId } = useParams<{ botId: string }>()
  const [updateBot] = useBotStore((s) => [s.updateBot], shallow)

  const navigate = useNavigate()

  const { enqueueSnackbar } = useTopSnakebar()

  const { value: bot, error } = useBotStore((s) => s.getBot(botId || ''))

  if (error || (bot && bot.deletedAt != null)) {
    return <Navigate to="/bots" />
  }

  if (!bot) {
    return null
  }

  const handleValidate = async (values: FormData) => {
    const errors: FormikErrors<FormData> = {}

    if (!values.name) {
      errors.name = 'Required'
    }

    if (values.name) {
      // check unique
      const res = await miaService.checkBotNameValid({
        name: values.name,
        curId: botId,
      })
      if (res.error) {
        errors.name = res.error.message
      }
    }

    return errors
  }

  const handleSubmit: FormikConfig<FormData>['onSubmit'] = async (
    values,
    { setSubmitting, setErrors }
  ) => {
    try {
      const res = await updateBot(bot.id, {
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        avatarUrl: values.avatarUrl,
        botTemplateParams: {
          initialPrompts: values.initialPrompts,
        },
      })

      if (res.error) {
        setErrors({ name: res.error.message })
        return
      }
    } catch (e) {
      setErrors({ name: formatErrorUserFriendly(e) })
    } finally {
      setSubmitting(false)
    }

    enqueueSnackbar('Bot updated', { variant: 'success' })
  }

  return (
    <Box>
      <BaseAppBar title="Bots" leftActionMode="back" />
      <Box sx={{ height: '80px' }}></Box>
      <Box sx={{ px: 4 }}>
        <Formik
          initialValues={
            {
              name: bot.name,
              displayName: bot.displayName,
              description: bot.description,
              avatarUrl: bot.avatarUrl,
              initialPrompts: bot.botTemplateParams.initialPrompts || '',
            } as FormData
          }
          onSubmit={handleSubmit}
          validate={handleValidate}
        >
          {({ isSubmitting, handleReset, handleSubmit }) => (
            <Form>
              <Stack gap={4}>
                <Field
                  component={TextField}
                  name="name"
                  label="Bot Name"
                  required
                />
                <Field
                  component={TextField}
                  name="displayName"
                  label="Bot Display Name"
                />
                <Field
                  component={TextField}
                  name="avatarUrl"
                  label="Avatar Url"
                />
                <Field
                  component={TextField}
                  name="description"
                  label="Description"
                />
                <Field
                  component={TextField}
                  name="initialPrompts"
                  label="Initial Prompts"
                  minRows={4}
                  multiline
                />

                <Stack direction="row" gap={4} justifyContent="center">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    Update
                  </Button>
                  <Button type="reset" variant="outlined">
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  )
}
