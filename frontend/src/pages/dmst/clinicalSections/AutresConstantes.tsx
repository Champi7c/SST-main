import { useState } from 'react'
import { Box, Typography, TextField, Button, Chip } from '@mui/material'

export default function AutresConstantes({ value, onChange }: { value: { label: string; value: string }[]; onChange: (v: { label: string; value: string }[]) => void }) {
  const [label, setLabel] = useState('')
  const [val, setVal] = useState('')
  const add = () => {
    if (!label.trim() || !val.trim()) return
    onChange([...(value || []), { label: label.trim(), value: val.trim() }])
    setLabel('')
    setVal('')
  }
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Autres constantes</Typography>
      <Box display="flex" gap={1} sx={{ mb: 1 }}>
        <TextField size="small" label="Nom" value={label} onChange={(e) => setLabel(e.target.value)} />
        <TextField size="small" label="Valeur" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button variant="outlined" size="small" onClick={add} disabled={!label.trim() || !val.trim()}>Ajouter</Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {(value || []).map((item, i) => (
          <Chip
            key={`${item.label}-${i}`}
            label={`${item.label} : ${item.value}`}
            size="small"
            onDelete={() => onChange(value.filter((_, idx) => idx !== i))}
          />
        ))}
      </Box>
    </Box>
  )
}
