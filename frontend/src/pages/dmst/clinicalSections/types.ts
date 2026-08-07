// API partagée par toutes les sections cliniques réutilisables (Fiche d'observation
// et Fiche de consultation) : lecture/écriture d'un même blob JSON par clé.
export interface FieldApi {
  data: Record<string, unknown>
  getD: (key: string) => string
  setD: (key: string, value: unknown) => void
  getDBool: (key: string) => boolean
  getDList: (key: string) => string[]
}
