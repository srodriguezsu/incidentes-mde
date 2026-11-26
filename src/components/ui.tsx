"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { fmt } from "@/lib/formato";

export { DIAS, DIAS_LARGO, corto, fmt, fuego, hora, pct } from "@/lib/formato";
import { fuego } from "@/lib/formato";

/** Aparece al entrar en pantalla. */
export function Revelar({ children, className = "", retraso = 0 }: { children: ReactNode; className?: string; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`revelar ${vis ? "visible" : ""} ${className}`} style={{ transitionDelay: `${retraso}ms` }}>
      {children}
    </div>
  );
}

/** Número que cuenta hasta su valor. */
export function Contador({ valor, dec = 0, duracion = 1400, sufijo = "" }: { valor: number; dec?: number; duracion?: number; sufijo?: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const paso = (t: number) => {
        const p = Math.min(1, (t - t0) / duracion);
        setV(valor * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [valor, duracion]);
  return <span ref={ref} className="tabular-nums">{fmt(v, dec)}{sufijo}</span>;
}

const ICONOS: Record<string, ReactNode> = {
  mapa: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  rayo: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  curva: <path d="M3 20h18M4 16c4 0 5-9 8-9s4 6 8 6" />,
  campana: <path d="M3 20h18M5 20c1-6 3-10 7-10s6 4 7 10" />,
  capas: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  brujula: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-4 1 2-5 4-1Z" /></>,
  lista: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  via: <path d="M8 3 5 21M16 3l3 18M12 4v3m0 4v3m0 4v2" />,
  pin: <><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
};

export function Seccion({ id, titulo, subtitulo, icono = "capas", capitulo, children, className = "" }: {
  id?: string; titulo: string; subtitulo?: ReactNode; icono?: keyof typeof ICONOS | string; capitulo?: string; children: ReactNode; className?: string;
}) {
  return (
    <Revelar className={className}>
      <section id={id} className="tarjeta h-full p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber via-accent to-accent-2 text-white shadow-lg shadow-accent/25">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{ICONOS[icono] ?? ICONOS.capas}</svg>
          </span>
          <div className="min-w-0">
            {capitulo && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{capitulo}</div>}
            <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{titulo}</h2>
            {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </Revelar>
  );
}

export function Kpi({ titulo, valor, nota, tono = "text-foreground", children }: { titulo: string; valor: string; nota?: string; tono?: string; children?: ReactNode }) {
  return (
    <div className="tarjeta group overflow-hidden p-4 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-accent/25" />
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{titulo}</div>
      <div className={`mt-1.5 whitespace-nowrap font-display text-xl font-extrabold tabular-nums sm:text-2xl ${tono}`}>{children ?? valor}</div>
      {nota && <div className="mt-1 text-xs text-muted">{nota}</div>}
    </div>
  );
}

export function Chips<T extends string | number>({ opciones, valor, onChange, etiqueta }: {
  opciones: T[]; valor: T; onChange: (v: T) => void; etiqueta?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
            o === valor
              ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-md shadow-accent/30"
              : "border border-line bg-card-solid/60 text-muted hover:border-accent/40 hover:text-foreground"
          }`}
        >
          {etiqueta ? etiqueta(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

export function Leyenda({ desde = "Menos", hasta = "Más" }: { desde?: string; hasta?: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted">
      <span>{desde}</span>
      <span className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(fuego).join(",")})` }} />
      <span>{hasta}</span>
    </div>
  );
}
