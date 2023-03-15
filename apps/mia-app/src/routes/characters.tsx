import { Box, Typography } from '@mui/material'
import { useCreation } from 'ahooks'
import { useEffect, useState } from 'react'
import BaseAppBar from '../components/BaseAppBar'
import { database, models } from '../database'
import { createBackendWorker } from '../workers'

export default function CharacterListPage() {
  const backendWorker = useCreation(() => {
    return createBackendWorker()
  }, [])

  const [text, setText] = useState('')

  useEffect(() => {
    backendWorker.getHelloWithOpts({ name: 'hello' }).then(setText)

    async function handle() {
      const prompts = database.get<models.Prompt>('prompts')

      await database.write(async () => {
        await prompts.create((r) => {
          r.content = 'prompt 1'
        })
      })

      const new_prompts = await prompts.query().fetch()
      console.log(new_prompts)
    }

    handle()
  }, [])

  return (
    <Box>
      <BaseAppBar title="Characters" />
      <Box height={'400px'}></Box>
      <Typography>{text}</Typography>
    </Box>
  )
}
