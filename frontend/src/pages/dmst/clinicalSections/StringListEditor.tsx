import { useState } from 'react'
import { Box, Typography, TextField, Button, Chip } from '@mui/material'

export default function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v) return
    onChange([...values, v])
    setInput('')
  }
  return (
    <Box>
      {label && <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>}
      <Box display="flex" gap={1} sx={{ mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <Button variant="outlined" size="small" onClick={add} disabled={!input.trim()}>Ajouter</Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {values.length === 0 && <Typography variant="caption" color="text.secondary">Aucun élément</Typography>}
        {values.map((v, i) => (
          <Chip key={`${v}-${i}`} label={v} size="small" onDelete={() => onChange(values.filter((_, idx) => idx !== i))} />
        ))}
      </Box>
    </Box>
  )
}
