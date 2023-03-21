import { Box, SxProps, useTheme } from '@mui/material'
import React from 'react'
import { Outlet } from 'react-router-dom'
import MainDrawer from '../components/MainDrawer'
import MoreDrawer from '../components/MoreDrawer'
import { useIsMobile } from '../hooks'
import { useSettingsStore } from '../stores/settings'

function Main({
  mainDrawerWidth,
  children,
}: {
  children: React.ReactNode
  mainDrawerWidth: number
}) {
  const theme = useTheme()
  const isMobile = useIsMobile()

  const mainDrawerOpened = useSettingsStore((s) => s.ui.mainDrawerOpened)

  const sx: SxProps = {
    position: 'relative',
    width: '100%',
    flexGrow: 1,
    paddingX: theme.spacing(0),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(mainDrawerOpened &&
      !isMobile && {
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: `${mainDrawerWidth}px`,
      }),
  }

  return <Box sx={sx}>{children}</Box>
}

export default function RootPage() {
  const isMobile = useIsMobile()

  const drawerWidth = isMobile ? 280 : 360

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
      }}
    >
      <MainDrawer width={drawerWidth} />
      <Main mainDrawerWidth={drawerWidth}>
        <Outlet />
      </Main>
      <MoreDrawer />
    </Box>
  )
}
