import React, { useMemo } from 'react'
import ListItemIcon from '@mui/material/ListItemIcon'
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  IconButton,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  Diversity1 as Diversity1Icon,
  GitHub as GitHubIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { DrawerChatList } from './DrawerChatList'
import { useIsMobile } from '../hooks'
import { useSettingsStore } from '../stores/settings'

import { shallow } from 'zustand/shallow'
import { useNavigate } from 'react-router-dom'

interface AppList {
  name: string
  icon: React.ReactElement
  onClick: () => void
}

const container =
  globalThis.window !== undefined
    ? () => globalThis.window.document.body
    : undefined

function MainDrawer({ width }: { width: number }) {
  const [mainDrawerOpened, closeMainDrawer] = useSettingsStore(
    (s) => [s.ui.mainDrawerOpened, s.closeMainDrawer],
    shallow
  )

  const isMobile = useIsMobile()

  const navigate = useNavigate()

  const appList = useMemo(
    () =>
      [
        {
          name: 'Chats',
          icon: <QuestionAnswerIcon />,
          onClick: () => {
            // goto `/chats` use react-router
            navigate('/chats', { replace: false })
          },
        },
        {
          name: 'Bots',
          icon: <Diversity1Icon />,
          onClick: () => {
            navigate('/bots', { replace: false })
          },
        },
        {
          name: 'Settings',
          icon: <SettingsIcon />,
          onClick: () => {
            navigate('/settings', { replace: false })
          },
        },
        {
          name: 'Source Code',
          icon: <GitHubIcon />,
          onClick: () => {
            window.open(`https://github.com/brody715/mia`, '_blank')
          },
        },
      ] as AppList[],
    [navigate]
  )

  const drawer = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      height="100vh"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      {/* DrawerHeader */}
      <Box
        display="flex"
        justifyContent="flex-end"
        padding="0 4"
        alignItems="center"
      >
        <IconButton onClick={closeMainDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box flex="1" maxHeight="50vh">
        <DrawerChatList />
      </Box>
      <Divider />
      <Box aria-label="apps" justifySelf="flex-end" mb="12px">
        <List>
          <ListItem></ListItem>
          {appList.map((app) => (
            <ListItem key={app.name}>
              <ListItemButton onClick={app.onClick}>
                <ListItemIcon>{app.icon}</ListItemIcon>
                <ListItemText primary={app.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box>
      {/* for mobile */}
      <Drawer
        container={container}
        open={mainDrawerOpened}
        variant="temporary"
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
        onClose={closeMainDrawer}
      >
        {drawer}
      </Drawer>
      {/* for desktop */}
      <Drawer
        variant="persistent"
        open={mainDrawerOpened}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export default MainDrawer
