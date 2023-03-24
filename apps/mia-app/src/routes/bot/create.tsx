import { Box, Button, MenuItem, Stack } from '@mui/material'
import { Field, Form, Formik, FormikConfig, FormikErrors } from 'formik'
import { Select, TextField } from 'formik-mui'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { shallow } from 'zustand/shallow'
import { miaService } from '../../backend/service'
import BaseAppBar from '../../components/BaseAppBar'
import { useTopSnakebar } from '../../hooks/useSnakeBar'
import { useBotStore } from '../../stores/bots'
import { formatErrorUserFriendly } from '../../utils'

interface FormData {
  name: string
  displayName: string
  avatarUrl: string
  description: string
  botTemplateId: string
  initialPrompts: string
}

export function BotCreatePage() {
  const [bots, botTemplates, createBot] = useBotStore(
    (s) => [
      s.listBots({ orderBy: 'created_at', order: 'desc' }),
      s.listBotTemplates({ orderBy: 'name', order: 'asc' }),
      s.createBot,
    ],
    shallow
  )

  const navigate = useNavigate()

  const { enqueueSnackbar } = useTopSnakebar()

  const botTemplateOptions = useMemo(() => {
    return botTemplates.data.map((botTemplate) => (
      <MenuItem key={botTemplate.id} value={botTemplate.id}>
        {botTemplate.name}
      </MenuItem>
    ))
  }, [botTemplates])

  const handleCancel = () => {
    navigate(-1)
  }

  const handleValidate = async (values: FormData) => {
    const errors: FormikErrors<FormData> = {}

    if (!values.name) {
      errors.name = 'Required'
    }

    if (values.name) {
      // check unique
      const res = await miaService.checkBotNameValid({ name: values.name })
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
      const res = await createBot({
        name: values.name,
        displayName: values.displayName,
        description: values.description,
        avatarUrl: values.avatarUrl,
        botTemplateId: values.botTemplateId,
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

    enqueueSnackbar('Bot created', { variant: 'success' })
    navigate(-1)
  }

  return (
    <Box>
      <BaseAppBar title="Bots" leftActionMode="back" />
      <Box sx={{ height: '80px' }}></Box>
      <Box sx={{ px: 4 }}>
        <Formik
          initialValues={
            {
              name: '',
              displayName: '',
              avatarUrl: '',
              botTemplateId: '_openai-chat',
              initialPrompts: '',
            } as FormData
          }
          onSubmit={handleSubmit}
          onReset={handleCancel}
          validate={handleValidate}
        >
          {({ isSubmitting }) => (
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
                  component={Select}
                  name="botTemplateId"
                  label="Bot Template"
                  required
                >
                  {botTemplateOptions}
                </Field>
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
                    Create
                  </Button>
                  <Button type="reset" variant="outlined">
                    Cancel
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
