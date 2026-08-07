import { Box, Typography, TextField, ToggleButton, ToggleButtonGroup, Grid } from '@mui/material'
import { FieldApi } from './types'

const BINARY_ITEMS: { key: string; label: string; normalPhrase: string }[] = [
  { key: 'deshydratation', label: 'Déshydratation', normalPhrase: 'Pas de déshydratation' },
  { key: 'denutrition', label: 'Dénutrition', normalPhrase: 'Pas de dénutrition' },
  { key: 'paleur', label: 'Pâleur', normalPhrase: 'Pas de pâleur' },
  { key: 'ictere', label: 'Ictère', normalPhrase: "Pas d'ictère" },
  { key: 'cyanose', label: 'Cyanose', normalPhrase: 'Pas de cyanose' },
  { key: 'oedemes', label: 'Œdèmes', normalPhrase: "Pas d'œdèmes" },
  { key: 'adenopathies', label: 'Adénopathies', normalPhrase: "Pas d'adénopathies palpables" },
  { key: 'signes_detresse', label: 'Signes de détresse', normalPhrase: 'Pas de signes de détresse' },
]

const DESCRIPTORS: { key: string; label: string; normal: string; abnormal: string }[] = [
  { key: 'etat_general', label: 'État général', normal: 'Conservé', abnormal: 'Altéré' },
  { key: 'conscience', label: 'Conscience', normal: 'Normale', abnormal: 'Altérée' },
  { key: 'orientation', label: 'Orientation', normal: 'Normale', abnormal: 'Désorientation' },
  { key: 'cooperation', label: 'Coopération', normal: 'Coopérant', abnormal: 'Non coopérant' },
]

export default function EtatGeneralSection({ getD, setD }: FieldApi) {
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {DESCRIPTORS.map((desc) => {
          const value = getD(`general_${desc.key}`)
          return (
            <Grid item xs={12} sm={6} key={desc.key}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{desc.label}</Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={value || null}
                onChange={(_, v) => setD(`general_${desc.key}`, v || '')}
              >
                <ToggleButton value="normal">{desc.normal}</ToggleButton>
                <ToggleButton value="abnormal">{desc.abnormal}</ToggleButton>
              </ToggleButtonGroup>
              {value === 'abnormal' && (
                <TextField
                  fullWidth size="small" placeholder="Préciser"
                  value={getD(`general_${desc.key}_details`)}
                  onChange={(e) => setD(`general_${desc.key}_details`, e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Grid>
          )
        })}
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Faciès (si particulier)" value={getD('general_facies')} onChange={(e) => setD('general_facies', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Morphotype (si particulier)" value={getD('general_morphotype')} onChange={(e) => setD('general_morphotype', e.target.value)} />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        {BINARY_ITEMS.map((item) => {
          const status = getD(`general_${item.key}_status`)
          return (
            <Grid item xs={12} sm={6} key={item.key}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="body2" sx={{ minWidth: 130 }}>{item.label}</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={status || null}
                  onChange={(_, v) => setD(`general_${item.key}_status`, v || '')}
                >
                  <ToggleButton value="absent">Absent</ToggleButton>
                  <ToggleButton value="present">Présent</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {status === 'absent' && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>{item.normalPhrase}</Typography>
              )}
              {status === 'present' && (
                <TextField
                  fullWidth size="small" placeholder="Préciser"
                  value={getD(`general_${item.key}_details`)}
                  onChange={(e) => setD(`general_${item.key}_details`, e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Grid>
          )
        })}
      </Grid>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('general_autre')} onChange={(e) => setD('general_autre', e.target.value)}
        sx={{ mt: 1.5 }}
      />
    </Box>
  )
}
