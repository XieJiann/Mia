import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import BaseAppBar from '../components/BaseAppBar'

import { Add as AddIcon } from '@mui/icons-material'

import { useBotStore } from '../stores/bots'
import BotListItem from '../components/bot/BotListItem'
import { useNavigate } from 'react-router-dom'

export default function BotListPage() {
  const [bots] = useBotStore(
    (s) => [s.listBots({ orderBy: 'created_at', order: 'desc' })],
    shallow
  )

  const navigate = useNavigate()

  const handleCreateBot = () => {
    navigate('/bots/create')
  }

  return (
    <Box>
      <BaseAppBar title="Bots" />
      <Box sx={{ height: '80px' }}></Box>
      <Box>
        <List
          sx={{
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <ListItem key="action-add-chat">
            <ListItemButton onClick={handleCreateBot}>
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={'Add Bot'} />
            </ListItemButton>
          </ListItem>
          {bots.data.map((bot) => (
            <React.Fragment key={bot.id}>
              <Divider component="li" />
              <BotListItem bot={bot} />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  )
}
