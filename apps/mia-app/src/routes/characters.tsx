import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { shallow } from 'zustand/shallow'
import BaseAppBar from '../components/BaseAppBar'

import { useCharacterStore } from '../stores/characters'

export default function CharacterListPage() {
  const [text, setText] = useState('')

  const [characters, createCharacter] = useCharacterStore(
    (s) => [s.listCharacters({}), s.createCharacter],
    shallow
  )

  const handleCreateCharacter = async () => {
    await createCharacter({
      name: 'test',
    })
  }

  return (
    <Box>
      <BaseAppBar title="Characters" />
      <Box height={'400px'}></Box>
      <Typography>{text}</Typography>

      <List>
        <ListItem sx={{ mb: '4' }}>
          <ListItemButton onClick={handleCreateCharacter}>
            Create Character
          </ListItemButton>
        </ListItem>
        {characters.data.map((c) => (
          <ListItem key={c.id}>
            <ListItemText>{c.name}</ListItemText>
            <ListItemText>{c.descriptionPrompt}</ListItemText>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
