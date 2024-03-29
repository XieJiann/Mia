import { CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { BotCreatePage } from './routes/bot/create'
import BotUpdatePage from './routes/bot/update'
import BotListPage from './routes/bots'
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
        path: '/bots',
        element: <BotListPage />,
      },
      {
        path: '/bots/:botId/update',
        element: <BotUpdatePage />,
      },
      {
        path: '/bots/create',
        element: <BotCreatePage />,
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
