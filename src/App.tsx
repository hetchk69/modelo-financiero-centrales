import { useMemo, useState } from 'react'
import { computeModel } from './model/engine'
import type { ModelInputs } from './model/types'
import { clonePreset, presetLabels } from './model/presets'
import { Sidebar } from './components/Sidebar'
import { CashflowChart, DscrChart, SensitivityBars, CapexDonut } from './components/Charts'
import { FlujoTable, PrestamoTable, DepreciacionTable } from './components/Tables'
import { Menu, Close, Reset, Download } from './components/Icons'
import { fmtMoney, fmtPct, fmtX, fmtYears, fmtNum } from './utils/format'

type Tab = 'resumen' | 'supuestos' | 'ingresos' | 'inversion' | 'depreciacion' | 'prestamo' | 'flujo' | 'rentabilidad' | 'sensibilidad'

// Orden siguiendo las hojas/tablas del modelo Excel.
// Los supuestos se editan en el panel lateral y se exponen en la vista "Supuestos".
const TABS: { id: Tab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'supuestos', label: 'Supuestos' },
  { id: 'ingresos', label: '1 · Ingresos' },
  { id: 'inversion', label: '2 · Inversión (CAPEX)' },
  { id: 'depreciacion', label: '3 · Depreciación' },
  { id: 'prestamo', label: '4 · Préstamo' },
  { id: 'flujo', label: '5 · Flujo de caja' },
  { id: 'rentabilidad', label: '6 · Rentabilidad' },
  { id: 'sensibilidad', label: '7 · Sensibilidad' },
]

export default function App() {
  const [presetKey, setPresetKey] = useState('llanitos2')
  const [inp, setInp] = useState<ModelInputs>(() => clonePreset('llanitos2'))
  const [tab, setTab] = useState<Tab>('resumen')
  const [menuOpen, setMenuOpen] = useState(true)

  const res = useMemo(() => computeModel(inp), [inp])
  const r = res.rentabilidad
  const m = inp.moneda

  const patch = (p: Partial<ModelInputs>) => setInp((prev) => ({ ...prev, ...p }))
  const loadPreset = (key: string) => { setPresetKey(key); setInp(clonePreset(key)) }

  const exportCsv = () => {
    const f = res.flujo
    const lines: string[] = []
    lines.push(['Concepto', ...f.map((x) => `Año ${x.anio}`)].join(','))
    const rows: [string, (i: number) => number][] = [
      ['Ingresos', (i) => f[i].ingresos], ['OPEX', (i) => f[i].opex],
      ['Depreciacion', (i) => f[i].depreciacion], ['Admin', (i) => f[i].admin],
      ['Comercializacion', (i) => f[i].comercializacion], ['Ajuste inflacion', (i) => f[i].ajusteInflacion],
      ['Intereses', (i) => f[i].intereses], ['ISR', (i) => f[i].isr],
      ['Utilidad neta', (i) => f[i].utilidadNeta], ['Pago principal', (i) => f[i].pagoPrincipal],
      ['Flujo neto', (i) => f[i].flujoNeto], ['Flujo acumulado', (i) => f[i].flujoAcumulado],
    ]
    for (const [label, get] of rows) lines.push([label, ...f.map((_, i) => get(i).toFixed(0))].join(','))
    lines.push(`VAN,${r.van.toFixed(0)}`)
    lines.push(`TIR,${r.tir === null ? 'n/d' : (r.tir * 100).toFixed(2) + '%'}`)
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flujo_${presetKey}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const vanGood = r.van >= 0
  const tirVsWacc = r.tir !== null && r.tir >= inp.tasaDescuento
  const dscrOk = r.dscrMinimo !== null && r.dscrMinimo >= 1.2

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
          {menuOpen ? <Close /> : <Menu />}
        </button>
        <div className="brand">
          <h1>Modelo Financiero</h1>
          <span className="sub">{inp.nombre}</span>
        </div>
        <div className="spacer" />
        <select className="select" value={presetKey} onChange={(e) => loadPreset(e.target.value)}>
          {Object.entries(presetLabels).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <button className="btn ghost" onClick={() => loadPreset(presetKey)}>
          <Reset /><span className="lbl-sm">Restablecer</span>
        </button>
        <button className="btn primary" onClick={exportCsv}>
          <Download /><span className="lbl-sm">Exportar CSV</span>
        </button>
      </header>

      <div className="body">
        <aside className={`drawer ${menuOpen ? '' : 'closed'}`}>
          <Sidebar inp={inp} onChange={patch} />
        </aside>
        <div className={`scrim ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} />

        <main className="main">
          <div className="main-inner">
            <div className="kpi-row">
              <div className={`kpi ${vanGood ? 'good' : 'bad'}`}>
                <div className="label">VAN (equity)</div>
                <div className="value">{fmtMoney(r.van, m, true)}</div>
                <div className="hint">Descontado al {fmtPct(inp.tasaDescuento, 0)}</div>
              </div>
              <div className={`kpi ${tirVsWacc ? 'good' : 'bad'}`}>
                <div className="label">TIR</div>
                <div className="value">{r.tir === null ? '—' : fmtPct(r.tir, 1)}</div>
                <div className="hint">vs. descuento {fmtPct(inp.tasaDescuento, 0)}</div>
              </div>
              <div className="kpi">
                <div className="label">Payback</div>
                <div className="value">{r.payback === null ? '—' : r.payback.toFixed(1)}</div>
                <div className="hint">{fmtYears(r.payback)}</div>
              </div>
              <div className={`kpi ${dscrOk ? 'good' : r.dscrMinimo === null ? '' : 'bad'}`}>
                <div className="label">DSCR mínimo</div>
                <div className="value">{fmtX(r.dscrMinimo)}</div>
                <div className="hint">Promedio {fmtX(r.dscrPromedio)}</div>
              </div>
              <div className="kpi">
                <div className="label">Beneficio / Costo</div>
                <div className="value">{fmtX(r.beneficioCosto)}</div>
                <div className="hint">ROI {r.roi === null ? '—' : fmtPct(r.roi, 0)}</div>
              </div>
            </div>

            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'resumen' && <ResumenTab res={res} inp={inp} />}
            {tab === 'supuestos' && <SupuestosTab res={res} inp={inp} />}
            {tab === 'ingresos' && <IngresosTab res={res} inp={inp} />}
            {tab === 'rentabilidad' && <RentabilidadTab res={res} inp={inp} />}
            {tab === 'flujo' && (
              <div className="card">
                <h3>Flujo neto de efectivo del inversionista (equity)</h3>
                <div className="card-sub">Conceptos por año — todo recalcula al mover las palancas.</div>
                <FlujoTable res={res} moneda={m} />
              </div>
            )}
            {tab === 'prestamo' && (
              <div className="card">
                <h3>Amortización del préstamo</h3>
                <div className="card-sub">
                  Deuda {fmtMoney(res.financiamiento.montoDeuda, m)} · Cuota anual{' '}
                  {fmtMoney(res.financiamiento.cuotaAnual, m)} · Gracia {res.financiamiento.periodoGracia} años
                  {res.financiamiento.periodoGracia > 0 &&
                    ` (saldo al fin de gracia con IDC: ${fmtMoney(res.financiamiento.saldoFinGracia, m)})`}
                </div>
                <PrestamoTable res={res} moneda={m} />
              </div>
            )}
            {tab === 'depreciacion' && (
              <div className="card">
                <h3>Tabla de depreciación (lineal)</h3>
                <div className="card-sub">
                  Base depreciable {fmtMoney(inp.capex * inp.baseDepreciablePct, m)} ·{' '}
                  {inp.aniosDepreciacion} años · valor residual {fmtPct(inp.valorResidualPct, 0)}
                </div>
                <DepreciacionTable res={res} moneda={m} />
              </div>
            )}
            {tab === 'inversion' && <InversionTab inp={inp} onChange={patch} />}
            {tab === 'sensibilidad' && <SensibilidadTab res={res} inp={inp} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function ResumenTab({ res, inp }: { res: ReturnType<typeof computeModel>; inp: ModelInputs }) {
  const m = inp.moneda
  const fin = res.financiamiento
  return (
    <>
      <div className="card">
        <h3>Flujo de caja del proyecto</h3>
        <div className="card-sub">Barras = flujo neto anual · línea azul = flujo acumulado del equity</div>
        <CashflowChart flujo={res.flujo} moneda={m} />
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Cobertura del servicio de deuda (DSCR)</h3>
          <div className="card-sub">Un DSCR ≥ 1.2× suele ser el mínimo exigido por bancos.</div>
          <DscrChart flujo={res.flujo} />
        </div>
        <div className="card">
          <h3>Estructura del proyecto</h3>
          <div className="card-sub">Cifras clave que alimentan el modelo.</div>
          <div className="fact-grid">
            {([
              ['Ingreso anual (operación)', fmtMoney(fin.ingresoAnual, m)],
              ['Generación anual', `${fmtNum(fin.generacionAnualMWh)} MWh`],
              ['Deuda', `${fmtMoney(fin.montoDeuda, m)} (${fmtPct(inp.pctDeuda, 0)})`],
              ['Equity', `${fmtMoney(fin.montoEquity, m)} (${fmtPct(1 - inp.pctDeuda, 0)})`],
              ['Cuota anual de deuda', fmtMoney(fin.cuotaAnual, m)],
              ['Horizonte de evaluación', `${inp.aniosConstruccion + inp.vidaOperativa} años`],
            ] as [string, string][]).map(([k, v]) => (
              <div className="fact" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

type ParamRow = [label: string, value: string, nota?: string]

function ParamTable({ title, rows }: { title: string; rows: ParamRow[] }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th style={{ width: '42%' }}>Parámetro</th><th style={{ width: '22%' }}>Valor</th><th>Nota</th></tr></thead>
          <tbody>
            {rows.map(([label, value, nota], i) => (
              <tr key={i}>
                <td>{label}</td>
                <td style={{ fontWeight: 600 }}>{value}</td>
                <td className="dim" style={{ textAlign: 'left', whiteSpace: 'normal' }}>{nota ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SupuestosTab({ res, inp }: { res: ReturnType<typeof computeModel>; inp: ModelInputs }) {
  const m = inp.moneda
  const fin = res.financiamiento
  const money4 = (v: number) =>
    new Intl.NumberFormat('es-HN', { style: 'currency', currency: m, maximumFractionDigits: 4 }).format(v)

  const proyecto: ParamRow[] = [
    ['Inversión total (CAPEX)', fmtMoney(inp.capex, m), 'Editable — cascada a todo el modelo'],
    ['Años de construcción', `${inp.aniosConstruccion} años`, 'Sin ingresos; deuda en periodo de gracia'],
    ['Vida operativa', `${inp.vidaOperativa} años`, 'Operación comercial'],
    ['Horizonte de evaluación', `${inp.aniosConstruccion + inp.vidaOperativa} años`, 'Construcción + operación'],
    ['Años de depreciación', `${inp.aniosDepreciacion} años`, 'Depreciación lineal'],
    ['Valor residual', fmtPct(inp.valorResidualPct, 0), 'Sobre la base depreciable'],
    ['% base depreciable del CAPEX', fmtPct(inp.baseDepreciablePct, 0), 'Parte del CAPEX que se deprecia'],
  ]

  const ingresos: ParamRow[] = inp.revenueMode === 'capacidad'
    ? [
        ['Modo de ingreso', 'Capacidad (MW)', 'MW × factor × horas × precio'],
        ['Capacidad instalada', `${fmtNum(inp.capacidadMW)} MW`, 'Potencia de la central'],
        ['Factor de planta', fmtPct(inp.factorPlanta, 0), 'Utilización promedio'],
        ['Horas por año', `${fmtNum(inp.horasAnio)} h`, '24 × 365'],
        ['Precio de energía', `${fmtMoney(inp.precioMWh, m)} / MWh`, 'Precio o costo marginal'],
        ['Generación anual', `${fmtNum(fin.generacionAnualMWh)} MWh`, 'Calculado'],
        ['Ingreso anual', fmtMoney(fin.ingresoAnual, m), 'En operación'],
      ]
    : [
        ['Modo de ingreso', 'Generación (kWh)', 'kWh × precio'],
        ['Generación anual', `${fmtNum(inp.generacionKWh)} kWh`, 'Energía vendida al año'],
        ['Precio de energía', `${money4(inp.precioKWh)} / kWh`, 'Tarifa de contrato'],
        ['Ingreso anual', fmtMoney(fin.ingresoAnual, m), 'En operación'],
      ]

  const costos: ParamRow[] = [
    ['Base del OPEX (O&M)', inp.opexMode === 'pct_capex_inflacion' ? '% del CAPEX + inflación' : '% de ingresos', ''],
    [inp.opexMode === 'pct_capex_inflacion' ? 'OPEX inicial (% CAPEX)' : 'OPEX / O&M (% ingresos)', fmtPct(inp.opexPct, 0), 'Operación y mantenimiento'],
    ['Gastos administrativos', fmtPct(inp.gastosAdminPct, 0), 'Sobre ingresos'],
    ['Gastos de comercialización', fmtPct(inp.gastosComercPct, 0), 'Sobre ingresos'],
    ...(inp.ajusteInflacionPct > 0 ? [['Ajuste por inflación', fmtPct(inp.ajusteInflacionPct, 1), 'Sobre ingresos'] as ParamRow] : []),
    ['Inflación anual', fmtPct(inp.inflacion, 1), 'Crecimiento de costos'],
    ['ISR (impuesto sobre la renta)', fmtPct(inp.isr, 0), 'Honduras'],
    ['Tasa de descuento', fmtPct(inp.tasaDescuento, 0), 'Para el VAN'],
    ['Variación de sensibilidad (±)', fmtPct(inp.variacionSens, 0), 'Escenario optimista / pesimista'],
  ]

  const financiamiento: ParamRow[] = [
    ['% Deuda (fondo externo)', fmtPct(inp.pctDeuda, 0), 'Palanca — mezcla deuda/equity'],
    ['% Equity (aporte propio)', fmtPct(1 - inp.pctDeuda, 0), '1 − % Deuda'],
    ['Monto de deuda', fmtMoney(fin.montoDeuda, m), 'CAPEX × % Deuda'],
    ['Monto de equity', fmtMoney(fin.montoEquity, m), 'CAPEX × % Equity'],
    ['Tasa de interés anual', fmtPct(inp.tasaInteres, 1), 'Palanca'],
    ['Plazo de amortización', `${inp.plazoAmort} años`, 'Palanca'],
    ['Periodo de gracia', `${fin.periodoGracia} años`, inp.periodoGraciaModo === 'construccion' ? 'Igual a la construcción' : 'Manual'],
    ...(fin.periodoGracia > 0 ? [['Saldo al fin de gracia', fmtMoney(fin.saldoFinGracia, m), 'Intereses de construcción capitalizados'] as ParamRow] : []),
    ['Cuota anual (servicio de deuda)', fmtMoney(fin.cuotaAnual, m), 'Amortización francesa'],
  ]

  return (
    <>
      <div className="card" style={{ background: 'var(--surface-2)' }}>
        <h3>Supuestos del proyecto — {inp.nombre}</h3>
        <div className="card-sub" style={{ marginBottom: 0 }}>
          Ficha de todos los valores de entrada del modelo. Para modificarlos, abre el panel lateral
          (botón de menú). Todo lo demás se recalcula automáticamente.
        </div>
      </div>
      <div className="grid-2">
        <ParamTable title="Proyecto e inversión" rows={proyecto} />
        <ParamTable title="Ingresos" rows={ingresos} />
      </div>
      <div className="grid-2">
        <ParamTable title="Costos, impuestos y sensibilidad" rows={costos} />
        <ParamTable title="Financiamiento" rows={financiamiento} />
      </div>
    </>
  )
}

function IngresosTab({ res, inp }: { res: ReturnType<typeof computeModel>; inp: ModelInputs }) {
  const m = inp.moneda
  const fin = res.financiamiento
  const filas: [string, string][] = inp.revenueMode === 'capacidad'
    ? [
        ['Capacidad instalada', `${fmtNum(inp.capacidadMW)} MW`],
        ['Factor de planta', fmtPct(inp.factorPlanta, 0)],
        ['Horas por año', `${fmtNum(inp.horasAnio)} h`],
        ['Generación anual', `${fmtNum(fin.generacionAnualMWh)} MWh`],
        ['Precio de energía', `${fmtMoney(inp.precioMWh, m)} / MWh`],
        ['INGRESO ANUAL (operación)', fmtMoney(fin.ingresoAnual, m)],
      ]
    : [
        ['Generación anual', `${fmtNum(inp.generacionKWh)} kWh`],
        ['Precio de energía', `${new Intl.NumberFormat('es-HN', { style: 'currency', currency: m, maximumFractionDigits: 4 }).format(inp.precioKWh)} / kWh`],
        ['INGRESO ANUAL (operación)', fmtMoney(fin.ingresoAnual, m)],
      ]
  return (
    <div className="card">
      <h3>Proyección de ingresos</h3>
      <div className="card-sub">
        Modo {inp.revenueMode === 'capacidad' ? 'capacidad (MW × factor × horas × precio)' : 'generación (kWh × precio)'}.
        Los ingresos empiezan tras {inp.aniosConstruccion} año(s) de construcción.
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
          <tbody>
            {filas.map(([k, v], i) => (
              <tr key={i} className={i === filas.length - 1 ? 'total' : ''}>
                <td>{k}</td><td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RentabilidadTab({ res, inp }: { res: ReturnType<typeof computeModel>; inp: ModelInputs }) {
  const m = inp.moneda
  const r = res.rentabilidad
  const filas: [string, string, string][] = [
    ['VAN — Valor Actual Neto', fmtMoney(r.van, m), `Flujo del equity descontado al ${fmtPct(inp.tasaDescuento, 0)}`],
    ['TIR — Tasa Interna de Retorno', r.tir === null ? 'n/d' : fmtPct(r.tir, 2), 'Rendimiento del inversionista'],
    ['Razón Beneficio / Costo', fmtX(r.beneficioCosto), '(VAN + Equity) / Equity'],
    ['ROI (retorno sobre equity)', r.roi === null ? 'n/d' : fmtPct(r.roi, 0), 'Suma de flujos op. / Equity − 1'],
    ['Periodo de recuperación', fmtYears(r.payback), 'Payback simple del equity'],
    ['DSCR promedio', fmtX(r.dscrPromedio), 'Cobertura del servicio de deuda'],
    ['DSCR mínimo', fmtX(r.dscrMinimo), 'Año más ajustado'],
  ]
  return (
    <div className="card">
      <h3>Indicadores de rentabilidad</h3>
      <div className="card-sub">Se recalculan con cada cambio en las palancas.</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Indicador</th><th>Valor</th><th>Definición</th></tr></thead>
          <tbody>
            {filas.map(([k, v, d], i) => (
              <tr key={i}>
                <td>{k}</td>
                <td style={{ fontWeight: 600 }}>{v}</td>
                <td className="dim" style={{ textAlign: 'left' }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InversionTab({ inp, onChange }: { inp: ModelInputs; onChange: (p: Partial<ModelInputs>) => void }) {
  const m = inp.moneda
  const total = inp.capexBreakdown.reduce((a, b) => a + b.pct, 0)
  const setPct = (i: number, pct: number) => {
    const next = inp.capexBreakdown.map((it, j) => (j === i ? { ...it, pct } : it))
    onChange({ capexBreakdown: next })
  }
  return (
    <>
      <div className="card">
        <h3>Distribución del CAPEX</h3>
        <div className="card-sub">
          Total asignado: {fmtPct(total, 1)}{' '}
          {Math.abs(total - 1) > 0.001 && (
            <span className="badge warn">≠ 100% ({fmtMoney(inp.capex * total, m, true)})</span>
          )}
        </div>
        <CapexDonut items={inp.capexBreakdown} capex={inp.capex} moneda={m} />
      </div>
      <div className="card">
        <h3>Detalle por componente</h3>
        <div className="card-sub">Edita el % de cada rubro; el monto se recalcula sobre el CAPEX.</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Componente</th><th>% del CAPEX</th><th>Monto</th></tr></thead>
            <tbody>
              {inp.capexBreakdown.map((it, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left' }}>{it.concepto}</td>
                  <td>
                    <div className="input-shell" style={{ display: 'inline-flex', width: 96, height: 32 }}>
                      <input type="number" value={+(it.pct * 100).toFixed(2)} step={0.5}
                        onChange={(e) => setPct(i, (parseFloat(e.target.value) || 0) / 100)} />
                      <span className="suffix">%</span>
                    </div>
                  </td>
                  <td>{fmtMoney(inp.capex * it.pct, m)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>TOTAL</td><td>{fmtPct(total, 1)}</td><td>{fmtMoney(inp.capex * total, m)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SensibilidadTab({ res, inp }: { res: ReturnType<typeof computeModel>; inp: ModelInputs }) {
  const m = inp.moneda
  return (
    <>
      <div className="card">
        <h3>Análisis de sensibilidad — VAN por escenario</h3>
        <div className="card-sub">
          Optimista = ingresos +{fmtPct(inp.variacionSens, 0)} · Pesimista = ingresos −{fmtPct(inp.variacionSens, 0)}
        </div>
        <SensitivityBars escenarios={res.escenarios} moneda={m} />
      </div>
      <div className="card">
        <h3>Comparativo de escenarios</h3>
        <div className="scenario-cards">
          {res.escenarios.map((e) => (
            <div className="sc" key={e.nombre}>
              <div className="name">{e.nombre}</div>
              <div className="van" style={{ color: e.van >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmtMoney(e.van, m, true)}
              </div>
              <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>
                TIR {e.tir === null ? '—' : fmtPct(e.tir, 1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
