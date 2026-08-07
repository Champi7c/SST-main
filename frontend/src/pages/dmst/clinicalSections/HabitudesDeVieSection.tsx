import { useMemo } from 'react'
import { Box, Grid, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material'
import { FieldApi } from './types'

export default function HabitudesDeVieSection({ getD, setD }: FieldApi) {
  const paquetsAnnees = useMemo(() => {
    const cig = Number(getD('tabac_cig_jour'))
    const duree = Number(getD('tabac_duree_annees'))
    if (cig > 0 && duree > 0) return ((cig / 20) * duree).toFixed(1)
    return ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getD('tabac_cig_jour'), getD('tabac_duree_annees')])

  const tabacStatut = getD('tabac_statut') || 'non_fumeur'
  const alcoolStatut = getD('alcool_statut') || 'absence'

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Activité physique</InputLabel>
          <Select value={getD('activite_physique_niveau') || 'absence'} label="Activité physique" onChange={(e) => setD('activite_physique_niveau', e.target.value)}>
            <MenuItem value="absence">Absence</MenuItem>
            <MenuItem value="faible">Faible</MenuItem>
            <MenuItem value="moderee">Modérée</MenuItem>
            <MenuItem value="importante">Importante</MenuItem>
          </Select>
        </FormControl>
        {getD('activite_physique_niveau') && getD('activite_physique_niveau') !== 'absence' && (
          <TextField fullWidth size="small" label="Fréquence" value={getD('activite_physique_frequence')} onChange={(e) => setD('activite_physique_frequence', e.target.value)} sx={{ mt: 1 }} />
        )}
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Tabac</InputLabel>
          <Select value={tabacStatut} label="Tabac" onChange={(e) => setD('tabac_statut', e.target.value)}>
            <MenuItem value="non_fumeur">Non-fumeur</MenuItem>
            <MenuItem value="ancien">Ancien fumeur</MenuItem>
            <MenuItem value="fumeur">Fumeur</MenuItem>
          </Select>
        </FormControl>
        {(tabacStatut === 'fumeur' || tabacStatut === 'ancien') && (
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
            <TextField size="small" type="number" label="Cigarettes/jour" value={getD('tabac_cig_jour')} onChange={(e) => setD('tabac_cig_jour', e.target.value)} sx={{ width: 140 }} />
            <TextField size="small" type="number" label="Durée (années)" value={getD('tabac_duree_annees')} onChange={(e) => setD('tabac_duree_annees', e.target.value)} sx={{ width: 140 }} />
            {paquetsAnnees && <Chip size="small" label={`${paquetsAnnees} paquets-années`} />}
          </Box>
        )}
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Alcool</InputLabel>
          <Select value={alcoolStatut} label="Alcool" onChange={(e) => setD('alcool_statut', e.target.value)}>
            <MenuItem value="absence">Absence</MenuItem>
            <MenuItem value="occasionnel">Occasionnel</MenuItem>
            <MenuItem value="regulier">Régulier</MenuItem>
          </Select>
        </FormControl>
        {alcoolStatut !== 'absence' && (
          <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <TextField size="small" label="Quantité" value={getD('alcool_quantite')} onChange={(e) => setD('alcool_quantite', e.target.value)} />
            <TextField size="small" label="Fréquence" value={getD('alcool_frequence')} onChange={(e) => setD('alcool_frequence', e.target.value)} />
            <TextField size="small" label="Type de boisson" value={getD('alcool_type')} onChange={(e) => setD('alcool_type', e.target.value)} />
          </Box>
        )}
      </Grid>

      <Grid item xs={6} sm={3}>
        <TextField fullWidth size="small" type="number" label="Café (tasses/j)" value={getD('cafe_tasses')} onChange={(e) => setD('cafe_tasses', e.target.value)} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField fullWidth size="small" type="number" label="Thé (tasses/j)" value={getD('the_tasses')} onChange={(e) => setD('the_tasses', e.target.value)} />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Phytothérapie</InputLabel>
          <Select value={getD('phyto_statut') || 'non'} label="Phytothérapie" onChange={(e) => setD('phyto_statut', e.target.value)}>
            <MenuItem value="non">Non</MenuItem>
            <MenuItem value="oui">Oui</MenuItem>
          </Select>
        </FormControl>
        {getD('phyto_statut') === 'oui' && (
          <TextField fullWidth size="small" label="Préciser" value={getD('phyto_details')} onChange={(e) => setD('phyto_details', e.target.value)} sx={{ mt: 1 }} />
        )}
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Automédication / autres substances</InputLabel>
          <Select value={getD('automedication_statut') || 'non'} label="Automédication / autres substances" onChange={(e) => setD('automedication_statut', e.target.value)}>
            <MenuItem value="non">Non</MenuItem>
            <MenuItem value="oui">Oui</MenuItem>
          </Select>
        </FormControl>
        {getD('automedication_statut') === 'oui' && (
          <TextField fullWidth size="small" label="Préciser" value={getD('automedication_details')} onChange={(e) => setD('automedication_details', e.target.value)} sx={{ mt: 1 }} />
        )}
      </Grid>
    </Grid>
  )
}
