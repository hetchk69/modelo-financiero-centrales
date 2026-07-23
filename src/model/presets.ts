import type { ModelInputs } from './types'

// Presets extraídos de los Excel conectados originales.

export const llanitos2: ModelInputs = {
  nombre: 'Central Hidroeléctrica Llanitos 2',
  moneda: 'USD',
  capex: 122_000_000,
  aniosConstruccion: 5,
  vidaOperativa: 25,
  aniosDepreciacion: 25,
  valorResidualPct: 0.01,
  baseDepreciablePct: 1,
  inflacion: 0.03,
  tasaDescuento: 0.1,
  isr: 0.25,

  revenueMode: 'capacidad',
  capacidadMW: 35,
  factorPlanta: 0.65,
  horasAnio: 8760,
  precioMWh: 167.66,
  generacionKWh: 0,
  precioKWh: 0,

  opexMode: 'pct_capex_inflacion',
  opexPct: 0.03,
  gastosAdminPct: 0.02,
  gastosComercPct: 0.01,
  ajusteInflacionPct: 0,

  pctDeuda: 0.8,
  tasaInteres: 0.07,
  plazoAmort: 20,
  periodoGraciaModo: 'construccion',
  periodoGraciaManual: 5,

  variacionSens: 0.12,

  capexBreakdown: [
    { concepto: 'Estudios, ingeniería y diseño', pct: 0.04 },
    { concepto: 'Gestión ambiental y social', pct: 0.02 },
    { concepto: 'Adquisición de tierras y servidumbres', pct: 0.03 },
    { concepto: 'Obras preliminares y campamentos', pct: 0.03 },
    { concepto: 'Caminos de acceso y puentes', pct: 0.05 },
    { concepto: 'Presa y obras de captación', pct: 0.2 },
    { concepto: 'Túnel o conducción', pct: 0.13 },
    { concepto: 'Chimenea de equilibrio', pct: 0.03 },
    { concepto: 'Tubería forzada', pct: 0.07 },
    { concepto: 'Casa de máquinas', pct: 0.08 },
    { concepto: 'Equipos electromecánicos', pct: 0.18 },
    { concepto: 'Subestación elevadora', pct: 0.03 },
    { concepto: 'Línea de transmisión', pct: 0.04 },
    { concepto: 'Sistema SCADA y protecciones', pct: 0.02 },
    { concepto: 'Supervisión de construcción', pct: 0.02 },
    { concepto: 'Contingencias', pct: 0.03 },
  ],
}

export const namasigue: ModelInputs = {
  nombre: 'P.G. Namasigue',
  moneda: 'USD',
  capex: 134_100_000,
  aniosConstruccion: 0,
  vidaOperativa: 25,
  aniosDepreciacion: 25,
  valorResidualPct: 0.01,
  baseDepreciablePct: 0.8948, // solo inversión fija es depreciable
  inflacion: 0.015,
  tasaDescuento: 0.1,
  isr: 0.25,

  revenueMode: 'generacion',
  capacidadMW: 0,
  factorPlanta: 0,
  horasAnio: 8760,
  precioMWh: 0,
  generacionKWh: 166_440_000,
  precioKWh: 0.0968,

  opexMode: 'pct_ingresos',
  opexPct: 0.1, // O&M sobre ingresos
  gastosAdminPct: 0.02,
  gastosComercPct: 0.01,
  ajusteInflacionPct: 0.015,

  pctDeuda: 0.7,
  tasaInteres: 0.1,
  plazoAmort: 15,
  periodoGraciaModo: 'manual',
  periodoGraciaManual: 0,

  variacionSens: 0.12,

  capexBreakdown: [
    { concepto: 'Inversión Fija (depreciable)', pct: 0.8948 },
    { concepto: 'Inversión Diferida', pct: 0.0678 },
    { concepto: 'Imprevistos', pct: 0.0374 },
  ],
}

export const presets: Record<string, ModelInputs> = {
  llanitos2,
  namasigue,
}

export const presetLabels: Record<string, string> = {
  llanitos2: 'Llanitos 2 (hidroeléctrica)',
  namasigue: 'Namasigue (generación)',
}

export function clonePreset(key: string): ModelInputs {
  return structuredClone(presets[key])
}
