import { Box } from '@mui/material'
import { shallow } from 'zustand/shallow'
import BaseAppBar from '../../components/BaseAppBar'
import { useBotStore } from '../../stores/bots'

export default function BotUpdatePage() {
  const [bots] = useBotStore(
    (s) => [s.listBots({ orderBy: 'created_at', order: 'desc' })],
    shallow
  )

  return (
    <Box>
      <BaseAppBar title="Bots" leftActionMode="back" />
      <Box sx={{ height: '80px' }}></Box>
      <Box></Box>
    </Box>
  )
}
