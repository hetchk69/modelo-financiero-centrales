import type { ModelResults } from '../model/types'
import { fmtMoney, fmtX } from '../utils/format'

function Money({ v, moneda }: { v: number; moneda: string }) {
  const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'dim'
  return <span className={cls}>{fmtMoney(v, moneda)}</span>
}

/** Flujo de efectivo transpuesto: conceptos en filas, años en columnas. */
export function FlujoTable({ res, moneda }: { res: ModelResults; moneda: string }) {
  const f = res.flujo
  const rows: { label: string; key: keyof (typeof f)[0]; section?: boolean; total?: boolean; sign?: number }[] = [
    { label: 'Ingresos netos', key: 'ingresos' },
    { label: '(−) OPEX / O&M', key: 'opex' },
    { label: '(−) Depreciación', key: 'depreciacion' },
    { label: '(−) Gastos administrativos', key: 'admin' },
    { label: '(−) Gastos comercialización', key: 'comercializacion' },
    { label: '(−) Ajuste por inflación', key: 'ajusteInflacion' },
    { label: '(−) Intereses', key: 'intereses' },
    { label: 'Total costos y gastos', key: 'totalCostos' },
    { label: 'Utilidad bruta', key: 'utilidadBruta', section: true },
    { label: '(−) ISR', key: 'isr' },
    { label: 'Utilidad neta', key: 'utilidadNeta', section: true },
    { label: '(+) Depreciación', key: 'depreciacion' },
    { label: '(−) Pago de principal', key: 'pagoPrincipal' },
    { label: 'FLUJO NETO', key: 'flujoNeto', total: true },
    { label: 'Flujo acumulado', key: 'flujoAcumulado' },
  ]
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Concepto (USD)</th>
            {f.map((r) => <th key={r.anio}>Año {r.anio}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={row.total ? 'total' : row.section ? 'section' : ''}>
              <td>{row.label}</td>
              {f.map((r) => (
                <td key={r.anio}><Money v={r[row.key] as number} moneda={moneda} /></td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="dim">DSCR</td>
            {f.map((r) => (
              <td key={r.anio} className="dim">{r.dscr === null ? '—' : fmtX(r.dscr)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function PrestamoTable({ res, moneda }: { res: ModelResults; moneda: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Año</th><th>Saldo inicial</th><th>Cuota</th>
            <th>Intereses</th><th>Capital</th><th>Saldo final</th>
          </tr>
        </thead>
        <tbody>
          {res.prestamo.map((p) => (
            <tr key={p.anio}>
              <td>{p.anio}</td>
              <td>{fmtMoney(p.saldoInicial, moneda)}</td>
              <td>{fmtMoney(p.cuota, moneda)}</td>
              <td>{fmtMoney(p.intereses, moneda)}</td>
              <td className={p.capital < 0 ? 'neg' : ''}>{fmtMoney(p.capital, moneda)}</td>
              <td>{fmtMoney(p.saldoFinal, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DepreciacionTable({ res, moneda }: { res: ModelResults; moneda: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Año</th><th>Etapa</th><th>Depreciación anual</th>
            <th>Dep. acumulada</th><th>Valor en libros</th>
          </tr>
        </thead>
        <tbody>
          {res.depreciacion.map((d) => (
            <tr key={d.anio}>
              <td>{d.anio}</td>
              <td style={{ textAlign: 'left' }} className="dim">{d.etapa}</td>
              <td>{fmtMoney(d.depAnual, moneda)}</td>
              <td>{fmtMoney(d.depAcum, moneda)}</td>
              <td>{fmtMoney(d.valorLibros, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
