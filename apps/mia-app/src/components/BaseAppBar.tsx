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
  ColorLensOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  Menu as MenuIcon,
  MoreHoriz as MoreHorizIcon,
  RefreshOutlined,
} from '@mui/icons-material'
import { useThemeMode, useThemeScheme } from '../themes/m3'

export default function BaseAppBar({ title }: { title?: string }) {
  const [toggleMainDrawer] = useSettingsStore(
    (s) => [s.toggleMainDrawer],
    shallow
  )

  const { palette } = useTheme()

  const { toggleThemeMode, resetThemeMode } = useThemeMode()
  const { generateThemeScheme, resetThemeScheme } = useThemeScheme()

  const handleChangeThemeScheme = () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`
    generateThemeScheme(randomColor)
  }

  const handleResetTheme = () => {
    resetThemeScheme()
  }

  return (
    <AppBar
      position="absolute"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
      color="default"
      elevation={0}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          onClick={toggleMainDrawer}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
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
