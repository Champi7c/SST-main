import { Box, Grid, Typography, FormControlLabel, Checkbox, TextField } from '@mui/material'
import { FieldApi } from './types'

// Reprend exactement les mêmes champs que la section III "Expositions professionnelles"
// de la Fiche d'observation SST (DMST.tsx) — mêmes clés, mêmes libellés. Ne pas créer
// une nouvelle liste : cette section est partagée entre Fiche d'observation et Consultation.

function CheckGroup({ title, items, getDBool, setD }: {
  title: string
  items: { key: string; label: string }[]
} & Pick<FieldApi, 'getDBool' | 'setD'>) {
  return (
    <Grid item xs={12}>
      <Typography variant="body2" fontWeight="bold" gutterBottom>{title}</Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {items.map((it) => (
          <FormControlLabel
            key={it.key}
            control={<Checkbox checked={getDBool(it.key)} onChange={(e) => setD(it.key, e.target.checked)} />}
            label={it.label}
          />
        ))}
      </Box>
    </Grid>
  )
}

export default function ExpositionsProfessionnellesSection({ getD, setD, getDBool }: FieldApi) {
  return (
    <Grid container spacing={2}>
      <CheckGroup
        title="Risques physiques :" getDBool={getDBool} setD={setD}
        items={[
          { key: 'exp_phys_bruit', label: 'Bruit (> 85 dB)' },
          { key: 'exp_phys_vibrations', label: 'Vibrations' },
          { key: 'exp_phys_chaleur_froid', label: 'Chaleur / Froid' },
          { key: 'exp_phys_rayonnements', label: 'Rayonnements' },
          { key: 'exp_phys_ecran', label: 'Écran > 4h/j' },
        ]}
      />
      <Grid item xs={12}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>Risques chimiques et biologiques :</Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <FormControlLabel control={<Checkbox checked={getDBool('exp_chim_poussieres')} onChange={(e) => setD('exp_chim_poussieres', e.target.checked)} />} label="Poussières" />
          <FormControlLabel control={<Checkbox checked={getDBool('exp_chim_solvants')} onChange={(e) => setD('exp_chim_solvants', e.target.checked)} />} label="Solvants" />
          <FormControlLabel control={<Checkbox checked={getDBool('exp_chim_cmr')} onChange={(e) => setD('exp_chim_cmr', e.target.checked)} />} label="CMR" />
          <FormControlLabel control={<Checkbox checked={getDBool('exp_chim_biologiques')} onChange={(e) => setD('exp_chim_biologiques', e.target.checked)} />} label="Agents biologiques" />
          <FormControlLabel control={<Checkbox checked={getDBool('exp_chim_gaz')} onChange={(e) => setD('exp_chim_gaz', e.target.checked)} />} label="Gaz / Fumées" />
        </Box>
        <TextField fullWidth size="small" label="Préciser" value={getD('exp_chim_preciser')} onChange={(e) => setD('exp_chim_preciser', e.target.value)} sx={{ mt: 1 }} />
      </Grid>
      <CheckGroup
        title="Contraintes biomécaniques :" getDBool={getDBool} setD={setD}
        items={[
          { key: 'exp_bio_port_charges', label: 'Port charges > 15 kg' },
          { key: 'exp_bio_gestes_repetitifs', label: 'Gestes répétitifs' },
          { key: 'exp_bio_postures', label: 'Postures contraignantes' },
          { key: 'exp_bio_station_debout', label: 'Station debout prolongée' },
        ]}
      />
      <CheckGroup
        title="Risques psychosociaux :" getDBool={getDBool} setD={setD}
        items={[
          { key: 'exp_psy_stress', label: 'Stress élevé' },
          { key: 'exp_psy_charge_mentale', label: 'Charge mentale' },
          { key: 'exp_psy_isole', label: 'Travail isolé' },
          { key: 'exp_psy_relations', label: 'Relations difficiles' },
          { key: 'exp_psy_harcelement', label: 'Harcèlement' },
        ]}
      />
      <CheckGroup
        title="Organisation du travail :" getDBool={getDBool} setD={setD}
        items={[
          { key: 'exp_org_nuit', label: 'Travail de nuit' },
          { key: 'exp_org_poste', label: 'Travail posté (3×8)' },
          { key: 'exp_org_irreguliers', label: 'Horaires irréguliers' },
          { key: 'exp_org_astreintes', label: 'Astreintes' },
        ]}
      />
      <CheckGroup
        title="Équipements de protection (EPI) :" getDBool={getDBool} setD={setD}
        items={[
          { key: 'epi_gants', label: 'Gants' },
          { key: 'epi_masque', label: 'Masque' },
          { key: 'epi_lunettes', label: 'Lunettes' },
          { key: 'epi_casque', label: 'Casque' },
          { key: 'epi_auditif', label: 'Protections auditives' },
          { key: 'epi_chaussures', label: 'Chaussures sécurité' },
        ]}
      />
    </Grid>
  )
}
