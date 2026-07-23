import { useMemo, useState } from 'react'
import type { FlujoRow, Escenario, CapexItem } from '../model/types'
import { fmtMoney, fmtX, fmtCompact } from '../utils/format'

const W = 760
const H = 280
const PAD = { top: 16, right: 18, bottom: 30, left: 52 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

// Colores estructurales del tema (siguen las variables CSS claras/oscuras).
const C = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  zero: 'var(--chart-zero)',
  green: 'var(--green)',
  red: 'var(--red)',
  accent: 'var(--accent)',
  amber: 'var(--amber)',
  text: 'var(--text)',
}

function niceTicks(min: number, max: number, count = 4) {
  const range = max - min || 1
  const step = range / count
  return Array.from({ length: count + 1 }, (_, k) => min + step * k)
}

/** Barras de flujo neto + área/línea de flujo acumulado, con tooltip. */
export function CashflowChart({ flujo, moneda }: { flujo: FlujoRow[]; moneda: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const g = useMemo(() => {
    const netos = flujo.map((f) => f.flujoNeto)
    const acum = flujo.map((f) => f.flujoAcumulado)
    const min = Math.min(0, ...netos, ...acum)
    const max = Math.max(0, ...netos, ...acum)
    const range = max - min || 1
    const x = (i: number) => PAD.left + (i / (flujo.length - 1 || 1)) * IW
    const y = (v: number) => PAD.top + (1 - (v - min) / range) * IH
    const bw = Math.max(2.5, (IW / flujo.length) * 0.58)
    const bars = flujo.map((f, i) => ({
      x: x(i) - bw / 2, y: Math.min(y(f.flujoNeto), y(0)),
      h: Math.abs(y(f.flujoNeto) - y(0)), w: bw, pos: f.flujoNeto >= 0,
    }))
    const linePts = acum.map((v, i) => [x(i), y(v)] as [number, number])
    const line = linePts.map((p) => p.join(',')).join(' ')
    const area = `${x(0)},${y(0)} ${line} ${x(flujo.length - 1)},${y(0)}`
    return { x, y, bars, line, area, ticks: niceTicks(min, max), y0: y(0), bw }
  }, [flujo])

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W - PAD.left
    const i = Math.round((rel / IW) * (flujo.length - 1))
    setHover(Math.max(0, Math.min(flujo.length - 1, i)))
  }
  const hv = hover !== null ? flujo[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img">
        <defs>
          <linearGradient id="cfArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {g.ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={g.y(t)} y2={g.y(t)} stroke={C.grid} />
            <text x={PAD.left - 9} y={g.y(t) + 4} fontSize="10.5" fill={C.axis} textAnchor="end">
              {fmtCompact(t)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={g.y0} y2={g.y0} stroke={C.zero} strokeWidth={1.25} />
        {g.bars.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={Math.max(0, b.h)} rx={2}
            fill={b.pos ? C.green : C.red} opacity={hover === null || hover === i ? 0.9 : 0.4} />
        ))}
        <polygon points={g.area} fill="url(#cfArea)" />
        <polyline points={g.line} fill="none" stroke={C.accent} strokeWidth={2.25} />
        {/* eje X: años cada 5 */}
        {flujo.map((f, i) => (i % 5 === 0 ? (
          <text key={i} x={g.x(i)} y={H - 9} fontSize="10" fill={C.axis} textAnchor="middle">{f.anio}</text>
        ) : null))}
        {hv && (
          <line x1={g.x(hover!)} x2={g.x(hover!)} y1={PAD.top} y2={PAD.top + IH} stroke={C.accent} strokeOpacity={0.4} strokeDasharray="3 3" />
        )}
        <rect x={PAD.left} y={PAD.top} width={IW} height={IH} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hv && (
        <div className="tooltip" style={{ left: `${(g.x(hover!) / W) * 100}%`, top: PAD.top + 6 }}>
          <div className="tt-title">Año {hv.anio} · {hv.etapa}</div>
          <div className="tt-row"><span className="dim">Flujo neto</span>
            <span className={hv.flujoNeto >= 0 ? 'pos' : 'neg'}>{fmtMoney(hv.flujoNeto, moneda, true)}</span></div>
          <div className="tt-row"><span className="dim">Acumulado</span>
            <span>{fmtMoney(hv.flujoAcumulado, moneda, true)}</span></div>
        </div>
      )}
      <div className="chart-legend">
        <span><span className="dot" style={{ background: C.green }} />Flujo neto positivo</span>
        <span><span className="dot" style={{ background: C.red }} />Flujo neto negativo</span>
        <span><span className="dot" style={{ background: C.accent }} />Flujo acumulado</span>
      </div>
    </div>
  )
}

/** Barras de DSCR por año con referencia 1.2× y tooltip. */
export function DscrChart({ flujo }: { flujo: FlujoRow[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const data = flujo.filter((f) => f.dscr !== null) as (FlujoRow & { dscr: number })[]
  if (data.length === 0) return <p className="dim">Sin servicio de deuda en el horizonte.</p>
  const max = Math.max(2, ...data.map((d) => d.dscr)) * 1.05
  const x = (i: number) => PAD.left + (i / (data.length - 1 || 1)) * IW
  const y = (v: number) => PAD.top + (1 - v / max) * IH
  const bw = Math.max(4, (IW / data.length) * 0.66)
  const color = (v: number) => (v >= 1.2 ? C.green : v >= 1 ? C.amber : C.red)

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W - PAD.left
    const i = Math.round((rel / IW) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }
  const hv = hover !== null ? data[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img">
        {[0, 0.5, 1, 1.5, 2].filter((t) => t <= max).map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={C.grid} />
            <text x={PAD.left - 9} y={y(t) + 4} fontSize="10.5" fill={C.axis} textAnchor="end">{t.toFixed(1)}×</text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(1.2)} y2={y(1.2)} stroke={C.amber} strokeDasharray="4 4" />
        <text x={W - PAD.right} y={y(1.2) - 6} fontSize="10" fill={C.amber} textAnchor="end">mín. bancable 1.2×</text>
        {data.map((d, i) => (
          <rect key={i} x={x(i) - bw / 2} y={y(d.dscr)} width={bw} height={PAD.top + IH - y(d.dscr)} rx={2}
            fill={color(d.dscr)} opacity={hover === null || hover === i ? 0.92 : 0.4} />
        ))}
        {data.map((d, i) => (i % 5 === 0 ? (
          <text key={i} x={x(i)} y={H - 9} fontSize="10" fill={C.axis} textAnchor="middle">{d.anio}</text>
        ) : null))}
        <rect x={PAD.left} y={PAD.top} width={IW} height={IH} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hv && (
        <div className="tooltip" style={{ left: `${(x(hover!) / W) * 100}%`, top: PAD.top + 6 }}>
          <div className="tt-title">Año {hv.anio}</div>
          <div className="tt-row"><span className="dim">DSCR</span>
            <span style={{ color: color(hv.dscr) }}>{fmtX(hv.dscr)}</span></div>
        </div>
      )}
      <div className="chart-legend">
        <span><span className="dot" style={{ background: C.green }} />≥ 1.2× (bancable)</span>
        <span><span className="dot" style={{ background: C.amber }} />1.0 – 1.2×</span>
        <span><span className="dot" style={{ background: C.red }} />&lt; 1.0× (déficit)</span>
      </div>
    </div>
  )
}

export function SensitivityBars({ escenarios, moneda }: { escenarios: Escenario[]; moneda: string }) {
  const max = Math.max(...escenarios.map((e) => Math.abs(e.van)), 1)
  const colors: Record<string, string> = { Base: C.accent, Optimista: C.green, Pesimista: C.red }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {escenarios.map((e) => (
        <div key={e.nombre}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
            <span style={{ color: colors[e.nombre], fontWeight: 600 }}>{e.nombre}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-dim)' }}>
              VAN {fmtMoney(e.van, moneda, true)} · TIR {e.tir === null ? '—' : (e.tir * 100).toFixed(1) + '%'}
            </span>
          </div>
          <div style={{ background: 'var(--surface-3)', borderRadius: 7, height: 16, overflow: 'hidden' }}>
            <div style={{ width: `${(Math.abs(e.van) / max) * 100}%`, height: '100%',
              background: colors[e.nombre], borderRadius: 7, transition: 'width .3s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const DONUT_COLORS = ['#5b8def', '#2fd196', '#f5b544', '#f2666f', '#a78bfa', '#22d3ee',
  '#fb923c', '#f472b6', '#818cf8', '#2dd4bf', '#facc15', '#93a3ba',
  '#60a5fa', '#4ade80', '#e879f9', '#fca5a5']

export function CapexDonut({ items, capex, moneda }: { items: CapexItem[]; capex: number; moneda: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = items.reduce((a, b) => a + b.pct, 0) || 1
  const r = 78, cx = 100, cy = 100, sw = 30
  let acc = 0
  const segs = items.map((it, i) => {
    const frac = it.pct / total
    const start = acc * 2 * Math.PI - Math.PI / 2
    acc += frac
    const end = acc * 2 * Math.PI - Math.PI / 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: DONUT_COLORS[i % DONUT_COLORS.length], it }
  })
  const hv = hover !== null ? items[hover] : null
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 200 200" width="200" height="200" style={{ flexShrink: 0 }}>
        {segs.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={hover === i ? sw + 5 : sw}
            opacity={hover === null || hover === i ? 1 : 0.4}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10.5" fill={C.axis}>
          {hv ? `${(hv.pct * 100).toFixed(1)}%` : 'CAPEX'}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="15" fill={C.text} fontWeight="650">
          {fmtMoney(hv ? capex * hv.pct : capex, moneda, true)}
        </text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 20px', flex: 1, minWidth: 300 }}>
        {segs.map((s, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              opacity: hover === null || hover === i ? 1 : 0.5, cursor: 'default' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.it.concepto}
            </span>
            <span style={{ color: 'var(--text-faint)' }}>{(s.it.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
