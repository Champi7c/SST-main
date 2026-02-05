/**
 * Données de démonstration pour le mode démo (sans backend).
 * Permet de visualiser l'interface sans configurer la base de données.
 */

export const DEMO_STORAGE_KEY = 'demo_mode'

export function isDemoMode(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(DEMO_STORAGE_KEY) === 'true'
}

export function setDemoMode(on: boolean): void {
  if (typeof localStorage === 'undefined') return
  if (on) localStorage.setItem(DEMO_STORAGE_KEY, 'true')
  else localStorage.removeItem(DEMO_STORAGE_KEY)
}

// ——— Dashboard ———
const today = new Date().toISOString().split('T')[0]
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
export const mockDashboardStats = {
  period: { start_date: monthAgo, end_date: today },
  stats: {
    total_agents: 28,
    total_visits: 15,
    completed_visits: 12,
    scheduled_visits: 3,
    absent_visits: 1,
    agents_seen: 12,
    visit_completion_rate: 80,
    total_accidents: 2,
    work_stoppages: 1,
    agents_under_surveillance: 5,
  },
  distribution: {
    by_site: [
      { id: 1, name: 'Siège Sonatel', agents_count: 20, visits_count: 10, accidents_count: 1 },
      { id: 2, name: 'PAD - Quai', agents_count: 8, visits_count: 5, accidents_count: 1 },
    ],
    by_service: [
      { id: 1, name: 'Direction', agents_count: 12, visits_count: 6 },
      { id: 2, name: 'Technique', agents_count: 8, visits_count: 4 },
    ],
  },
}

// ——— Entreprises & structure ———
export const mockCompanies = [
  { id: 1, name: 'Sonatel SA', siret: '12345678901234', address: 'Dakar', phone: '33 839 00 00', email: 'contact@sonatel.sn' },
  { id: 2, name: 'Port Autonome de Dakar', siret: '98765432109876', address: 'Dakar', phone: '33 849 55 55', email: 'contact@pad.sn' },
]

export const mockSites = [
  { id: 1, name: 'Siège Sonatel', company: 1 },
  { id: 2, name: 'PAD - Quai', company: 2 },
]

export const mockServices = [
  { id: 1, name: 'Direction', company: 1, site: 1 },
  { id: 2, name: 'Technique', company: 1, site: 1 },
]

export const mockJobPositions = [
  { id: 1, name: 'Ingénieur', company: 1 },
  { id: 2, name: 'Technicien', company: 1 },
]

// ——— Agents (liste de base ; en mode démo les créations s'ajoutent à demoAgentsList) ———
export const mockAgents = [
  { id: 1, matricule: 'AGT001', first_name: 'Moussa', last_name: 'Sow', full_name: 'Moussa Sow', date_of_birth: '1985-03-15', gender: 'M', email: 'moussa.sow@example.sn', company: 1, company_name: 'Sonatel SA', site: 1, site_name: 'Siège Sonatel', service: 1, service_name: 'Direction', job_position: 1, job_position_name: 'Ingénieur', hire_date: '2018-01-10', is_active: true, is_archived: false },
  { id: 2, matricule: 'AGT002', first_name: 'Fatou', last_name: 'Diallo', full_name: 'Fatou Diallo', date_of_birth: '1990-07-22', gender: 'F', email: 'fatou.diallo@example.sn', company: 1, company_name: 'Sonatel SA', site: 1, site_name: 'Siège Sonatel', service: 2, service_name: 'Technique', job_position: 2, job_position_name: 'Technicien', hire_date: '2019-05-20', is_active: true, is_archived: false },
  { id: 3, matricule: 'AGT003', first_name: 'Amadou', last_name: 'Ba', full_name: 'Amadou Ba', date_of_birth: '1988-11-08', gender: 'M', email: 'amadou.ba@example.sn', company: 1, company_name: 'Sonatel SA', site: 1, site_name: 'Siège Sonatel', service: 1, service_name: 'Direction', job_position: 1, job_position_name: 'Ingénieur', hire_date: '2017-03-15', is_active: true, is_archived: false },
  { id: 4, matricule: 'AGT004', first_name: 'Awa', last_name: 'Fall', full_name: 'Awa Fall', date_of_birth: '1992-04-30', gender: 'F', email: 'awa.fall@example.sn', company: 2, company_name: 'Port Autonome de Dakar', site: 2, site_name: 'PAD - Quai', service: null, service_name: null, job_position: 1, job_position_name: 'Ingénieur', hire_date: '2020-09-01', is_active: true, is_archived: false },
  { id: 5, matricule: 'AGT005', first_name: 'Ibrahima', last_name: 'Ndiaye', full_name: 'Ibrahima Ndiaye', date_of_birth: '1987-12-12', gender: 'M', email: 'ibrahima.ndiaye@example.sn', company: 2, company_name: 'Port Autonome de Dakar', site: 2, site_name: 'PAD - Quai', service: null, service_name: null, job_position: 2, job_position_name: 'Technicien', hire_date: '2016-06-15', is_active: true, is_archived: false },
]

let demoAgentsList: any[] = [...mockAgents]
let nextDemoAgentId = 100

export function getDemoAgentsList(): any[] {
  return demoAgentsList
}

export function addDemoAgent(payload: any): any {
  const companyId = typeof payload.company === 'number' ? payload.company : parseInt(payload.company, 10)
  const company = mockCompanies.find((c: any) => c.id === companyId)
  const siteId = payload.site != null && payload.site !== '' ? (typeof payload.site === 'number' ? payload.site : parseInt(payload.site, 10)) : null
  const serviceId = payload.service != null && payload.service !== '' ? (typeof payload.service === 'number' ? payload.service : parseInt(payload.service, 10)) : null
  const site = siteId != null ? mockSites.find((s: any) => s.id === siteId) : null
  const service = serviceId != null ? mockServices.find((s: any) => s.id === serviceId) : null
  const newAgent = {
    id: nextDemoAgentId++,
    matricule: payload.matricule || `DEMO${nextDemoAgentId}`,
    first_name: payload.first_name || '',
    last_name: payload.last_name || '',
    full_name: `${payload.last_name || ''} ${payload.first_name || ''}`.trim(),
    date_of_birth: payload.date_of_birth || '',
    gender: payload.gender || 'M',
    email: payload.email || null,
    company: companyId,
    company_name: company?.name || '',
    site: siteId,
    site_name: site?.name || null,
    service: serviceId,
    service_name: service?.name || null,
    job_position: payload.job_position ?? null,
    job_position_name: null,
    hire_date: payload.hire_date || '',
    is_active: payload.is_active !== false,
    is_archived: false,
  }
  demoAgentsList = [...demoAgentsList, newAgent]
  return newAgent
}

// ——— Types de visite ———
export const mockVisitTypes = [
  { id: 1, name: 'Visite d\'embauche', code: 'EMB', description: 'Visite médicale à l\'embauche' },
  { id: 2, name: 'Visite périodique', code: 'PER', description: 'Visite médicale périodique' },
  { id: 3, name: 'Reprise du travail', code: 'REP', description: 'Visite de reprise après arrêt' },
]

// ——— Visites médicales ———
export const mockVisits = [
  { id: 1, agent: 1, agent_name: 'Moussa Sow', agent_matricule: 'AGT001', visit_type: 1, visit_type_name: 'Visite d\'embauche', scheduled_date: '2024-01-15', actual_date: '2024-01-15', status: 'completed', status_display: 'Réalisée', alert_rh: false, alert_direction: false, created_at: '2024-01-10T08:00:00Z', updated_at: '2024-01-15T14:00:00Z' },
  { id: 2, agent: 2, agent_name: 'Fatou Diallo', agent_matricule: 'AGT002', visit_type: 2, visit_type_name: 'Visite périodique', scheduled_date: '2024-02-20', actual_date: '2024-02-20', status: 'completed', status_display: 'Réalisée', alert_rh: false, alert_direction: false, created_at: '2024-02-05T08:00:00Z', updated_at: '2024-02-20T11:00:00Z' },
  { id: 3, agent: 3, agent_name: 'Amadou Ba', agent_matricule: 'AGT003', visit_type: 2, visit_type_name: 'Visite périodique', scheduled_date: '2024-03-10', status: 'scheduled', status_display: 'Programmée', alert_rh: false, alert_direction: false, created_at: '2024-02-28T08:00:00Z', updated_at: '2024-02-28T08:00:00Z' },
]

// ——— Accidents de travail ———
export const mockWorkAccidents = [
  { id: 1, agent: 4, agent_name: 'Awa Fall', agent_matricule: 'AGT004', agent_company: 'Port Autonome de Dakar', agent_site: 'PAD - Quai', accident_type: 'physical', accident_type_display: 'Physique', accident_date: '2024-01-20', location: 'Entrepôt', circumstances: 'Chute', description: 'Chute lors du déplacement de charges', severity: 'minor', severity_display: 'Léger', status: 'closed', status_display: 'Clôturé', work_stoppage: true, work_stoppage_days: 3, medical_care: true, hospitalization: false, alert_rh: false, alert_direction: false, alert_hse: true },
  { id: 2, agent: 5, agent_name: 'Ibrahima Ndiaye', agent_matricule: 'AGT005', agent_company: 'Port Autonome de Dakar', accident_type: 'physical', accident_type_display: 'Physique', accident_date: '2024-02-15', location: 'Quai', circumstances: 'Manipulation', description: 'Coupure à la main', severity: 'minor', severity_display: 'Léger', status: 'open', status_display: 'En cours', work_stoppage: false, medical_care: true, hospitalization: false, alert_rh: false, alert_direction: false, alert_hse: false },
]

export const mockOccupationalDiseases: any[] = []

// ——— Formats paginés ———
function paginate<T>(arr: T[], params?: { page?: number; page_size?: number }): { results: T[]; count: number } {
  const page = params?.page ?? 1
  const size = params?.page_size ?? 20
  const start = (page - 1) * size
  const results = arr.slice(start, start + size)
  return { results, count: arr.length }
}

/** Retourne la réponse mock selon l'URL et les paramètres. */
export function getMockResponse(
  method: string,
  url: string,
  _data?: any,
  config?: { params?: Record<string, any> }
): { data: any } {
  const params = config?.params ?? {}
  const lower = url.toLowerCase()

  // POST/PUT/PATCH/DELETE : simuler succès (en démo les agents créés sont ajoutés à la liste)
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    if (lower.includes('/medical/agents/') && method === 'post') {
      const created = addDemoAgent(_data || {})
      return { data: created }
    }
    if (lower.includes('/visits/visits/') && method === 'post') return { data: { id: 99, ..._data } }
    if (lower.includes('/work-accidents') && method === 'post') return { data: { id: 99, ..._data } }
    return { data: {} }
  }

  if (lower.includes('dashboard-stats')) return { data: mockDashboardStats }
  if (lower.includes('sst-indicators')) {
    return {
      data: {
        period: { start_date: monthAgo, end_date: today },
        frequency_rate: 2.5,
        severity_rate: 1.2,
        total_accidents: 2,
        total_work_stoppage_days: 3,
      },
    }
  }
  if (lower.includes('health-status')) {
    return { data: { total_agents: 28, agents_with_dmst: 5, agents_under_surveillance: 5 } }
  }

  if (lower.includes('/companies/companies')) return { data: paginate(mockCompanies, params) }
  if (lower.includes('/companies/sites')) {
    let sites = [...mockSites]
    if (params.company) sites = sites.filter((s: any) => s.company === parseInt(params.company, 10))
    return { data: paginate(sites, params) }
  }
  if (lower.includes('/companies/services')) {
    let services = [...mockServices]
    if (params.company) services = services.filter((s: any) => s.company === parseInt(params.company, 10))
    return { data: paginate(services, params) }
  }
  if (lower.includes('/companies/job-positions')) {
    let positions = [...mockJobPositions]
    if (params.company) positions = positions.filter((p: any) => p.company === parseInt(params.company, 10))
    return { data: paginate(positions, params) }
  }

  if (lower.includes('/medical/agents')) {
    let agents = getDemoAgentsList()
    if (params.is_archived === 'true') agents = agents.filter((a: any) => a.is_archived)
    else if (params.is_active === 'true') agents = agents.filter((a: any) => !a.is_archived)
    if (params.company) agents = agents.filter((a: any) => a.company === parseInt(params.company, 10))
    return { data: paginate(agents, params) }
  }

  if (lower.includes('/visits/types')) return { data: mockVisitTypes }
  if (lower.includes('/visits/visits')) return { data: paginate(mockVisits, params) }

  if (lower.includes('work-accidents/statistics')) return { data: mockDashboardStats.stats }
  if (lower.includes('/work-accidents')) return { data: paginate(mockWorkAccidents, params) }
  if (lower.includes('/occupational-diseases')) return { data: paginate(mockOccupationalDiseases, params) }

  // DMST
  if (lower.includes('/medical/dmst')) {
    if (lower.includes('/visits/') || lower.includes('/history/') || lower.includes('/evolution/')) return { data: [] }
    const agentMatch = url.match(/agent=(\d+)/)
    const agentId = agentMatch ? parseInt(agentMatch[1], 10) : null
    const dmst = agentId
      ? {
          id: 1,
          agent: agentId,
          agent_name: mockAgents.find((a: any) => a.id === agentId)?.full_name || 'Agent',
          agent_matricule: mockAgents.find((a: any) => a.id === agentId)?.matricule || '',
          allergies: null,
          medical_history: null,
          chronic_diseases: null,
          smoking: false,
          alcohol: false,
          drugs: false,
          handicap: false,
          pregnancy: false,
          under_surveillance: false,
          visits_count: 0,
          history_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      : null
    return { data: { results: dmst ? [dmst] : [] } }
  }

  // Autres : retourner des listes vides ou objets vides selon le format attendu
  if (lower.includes('/vaccination/')) return { data: lower.includes('vaccines') || lower.includes('requirements') || lower.includes('contraindications') ? [] : { results: [], count: 0 } }
  if (lower.includes('/training/')) return { data: lower.includes('training-types') || lower.includes('requirements') ? [] : { results: [], count: 0 } }
  if (lower.includes('/prevention/')) return { data: lower.includes('risk-categories') ? [] : { results: [], count: 0 } }
  if (lower.includes('/medical/pathologies')) return { data: [] }
  if (lower.includes('/risk-categories')) return { data: [] }
  if (lower.includes('/risks')) return { data: { results: [], count: 0 } }
  if (lower.includes('/indicators')) return { data: [] }
  if (lower.includes('/actions')) return { data: [] }
  if (lower.includes('/exposure-sheets')) return { data: { results: [], count: 0 } }
  if (lower.includes('/risk-sheets')) return { data: { results: [], count: 0 } }
  if (lower.includes('/vaccines')) return { data: [] }
  if (lower.includes('/training-types')) return { data: [] }
  if (lower.includes('/requirements')) return { data: [] }
  if (lower.includes('/vaccinations')) return { data: { results: [], count: 0 } }
  if (lower.includes('/surveillances')) return { data: [] }
  if (lower.includes('/alerts')) return { data: [] }
  if (lower.includes('/contraindications')) return { data: [] }
  if (lower.includes('/trainings')) return { data: { results: [], count: 0 } }
  if (lower.includes('/articles')) return { data: { results: [], count: 0 } }
  if (lower.includes('/article-recipients')) return { data: [] }

  return { data: [] }
}
