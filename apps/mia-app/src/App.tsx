import { CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import CharacterListPage from './routes/characters'
import { ChatPage } from './routes/chat'
import ChatListPage from './routes/chats'
import ErrorPage from './routes/error'
import RootPage from './routes/root'
import { SettingsPage } from './routes/settings'
import M3ThemeProvider from './themes/m3/M3ThemeProvider'

const router = createHashRouter([
  {
    path: '/',
    children: [
      {
        index: true,
        element: <Navigate to="/chats" />,
      },
      {
        path: '/chats',
        element: <ChatListPage />,
      },
      {
        path: '/chats/:chatId',
        element: <ChatPage />,
      },
      {
        path: '/characters',
        element: <CharacterListPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
    element: <RootPage />,
    errorElement: <ErrorPage />,
  },
])

function App() {
  return (
    <CssBaseline>
      <M3ThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </M3ThemeProvider>
    </CssBaseline>
  )
}

export default App
