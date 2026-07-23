import { useState, type ReactNode } from 'react'
import type { ModelInputs } from '../model/types'
import { Investment, Revenue, Costs, Bank, Fiscal, Chevron } from './Icons'
import { fmtMoney, fmtNum, fmtPct } from '../utils/format'

type Patch = Partial<ModelInputs>
interface Props { inp: ModelInputs; onChange: (patch: Patch) => void }

/* ---------- Controles reutilizables ---------- */

function NumberField({
  label, value, onChange, prefix, suffix, step = 1, min, max, dec = 0, hint,
}: {
  label: string; value: number; onChange: (v: number) => void
  prefix?: string; suffix?: string; step?: number; min?: number; max?: number; dec?: number; hint?: string
}) {
  return (
    <div className="field-row">
      <div className="flabel"><span>{label}</span>{hint && <span className="val">{hint}</span>}</div>
      <div className="input-shell">
        {prefix && <span className="prefix">{prefix}</span>}
        <input
          type="number" value={Number.isFinite(value) ? +value.toFixed(dec + 4) : 0}
          step={step} min={min} max={max}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </div>
  )
}

function PctField({
  label, value, onChange, min = 0, max = 1, step = 0.005, display,
}: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; display?: string
}) {
  return (
    <div className="field-row">
      <div className="flabel">
        <span>{label}</span>
        <span className="val">{display ?? fmtPct(value, value < 0.1 ? 1 : 0)}</span>
      </div>
      <div className="slider-wrap">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))} />
        <div className="input-shell" style={{ width: 96, flex: 'none' }}>
          <input type="number" value={+(value * 100).toFixed(2)} step={step * 100}
            onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)} />
          <span className="suffix">%</span>
        </div>
      </div>
    </div>
  )
}

function Segmented<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="field-row">
      <div className="flabel"><span>{label}</span></div>
      <div className="segmented">
        {options.map((o) => (
          <button key={o.v} className={value === o.v ? 'active' : ''} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Section({
  icon, title, meta, open, onToggle, children,
}: {
  icon: ReactNode; title: string; meta?: string; open: boolean; onToggle: () => void; children: ReactNode
}) {
  return (
    <div className="acc">
      <button className={`acc-head ${open ? 'open' : ''}`} onClick={onToggle}>
        <span className="ico">{icon}</span>
        <span className="txt">{title}</span>
        {meta && <span className="dim" style={{ fontSize: 11.5 }}>{meta}</span>}
        <Chevron className="chev" />
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  )
}

/* ---------- Panel ---------- */

export function Sidebar({ inp, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    inv: true, ing: true, cost: false, fin: false, fisc: false,
  })
  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }))

  const gen = inp.revenueMode === 'capacidad'
    ? inp.capacidadMW * inp.factorPlanta * inp.horasAnio
    : inp.generacionKWh / 1000

  return (
    <>
      <div className="drawer-head">
        <div className="eyebrow">Parámetros del modelo</div>
        <div className="lead">Edita cualquier valor y todo el modelo recalcula al instante.</div>
      </div>

      <Section icon={<Investment />} title="Inversión y proyecto" open={open.inv} onToggle={() => toggle('inv')}
        meta={fmtMoney(inp.capex, inp.moneda, true)}>
        <NumberField label="CAPEX — Inversión total" prefix={inp.moneda} value={inp.capex}
          step={1_000_000} hint={fmtMoney(inp.capex, inp.moneda, true)} onChange={(v) => onChange({ capex: v })} />
        <NumberField label="Años de construcción" suffix="años" value={inp.aniosConstruccion} min={0} max={10}
          onChange={(v) => onChange({ aniosConstruccion: Math.round(v) })} />
        <NumberField label="Vida operativa" suffix="años" value={inp.vidaOperativa} min={1} max={40}
          onChange={(v) => onChange({ vidaOperativa: Math.round(v) })} />
        <NumberField label="Años de depreciación" suffix="años" value={inp.aniosDepreciacion} min={1} max={40}
          onChange={(v) => onChange({ aniosDepreciacion: Math.round(v) })} />
        <PctField label="Valor residual (% base depreciable)" value={inp.valorResidualPct} max={0.2}
          onChange={(v) => onChange({ valorResidualPct: v })} />
        <PctField label="% base depreciable del CAPEX" value={inp.baseDepreciablePct}
          onChange={(v) => onChange({ baseDepreciablePct: v })} />
      </Section>

      <Section icon={<Revenue />} title="Ingresos" open={open.ing} onToggle={() => toggle('ing')}
        meta={`${fmtNum(gen)} MWh`}>
        <Segmented label="Modo de ingreso" value={inp.revenueMode}
          options={[{ v: 'capacidad', label: 'Capacidad (MW)' }, { v: 'generacion', label: 'Generación (kWh)' }]}
          onChange={(v) => onChange({ revenueMode: v })} />
        {inp.revenueMode === 'capacidad' ? (
          <>
            <NumberField label="Capacidad instalada" suffix="MW" value={inp.capacidadMW} step={1}
              onChange={(v) => onChange({ capacidadMW: v })} />
            <PctField label="Factor de planta" value={inp.factorPlanta}
              onChange={(v) => onChange({ factorPlanta: v })} />
            <NumberField label="Horas por año" suffix="h" value={inp.horasAnio} step={10}
              onChange={(v) => onChange({ horasAnio: v })} />
            <NumberField label="Precio de energía" prefix={inp.moneda} suffix="/MWh" value={inp.precioMWh}
              step={1} dec={2} onChange={(v) => onChange({ precioMWh: v })} />
          </>
        ) : (
          <>
            <NumberField label="Generación anual" suffix="kWh" value={inp.generacionKWh} step={1_000_000}
              onChange={(v) => onChange({ generacionKWh: v })} />
            <NumberField label="Precio de energía" prefix={inp.moneda} suffix="/kWh" value={inp.precioKWh}
              step={0.001} dec={4} onChange={(v) => onChange({ precioKWh: v })} />
          </>
        )}
      </Section>

      <Section icon={<Costs />} title="Costos operativos" open={open.cost} onToggle={() => toggle('cost')}>
        <Segmented label="Base del OPEX (O&M)" value={inp.opexMode}
          options={[{ v: 'pct_capex_inflacion', label: '% CAPEX + infl.' }, { v: 'pct_ingresos', label: '% Ingresos' }]}
          onChange={(v) => onChange({ opexMode: v })} />
        <PctField label={inp.opexMode === 'pct_capex_inflacion' ? 'OPEX inicial (% CAPEX)' : 'OPEX / O&M (% ingresos)'}
          value={inp.opexPct} max={0.2} onChange={(v) => onChange({ opexPct: v })} />
        <PctField label="Gastos administrativos (% ing.)" value={inp.gastosAdminPct} max={0.1}
          onChange={(v) => onChange({ gastosAdminPct: v })} />
        <PctField label="Gastos comercialización (% ing.)" value={inp.gastosComercPct} max={0.1}
          onChange={(v) => onChange({ gastosComercPct: v })} />
        <PctField label="Ajuste por inflación (% ing.)" value={inp.ajusteInflacionPct} max={0.1}
          onChange={(v) => onChange({ ajusteInflacionPct: v })} />
        <PctField label="Inflación anual" value={inp.inflacion} max={0.15}
          onChange={(v) => onChange({ inflacion: v })} />
      </Section>

      <Section icon={<Bank />} title="Financiamiento" open={open.fin} onToggle={() => toggle('fin')}
        meta={`${fmtPct(inp.pctDeuda, 0)} deuda`}>
        <PctField label="% Deuda (fondo externo)" value={inp.pctDeuda}
          onChange={(v) => onChange({ pctDeuda: v })} />
        <PctField label="Tasa de interés anual" value={inp.tasaInteres} max={0.25}
          onChange={(v) => onChange({ tasaInteres: v })} />
        <NumberField label="Plazo de amortización" suffix="años" value={inp.plazoAmort} min={1} max={30}
          onChange={(v) => onChange({ plazoAmort: Math.round(v) })} />
        <Segmented label="Periodo de gracia" value={inp.periodoGraciaModo}
          options={[{ v: 'construccion', label: '= Construcción' }, { v: 'manual', label: 'Manual' }]}
          onChange={(v) => onChange({ periodoGraciaModo: v })} />
        {inp.periodoGraciaModo === 'manual' && (
          <NumberField label="Gracia manual" suffix="años" value={inp.periodoGraciaManual} min={0} max={10}
            onChange={(v) => onChange({ periodoGraciaManual: Math.round(v) })} />
        )}
      </Section>

      <Section icon={<Fiscal />} title="Fiscal y sensibilidad" open={open.fisc} onToggle={() => toggle('fisc')}>
        <PctField label="Tasa de descuento (VAN)" value={inp.tasaDescuento} max={0.3}
          onChange={(v) => onChange({ tasaDescuento: v })} />
        <PctField label="ISR (impuesto sobre la renta)" value={inp.isr} max={0.5}
          onChange={(v) => onChange({ isr: v })} />
        <PctField label="Variación sensibilidad (±)" value={inp.variacionSens} max={0.5}
          onChange={(v) => onChange({ variacionSens: v })} />
      </Section>
    </>
  )
}
