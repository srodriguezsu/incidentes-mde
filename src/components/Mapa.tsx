"use client";

import { useEffect, useMemo, useState } from "react";
import type { Comuna } from "@/lib/datos";
import { Chips, corto, fmt, hora } from "./ui";

type Props = {
  celdas: [number, number, number][];
  comunas: Comuna[];
  celda: number;
  seleccion: string | null;
  onSeleccion: (c: string | null) => void;
};

const W = 600;

export function Mapa({ celdas, comunas, celda, seleccion, onSeleccion }: Props) {
  const [modo, setModo] = useState<"Densidad" | "Por hora">("Densidad");
  const [h, setH] = useState(7);
  const [play, setPlay] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number; texto: string } | null>(null);

  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setH((x) => (x + 1) % 24), 650);
    return () => clearInterval(t);
  }, [play]);

  const geo = useMemo(() => {
    // Encuadre por percentiles para que celdas aisladas no estiren el mapa.
    const q = (v: number[], p: number) => { const o = [...v].sort((a, b) => a - b); return o[Math.floor(p * (o.length - 1))]; };
    const lats = celdas.map((c) => c[0]);
    const lons = celdas.map((c) => c[1]);
    const [la0, la1] = [q(lats, 0.003) - 2 * celda, q(lats, 0.997) + 2 * celda];
    const [lo0, lo1] = [q(lons, 0.003) - 2 * celda, q(lons, 0.997) + 2 * celda];
    const k = Math.cos((6.25 * Math.PI) / 180);
    const s = W / ((lo1 - lo0) * k);
    const H = (la1 - la0) * s;
    const x = (lon: number) => (lon - lo0) * k * s;
    const y = (lat: number) => (la1 - lat) * s;
    const ordenadas = celdas
      .filter(([la, lo]) => la >= la0 && la <= la1 && lo >= lo0 && lo <= lo1)
      .sort((a, b) => a[2] - b[2]);
    // Escala logarítmica saturada en el percentil 98 para que se vea el contraste.
    const max = Math.log1p(q(celdas.map((c) => c[2]), 0.98) || 1);
    return { H, x, y, lado: celda * s, ordenadas, max, s };
  }, [celdas, celda]);

  const conCentro = comunas.filter((c) => c.centro);
  const maxHora = Math.max(1, ...conCentro.flatMap((c) => c.porHora.map((v) => v ?? 0)));
  const maxTotal = Math.max(1, ...conCentro.map((c) => c.n ?? 0));
  const totalHora = conCentro.reduce((a, c) => a + (c.porHora[h] ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Chips opciones={["Densidad", "Por hora"] as const as unknown as ("Densidad" | "Por hora")[]} valor={modo} onChange={setModo} />
        {modo === "Por hora" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlay((p) => !p)}
              className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-white"
              aria-label={play ? "Pausar" : "Reproducir"}
            >
              {play ? "❚❚ Pausa" : "▶ Reproducir el día"}
            </button>
            <span className="w-20 text-right font-mono text-sm tabular-nums">{hora(h)}</span>
          </div>
        )}
      </div>
      {modo === "Por hora" && (
        <input
          type="range" min={0} max={23} value={h}
          onChange={(e) => { setPlay(false); setH(+e.target.value); }}
          className="mb-3 w-full accent-[var(--accent)]"
          aria-label="Hora del día"
        />
      )}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${geo.H}`} className="h-auto w-full touch-manipulation" onMouseLeave={() => setHover(null)}>
          {geo.ordenadas.map(([la, lo, n]) => (
            <rect
              key={`${la},${lo}`}
              x={geo.x(lo) - geo.lado / 2}
              y={geo.y(la) - geo.lado / 2}
              width={geo.lado + 0.3}
              height={geo.lado + 0.3}
              fill="var(--accent)"
              opacity={modo === "Densidad" ? 0.06 + 0.94 * Math.min(1, Math.log1p(n) / geo.max) : 0.12}
              onMouseMove={modo === "Densidad" ? () => setHover({ x: geo.x(lo), y: geo.y(la), texto: `${fmt(n)} incidentes en esta celda de ~250 m` }) : undefined}
            />
          ))}
          {conCentro.map((c) => {
            const [la, lo] = c.centro!;
            const v = modo === "Por hora" ? (c.porHora[h] ?? 0) / maxHora : (c.n ?? 0) / maxTotal;
            const r = modo === "Por hora" ? 4 + 30 * Math.sqrt(v) : 3 + 6 * Math.sqrt(v);
            const activa = seleccion === c.comuna;
            return (
              <g
                key={c.comuna}
                className="cursor-pointer"
                onClick={() => onSeleccion(activa ? null : c.comuna)}
                onMouseMove={() => setHover({
                  x: geo.x(lo), y: geo.y(la),
                  texto: modo === "Por hora"
                    ? `${c.comuna}: ${fmt(c.porHora[h])} incidentes a las ${hora(h)}`
                    : `${c.comuna}: ${fmt(c.n)} incidentes`,
                })}
              >
                <circle
                  cx={geo.x(lo)} cy={geo.y(la)} r={r}
                  fill={modo === "Por hora" ? "var(--accent)" : "var(--foreground)"}
                  fillOpacity={modo === "Por hora" ? 0.55 : 0.85}
                  stroke={activa ? "var(--accent-3)" : "var(--card)"}
                  strokeWidth={activa ? 3 : 1}
                  style={{ transition: "r 0.5s ease" }}
                />
                {(modo === "Por hora" ? v > 0.35 : true) && (
                  <text
                    x={geo.x(lo)} y={geo.y(la) - r - 3}
                    textAnchor="middle" fontSize={10}
                    className="pointer-events-none fill-foreground"
                    style={{ paintOrder: "stroke", stroke: "var(--card)", strokeWidth: 3 }}
                  >
                    {corto(c.comuna)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 max-w-56 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
            style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / geo.H) * 100}%` }}
          >
            {hover.texto}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {modo === "Densidad"
          ? `Cada cuadro es una celda de ~250 m (${fmt(celdas.length)} celdas). Los puntos son el centro de los incidentes de cada comuna. Toca una comuna para ver su detalle.`
          : `${fmt(totalHora)} incidentes registrados a las ${hora(h)} en todo el periodo. El tamaño del círculo es proporcional al conteo de la comuna a esa hora.`}{" "}
        Se omiten las celdas con menos de 5 incidentes.
      </p>
    </div>
  );
}
