import { useContext } from 'react'
import { ThemeModeContext } from '../context/ThemeModeContext'
import { ThemeSchemeContext } from '../context/ThemeSchemeContext'

export function useThemeMode() {
  return useContext(ThemeModeContext)
}

export function useThemeScheme() {
  return useContext(ThemeSchemeContext)
}
