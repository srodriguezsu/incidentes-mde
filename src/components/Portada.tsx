"use client";

import { useEffect, useMemo, useState } from "react";
import { Contador, fmt, fuego } from "./ui";

type Props = {
  total: number;
  mediaDia: number;
  primerDia: string;
  ultimoDia: string;
  celdas: [number, number, number][];
  muertos: number;
};

/** Portada: mapa de calor de fondo + cifras animadas + contador en vivo al ritmo histórico. */
export function Portada({ total, mediaDia, primerDia, ultimoDia, celdas, muertos }: Props) {
  const minutos = (24 * 60) / mediaDia;
  const [seg, setSeg] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setSeg((Date.now() - t0) / 1000), 1000);
    return () => clearInterval(id);
  }, []);
  const ocurridos = (seg / 86400) * mediaDia;
  const progreso = ((seg / 60) % minutos) / minutos;

  const fondo = useMemo(() => {
    const ord = [...celdas].sort((a, b) => a[2] - b[2]);
    const la = celdas.map((c) => c[0]).sort((a, b) => a - b);
    const lo = celdas.map((c) => c[1]).sort((a, b) => a - b);
    const q = (v: number[], p: number) => v[Math.floor(p * (v.length - 1))];
    const [la0, la1, lo0, lo1] = [q(la, 0.01), q(la, 0.99), q(lo, 0.01), q(lo, 0.99)];
    const max = q(celdas.map((c) => c[2]).sort((a, b) => a - b), 0.98);
    return { ord, la0, la1, lo0, lo1, max };
  }, [celdas]);
  const W = 100, H = ((fondo.la1 - fondo.la0) / (fondo.lo1 - fondo.lo0)) * 100;

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0a12] px-5 py-10 text-[#f6f1ea] shadow-2xl shadow-accent/10 sm:px-10 sm:py-16">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="deriva absolute inset-y-0 right-0 -z-10 h-full w-full opacity-60 sm:w-3/5" aria-hidden>
        <defs>
          <filter id="g"><feGaussianBlur stdDeviation="0.6" /></filter>
          <linearGradient id="vela" x1="0" x2="1"><stop offset="0" stopColor="#0d0a12" /><stop offset="0.5" stopColor="#0d0a12" stopOpacity="0" /></linearGradient>
        </defs>
        <g filter="url(#g)">
          {fondo.ord.map(([la, lo, n]) => {
            const t = Math.sqrt(Math.min(1, n / fondo.max));
            return (
              <circle key={`${la},${lo}`} cx={((lo - fondo.lo0) / (fondo.lo1 - fondo.lo0)) * W} cy={((fondo.la1 - la) / (fondo.la1 - fondo.la0)) * H} r={0.35 + t * 0.6} fill={fuego(t)} opacity={0.2 + 0.8 * t} />
            );
          })}
        </g>
        <rect width={W} height={H} fill="url(#vela)" className="hidden sm:block" />
      </svg>
      <div className="pointer-events-none absolute -left-20 -top-20 -z-10 size-72 rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 size-72 rounded-full bg-accent-2/25 blur-3xl" />

      <div className="relative max-w-2xl">
        <div className="aparecer inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur">
          <span className="pulso size-1.5 rounded-full bg-[#ff4d6d]" /> Datos abiertos · Medellín · MEData
        </div>
        <h1 className="aparecer mt-5 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl" style={{ animationDelay: "80ms" }}>
          ¿Dónde y a qué hora <span className="texto-fuego">chocamos</span> en Medellín?
        </h1>
        <p className="aparecer mt-5 max-w-xl text-base text-white/70 sm:text-lg" style={{ animationDelay: "160ms" }}>
          {fmt(total)} incidentes viales registrados por la Secretaría de Movilidad entre {primerDia} y {ultimoDia}, convertidos en
          mapas, ritmos y patrones.
        </p>

        <div className="aparecer mt-8 grid grid-cols-3 gap-3 sm:gap-6" style={{ animationDelay: "240ms" }}>
          {[
            { v: total, l: "incidentes", d: 0 },
            { v: mediaDia, l: "por día", d: 0 },
            { v: muertos, l: "con muertos", d: 0 },
          ].map((k) => (
            <div key={k.l}>
              <div className="font-display text-2xl font-extrabold sm:text-5xl"><Contador valor={k.v} dec={k.d} duracion={1800} /></div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/50">{k.l}</div>
            </div>
          ))}
        </div>

        <div className="aparecer mt-8 max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" style={{ animationDelay: "320ms" }}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-white/70">Al ritmo histórico, desde que abriste esta página:</span>
            <span className="font-display text-3xl font-extrabold tabular-nums texto-fuego">{fmt(ocurridos, 2)}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber via-accent to-accent-2 transition-[width] duration-1000 ease-linear" style={{ width: `${progreso * 100}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/50">Un incidente cada {fmt(minutos, 0)} minutos en promedio (2014–2020).</div>
        </div>

        <div className="aparecer mt-8 flex flex-wrap gap-3" style={{ animationDelay: "400ms" }}>
          <a href="#hallazgos" className="rounded-full bg-gradient-to-r from-amber via-accent to-accent-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:scale-[1.03]">Ver hallazgos ↓</a>
          <a href="#simulador" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10">Probar el simulador</a>
        </div>
      </div>
    </header>
  );
}
