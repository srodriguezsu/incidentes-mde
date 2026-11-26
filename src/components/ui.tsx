import type { ReactNode } from "react";

export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DIAS_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const fmt = (n: number | null | undefined, dec = 0) =>
  n == null ? "<5" : n.toLocaleString("es-CO", { maximumFractionDigits: dec, minimumFractionDigits: dec });
export const pct = (x: number | null | undefined, dec = 1) => (x == null ? "s. d." : `${fmt(x * 100, dec)} %`);
export const hora = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : "p. m."}`;
export const corto = (c: string) => c.replace("Corregimiento de ", "");

export function Seccion({ id, titulo, subtitulo, children }: { id?: string; titulo: string; subtitulo?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="aparecer rounded-2xl border border-line bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold sm:text-xl">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Kpi({ titulo, valor, nota, tono = "text-foreground" }: { titulo: string; valor: string; nota?: string; tono?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3 sm:p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{titulo}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${tono}`}>{valor}</div>
      {nota && <div className="mt-1 text-xs text-muted">{nota}</div>}
    </div>
  );
}

export function Chips<T extends string | number>({ opciones, valor, onChange, etiqueta }: {
  opciones: T[]; valor: T; onChange: (v: T) => void; etiqueta?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1 text-sm transition ${
            o === valor ? "border-foreground bg-foreground text-background" : "border-line hover:border-muted"
          }`}
        >
          {etiqueta ? etiqueta(o) : String(o)}
        </button>
      ))}
    </div>
  );
}
