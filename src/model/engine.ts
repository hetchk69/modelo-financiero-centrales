import { van, irr } from './finance'
import type {
  ModelInputs,
  ModelResults,
  DepreciacionRow,
  PrestamoRow,
  FlujoRow,
  Financiamiento,
} from './types'

/**
 * Motor del modelo. Función pura: recibe las palancas y devuelve TODAS las
 * tablas derivadas. Replica fielmente las hojas conectadas del Excel
 * (Supuestos → Financiamiento → Ingresos → Depreciación → Préstamo →
 * Flujo de Efectivo → Rentabilidad → Sensibilidad).
 */
export function computeModel(inp: ModelInputs): ModelResults {
  const horizon = inp.aniosConstruccion + inp.vidaOperativa // año máximo
  const constr = inp.aniosConstruccion

  // ---- Ingresos (hoja Ingresos) ----
  const generacionAnualMWh =
    inp.revenueMode === 'capacidad'
      ? inp.capacidadMW * inp.factorPlanta * inp.horasAnio
      : inp.generacionKWh / 1000
  const ingresoAnual =
    inp.revenueMode === 'capacidad'
      ? generacionAnualMWh * inp.precioMWh
      : inp.generacionKWh * inp.precioKWh

  // ---- Financiamiento ----
  const montoDeuda = inp.capex * inp.pctDeuda
  const montoEquity = inp.capex * (1 - inp.pctDeuda)
  const periodoGracia =
    inp.periodoGraciaModo === 'construccion' ? constr : inp.periodoGraciaManual
  const saldoFinGracia = montoDeuda * Math.pow(1 + inp.tasaInteres, periodoGracia)
  const cuotaAnual =
    inp.tasaInteres > 0 && inp.plazoAmort > 0
      ? saldoFinGracia * inp.tasaInteres /
        (1 - Math.pow(1 + inp.tasaInteres, -inp.plazoAmort))
      : saldoFinGracia / Math.max(1, inp.plazoAmort)

  const financiamiento: Financiamiento = {
    montoDeuda,
    montoEquity,
    periodoGracia,
    saldoFinGracia,
    cuotaAnual,
    ingresoAnual,
    generacionAnualMWh,
  }

  const etapa = (t: number) =>
    t <= constr ? 'Construcción' : `Op. ${t - constr}`

  // ---- Depreciación (lineal, inicia en operación) ----
  const baseDepreciable = inp.capex * inp.baseDepreciablePct
  const depAnualBase =
    inp.aniosDepreciacion > 0
      ? (baseDepreciable * (1 - inp.valorResidualPct)) / inp.aniosDepreciacion
      : 0
  const depreciacion: DepreciacionRow[] = []
  let depAcum = 0
  for (let t = 0; t <= horizon; t++) {
    const opIdx = t - constr
    const depAnual = opIdx >= 1 && opIdx <= inp.aniosDepreciacion ? depAnualBase : 0
    depAcum += depAnual
    depreciacion.push({
      anio: t,
      etapa: etapa(t),
      depAnual,
      depAcum,
      valorLibros: inp.capex - depAcum,
    })
  }

  // ---- Préstamo (amortización con gracia + IDC capitalizado) ----
  const prestamo: PrestamoRow[] = []
  let saldoFinalPrev = montoDeuda
  prestamo.push({
    anio: 0,
    saldoInicial: 0,
    cuota: 0,
    intereses: 0,
    capital: 0,
    saldoFinal: montoDeuda,
  })
  for (let t = 1; t <= horizon; t++) {
    const saldoInicial = saldoFinalPrev
    const cuota =
      t > periodoGracia && t <= periodoGracia + inp.plazoAmort ? cuotaAnual : 0
    const intereses = saldoInicial * inp.tasaInteres
    let capital: number
    if (t <= periodoGracia) capital = -intereses // gracia: intereses capitalizan
    else if (t <= periodoGracia + inp.plazoAmort) capital = cuota - intereses
    else capital = 0
    const saldoFinal = saldoInicial - capital
    prestamo.push({ anio: t, saldoInicial, cuota, intereses, capital, saldoFinal })
    saldoFinalPrev = saldoFinal
  }

  // ---- Flujo de efectivo del inversionista (equity) ----
  const flujo = buildFlujo(inp, {
    horizon,
    constr,
    ingresoAnual,
    depreciacion,
    prestamo,
    montoEquity,
    revenueMultiplier: 1,
  })

  // ---- Rentabilidad ----
  const flujosNetos = flujo.map((f) => f.flujoNeto)
  const flujosOperacion = flujo.slice(1).map((f) => f.flujoNeto)
  const vanValor = van(inp.tasaDescuento, flujosNetos)
  const tir = irr(flujosNetos)
  const beneficioCosto =
    montoEquity !== 0 ? (vanValor + montoEquity) / montoEquity : null
  const roi =
    montoEquity !== 0
      ? flujosOperacion.reduce((a, b) => a + b, 0) / montoEquity - 1
      : null
  const payback = computePayback(flujo)
  const dscrValores = flujo
    .map((f) => f.dscr)
    .filter((d): d is number => d !== null && isFinite(d) && d > 0)
  const dscrPromedio =
    dscrValores.length > 0
      ? dscrValores.reduce((a, b) => a + b, 0) / dscrValores.length
      : null
  const dscrMinimo = dscrValores.length > 0 ? Math.min(...dscrValores) : null

  // ---- Sensibilidad ----
  const escenarios = ['Base', 'Optimista', 'Pesimista'].map((nombre, i) => {
    const mult = i === 0 ? 1 : i === 1 ? 1 + inp.variacionSens : 1 - inp.variacionSens
    const f =
      i === 0
        ? flujo
        : buildFlujo(inp, {
            horizon,
            constr,
            ingresoAnual,
            depreciacion,
            prestamo,
            montoEquity,
            revenueMultiplier: mult,
          })
    const fn = f.map((r) => r.flujoNeto)
    return { nombre, van: van(inp.tasaDescuento, fn), tir: irr(fn) }
  })

  return {
    financiamiento,
    depreciacion,
    prestamo,
    flujo,
    rentabilidad: {
      van: vanValor,
      tir,
      beneficioCosto,
      roi,
      payback,
      dscrPromedio,
      dscrMinimo,
    },
    escenarios,
  }
}

interface FlujoCtx {
  horizon: number
  constr: number
  ingresoAnual: number
  depreciacion: DepreciacionRow[]
  prestamo: PrestamoRow[]
  montoEquity: number
  revenueMultiplier: number
}

function buildFlujo(inp: ModelInputs, ctx: FlujoCtx): FlujoRow[] {
  const rows: FlujoRow[] = []
  let acumulado = 0
  for (let t = 0; t <= ctx.horizon; t++) {
    const enOperacion = t > ctx.constr
    const ingresos = enOperacion ? ctx.ingresoAnual * ctx.revenueMultiplier : 0

    let opex = 0
    if (enOperacion) {
      if (inp.opexMode === 'pct_capex_inflacion') {
        opex =
          inp.capex * inp.opexPct * Math.pow(1 + inp.inflacion, t - ctx.constr - 1)
      } else {
        opex = ingresos * inp.opexPct
      }
    }

    const depreciacion = ctx.depreciacion[t].depAnual
    const admin = ingresos * inp.gastosAdminPct
    const comercializacion = ingresos * inp.gastosComercPct
    const ajusteInflacion = ingresos * inp.ajusteInflacionPct
    const intereses = enOperacion ? ctx.prestamo[t].intereses : 0

    const totalCostos =
      opex + depreciacion + admin + comercializacion + ajusteInflacion + intereses
    const utilidadBruta = ingresos - totalCostos
    const isr = Math.max(0, utilidadBruta * inp.isr)
    const utilidadNeta = utilidadBruta - isr
    const pagoPrincipal = enOperacion ? ctx.prestamo[t].capital : 0
    const aporteEquity = t === 0 ? ctx.montoEquity : 0
    const flujoNeto =
      t === 0 ? -ctx.montoEquity : utilidadNeta + depreciacion - pagoPrincipal
    acumulado += flujoNeto

    const servicioDeuda = intereses + pagoPrincipal
    const dscr =
      ctx.prestamo[t].cuota > 0 && servicioDeuda !== 0
        ? (utilidadNeta + depreciacion + intereses) / servicioDeuda
        : null

    rows.push({
      anio: t,
      etapa: t <= ctx.constr ? 'Construcción' : `Op. ${t - ctx.constr}`,
      ingresos,
      opex,
      depreciacion,
      admin,
      comercializacion,
      ajusteInflacion,
      intereses,
      totalCostos,
      utilidadBruta,
      isr,
      utilidadNeta,
      pagoPrincipal,
      aporteEquity,
      flujoNeto,
      flujoAcumulado: acumulado,
      dscr,
    })
  }
  return rows
}

/** Payback simple del equity con interpolación lineal (igual que el Excel). */
function computePayback(flujo: FlujoRow[]): number | null {
  for (let i = 1; i < flujo.length; i++) {
    if (flujo[i].flujoAcumulado >= 0 && flujo[i - 1].flujoAcumulado < 0) {
      const prev = flujo[i - 1].flujoAcumulado
      const delta = flujo[i].flujoNeto
      if (delta === 0) return flujo[i].anio
      return flujo[i - 1].anio + -prev / delta
    }
  }
  return null // nunca se recupera dentro del horizonte
}
