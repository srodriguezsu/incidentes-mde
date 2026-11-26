"use client";

import { useState } from "react";
import type { Resumen } from "@/lib/datos";
import { DIAS, DIAS_LARGO, Leyenda, fmt, fuego, hora } from "./ui";

/* ---------- Mapa de calor hora × día ---------- */
export function Calor({ calor }: { calor: (number | null)[][] }) {
  const [sel, setSel] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...calor.flat().map((v) => v ?? 0));
  const total = calor.flat().reduce<number>((a, v) => a + (v ?? 0), 0);
  const prom = total / (7 * 24);
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[600px] gap-[2px]" style={{ gridTemplateColumns: "2.5rem repeat(24, 1fr)" }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[10px] text-muted">{h}</div>
          ))}
          {calor.map((fila, d) => (
            <Fila key={d} d={d} fila={fila} max={max} sel={sel} onSel={setSel} />
          ))}
        </div>
      </div>
      <div className="mt-3"><Leyenda /></div>
      <p className="mt-3 min-h-10 text-sm">
        {sel ? (
          <>
            <b>{DIAS_LARGO[sel[0]]} a las {hora(sel[1])}</b>: {fmt(calor[sel[0]][sel[1]])} incidentes,{" "}
            <b className="text-accent">{fmt((calor[sel[0]][sel[1]] ?? 0) / prom, 2)}×</b> el promedio de una hora cualquiera de la semana.
          </>
        ) : (
          <span className="text-muted">Toca una celda para compararla con el promedio semanal ({fmt(prom)} por franja).</span>
        )}
      </p>
    </div>
  );
}

function Fila({ d, fila, max, sel, onSel }: {
  d: number; fila: (number | null)[]; max: number; sel: [number, number] | null; onSel: (s: [number, number]) => void;
}) {
  return (
    <>
      <div className="self-center text-xs text-muted">{DIAS[d]}</div>
      {fila.map((n, h) => (
        <button
          key={h}
          onClick={() => onSel([d, h])}
          title={`${DIAS[d]} ${h}:00 — ${fmt(n)}`}
          className={`aspect-[4/3] rounded-md transition-transform duration-200 hover:z-10 hover:scale-125 sm:aspect-square ${sel?.[0] === d && sel?.[1] === h ? "z-10 scale-125 ring-2 ring-foreground" : ""}`}
          style={{ background: n == null ? "var(--line)" : fuego(Math.pow(n / max, 1.3)) }}
        />
      ))}
    </>
  );
}

/* ---------- Barras por hora + línea de letalidad ---------- */
export function HoraLetalidad({ porHora, letalidad }: { porHora: (number | null)[]; letalidad: (number | null)[] }) {
  const W = 600, H = 220, P = { l: 34, r: 34, t: 12, b: 24 };
  const maxN = Math.max(1, ...porHora.map((v) => v ?? 0));
  const maxL = Math.max(1, ...letalidad.map((v) => v ?? 0));
  const bw = (W - P.l - P.r) / 24;
  const x = (h: number) => P.l + h * bw;
  const yN = (v: number) => P.t + (H - P.t - P.b) * (1 - v / maxN);
  const yL = (v: number) => P.t + (H - P.t - P.b) * (1 - v / maxL);
  const pts = letalidad.map((v, h) => (v == null ? null : `${x(h) + bw / 2},${yL(v)}`)).filter(Boolean).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {porHora.map((v, h) => (
          <rect key={h} x={x(h) + 1.5} y={yN(v ?? 0)} width={bw - 3} height={H - P.b - yN(v ?? 0)} fill={fuego(0.1 + 0.6 * ((v ?? 0) / maxN))} rx={3}>
            <title>{`${hora(h)}: ${fmt(v)} incidentes · ${fmt(letalidad[h], 1)} con muertos por cada 1.000`}</title>
          </rect>
        ))}
        <defs><filter id="glowL"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <polyline points={pts} fill="none" stroke="var(--accent-2)" strokeWidth={3} strokeLinejoin="round" filter="url(#glowL)" />
        {letalidad.map((v, h) => v != null && <circle key={h} cx={x(h) + bw / 2} cy={yL(v)} r={3} fill="var(--accent-2)" />)}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={x(h) + bw / 2} y={H - 6} textAnchor="middle" fontSize={10} className="fill-muted">{h}h</text>
        ))}
        <text x={4} y={P.t + 8} fontSize={10} className="fill-accent">{fmt(maxN)}</text>
        <text x={W - 4} y={P.t + 8} fontSize={10} textAnchor="end" className="fill-accent-2">{fmt(maxL, 1)}‰</text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-accent" />Incidentes</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-accent-2" />Incidentes con muertos por cada 1.000 (‰)</span>
      </div>
    </div>
  );
}

/* ---------- Serie mensual ---------- */
export function Serie({ serie }: { serie: Resumen["serieMensual"] }) {
  const W = 600, H = 200, P = { l: 8, r: 8, t: 16, b: 22 };
  const vals = serie.map((s) => s.n ?? 0);
  const max = Math.max(1, ...vals);
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, serie.length - 1);
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  const linea = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${H - P.b} ${linea} ${x(vals.length - 1)},${H - P.b}`;
  const iMin = vals.indexOf(Math.min(...vals));
  const iMax = vals.indexOf(max);
  const [hov, setHov] = useState<number | null>(null);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHov(null)}>
      <defs>
        <linearGradient id="areaS" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity={0.45} /><stop offset="1" stopColor="var(--accent)" stopOpacity={0} /></linearGradient>
        <linearGradient id="lineaS" x1="0" x2="1"><stop offset="0" stopColor="var(--amber)" /><stop offset=".6" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaS)" />
      <polyline points={linea} fill="none" stroke="url(#lineaS)" strokeWidth={2.5} strokeLinejoin="round" />
      {serie.map((s, i) =>
        s.periodo.endsWith("-01") ? (
          <g key={s.periodo}>
            <line x1={x(i)} x2={x(i)} y1={P.t} y2={H - P.b} stroke="var(--line)" />
            <text x={x(i) + 2} y={H - 6} fontSize={10} className="fill-muted">{s.periodo.slice(0, 4)}</text>
          </g>
        ) : null,
      )}
      {[iMax, iMin].map((i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(vals[i])} r={4} fill="var(--accent)" />
          <text x={Math.min(W - 70, Math.max(4, x(i) - 30))} y={i === iMin ? y(vals[i]) - 8 : y(vals[i]) - 6} fontSize={10} className="fill-foreground">
            {serie[i].periodo}: {fmt(vals[i])}
          </text>
        </g>
      ))}
      {serie.map((s, i) => (
        <rect key={s.periodo} x={x(i) - 3} y={P.t} width={6} height={H - P.t - P.b} fill="transparent" onMouseEnter={() => setHov(i)} />
      ))}
      {hov != null && (
        <g className="pointer-events-none">
          <line x1={x(hov)} x2={x(hov)} y1={P.t} y2={H - P.b} stroke="var(--foreground)" strokeDasharray="3 3" />
          <text x={Math.min(W - 90, x(hov) + 6)} y={P.t + 10} fontSize={11} className="fill-foreground">
            {serie[hov].periodo}: {fmt(serie[hov].n)}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ---------- Histograma diario con estadísticos ---------- */
export function Histograma({ hist, d }: { hist: Resumen["histogramaDiario"]; d: Resumen["diario"] }) {
  const W = 600, H = 210, P = { l: 8, r: 8, t: 26, b: 24 };
  const lo = hist[0].desde, hi = hist.at(-1)!.hasta + 1;
  const max = Math.max(1, ...hist.map((b) => b.dias));
  const x = (v: number) => P.l + ((v - lo) / (hi - lo)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  const marcas = [
    { v: d.media, t: `media ${fmt(d.media, 1)}`, c: "var(--accent-2)", dy: 0 },
    { v: d.mediana, t: `mediana ${fmt(d.mediana)}`, c: "var(--accent-3)", dy: 12 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      <rect x={x(d.p25)} y={P.t - 14} width={x(d.p75) - x(d.p25)} height={8} fill="var(--foreground)" opacity={0.15} rx={2} />
      <line x1={x(d.p5)} x2={x(d.p95)} y1={P.t - 10} y2={P.t - 10} stroke="var(--foreground)" opacity={0.4} />
      <text x={x(d.p5)} y={P.t - 16} fontSize={9} textAnchor="middle" className="fill-muted">p5 {d.p5}</text>
      <text x={x(d.p95)} y={P.t - 16} fontSize={9} textAnchor="middle" className="fill-muted">p95 {d.p95}</text>
      {hist.map((b) => (
        <rect key={b.desde} x={x(b.desde) + 1} y={y(b.dias)} width={Math.max(1, x(b.hasta + 1) - x(b.desde) - 2)} height={H - P.b - y(b.dias)} fill={fuego((b.desde - lo) / (hi - lo))} rx={3}>
          <title>{`${b.desde}–${b.hasta} incidentes/día: ${b.dias} días`}</title>
        </rect>
      ))}
      {marcas.map((m) => (
        <g key={m.t}>
          <line x1={x(m.v)} x2={x(m.v)} y1={P.t} y2={H - P.b} stroke={m.c} strokeWidth={2} strokeDasharray="4 3" />
          <text x={x(m.v) + 4} y={P.t + 10 + m.dy} fontSize={10} fill={m.c}>{m.t}</text>
        </g>
      ))}
      {[lo, Math.round((lo + hi) / 2), hi - 1].map((v) => (
        <text key={v} x={x(v)} y={H - 6} fontSize={10} textAnchor="middle" className="fill-muted">{v}</text>
      ))}
    </svg>
  );
}

/* ---------- Curva de Lorenz de las celdas ---------- */
export function Lorenz({ celdas, gini }: { celdas: [number, number, number][]; gini: number | null }) {
  const S = 200;
  const v = celdas.map((c) => c[2]).sort((a, b) => a - b);
  const tot = v.reduce((a, b) => a + b, 0);
  let acc = 0;
  const pts = [`0,${S}`, ...v.map((n, i) => { acc += n; return `${((i + 1) / v.length) * S},${S - (acc / tot) * S}`; })].join(" ");
  return (
    <svg viewBox={`-28 -6 ${S + 36} ${S + 30}`} className="mx-auto h-auto w-full max-w-64">
      <rect x={0} y={0} width={S} height={S} fill="none" stroke="var(--line)" />
      <line x1={0} y1={S} x2={S} y2={0} stroke="var(--muted)" strokeDasharray="4 3" />
      <defs><linearGradient id="lz" x1="0" x2="1"><stop offset="0" stopColor="var(--amber)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
      <polygon points={`${pts} ${S},${S}`} fill="url(#lz)" opacity={0.25} />
      <polyline points={pts} fill="none" stroke="url(#lz)" strokeWidth={3.5} />
      <text x={S / 2} y={S + 16} fontSize={10} textAnchor="middle" className="fill-muted">% de celdas (de menos a más)</text>
      <text x={-16} y={S / 2} fontSize={10} textAnchor="middle" transform={`rotate(-90 -16 ${S / 2})`} className="fill-muted">% de incidentes</text>
      <text x={10} y={18} fontSize={12} className="fill-foreground" fontWeight={700}>Gini {fmt(gini, 2)}</text>
    </svg>
  );
}

/* ---------- Barras horizontales genéricas ---------- */
export function Barras({ items, color = "bg-gradient-to-r from-amber via-accent to-accent-2", sufijo = "" }: { items: { k: string; v: number | null; nota?: string }[]; color?: string; sufijo?: string }) {
  const max = Math.max(1, ...items.map((i) => i.v ?? 0));
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.k} className="grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 text-sm sm:grid-cols-[11rem_1fr_6rem]">
          <span className="truncate" title={i.k}>{i.k}</span>
          <span className="h-3 overflow-hidden rounded-full bg-line">
            <span className={`block h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${((i.v ?? 0) / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums" title={i.nota}>{fmt(i.v, sufijo ? 1 : 0)}{sufijo}</span>
        </li>
      ))}
    </ul>
  );
}
