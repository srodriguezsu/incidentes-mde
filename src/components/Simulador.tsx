"use client";

import { useMemo, useState } from "react";
import { DIAS_LARGO, corto, fmt, hora } from "./ui";

type Props = { matriz: Record<string, (number | null)[][]>; semanas: number };

/** "¿Qué tan riesgosa es mi franja?": compara comuna × día × hora contra la franja promedio de esa comuna. */
export function Simulador({ matriz, semanas }: Props) {
  const comunas = Object.keys(matriz).sort((a, b) => a.localeCompare(b, "es"));
  const [c, setC] = useState(comunas.includes("La Candelaria") ? "La Candelaria" : comunas[0]);
  const [d, setD] = useState(0);
  const [h, setH] = useState(7);

  const r = useMemo(() => {
    const m = matriz[c];
    const todos = m.flat().map((v) => v ?? 0);
    const prom = todos.reduce((a, b) => a + b, 0) / todos.length;
    const v = m[d][h] ?? 0;
    // Mejor y peor hora del mismo día entre 5 a. m. y 10 p. m. (franjas de desplazamiento habituales)
    const franja = m[d].map((x, i) => ({ i, v: x ?? 0 })).filter((x) => x.i >= 5 && x.i <= 22);
    const mejor = franja.reduce((a, b) => (b.v < a.v ? b : a));
    const peor = franja.reduce((a, b) => (b.v > a.v ? b : a));
    return { v, prom, ratio: prom ? v / prom : 0, mejor, peor, fila: m[d] };
  }, [matriz, c, d, h]);

  const nivel = r.ratio >= 2 ? ["Muy alto", "bg-accent text-white"] : r.ratio >= 1.25 ? ["Alto", "bg-accent/70 text-white"] : r.ratio >= 0.75 ? ["Medio", "bg-line"] : ["Bajo", "bg-accent-3/80 text-white"];
  const maxFila = Math.max(1, ...r.fila.map((x) => x ?? 0));

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-muted">Comuna</span>
          <select value={c} onChange={(e) => setC(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2">
            {comunas.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Día</span>
          <select value={d} onChange={(e) => setD(+e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2">
            {DIAS_LARGO.map((x, i) => <option key={x} value={i}>{x}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Hora de salida: <b className="text-foreground">{hora(h)}</b></span>
          <input type="range" min={0} max={23} value={h} onChange={(e) => setH(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" />
        </label>
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted">Nivel relativo</div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${nivel[1]}`}>{nivel[0]}</span>
        </div>
        <div className="mt-2 text-4xl font-bold tabular-nums">{fmt(r.ratio, 2)}×</div>
        <p className="mt-1 text-sm">
          En <b>{corto(c)}</b>, los {DIAS_LARGO[d]} a las {hora(h)} se registraron <b>{fmt(r.v)}</b> incidentes en{" "}
          {fmt(semanas)} semanas (≈ {fmt(r.v / semanas, 2)} por semana): <b>{fmt(r.ratio, 2)} veces</b> la franja promedio de la comuna.
        </p>
        <div className="mt-3 flex h-16 items-end gap-[2px]" aria-hidden>
          {r.fila.map((x, i) => (
            <button
              key={i}
              onClick={() => setH(i)}
              title={`${hora(i)}: ${fmt(x)}`}
              className={`flex-1 rounded-t-sm ${i === h ? "bg-foreground" : "bg-accent/60"}`}
              style={{ height: `${Math.max(4, ((x ?? 0) / maxFila) * 100)}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Entre 5 a. m. y 10 p. m., la franja más tranquila ese día es <b className="text-foreground">{hora(r.mejor.i)}</b> ({fmt(r.mejor.v)}) y la más
          cargada <b className="text-foreground">{hora(r.peor.i)}</b> ({fmt(r.peor.v)}).
        </p>
        <p className="mt-2 text-[11px] text-muted">
          Es un conteo histórico (2014–2020), no una probabilidad: no hay datos de cuántos vehículos circulan en cada franja.
        </p>
      </div>
    </div>
  );
}
