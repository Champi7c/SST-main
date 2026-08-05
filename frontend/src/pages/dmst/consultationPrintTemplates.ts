// Gabarits d'impression pour la Fiche de consultation médicale.
// Même principe que les gabarits déjà utilisés dans DMST.tsx (handlePrintOrdonnance,
// handlePrintExamen, handlePrintCertificat, handlePrintFicheVierge) : une chaîne HTML
// autonome ouverte dans une nouvelle fenêtre, imprimée automatiquement au chargement.

export interface MedicalConsultation {
  id: number
  agent: number
  agent_name?: string
  agent_matricule?: string
  agent_age?: number
  agent_gender?: string
  doctor?: number | null
  doctor_name?: string
  visit_type?: number | null
  visit_type_name?: string
  consultation_date: string
  motif?: string
  diagnostic_principal?: string
  data?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

const esc = (s: unknown) => String(s ?? '').replace(/"/g, '&quot;')
const txt = (s: unknown) => String(s ?? '')

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''

const d = (c: MedicalConsultation, key: string): string => {
  const v = (c.data || {})[key]
  return v === undefined || v === null ? '' : String(v)
}

const dBool = (c: MedicalConsultation, key: string): boolean => !!(c.data || {})[key]

const dList = (c: MedicalConsultation, key: string): string[] => {
  const v = (c.data || {})[key]
  return Array.isArray(v) ? (v as string[]) : []
}

const logoUrl = () => window.location.origin + '/coly.png'

/** CSS partagé, reproduisant la charte graphique des gabarits existants (bleu #1F4788 / #2E75B6, bandeau #E8F0F8). */
const baseCss = (pageSize: string) => `
  @page { size: ${pageSize}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { background: white; padding: 8px; display: flex; flex-direction: column; font-size: 10px; }
  .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 8px; }
  .header-table td { vertical-align: middle; padding: 3px; }
  .td-logo { width: 52px; text-align: center; }
  .td-logo img { width: 50px; height: 50px; object-fit: contain; display: block; margin: auto; }
  .td-info { padding-left: 7px; }
  .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
  .cabinet-sub { font-size: 7px; color: #333; line-height: 1.6; }
  .td-date { text-align: right; vertical-align: middle; padding-right: 3px; white-space: nowrap; font-size: 8.5px; }
  .title-doc { text-align: center; font-weight: bold; font-size: 13px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 4px 0 5px 0; margin: 16px 0 12px 0; letter-spacing: 0.5px; }
  .patient-section { border: 1px solid #CCCCCC; padding: 7px 9px; margin-bottom: 10px; font-size: 9px; }
  .field-row { display: flex; align-items: baseline; margin-bottom: 5px; gap: 4px; flex-wrap: wrap; }
  .field-row:last-child { margin-bottom: 0; }
  .field-label { font-weight: bold; white-space: nowrap; color: #222; }
  .field-value { flex: 1; border-bottom: 1px dotted #CCCCCC; font-size: 9px; padding: 1px 2px; min-width: 40px; }
  .section-title { font-weight: bold; font-size: 9.5px; color: #1F4788; border-bottom: 1.5px solid #1F4788; padding-bottom: 3px; margin: 10px 0 6px 0; }
  .content-section { margin-bottom: 10px; }
  .free-text { white-space: pre-wrap; font-size: 9.5px; line-height: 1.7; min-height: 18px; }
  .checkbox-section { background: #F5F5F5; border: 1px solid #ddd; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; font-size: 9.5px; }
  .check-item { display: flex; align-items: baseline; gap: 6px; }
  .check-item .box { display: inline-block; width: 10px; height: 10px; border: 1.5px solid #555; border-radius: 1px; flex-shrink: 0; position: relative; top: 1px; }
  .check-item .box.on { background: #1F4788; border-color: #1F4788; }
  .footer-section { border-top: 1px solid #CCCCCC; padding-top: 6px; margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; }
  .footer-sig { text-align: center; font-weight: bold; color: #1F4788; text-decoration: underline; font-size: 9px; padding-top: 32px; }
`

const headerTable = (dateStr: string) => `
  <table class="header-table">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl()}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date"><em>Le </em>${dateStr}</td>
    </tr></tbody>
  </table>
`

const patientBlock = (c: MedicalConsultation) => `
  <div class="patient-section">
    <div class="field-row"><span class="field-label">Nom et prénoms :</span><span class="field-value">${esc(c.agent_name)}</span></div>
    <div class="field-row">
      <span class="field-label">Matricule :</span><span class="field-value" style="max-width:100px">${esc(c.agent_matricule)}</span>
      <span class="field-label">Âge :</span><span class="field-value" style="max-width:60px">${c.agent_age ? c.agent_age + ' ans' : ''}</span>
      <span class="field-label">Sexe :</span><span class="field-value" style="max-width:40px">${c.agent_gender === 'F' ? 'F' : c.agent_gender === 'M' ? 'M' : ''}</span>
    </div>
  </div>
`

const wrapDoc = (title: string, pageSize: string, bodyHtml: string) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title} - Cabinet Médical Lionel</title>
  <style>${baseCss(pageSize)}</style>
</head>
<body>
<div class="sheet">
${bodyHtml}
</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

const openPrintWindow = (html: string) => {
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── 1. Compte-rendu de consultation ───────────────────────────────────────
// Reproduit fidèlement le design de la Fiche d'observation (#print-section dans
// DMST.tsx) : même en-tête avec logo, même bandeau de titre, même typographie
// de sections, format A4 210mm / 20mm de marge.

const ficheCss = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: rgba(0,0,0,0.87); }
  .fiche { width: 210mm; min-height: 297mm; background: #fff; padding: 20mm; }
  .fiche-header { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 10px; }
  .fiche-header td { vertical-align: middle; padding: 3px; }
  .fiche-header .td-logo { width: 52px; text-align: center; }
  .fiche-header .td-logo img { width: 50px; height: 50px; object-fit: contain; display: block; margin: auto; }
  .fiche-header .td-info { padding-left: 7px; }
  .fiche-header .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
  .fiche-header .cabinet-sub { font-size: 7px; color: #333; line-height: 1.6; }
  .fiche-header .td-date { text-align: right; vertical-align: middle; padding-right: 3px; white-space: nowrap; font-size: 8.5px; }
  .fiche-title { text-align: center; font-weight: bold; font-size: 13px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 4px 0 5px 0; margin: 20px 0 12px 0; letter-spacing: 0.5px; }
  .fiche-section-title { font-weight: bold; font-size: 15px; margin: 4px 0 8px 0; }
  .fiche hr { border: none; border-top: 1px solid rgba(0,0,0,0.12); margin: 14px 0; }
  .fiche-field-row { display: flex; flex-wrap: wrap; gap: 4px 24px; margin-bottom: 8px; font-size: 13px; }
  .fiche-field { flex: 1 1 220px; }
  .fiche-free-text { font-size: 13px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 8px; }
  .fiche-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; align-items: flex-end; }
`

const ficheHeader = (dateStr: string) => `
  <table class="fiche-header">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl()}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date"><em>Le </em>${dateStr}</td>
    </tr></tbody>
  </table>
`

function buildCompteRenduBodyHtml(c: MedicalConsultation): string {
  const dateStr = fmtDate(c.consultation_date)
  const plaintes = dList(c, 'plaintes')

  const section = (title: string, content: string) =>
    content && content.trim()
      ? `<div class="fiche-section-title">${title}</div><div class="fiche-free-text">${esc(content)}</div>`
      : ''

  const antecedents = [
    ['Antécédents médicaux', d(c, 'atcd_medicaux')],
    ['Antécédents chirurgicaux', d(c, 'atcd_chirurgicaux')],
    ['Antécédents traumatiques', d(c, 'atcd_traumatiques')],
    ['Antécédents allergiques', d(c, 'atcd_allergiques')],
    ['Antécédents transfusionnels', d(c, 'atcd_transfusionnels')],
    ['Antécédents familiaux', d(c, 'atcd_familiaux')],
    ['Antécédents gynécologiques', d(c, 'atcd_gyneco')],
    ['Antécédents obstétricaux', d(c, 'atcd_obstetricaux')],
  ]
    .filter(([, v]) => v && v.trim())
    .map(([label, v]) => `<div class="fiche-field-row"><strong>${label} :</strong></div><div class="fiche-free-text">${esc(v)}</div>`)
    .join('')

  const EXAM_SYSTEMS: [string, string][] = [
    ['Respiratoire', 'respiratoire'], ['Cardiovasculaire', 'cardiovasculaire'], ['Digestif', 'digestif'],
    ['Neurologique', 'neurologique'], ['ORL', 'orl'], ['Ophtalmologique', 'ophtalmologique'],
    ['Dermatologique', 'dermatologique'], ['Ostéo-articulaire', 'osteoarticulaire'], ['Urologique', 'urologique'],
    ['Gynécologique', 'gynecologique'],
  ]
  const examLines = EXAM_SYSTEMS
    .filter(([, key]) => (c.data || {})[`exam_${key}_normal`] !== undefined || d(c, `exam_${key}_details`))
    .map(([label, key]) => {
      const normal = dBool(c, `exam_${key}_normal`)
      const details = d(c, `exam_${key}_details`)
      return `<div class="fiche-field-row"><span class="fiche-field"><strong>${label} :</strong> ${normal ? 'Normal' : esc(details) || 'Anomalie non précisée'}</span></div>`
    })
    .join('')

  const GENERAL_ITEMS: [string, string][] = [
    ['Déshydratation', 'deshydratation'], ['Dénutrition', 'denutrition'], ['Ictère', 'ictere'],
    ['Cyanose', 'cyanose'], ['Œdèmes', 'oedemes'], ['Altération de l\'état général', 'aeg'], ['Adénopathies', 'adenopathies'],
  ]
  const generalLines = GENERAL_ITEMS
    .filter(([, key]) => (c.data || {})[`general_${key}_normal`] !== undefined || d(c, `general_${key}_details`))
    .map(([label, key]) => {
      const normal = dBool(c, `general_${key}_normal`)
      const details = d(c, `general_${key}_details`)
      return `<div class="fiche-field-row"><span class="fiche-field"><strong>${label} :</strong> ${normal ? 'Normal' : esc(details) || 'Anomalie non précisée'}</span></div>`
    })
    .join('')

  const constantes = [
    d(c, 'ta_sys') && d(c, 'ta_dia') ? `TA : ${d(c, 'ta_sys')}/${d(c, 'ta_dia')} mmHg` : '',
    d(c, 'temperature') ? `T° : ${d(c, 'temperature')} °C` : '',
    d(c, 'fc') ? `FC : ${d(c, 'fc')} /min` : '',
    d(c, 'poids') ? `Poids : ${d(c, 'poids')} kg` : '',
    d(c, 'taille') ? `Taille : ${d(c, 'taille')} cm` : '',
    d(c, 'poids') && d(c, 'taille')
      ? `IMC : ${(Number(d(c, 'poids')) / Math.pow(Number(d(c, 'taille')) / 100, 2)).toFixed(1)} kg/m²`
      : '',
  ].filter(Boolean).join(' — ')

  const cat = [
    d(c, 'cat_prescriptions') && '• Prescriptions médicamenteuses',
    d(c, 'cat_examens_bio') && '• Examens biologiques',
    d(c, 'cat_imagerie') && '• Imagerie',
    d(c, 'cat_ecg') && '• ECG',
    d(c, 'cat_avis_specialise') && '• Avis spécialisé',
    dBool(c, 'cat_hospitalisation') && '• Hospitalisation',
    d(c, 'cat_conseils') && '• Conseils hygiéno-diététiques',
    d(c, 'cat_suivi') && '• Suivi',
    d(c, 'cat_controle') && '• Contrôle',
    dBool(c, 'cat_arret_travail') && `• Arrêt de travail (${d(c, 'arret_duree_jours') || '?'} j.)`,
  ].filter(Boolean).join('\n')

  const body = `
    ${ficheHeader(dateStr)}
    <div class="fiche-title">FICHE DE CONSULTATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL</div>

    <div class="fiche-section-title">I. IDENTIFICATION DE L'AGENT</div>
    <div class="fiche-field-row">
      <span class="fiche-field"><strong>Nom et prénoms :</strong> ${esc(c.agent_name)}</span>
      <span class="fiche-field"><strong>Âge :</strong> ${c.agent_age ?? ''} ans</span>
      <span class="fiche-field"><strong>Matricule :</strong> ${esc(c.agent_matricule)}</span>
      <span class="fiche-field"><strong>Médecin :</strong> ${esc(c.doctor_name)}</span>
    </div>
    <hr>

    <div class="fiche-section-title">II. MOTIF ET PLAINTES</div>
    ${section('Motif de consultation', c.motif || '')}
    ${plaintes.length ? `<div class="fiche-free-text">${plaintes.map((p) => `• ${esc(p)}`).join('<br>')}</div>` : ''}
    <hr>

    ${d(c, 'histoire_maladie_actuelle') ? `<div class="fiche-section-title">III. HISTOIRE DE LA MALADIE ACTUELLE</div><div class="fiche-free-text">${esc(d(c, 'histoire_maladie_actuelle'))}</div><hr>` : ''}

    ${antecedents ? `<div class="fiche-section-title">IV. ANTÉCÉDENTS</div>${antecedents}<hr>` : ''}

    ${constantes ? `<div class="fiche-section-title">V. CONSTANTES</div><div class="fiche-free-text">${constantes}</div><hr>` : ''}

    ${examLines ? `<div class="fiche-section-title">VI. EXAMEN CLINIQUE</div>${examLines}<hr>` : ''}

    ${generalLines ? `<div class="fiche-section-title">VII. ÉTAT GÉNÉRAL</div>${generalLines}<hr>` : ''}

    ${section('VIII. RÉSUMÉ SYNDROMIQUE', d(c, 'resume_syndromique'))}
    <hr>

    <div class="fiche-section-title">IX. HYPOTHÈSES DIAGNOSTIQUES</div>
    ${c.diagnostic_principal ? `<div class="fiche-field-row"><strong>Diagnostic principal :</strong> ${esc(c.diagnostic_principal)}</div>` : ''}
    ${dList(c, 'diagnostics_differentiels').length ? `<div class="fiche-free-text">Différentiels : ${dList(c, 'diagnostics_differentiels').join(', ')}</div>` : ''}
    <hr>

    ${cat ? `<div class="fiche-section-title">X. CONDUITE À TENIR</div><div class="fiche-free-text">${cat.replace(/\n/g, '<br>')}</div>` : ''}

    <div class="fiche-footer">
      <div style="font-size:12px;">L'AGENT — Signature (pour information)</div>
      <div style="text-align:right;min-width:220px;">
        <div style="font-size:12px;margin-bottom:8px;"><strong>LE MÉDECIN DU TRAVAIL — Signature et cachet</strong></div>
        <div style="font-size:12px;">${esc(c.doctor_name)}</div>
        <div style="margin-top:16px;height:40px;border-bottom:1px solid #000;width:200px;margin-left:auto;"></div>
      </div>
    </div>
  `
  return body
}

export function printCompteRendu(c: MedicalConsultation) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de consultation - Cabinet Médical Lionel</title>
  <style>${ficheCss}</style>
</head>
<body>
<div class="fiche">${buildCompteRenduBodyHtml(c)}</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

  openPrintWindow(html)
}

export async function exportCompteRenduPDF(c: MedicalConsultation) {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.zIndex = '-1'
  container.innerHTML = `<style>${ficheCss}</style><div class="fiche" id="__consultation_pdf_fiche">${buildCompteRenduBodyHtml(c)}</div>`
  document.body.appendChild(container)

  try {
    const fiche = container.querySelector('#__consultation_pdf_fiche') as HTMLElement
    const img = fiche.querySelector('img')
    if (img && !(img as HTMLImageElement).complete) {
      await new Promise((resolve) => {
        img.addEventListener('load', resolve)
        img.addEventListener('error', resolve)
        setTimeout(resolve, 2000)
      })
    }
    await new Promise((r) => setTimeout(r, 150))

    const canvas = await html2canvas(fiche, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgHeightMm = (canvas.height * pdfWidth) / canvas.width
    const imgData = canvas.toDataURL('image/png', 1.0)

    if (imgHeightMm <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm, undefined, 'FAST')
    } else {
      let remaining = imgHeightMm
      let sourceY = 0
      while (remaining > 0) {
        const pageH = Math.min(pdfHeight, remaining)
        const sourceH = (pageH / imgHeightMm) * canvas.height
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = Math.ceil(sourceH)
        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
          pdf.addImage(pageCanvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pageH, undefined, 'FAST')
        }
        sourceY += sourceH
        remaining -= pageH
        if (remaining > 0) pdf.addPage()
      }
    }
    const filename = `consultation_${c.agent_matricule || c.agent}_${fmtDate(c.consultation_date).replace(/\//g, '-')}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}

// ─── 2. Ordonnance ──────────────────────────────────────────────────────────

export function printConsultationOrdonnance(c: MedicalConsultation) {
  const dateStr = fmtDate(c.consultation_date)
  const body = `
    ${headerTable(dateStr)}
    <div class="title-doc">ORDONNANCE</div>
    ${patientBlock(c)}
    <div class="content-section" style="min-height: 90mm; padding: 8px 4px;">
      <div class="free-text" style="font-size: 10px; line-height: 1.9;">${esc(d(c, 'cat_prescriptions')).replace(/\n/g, '<br>')}</div>
    </div>
    <div class="footer-section">
      <div style="font-size:8.5px;font-style:italic;color:#666;">Veuillez ramener l'ordonnance à la prochaine visite</div>
      <div class="footer-sig">Signature et cachet</div>
    </div>
  `
  openPrintWindow(wrapDoc('Ordonnance', '148mm 210mm', body))
}

// ─── 3. Demande d'examen complémentaire (bio + imagerie + ECG + avis spécialisé) ──

export function printConsultationDemandeExamen(c: MedicalConsultation) {
  const dateStr = fmtDate(c.consultation_date)
  const check = (on: boolean, label: string) =>
    `<div class="check-item"><span class="box${on ? ' on' : ''}"></span><span>${label}</span></div>`
  const body = `
    ${headerTable(dateStr)}
    <div class="title-doc">DEMANDE D'EXAMEN COMPLÉMENTAIRE</div>
    ${patientBlock(c)}
    <div class="content-section">
      <div class="section-title">Examens demandés</div>
      <div class="checkbox-section">
        ${check(!!d(c, 'cat_examens_bio'), 'Bilan biologique')}
        ${check(!!d(c, 'cat_imagerie'), 'Imagerie')}
        ${check(!!d(c, 'cat_ecg'), 'ECG')}
        ${check(!!d(c, 'cat_avis_specialise'), 'Avis spécialisé' + (d(c, 'cat_avis_destinataire') ? ` — ${esc(d(c, 'cat_avis_destinataire'))}` : ''))}
      </div>
    </div>
    <div class="content-section">
      <div class="section-title">Détails / renseignements cliniques</div>
      <div class="free-text">${[d(c, 'cat_examens_bio'), d(c, 'cat_imagerie'), d(c, 'cat_ecg'), d(c, 'cat_avis_specialise')].filter(Boolean).map(esc).join('<br>')}</div>
    </div>
    <div class="footer-section">
      <div></div>
      <div class="footer-sig">Le Prescripteur</div>
    </div>
  `
  openPrintWindow(wrapDoc("Demande d'examen", '148mm 210mm', body))
}

// ─── 4. Certificat médical ──────────────────────────────────────────────────

export function printConsultationCertificat(c: MedicalConsultation) {
  const dateStr = fmtDate(c.consultation_date)
  const body = `
    ${headerTable(dateStr)}
    <div class="title-doc">CERTIFICAT MÉDICAL</div>
    ${patientBlock(c)}
    <div class="content-section free-text">
      Je soussigné, ${esc(c.doctor_name)}, certifie avoir examiné ce jour M./Mme/Mlle ${esc(c.agent_name)}.
      ${c.diagnostic_principal ? `<br><br>Conclusion : ${esc(c.diagnostic_principal)}` : ''}
    </div>
    <div class="footer-section">
      <div></div>
      <div class="footer-sig">Le Médecin${c.doctor_name ? `<br>${esc(c.doctor_name)}` : ''}</div>
    </div>
  `
  openPrintWindow(wrapDoc('Certificat médical', '148mm 210mm', body))
}

// ─── 5. Arrêt de travail ────────────────────────────────────────────────────

export function printConsultationArretTravail(c: MedicalConsultation) {
  const dateStr = fmtDate(c.consultation_date)
  const debut = d(c, 'arret_date_debut') ? fmtDate(d(c, 'arret_date_debut')) : dateStr
  const jours = d(c, 'arret_duree_jours')
  const motif = d(c, 'arret_motif')
  const body = `
    ${headerTable(dateStr)}
    <div class="title-doc">ARRÊT DE TRAVAIL</div>
    ${patientBlock(c)}
    <div class="content-section free-text">
      Je soussigné, ${esc(c.doctor_name)}, certifie que l'état de santé de M./Mme/Mlle ${esc(c.agent_name)}
      nécessite un arrêt de travail à compter du <strong>${esc(debut)}</strong>
      ${jours ? ` pour une durée de <strong>${esc(jours)} jour(s)</strong>` : ''}.
      ${motif ? `<br><br>Motif (non communiqué à l'employeur) : ${esc(motif)}` : ''}
    </div>
    <div class="footer-section">
      <div style="font-size:8.5px;font-style:italic;color:#666;">Sous réserve de repos strict et de respect des consignes médicales</div>
      <div class="footer-sig">Le Médecin${c.doctor_name ? `<br>${esc(c.doctor_name)}` : ''}</div>
    </div>
  `
  openPrintWindow(wrapDoc('Arrêt de travail', '148mm 210mm', body))
}

// ─── 6. Lettre d'adressage ──────────────────────────────────────────────────

export function printConsultationLettreAdressage(c: MedicalConsultation) {
  const dateStr = fmtDate(c.consultation_date)
  const destinataire = d(c, 'cat_avis_destinataire') || 'Cher Confrère'
  const motif = d(c, 'cat_avis_specialise')
  const body = `
    ${headerTable(dateStr)}
    <div class="title-doc">LETTRE D'ADRESSAGE</div>
    <div class="content-section free-text">
      ${esc(destinataire)},<br><br>
      Je vous adresse M./Mme/Mlle <strong>${esc(c.agent_name)}</strong>
      ${c.agent_age ? ` (${c.agent_age} ans)` : ''}${c.agent_matricule ? `, matricule ${esc(c.agent_matricule)}` : ''},
      pour avis spécialisé.
      ${motif ? `<br><br><span class="field-label">Motif d'adressage :</span><br>${esc(motif).replace(/\n/g, '<br>')}` : ''}
      ${c.diagnostic_principal ? `<br><br><span class="field-label">Diagnostic évoqué :</span> ${esc(c.diagnostic_principal)}` : ''}
      <br><br>Je vous remercie de l'attention que vous porterez à ce patient et reste à votre disposition pour tout complément d'information.
      <br><br>Confraternellement,
    </div>
    <div class="footer-section">
      <div></div>
      <div class="footer-sig">Le Médecin${c.doctor_name ? `<br>${esc(c.doctor_name)}` : ''}</div>
    </div>
  `
  openPrintWindow(wrapDoc("Lettre d'adressage", 'A4', body))
}

export const CONSULTATION_DOCUMENTS: { key: string; label: string; hasContent: (c: MedicalConsultation) => boolean; print: (c: MedicalConsultation) => void }[] = [
  { key: 'compte_rendu', label: 'Compte-rendu de consultation', hasContent: () => true, print: printCompteRendu },
  { key: 'ordonnance', label: 'Ordonnance', hasContent: (c) => !!d(c, 'cat_prescriptions'), print: printConsultationOrdonnance },
  { key: 'demande_examen', label: "Demande d'examen (bio / imagerie / ECG / avis)", hasContent: (c) => !!(d(c, 'cat_examens_bio') || d(c, 'cat_imagerie') || d(c, 'cat_ecg') || d(c, 'cat_avis_specialise')), print: printConsultationDemandeExamen },
  { key: 'certificat', label: 'Certificat médical', hasContent: () => true, print: printConsultationCertificat },
  { key: 'arret_travail', label: 'Arrêt de travail', hasContent: (c) => dBool(c, 'cat_arret_travail'), print: printConsultationArretTravail },
  { key: 'lettre_adressage', label: "Lettre d'adressage", hasContent: (c) => !!d(c, 'cat_avis_specialise'), print: printConsultationLettreAdressage },
]

export { fmtDate, fmtTime, d as getConsultationDataValue, dBool as getConsultationDataBool, dList as getConsultationDataList, txt }
