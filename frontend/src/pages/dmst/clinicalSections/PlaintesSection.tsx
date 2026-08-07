import { Box, Typography, TextField, FormControlLabel, Checkbox, Autocomplete, Grid, Divider } from '@mui/material'
import { FieldApi } from './types'

const PLAINTES_BASE = [
  'Douleur', 'Fièvre', 'Toux', 'Dyspnée', 'Douleur thoracique', 'Palpitations',
  'Douleur abdominale', 'Nausées / Vomissements', 'Diarrhée', 'Constipation',
  'Céphalées', 'Vertiges', 'Fatigue', 'Troubles du sommeil',
  'Éruption cutanée', 'Douleur articulaire', 'Troubles urinaires', 'Anxiété / Stress',
]

interface PlainteDetail {
  siege?: string
  debut?: string
  duree?: string
  mode_installation?: string
  evolution?: string
  intensite?: string
  irradiation?: string
  declenchants?: string
  aggravants?: string
  calmants?: string
  associes?: string
}

const DETAIL_FIELDS: { key: keyof PlainteDetail; label: string }[] = [
  { key: 'siege', label: 'Siège' },
  { key: 'debut', label: 'Début' },
  { key: 'duree', label: 'Durée' },
  { key: 'mode_installation', label: "Mode d'installation" },
  { key: 'evolution', label: 'Évolution' },
  { key: 'intensite', label: 'Intensité' },
  { key: 'irradiation', label: 'Irradiation' },
  { key: 'declenchants', label: 'Facteurs déclenchants' },
  { key: 'aggravants', label: 'Facteurs aggravants' },
  { key: 'calmants', label: 'Facteurs calmants' },
  { key: 'associes', label: 'Signes associés' },
]

export default function PlaintesSection({ data, getD, setD, getDBool, getDList }: FieldApi) {
  const aucune = getDBool('plaintes_aucune')
  const liste = getDList('plaintes_liste')
  const details = (data['plaintes_detail'] as Record<string, PlainteDetail>) || {}

  const setDetail = (plainte: string, field: keyof PlainteDetail, value: string) => {
    setD('plaintes_detail', { ...details, [plainte]: { ...(details[plainte] || {}), [field]: value } })
  }

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={aucune}
            onChange={(e) => {
              setD('plaintes_aucune', e.target.checked)
              if (e.target.checked) setD('plaintes_liste', [])
            }}
          />
        }
        label="Aucune plainte"
      />
      {!aucune && (
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            multiple
            freeSolo
            options={PLAINTES_BASE}
            value={liste}
            onChange={(_, newValue) => setD('plaintes_liste', newValue)}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Plaintes" placeholder="Sélectionner ou taper une plainte..." />
            )}
          />
          {liste.map((plainte) => (
            <Box key={plainte} sx={{ mt: 2, p: 1.5, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{plainte}</Typography>
              <Grid container spacing={1.5}>
                {DETAIL_FIELDS.map((f) => (
                  <Grid item xs={12} sm={4} key={f.key}>
                    <TextField
                      fullWidth size="small" label={f.label}
                      value={details[plainte]?.[f.key] || ''}
                      onChange={(e) => setDetail(plainte, f.key, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <TextField
            fullWidth size="small" placeholder="Autre / préciser"
            value={getD('plaintes_autre')} onChange={(e) => setD('plaintes_autre', e.target.value)}
          />
        </Box>
      )}
    </Box>
  )
}
