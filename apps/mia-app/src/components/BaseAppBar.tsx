import {
  AppBar,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { shallow } from '../stores'
import { useSettingsStore } from '../stores/settings'
import {
  ArrowBack,
  ColorLensOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  Menu as MenuIcon,
  MoreHoriz as MoreHorizIcon,
  RefreshOutlined,
} from '@mui/icons-material'
import { useThemeMode, useThemeScheme } from '../themes/m3'
import { useNavigate } from 'react-router-dom'

export default function BaseAppBar({
  title,
  leftActionMode = 'more',
}: {
  title?: string
  leftActionMode?: 'more' | 'back'
}) {
  const [toggleMainDrawer] = useSettingsStore(
    (s) => [s.toggleMainDrawer],
    shallow
  )

  const { palette } = useTheme()

  const { toggleThemeMode, resetThemeMode } = useThemeMode()
  const { generateThemeScheme, resetThemeScheme } = useThemeScheme()

  const navigate = useNavigate()

  const handleChangeThemeScheme = () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`
    generateThemeScheme(randomColor)
  }

  const handleResetTheme = () => {
    resetThemeScheme()
  }

  const renderLeftAction = () => {
    if (leftActionMode === 'more') {
      return (
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          onClick={toggleMainDrawer}
        >
          <MenuIcon />
        </IconButton>
      )
    } else if (leftActionMode === 'back') {
      return (
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          onClick={() => {
            navigate(-1)
          }}
        >
          <ArrowBack />
        </IconButton>
      )
    }

    return null
  }

  return (
    <AppBar
      position="absolute"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: '900',
      }}
      color="default"
      elevation={0}
    >
      <Toolbar>{renderLeftAction()}</Toolbar>
      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
        {title || 'Mia'}
      </Typography>
      <Toolbar>
        <Tooltip title="Change Theme Color">
          <IconButton
            size="large"
            color="inherit"
            onClick={handleChangeThemeScheme}
          >
            <ColorLensOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Switch Theme">
          <IconButton size="large" color="inherit" onClick={toggleThemeMode}>
            {palette.mode == 'light' ? (
              <DarkModeOutlined />
            ) : (
              <LightModeOutlined />
            )}
          </IconButton>
        </Tooltip>
        {/* <Tooltip title="Reset Theme Color">
          <IconButton size="large" color="inherit" onClick={handleResetTheme}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip> */}
        <Tooltip title="More">
          <IconButton size="large" color="inherit" onClick={toggleMainDrawer}>
            <MoreHorizIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
