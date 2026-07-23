export function fmtMoney(v: number, moneda = 'USD', compact = false): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: moneda,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : 0,
  }).format(v)
}

/** Número compacto sin símbolo de moneda, para ejes de gráficos. Ej: "285 M". */
export function fmtCompact(v: number): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('es-HN', { notation: 'compact', maximumFractionDigits: 1 })
    .format(v)
    .replace(' ', ' ')
}

export function fmtNum(v: number, dec = 0): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('es-HN', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v)
}

export function fmtPct(v: number, dec = 1): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('es-HN', {
    style: 'percent',
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  }).format(v)
}

export function fmtX(v: number | null, dec = 2): string {
  if (v === null || !isFinite(v)) return '—'
  return `${v.toFixed(dec)}×`
}

export function fmtYears(v: number | null): string {
  if (v === null || !isFinite(v)) return 'No se recupera'
  return `${v.toFixed(1)} años`
}
