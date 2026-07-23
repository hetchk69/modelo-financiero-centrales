// Tipos del modelo financiero. Un único motor cubre ambos proyectos
// (Llanitos 2 y Namasigue) mediante "modos" de ingreso y de OPEX.

export type RevenueMode = 'capacidad' | 'generacion'
export type OpexMode = 'pct_capex_inflacion' | 'pct_ingresos'

export interface CapexItem {
  concepto: string
  pct: number // fracción del CAPEX (0..1)
}

/** Todas las palancas editables. Equivalen a las hojas Supuestos + Financiamiento. */
export interface ModelInputs {
  // --- Identidad ---
  nombre: string
  moneda: string

  // --- Supuestos generales ---
  capex: number // Inversión total (USD)
  aniosConstruccion: number // años sin ingresos (deuda en gracia)
  vidaOperativa: number // años de operación comercial
  aniosDepreciacion: number
  valorResidualPct: number // sobre base depreciable
  baseDepreciablePct: number // % del CAPEX que es depreciable (1 = todo)
  inflacion: number
  tasaDescuento: number
  isr: number

  // --- Ingresos ---
  revenueMode: RevenueMode
  // modo 'capacidad'
  capacidadMW: number
  factorPlanta: number
  horasAnio: number
  precioMWh: number
  // modo 'generacion'
  generacionKWh: number
  precioKWh: number

  // --- Costos operativos ---
  opexMode: OpexMode
  opexPct: number // % (base según opexMode)
  gastosAdminPct: number // % sobre ingresos
  gastosComercPct: number // % sobre ingresos
  ajusteInflacionPct: number // % sobre ingresos (0 si no aplica)

  // --- Financiamiento (palancas de deuda/equity) ---
  pctDeuda: number
  tasaInteres: number
  plazoAmort: number
  periodoGraciaModo: 'construccion' | 'manual'
  periodoGraciaManual: number

  // --- Sensibilidad ---
  variacionSens: number // +/- sobre ingresos

  // --- Desglose CAPEX (informativo/visual) ---
  capexBreakdown: CapexItem[]
}

export interface DepreciacionRow {
  anio: number
  etapa: string
  depAnual: number
  depAcum: number
  valorLibros: number
}

export interface PrestamoRow {
  anio: number
  saldoInicial: number
  cuota: number
  intereses: number
  capital: number
  saldoFinal: number
}

export interface FlujoRow {
  anio: number
  etapa: string
  ingresos: number
  opex: number
  depreciacion: number
  admin: number
  comercializacion: number
  ajusteInflacion: number
  intereses: number
  totalCostos: number
  utilidadBruta: number
  isr: number
  utilidadNeta: number
  pagoPrincipal: number
  aporteEquity: number
  flujoNeto: number
  flujoAcumulado: number
  dscr: number | null
}

export interface Rentabilidad {
  van: number
  tir: number | null
  beneficioCosto: number | null
  roi: number | null
  payback: number | null
  dscrPromedio: number | null
  dscrMinimo: number | null
}

export interface Financiamiento {
  montoDeuda: number
  montoEquity: number
  periodoGracia: number
  saldoFinGracia: number
  cuotaAnual: number
  ingresoAnual: number
  generacionAnualMWh: number
}

export interface Escenario {
  nombre: string
  van: number
  tir: number | null
}

export interface ModelResults {
  financiamiento: Financiamiento
  depreciacion: DepreciacionRow[]
  prestamo: PrestamoRow[]
  flujo: FlujoRow[]
  rentabilidad: Rentabilidad
  escenarios: Escenario[]
}
