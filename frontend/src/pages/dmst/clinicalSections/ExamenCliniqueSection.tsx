import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Chip,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { FieldApi } from './types'
import {
  RESPI_INSPECTION, RESPI_PALPATION, RESPI_PERCUSSION, RESPI_SIGNS, RESPI_COTE, RESPI_SIEGE, RESPI_FACE,
  CARDIO_INSPECTION, CARDIO_PALPATION, CARDIO_POULS_TERRITOIRE, CARDIO_SIGNS, CARDIO_SOUFFLE_TYPE, CARDIO_FOYER,
  generateRespiratoirePhrase, generateCardiovasculairePhrase, Option,
  DIGESTIF_INSPECTION, DIGESTIF_PALPATION, DIGESTIF_PERCUSSION, DIGESTIF_SIGNS, DIGESTIF_SIEGE, generateDigestifPhrase,
  OSTEO_INSPECTION, OSTEO_PALPATION, OSTEO_MOBILITE, OSTEO_SIGNS, OSTEO_SIEGE, OSTEO_COTE, generateOsteoarticulairePhrase,
  DERMATO_TYPE_LESION, DERMATO_CARACTERISTIQUES, DERMATO_SIEGE, DERMATO_COTE, generateDermatologiquePhrase,
  ORL_OREILLES, ORL_NEZ, ORL_GORGE, ORL_COTE, generateOrlPhrase,
  GANGLIO_TERRITOIRE, GANGLIO_CARACTERISTIQUES, GANGLIO_COTE, generateGanglionnairePhrase,
  UROGENITAL_SIGNS, UROGENITAL_COTE, generateUrogenitalPhrase,
  OPHTALMO_SIGNS, OPHTALMO_COTE, generateOphtalmologiquePhrase,
  generateGynecologiquePhrase,
  NEURO_CONSCIENCE_NIVEAU, NEURO_MOTRICITE_MEMBRES, NEURO_TONUS, NEURO_REFLEXES, NEURO_REFLEXE_STATUT, NEURO_BABINSKI,
  NEURO_COORDINATION, NEURO_MARCHE_TYPE, NEURO_MENINGES, generateNeurologiquePhrase,
} from './semiology'

const SYSTEMS: { key: string; label: string; detailed?: boolean }[] = [
  { key: 'respiratoire', label: 'Respiratoire', detailed: true },
  { key: 'cardiovasculaire', label: 'Cardiovasculaire', detailed: true },
  { key: 'digestif', label: 'Digestif', detailed: true },
  { key: 'neurologique', label: 'Neurologique', detailed: true },
  { key: 'osteoarticulaire', label: 'Ostéo-articulaire', detailed: true },
  { key: 'dermatologique', label: 'Dermatologique', detailed: true },
  { key: 'orl', label: 'ORL', detailed: true },
  { key: 'ganglionnaire', label: 'Aires ganglionnaires', detailed: true },
  { key: 'urogenital', label: 'Uro-génital', detailed: true },
  { key: 'ophtalmologique', label: 'Ophtalmologique', detailed: true },
]

interface ExamenCliniqueSectionProps extends FieldApi {
  includeGynecologique?: boolean
}

function CheckboxGroup({ options, values, onChange }: { options: Option[]; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <FormGroup row>
      {options.map((o) => (
        <FormControlLabel
          key={o.key}
          control={
            <Checkbox
              size="small"
              checked={values.includes(o.key)}
              onChange={(e) => onChange(e.target.checked ? [...values, o.key] : values.filter((v) => v !== o.key))}
            />
          }
          label={o.label}
        />
      ))}
    </FormGroup>
  )
}

function RespiratoireDetail({ data, getD, setD, getDList }: FieldApi) {
  const signs = getDList('exam_respiratoire_signs')
  const siege = getDList('exam_respiratoire_siege')
  const face = getDList('exam_respiratoire_face')
  const inspection = getDList('exam_respiratoire_inspection')
  const palpation = getDList('exam_respiratoire_palpation')
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Inspection</Typography>
      <CheckboxGroup options={RESPI_INSPECTION} values={inspection} onChange={(v) => setD('exam_respiratoire_inspection', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Palpation</Typography>
      <CheckboxGroup options={RESPI_PALPATION} values={palpation} onChange={(v) => setD('exam_respiratoire_palpation', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Percussion</Typography>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Percussion</InputLabel>
        <Select
          value={getD('exam_respiratoire_percussion')}
          label="Percussion"
          onChange={(e) => setD('exam_respiratoire_percussion', e.target.value)}
        >
          <MenuItem value="">Sonorité normale</MenuItem>
          {RESPI_PERCUSSION.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Auscultation — signes</Typography>
      <CheckboxGroup options={RESPI_SIGNS} values={signs} onChange={(v) => setD('exam_respiratoire_signs', v)} />
      {signs.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Côté</InputLabel>
            <Select value={getD('exam_respiratoire_cote')} label="Côté" onChange={(e) => setD('exam_respiratoire_cote', e.target.value)}>
              <MenuItem value="">—</MenuItem>
              {RESPI_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="caption" display="block">Siège</Typography>
            <CheckboxGroup options={RESPI_SIEGE} values={siege} onChange={(v) => setD('exam_respiratoire_siege', v)} />
          </Box>
          <Box>
            <Typography variant="caption" display="block">Face</Typography>
            <CheckboxGroup options={RESPI_FACE} values={face} onChange={(v) => setD('exam_respiratoire_face', v)} />
          </Box>
        </Box>
      )}
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_respiratoire_autre')} onChange={(e) => setD('exam_respiratoire_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateRespiratoirePhrase(data)}
      </Typography>
    </Box>
  )
}

function CardiovasculaireDetail({ data, getD, setD, getDList }: FieldApi) {
  const signs = getDList('exam_cardiovasculaire_signs')
  const inspection = getDList('exam_cardiovasculaire_inspection')
  const palpation = getDList('exam_cardiovasculaire_palpation')
  const poulsTerritoire = getDList('exam_cardiovasculaire_pouls_territoire')
  const hasSouffle = signs.includes('souffle')
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Inspection</Typography>
      <CheckboxGroup options={CARDIO_INSPECTION} values={inspection} onChange={(v) => setD('exam_cardiovasculaire_inspection', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Palpation</Typography>
      <CheckboxGroup options={CARDIO_PALPATION} values={palpation} onChange={(v) => setD('exam_cardiovasculaire_palpation', v)} />
      <Box>
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Territoires de pouls concernés</Typography>
        <CheckboxGroup options={CARDIO_POULS_TERRITOIRE} values={poulsTerritoire} onChange={(v) => setD('exam_cardiovasculaire_pouls_territoire', v)} />
      </Box>
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Auscultation</Typography>
      <CheckboxGroup options={CARDIO_SIGNS} values={signs} onChange={(v) => setD('exam_cardiovasculaire_signs', v)} />
      {hasSouffle && (
        <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Type</InputLabel>
            <Select value={getD('exam_cardiovasculaire_souffle_type')} label="Type" onChange={(e) => setD('exam_cardiovasculaire_souffle_type', e.target.value)}>
              {CARDIO_SOUFFLE_TYPE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Foyer</InputLabel>
            <Select value={getD('exam_cardiovasculaire_souffle_foyer')} label="Foyer" onChange={(e) => setD('exam_cardiovasculaire_souffle_foyer', e.target.value)}>
              {CARDIO_FOYER.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField size="small" label="Intensité" value={getD('exam_cardiovasculaire_souffle_intensite')} onChange={(e) => setD('exam_cardiovasculaire_souffle_intensite', e.target.value)} sx={{ width: 120 }} />
          <TextField size="small" label="Irradiation" value={getD('exam_cardiovasculaire_souffle_irradiation')} onChange={(e) => setD('exam_cardiovasculaire_souffle_irradiation', e.target.value)} />
        </Box>
      )}
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_cardiovasculaire_autre')} onChange={(e) => setD('exam_cardiovasculaire_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateCardiovasculairePhrase(data)}
      </Typography>
    </Box>
  )
}

function DigestifDetail({ data, getD, setD, getDList }: FieldApi) {
  const signs = getDList('exam_digestif_signs')
  const siege = getDList('exam_digestif_siege')
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Inspection</Typography>
      <CheckboxGroup options={DIGESTIF_INSPECTION} values={getDList('exam_digestif_inspection')} onChange={(v) => setD('exam_digestif_inspection', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Palpation</Typography>
      <CheckboxGroup options={DIGESTIF_PALPATION} values={getDList('exam_digestif_palpation')} onChange={(v) => setD('exam_digestif_palpation', v)} />
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" display="block">Siège</Typography>
        <CheckboxGroup options={DIGESTIF_SIEGE} values={siege} onChange={(v) => setD('exam_digestif_siege', v)} />
      </Box>
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Percussion</Typography>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Percussion</InputLabel>
        <Select value={getD('exam_digestif_percussion')} label="Percussion" onChange={(e) => setD('exam_digestif_percussion', e.target.value)}>
          <MenuItem value="">Sonorité normale</MenuItem>
          {DIGESTIF_PERCUSSION.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Auscultation</Typography>
      <CheckboxGroup options={DIGESTIF_SIGNS} values={signs} onChange={(v) => setD('exam_digestif_signs', v)} />
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_digestif_autre')} onChange={(e) => setD('exam_digestif_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateDigestifPhrase(data)}
      </Typography>
    </Box>
  )
}

function OsteoarticulaireDetail({ data, getD, setD, getDList }: FieldApi) {
  const signs = getDList('exam_osteoarticulaire_signs')
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Inspection</Typography>
      <CheckboxGroup options={OSTEO_INSPECTION} values={getDList('exam_osteoarticulaire_inspection')} onChange={(v) => setD('exam_osteoarticulaire_inspection', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Palpation</Typography>
      <CheckboxGroup options={OSTEO_PALPATION} values={getDList('exam_osteoarticulaire_palpation')} onChange={(v) => setD('exam_osteoarticulaire_palpation', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Mobilité</Typography>
      <CheckboxGroup options={OSTEO_MOBILITE} values={getDList('exam_osteoarticulaire_mobilite')} onChange={(v) => setD('exam_osteoarticulaire_mobilite', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Type de douleur</Typography>
      <CheckboxGroup options={OSTEO_SIGNS} values={signs} onChange={(v) => setD('exam_osteoarticulaire_signs', v)} />
      <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Côté</InputLabel>
          <Select value={getD('exam_osteoarticulaire_cote')} label="Côté" onChange={(e) => setD('exam_osteoarticulaire_cote', e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {OSTEO_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="caption" display="block">Siège (articulation)</Typography>
          <CheckboxGroup options={OSTEO_SIEGE} values={getDList('exam_osteoarticulaire_siege')} onChange={(v) => setD('exam_osteoarticulaire_siege', v)} />
        </Box>
      </Box>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_osteoarticulaire_autre')} onChange={(e) => setD('exam_osteoarticulaire_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateOsteoarticulairePhrase(data)}
      </Typography>
    </Box>
  )
}

function DermatologiqueDetail({ data, getD, setD, getDList }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Type de lésion</Typography>
      <CheckboxGroup options={DERMATO_TYPE_LESION} values={getDList('exam_dermatologique_type_lesion')} onChange={(v) => setD('exam_dermatologique_type_lesion', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Caractéristiques</Typography>
      <CheckboxGroup options={DERMATO_CARACTERISTIQUES} values={getDList('exam_dermatologique_caracteristiques')} onChange={(v) => setD('exam_dermatologique_caracteristiques', v)} />
      <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Côté</InputLabel>
          <Select value={getD('exam_dermatologique_cote')} label="Côté" onChange={(e) => setD('exam_dermatologique_cote', e.target.value)}>
            <MenuItem value="">—</MenuItem>
            {DERMATO_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
        <Box>
          <Typography variant="caption" display="block">Siège</Typography>
          <CheckboxGroup options={DERMATO_SIEGE} values={getDList('exam_dermatologique_siege')} onChange={(v) => setD('exam_dermatologique_siege', v)} />
        </Box>
      </Box>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_dermatologique_autre')} onChange={(e) => setD('exam_dermatologique_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateDermatologiquePhrase(data)}
      </Typography>
    </Box>
  )
}

function OrlDetail({ data, getD, setD, getDList }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Oreilles</Typography>
      <CheckboxGroup options={ORL_OREILLES} values={getDList('exam_orl_oreilles')} onChange={(v) => setD('exam_orl_oreilles', v)} />
      <FormControl size="small" sx={{ minWidth: 140, mt: 0.5 }}>
        <InputLabel>Côté</InputLabel>
        <Select value={getD('exam_orl_cote')} label="Côté" onChange={(e) => setD('exam_orl_cote', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {ORL_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Nez / sinus</Typography>
      <CheckboxGroup options={ORL_NEZ} values={getDList('exam_orl_nez')} onChange={(v) => setD('exam_orl_nez', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Gorge</Typography>
      <CheckboxGroup options={ORL_GORGE} values={getDList('exam_orl_gorge')} onChange={(v) => setD('exam_orl_gorge', v)} />
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_orl_autre')} onChange={(e) => setD('exam_orl_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateOrlPhrase(data)}
      </Typography>
    </Box>
  )
}

function GanglionnaireDetail({ data, getD, setD, getDList }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Territoire</Typography>
      <CheckboxGroup options={GANGLIO_TERRITOIRE} values={getDList('exam_ganglionnaire_territoire')} onChange={(v) => setD('exam_ganglionnaire_territoire', v)} />
      <Typography variant="caption" fontWeight={600} display="block" sx={{ mt: 1 }}>Caractéristiques</Typography>
      <CheckboxGroup options={GANGLIO_CARACTERISTIQUES} values={getDList('exam_ganglionnaire_caracteristiques')} onChange={(v) => setD('exam_ganglionnaire_caracteristiques', v)} />
      <FormControl size="small" sx={{ minWidth: 140, mt: 0.5 }}>
        <InputLabel>Côté</InputLabel>
        <Select value={getD('exam_ganglionnaire_cote')} label="Côté" onChange={(e) => setD('exam_ganglionnaire_cote', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {GANGLIO_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_ganglionnaire_autre')} onChange={(e) => setD('exam_ganglionnaire_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateGanglionnairePhrase(data)}
      </Typography>
    </Box>
  )
}

function UrogenitalDetail({ data, getD, setD, getDList }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Signes</Typography>
      <CheckboxGroup options={UROGENITAL_SIGNS} values={getDList('exam_urogenital_signs')} onChange={(v) => setD('exam_urogenital_signs', v)} />
      <FormControl size="small" sx={{ minWidth: 140, mt: 0.5 }}>
        <InputLabel>Côté</InputLabel>
        <Select value={getD('exam_urogenital_cote')} label="Côté" onChange={(e) => setD('exam_urogenital_cote', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {UROGENITAL_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_urogenital_autre')} onChange={(e) => setD('exam_urogenital_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateUrogenitalPhrase(data)}
      </Typography>
    </Box>
  )
}

function OphtalmologiqueDetail({ data, getD, setD, getDList }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" fontWeight={600} display="block">Signes</Typography>
      <CheckboxGroup options={OPHTALMO_SIGNS} values={getDList('exam_ophtalmologique_signs')} onChange={(v) => setD('exam_ophtalmologique_signs', v)} />
      <FormControl size="small" sx={{ minWidth: 140, mt: 0.5 }}>
        <InputLabel>Côté</InputLabel>
        <Select value={getD('exam_ophtalmologique_cote')} label="Côté" onChange={(e) => setD('exam_ophtalmologique_cote', e.target.value)}>
          <MenuItem value="">—</MenuItem>
          {OPHTALMO_COTE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
        </Select>
      </FormControl>
      <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
        <TextField size="small" label="Acuité de loin" value={getD('exam_ophtalmologique_acuite_loin')} onChange={(e) => setD('exam_ophtalmologique_acuite_loin', e.target.value)} sx={{ width: 160 }} />
        <TextField size="small" label="Acuité de près" value={getD('exam_ophtalmologique_acuite_pres')} onChange={(e) => setD('exam_ophtalmologique_acuite_pres', e.target.value)} sx={{ width: 160 }} />
      </Box>
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_ophtalmologique_autre')} onChange={(e) => setD('exam_ophtalmologique_autre', e.target.value)}
        sx={{ mt: 1 }}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateOphtalmologiquePhrase(data)}
      </Typography>
    </Box>
  )
}

function GynecologiqueSousPartie({ label, statusKey, detailsKey, getD, setD }: {
  label: string; statusKey: string; detailsKey: string
} & Pick<FieldApi, 'getD' | 'setD'>) {
  const status = getD(statusKey)
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <RadioGroup row value={status} onChange={(e) => setD(statusKey, e.target.value)}>
        <FormControlLabel value="normal" control={<Radio size="small" />} label="Normal" />
        <FormControlLabel value="anormal" control={<Radio size="small" />} label="Anormal" />
      </RadioGroup>
      {status === 'anormal' && (
        <TextField fullWidth size="small" placeholder="Préciser" value={getD(detailsKey)} onChange={(e) => setD(detailsKey, e.target.value)} />
      )}
    </Box>
  )
}

function GynecologiqueDetail({ data, getD, setD }: FieldApi) {
  return (
    <Box sx={{ mt: 1 }}>
      <GynecologiqueSousPartie label="Seins" statusKey="exam_gynecologique_seins_status" detailsKey="exam_gynecologique_seins_details" getD={getD} setD={setD} />
      <GynecologiqueSousPartie label="OGE / Spéculum" statusKey="exam_gynecologique_oge_speculum_status" detailsKey="exam_gynecologique_oge_speculum_details" getD={getD} setD={setD} />
      <GynecologiqueSousPartie label="Toucher vaginal" statusKey="exam_gynecologique_tv_status" detailsKey="exam_gynecologique_tv_details" getD={getD} setD={setD} />
      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_gynecologique_autre')} onChange={(e) => setD('exam_gynecologique_autre', e.target.value)}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateGynecologiquePhrase(data)}
      </Typography>
    </Box>
  )
}

function NeuroModule({ index, label, examined, onToggle, children }: {
  index: number; label: string; examined: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode
}) {
  return (
    <Box sx={{ mb: 1.5, pb: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <FormControlLabel
        control={<Checkbox size="small" checked={examined} onChange={(e) => onToggle(e.target.checked)} />}
        label={<Typography variant="body2" fontWeight={600}>{index}. {label}</Typography>}
      />
      {examined && <Box sx={{ ml: 4 }}>{children}</Box>}
    </Box>
  )
}

function NeurologiqueDetail({ data, getD, setD, getDBool, getDList }: FieldApi) {
  const m = (key: string) => ({
    examined: getDBool(`exam_neurologique_${key}_examined`),
    onToggle: (v: boolean) => setD(`exam_neurologique_${key}_examined`, v),
  })
  return (
    <Box sx={{ mt: 1 }}>
      <NeuroModule index={1} label="Conscience" {...m('conscience')}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Niveau</InputLabel>
          <Select value={getD('exam_neurologique_conscience_niveau') || 'normale'} label="Niveau" onChange={(e) => setD('exam_neurologique_conscience_niveau', e.target.value)}>
            {NEURO_CONSCIENCE_NIVEAU.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
      </NeuroModule>

      <NeuroModule index={2} label="Orientation et fonctions supérieures" {...m('orientation')}>
        <RadioGroup row value={getD('exam_neurologique_orientation_status')} onChange={(e) => setD('exam_neurologique_orientation_status', e.target.value)}>
          <FormControlLabel value="normal" control={<Radio size="small" />} label="Normales" />
          <FormControlLabel value="anormal" control={<Radio size="small" />} label="Anormales" />
        </RadioGroup>
        {getD('exam_neurologique_orientation_status') === 'anormal' && (
          <TextField fullWidth size="small" placeholder="Préciser (langage, mémoire...)" value={getD('exam_neurologique_orientation_details')} onChange={(e) => setD('exam_neurologique_orientation_details', e.target.value)} />
        )}
      </NeuroModule>

      <NeuroModule index={3} label="Motricité" {...m('motricite')}>
        <Typography variant="caption" display="block">Membre(s) déficitaire(s)</Typography>
        <CheckboxGroup options={NEURO_MOTRICITE_MEMBRES} values={getDList('exam_neurologique_motricite_membres')} onChange={(v) => setD('exam_neurologique_motricite_membres', v)} />
        <FormControl size="small" sx={{ minWidth: 140, mt: 1 }}>
          <InputLabel>Tonus</InputLabel>
          <Select value={getD('exam_neurologique_motricite_tonus') || 'normal'} label="Tonus" onChange={(e) => setD('exam_neurologique_motricite_tonus', e.target.value)}>
            {NEURO_TONUS.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
      </NeuroModule>

      <NeuroModule index={4} label="Sensibilité" {...m('sensibilite')}>
        <RadioGroup row value={getD('exam_neurologique_sensibilite_status')} onChange={(e) => setD('exam_neurologique_sensibilite_status', e.target.value)}>
          <FormControlLabel value="normal" control={<Radio size="small" />} label="Conservée" />
          <FormControlLabel value="anormal" control={<Radio size="small" />} label="Anormale" />
        </RadioGroup>
        {getD('exam_neurologique_sensibilite_status') === 'anormal' && (
          <TextField fullWidth size="small" placeholder="Préciser (territoire, type)" value={getD('exam_neurologique_sensibilite_details')} onChange={(e) => setD('exam_neurologique_sensibilite_details', e.target.value)} />
        )}
      </NeuroModule>

      <NeuroModule index={5} label="Réflexes ostéo-tendineux" {...m('reflexes')}>
        <Box display="flex" gap={2} flexWrap="wrap">
          {NEURO_REFLEXES.map((r) => (
            <FormControl key={r.key} size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{r.label}</InputLabel>
              <Select
                value={getD(`exam_neurologique_reflexe_${r.key}`) || 'normal'}
                label={r.label}
                onChange={(e) => setD(`exam_neurologique_reflexe_${r.key}`, e.target.value)}
              >
                {NEURO_REFLEXE_STATUT.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
              </Select>
            </FormControl>
          ))}
        </Box>
        <FormControl size="small" sx={{ minWidth: 180, mt: 1 }}>
          <InputLabel>Cutané plantaire</InputLabel>
          <Select value={getD('exam_neurologique_reflexes_babinski') || 'flexion'} label="Cutané plantaire" onChange={(e) => setD('exam_neurologique_reflexes_babinski', e.target.value)}>
            {NEURO_BABINSKI.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
      </NeuroModule>

      <NeuroModule index={6} label="Coordination" {...m('coordination')}>
        <CheckboxGroup options={NEURO_COORDINATION} values={getDList('exam_neurologique_coordination_anomalies')} onChange={(v) => setD('exam_neurologique_coordination_anomalies', v)} />
      </NeuroModule>

      <NeuroModule index={7} label="Nerfs crâniens" {...m('nerfs_craniens')}>
        <RadioGroup row value={getD('exam_neurologique_nerfs_craniens_status')} onChange={(e) => setD('exam_neurologique_nerfs_craniens_status', e.target.value)}>
          <FormControlLabel value="normal" control={<Radio size="small" />} label="Normaux" />
          <FormControlLabel value="anormal" control={<Radio size="small" />} label="Atteinte" />
        </RadioGroup>
        {getD('exam_neurologique_nerfs_craniens_status') === 'anormal' && (
          <TextField fullWidth size="small" placeholder="Préciser la ou les paires atteintes" value={getD('exam_neurologique_nerfs_craniens_details')} onChange={(e) => setD('exam_neurologique_nerfs_craniens_details', e.target.value)} />
        )}
      </NeuroModule>

      <NeuroModule index={8} label="Marche et équilibre" {...m('marche')}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={getD('exam_neurologique_marche_type') || 'normale'} label="Type" onChange={(e) => setD('exam_neurologique_marche_type', e.target.value)}>
            {NEURO_MARCHE_TYPE.map((o) => (<MenuItem key={o.key} value={o.key}>{o.label}</MenuItem>))}
          </Select>
        </FormControl>
      </NeuroModule>

      <NeuroModule index={9} label="Signes méningés" {...m('meninges')}>
        <CheckboxGroup options={NEURO_MENINGES} values={getDList('exam_neurologique_meninges_signes')} onChange={(v) => setD('exam_neurologique_meninges_signes', v)} />
      </NeuroModule>

      <TextField
        fullWidth size="small" multiline rows={1} placeholder="Autre / préciser"
        value={getD('exam_neurologique_autre')} onChange={(e) => setD('exam_neurologique_autre', e.target.value)}
      />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
        {generateNeurologiquePhrase(data)}
      </Typography>
    </Box>
  )
}

const DETAIL_COMPONENTS: Record<string, React.ComponentType<FieldApi>> = {
  respiratoire: RespiratoireDetail,
  cardiovasculaire: CardiovasculaireDetail,
  digestif: DigestifDetail,
  osteoarticulaire: OsteoarticulaireDetail,
  dermatologique: DermatologiqueDetail,
  orl: OrlDetail,
  ganglionnaire: GanglionnaireDetail,
  urogenital: UrogenitalDetail,
  ophtalmologique: OphtalmologiqueDetail,
  gynecologique: GynecologiqueDetail,
  neurologique: NeurologiqueDetail,
}

const PHRASE_GENERATORS: Record<string, (d: Record<string, unknown>) => string> = {
  respiratoire: generateRespiratoirePhrase,
  cardiovasculaire: generateCardiovasculairePhrase,
  digestif: generateDigestifPhrase,
  osteoarticulaire: generateOsteoarticulairePhrase,
  dermatologique: generateDermatologiquePhrase,
  orl: generateOrlPhrase,
  ganglionnaire: generateGanglionnairePhrase,
  urogenital: generateUrogenitalPhrase,
  ophtalmologique: generateOphtalmologiquePhrase,
  gynecologique: generateGynecologiquePhrase,
  neurologique: generateNeurologiquePhrase,
}

export default function ExamenCliniqueSection({ data, getD, setD, getDBool, getDList, includeGynecologique }: ExamenCliniqueSectionProps) {
  const systems = includeGynecologique ? [...SYSTEMS, { key: 'gynecologique', label: 'Gynécologique', detailed: true }] : SYSTEMS

  const setAllNormal = () => {
    systems.forEach((sys) => {
      setD(`exam_${sys.key}_selected`, true)
      setD(`exam_${sys.key}_result`, 'normal')
    })
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Aucun appareil n'est examiné par défaut. Cochez uniquement ceux réellement examinés.
        </Typography>
        <Button size="small" variant="outlined" onClick={setAllNormal}>Tout normal</Button>
      </Box>

      {systems.map((sys) => {
        const selected = getDBool(`exam_${sys.key}_selected`)
        const result = getD(`exam_${sys.key}_result`)
        return (
          <Box key={sys.key} sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1, p: 1.25, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selected}
                  onChange={(e) => {
                    setD(`exam_${sys.key}_selected`, e.target.checked)
                    if (!e.target.checked) setD(`exam_${sys.key}_result`, '')
                  }}
                />
              }
              label={<Typography fontWeight={600}>{sys.label}</Typography>}
            />
            {!selected && <Chip size="small" label="Non examiné" sx={{ ml: 1 }} />}
            {selected && (
              <Box sx={{ pl: 4 }}>
                <RadioGroup row value={result} onChange={(e) => setD(`exam_${sys.key}_result`, e.target.value)}>
                  <FormControlLabel value="normal" control={<Radio size="small" />} label="Sans particularité" />
                  <FormControlLabel value="anormal" control={<Radio size="small" />} label="Anormal" />
                </RadioGroup>

                {result === 'normal' && sys.detailed && PHRASE_GENERATORS[sys.key] && (
                  <Typography variant="caption" color="text.secondary" display="block">{PHRASE_GENERATORS[sys.key](data)}</Typography>
                )}

                {result === 'anormal' && sys.detailed && DETAIL_COMPONENTS[sys.key] && (() => {
                  const Detail = DETAIL_COMPONENTS[sys.key]
                  return <Detail data={data} getD={getD} setD={setD} getDBool={getDBool} getDList={getDList} />
                })()}
                {result === 'anormal' && !sys.detailed && (
                  <TextField
                    fullWidth size="small" multiline rows={2}
                    placeholder="Anomalie constatée (siège, latéralité, caractéristiques...)"
                    value={getD(`exam_${sys.key}_details`)}
                    onChange={(e) => setD(`exam_${sys.key}_details`, e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
