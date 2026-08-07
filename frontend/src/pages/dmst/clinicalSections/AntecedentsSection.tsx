import { Grid, Typography, TextField, FormControlLabel, Checkbox, Box } from '@mui/material'
import { FieldApi } from './types'
import StringListEditor from './StringListEditor'

interface AntecedentsSectionProps extends FieldApi {
  isFemaleAdult: boolean
  isChild: boolean
}

function AntecedentGroup({ label, noneKey, listKey, placeholder, getD, setD, getDBool, getDList }: {
  label: string
  noneKey: string
  listKey: string
  placeholder: string
} & FieldApi) {
  const none = getDBool(noneKey)
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>
      <FormControlLabel
        control={<Checkbox checked={none} onChange={(e) => setD(noneKey, e.target.checked)} />}
        label={`Aucun ${label.toLowerCase()} connu`}
      />
      {!none && <StringListEditor label="" values={getDList(listKey)} onChange={(v) => setD(listKey, v)} placeholder={placeholder} />}
    </Grid>
  )
}

export default function AntecedentsSection({ data, getD, setD, getDBool, getDList, isFemaleAdult, isChild }: AntecedentsSectionProps) {
  return (
    <Grid container spacing={2}>
      <AntecedentGroup
        label="Antécédents médicaux" noneKey="atcd_medicaux_aucun" listKey="atcd_medicaux_liste"
        placeholder="Ex. Diabète type 2, HTA..." data={data} getD={getD} setD={setD} getDBool={getDBool} getDList={getDList}
      />
      <AntecedentGroup
        label="Antécédents chirurgicaux" noneKey="atcd_chirurgicaux_aucun" listKey="atcd_chirurgicaux_liste"
        placeholder="Ex. Appendicectomie (2015)..." data={data} getD={getD} setD={setD} getDBool={getDBool} getDList={getDList}
      />
      <Grid item xs={12} sm={6}>
        <TextField fullWidth multiline rows={2} label="Antécédents traumatiques" value={getD('atcd_traumatiques')} onChange={(e) => setD('atcd_traumatiques', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth multiline rows={2} label="Antécédents allergiques" value={getD('atcd_allergiques')} onChange={(e) => setD('atcd_allergiques', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth multiline rows={2} label="Antécédents transfusionnels" value={getD('atcd_transfusionnels')} onChange={(e) => setD('atcd_transfusionnels', e.target.value)} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth multiline rows={2} label="Antécédents familiaux" value={getD('atcd_familiaux')} onChange={(e) => setD('atcd_familiaux', e.target.value)} />
      </Grid>

      {isFemaleAdult && (
        <>
          <Grid item xs={12}><Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Antécédents gynéco-obstétricaux</Typography></Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth multiline rows={2} label="Antécédents gynécologiques" value={getD('atcd_gyneco')} onChange={(e) => setD('atcd_gyneco', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth multiline rows={2} label="Antécédents obstétricaux" value={getD('atcd_obstetricaux')} onChange={(e) => setD('atcd_obstetricaux', e.target.value)} />
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Gestité" value={getD('gyneco_gestite')} onChange={(e) => setD('gyneco_gestite', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Parité" value={getD('gyneco_parite')} onChange={(e) => setD('gyneco_parite', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Grossesses" value={getD('gyneco_grossesses')} onChange={(e) => setD('gyneco_grossesses', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Accouchements" value={getD('gyneco_accouchements')} onChange={(e) => setD('gyneco_accouchements', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Fausses couches" value={getD('gyneco_fausses_couches')} onChange={(e) => setD('gyneco_fausses_couches', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Interruptions de grossesse" value={getD('gyneco_ivg')} onChange={(e) => setD('gyneco_ivg', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Cycle menstruel" value={getD('gyneco_cycle')} onChange={(e) => setD('gyneco_cycle', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="date" label="Date des dernières règles" InputLabelProps={{ shrink: true }} value={getD('gyneco_ddr')} onChange={(e) => setD('gyneco_ddr', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Contraception" value={getD('gyneco_contraception')} onChange={(e) => setD('gyneco_contraception', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel control={<Checkbox checked={getDBool('gyneco_menopause')} onChange={(e) => setD('gyneco_menopause', e.target.checked)} />} label="Ménopause" />
            {getDBool('gyneco_menopause') && (
              <TextField size="small" type="date" label="Depuis le" InputLabelProps={{ shrink: true }} value={getD('gyneco_menopause_date')} onChange={(e) => setD('gyneco_menopause_date', e.target.value)} sx={{ ml: 2 }} />
            )}
          </Grid>
        </>
      )}

      {isChild && (
        <>
          <Grid item xs={12}><Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Rubriques pédiatriques</Typography></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Antécédents néonataux" value={getD('pedia_neonatal')} onChange={(e) => setD('pedia_neonatal', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Vaccination" value={getD('pedia_vaccination')} onChange={(e) => setD('pedia_vaccination', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Développement psychomoteur" value={getD('pedia_developpement')} onChange={(e) => setD('pedia_developpement', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Croissance" value={getD('pedia_croissance')} onChange={(e) => setD('pedia_croissance', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Allaitement" value={getD('pedia_allaitement')} onChange={(e) => setD('pedia_allaitement', e.target.value)} /></Grid>
        </>
      )}

      <Grid item xs={12}>
        <Box sx={{ mt: 0.5 }}>
          <TextField fullWidth size="small" placeholder="Autre / préciser" value={getD('atcd_autre')} onChange={(e) => setD('atcd_autre', e.target.value)} />
        </Box>
      </Grid>
    </Grid>
  )
}
