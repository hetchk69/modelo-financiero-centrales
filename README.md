# Modelo Financiero · Centrales Eléctricas

Aplicación web local que reemplaza los Excel conectados (Llanitos 2 y Namasigue)
por un **modelo financiero reactivo y moderno**. Mueves una "palanca" (supuesto)
y **todo el modelo recalcula al instante**: ingresos, depreciación, amortización
del préstamo, flujo de caja, rentabilidad (VAN, TIR, payback, DSCR) y sensibilidad.

## Cómo ejecutarlo

```bash
cd app
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
```

Para una versión de producción:

```bash
npm run build    # genera app/dist
npm run preview  # sirve el build
```

## Qué incluye

- **Panel de palancas** (izquierda): todos los inputs editables agrupados
  (inversión, ingresos, costos, financiamiento, fiscal). Sliders + campos numéricos.
- **KPIs** siempre visibles: VAN, TIR, Payback, DSCR mínimo, Beneficio/Costo, ROI.
  Se pintan en verde/rojo según si el proyecto es viable.
- **Pestañas**:
  - *Resumen*: gráfico de flujo de caja, DSCR por año y estructura del proyecto.
  - *Flujo de caja*: tabla año por año (como en Excel, pero editable en vivo).
  - *Amortización*: cuadro del préstamo con gracia e IDC capitalizado.
  - *Depreciación*: tabla lineal.
  - *Inversión (CAPEX)*: dona + desglose editable por componente.
  - *Sensibilidad*: escenarios optimista / base / pesimista.
- **Dos proyectos** precargados (selector arriba a la derecha): Llanitos 2
  (modo capacidad MW) y Namasigue (modo generación kWh).
- **Exportar CSV** del flujo de caja.

## Arquitectura

- `src/model/engine.ts` — el "motor": función pura que replica todas las
  cascadas del Excel (Supuestos → todo). Es la única fuente de verdad.
- `src/model/finance.ts` — VAN e TIR equivalentes a Excel.
- `src/model/presets.ts` — datos reales de ambos proyectos.
- `src/components/` — panel de palancas, gráficos SVG (sin dependencias) y tablas.

Un mismo motor cubre ambos proyectos mediante "modos":
- Ingreso: `capacidad` (MW × factor × horas × precio) o `generacion` (kWh × precio).
- OPEX: `% CAPEX` creciente con inflación, o `% de ingresos`.
