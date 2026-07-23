// Utilidades financieras equivalentes a las funciones de Excel usadas en el modelo.

/** VAN de Excel: el primer flujo se descuenta 1 periodo (t=1..n). */
export function npv(rate: number, cashflows: number[]): number {
  let acc = 0
  for (let i = 0; i < cashflows.length; i++) {
    acc += cashflows[i] / Math.pow(1 + rate, i + 1)
  }
  return acc
}

/** VAN completo: flujo del año 0 sin descontar + VAN de los años 1..n. */
export function van(rate: number, flows: number[]): number {
  if (flows.length === 0) return 0
  return flows[0] + npv(rate, flows.slice(1))
}

/**
 * TIR (IRR de Excel). Combina bisección robusta con refinamiento de Newton.
 * Devuelve null si no hay cambio de signo o no converge.
 */
export function irr(flows: number[]): number | null {
  const hasPos = flows.some((f) => f > 0)
  const hasNeg = flows.some((f) => f < 0)
  if (!hasPos || !hasNeg) return null

  const f = (rate: number) => {
    let acc = 0
    for (let t = 0; t < flows.length; t++) acc += flows[t] / Math.pow(1 + rate, t)
    return acc
  }

  // Bisección sobre un rango amplio y seguro (-99% a +1000%).
  let lo = -0.9999
  let hi = 10
  let flo = f(lo)
  let fhi = f(hi)
  if (flo * fhi > 0) {
    // Búsqueda de un intervalo con cambio de signo.
    let found = false
    let prevR = lo
    let prevF = flo
    for (let r = -0.99; r <= 10; r += 0.01) {
      const fr = f(r)
      if (prevF * fr < 0) {
        lo = prevR
        hi = r
        flo = prevF
        fhi = fr
        found = true
        break
      }
      prevR = r
      prevF = fr
    }
    if (!found) return null
  }

  let rate = (lo + hi) / 2
  for (let i = 0; i < 200; i++) {
    const fmid = f(rate)
    if (Math.abs(fmid) < 1e-7) return rate
    if (flo * fmid < 0) {
      hi = rate
      fhi = fmid
    } else {
      lo = rate
      flo = fmid
    }
    rate = (lo + hi) / 2
  }
  return rate
}
